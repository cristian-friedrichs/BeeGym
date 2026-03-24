import crypto from 'crypto';
import { EFI_AMBIENTE } from '@/lib/env-config';

export function validateWebhookSignature(
    body: string,
    signature: string | null,
    secret: string | undefined
): boolean {
    if (!secret) {
        console.warn('[Webhook] Secret não configurado - permitindo request (apenas mTLS)');
        return true;
    }

    if (!signature) {
        console.error('[Webhook] Assinatura ausente');
        return false;
    }

    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');

    try {
        const isValid = crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
        
        if (!isValid) {
            console.error('[Webhook] Assinatura inválida');
        }
        
        return isValid;
    } catch (err) {
        console.error('[Webhook] Erro ao validar assinatura:', err);
        return false;
    }
}

export function getWebhookSecret(envPrefix: string): string | undefined {
    if (EFI_AMBIENTE === 'producao') {
        return process.env[`${envPrefix}_PRD`];
    }
    return process.env[`${envPrefix}_HML`];
}

