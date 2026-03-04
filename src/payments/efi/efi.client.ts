import axios, { AxiosInstance, AxiosError } from 'axios';
import { efiConfig } from './efi.config';
import { efiAuthService } from './efi.auth';
import { EfiApiError } from './efi.errors';

const MAX_RETRIES = 3;

class EfiClientFactory {
    /**
     * Cria a instância do Axios pré-configurada para PIX
     */
    public createClient(): AxiosInstance {
        const client = axios.create({
            baseURL: efiConfig.baseUrlPix,
            timeout: 15000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.setupRequestInterceptor(client, 'pix');
        this.setupResponseInterceptor(client);

        return client;
    }

    /**
     * Cria instância do Axios para a API de COBRANÇAS (cartão, assinaturas, planos).
     * Usa OAuth separado contra o servidor de cobranças.
     */
    public createCobrancasClient(): AxiosInstance {
        const client = axios.create({
            baseURL: efiConfig.baseUrlCobrancas,
            timeout: 15000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.setupRequestInterceptor(client, 'cobrancas');
        this.setupResponseInterceptor(client);

        return client;
    }

    /**
     * Intercepta a requisição ANTES dela sair para injetar o Token
     */
    private setupRequestInterceptor(client: AxiosInstance, type: 'pix' | 'cobrancas') {
        client.interceptors.request.use(
            async (config) => {
                // mTLS é obrigatório APENAS para PIX — Cobranças usa HTTPS simples
                if (type === 'pix') {
                    config.httpsAgent = efiAuthService.getHttpsAgent();
                }

                // Obter token garantido (novo ou do cache) — separado por tipo
                const token = type === 'cobrancas'
                    ? await efiAuthService.getCobrancasToken()
                    : await efiAuthService.getToken();

                // Injetar o Bearer Token
                config.headers.Authorization = `Bearer ${token}`;

                // [DEBUG] Auditoria de headers
                const authHeader = String(config.headers['Authorization'] || '');
                console.log(`[Axios Debug] [${type}] URL: ${config.url} | Auth: ${authHeader.length} chars`);
                if (authHeader.length > 2000) {
                    console.error('[CRÍTICO] O cabeçalho Authorization está anormalmente grande.');
                }

                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );
    }

    /**
     * Intercepta a resposta para tratamento de erro e retentativas (Retry)
     */
    private setupResponseInterceptor(client: AxiosInstance) {
        client.interceptors.response.use(
            (response) => {
                return response;
            },
            async (error: AxiosError | any) => {
                const config = error.config;

                // Inicializa o contador de retrys na configuracao
                if (!config || !config.retryCount) {
                    if (config) config.retryCount = 0;
                }

                // Condições para ativar o Retry: Timeout ou erro 5xx, maximo 3 vezes
                const shouldRetry = config &&
                    config.retryCount < MAX_RETRIES &&
                    (error.code === 'ECONNABORTED' || (error.response && error.response.status >= 500));

                if (shouldRetry) {
                    config.retryCount += 1;
                    console.warn(`[EFI Gateway] Requisição falhou. Tentativa de retry ${config.retryCount}/${MAX_RETRIES}...`);

                    // Aguarda um pequeno delay (Backoff simples: 1s, 2s, 3s)
                    await new Promise(resolve => setTimeout(resolve, config.retryCount * 1000));

                    // Retenta a requisição original
                    return client(config);
                }

                // Se falhou e não devemos retentar, normalizamos o erro para o App Error Customizado
                if (error.response) {
                    const status = error.response.status;
                    const data = error.response.data as any;

                    let efiCode = 'UNKNOWN';
                    let efiMessage = 'Erro desconhecido retornado pela API EFI';

                    if (data) {
                        // Log completo do erro para diagnóstico
                        console.error('[EFI Gateway] Resposta de erro completa:', JSON.stringify(data, null, 2));

                        efiCode = typeof data.nome === 'string' ? data.nome
                            : typeof data.error === 'string' ? data.error
                                : String(data.code || 'UNKNOWN');

                        // Garantir que a mensagem sempre será uma string legível
                        const rawMsg = data.mensagem || data.error_description || data.message || data.detail || data;
                        efiMessage = typeof rawMsg === 'string' ? rawMsg : JSON.stringify(rawMsg);
                    }

                    console.error(`[EFI Gateway] API Error: ${status} - ${efiCode} - ${efiMessage}`);

                    throw new EfiApiError(
                        `Erro na API EFI: ${efiMessage}`,
                        status,
                        efiCode,
                        efiMessage
                    );
                }

                // Erros de rede sem response (Timeout final, Drop connection)
                console.error(`[EFI Gateway] Network Error: ${error.message}`);
                throw error;
            }
        );
    }
}

// Clients Exportados
const factory = new EfiClientFactory();
export const efiClient = factory.createClient();              // Para operações PIX
export const efiCobrancasClient = factory.createCobrancasClient(); // Para operações Cobranças (cartão)
