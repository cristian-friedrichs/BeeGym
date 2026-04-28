import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth-utils';
import { withRateLimit } from '@/lib/rate-limit/limiter';
import { SUB_STATUS, ACTIVE_STATUSES, CHURN_STATUSES, isInTrial } from '@/lib/admin/subscription-status';

function effectivePrice(s: any): number {
    if (s.manual_price_override != null) return Number(s.manual_price_override);
    if (s.promo_price != null && (s.promo_months_remaining ?? 0) > 0) return Number(s.promo_price);
    return Number(s.valor_mensal ?? 0);
}

function isFirstCycle(s: any): boolean {
    return (s.cobrancas_pagas ?? 0) <= 1;
}

export async function GET(request: NextRequest) {
    const rateLimitResponse = await withRateLimit(request, 30);
    if (rateLimitResponse) return rateLimitResponse;

    const auth = await requireAdmin(request);
    if ('error' in auth) return auth.error;

    try {
        // 1. All subscriptions with plan + org details
        const { data: subs, error: subErr } = await supabaseAdmin
            .from('saas_subscriptions')
            .select(`
                id,
                organization_id,
                status,
                valor_mensal,
                metodo,
                cobrancas_pagas,
                promo_price,
                promo_months_remaining,
                manual_price_override,
                plan_tier,
                created_at,
                updated_at,
                proximo_vencimento,
                saas_plans!saas_plan_id ( name, tier, price ),
                organizations!organization_id ( name, email )
            `)
            .order('created_at', { ascending: false });

        if (subErr) throw subErr;

        // 2. Charges history (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const { data: charges, error: chargesErr } = await supabaseAdmin
            .from('saas_charges')
            .select('id, organization_id, amount, status, payment_method, paid_at, created_at, saas_subscription_id')
            .gte('created_at', sixMonthsAgo.toISOString())
            .order('created_at', { ascending: false });

        if (chargesErr) console.error('[Financeiro] charges error:', chargesErr);

        const allSubs = subs || [];
        const allCharges = charges || [];

        // 3. KPIs financeiros
        let mrr = 0;
        let iet = 0;
        let inadimplencia = 0;
        let totalAtivos = 0;
        let totalCancelados = 0;
        let totalPendentes = 0;
        let receitaTotal6m = 0;

        allSubs.forEach(s => {
            const price = effectivePrice(s);
            if (s.status === SUB_STATUS.ACTIVE || s.status === SUB_STATUS.TRIAL) {
                totalAtivos++;
                if (isFirstCycle(s)) iet += price;
                else mrr += price;
            }
            if (s.status === 'PAST_DUE') inadimplencia += price;
            if (CHURN_STATUSES.includes(s.status as any)) totalCancelados++;
            if (s.status === 'PENDING') totalPendentes++;
        });

        allCharges.forEach(c => {
            if (c.status === 'PAGO') receitaTotal6m += Number(c.amount ?? 0);
        });

        // 4. Receita por plano (ativos)
        const porPlano: Record<string, { tier: string; name: string; clientes: number; mrr: number; iet: number }> = {};
        allSubs
            .filter(s => s.status === SUB_STATUS.ACTIVE || s.status === SUB_STATUS.TRIAL)
            .forEach(s => {
                const tier = (s as any).saas_plans?.tier || s.plan_tier || 'N/A';
                const planName = (s as any).saas_plans?.name || tier;
                if (!porPlano[tier]) porPlano[tier] = { tier, name: planName, clientes: 0, mrr: 0, iet: 0 };
                porPlano[tier].clientes++;
                const price = effectivePrice(s);
                if (isFirstCycle(s)) porPlano[tier].iet += price;
                else porPlano[tier].mrr += price;
            });

        // 5. Receita por método de pagamento
        const porMetodo: Record<string, { metodo: string; clientes: number; receita: number }> = {};
        allSubs
            .filter(s => s.status === SUB_STATUS.ACTIVE || s.status === SUB_STATUS.TRIAL)
            .forEach(s => {
                const m = s.metodo || 'N/A';
                if (!porMetodo[m]) porMetodo[m] = { metodo: m, clientes: 0, receita: 0 };
                porMetodo[m].clientes++;
                porMetodo[m].receita += effectivePrice(s);
            });

        // 6. Evolução de receita (últimos 6 meses) using charges
        const months: { label: string; key: string }[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleString('pt-BR', { month: 'short' });
            months.push({ label, key });
        }

        const evolucaoReceita = months.map(m => {
            const receita = allCharges
                .filter(c => {
                    if (!c.paid_at || c.status !== 'PAGO') return false;
                    const d = new Date(c.paid_at);
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === m.key;
                })
                .reduce((acc, c) => acc + Number(c.amount ?? 0), 0);

            const inadimplentes = allCharges
                .filter(c => {
                    if (!c.created_at || c.status !== 'FALHA') return false;
                    const d = new Date(c.created_at);
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === m.key;
                }).length;

            return { mes: m.label, receita, inadimplentes };
        });

        // 7. Pagamentos em aberto (PENDING + PAST_DUE) — lista detalhada
        const pagamentosAbertos = allSubs
            .filter(s => s.status === 'PENDING' || s.status === 'PAST_DUE')
            .map(s => ({
                id: s.id,
                orgName: (s as any).organizations?.name || '—',
                orgEmail: (s as any).organizations?.email || '—',
                status: s.status,
                valor: effectivePrice(s),
                plano: (s as any).saas_plans?.name || s.plan_tier || '—',
                metodo: s.metodo || '—',
                proximoVencimento: s.proximo_vencimento,
                diasAtraso: s.proximo_vencimento
                    ? Math.max(0, Math.floor((Date.now() - new Date(s.proximo_vencimento).getTime()) / 86400000))
                    : null,
            }))
            .sort((a, b) => (b.diasAtraso ?? 0) - (a.diasAtraso ?? 0));

        // 8. Lista completa de assinantes ativos
        const assinantesAtivos = allSubs
            .filter(s => s.status === SUB_STATUS.ACTIVE || s.status === SUB_STATUS.TRIAL)
            .map(s => ({
                id: s.id,
                orgName: (s as any).organizations?.name || '—',
                orgEmail: (s as any).organizations?.email || '—',
                status: s.status,
                plano: (s as any).saas_plans?.name || s.plan_tier || '—',
                tier: (s as any).saas_plans?.tier || s.plan_tier || '—',
                metodo: s.metodo || '—',
                valor: effectivePrice(s),
                precoBase: Number((s as any).saas_plans?.price ?? s.valor_mensal ?? 0),
                temDesconto: effectivePrice(s) < Number((s as any).saas_plans?.price ?? s.valor_mensal ?? 0),
                isIET: isFirstCycle(s),
                cobrancasPagas: s.cobrancas_pagas ?? 0,
                proximoVencimento: s.proximo_vencimento,
                since: s.created_at,
            }));

        // 9. Últimas cobranças
        const ultimasCobranças = allCharges.slice(0, 50).map(c => {
            const org = allSubs.find(s => s.organization_id === c.organization_id);
            return {
                id: c.id,
                orgName: org ? (org as any).organizations?.name || '—' : '—',
                amount: Number(c.amount ?? 0),
                status: c.status,
                paymentMethod: c.payment_method,
                paidAt: c.paid_at,
                createdAt: c.created_at,
            };
        });

        return NextResponse.json({
            kpis: {
                mrr,
                iet,
                totalReceita: mrr + iet,
                inadimplencia,
                totalAtivos,
                totalCancelados,
                totalPendentes,
                receitaTotal6m,
                ticketMedioMRR: totalAtivos > 0 ? mrr / totalAtivos : 0,
            },
            porPlano: Object.values(porPlano),
            porMetodo: Object.values(porMetodo),
            evolucaoReceita,
            pagamentosAbertos,
            assinantesAtivos,
            ultimasCobranças,
        });

    } catch (err: any) {
        console.error('[Admin Financeiro GET] Erro:', err);
        return NextResponse.json({ error: 'Falha ao buscar dados financeiros', detalhes: err.message }, { status: 500 });
    }
}
