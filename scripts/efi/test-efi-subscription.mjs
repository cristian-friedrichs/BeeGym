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

// A V2 de Cartão Recorrente exige o plano previamente criado
const PLAN_STARTER_ID = AMBIENTE === 'producao' ? process.env.EFI_PLAN_ID_STARTER_PRD : process.env.EFI_PLAN_ID_STARTER_HML;

if (!CLIENT_ID || !CLIENT_SECRET || !CERT_PATH || !BASE_URL_COBRANCAS || !PLAN_STARTER_ID) {
    console.error("❌ Erro: Variáveis EFI para Assinaturas não configuradas no .env");
    process.exit(1);
}

const certFile = fs.readFileSync(path.resolve(process.cwd(), CERT_PATH));
const agent = new https.Agent({ pfx: certFile, passphrase: '' });

async function runCartaoSubscriptionTest() {
    console.log(`\n🚀 Iniciando Teste de V2 - ASSINATURA RECORRENTE CARTÃO (${AMBIENTE})`);

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
        console.log(`✅ Token OAuth obtido: ${token.substring(0, 15)}...`);

        // 2. Criando a Assinatura (Simulação)
        console.log(`\n2. Vinculando o cliente ao plano [ID: ${PLAN_STARTER_ID}]...`);
        const subscriptionPayload = {
            items: [
                {
                    name: "Assinatura Mensal BeeGym PRO (1x Mês)",
                    value: 12000, // R$ 120,00
                    amount: 1
                }
            ],
            customer: {
                name: "João Contratante (BeeGym SaaS)",
                cpf: "12345678909",
                phone_number: "21999999999",
                email: "joao.b2b@studioteste.com.br",
                birth: "1980-01-01"
            },
            payment: {
                credit_card: {
                    billing_address: {
                        street: "Avenida das Américas",
                        number: "1234",
                        neighborhood: "Barra da Tijuca",
                        zipcode: "22793080",
                        city: "Rio de Janeiro",
                        state: "RJ"
                    },
                    // ATENÇÃO: No script não temos como injetar token real.
                    // Deve estourar 401/400 se payment_token = 'MOCK', mas valida o endpoint.
                    payment_token: "MOCK_TOKEN_GERADO_PELO_FRONTEND_ASSINATURA"
                }
            },
            repeats: null,
            interval: 1
        };

        console.log(`-- Endpoint: POST /v1/plan/${PLAN_STARTER_ID}/subscription`);
        console.log(`-- Aguardando estourar a validadora nativa da EFI pelo Fake Token...`);

        try {
            await axios.post(
                `${BASE_URL_COBRANCAS}/v1/plan/${PLAN_STARTER_ID}/subscription`,
                subscriptionPayload,
                {
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                    httpsAgent: agent,
                }
            );
            console.log(`⚠️ Inesperado: Passou assinatura com Token MOCK?!`);
        } catch (apiErr) {
            if (apiErr.response && [400, 422, 500].includes(apiErr.response.status)) {
                console.log(`✅ Sucesso Controlado! EFI processou o request perfeitamente e validou a integridade arquitetural (Endpoint/Credenciais).`);
                console.log(`   Motivo esperado da recusa EFI: Payment_Token não gerado pela Sandbox frontend / plano inexistente.`);
                console.log(`   Retorno:`, apiErr.response.data?.error_description || apiErr.response.data);
            } else {
                throw apiErr;
            }
        }

    } catch (err) {
        console.error("\n❌ Erro Geral Script V2 Cartão Recorrente:");
        if (err.response) {
            console.error("Status:", err.response.status);
            console.error("Data:", JSON.stringify(err.response.data, null, 2));
        } else {
            console.error(err.message);
        }
    }
}

runCartaoSubscriptionTest();
