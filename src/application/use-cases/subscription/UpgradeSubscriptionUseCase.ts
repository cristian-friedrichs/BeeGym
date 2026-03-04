import { efiCardRecorrente } from '@/payments/efi/efi.card-recorrente';
import { efiPixAutomatico } from '@/payments/efi/efi.pix-automatico';
import { SupabaseAssinaturaRepository } from '@/application/repositories/SupabaseAssinaturaRepository';
import { SupabaseContratanteRepository } from '@/application/repositories/SupabaseContratanteRepository';
import { SupabaseSaasPlanRepository } from '@/application/repositories/SupabaseSaasPlanRepository';

export interface UpgradeSubscriptionInput {
    organizationId: string;
    newPlanTier: string; // 'STARTER', 'PLUS', 'STUDIO', 'PRO', 'ENTERPRISE'
}

export class UpgradeSubscriptionUseCase {
    async execute(input: UpgradeSubscriptionInput) {
        // 1. Buscar assinatura ativa
        const assinatura = await SupabaseAssinaturaRepository.findActiveByOrganization(input.organizationId);
        if (!assinatura) {
            throw new Error('Nenhuma assinatura ativa encontrada para esta organização.');
        }

        // 2. Buscar o novo plano no banco
        const novoPlano = await SupabaseSaasPlanRepository.findByTier(input.newPlanTier);
        if (!novoPlano) {
            throw new Error(`Plano ${input.newPlanTier} não encontrado.`);
        }

        // 3. Atualizar na EFI
        if (assinatura.metodo === 'CARTAO_RECORRENTE') {
            if (!assinatura.subscriptionEfiId) {
                throw new Error('Assinatura sem ID da EFI.');
            }
            // Na EFI sandbox, usamos efi_plan_id_hml
            const efiPlanId = (process.env.NEXT_PUBLIC_EFI_AMBIENTE === 'producao')
                ? novoPlano.efi_plan_id_prd
                : novoPlano.efi_plan_id_hml;

            if (!efiPlanId) {
                throw new Error(`O plano ${input.newPlanTier} não tem ID EFI configurado.`);
            }

            await efiCardRecorrente.alterarPlano(assinatura.subscriptionEfiId, efiPlanId);
        } else if (assinatura.metodo === 'PIX_AUTOMATICO') {
            // Pix Automático não permite troca de plano no mesmo acordo facilmente (alteração de valorRec)
            // Para simplicidade inicial, vamos orientar cancelar e assinar novamente, 
            // ou implementar a alteração de valor se a EFI permitir PATCH /v2/rec/:id com novo valor.
            // Segundo a pesquisa do subagent, PATCH /v2/rec/:id permite revisar a recorrência.
            // Vamos assumir que podemos alterar o valor.
            throw new Error('Alteração de plano para Pix Automático ainda não implementada. Por favor, cancele e assine novamente.');
        }

        // 4. Atualizar no banco de dados local
        await SupabaseAssinaturaRepository.actualizarPlano(
            assinatura.id,
            novoPlano.id,
            Number(novoPlano.price)
        );

        return { success: true };
    }
}
