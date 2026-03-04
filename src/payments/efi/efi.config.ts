import dotenv from 'dotenv';
import { EfiConfig, EfiEnv } from './efi.types';
import { EfiAuthError } from './efi.errors';

// Garante que o .env seja carregado
dotenv.config();

export function getEfiConfig(): EfiConfig {
    // Aceita ambas as variantes — NEXT_PUBLIC_ (usada pelo frontend) e sem prefixo (legado)
    const ambiente = (
        process.env.NEXT_PUBLIC_EFI_AMBIENTE ||
        process.env.EFI_AMBIENTE ||
        'homologacao'
    ) as EfiEnv;

    const isProd = ambiente === 'producao';

    const clientId = isProd ? process.env.EFI_CLIENT_ID_PRD : process.env.EFI_CLIENT_ID_HML;
    const clientSecret = isProd ? process.env.EFI_CLIENT_SECRET_PRD : process.env.EFI_CLIENT_SECRET_HML;
    const baseUrlPix = isProd ? process.env.EFI_BASE_URL_PRD : process.env.EFI_BASE_URL_HML;
    const baseUrlOauth = isProd ? process.env.EFI_OAUTH_URL_PRD : process.env.EFI_OAUTH_URL_HML;
    const baseUrlCobrancas = isProd
        ? (process.env.EFI_COBRANCAS_URL_PRD || 'https://api.efipay.com.br')
        : (process.env.EFI_COBRANCAS_URL_HML || 'https://api.efipay.com.br');

    const certPath = process.env.EFI_CERT_PATH || '';
    const certBase64 = process.env.EFI_CERT_BASE64;
    const certPassword = process.env.EFI_CERT_PASSWORD;
    const webhookSecret = process.env.EFI_WEBHOOK_SECRET;

    // Recorrencia V2
    const chavePixAutomatico = isProd ? process.env.EFI_CHAVE_PIX_AUTOMATICO_PRD : process.env.EFI_CHAVE_PIX_AUTOMATICO_HML;
    const webhookPixAutomaticoSecret = process.env.EFI_WEBHOOK_PIX_AUTOMATICO_SECRET;
    const webhookCardRecorrenteSecret = process.env.EFI_WEBHOOK_CARD_RECORRENTE_SECRET;

    const planStarter = parseInt(isProd ? process.env.EFI_PLAN_ID_STARTER_PRD || '0' : process.env.EFI_PLAN_ID_STARTER_HML || '0', 10);
    const planPro = parseInt(isProd ? process.env.EFI_PLAN_ID_PRO_PRD || '0' : process.env.EFI_PLAN_ID_PRO_HML || '0', 10);
    const planEnterprise = parseInt(isProd ? process.env.EFI_PLAN_ID_ENTERPRISE_PRD || '0' : process.env.EFI_PLAN_ID_ENTERPRISE_HML || '0', 10);

    if (!clientId || !clientSecret) {
        throw new EfiAuthError(`As credenciais EFI_CLIENT_ID e EFI_CLIENT_SECRET para o ambiente '${ambiente}' não estão configuradas no .env`);
    }

    // Certificado: aceita base64 OU caminho de arquivo — pelo menos um é obrigatório
    if (!certBase64 && !certPath) {
        throw new EfiAuthError('O certificado mTLS não está configurado. Defina EFI_CERT_BASE64 ou EFI_CERT_PATH no .env');
    }

    if (certBase64) {
    }

    if (!baseUrlPix || !baseUrlOauth) {
        throw new EfiAuthError(`As URLs base (EFI_BASE_URL e EFI_OAUTH_URL) para o ambiente '${ambiente}' não estão configuradas no .env`);
    }

    return {
        ambiente,
        clientId,
        clientSecret,
        certPath,
        certBase64,
        certPassword,
        webhookSecret: webhookSecret || '',
        baseUrlPix,
        baseUrlCobrancas,
        baseUrlOauth,
        chavePixAutomatico,
        webhookPixAutomaticoSecret,
        webhookCardRecorrenteSecret,
        planosCartao: (planStarter && planPro && planEnterprise) ? {
            STARTER: planStarter,
            PRO: planPro,
            ENTERPRISE: planEnterprise
        } : undefined
    };
}

// Lazy singleton — avoids crash on module load if env vars are missing
let _efiConfigCache: EfiConfig | null = null;

export function getEfiConfigLazy(): EfiConfig {
    if (!_efiConfigCache) {
        _efiConfigCache = getEfiConfig();
    }
    return _efiConfigCache;
}

// Exporta o singleton de configuração (lazy)
export const efiConfig: EfiConfig = new Proxy({} as EfiConfig, {
    get(_target, prop) {
        return getEfiConfigLazy()[prop as keyof EfiConfig];
    }
});
