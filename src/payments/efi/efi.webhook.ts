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
     * A EFI envia um HMAC-SHA256 signature no header x-api-key ou x-webhook-signature.
     * A validação é feita calculando o HMAC do body com a chave secreta do webhook.
     */
    public async validateRequest(headers: Record<string, string>, bodyString: string): Promise<boolean> {
        const signature = headers['x-webhook-signature'] || headers['x-api-key'];
        const webhookSecret = process.env.EFI_WEBHOOK_SECRET;

        if (!webhookSecret) {
            console.warn('[EFI Webhook] EFI_WEBHOOK_SECRET não configurado - validando apenas mTLS.');
            return true;
        }

        if (!signature) {
            console.error('[EFI Webhook] Header de assinatura ausente.');
            return false;
        }

        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(bodyString)
            .digest('hex');

        const isValid = crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );

        if (!isValid) {
            console.error('[EFI Webhook] Assinatura HMAC inválida. Request rejeitado.');
        }

        return isValid;
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
