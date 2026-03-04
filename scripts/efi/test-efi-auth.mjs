/**
 * TESTE 1 — Autenticação OAuth2
 * Valida que conseguimos obter um token da EFI em homologação.
 *
 * Executar: npm run test:efi:auth
 */

import 'dotenv/config';
import { Buffer } from 'node:buffer';
import https from 'node:https';
import fs from 'node:fs';
import axios from 'axios';

const CLIENT_ID = process.env.EFI_CLIENT_ID_HML;
const CLIENT_SECRET = process.env.EFI_CLIENT_SECRET_HML;
const CERT_PATH = process.env.EFI_CERT_PATH;
const OAUTH_URL = process.env.EFI_OAUTH_URL_HML;

async function testAuth() {
    console.log('\n🔐 [TESTE 1] Autenticação EFI Homologação\n');

    // Verificar pré-condições
    if (!CLIENT_ID || !CLIENT_SECRET) {
        console.error('❌ EFI_CLIENT_ID_HML ou EFI_CLIENT_SECRET_HML não definidos no .env');
        process.exit(1);
    }

    if (!fs.existsSync(CERT_PATH)) {
        console.error(`❌ Certificado não encontrado em: ${CERT_PATH}`);
        console.error('   Baixe o certificado no portal EFI e coloque em ./certs/');
        process.exit(1);
    }

    const cert = fs.readFileSync(CERT_PATH);
    const agent = new https.Agent({ pfx: cert, passphrase: process.env.EFI_CERT_PASSWORD || '' });

    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

    try {
        const response = await axios.post(
            OAUTH_URL,
            { grant_type: 'client_credentials' },
            {
                headers: {
                    Authorization: `Basic ${credentials}`,
                    'Content-Type': 'application/json',
                },
                httpsAgent: agent,
            }
        );

        const token = response.data.access_token;
        const expiresIn = response.data.expires_in;

        console.log('✅ Token obtido com sucesso!');
        console.log(`   Primeiros 30 chars: ${token.substring(0, 30)}...`);
        console.log(`   Expira em: ${expiresIn} segundos (${Math.round(expiresIn / 60)} minutos)`);
        console.log(`   Tipo: ${response.data.token_type}`);
        console.log('\n🟢 RESULTADO: PASSOU\n');

    } catch (err) {
        console.error('❌ Falha na autenticação:');
        console.error(`   Status: ${err.response?.status}`);
        console.error(`   Mensagem: ${JSON.stringify(err.response?.data)}`);
        console.error('\n🔴 RESULTADO: FALHOU\n');
        process.exit(1);
    }
}

testAuth();
