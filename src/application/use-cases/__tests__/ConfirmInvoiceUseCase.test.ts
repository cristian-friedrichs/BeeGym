import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfirmInvoiceUseCase } from '../ConfirmInvoiceUseCase';

describe('ConfirmInvoiceUseCase', () => {
    let useCase: ConfirmInvoiceUseCase;

    beforeEach(() => {
        vi.clearAllMocks();
        useCase = new ConfirmInvoiceUseCase();
    });

    it('deve executar sem erros (Mock)', async () => {
        // Como a implementação atual é um skeleton com console.log,
        // apenas testamos que ele termina sem exceções.
        await expect(useCase.execute('txid-123', 'CONCLUIDA', 'PIX')).resolves.not.toThrow();
    });
});
