import { describe, it, expect, vi, beforeEach } from 'vitest';
import { efiPix } from '../efi.pix';

// Mock do efiClient
vi.mock('../efi.client', () => ({
    efiClient: {
        post: vi.fn(),
        put: vi.fn(),
        get: vi.fn(),
        patch: vi.fn(),
    },
}));

import { efiClient } from '../efi.client';

describe('EfiPixService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve chamar POST /v2/cob ao criar cobrança imediata', async () => {
        const mockInput = {
            calendario: { expiracao: 3600 },
            devedor: { nome: 'Teste' },
            valor: { original: '10.00' },
            chave: 'minha-chave',
        };

        vi.mocked(efiClient.post).mockResolvedValueOnce({ data: { txid: '123' } });

        const result = await efiPix.criarCobrancaPix(mockInput);

        expect(efiClient.post).toHaveBeenCalledWith('/v2/cob', mockInput);
        expect(result.txid).toBe('123');
    });

    it('deve chamar PUT /v2/cob/:txid ao criar com txid definido', async () => {
        const txid = 'abcdef1234567890abcdef1234567890abc';
        const mockInput = {
            calendario: { expiracao: 3600 },
            devedor: { nome: 'Teste' },
            valor: { original: '10.00' },
            chave: 'minha-chave',
        };

        vi.mocked(efiClient.put).mockResolvedValueOnce({ data: { txid } });

        const result = await efiPix.criarCobrancaPixComTxid(txid, mockInput);

        expect(efiClient.put).toHaveBeenCalledWith(`/v2/cob/${txid}`, mockInput);
        expect(result.txid).toBe(txid);
    });

    it('deve retornar erro se o txid for inválido (muito curto)', async () => {
        const txid = 'curto';
        await expect(efiPix.criarCobrancaPixComTxid(txid, {} as any)).rejects.toThrow(/TXID inválido/);
    });
});
