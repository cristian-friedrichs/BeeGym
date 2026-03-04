import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';

// Mock do EfiAuthService para não disparar requisições reais de autenticação e evitar timeout
vi.mock('../efi.auth', () => ({
    efiAuthService: {
        getToken: vi.fn().mockResolvedValue('fake-token-cacheado'),
        getHttpsAgent: vi.fn().mockReturnValue(null),
    }
}));

import { efiClient } from '../efi.client';
import { EfiApiError } from '../efi.errors';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('EfiClient — Validação de Retry e Tratamento de Erro', () => {

    it('deve executar retry 3 vezes ao receber erro 500', async () => {
        let attempts = 0;

        server.use(
            http.get('https://api.teste-efi-retry.com/recurso', () => {
                attempts++;
                return HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 });
            })
        );

        // O máximo de retries configurado no efiClient é 3, portanto 1 original + 3 retries = 4 tentativas totais
        // O timeout é de 10s porque os retries duram 1s + 2s + 3s = 6s totais.
        await expect(efiClient.get('https://api.teste-efi-retry.com/recurso')).rejects.toThrow(EfiApiError);
        expect(attempts).toBe(4);
    }, 10000);

    it('NÃO deve executar retry ao receber erro 400', async () => {
        let attempts = 0;

        server.use(
            http.get('https://api.teste-efi-retry.com/bad-request', () => {
                attempts++;
                return HttpResponse.json({ error: 'Bad Request' }, { status: 400 });
            })
        );

        await expect(efiClient.get('https://api.teste-efi-retry.com/bad-request')).rejects.toThrow(EfiApiError);
        // Deve tentar apenas 1 vez e já falhar
        expect(attempts).toBe(1);
    }, 10000);

    it('deve normalizar os errros de resposta na EfiApiError corretamente', async () => {
        server.use(
            http.get('https://api.teste-efi-retry.com/custom-error', () => {
                return HttpResponse.json(
                    { nome: 'erro_negocio', mensagem: 'Saldo insuficiente' },
                    { status: 403 }
                );
            })
        );

        try {
            await efiClient.get('https://api.teste-efi-retry.com/custom-error');
            // Forçar falha se não lançar erro
            expect(true).toBe(false);
        } catch (e: any) {
            expect(e).toBeInstanceOf(EfiApiError);
            expect(e.statusCode).toBe(403);
            expect(e.efiCode).toBe('erro_negocio');
            expect(e.message).toContain('Saldo insuficiente');
        }
    }, 10000);

});
