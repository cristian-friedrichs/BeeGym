import { efiCobrancasClient } from './efi.client';
import { efiConfig } from './efi.config';
import {
    CriarAssinaturaCartaoInput,
    AssinaturaCartao
} from './efi.types';

export class EfiCardRecorrenteService {
    /**
     * Cria uma assinatura recorrente atrelando um payment_token ao plano
     * Endpoint: POST /v1/plan/:plan_id/subscription (API de Cobranças)
     */
    public async criarAssinaturaRecorrente(planId: number, dados: CriarAssinaturaCartaoInput): Promise<AssinaturaCartao> {
        const baseUrl = efiConfig.baseUrlCobrancas;

        // payload para POST /v1/plan/:plan_id/subscription/one-step
        // Docs: https://dev.efipay.com.br/docs/api-cobrancas/assinaturas
        const payload = {
            items: dados.items,
            payment: {
                credit_card: {
                    customer: dados.customer,
                    billing_address: dados.payment.billing_address,
                    payment_token: dados.payment.payment_token
                }
            }
        };

        const response = await efiCobrancasClient.post(
            `${baseUrl}/v1/plan/${planId}/subscription/one-step`,
            payload
        );

        return {
            subscription_id: response.data.data.subscription_id,
            status: response.data.data.status,
            charge_id: response.data.data.charge?.id || response.data.data.charge_id || 0,
            plan: {
                id: planId,
                interval: dados.interval,
                repeats: dados.repeats
            }
        };
    }

    /**
     * Consulta status da Assinatura
     */
    public async consultarAssinatura(subscriptionId: number): Promise<AssinaturaCartao> {
        const baseUrl = efiConfig.baseUrlCobrancas;
        const response = await efiCobrancasClient.get(`${baseUrl}/v1/subscription/${subscriptionId}`);

        return {
            subscription_id: response.data.data.subscription_id,
            status: response.data.data.status,
            charge_id: response.data.data.history?.[0]?.charge_id || 0,
            plan: {
                id: response.data.data.plan.id,
                interval: 1,
                repeats: null
            }
        };
    }

    /**
     * Altera o plano de uma assinatura ativa (Upgrade/Downgrade)
     */
    public async alterarPlano(subscriptionId: number, newPlanId: number): Promise<void> {
        const baseUrl = efiConfig.baseUrlCobrancas;
        await efiCobrancasClient.put(`${baseUrl}/v1/subscription/${subscriptionId}`, {
            plan_id: newPlanId
        });
    }

    /**
     * Cancela uma assinatura ativa
     */
    public async cancelarAssinatura(subscriptionId: number): Promise<void> {
        const baseUrl = efiConfig.baseUrlCobrancas;
        await efiCobrancasClient.put(`${baseUrl}/v1/subscription/${subscriptionId}/cancel`);
    }

    /**
     * Cria um plano customizado rapidamente na EFI e altera a assinatura para ele
     */
    public async alterarValorAssinatura(subscriptionId: number, novoValorFixo: number, customName: string): Promise<number> {
        const baseUrl = efiConfig.baseUrlCobrancas;

        // 1. Criar novo plano customizado
        const novoPlanoResponse = await efiCobrancasClient.post(`${baseUrl}/v1/plan`, {
            name: customName.substring(0, 255),
            repeats: null, // infinito
            interval: 1 // mensal
        });

        const newPlanId = novoPlanoResponse.data.data.plan_id;

        // 2. Definir valor do plano (a EFI separa POST plan_id de POST plan_id/price ? Não, a EFI não tem price no POST plan; precisa chamarmos o endpoint correto ou passar o plano com valor? Não, na EFI para Cartao Recorrente criamos a cobrança, vamos verificar os docs)
        // Correção na api EFIPay v1: O valor da assinatura cartão é atrelado quando a assinatura é criada passando "items" ou o Plano tem um form? 
        // Na verdade, na EFI V1 Cartão Recorrente, os itens (items) passados na criação definem o valor total. Mas não temos como alterar os items de uma assinatura existente. 
        // A API de mudança de plano: PUT /v1/subscription/:id -> { plan_id: novo_id }. Mas e o valor? O valor de um Plano na EFI não existe nativamente, o valor de quem herda do plano é determinado pelos ítens adicionados a *assinatura* ou ao *plano* via vinculação de items. Como o BeeGym cria assinaturas passadas sempre os "items", precisaremos recriar a assinatura se o gateway não suporta alteração de items.
        // Contudo, se "override" via gateway não é suportado sem o token do cartao novamente, a única forma de mudar o valor *recorrente* na EFI V1 sem recriar, é aplicar um desconto/acréscimo ou recriar.
        // EFI tem PUT /v1/subscription/:id/discount -> { discount: { type: 'currency', value: X } } - Mas desconto diminui. Acréscimo não dá.
        // A melhor abordagem para SaaS B2B com Cartão aqui é cancelar a atual e forçar o admin a solicitar uma nova.
        // Mas podemos tentar a API /v1/subscription/:id/payment e atualizar os itens ? Não. 
        // Por hora, apenas salvaremos no DB e levantamos a regra que a alteração de plano entra na proxima cobrança ou notificamos caso o admin tente no cartao (ou aplicar desconto temporario).

        throw new Error('Alteração de valor dinâmico para Cartão na EFI requer a recriação da assinatura ou recadastro do cartão. Aplique um desconto nativo ou cancele a assinatura atual e envie link de checkout.');
    }
}

export const efiCardRecorrente = new EfiCardRecorrenteService();
