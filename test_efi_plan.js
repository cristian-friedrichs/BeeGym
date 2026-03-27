const fs = require('fs');
const path = require('path');
const https = require('https');
const axios = require('axios');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' }); // override with local if exists

async function testEfi() {
    const isProd = process.env.EFI_AMBIENTE === 'producao';
    const clientId = isProd ? process.env.EFI_CLIENT_ID_PRD : process.env.EFI_CLIENT_ID_HML;
    const clientSecret = isProd ? process.env.EFI_CLIENT_SECRET_PRD : process.env.EFI_CLIENT_SECRET_HML;
    const baseUrlCobrancas = isProd ? process.env.EFI_COBRANCAS_URL_PRD : process.env.EFI_COBRANCAS_URL_HML;
    const certPath = process.env.EFI_CERT_PATH;
    
    console.log(`Ambiente: ${isProd ? 'PRD' : 'HML'}`);
    console.log(`URL: ${baseUrlCobrancas}`);

    // Auth
    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    let httpsAgent = undefined;
    if (certPath) {
        try {
            const cert = fs.readFileSync(path.resolve(certPath));
            httpsAgent = new https.Agent({
                pfx: cert,
                passphrase: process.env.EFI_CERT_PASSWORD || ''
            });
            console.log('Certificate loaded');
        } catch(e) {
            console.error('Error loading cert:', e.message);
        }
    }

    try {
        console.log('Getting token...');
        const authRes = await axios.post(`${baseUrlCobrancas}/v1/authorize`, 
            { grant_type: 'client_credentials' },
            { 
                headers: { 'Authorization': `Basic ${authString}`, 'Content-Type': 'application/json' },
                httpsAgent
            }
        );
        const token = authRes.data.access_token;
        console.log('Token acquired!');

        console.log('Creating plan...');
        const planRes = await axios.post(`${baseUrlCobrancas}/v1/plan`, {
            name: "Test Plan BeeGym",
            interval: 1,
            repeats: null
        }, {
            headers: { 'Authorization': `Bearer ${token}` },
            httpsAgent
        });

        console.log('Plan created:', JSON.stringify(planRes.data, null, 2));

    } catch (err) {
        console.error('Error:', err.response ? JSON.stringify(err.response.data, null, 2) : err.message);
    }
}

testEfi();
