import { NextRequest, NextResponse } from 'next/server';
import type { TablesInsert } from '@/types/supabase';
import { supabaseAdmin } from '@/lib/supabase/admin';

// ─── Constants ───────────────────────────────────────────────────────────────

const EXPECTED_TOKEN = process.env.KIWIFY_WEBHOOK_TOKEN;

/**
 * Mapeamento de planos.
 * Chave: substring que aparece em product_name do payload Kiwify (lowercase).
 */
const PLAN_MAPPING: Record<string, { id: string; tier: string; limit: number; price: number }> = {
    starter:    { id: '12532d9c-ace2-400d-81a7-4daf951966f8', tier: 'STARTER',    limit: 20,     price: 19.90  },
    plus:       { id: '03f4ca44-ec71-4321-b425-634ab7c85791', tier: 'PLUS',       limit: 40,     price: 29.90  },
    studio:     { id: 'd37dadee-1f91-4a2c-ae7e-00f94392bda0', tier: 'STUDIO',     limit: 100,    price: 49.90  },
    pro:        { id: '20a6a4a6-6b9d-4880-b6d3-bdc3693be00d', tier: 'PRO',        limit: 500,    price: 79.90  },
    enterprise: { id: '5dd1476d-23f7-4c05-8fa7-cc2da8f99baa', tier: 'ENTERPRISE', limit: 999999, price: 149.90 },
};

