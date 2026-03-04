import { NextRequest, NextResponse } from 'next/server';
import { EfiWebhookService } from '@/payments/efi/efi.webhook';
import { ConfirmInvoiceUseCase } from '@/application/use-cases/ConfirmInvoiceUseCase';
import { EfiWebhookValidationError } from '@/payments/efi/efi.errors';

export async function POST(request: NextRequest) {
    try {
        const confirmInvoiceUseCase = new ConfirmInvoiceUseCase();
        const webhookService = new EfiWebhookService(confirmInvoiceUseCase);

        const headersList: Record<string, string> = {};
        request.headers.forEach((value, key) => {
            headersList[key.toLowerCase()] = value;
        });

        const textBody = await request.text();

        const isValid = await webhookService.validateRequest(headersList, textBody);
        if (!isValid) {
            console.error('[EFI Webhook CHARGE] Não autorizado.');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = JSON.parse(textBody);

        // O Cobranças Webhook v1 raiz costuma ter `data` contendo as notificações
        if (payload.data && Array.isArray(payload.data)) {
            webhookService.handle(payload, 'CARTAO').catch((err) => {
                console.error('[EFI Webhook CHARGE] Erro de background:', err);
            });
            return NextResponse.json({ received: true }, { status: 200 });
        }

        throw new EfiWebhookValidationError('Payload inexistente ou inválido enviado para rota exclusiva /charge');
    } catch (error: any) {
        console.error('[EFI Webhook CHARGE] Erro geral:', error.message);
        return NextResponse.json({ received: true, error: error.message }, { status: 200 });
    }
}
