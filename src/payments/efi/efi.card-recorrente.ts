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

        if (dados.discount) {
            // Fluxo 3 Passos para suportar Desconto Nativo
            // 1. Criar assinatura
            const subPayload = { items: dados.items };
            const subRes = await efiCobrancasClient.post(`${baseUrl}/v1/plan/${planId}/subscription`, subPayload);
            const subId = subRes.data.data.subscription_id;

            // 2. Aplicar desconto
            await efiCobrancasClient.put(`${baseUrl}/v1/subscription/${subId}/discount`, {
                discount: dados.discount
            });

            // 3. Pagar assinatura vinculando cartão
            const payPayload = {
                payment: {
                    credit_card: {
                        customer: dados.customer,
                        billing_address: dados.payment.billing_address,
                        payment_token: dados.payment.payment_token
                    }
                }
            };
            const payRes = await efiCobrancasClient.post(`${baseUrl}/v1/subscription/${subId}/pay`, payPayload);

            return {
                subscription_id: subId,
                status: payRes.data.data.status,
                charge_id: payRes.data.data.charge?.id || payRes.data.data.charge_id || 0,
                plan: {
                    id: planId,
                    interval: dados.interval,
                    repeats: dados.repeats
                }
            };
        } else {
            // Fluxo 1 Passo padrão se não houver desconto
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
     * Aplica um desconto a uma assinatura de cartão existente
     */
    public async aplicarDesconto(subscriptionId: number, discount: { type: 'currency' | 'percentage'; value: number }): Promise<void> {
        const baseUrl = efiConfig.baseUrlCobrancas;
        await efiCobrancasClient.put(`${baseUrl}/v1/subscription/${subscriptionId}/discount`, {
            discount
        });
    }

    /**
     * Remove um desconto de uma assinatura de cartão existente
     */
    public async removerDesconto(subscriptionId: number): Promise<void> {
        const baseUrl = efiConfig.baseUrlCobrancas;
        await efiCobrancasClient.delete(`${baseUrl}/v1/subscription/${subscriptionId}/discount`);
    }

    /**
     * Cria um plano customizado rapidamente na EFI e altera a assinatura para ele
     */
    public async alterarValorAssinatura(subscriptionId: number, novoValorFixo: number, customName: string): Promise<number> {
        const baseUrl = efiConfig.baseUrlCobrancas;

        throw new Error('Alteração de valor dinâmico para Cartão na EFI requer a recriação da assinatura ou recadastro do cartão. Aplique um desconto nativo ou cancele a assinatura atual e envie link de checkout.');
    }
}

export const efiCardRecorrente = new EfiCardRecorrenteService();
