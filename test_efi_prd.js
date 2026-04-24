const fs = require('fs');
const path = require('path');
const https = require('https');
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

async function testEfiPrd() {
    const clientId = process.env.EFI_CLIENT_ID_PRD;
    const clientSecret = process.env.EFI_CLIENT_SECRET_PRD;
    const baseUrlCobrancas = process.env.EFI_COBRANCAS_URL_PRD || 'https://api.efipay.com.br';
    
    console.log(`URL: ${baseUrlCobrancas}`);

    // Auth
    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    try {
        console.log('Getting token for PRD...');
        const authRes = await axios.post(`${baseUrlCobrancas}/v1/authorize`, 
            { grant_type: 'client_credentials' },
            { 
                headers: { 'Authorization': `Basic ${authString}`, 'Content-Type': 'application/json' }
            }
        );
        const token = authRes.data.access_token;
        console.log('PRD Token acquired!');

        console.log('Creating plan...');
        const planRes = await axios.post(`${baseUrlCobrancas}/v1/plan`, {
            name: "Test Plan BeeGym",
            interval: 1,
            repeats: null
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('Plan created:', JSON.stringify(planRes.data, null, 2));

    } catch (err) {
        console.error('Error:', err.response ? JSON.stringify(err.response.data, null, 2) : err.message);
    }
}

testEfiPrd();
