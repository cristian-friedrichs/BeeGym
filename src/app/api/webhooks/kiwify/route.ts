import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Token estático exigido pela especificação
const EXPECTED_TOKEN = 'dczv229jm85';

// Mapeamento de Planos (UUIDs vindos do banco saas_plans)
const PLAN_MAPPING: Record<string, { id: string, tier: string, limit: number, price: number }> = {
    'starter': { id: '12532d9c-ace2-400d-81a7-4daf951966f8', tier: 'STARTER', limit: 20, price: 19.90 },
    'plus': { id: '03f4ca44-ec71-4321-b425-634ab7c85791', tier: 'PLUS', limit: 40, price: 29.90 },
    'studio': { id: 'd37dadee-1f91-4a2c-ae7e-00f94392bda0', tier: 'STUDIO', limit: 100, price: 49.90 },
    'pro': { id: '20a6a4a6-6b9d-4880-b6d3-bdc3693be00d', tier: 'PRO', limit: 500, price: 79.90 },
    'enterprise': { id: '5dd1476d-23f7-4c05-8fa7-cc2da8f99baa', tier: 'ENTERPRISE', limit: 999999, price: 149.90 },
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const receivedToken = body.token;
        const email = body.email;
        const eventType = body.webhook_event || body.event_type || body.order_status;

        // 1. Log inicial na tabela (salva mesmo se o token estiver errado para auditoria)
        await supabaseAdmin.from('webhook_logs').insert({
            email: email || 'unknown@email.com',
            event_type: eventType || 'unknown',
            payload: body,
            created_at: new Date().toISOString()
        });

        // 2. Validação de Segurança Rigorosa
        if (!receivedToken || receivedToken !== EXPECTED_TOKEN) {
            console.error('[Kiwify Webhook] Acesso Negado: Token inválido ou ausente.');
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Se não tiver email no payload, não conseguimos associar a uma conta
        if (!email) {
            console.error('[Kiwify Webhook] E-mail não fornecido no payload.');
            return NextResponse.json({ error: 'E-mail é obrigatório para identificação.' }, { status: 400 });
        }

        // 3. Localizar o usuário via tabela profiles
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('organization_id')
            .eq('email', email)
            .single();

        if (!profile || !profile.organization_id) {
            console.error(`[Kiwify Webhook] Usuário ou organização não encontrados para o email: ${email}`);
            return NextResponse.json({ error: 'Organização não encontrada para este email.' }, { status: 404 });
        }

        const orgId = profile.organization_id;
        const productName = (body.product_name || '').toLowerCase();

        // 4. Lógica de Atualização Baseada no Evento
        let planInfo = PLAN_MAPPING.starter; // Fallback
        
        if (productName.includes('starter')) planInfo = PLAN_MAPPING.starter;
        else if (productName.includes('plus')) planInfo = PLAN_MAPPING.plus;
        else if (productName.includes('studio')) planInfo = PLAN_MAPPING.studio;
        else if (productName.includes('pro')) planInfo = PLAN_MAPPING.pro;
        else if (productName.includes('enterprise')) planInfo = PLAN_MAPPING.enterprise;

        const isActivationEvent = ['payment_approved', 'subscription_renewed', 'approved', 'paid'].includes(eventType);
        const isCancellationEvent = ['subscription_canceled', 'subscription_late', 'refunded', 'chargeback'].includes(eventType);

        if (isActivationEvent) {
            const newSubscriptionStatus = 'active';
            
            // Atualizar Organização
            const { error: orgError } = await supabaseAdmin
                .from('organizations')
                .update({
                    subscription_status: newSubscriptionStatus,
                    plan_type: planInfo.tier.toLowerCase(),
                    limit_students: planInfo.limit,
                    onboarding_completed: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', orgId);

            if (orgError) throw orgError;

            // Sincronizar saas_subscriptions
            const { error: subError } = await supabaseAdmin
                .from('saas_subscriptions')
                .upsert({
                    organization_id: orgId,
                    saas_plan_id: planInfo.id,
                    status: newSubscriptionStatus,
                    metodo: 'KIWIFY',
                    plan_tier: planInfo.tier,
                    valor_mensal: planInfo.price,
                    updated_at: new Date().toISOString(),
                    dia_vencimento: new Date().getDate() || 10
                }, { onConflict: 'organization_id' });

            if (subError) throw subError;

            console.log(`[Kiwify Webhook] Ativação concluída para ${email} (Org: ${orgId}) - Plano: ${planInfo.tier}`);
            return NextResponse.json({ success: true, message: 'Conta ativada/renovada com sucesso.' });

        } else if (isCancellationEvent) {
            const newSubscriptionStatus = eventType === 'subscription_late' ? 'past_due' : 'canceled';

            // Atualizar Organização (reverte para free)
            const { error: orgError } = await supabaseAdmin
                .from('organizations')
                .update({
                    subscription_status: newSubscriptionStatus,
                    plan_type: 'free',
                    limit_students: 0,
                    updated_at: new Date().toISOString()
                })
                .eq('id', orgId);

            if (orgError) throw orgError;

            // Atualizar saas_subscriptions
            const { error: subError } = await supabaseAdmin
                .from('saas_subscriptions')
                .update({
                    status: newSubscriptionStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('organization_id', orgId);

            if (subError) throw subError;

            console.log(`[Kiwify Webhook] Suspensão/Cancelamento para ${email} (Org: ${orgId}) - Motivo: ${eventType}`);
            return NextResponse.json({ success: true, message: 'Acesso suspendido/cancelado com sucesso.' });
        }

        console.log(`[Kiwify Webhook] Evento ignorado: ${eventType} para ${email}`);
        return NextResponse.json({ success: true, message: 'Evento ignorado.' });

    } catch (err: any) {
        console.error('[Kiwify Webhook] Falha de processamento interno:', err.message);
        return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
    }
}

