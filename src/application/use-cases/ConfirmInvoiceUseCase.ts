import { IPaymentConfirmationUseCase } from '@/payments/efi';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Skeleton Implementation para confirmar pagamentos na aplicação BeeGym.
 * 
 * Nesta classe, injetamos dependências de DB (ex: Prisma, Supabase)
 * e executamos a lógica de Idempotência.
 */
export class ConfirmInvoiceUseCase implements IPaymentConfirmationUseCase {

    /**
     * Confirmação principal de pagamento
     * @param txidOrChargeId ID da transação na EFI (Txid para PIX, ChargeId para Cartão)
     * @param status Status recebido ('CONCLUIDA', 'paid', etc)
     * @param method Método de pagamento (PIX ou CARTAO)
     */
    public async execute(txidOrChargeId: string, status: string, method: 'PIX' | 'CARTAO'): Promise<void> {
        console.log(`[ConfirmInvoiceUseCase] Recebido webhook para ${method} | TXID/Charge: ${txidOrChargeId} | Status: ${status}`);

        let sub: any = null;

        const { data: subByPaymentToken, error: subError1 } = await supabaseAdmin
            .from('saas_subscriptions')
            .select('id, organization_id, status, acordo_efi_id')
            .eq('payment_token', txidOrChargeId)
            .single();

        if (subByPaymentToken) {
            sub = subByPaymentToken;
        } else {
            const { data: subByAcordo, error: subError2 } = await supabaseAdmin
                .from('saas_subscriptions')
                .select('id, organization_id, status, acordo_efi_id')
                .eq('acordo_efi_id', txidOrChargeId)
                .single();

            if (subByAcordo) {
                sub = subByAcordo;
            } else {
                console.error(`[ConfirmInvoiceUseCase] Fatura não encontrada para TXID/ChargeID: ${txidOrChargeId}`);
                return;
            }
        }

        // Se a assinatura já está ativa ou paga, idempotência
        if (sub.status === 'trial' || sub.status === 'active') {
            console.log(`[ConfirmInvoiceUseCase] Fatura ${txidOrChargeId} já consta como ${sub.status}. Ignorando atualização.`);
            return;
        }

        // Considera o pagamento como sucesso
        if (status === 'CONCLUIDA' || status === 'paid' || status === 'approved' || status === 'settled') {
            const trialEnd = new Date();
            trialEnd.setDate(trialEnd.getDate() + 7);
            
            // 1. Atualizar saas_subscriptions
            const { error: updateSubError } = await supabaseAdmin
                .from('saas_subscriptions')
                .update({ 
                    status: 'trial', 
                    updated_at: new Date().toISOString() 
                })
                .eq('id', sub.id);

            if (updateSubError) {
                console.error(`[ConfirmInvoiceUseCase] Erro ao atualizar saas_subscriptions: ${updateSubError.message}`);
                throw updateSubError;
            }

            // 2. Atualizar organizations
            if (sub.organization_id) {
                const { error: updateOrgError } = await supabaseAdmin
                    .from('organizations')
                    .update({ 
                        subscription_status: 'trial', 
                        trial_end: trialEnd.toISOString(),
                        onboarding_completed: true,
                        updated_at: new Date().toISOString() 
                    })
                    .eq('id', sub.organization_id);

                if (updateOrgError) {
                    console.error(`[ConfirmInvoiceUseCase] Erro ao atualizar organizations: ${updateOrgError.message}`);
                    throw updateOrgError;
                }

                // 3. Atualizar profiles atrelados (garante que todos logados fiquem ativos)
                await supabaseAdmin
                    .from('profiles')
                    .update({ status: 'active' })
                    .eq('organization_id', sub.organization_id);
            }

            console.log(`[ConfirmInvoiceUseCase] Assinatura ${sub.id} ativada como TRIAL com sucesso via ${method}!`);
        } else {
            console.log(`[ConfirmInvoiceUseCase] Status ${status} não requer ativação para a assinatura ${sub.id}.`);
        }
    }
}
