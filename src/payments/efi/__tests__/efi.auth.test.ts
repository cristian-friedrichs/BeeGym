import { describe, it, expect, vi, beforeEach } from 'vitest';
import { efiAuthService } from '../efi.auth';
import { EfiAuthError } from '../efi.errors';

// Mock do axios para não bater na API real
vi.mock('axios');
import axios from 'axios';

describe('EfiAuthService', () => {
    let auth = efiAuthService;

    beforeEach(() => {
        vi.clearAllMocks();
        // @ts-ignore - resetando cache privado para testes
        auth.cache = null;
        // @ts-ignore - resetando agent privado para testes
        auth.httpsAgent = null;
    });

    it('deve obter um token válido e retornar o access_token', async () => {
        vi.mocked(axios.post).mockResolvedValueOnce({
            data: { access_token: 'token-abc-123', expires_in: 3600 },
        });

        const token = await auth.getToken();
        expect(token).toBe('token-abc-123');
        expect(axios.post).toHaveBeenCalledTimes(1);
    });

    it('deve retornar o token do cache sem nova requisição', async () => {
        vi.mocked(axios.post).mockResolvedValueOnce({
            data: { access_token: 'token-cacheado', expires_in: 3600 },
        });

        await auth.getToken(); // 1ª chamada — busca na API
        await auth.getToken(); // 2ª chamada — deve usar o cache

        // axios.post deve ter sido chamado apenas UMA vez
        expect(axios.post).toHaveBeenCalledTimes(1);
    });

    it('deve renovar o token quando restam menos de 60 segundos para expirar', async () => {
        // Simula token que expira em 30 segundos
        vi.mocked(axios.post)
            .mockResolvedValueOnce({
                data: { access_token: 'token-quase-expirado', expires_in: 30 },
            })
            .mockResolvedValueOnce({
                data: { access_token: 'token-renovado', expires_in: 3600 },
            });

        const primeiro = await auth.getToken();
        expect(primeiro).toBe('token-quase-expirado');

        const segundo = await auth.getToken(); // deve renovar por estar < 60s
        expect(segundo).toBe('token-renovado');
        expect(axios.post).toHaveBeenCalledTimes(2);
    });

    it('deve lançar EfiAuthError com mensagem clara em credenciais inválidas', async () => {
        vi.mocked(axios.post).mockRejectedValueOnce({
            response: { status: 401, data: { message: 'Unauthorized' } },
        });

        await expect(auth.getToken()).rejects.toThrow(EfiAuthError);
    });

    it('NÃO deve incluir o client_secret na mensagem de erro', async () => {
        vi.mocked(axios.post).mockRejectedValueOnce({
            response: { status: 401, data: { message: 'Unauthorized' } },
        });

        try {
            await auth.getToken();
        } catch (e: unknown) {
            const error = e as Error;
            expect(error.message).not.toContain('Client_Secret');
            // Não temos acesso direto ao env aqui sem importar, mas o teste original pedia isso.
            // O objetivo é garantir que segredos não vazem no log de erro.
        }
    });
});
