import { efiPix } from '@/payments/efi';
import { ConfirmInvoiceUseCase } from '@/application/use-cases/ConfirmInvoiceUseCase';
// import { InvoiceRepository } from '@/repositories/InvoiceRepository'; // Exemplo

export class EfiReconciliationJob {
    private confirmInvoiceUseCase: ConfirmInvoiceUseCase;

    constructor() {
        this.confirmInvoiceUseCase = new ConfirmInvoiceUseCase();
    }

    /**
     * Executa a rotina de conciliação.
     * Em produção, isso pode ser chamado a cada 15 min via Vercel Cron
     * ou via biblioteca `node-cron` se estivéssemos em servidor longo.
     */
    public async execute(): Promise<void> {
        console.log('[EfiReconciliationJob] Iniciando conciliação de Webhooks perdidos...');

        try {
            // 1. Busca no Banco de Dados faturas PENDENTES que expiraram há poucos minutos
            // Exemplo:
            // const pendentes = await InvoiceRepository.findPendingExpiredIn(5, 'minutes');
            const mockPendentes = [
                { txid: 'exemplodev1234567890123456789012345' } // Mock de teste
            ];

            for (const fatura of mockPendentes) {
                if (!fatura.txid) continue;

                console.log(`[EfiReconciliationJob] Consultando status real do TXID: ${fatura.txid}`);

                try {
                    // 2. Consulta a fonte da verdade na API EFI
                    const cobranca = await efiPix.consultarCobranca(fatura.txid);

                    if (cobranca.status === 'CONCLUIDA') {
                        console.log(`[EfiReconciliationJob] TXID ${fatura.txid} foi pago! Disparando confirmação salvadora.`);
                        // Dispara o caso de uso normalmente (idempotente)
                        await this.confirmInvoiceUseCase.execute(fatura.txid, cobranca.status, 'PIX');
                    }
                    else if (cobranca.status === 'REMOVIDA_PELO_USUARIO_RECEBEDOR' || cobranca.status === 'REMOVIDA_PELO_PSP') {
                        console.log(`[EfiReconciliationJob] TXID ${fatura.txid} foi removido/expirado. Invalidar fatura (Mock).`);
                        // await InvoiceRepository.markAsExpired(fatura.txid);
                    }
                    // Se ainda for ATIVA, apenas ignoramos e esperamos
                } catch (apiError: any) {
                    console.error(`[EfiReconciliationJob] Falha ao consultar TXID ${fatura.txid} na EFI:`, apiError.message);
                }
            }

            console.log('[EfiReconciliationJob] Conciliação finalizada.');

        } catch (err: any) {
            console.error('[EfiReconciliationJob] Erro fatal durante a rotina:', err.message);
        }
    }
}

// Handler utilitário caso queira exportar via Next.js api route de Cron
export async function runEfiReconciliation() {
    const job = new EfiReconciliationJob();
    await job.execute();
}
