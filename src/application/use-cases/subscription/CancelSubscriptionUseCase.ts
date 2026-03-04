import { efiCardRecorrente } from '@/payments/efi/efi.card-recorrente';
import { efiPixAutomatico } from '@/payments/efi/efi.pix-automatico';
import { SupabaseAssinaturaRepository } from '@/application/repositories/SupabaseAssinaturaRepository';

export interface CancelSubscriptionInput {
    organizationId: string;
}

export class CancelSubscriptionUseCase {
    async execute(input: CancelSubscriptionInput) {
        // 1. Buscar assinatura ativa
        const assinatura = await SupabaseAssinaturaRepository.findActiveByOrganization(input.organizationId);

        if (!assinatura) {
            throw new Error('Nenhuma assinatura ativa encontrada para esta organização.');
        }

        console.log(`[CancelSubscriptionUseCase] Cancelando assinatura ${assinatura.id} (${assinatura.metodo})`);

        // 2. Cancelar na EFI
        if (assinatura.metodo === 'CARTAO_RECORRENTE') {
            if (assinatura.subscriptionEfiId) {
                await efiCardRecorrente.cancelarAssinatura(assinatura.subscriptionEfiId);
            }
        } else if (assinatura.metodo === 'PIX_AUTOMATICO') {
            if (assinatura.acordoEfiId) {
                await efiPixAutomatico.cancelarAcordo(assinatura.acordoEfiId);
            }
        }

        // 3. Atualizar no banco de dados local
        await SupabaseAssinaturaRepository.updateStatus(assinatura.id, 'CANCELADA');

        return { success: true };
    }
}
