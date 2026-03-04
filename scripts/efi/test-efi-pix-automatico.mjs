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
const BASE_URL_OAUTH = AMBIENTE === 'producao' ? process.env.EFI_OAUTH_URL_PRD : process.env.EFI_OAUTH_URL_HML;

const CHAVE_PIX_RECEBEDORA = AMBIENTE === 'producao' ? process.env.EFI_CHAVE_PIX_AUTOMATICO_PRD : process.env.EFI_CHAVE_PIX_AUTOMATICO_HML;
const APP_URL = process.env.APP_URL || 'https://app.beegym.com.br';

if (!CLIENT_ID || !CLIENT_SECRET || !CERT_PATH || !BASE_URL_PIX || !CHAVE_PIX_RECEBEDORA) {
    console.error("❌ Erro: Variáveis EFI Mínimas ou Chave Pix Automática não configuradas no .env");
    process.exit(1);
}

const certFile = fs.readFileSync(path.resolve(process.cwd(), CERT_PATH));
const agent = new https.Agent({ pfx: certFile, passphrase: '' });

async function runPixAutomaticoTest() {
    console.log(`\n🚀 Iniciando Teste de V2 - ACORDO PIX AUTOMÁTICO (${AMBIENTE})`);

    try {
        // 1. Autenticação (Atenção: A API Pix V2 autentica em oAuth nativo de Pix)
        console.log(`\n1. Autenticando na API PIX via mTLS...`);
        // Obs: A rota de OAuth para endpoints /v2/loc/cobv pauta-se pelo dominio pix
        const oauthPixDomain = `${BASE_URL_PIX}/oauth/token`;

        const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

        const authResp = await axios.post(
            oauthPixDomain,
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
        console.log(`✅ Token Oauth (PIX) obtido: ${token.substring(0, 15)}...`);

        // 2. Criando o Acordo de Pix Automático
        console.log(`\n2. Formulando pedido do Acordo via POST /v2/loc/cobv/acordo...`);

        const hoje = new Date();
        // Vencimento de teste (evita >28)
        const diaVencimento = Math.min(hoje.getDate() + 1, 28);

        const payloadAcordo = {
            devedor: {
                cpf: "12345678909",
                nome: "João Recebedor Teste"
            },
            valor: {
                fixo: "199.90"
            },
            chave: CHAVE_PIX_RECEBEDORA,
            solicitacaoPagador: "Assinatura Mensal BeeGym PRO Via Pix Auto",
            recorrencia: {
                tipo: "MENSAL",
                diaVencimento: diaVencimento
            },
            urlRetorno: `${APP_URL}/assinatura/retorno`
        };

        const acordoResp = await axios.post(
            `${BASE_URL_PIX}/v2/loc/cobv/acordo`,
            payloadAcordo,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                httpsAgent: agent,
            }
        );

        const { idAcordo, urlConsentimento, situacao } = acordoResp.data;
        console.log(`✅ Acordo criado com sucesso! Status: [${situacao || 'CRIADO'}]`);
        console.log(`   ID Acordo EFI: ${idAcordo}`);
        console.log(`   URL Consentimento App Conta: ${urlConsentimento}`);
        console.log(`\n======================================================`);
        console.log(`⚠️ ATENÇÃO DESENVOLVEDOR:`);
        console.log(`   O link acima (urlConsentimento) é o que o contratante`);
        console.log(`   recebe na UI Front-end para aprovar no banco dele.`);
        console.log(`   No fluxo real, só avançará após webhook (ativo).`);
        console.log(`======================================================\n`);


    } catch (err) {
        console.error("\n❌ Erro Geral Script V2 Pix Automático:");
        if (err.response) {
            console.error("Status:", err.response.status);
            console.error("Data:", JSON.stringify(err.response.data, null, 2));
        } else {
            console.error(err.message);
        }
    }
}

runPixAutomaticoTest();
