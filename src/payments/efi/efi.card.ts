import { efiClient } from './efi.client';
import { efiConfig } from './efi.config';
import {
    CriarCartaoInput,
    CartaoCobranca
} from './efi.types';

export class EfiCardService {
    /**
     * O endpoint de Cartão (Cobranças) usa um subdomínio diferente do PIX
     */
    private getBaseUrl() {
        return efiConfig.baseUrlPix.replace('pix', 'cobrancas');
    }

    /**
     * Fluxo oficial EFI v1 para Cartão:
     * 1. Criar transação (charge)
     * 2. Pagar transação via método credit_card
     */
    public async criarCobrancaCartao(dados: CriarCartaoInput): Promise<CartaoCobranca> {
        const baseUrl = this.getBaseUrl();

        // ✅ Validação PCI obrigatória — deve existir ANTES de qualquer chamada
        if (!dados.payment_token || dados.payment_token.trim() === '') {
            throw new Error('O token de pagamento (payment_token) é obrigatório e não pode ser vazio para transações de cartão de crédito. Deve ser gerado pelo JS SDK da EFI no frontend.');
        }

        // Passo 1: Criar Cobrança (Charge) vazia associada aos itens
        const chargeResponse = await efiClient.post(`${baseUrl}/v1/charge`, {
            items: dados.items,
            metadata: dados.message ? { custom_id: dados.message } : undefined
        });

        const chargeId = chargeResponse.data.data.charge_id;

        // Passo 2: Executar o pagamento via tokenizado de Cartão de Crédito
        const payResponse = await efiClient.post(`${baseUrl}/v1/charge/${chargeId}/pay`, {
            payment: {
                credit_card: {
                    installments: dados.installments || 1,
                    billing_address: dados.billing_address,
                    payment_token: dados.payment_token,
                    customer: dados.customer
                }
            }
        });

        return payResponse.data as CartaoCobranca;
    }

    /**
     * Consultar dados de uma cobrança em Cartão
     */
    public async consultarCobranca(chargeId: number): Promise<CartaoCobranca> {
        const baseUrl = this.getBaseUrl();
        const response = await efiClient.get(`${baseUrl}/v1/charge/${chargeId}`);
        return response.data as CartaoCobranca;
    }

    /**
     * Cancelar uma cobrança ativa (somente possível em status específicos como waiting/new)
     */
    public async cancelarCobranca(chargeId: number): Promise<void> {
        const baseUrl = this.getBaseUrl();
        await efiClient.put(`${baseUrl}/v1/charge/${chargeId}/cancel`);
    }
}

// Singleton export
export const efiCard = new EfiCardService();
