import { NextRequest, NextResponse } from 'next/server';
import { HandleRecurringPaymentUseCase } from '@/application/use-cases/webhook/HandleRecurringPaymentUseCase';
import { efiClient } from '@/payments/efi/efi.client';
import { efiConfig } from '@/payments/efi/efi.config';
import { validateWebhookSignature } from '@/lib/webhook-validation';

const recurringPaymentUseCase = new HandleRecurringPaymentUseCase();

export async function POST(request: NextRequest) {
    try {
        const signature = request.headers.get('x-webhook-signature');
        const webhookSecret = process.env.EFI_WEBHOOK_CARD_RECORRENTE_SECRET;

        const textBody = await request.text();

        if (!validateWebhookSignature(textBody, signature, webhookSecret)) {
            console.error('[Webhook Card Rec.] Assinatura inválida');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const payload = JSON.parse(textBody);

        // A EFI envia um "notification" token — precisamos buscar os detalhes reais via GET
        if (payload.notification) {
            const notificationToken: string = payload.notification;
            // Buscar detalhes reais da notificação na API de Cobranças da EFI
            const baseUrl = efiConfig.baseUrlCobrancas;
            const response = await efiClient.get(`${baseUrl}/v1/notification/${notificationToken}`);

            const historyList: any[] = response.data?.data || [];

            if (!Array.isArray(historyList)) {
                console.warn('[Webhook Card Rec.] Resposta inesperada da EFI:', JSON.stringify(response.data).substring(0, 200));
                return NextResponse.json({ received: true }, { status: 200 });
            }

            for (const nota of historyList) {
                // Filtrar apenas eventos de Assinatura Recorrente
                if (nota.type !== 'subscription' && !nota.subscription_id) continue;

                const chargeId = String(nota.charge_id || nota.id || '');
                const status: string = nota.status || '';

                if (!chargeId) {
                    console.warn('[Webhook Card Rec.] Evento sem charge_id, ignorando.');
                    continue;
                }

                await recurringPaymentUseCase.execute({
                    referenceId: chargeId,
                    metodo: 'CARTAO_RECORRENTE',
                    status,
                }).catch(err => {
                    console.error(`[Webhook Card Rec.] Erro ao processar charge ${chargeId}:`, err.message);
                });
            }

            return NextResponse.json({ received: true }, { status: 200 });
        }

        // Fallback: Alguns integradores enviam o payload completo diretamente (sem notification token)
        if (payload.data && Array.isArray(payload.data)) {
            for (const item of payload.data) {
                const subscriptionId = item.subscription_id;
                const chargeId = String(item.charge_id || '');
                const status: string = item.status || '';

                if (!chargeId && !subscriptionId) continue;

                await recurringPaymentUseCase.execute({
                    referenceId: chargeId || String(subscriptionId),
                    metodo: 'CARTAO_RECORRENTE',
                    status,
                }).catch(err => {
                    console.error(`[Webhook Card Rec.] Erro no fallback:`, err.message);
                });
            }

            return NextResponse.json({ received: true }, { status: 200 });
        }

        console.warn('[Webhook Card Rec.] Payload desconhecido, ignorando:', JSON.stringify(payload).substring(0, 100));
        return NextResponse.json({ received: true }, { status: 200 });

    } catch (error: any) {
        console.error('[Webhook Card Rec.] Erro fatal:', error.message, error.stack);
        return NextResponse.json({ error: 'Erro interno no processamento do webhook' }, { status: 400 });
    }
}
