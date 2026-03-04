/**
 * TESTE 4 — Simulação de Webhook (Idempotência)
 * Simula chamadas POST ao nosso endpoint local:
 *
 * PRÉ-REQUISITO: servidor Next.js rodando em localhost:9002 ( BeeGym default port )
 * Executar: npm run test:efi:webhook
 */

import 'dotenv/config';

const WEBHOOK_URL = 'http://localhost:9002/api/webhooks/efi';
const SECRET = process.env.EFI_WEBHOOK_SECRET;

async function postWebhook(payload) {
    const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // No BeeGym simulamos o x-api-key ou secret se configurado
        },
        body: JSON.stringify(payload),
    });
    return { status: response.status, body: await response.json() };
}

async function testWebhook() {
    console.log('\n🎣 [TESTE 4] Simulação de Webhook + Idempotência\n');
    console.log(`   Endpoint: ${WEBHOOK_URL}`);
    console.log(`   Obs: certifique-se que o servidor Next.js está rodando (npm run dev)\n`);

    const txid = 'txid-webhook-teste-' + Date.now();

    const pixPayload = {
        pix: [{
            txid,
            endToEndId: `E00000000${Date.now()}`,
            valor: '0.01',
            horario: new Date().toISOString(),
            pagador: { nome: 'Cliente Teste' },
        }],
    };

    // ── CHAMADA 1: Fluxo feliz ──────────────────────────────────────
    console.log('📤 Chamada 1/2 — Fluxo feliz (primeiro pagamento)\n');
    try {
        const r1 = await postWebhook(pixPayload);
        console.log(`   HTTP Status: ${r1.status}`);
        console.log(`   Body: ${JSON.stringify(r1.body)}`);

        if (r1.status === 200) {
            console.log('   ✅ Resposta 200 — correto!');
        } else {
            console.error(`   ❌ Falhou com status ${r1.status}`);
        }
    } catch (e) {
        console.error(`   ❌ Falha ao conectar no servidor: ${e.message}`);
        process.exit(1);
    }

    // ── CHAMADA 2: Idempotência ─────────────────────────────────────
    console.log('\n📤 Chamada 2/2 — Duplicata do mesmo txid\n');
    const r2 = await postWebhook(pixPayload);
    console.log(`   HTTP Status: ${r2.status}`);
    console.log(`   Body: ${JSON.stringify(r2.body)}`);

    console.log('\n🟢 RESULTADO: Verificação concluída. Confira os logs do servidor para idempotência.\n');
}

testWebhook();
