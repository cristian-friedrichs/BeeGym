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
            console.error('[EFI Webhook PIX] Não autorizado.');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = JSON.parse(textBody);

        if (payload.pix) {
            try {
                await webhookService.handle(payload, 'PIX');
            } catch (err) {
                console.error('[EFI Webhook PIX] Erro de processamento:', err);
            }
            return NextResponse.json({ received: true }, { status: 200 });
        }

        throw new EfiWebhookValidationError('Payload inexistente ou não-PIX enviado para rota exclusiva /pix');
    } catch (error: any) {
        console.error('[EFI Webhook PIX] Erro geral:', error.message);
        return NextResponse.json({ received: true, error: error.message }, { status: 200 });
    }
}
