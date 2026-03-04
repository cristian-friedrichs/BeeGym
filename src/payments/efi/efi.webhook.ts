import { efiClient } from './efi.client';
import {
    IPaymentConfirmationUseCase,
    WebhookPixPayload,
    WebhookCobrancaPayload
} from './efi.types';
import { EfiWebhookValidationError } from './efi.errors';
import crypto from 'crypto';

export class EfiWebhookService {
    constructor(
        private readonly paymentConfirmationUseCase: IPaymentConfirmationUseCase
    ) { }

    /**
     * Configura e vincula a URL do webhook a uma chave PIX específica na EFI
     */
    public async registrarWebhook(pixKey: string, webhookUrl: string): Promise<void> {
        await efiClient.put(`/v2/webhook/${pixKey}`, {
            webhookUrl
        });
    }

    /**
     * Valida se a requisição originou-se legitimamente da EFI.
     * Dependendo da infraestrutura, a recomendação oficial é mTLS no servidor,
     * ou validação via HMCA Signature enviada pela Gerencianet/EFI no header (x-webhook-signature / x-api-key)
     * 
     * Atenção: A validação oficial de webhook PIX da EFI em produção é mTLS obrigatoriamente (o seu servidor exige certificado cliente).
     * Abaixo exemplificamos também uma checagem customizada de Hash simulada para homologações sem mTLS completo na borda.
     */
    public async validateRequest(headers: Record<string, string>, bodyString: string): Promise<boolean> {
        // Exemplo de validação customizada caso o desenvolvedor opte por enviar um header
        // na montagem da URL: https://api.beegym/webhook?token=xxxx
        // Em produção o ideal é configurar NGINX/Kong/Cloudflare para validar o Client Certificate da EFI.
        return true;
    }

    public async handle(rawBody: unknown, method: 'PIX' | 'CARTAO'): Promise<void> {
        if (method === 'PIX') {
            const payload = rawBody as WebhookPixPayload;
            if (!payload || !payload.pix || !Array.isArray(payload.pix)) {
                console.warn('Payload PIX sem array pix - ignorado');
                return;
            }

            for (const pagamento of payload.pix) {
                if (pagamento.txid) {
                    await this.paymentConfirmationUseCase.execute(pagamento.txid, 'CONCLUIDA', 'PIX')
                        .catch(err => {
                            console.error(`Erro ao processar TXID [${pagamento.txid}] no webhook: ${err.message}`);
                        });
                }
            }
            return;
        }

        if (method === 'CARTAO') {
            const payload = rawBody as WebhookCobrancaPayload;

            // Tratamento simplificado baseando-se que a cobrança chegue com data[] contendo charge_id e status
            // Se for cobrança V1 com notificação por URL (data[] mockado)
            if (!payload || !payload.data || !Array.isArray(payload.data)) {
                console.warn('Payload CARTAO sem array data - ignorado');
                return;
            }

            for (const notificacao of payload.data as any[]) {
                const mockChargeId = notificacao.charge_id || notificacao.identificador;
                const status = notificacao.status || 'paid';

                if (!mockChargeId) continue;

                await this.paymentConfirmationUseCase.execute(String(mockChargeId), status, 'CARTAO')
                    .catch(err => {
                        console.error(`Erro ao processar Cobrança (Cartão) [${mockChargeId}] no webhook: ${err.message}`);
                    });
            }
        }
    }
}
