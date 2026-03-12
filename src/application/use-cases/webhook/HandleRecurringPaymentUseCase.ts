import { SupabaseAssinaturaRepository as assinaturaRepository } from '../../repositories/SupabaseAssinaturaRepository';
import { SupabaseContratanteRepository as contratanteRepository } from '../../repositories/SupabaseContratanteRepository';
import { SupabaseSaasPlanRepository as planRepository } from '../../repositories/SupabaseSaasPlanRepository';
import { MetodoPagamento } from '@/payments/efi/efi.types';
import { efiPixAutomatico } from '@/payments/efi/efi.pix-automatico';
import { efiCardRecorrente } from '@/payments/efi/efi.card-recorrente';

export class HandleRecurringPaymentUseCase {
    /**
     * Chamado pelos Webhooks quando o débito automático mensal (Pix)
     * ou o reprocessamento do Cartão de Crédito é liquidado.
     */
    async execute(input: {
        referenceId: string; // charge_id (Cartão) ou acordoId (Pix) dependendo da implementação
        status: string;
        metodo: MetodoPagamento;
    }): Promise<void> {

        // Encontrar a assinatura real no Supabase
        const assinatura = await assinaturaRepository.findByReferenceId(
            input.referenceId,
            input.metodo
        );

        if (!assinatura) {
            console.warn(`[Recurring-Payment] Assinatura para ReferenceID ${input.referenceId} não encontrada no banco.`);
            return;
        }

        const statusNormalizado = this.normalizarStatus(input.status, input.metodo);

        if (statusNormalizado === 'PAGO') {
            // 1. Atualizar status e renovar data de cobrança
            const novaData = new Date();
            novaData.setMonth(novaData.getMonth() + 1);
            novaData.setDate(Math.min(assinatura.diaVencimento, 28));

            await assinaturaRepository.renovar(assinatura.id, novaData);

            // 2. Incrementar contador de cobranças (para controle de promoção)
            const { promoExpired } = await assinaturaRepository.incrementarCobranca(assinatura.id);

            if (promoExpired && assinatura.saasPlanId) {
                console.info(`[Recurring-Payment] Promoção expirou para assinatura ${assinatura.id}. Voltando ao preço original.`);

                try {
                    const planoOriginal = await planRepository.findById(assinatura.saasPlanId);
                    if (planoOriginal) {
                        // Atualizar no gateway
                        if (assinatura.metodo === 'PIX_AUTOMATICO' && assinatura.acordoEfiId) {
                            await efiPixAutomatico.alterarValorAcordo(assinatura.acordoEfiId, planoOriginal.price);
                        } else if (assinatura.metodo === 'CARTAO_RECORRENTE' && assinatura.subscriptionEfiId) {
                            await efiCardRecorrente.removerDesconto(assinatura.subscriptionEfiId);
                        }

                        // Atualizar no banco (valor_mensal volta ao normal)
                        await assinaturaRepository.actualizarPlano(assinatura.id, planoOriginal.id, planoOriginal.price);
                    }
                } catch (efiError: any) {
                    console.error(`[Recurring-Payment] Erro ao reverter promoção na EFI para assinatura ${assinatura.id}:`, efiError.message);
                }
            }

            // Registrar cobrança no histórico PAGO
            await assinaturaRepository.registrarCobranca(assinatura.id, assinatura.contratanteId, input.referenceId, assinatura.valorMensal, 'PAGO', input.metodo);

            // 3. Garantir acesso desbloqueado
            await contratanteRepository.liberarAcesso(assinatura.contratanteId);

            return;
        }

        if (statusNormalizado === 'FALHA') {
            console.warn(`[Recurring-Payment] Falha no pagamento da assinatura ${assinatura.id}. Iniciando inadimplência.`);
            await assinaturaRepository.updateStatus(assinatura.id, 'INADIMPLENTE');
            await assinaturaRepository.setInicioCarencia(assinatura.id, new Date());

            // Registrar cobrança no histórico FALHA
            await assinaturaRepository.registrarCobranca(assinatura.id, assinatura.contratanteId, input.referenceId, assinatura.valorMensal, 'FALHA', input.metodo);

            // TODO: Notificar usuário (email/whatsapp)
        }
    }

    private normalizarStatus(status: string, metodo: MetodoPagamento): 'PAGO' | 'FALHA' | 'OUTRO' {
        if (metodo === 'PIX_AUTOMATICO') {
            return status === 'CONCLUIDA' ? 'PAGO' : status === 'FALHA' ? 'FALHA' : 'OUTRO';
        }
        if (metodo === 'CARTAO_RECORRENTE') {
            return status === 'paid' ? 'PAGO' : (status === 'failed' || status === 'unpaid') ? 'FALHA' : 'OUTRO';
        }
        return 'OUTRO';
    }
}
