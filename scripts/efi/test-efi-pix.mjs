/**
 * TESTE 2 — Criar Cobrança Pix + Gerar QR Code
 * Cria uma cobrança real em HML, gera o QR Code e salva em /tmp.
 *
 * Executar: npm run test:efi:pix
 * Saída: /tmp/efi-qrcode-test.png (abrir para verificar visualmente)
 */

import 'dotenv/config';
import fs from 'node:fs';
import https from 'node:https';
import { randomUUID } from 'node:crypto';
import axios from 'axios';
import QRCode from 'qrcode';

const CERT_PATH = process.env.EFI_CERT_PATH;
const BASE_URL = process.env.EFI_BASE_URL_HML;
const OAUTH_URL = process.env.EFI_OAUTH_URL_HML;

// ⚠️ SUBSTITUA pela sua chave Pix cadastrada no ambiente de HML no seu .env
const CHAVE_PIX_HML = process.env.EFI_CHAVE_PIX_HML || 'sua-chave-pix-homologacao@email.com';

async function testPix() {
    console.log('\n💸 [TESTE 2] Criação de Cobrança Pix\n');

    if (!fs.existsSync(CERT_PATH)) {
        console.error(`❌ Certificado não encontrado em: ${CERT_PATH}`);
        process.exit(1);
    }

    const cert = fs.readFileSync(CERT_PATH);
    const agent = new https.Agent({ pfx: cert, passphrase: process.env.EFI_CERT_PASSWORD || '' });

    // 1. Autenticar
    const tokenResp = await axios.post(
        OAUTH_URL,
        { grant_type: 'client_credentials' },
        {
            headers: {
                Authorization: `Basic ${Buffer.from(
                    `${process.env.EFI_CLIENT_ID_HML}:${process.env.EFI_CLIENT_SECRET_HML}`
                ).toString('base64')}`,
                'Content-Type': 'application/json',
            },
            httpsAgent: agent,
        }
    );
    const token = tokenResp.data.access_token;
    console.log('   ✅ Token obtido');

    // 2. Criar cobrança Pix com txid único
    const txid = randomUUID().replace(/-/g, '').substring(0, 35);
    const payload = {
        calendario: { expiracao: 3600 },
        devedor: { cpf: '12345678909', nome: 'Cliente Teste Antigravity' },
        valor: { original: '0.01' }, // R$ 0,01 — valor mínimo para teste
        chave: CHAVE_PIX_HML,
        solicitacaoPagador: '[TESTE HML] BeeGym - Verificação de integração',
        infoAdicionais: [
            { nome: 'Ambiente', valor: 'Homologação' },
            { nome: 'Script', valor: 'test-efi-pix.mjs' },
        ],
    };

    const cobResp = await axios.put(
        `${BASE_URL}/v2/cob/${txid}`,
        payload,
        {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            httpsAgent: agent,
        }
    );

    const cobranca = cobResp.data;
    console.log(`   ✅ Cobrança criada!`);
    console.log(`   txid: ${cobranca.txid}`);
    console.log(`   Status: ${cobranca.status}`);
    console.log(`   Valor: R$ ${cobranca.valor.original}`);
    console.log(`   pixCopiaECola: ${cobranca.pixCopiaECola.substring(0, 40)}...`);

    // 3. Gerar QR Code
    const qrCodePath = './efi-qrcode-test.png';
    await QRCode.toFile(qrCodePath, cobranca.pixCopiaECola, {
        errorCorrectionLevel: 'M',
        width: 400,
        margin: 2,
    });

    console.log(`\n   ✅ QR Code gerado: ${qrCodePath}`);
    console.log(`   📱 Abra o arquivo para verificar visualmente se o QR Code é válido`);

    console.log('\n🟢 RESULTADO: PASSOU\n');
}

testPix().catch((err) => {
    console.error('🔴 FALHOU:', err.response?.data || err.message);
    process.exit(1);
});
