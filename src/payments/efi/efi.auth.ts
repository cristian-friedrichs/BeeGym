import axios from 'axios';
import https from 'https';
import fs from 'fs';
import { efiConfig } from './efi.config';
import { EfiAuthError, EfiCertError } from './efi.errors';

interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
}

interface TokenCache {
    token: string;
    expiresAt: number;
}

class EfiAuthService {
    private cache: TokenCache | null = null;
    private cobrancasCache: TokenCache | null = null;
    private httpsAgent: https.Agent | null = null;

    /**
     * Inicializa e retorna o Agent HTTPS configurado com o certificado mTLS.
     * Prioridade: EFI_CERT_BASE64 → EFI_CERT_PATH (arquivo em disco)
     */
    public getHttpsAgent(): https.Agent {
        if (this.httpsAgent) return this.httpsAgent;

        try {
            let certBuffer: Buffer;

            // Log de diagnóstico
            if (efiConfig.certBase64) {
                console.log(`[EFI Auth] Tentando via Base64 (${efiConfig.certBase64.length} chars)`);
            }
            if (efiConfig.certPath) {
                console.log(`[EFI Auth] Caminho disponível: ${efiConfig.certPath}`);
            }

            // Prioridade 1: Certificado via Base64
            if (efiConfig.certBase64 && efiConfig.certBase64.length > 100) {
                const cleanBase64 = efiConfig.certBase64.replace(/[^A-Za-z0-9+/=]/g, '');
                console.log(`[EFI Auth] Tentando via Base64 (${cleanBase64.length} caracteres limpos)`);
                certBuffer = Buffer.from(cleanBase64, 'base64');
            }
            // Prioridade 2: Certificado via caminho de arquivo (fallback robusto)
            else if (efiConfig.certPath && fs.existsSync(efiConfig.certPath)) {
                console.log('[EFI Auth] Carregando via EFI_CERT_PATH:', efiConfig.certPath);
                certBuffer = fs.readFileSync(efiConfig.certPath);
            } else {
                throw new EfiCertError(
                    'Certificado mTLS não encontrado ou malformado. Verifique o EFI_CERT_BASE64 no .env'
                );
            }

            console.log(`[EFI Auth] Tamanho do buffer do certificado: ${Buffer.byteLength(certBuffer)} bytes`);

            this.httpsAgent = new https.Agent({
                pfx: certBuffer,
                passphrase: efiConfig.certPassword || '',
                keepAlive: true,
                maxVersion: 'TLSv1.2',
                minVersion: 'TLSv1.2',
            });

            return this.httpsAgent;
        } catch (error: any) {
            if (error instanceof EfiCertError) throw error;
            throw new EfiCertError(`Erro ao carregar certificado mTLS: ${error.message}`);
        }
    }

    /**
     * Obtém o token de acesso para a API PIX
     */
    public async getToken(): Promise<string> {
        const now = Date.now();
        if (this.cache && this.cache.expiresAt > now + 60000) {
            return this.cache.token;
        }
        const token = await this.authenticate(efiConfig.baseUrlOauth, 'pix');
        this.cache = { token, expiresAt: Date.now() + 3500 * 1000 };
        return token;
    }

    /**
     * Obtém o token de acesso para a API de COBRANÇAS (cartão, assinaturas).
     * Endpoint: POST /v1/authorize (SEM mTLS — diferente da API PIX)
     * Documentação: https://dev.efipay.com.br/docs/api-cobrancas/credenciais
     */
    public async getCobrancasToken(): Promise<string> {
        const now = Date.now();
        if (this.cobrancasCache && this.cobrancasCache.expiresAt > now + 60000) {
            return this.cobrancasCache.token;
        }

        try {
            const credentials = Buffer.from(`${efiConfig.clientId}:${efiConfig.clientSecret}`).toString('base64');
            const oauthUrl = `${efiConfig.baseUrlCobrancas}/v1/authorize`;

            console.log(`[EFI Auth] [cobrancas] Autenticando em ${oauthUrl}...`);

            // Cobranças API NÃO exige mTLS — usa HTTPS simples + Basic Auth
            const response = await axios.post<TokenResponse>(
                oauthUrl,
                { grant_type: 'client_credentials' },
                {
                    headers: {
                        Authorization: `Basic ${credentials}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 10000,
                }
            );

            const { access_token, expires_in } = response.data;
            this.cobrancasCache = { token: access_token, expiresAt: Date.now() + expires_in * 1000 };

            console.log(`[EFI Auth] [cobrancas] Token obtido com sucesso (expira em ${expires_in}s)`);
            return access_token;
        } catch (error: any) {
            if (error.response) {
                console.error('[EFI Auth] [cobrancas] Falha:', error.response.status, error.response.data);
                throw new EfiAuthError(`Falha na autenticação EFI [cobrancas]: [${error.response.status}] ${JSON.stringify(error.response.data)}`);
            }
            console.error('[EFI Auth] [cobrancas] Erro de rede:', error.message);
            throw new EfiAuthError(`Falha na autenticação EFI [cobrancas]: ${error.message}`);
        }
    }

    /**
     * Realiza a requisição OAuth2 para obter novo token
     */
    private async authenticate(oauthUrl: string, label: string): Promise<string> {
        try {
            // Basic Auth: base64(client_id:client_secret)
            const credentials = Buffer.from(`${efiConfig.clientId}:${efiConfig.clientSecret}`).toString('base64');

            console.log(`[EFI Auth] [${label}] Autenticando em ${oauthUrl}...`);

            const agent = this.getHttpsAgent();

            const response = await axios.post<TokenResponse>(
                oauthUrl,
                { grant_type: 'client_credentials' },
                {
                    headers: {
                        Authorization: `Basic ${credentials}`,
                        'Content-Type': 'application/json',
                    },
                    httpsAgent: agent,
                    timeout: 10000,
                }
            );

            const { access_token, expires_in } = response.data;

            console.log(`[EFI Auth] [${label}] Token obtido com sucesso (expira em ${expires_in}s)`);
            return access_token;
        } catch (error: any) {
            if (error.response) {
                console.error(`[EFI Auth] [${label}] Falha:`, error.response.status, error.response.data);
                throw new EfiAuthError(`Falha na autenticação EFI [${label}]: [${error.response.status}] ${JSON.stringify(error.response.data)}`);
            }
            console.error(`[EFI Auth] [${label}] Erro de rede:`, error.message);
            throw new EfiAuthError(`Falha na autenticação EFI [${label}]: ${error.message}`);
        }
    }
}

// Singleton export
export const efiAuthService = new EfiAuthService();
