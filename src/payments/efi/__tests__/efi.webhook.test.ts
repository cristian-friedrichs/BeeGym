import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EfiWebhookService } from '../efi.webhook';
import { IPaymentConfirmationUseCase } from '../efi.types';
import { EfiWebhookValidationError } from '../efi.errors';

describe('EfiWebhookService', () => {
    const mockUseCase: IPaymentConfirmationUseCase = {
        execute: vi.fn().mockResolvedValue(undefined),
    };

    let service: EfiWebhookService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new EfiWebhookService(mockUseCase);
    });

    // -------- PIX --------
    it('deve processar múltiplos pix no payload', async () => {
        const payload = {
            pix: [
                { txid: 'tx1', endToEndId: 'e1', chave: 'c1', valor: '10', horario: 'h1' },
                { txid: 'tx2', endToEndId: 'e2', chave: 'c1', valor: '20', horario: 'h2' },
            ],
        };

        await service.handle(payload as any, 'PIX');

        expect(mockUseCase.execute).toHaveBeenCalledTimes(2);
        expect(mockUseCase.execute).toHaveBeenCalledWith('tx1', 'CONCLUIDA', 'PIX');
        expect(mockUseCase.execute).toHaveBeenCalledWith('tx2', 'CONCLUIDA', 'PIX');
    });

    it('ignora payload pix em branco sem throws de erro por se tratar de fire and forget', async () => {
        await service.handle({} as any, 'PIX');
        expect(mockUseCase.execute).not.toHaveBeenCalled();
    });

    // -------- CARTÃO DE CRÉDITO --------
    it('deve processar notificações de cobrança múltiplas (Cartão)', async () => {
        const payload = {
            data: [
                { identificador: 'charge_123' },
                { charge_id: 'charge_456' },
            ],
        };

        await service.handle(payload as any, 'CARTAO');

        expect(mockUseCase.execute).toHaveBeenCalledTimes(2);
        expect(mockUseCase.execute).toHaveBeenCalledWith('charge_123', 'paid', 'CARTAO');
        expect(mockUseCase.execute).toHaveBeenCalledWith('charge_456', 'paid', 'CARTAO');
    });

    it('ignora payload cartao em branco sem throws de erro por se tratar de fire and forget', async () => {
        await service.handle({} as any, 'CARTAO');
        expect(mockUseCase.execute).not.toHaveBeenCalled();
    });

    // -------- SECRET VALIDATION --------
    it('deve validar um request retornando true para bypass de desenvolvimento', async () => {
        const headers = { 'x-webhook-signature': 'sha256=123456789' };
        const bodyString = JSON.stringify({ pix: [] });

        const isValid = await service.validateRequest(headers, bodyString);
        expect(isValid).toBe(true);
    });
});
