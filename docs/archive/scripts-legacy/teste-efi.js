/**
 * Script de teste isolado da integração EFI
 * Roda fora do Next.js para isolar a causa raiz do erro.
 * 
 * Executar: node teste-efi.js
 */

require('dotenv').config();

const https = require('https');
const axios = require('axios');

async function testeEfi() {
    console.log('\n========================================');
    console.log(' TESTE ISOLADO EFI - Sem Next.js');
    console.log('========================================\n');

    // 1. Verificar variáveis de ambiente
    const clientId = process.env.EFI_CLIENT_ID_HML;
    const clientSecret = process.env.EFI_CLIENT_SECRET_HML;
    const certBase64 = process.env.EFI_CERT_BASE64;
    const certPath = process.env.EFI_CERT_PATH;
    const oauthUrl = process.env.EFI_OAUTH_URL_HML;

    console.log('--- [1] Variáveis de Ambiente ---');
    console.log(`  CLIENT_ID    : ${clientId ? clientId.substring(0, 30) + '...' : '❌ NÃO DEFINIDO'}`);
    console.log(`  CLIENT_SECRET: ${clientSecret ? clientSecret.substring(0, 20) + '...' : '❌ NÃO DEFINIDO'}`);
    console.log(`  OAUTH_URL    : ${oauthUrl || '❌ NÃO DEFINIDO'}`);
    console.log(`  CERT_BASE64  : ${certBase64 ? certBase64.length + ' chars raw' : '❌ NÃO DEFINIDO'}`);
    console.log(`  CERT_PATH    : ${certPath || '(não definido)'}`);

    if (!clientId || !clientSecret || !oauthUrl) {
        console.error('\n❌ ERRO: Variáveis obrigatórias não definidas. Verifique o .env\n');
        process.exit(1);
    }

    // 2. Preparar certificado
    let certBuffer;
    console.log('\n--- [2] Carregamento do Certificado ---');

    if (certBase64 && certBase64.length > 100) {
        const cleanBase64 = certBase64.replace(/[^A-Za-z0-9+/=]/g, '');
        console.log(`  Base64 raw   : ${certBase64.length} chars`);
        console.log(`  Base64 limpo : ${cleanBase64.length} chars`);
        certBuffer = Buffer.from(cleanBase64, 'base64');
        console.log(`  Buffer bytes : ${Buffer.byteLength(certBuffer)} bytes`);

        // Verificar se parece um arquivo P12 válido (magic bytes: 30 82)
        const magic = certBuffer.slice(0, 4).toString('hex');
        console.log(`  Magic bytes  : ${magic} ${magic.startsWith('3082') ? '✅ (parece P12/DER válido)' : '⚠️  (magic bytes inesperados)'}`);
    } else if (certPath) {
        const fs = require('fs');
        if (!fs.existsSync(certPath)) {
            console.error(`  ❌ Arquivo não encontrado: ${certPath}`);
            process.exit(1);
        }
        certBuffer = fs.readFileSync(certPath);
        console.log(`  Carregado de arquivo: ${certBuffer.byteLength} bytes`);
        const magic = certBuffer.slice(0, 4).toString('hex');
        console.log(`  Magic bytes  : ${magic} ${magic.startsWith('3082') ? '✅ (parece P12/DER válido)' : '⚠️  (magic bytes inesperados)'}`);
    } else {
        console.error('  ❌ Nenhuma fonte de certificado disponível');
        process.exit(1);
    }

    // 3. Criar Agent HTTPS
    console.log('\n--- [3] Criação do https.Agent ---');
    let agent;
    try {
        agent = new https.Agent({
            pfx: certBuffer,
            passphrase: process.env.EFI_CERT_PASSWORD || '',
            keepAlive: false,
        });
        console.log('  ✅ Agent criado com sucesso');
    } catch (err) {
        console.error(`  ❌ Erro ao criar Agent: ${err.message}`);
        process.exit(1);
    }

    // 4. Basic Auth
    console.log('\n--- [4] Credenciais Basic Auth ---');
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    console.log(`  clientId length      : ${clientId.length} chars`);
    console.log(`  clientSecret length  : ${clientSecret.length} chars`);
    console.log(`  base64 result length : ${credentials.length} chars`);
    if (credentials.length > 500) {
        console.warn('  ⚠️  Basic Auth suspeitamente grande!');
    } else {
        console.log('  ✅ Tamanho normal');
    }

    // 5. Chamada OAuth2
    console.log('\n--- [5] Requisição OAuth2 ---');
    console.log(`  URL: ${oauthUrl}`);

    try {
        const response = await axios.post(
            oauthUrl,
            { grant_type: 'client_credentials' },
            {
                headers: {
                    Authorization: `Basic ${credentials}`,
                    'Content-Type': 'application/json',
                },
                httpsAgent: agent,
                timeout: 15000,
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            }
        );

        const token = response.data.access_token;
        const expiresIn = response.data.expires_in;

        console.log('\n✅✅✅ TOKEN OBTIDO COM SUCESSO! ✅✅✅');
        console.log(`  Token (30 chars): ${token.substring(0, 30)}...`);
        console.log(`  Expira em       : ${expiresIn}s`);
        console.log(`  Tipo            : ${response.data.token_type}`);
        console.log('\n→ Conclusão: A integração EFI funciona fora do Next.js.');
        console.log('→ O problema está no ambiente do Next.js/Turbopack.\n');

    } catch (err) {
        console.error('\n❌❌❌ ERRO NA REQUISIÇÃO ❌❌❌');

        if (err.response) {
            console.error(`  Status      : ${err.response.status}`);
            console.error(`  Status Text : ${err.response.statusText}`);
            console.error(`  Data        : ${JSON.stringify(err.response.data)}`);
            console.error(`  Headers EFI : ${JSON.stringify(err.response.headers)}`);
        } else {
            console.error(`  Código      : ${err.code || 'N/A'}`);
            console.error(`  Mensagem    : ${err.message}`);
            if (err.stack) {
                console.error('\n  Stack completo:');
                console.error(err.stack);
            }
        }
        console.log('\n→ Conclusão: O problema está ANTES do Next.js (certificado, rede, URL ou credenciais).\n');
    }
}

testeEfi();
