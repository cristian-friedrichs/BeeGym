import { supabaseAdmin } from '@/lib/supabase/admin';
import { AssinaturaStatus, MetodoPagamento } from '@/payments/efi/efi.types';

export interface Assinatura {
    id: string;
    contratanteId: string;
    planoId: string;
    saasPlanId?: string;
    metodo: MetodoPagamento;
    status: AssinaturaStatus;
    acordoEfiId?: string;
    subscriptionEfiId?: number;
    diaVencimento: number;
    valorMensal: number;
    proximoVencimento?: Date;
    inicioCarencia?: Date;
    promoPrice?: number;
    promoMonthsRemaining?: number;
    cobrancasPagas?: number;
    couponId?: string;
    manualPriceOverride?: number;
    manualDiscountAmount?: number;
    manualDiscountPercentage?: number;
}

export const SupabaseAssinaturaRepository = {
    async create(data: Partial<Assinatura>): Promise<Assinatura> {
        const { data: sub, error } = await supabaseAdmin
            .from('saas_subscriptions')
            .insert({
                organization_id: data.contratanteId,
                saas_plan_id: data.saasPlanId || data.planoId,
                status: data.status,
                metodo: data.metodo,
                acordo_efi_id: data.acordoEfiId,
                subscription_efi_id: data.subscriptionEfiId,
                dia_vencimento: data.diaVencimento,
                valor_mensal: data.valorMensal,
                proximo_vencimento: data.proximoVencimento?.toISOString(),
                inicio_carencia: data.inicioCarencia?.toISOString(),
                promo_price: data.promoPrice,
                promo_months_remaining: data.promoMonthsRemaining || 0,
                cobrancas_pagas: 0,
                coupon_id: data.couponId || null,
                manual_price_override: data.manualPriceOverride || null,
                manual_discount_amount: data.manualDiscountAmount || null,
                manual_discount_percentage: data.manualDiscountPercentage || null
            })
            .select()
            .single();

        if (error) {
            console.error('[SupabaseAssinaturaRepository.create] Erro:', error);
            throw new Error('Falha ao criar assinatura no banco de dados: ' + error.message);
        }

        return this.mapToInternal(sub);
    },

    async findByAcordoId(acordoId: string): Promise<Assinatura | null> {
        const { data: sub, error } = await supabaseAdmin
            .from('saas_subscriptions')
            .select('*')
            .eq('acordo_efi_id', acordoId)
            .maybeSingle();

        if (error || !sub) return null;
        return this.mapToInternal(sub);
    },

    async findBySubscriptionEfiId(subscriptionEfiId: number): Promise<Assinatura | null> {
        const { data: sub, error } = await supabaseAdmin
            .from('saas_subscriptions')
            .select('*')
            .eq('subscription_efi_id', subscriptionEfiId)
            .maybeSingle();

        if (error || !sub) return null;
        return this.mapToInternal(sub);
    },

    async findByReferenceId(refId: string, metodo: string): Promise<Assinatura | null> {
        // Cartão: refId é charge_id → buscar por subscription_efi_id ou a subscriptiob ligada ao charge
        // Pix: refId é txid → buscar por acordo_efi_id
        if (metodo === 'CARTAO_RECORRENTE') {
            // O charge_id vem como string, buscar todas assinaturas ativas de cartão
            // e encontrar a certa pelo subscription_efi_id (cenário webhook notification)
            const { data: sub, error } = await supabaseAdmin
                .from('saas_subscriptions')
                .select('*')
                .eq('metodo', 'CARTAO_RECORRENTE')
                .in('status', ['TRIAL', 'ATIVO', 'INADIMPLENTE', 'PENDENTE'])
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error || !sub) return null;
            return this.mapToInternal(sub);
        }

        // PIX_AUTOMATICO: buscar pelo acordo_efi_id
        const { data: sub, error } = await supabaseAdmin
            .from('saas_subscriptions')
            .select('*')
            .eq('acordo_efi_id', refId)
            .maybeSingle();

        if (error || !sub) return null;
        return this.mapToInternal(sub);
    },

    async findActiveByOrganization(orgId: string): Promise<Assinatura | null> {
        const { data: sub, error } = await supabaseAdmin
            .from('saas_subscriptions')
            .select('*')
            .eq('organization_id', orgId)
            .in('status', ['ATIVO', 'TRIAL', 'PENDENTE', 'INADIMPLENTE'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error || !sub) return null;
        return this.mapToInternal(sub);
    },

    async updateStatus(id: string, status: AssinaturaStatus): Promise<boolean> {
        const { error } = await supabaseAdmin
            .from('saas_subscriptions')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            console.error('[SupabaseAssinaturaRepository.updateStatus] Erro:', error);
            return false;
        }

        // Também atualiza o status na organização para redundância
        const { data: sub } = await supabaseAdmin.from('saas_subscriptions').select('organization_id').eq('id', id).single();
        if (sub?.organization_id) {
            await supabaseAdmin.from('organizations').update({
                subscription_status: status.toLowerCase(),
                updated_at: new Date().toISOString()
            }).eq('id', sub.organization_id);
        }

        return true;
    },

    async renovar(id: string, proximoVencimento: Date): Promise<boolean> {
        const { error } = await supabaseAdmin
            .from('saas_subscriptions')
            .update({
                proximo_vencimento: proximoVencimento.toISOString(),
                status: 'ATIVO',
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        return !error;
    },

    async actualizarPlano(
        id: string,
        saasPlanId: string,
        valorMensal: number,
        overrides?: { manualPriceOverride?: number | null, manualDiscountAmount?: number | null, manualDiscountPercentage?: number | null, couponId?: string | null }
    ): Promise<boolean> {

        const updatePayload: any = {
            saas_plan_id: saasPlanId,
            valor_mensal: valorMensal,
            updated_at: new Date().toISOString()
        };

        if (overrides) {
            if (overrides.manualPriceOverride !== undefined) updatePayload.manual_price_override = overrides.manualPriceOverride;
            if (overrides.manualDiscountAmount !== undefined) updatePayload.manual_discount_amount = overrides.manualDiscountAmount;
            if (overrides.manualDiscountPercentage !== undefined) updatePayload.manual_discount_percentage = overrides.manualDiscountPercentage;
            if (overrides.couponId !== undefined) updatePayload.coupon_id = overrides.couponId;
        }

        const { error: subError } = await supabaseAdmin
            .from('saas_subscriptions')
            .update(updatePayload)
            .eq('id', id);

        if (subError) {
            console.error('[SupabaseAssinaturaRepository.actualizarPlano] Erro sub:', subError);
            return false;
        }

        // Sincronizar com a organização
        const { data: sub } = await supabaseAdmin.from('saas_subscriptions').select('organization_id').eq('id', id).single();
        if (sub?.organization_id) {
            await supabaseAdmin.from('organizations').update({
                plan_id: saasPlanId,
                updated_at: new Date().toISOString()
            }).eq('id', sub.organization_id);
        }

        return true;
    },

    async setInicioCarencia(id: string, data: Date): Promise<boolean> {
        const { error } = await supabaseAdmin
            .from('saas_subscriptions')
            .update({
                inicio_carencia: data.toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', id);
        return !error;
    },

    async findInGracePeriod(): Promise<Assinatura[]> {
        const { data, error } = await supabaseAdmin
            .from('saas_subscriptions')
            .select('*')
            .not('inicio_carencia', 'is', null)
            .eq('status', 'INADIMPLENTE');

        if (error || !data) return [];
        return data.map(sub => this.mapToInternal(sub));
    },

    /**
     * Incrementa o contador de cobranças pagas e decrementa meses promo restantes.
     * Retorna true se a promoção acabou nesta cobrança (transição de preço).
     */
    async incrementarCobranca(id: string): Promise<{ promoExpired: boolean }> {
        const { data: sub } = await (supabaseAdmin
            .from('saas_subscriptions') as any)
            .select('cobrancas_pagas, promo_months_remaining')
            .eq('id', id)
            .single();

        if (!sub) return { promoExpired: false };

        const novasCobrancas = (sub.cobrancas_pagas || 0) + 1;
        const novoPromo = Math.max((sub.promo_months_remaining || 0) - 1, 0);
        const promoExpired = sub.promo_months_remaining > 0 && novoPromo === 0;

        await (supabaseAdmin
            .from('saas_subscriptions') as any)
            .update({
                cobrancas_pagas: novasCobrancas,
                promo_months_remaining: novoPromo,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        return { promoExpired };
    },

    /**
     * Registra uma cobrança na tabela de histórico saas_charges.
     */
    async registrarCobranca(assinaturaId: string, contratanteId: string, chargeEfiId: string, amount: number, status: 'PAGO' | 'FALHA' | 'PENDENTE', method: MetodoPagamento): Promise<void> {
        await supabaseAdmin.from('saas_charges').insert({
            saas_subscription_id: assinaturaId,
            organization_id: contratanteId,
            charge_efi_id: chargeEfiId,
            amount,
            status,
            payment_method: method,
            paid_at: status === 'PAGO' ? new Date().toISOString() : null
        });
    },

    mapToInternal(dbSub: any): Assinatura {
        return {
            id: dbSub.id,
            contratanteId: dbSub.organization_id,
            planoId: dbSub.saas_plan_id || dbSub.plan_id,
            saasPlanId: dbSub.saas_plan_id,
            metodo: dbSub.metodo as MetodoPagamento,
            status: dbSub.status as AssinaturaStatus,
            acordoEfiId: dbSub.acordo_efi_id,
            subscriptionEfiId: dbSub.subscription_efi_id,
            diaVencimento: dbSub.dia_vencimento,
            valorMensal: Number(dbSub.valor_mensal),
            proximoVencimento: dbSub.proximo_vencimento ? new Date(dbSub.proximo_vencimento) : undefined,
            inicioCarencia: dbSub.inicio_carencia ? new Date(dbSub.inicio_carencia) : undefined,
            promoPrice: dbSub.promo_price ? Number(dbSub.promo_price) : undefined,
            promoMonthsRemaining: dbSub.promo_months_remaining ?? 0,
            cobrancasPagas: dbSub.cobrancas_pagas ?? 0,
            couponId: dbSub.coupon_id,
            manualPriceOverride: dbSub.manual_price_override ? Number(dbSub.manual_price_override) : undefined,
            manualDiscountAmount: dbSub.manual_discount_amount ? Number(dbSub.manual_discount_amount) : undefined,
            manualDiscountPercentage: dbSub.manual_discount_percentage ? Number(dbSub.manual_discount_percentage) : undefined
        };
    }
};
