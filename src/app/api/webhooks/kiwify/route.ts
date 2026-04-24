import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Token estático exigido pela especificação
const EXPECTED_TOKEN = 'dczv229jm85';

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
        let newPlanType = 'free';
        let newLimitStudents = 0;
        let newSubscriptionStatus = 'pending';

        // Determinar os privilégios baseados no produto (apenas para eventos de ativação)
        if (productName.includes('starter')) {
            newPlanType = 'starter';
            newLimitStudents = 20;
        } else if (productName.includes('plus')) {
            newPlanType = 'plus';
            newLimitStudents = 40;
        } else if (productName.includes('studio')) {
            newPlanType = 'studio';
            newLimitStudents = 100;
        } else if (productName.includes('pro')) {
            newPlanType = 'pro';
            newLimitStudents = 500;
        } else if (productName.includes('enterprise')) {
            newPlanType = 'enterprise';
            newLimitStudents = 999999;
        } else if (productName) {
            // Fallback caso o nome seja um pouco diferente, ex: BeeGym Pro
            newPlanType = 'custom';
            newLimitStudents = 10;
        }

        const isActivationEvent = ['payment_approved', 'subscription_renewed', 'approved', 'paid'].includes(eventType);
        const isCancellationEvent = ['subscription_canceled', 'subscription_late', 'refunded', 'chargeback'].includes(eventType);

        if (isActivationEvent) {
            newSubscriptionStatus = 'active';
            
            await supabaseAdmin
                .from('organizations')
                .update({
                    subscription_status: newSubscriptionStatus,
                    plan_type: newPlanType,
                    limit_students: newLimitStudents,
                    onboarding_completed: true, // Já ativou
                    updated_at: new Date().toISOString()
                })
                .eq('id', orgId);

            console.log(`[Kiwify Webhook] Ativação concluída para ${email} (Org: ${orgId}) - Plano: ${newPlanType}`);
            return NextResponse.json({ success: true, message: 'Conta ativada/renovada com sucesso.' });

        } else if (isCancellationEvent) {
            // Em caso de subscription_late podemos definir como past_due
            newSubscriptionStatus = eventType === 'subscription_late' ? 'past_due' : 'canceled';

            await supabaseAdmin
                .from('organizations')
                .update({
                    subscription_status: newSubscriptionStatus,
                    plan_type: 'free',
                    limit_students: 0,
                    updated_at: new Date().toISOString()
                })
                .eq('id', orgId);

            console.log(`[Kiwify Webhook] Suspensão/Cancelamento para ${email} (Org: ${orgId}) - Motivo: ${eventType}`);
            return NextResponse.json({ success: true, message: 'Acesso suspendido/cancelado com sucesso.' });
        }

        // Caso seja outro evento irrelevante (ex: boleto_impresso)
        console.log(`[Kiwify Webhook] Evento ignorado: ${eventType} para ${email}`);
        return NextResponse.json({ success: true, message: 'Evento ignorado.' });

    } catch (err: any) {
        console.error('[Kiwify Webhook] Falha de processamento interno:', err.message);
        return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
    }
}
