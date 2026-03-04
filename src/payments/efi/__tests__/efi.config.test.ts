import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getEfiConfig } from '../efi.config';

describe('efi.config — validação de variáveis de ambiente', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    it('deve carregar as credenciais corretamente no ambiente de homologacao (default)', () => {
        process.env.EFI_AMBIENTE = 'homologacao';
        process.env.EFI_CLIENT_ID_HML = 'id-hml-test';
        process.env.EFI_CLIENT_SECRET_HML = 'secret-hml-test';
        process.env.EFI_CERT_PATH = './certs/cert.p12';
        process.env.EFI_BASE_URL_HML = 'https://pix-h.api.efipay.com.br';
        process.env.EFI_OAUTH_URL_HML = 'https://pix-h.api.efipay.com.br/v1/oauth';
        process.env.EFI_WEBHOOK_SECRET = 'minha-secret-mock';

        const config = getEfiConfig();

        expect(config.ambiente).toBe('homologacao');
        expect(config.clientId).toBe('id-hml-test');
        expect(config.baseUrlPix).toContain('pix-h.api.efipay.com.br');
        expect(config.webhookSecret).toBe('minha-secret-mock');
    });

    it('deve carregar as credenciais corretamente no ambiente de producao', () => {
        process.env.EFI_AMBIENTE = 'producao';
        process.env.EFI_CLIENT_ID_PRD = 'id-prd-test';
        process.env.EFI_CLIENT_SECRET_PRD = 'secret-prd-test';
        process.env.EFI_CERT_PATH = './certs/cert.p12';
        process.env.EFI_BASE_URL_PRD = 'https://pix.api.efipay.com.br';
        process.env.EFI_OAUTH_URL_PRD = 'https://pix.api.efipay.com.br/v1/oauth';
        process.env.EFI_WEBHOOK_SECRET = 'minha-secret-mock-prod';

        const config = getEfiConfig();

        expect(config.ambiente).toBe('producao');
        expect(config.clientId).toBe('id-prd-test');
        expect(config.baseUrlPix).toBe('https://pix.api.efipay.com.br');
        expect(config.webhookSecret).toBe('minha-secret-mock-prod');
    });

    it('deve lançar erro se as credenciais de homologação estiverem ausentes', () => {
        process.env.EFI_AMBIENTE = 'homologacao';
        delete process.env.EFI_CLIENT_ID_HML;
        delete process.env.EFI_CLIENT_ID_PRD;

        expect(() => getEfiConfig()).toThrow(/EFI_CLIENT_ID/);
    });
});
