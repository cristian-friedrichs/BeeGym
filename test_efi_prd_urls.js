const axios = require('axios');

async function testUrl(url) {
    try {
        console.log(`Testing ${url} ...`);
        const res = await axios.post(`${url}/v1/authorize`, 
            { grant_type: 'client_credentials' },
            { headers: { 'Authorization': `Basic invalidbase64`, 'Content-Type': 'application/json' } }
        );
        console.log('Success (Unexpected API behavior without auth)?');
    } catch(err) {
        if (err.response) {
            console.log(`Status: ${err.response.status}, Is JSON: ${err.response.headers['content-type'].includes('json')}`);
            if (err.response.headers['content-type'].includes('json')) {
                console.log(`Response looks like a valid API error:`, err.response.data);
            } else {
                console.log(`Response is NOT JSON (probably an HTML page):`, err.response.data.substring(0, 100));
            }
        } else {
            console.log('Error:', err.message);
        }
    }
}

async function run() {
    await testUrl('https://api.efipay.com.br');
    await testUrl('https://cobrancas.api.efipay.com.br');
    await testUrl('https://api.gerencianet.com.br');
}

run();
