import { SupabaseAssinaturaRepository as assinaturaRepository } from '../../repositories/SupabaseAssinaturaRepository';
import { SupabaseContratanteRepository as contratanteRepository } from '../../repositories/SupabaseContratanteRepository';
import { efiPixAutomatico } from '@/payments/efi/efi.pix-automatico';
import { efiCardRecorrente } from '@/payments/efi/efi.card-recorrente';
import { efiConfig } from '@/payments/efi/efi.config';
import { MetodoPagamento } from '@/payments/efi/efi.types';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Calcula a data do próximo mês no dia de vencimento fornecido.
 */
function proximoMesNoDia(diaVencimento: number): Date {
    const data = new Date();
    data.setMonth(data.getMonth() + 1);
    data.setDate(Math.min(diaVencimento, 28));
    return data;
}

export class CreateSubscriptionUseCase {
    /**
     * Fluxo completo para adesão do cliente ao serviço (Pix ou Cartão)
     */
    async execute(input: {
        contratanteId: string;
        planoId: string; // UUID do saas_plans
        metodo: MetodoPagamento;
        devedorCpf?: string;
        devedorNome?: string;
        paymentToken?: string;
        billingAddress?: any;
        customerData?: any;
        couponId?: string;
    }): Promise<{
        urlConsentimento?: string;
        pixCopiaECola?: string;
        acessoLiberado?: boolean;
        assinaturaId: string;
        statusEfi?: string;
    }> {
        // Buscar contratante real do Supabase
        const contratante = await contratanteRepository.findById(input.contratanteId);

        // Buscar plano real do Supabase
        const { data: plano, error: planoError } = await supabaseAdmin
            .from('saas_plans')
            .select('*')
            .eq('id', input.planoId)
            .eq('active', true)
            .single();

        if (planoError || !plano) {
            throw new Error(`Plano ${input.planoId} não encontrado ou inativo.`);
        }

        let valorMensal = Number(plano.price);
        const diaVencimento = Math.min(new Date().getDate(), 28);

        // Promoção nativa do plano
        let promoPrice = (plano as any).promo_price ? Number((plano as any).promo_price) : null;
        let promoMonths = (plano as any).promo_months ? Number((plano as any).promo_months) : 0;

        let manualDiscountAmount = undefined;
        let manualDiscountPercentage = undefined;
        let couponDuration = undefined;

        let baseDiscountPrice = promoPrice !== null ? promoPrice : valorMensal;
        let finalPrice = baseDiscountPrice;

        // Apply Coupon if provided
        if (input.couponId) {
            const { SupabaseCouponRepository } = await import('@/application/repositories/SupabaseCouponRepository');
            const coupon = await SupabaseCouponRepository.findById(input.couponId);
            if (coupon && coupon.is_active) {
                if (coupon.discount_type === 'PERCENTAGE') {
                    manualDiscountPercentage = coupon.discount_value;
                    finalPrice = Math.max(0, baseDiscountPrice * (1 - (coupon.discount_value / 100)));
                } else if (coupon.discount_type === 'FIXED_AMOUNT') {
                    manualDiscountAmount = coupon.discount_value;
                    finalPrice = Math.max(0, baseDiscountPrice - coupon.discount_value);
                } else if (coupon.discount_type === 'FREE_MONTHS') {
                    finalPrice = 0;
                }
                couponDuration = coupon.duration_months;
            }
        }

        // absoluteDiscountValue represents the DIFFERENCE between original `valorMensal` and `finalPrice`
        const absoluteDiscountValue = Math.max(0, valorMensal - finalPrice);
        const valorTotalPlanoCents = Math.round(valorMensal * 100);

        // ---------
        // PIX AUTOMÁTICO
        // ---------
        if (input.metodo === 'PIX_AUTOMATICO') {
            if (!input.devedorCpf || !input.devedorNome) {
                throw new Error('CPF e Nome do devedor são obrigatórios para Acordo Pix.');
            }

            const acordo = await efiPixAutomatico.criarAcordo({
                devedor: { cpf: input.devedorCpf, nome: input.devedorNome },
                valor: { fixo: valorMensal.toFixed(2) },
                valorPromo: absoluteDiscountValue > 0 ? finalPrice.toFixed(2) : undefined,
                descricao: `Assinatura BeeGym — ${plano.name}`,
                chave: efiConfig.chavePixAutomatico || '',
                recorrencia: { tipo: 'MENSAL', diaVencimento },
                urlRetorno: `${process.env.APP_URL}/assinatura/retorno`,
            });

            const assinatura = await assinaturaRepository.create({
                contratanteId: contratante.id,
                saasPlanId: plano.id,
                planoId: plano.id,
                metodo: 'PIX_AUTOMATICO',
                status: 'PENDENTE',
                acordoEfiId: acordo.acordoId,
                diaVencimento,
                valorMensal,
                promoPrice: absoluteDiscountValue > 0 ? finalPrice : undefined,
                promoMonthsRemaining: couponDuration !== undefined ? (couponDuration ?? undefined) : (promoMonths || undefined),
                couponId: input.couponId,
                manualDiscountAmount,
                manualDiscountPercentage
            });

            return {
                urlConsentimento: acordo.urlConsentimento,
                pixCopiaECola: acordo.pixCopiaECola,
                assinaturaId: assinatura.id
            };
        }

        // ---------
        // CARTÃO RECORRENTE
        // ---------
        if (input.metodo === 'CARTAO_RECORRENTE') {
            if (!input.paymentToken || !input.billingAddress || !input.customerData) {
                throw new Error('Token Cartão e Endereço são obrigatórios para fluxo de Cartão.');
            }

            const isProd = efiConfig.ambiente === 'producao';
            const efiPlanId = isProd ? plano.efi_plan_id_prd : plano.efi_plan_id_hml;

            if (!efiPlanId) {
                throw new Error(`Plano '${plano.name}' não tem efi_plan_id configurado para ${efiConfig.ambiente}.`);
            }

            const discountPayload = absoluteDiscountValue > 0 ? {
                type: 'currency' as const,
                value: Math.round(absoluteDiscountValue * 100)
            } : undefined;

            const assinaturaEfi = await efiCardRecorrente.criarAssinaturaRecorrente(efiPlanId, {
                items: [{ name: plano.name || 'BeeGym', value: valorTotalPlanoCents, amount: 1 }],
                customer: input.customerData,
                payment: {
                    payment_token: input.paymentToken!,
                    billing_address: input.billingAddress,
                },
                discount: discountPayload,
                repeats: null,
                interval: 1,
            });

            // Status inicial da assinatura na EFI
            // active: aprovado imediatamente
            // waiting: em análise manual ou aguardando processamento
            const statusEfi = assinaturaEfi.status;
            const isApproved = statusEfi === 'active';

            const assinatura = await assinaturaRepository.create({
                contratanteId: contratante.id,
                saasPlanId: plano.id,
                planoId: plano.id,
                metodo: 'CARTAO_RECORRENTE',
                status: isApproved ? 'ATIVO' : 'PENDENTE', // ← Mudança: só entra como ATIVO se aprovado
                subscriptionEfiId: assinaturaEfi.subscription_id,
                diaVencimento,
                valorMensal,
                promoPrice: absoluteDiscountValue > 0 ? finalPrice : undefined,
                promoMonthsRemaining: couponDuration !== undefined ? (couponDuration ?? undefined) : (promoMonths || undefined),
                proximoVencimento: proximoMesNoDia(diaVencimento),
                couponId: input.couponId,
                manualDiscountAmount,
                manualDiscountPercentage
            });

            // SÓ libera o acesso se estiver aprovado (active)
            if (isApproved) {
                await contratanteRepository.liberarAcesso(contratante.id);
            }

            return {
                acessoLiberado: isApproved,
                statusEfi,
                assinaturaId: assinatura.id
            };
        }

        throw new Error(`Método de pagamento não suportado.`);
    }
}
