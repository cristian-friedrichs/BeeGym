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

        // 2. Cancelar no Gateway
        // Com a Kiwify, os cancelamentos devem ser feitos pelo Portal do Cliente da Kiwify
        throw new Error('Para cancelar sua assinatura, por favor acesse o Portal do Cliente Kiwify.');
    }
}
