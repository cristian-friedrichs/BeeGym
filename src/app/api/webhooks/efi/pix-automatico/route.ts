import { NextRequest, NextResponse } from 'next/server';
import { HandlePixAutomaticoConsentUseCase } from '@/application/use-cases/webhook/HandlePixAutomaticoConsentUseCase';
import { HandleRecurringPaymentUseCase } from '@/application/use-cases/webhook/HandleRecurringPaymentUseCase';
import { validateWebhookSignature } from '@/lib/webhook-validation';

const consentUseCase = new HandlePixAutomaticoConsentUseCase();
const paymentUseCase = new HandleRecurringPaymentUseCase();

export async function POST(request: NextRequest) {
    try {
        const signature = request.headers.get('x-webhook-signature');
        const webhookSecret = process.env.EFI_WEBHOOK_PIX_AUTOMATICO_SECRET;

        const textBody = await request.text();

        if (!validateWebhookSignature(textBody, signature, webhookSecret)) {
            console.error('[Webhook Pix Auto] Assinatura inválida');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const payload = JSON.parse(textBody);

        // 1. Eventos de Consentimento do Acordo (usuário autorizou o débito automático no app)
        if (payload.pixAutomatico?.acordos) {
            const acordos: any[] = payload.pixAutomatico.acordos;
            for (const evento of acordos) {
                const { idAcordo, situacao } = evento;
                await consentUseCase.execute(idAcordo, situacao).catch(err => {
                    console.error(`[Webhook Pix Auto] Erro consentimento ${idAcordo}:`, err.message);
                });
            }
            return NextResponse.json({ received: true }, { status: 200 });
        }

        // 2. Eventos de Liquidação Mensal (o débito mensal foi processado)
        if (payload.pix && Array.isArray(payload.pix)) {
            for (const cob of payload.pix) {
                // Só processa itens que pertençam a um acordo de Pix Automático
                if (!cob.idAcordo) continue;

                const status = cob.status || 'CONCLUIDA';
                await paymentUseCase.execute({
                    referenceId: cob.idAcordo, // Busca por acordo_efi_id no banco
                    status,
                    metodo: 'PIX_AUTOMATICO',
                }).catch(err => {
                    console.error(`[Webhook Pix Auto] Erro pagamento ${cob.txid}:`, err.message);
                });
            }
            return NextResponse.json({ received: true }, { status: 200 });
        }

        // Retornar 200 mesmo sem processar, para evitar retry loop da EFI
        console.warn('[Webhook Pix Auto] Payload desconhecido:', JSON.stringify(payload).substring(0, 150));
        return NextResponse.json({ received: true }, { status: 200 });

    } catch (error: any) {
        console.error('[Webhook Pix Auto] Erro fatal:', error.message);
        return NextResponse.json({ error: 'Erro interno no processamento do webhook' }, { status: 400 });
    }
}
