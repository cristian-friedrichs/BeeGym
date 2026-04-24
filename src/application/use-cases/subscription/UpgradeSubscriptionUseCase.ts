import { SupabaseAssinaturaRepository } from '@/application/repositories/SupabaseAssinaturaRepository';
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

        // 3. Atualizar no Gateway
        // Com a Kiwify, os upgrades devem ser feitos através do checkout de upgrade ou portal do cliente.
        // O webhook da Kiwify cuidará de atualizar o banco de dados.
        throw new Error('Para alterar seu plano, por favor acesse o Portal do Cliente Kiwify ou adquira o novo plano através da nossa página de checkout.');
    }
}
