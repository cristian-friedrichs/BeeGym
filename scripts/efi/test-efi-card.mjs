import 'dotenv/config';
import axios from 'axios';
import https from 'https';
import fs from 'fs';
import path from 'path';

const AMBIENTE = process.env.EFI_AMBIENTE || 'homologacao';
const CLIENT_ID = AMBIENTE === 'producao' ? process.env.EFI_CLIENT_ID_PRD : process.env.EFI_CLIENT_ID_HML;
const CLIENT_SECRET = AMBIENTE === 'producao' ? process.env.EFI_CLIENT_SECRET_PRD : process.env.EFI_CLIENT_SECRET_HML;
const CERT_PATH = process.env.EFI_CERT_PATH;
const BASE_URL_PIX = AMBIENTE === 'producao' ? process.env.EFI_BASE_URL_PRD : process.env.EFI_BASE_URL_HML;
const BASE_URL_COBRANCAS = BASE_URL_PIX?.replace('pix', 'cobrancas');
const OAUTH_URL = AMBIENTE === 'producao' ? process.env.EFI_OAUTH_URL_PRD : process.env.EFI_OAUTH_URL_HML;

if (!CLIENT_ID || !CLIENT_SECRET || !CERT_PATH || !BASE_URL_COBRANCAS) {
    console.error("❌ Erro: Variáveis EFI não configuradas no .env");
    process.exit(1);
}

const certFile = fs.readFileSync(path.resolve(process.cwd(), CERT_PATH));
const agent = new https.Agent({ pfx: certFile, passphrase: '' });

async function runCartaoTest() {
    console.log(`\n🚀 Iniciando Teste de Emissão por CARTÃO DE CRÉDITO (${AMBIENTE})`);

    try {
        // 1. Autenticação
        console.log(`\n1. Autenticando com EFI via mTLS...`);
        const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

        const authResp = await axios.post(
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

        const token = authResp.data.access_token;
        console.log(`✅ Token Oauth obtido: ${token.substring(0, 15)}...`);

        // 2. Criando o charge (carrinho)
        console.log(`\n2. Criando transação primária (charge)...`);
        const chargePayload = {
            items: [
                {
                    name: "Plano Anual BeeGym",
                    value: 120000, // R$ 1.200,00
                    amount: 1
                }
            ],
            metadata: { custom_id: "Assinatura-12345" }
        };

        const chargeResp = await axios.post(
            `${BASE_URL_COBRANCAS}/v1/charge`,
            chargePayload,
            {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                httpsAgent: agent,
            }
        );

        const chargeId = chargeResp.data.data.charge_id;
        console.log(`✅ Charge criada com sucesso! ID: ${chargeId}`);

        // Nota de instrução para testes reais de cartão:
        console.log(`\n======================================================`);
        console.log(`💳 ATENÇÃO: Para realizar o pagamento (Step 3), a EFI`);
        console.log(`  exige um payment_token gerado pelo Frontend.`);
        console.log(`  Devido a regulamentações de segurança (PCI), o script`);
        console.log(`  backend NÃO pode trafegar Número do Cartão cru.`);
        console.log(`\n  Isso valida a criação de sessão.`);
        console.log(`======================================================\n`);

        // Consulta do Charge vazio que aguarda o Frontend
        console.log(`3. Consultando status do charge recém-criado...`);
        const getResp = await axios.get(
            `${BASE_URL_COBRANCAS}/v1/charge/${chargeId}`,
            {
                headers: { Authorization: `Bearer ${token}` },
                httpsAgent: agent,
            }
        );

        console.log(`✅ Status da transação no banco: ${getResp.data.data.status}`);
        console.log(`\n🎉 Teste Parcial de Cartão de Crédito concluído!`);

    } catch (err) {
        console.error("\n❌ Erro ao testar Cartão de Crédito:");
        if (err.response) {
            console.error("Status:", err.response.status);
            console.error("Data:", JSON.stringify(err.response.data, null, 2));
        } else {
            console.error(err.message);
        }
    }
}

runCartaoTest();