/** Ordem numérica dos tiers para comparar upgrade vs downgrade. */
const TIER_ORDER: Record<string, number> = {
    FREE: 0, STARTER: 1, PLUS: 2, STUDIO: 3, PRO: 4, ENTERPRISE: 5,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Retorna o planInfo a partir do nome do produto enviado pelo Kiwify. */
function resolvePlanFromProductName(productName: string) {
    const name = productName.toLowerCase();
    if (name.includes('enterprise')) return PLAN_MAPPING.enterprise;
    if (name.includes('studio'))     return PLAN_MAPPING.studio;
    if (name.includes('plus'))       return PLAN_MAPPING.plus;
    if (name.includes('pro'))        return PLAN_MAPPING.pro;
    if (name.includes('starter'))    return PLAN_MAPPING.starter;
    return PLAN_MAPPING.starter; // fallback
}

/** Calcula a data do próximo vencimento (mesmo dia do mês, mês seguinte). */
function calcProximoVencimento(diaVencimento: number): Date {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1, diaVencimento);
    return next;
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Campos padrão do payload Kiwify
        const receivedToken       = body.token;
        const email               = body.email          as string | undefined;
        const eventType           = (body.webhook_event || body.event_type || body.order_status) as string;
        const productName         = (body.product_name  || '')  as string;
        const kiwifyOrderId       = (body.order_id      || body.id || null) as string | null;
        const kiwifySubscriptionId = (body.subscription_id || null) as string | null;
        const amountRaw           = body.order_amount   || body.amount || null;
        const amount              = amountRaw ? parseFloat(String(amountRaw)) / 100 : null; // Kiwify envia em centavos

        // ── 1. Log bruto sempre (auditoria, mesmo com token errado) ──────────
        await supabaseAdmin.from('webhook_logs').insert({
            email:      email || 'unknown@email.com',
            event_type: eventType || 'unknown',
            payload:    body,
            created_at: new Date().toISOString(),
        });

        // ── 2. Validação de segurança ─────────────────────────────────────────
        if (!EXPECTED_TOKEN || receivedToken !== EXPECTED_TOKEN) {
            console.error('[Kiwify] Token inválido ou ausente.');
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (!email) {
            console.error('[Kiwify] E-mail não encontrado no payload.');
            return NextResponse.json({ error: 'E-mail é obrigatório.' }, { status: 400 });
        }

        // ── 3. Idempotência: evitar re-processar o mesmo pedido ───────────────
        if (kiwifyOrderId) {
            const { data: existingCharge } = await supabaseAdmin
                .from('saas_charges')
                .select('id')
                .eq('kiwify_order_id', kiwifyOrderId)
                .maybeSingle();

            if (existingCharge) {
                console.log(`[Kiwify] Evento duplicado ignorado. order_id: ${kiwifyOrderId}`);
                return NextResponse.json({ success: true, message: 'Evento duplicado ignorado.' });
            }
        }

        // ── 4. Localizar organização pelo e-mail (case-insensitive) ───────────
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('organization_id')
            .ilike('email', email.trim())
            .single();

        if (!profile?.organization_id) {
            console.error(`[Kiwify] Organização não encontrada para: ${email}`);
            return NextResponse.json({ error: 'Organização não encontrada.' }, { status: 404 });
        }

        const orgId = profile.organization_id;

        // ── 5. Ler estado atual da assinatura ────────────────────────────────
        const { data: currentSub } = await supabaseAdmin
            .from('saas_subscriptions')
            .select('id, plan_tier, valor_mensal, pending_plan_tier, pending_plan_id, pending_limit_students, dia_vencimento')
            .eq('organization_id', orgId)
            .maybeSingle();

        const currentTier   = currentSub?.plan_tier?.toUpperCase() ?? 'FREE';
        const currentOrder  = TIER_ORDER[currentTier] ?? 0;
        const subId         = currentSub?.id ?? null;

        // ── 6. Classificar o evento ──────────────────────────────────────────
        const isPaymentEvent     = ['payment_approved', 'approved', 'paid'].includes(eventType);
        const isRenewalEvent     = eventType === 'subscription_renewed';
        const isCancellationEvent = ['subscription_canceled', 'refunded', 'chargeback'].includes(eventType);
        const isLateEvent        = eventType === 'subscription_late';

        // ════════════════════════════════════════════════════════════════════
        // PAGAMENTO APROVADO  →  primeiro pagamento OU upgrade imediato
        // ════════════════════════════════════════════════════════════════════
        if (isPaymentEvent) {
            const newPlan  = resolvePlanFromProductName(productName);
            const newOrder = TIER_ORDER[newPlan.tier] ?? 1;
            const diaVenc  = new Date().getDate();
            const proxVenc = calcProximoVencimento(diaVenc);

            let subscriptionEventType: string;

            if (currentTier === 'FREE' || !currentSub) {
                subscriptionEventType = 'SIGNUP';
            } else if (newOrder > currentOrder) {
                subscriptionEventType = 'UPGRADE';
            } else if (newOrder === currentOrder) {
                // Pode ser um re-pagamento ou reativação após cancelamento
                subscriptionEventType = 'RENEWAL';
            } else {
                // Downgrade com pagamento imediato (pouco comum, mas tratamos)
                subscriptionEventType = 'DOWNGRADE';
            }

            // Atualiza organização imediatamente
            const { error: orgError } = await supabaseAdmin
                .from('organizations')
                .update({
                    subscription_status: 'active',
                    plan_type:           newPlan.tier.toLowerCase(),
                    limit_students:      newPlan.limit,
                    onboarding_completed: true,
                    updated_at:          new Date().toISOString(),
                })
                .eq('id', orgId);
            if (orgError) throw orgError;

            // Upsert em saas_subscriptions (limpa qualquer pending antigo se for upgrade)
            const upsertPayload: TablesInsert<'saas_subscriptions'> = {
                organization_id:        orgId,
                saas_plan_id:           newPlan.id,
                plan_paid_id:           newPlan.id,
                status:                 'active',
                metodo:                 'KIWIFY',
                plan_tier:              newPlan.tier,
                valor_mensal:           newPlan.price,
                dia_vencimento:         diaVenc,
                proximo_vencimento:     proxVenc.toISOString(),
                kiwify_subscription_id: kiwifySubscriptionId,
                kiwify_order_id:        kiwifyOrderId,
                ...(subscriptionEventType === 'UPGRADE' && {
                    pending_plan_id:        null,
                    pending_plan_tier:      null,
                    pending_limit_students: null,
                    pending_effective_at:   null,
                }),
                updated_at: new Date().toISOString(),
            };

            // Busca o ID real da subscription (após upsert, garante que SIGNUP também tenha subId)
            const { data: freshSub, error: subError } = await supabaseAdmin
                .from('saas_subscriptions')
                .upsert(upsertPayload, { onConflict: 'organization_id' })
                .select('id')
                .single();
            if (subError) throw subError;

            const resolvedSubId = freshSub?.id ?? subId;

            // Registra a cobrança (saas_charges) — sempre, inclusive no SIGNUP
            if (resolvedSubId && amount !== null) {
                await supabaseAdmin.from('saas_charges').insert({
                    organization_id:        orgId,
                    saas_subscription_id:   resolvedSubId,
                    amount:                 amount ?? newPlan.price,
                    status:                 'paid',
                    payment_method:         'KIWIFY',
                    plan_tier:              newPlan.tier,
                    kiwify_order_id:        kiwifyOrderId,
                    kiwify_subscription_id: kiwifySubscriptionId,
                    description:            `${subscriptionEventType} - Plano ${newPlan.tier}`,
                    paid_at:                new Date().toISOString(),
                    created_at:             new Date().toISOString(),
                });
            }

            // Registra evento no histórico
            await supabaseAdmin.from('saas_subscription_events').insert({
                organization_id:        orgId,
                event_type:             subscriptionEventType,
                previous_plan_tier:     currentTier === 'FREE' ? null : currentTier,
                new_plan_tier:          newPlan.tier,
                previous_price:         currentSub?.valor_mensal ?? null,
                new_price:              newPlan.price,
                kiwify_order_id:        kiwifyOrderId,
                kiwify_subscription_id: kiwifySubscriptionId,
                effective_at:           new Date().toISOString(),
                applied_at:             new Date().toISOString(),
                metadata:               { product_name: productName, event_raw: eventType },
            });

            console.log(`[Kiwify] ${subscriptionEventType}: ${email} → Plano ${newPlan.tier} (Org: ${orgId})`);
            return NextResponse.json({ success: true, message: `${subscriptionEventType} processado com sucesso.` });
        }

        // ════════════════════════════════════════════════════════════════════
        // RENOVAÇÃO  →  mesmo plano, novo ciclo
        //   → Verifica se há downgrade pendente e o aplica agora
        // ════════════════════════════════════════════════════════════════════
        if (isRenewalEvent) {
            const diaVenc  = currentSub?.dia_vencimento ?? new Date().getDate();
            const proxVenc = calcProximoVencimento(diaVenc);
            const hasPendingDowngrade = !!(currentSub?.pending_plan_tier);

            if (hasPendingDowngrade && currentSub) {
                // Aplica o downgrade agendado
                const pendingTier   = currentSub.pending_plan_tier!;
                const pendingLimit  = currentSub.pending_limit_students!;
                const pendingPlanId = currentSub.pending_plan_id!;

                const { error: orgError } = await supabaseAdmin
                    .from('organizations')
                    .update({
                        subscription_status: 'active',
                        plan_type:           pendingTier.toLowerCase(),
                        limit_students:      pendingLimit,
                        updated_at:          new Date().toISOString(),
                    })
                    .eq('id', orgId);
                if (orgError) throw orgError;

                const resolvedPlan = Object.values(PLAN_MAPPING).find(p => p.tier === pendingTier);

                const { error: subError } = await supabaseAdmin
                    .from('saas_subscriptions')
                    .update({
                        saas_plan_id:            pendingPlanId,
                        plan_paid_id:            pendingPlanId,
                        plan_tier:               pendingTier,
                        valor_mensal:            resolvedPlan?.price ?? currentSub.valor_mensal,
                        proximo_vencimento:      proxVenc.toISOString(),
                        pending_plan_id:         null,
                        pending_plan_tier:       null,
                        pending_limit_students:  null,
                        pending_effective_at:    null,
                        cobrancas_pagas:         (currentSub as any).cobrancas_pagas + 1,
                        updated_at:              new Date().toISOString(),
                    })
                    .eq('organization_id', orgId);
                if (subError) throw subError;

                // Registra cobrança do downgrade
                if (subId && resolvedPlan) {
                    await supabaseAdmin.from('saas_charges').insert({
                        organization_id:        orgId,
                        saas_subscription_id:   subId,
                        amount:                 resolvedPlan.price,
                        status:                 'paid',
                        payment_method:         'KIWIFY',
                        plan_tier:              pendingTier,
                        kiwify_order_id:        kiwifyOrderId,
                        kiwify_subscription_id: kiwifySubscriptionId,
                        description:            `DOWNGRADE aplicado - Plano ${pendingTier}`,
                        paid_at:                new Date().toISOString(),
                        created_at:             new Date().toISOString(),
                    });
                }

                // Marca o evento de downgrade como aplicado
                await supabaseAdmin.from('saas_subscription_events').insert({
                    organization_id:        orgId,
                    event_type:             'DOWNGRADE',
                    previous_plan_tier:     currentTier,
                    new_plan_tier:          pendingTier,
                    previous_price:         currentSub.valor_mensal,
                    new_price:              resolvedPlan?.price ?? null,
                    kiwify_order_id:        kiwifyOrderId,
                    kiwify_subscription_id: kiwifySubscriptionId,
                    effective_at:           new Date().toISOString(),
                    applied_at:             new Date().toISOString(),
                    metadata:               { trigger: 'renewal_with_pending_downgrade' },
                });

                console.log(`[Kiwify] DOWNGRADE aplicado em renovação: ${email} → ${pendingTier} (Org: ${orgId})`);
            } else {
                // Renovação simples, mesmo plano
                await supabaseAdmin
                    .from('saas_subscriptions')
                    .update({
                        status:             'active',
                        proximo_vencimento: proxVenc.toISOString(),
                        cobrancas_pagas:    (currentSub as any).cobrancas_pagas + 1,
                        updated_at:         new Date().toISOString(),
                    })
                    .eq('organization_id', orgId);

                const resolvedPlan = Object.values(PLAN_MAPPING).find(p => p.tier === currentTier);

                if (subId) {
                    await supabaseAdmin.from('saas_charges').insert({
                        organization_id:        orgId,
                        saas_subscription_id:   subId,
                        amount:                 amount ?? resolvedPlan?.price ?? 0,
                        status:                 'paid',
                        payment_method:         'KIWIFY',
                        plan_tier:              currentTier,
                        kiwify_order_id:        kiwifyOrderId,
                        kiwify_subscription_id: kiwifySubscriptionId,
                        description:            `RENEWAL - Plano ${currentTier}`,
                        paid_at:                new Date().toISOString(),
                        created_at:             new Date().toISOString(),
                    });
                }

                await supabaseAdmin.from('saas_subscription_events').insert({
                    organization_id:        orgId,
                    event_type:             'RENEWAL',
                    previous_plan_tier:     currentTier,
                    new_plan_tier:          currentTier,
                    previous_price:         currentSub?.valor_mensal ?? null,
                    new_price:              resolvedPlan?.price ?? null,
                    kiwify_order_id:        kiwifyOrderId,
                    kiwify_subscription_id: kiwifySubscriptionId,
                    effective_at:           new Date().toISOString(),
                    applied_at:             new Date().toISOString(),
                });

                console.log(`[Kiwify] RENEWAL: ${email} → Plano ${currentTier} (Org: ${orgId})`);
            }

            return NextResponse.json({ success: true, message: 'Renovação processada com sucesso.' });
        }

        // ════════════════════════════════════════════════════════════════════
        // DOWNGRADE AGENDADO  →  evento 'subscription_changed' ou similar
        //   O Kiwify ainda vai cobrar o valor antigo até fim do ciclo.
        //   Armazenamos o pending para aplicar na próxima renovação.
        // ════════════════════════════════════════════════════════════════════
        if (eventType === 'subscription_changed') {
            const newPlan  = resolvePlanFromProductName(productName);
            const newOrder = TIER_ORDER[newPlan.tier] ?? 1;

            if (newOrder < currentOrder) {
                // É um downgrade: agenda para o próximo ciclo
                const diaVenc  = currentSub?.dia_vencimento ?? new Date().getDate();
                const proxVenc = calcProximoVencimento(diaVenc);

                await supabaseAdmin
                    .from('saas_subscriptions')
                    .update({
                        pending_plan_id:         newPlan.id,
                        pending_plan_tier:        newPlan.tier,
                        pending_limit_students:   newPlan.limit,
                        pending_effective_at:     proxVenc.toISOString(),
                        updated_at:               new Date().toISOString(),
                    })
                    .eq('organization_id', orgId);

                await supabaseAdmin.from('saas_subscription_events').insert({
                    organization_id:        orgId,
                    event_type:             'PENDING_DOWNGRADE_SCHEDULED',
                    previous_plan_tier:     currentTier,
                    new_plan_tier:          newPlan.tier,
                    previous_price:         currentSub?.valor_mensal ?? null,
                    new_price:              newPlan.price,
                    kiwify_order_id:        kiwifyOrderId,
                    kiwify_subscription_id: kiwifySubscriptionId,
                    effective_at:           proxVenc.toISOString(), // será aplicado no próximo ciclo
                    applied_at:             null,
                    metadata:               { scheduled_for: proxVenc.toISOString(), product_name: productName },
                });

                console.log(`[Kiwify] DOWNGRADE agendado: ${email} → ${newPlan.tier} em ${proxVenc.toDateString()} (Org: ${orgId})`);
                return NextResponse.json({ success: true, message: 'Downgrade agendado para o próximo ciclo.' });

            } else if (newOrder > currentOrder) {
                // Mudança para cima via subscription_changed → trata como upgrade
                console.log(`[Kiwify] subscription_changed com tier maior, aguardando payment_approved para UPGRADE.`);
                return NextResponse.json({ success: true, message: 'Aguardando confirmação de pagamento do upgrade.' });
            }

            return NextResponse.json({ success: true, message: 'Sem alteração de plano detectada.' });
        }

        // ════════════════════════════════════════════════════════════════════
        // COBRANÇA COM FALHA
        // ════════════════════════════════════════════════════════════════════
        if (isLateEvent) {
            await supabaseAdmin
                .from('organizations')
                .update({ subscription_status: 'past_due', updated_at: new Date().toISOString() })
                .eq('id', orgId);

            await supabaseAdmin
                .from('saas_subscriptions')
                .update({ status: 'past_due', updated_at: new Date().toISOString() })
                .eq('organization_id', orgId);

            if (subId) {
                await supabaseAdmin.from('saas_charges').insert({
                    organization_id:        orgId,
                    saas_subscription_id:   subId,
                    amount:                 amount ?? 0,
                    status:                 'failed',
                    payment_method:         'KIWIFY',
                    plan_tier:              currentTier,
                    kiwify_order_id:        kiwifyOrderId,
                    kiwify_subscription_id: kiwifySubscriptionId,
                    description:            `CHARGE_FAILED - Plano ${currentTier}`,
                    paid_at:                null,
                    created_at:             new Date().toISOString(),
                });
            }

            await supabaseAdmin.from('saas_subscription_events').insert({
                organization_id:    orgId,
                event_type:         'CHARGE_FAILED',
                previous_plan_tier: currentTier,
                new_plan_tier:      currentTier,
                effective_at:       new Date().toISOString(),
                applied_at:         new Date().toISOString(),
                metadata:           { reason: eventType },
            });

            console.log(`[Kiwify] CHARGE_FAILED: ${email} (Org: ${orgId})`);
            return NextResponse.json({ success: true, message: 'Cobrança falha registrada.' });
        }

        // ════════════════════════════════════════════════════════════════════
        // CANCELAMENTO  →  revoga acesso imediatamente
        // ════════════════════════════════════════════════════════════════════
        if (isCancellationEvent) {
            const newStatus = eventType === 'refunded' ? 'canceled' : 'canceled';

            await supabaseAdmin
                .from('organizations')
                .update({
                    subscription_status: newStatus,
                    plan_type:           'free',
                    limit_students:      0,
                    updated_at:          new Date().toISOString(),
                })
                .eq('id', orgId);

            await supabaseAdmin
                .from('saas_subscriptions')
                .update({
                    status:                  newStatus,
                    pending_plan_id:         null,
                    pending_plan_tier:       null,
                    pending_limit_students:  null,
                    pending_effective_at:    null,
                    updated_at:              new Date().toISOString(),
                })
                .eq('organization_id', orgId);

            await supabaseAdmin.from('saas_subscription_events').insert({
                organization_id:        orgId,
                event_type:             'CANCELLATION',
                previous_plan_tier:     currentTier,
                new_plan_tier:          'FREE',
                previous_price:         currentSub?.valor_mensal ?? null,
                new_price:              0,
                kiwify_order_id:        kiwifyOrderId,
                kiwify_subscription_id: kiwifySubscriptionId,
                effective_at:           new Date().toISOString(),
                applied_at:             new Date().toISOString(),
                metadata:               { reason: eventType },
            });

            console.log(`[Kiwify] CANCELLATION: ${email} (Org: ${orgId}) - motivo: ${eventType}`);
            return NextResponse.json({ success: true, message: 'Assinatura cancelada com sucesso.' });
        }

        // Evento não tratado — apenas logado
        console.log(`[Kiwify] Evento não tratado: "${eventType}" para ${email}`);
        return NextResponse.json({ success: true, message: `Evento "${eventType}" ignorado.` });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        console.error('[Kiwify] Falha interna:', message);
        return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
    }
}
