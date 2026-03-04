import { IPaymentConfirmationUseCase } from '@/payments/efi';

/**
 * Skeleton Implementation para confirmar pagamentos na aplicação BeeGym.
 * 
 * Nesta classe, injetamos dependências de DB (ex: Prisma, Supabase)
 * e executamos a lógica de Idempotência.
 */
export class ConfirmInvoiceUseCase implements IPaymentConfirmationUseCase {

    /**
     * Confirmação principal de pagamento
     * @param txidOrChargeId ID da transação na EFI (Txid para PIX, ChargeId para Cartão)
     * @param status Status recebido ('CONCLUIDA', 'paid', etc)
     * @param method Método de pagamento (PIX ou CARTAO)
     */
    public async execute(txidOrChargeId: string, status: string, method: 'PIX' | 'CARTAO'): Promise<void> {
        // Fluxo a ser implementado:
        // 1. SELECT * FROM invoices WHERE txid = txidOrChargeId
        // 2. Se a fatura não existir, ignorar ou logar erro
        // 3. Se a fatura já estiver com status PAGO (Idempotência):
        //    console.info(`Fatura ${txidOrChargeId} já está paga. Webhook descartado silenciosamente.`);
        //    return;
        // 4. Update status para PAGO no BD, usando uma query atômica
        // 5. Opcional: emitir evento para NotificationService enviar recibo
        // 6. Opcional: OrderService.activateSubscription()

    }
}
