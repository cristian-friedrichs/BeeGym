import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin, logSecurityEvent } from '@/lib/auth-utils';
import { withRateLimit } from '@/lib/rate-limit/limiter';
import {
    SUB_STATUS,
    ACTIVE_STATUSES,
    CHURN_STATUSES,
    isInTrial,
    TRIAL_WINDOW_DAYS,
} from '@/lib/admin/subscription-status';

const STATE_COORDS: Record<string, [number, number]> = {
    'AC': [-9.0238, -70.812], 'AL': [-9.5328, -36.6666], 'AP': [1.41, -51.7792],
    'AM': [-3.0626, -60.025], 'BA': [-12.9714, -38.5014], 'CE': [-3.7172, -38.5431],
    'DF': [-15.7942, -47.8822], 'ES': [-19.1834, -40.3089], 'GO': [-16.6869, -49.2648],
    'MA': [-2.5307, -44.3068], 'MT': [-15.601, -56.0979], 'MS': [-20.4697, -54.6201],
    'MG': [-19.9167, -43.9345], 'PA': [-1.4558, -48.5044], 'PB': [-7.1195, -34.845],
    'PR': [-25.4284, -49.2733], 'PE': [-8.0476, -34.877], 'PI': [-5.0919, -42.8034],
    'RJ': [-22.9068, -43.1729], 'RN': [-5.7945, -35.211], 'RS': [-30.0346, -51.2177],
    'RO': [-8.7612, -63.9039], 'RR': [2.8235, -60.6758], 'SC': [-27.5969, -48.5492],
    'SP': [-23.5505, -46.6333], 'SE': [-10.9472, -37.0731], 'TO': [-10.1837, -48.3336],
};

function generateMonthLabels(count: number) {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const now = new Date();
    return Array.from({ length: count }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
        return { label: months[d.getMonth()], monthKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` };
    });
}

export async function GET(request: NextRequest) {
    const rateLimitResponse = await withRateLimit(request, 30);
    if (rateLimitResponse) return rateLimitResponse;

    const auth = await requireAdmin(request);
    if ('error' in auth) return auth.error;

    try {
        const supabase = supabaseAdmin;

        // 1. Organizations
        const { data: orgs, error: orgErr } = await supabase
            .from('organizations')
            .select('id, name, business_type, student_range, address_city, address_state');

        // 2. Subscriptions — all (no status filter — we classify in JS with the correct enums)
        const { data: subs, error: subErr } = await supabase
            .from('saas_subscriptions')
            .select(`
                id,
                organization_id,
                status,
                valor_mensal,
                created_at,
                updated_at,
                saas_plans!saas_plan_id ( name, tier, price )
            `);

        if (orgErr || subErr) throw new Error('Falha ao consultar métricas');

        const now = new Date();
        const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

        // == KPIs ==
        let currentMRR = 0;
        let prevMRR = 0;
        let ativos = 0;
        let prevAtivos = 0;
        let emTrial = 0;
        let churn = 0;

        (subs || []).forEach(s => {
            if (!s.created_at) return;
            const dateObj = new Date(s.created_at);
            const mKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
            const trial = isInTrial(s.status, s.created_at);

            // ACTIVE + TRIAL count as billable assinantes
            if (s.status === SUB_STATUS.ACTIVE || s.status === SUB_STATUS.TRIAL) {
                currentMRR += Number(s.valor_mensal);
                ativos++;
                if (mKey <= prevMonthKey) {
                    prevMRR += Number(s.valor_mensal);
                    prevAtivos++;
                }
            }

            // Trial: stored as TRIAL OR within 7-day window and ACTIVE/PENDING
            if (trial) {
                emTrial++;
            }

            // Churn: CANCELED or PAST_DUE
            if (CHURN_STATUSES.includes(s.status as any)) {
                churn++;
            }
        });

        const mrrVariacao = prevMRR > 0 ? ((currentMRR - prevMRR) / prevMRR) * 100 : (currentMRR > 0 ? 100 : 0);
        const ativosVariacao = prevAtivos > 0 ? ((ativos - prevAtivos) / prevAtivos) * 100 : (ativos > 0 ? 100 : 0);

        const kpis = {
            mrr: currentMRR,
            mrrVariacao: Number(mrrVariacao.toFixed(1)),
            ativos,
            ativosVariacao: Number(ativosVariacao.toFixed(1)),
            emCarencia: emTrial,
            suspensos: churn,
        };

        // == Evolução Assinaturas 6 Meses (Novas vs Cancelamentos) ==
        const months6 = generateMonthLabels(6);
        const evolucaoAssinaturas = months6.map(m => {
            const novas = (subs || []).filter(s => {
                if (!s.created_at) return false;
                const d = new Date(s.created_at);
                const mKeyMatch = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                return (s.status === SUB_STATUS.ACTIVE || s.status === SUB_STATUS.TRIAL) && mKeyMatch === m.monthKey;
            }).length;

            const cancelamentos = (subs || []).filter(s => {
                const dateToUse = s.updated_at || s.created_at;
                if (!dateToUse) return false;
                const d = new Date(dateToUse);
                const mKeyMatch = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                return CHURN_STATUSES.includes(s.status as any) && mKeyMatch === m.monthKey;
            }).length;

            return { mes: m.label, novas, cancelamentos };
        });

        // == Histórico MRR (12 Meses — crescimento acumulado) ==
        const months12 = generateMonthLabels(12);
        const mrrHistorico = months12.map(m => {
            const mrrNoMes = (subs || []).filter(s => {
                if (!s.created_at) return false;
                const d = new Date(s.created_at);
                const mKeyInner = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                return (s.status === SUB_STATUS.ACTIVE || s.status === SUB_STATUS.TRIAL) && mKeyInner <= m.monthKey;
            }).reduce((acc, s) => acc + Number(s.valor_mensal), 0);

            return { mes: m.label, valor: mrrNoMes };
        });

        // == Rateio por Planos ==
        const planMap: Record<string, { name: string; receita: number; clientes: number }> = {};
        (subs || [])
            .filter(s => s.status === SUB_STATUS.ACTIVE || s.status === SUB_STATUS.TRIAL)
            .forEach(s => {
                const t = (s as any).saas_plans?.tier || 'N/A';
                if (!planMap[t]) planMap[t] = { name: t, receita: 0, clientes: 0 };
                planMap[t].receita += Number(s.valor_mensal);
                planMap[t].clientes++;
            });
        const planosRateio = Object.values(planMap);

        // == Rateio Tipo Cliente ==
        const typeMap: Record<string, { name: string; value: number; receita: number }> = {};
        (orgs || []).forEach(o => {
            const t = (o as any).business_type || 'Outros';
            if (!typeMap[t]) typeMap[t] = { name: t, value: 0, receita: 0 };
            typeMap[t].value++;
            const orgSub = (subs || []).find(s => s.organization_id === o.id && (s.status === SUB_STATUS.ACTIVE || s.status === SUB_STATUS.TRIAL));
            if (orgSub) typeMap[t].receita += Number(orgSub.valor_mensal);
        });
        const tipoClienteRateio = Object.values(typeMap);

        // == Rateio Faixa de Alunos ==
        const rangeMap: Record<string, { faixa: string; clientes: number; receita: number }> = {};
        (orgs || []).forEach(o => {
            const r = (o as any).student_range || 'Desconhecido';
            if (!rangeMap[r]) rangeMap[r] = { faixa: r, clientes: 0, receita: 0 };
            rangeMap[r].clientes++;
            const orgSub = (subs || []).find(s => s.organization_id === o.id && (s.status === SUB_STATUS.ACTIVE || s.status === SUB_STATUS.TRIAL));
            if (orgSub) rangeMap[r].receita += Number(orgSub.valor_mensal);
        });
        const faixaAlunosRateio = Object.values(rangeMap).map(rm => ({
            faixa: rm.faixa,
            clientes: rm.clientes,
            receita: rm.receita,
        }));

        // == Mapa de Clientes ==
        const geoMap: Record<string, any> = {};
        (orgs || []).forEach(o => {
            if (!(o as any).address_state) return;
            const st = (o as any).address_state.toUpperCase();
            if (!geoMap[st]) geoMap[st] = { id: st.toLowerCase(), name: (o as any).address_city ? `${(o as any).address_city}, ${st}` : st, position: STATE_COORDS[st] || STATE_COORDS['SP'], clientes: 0, radius: 2 };
            geoMap[st].clientes++;
            geoMap[st].radius = Math.min(25, 4 + geoMap[st].clientes * 2);
        });
        const mapaClientes = Object.values(geoMap);

        return NextResponse.json({
            kpis,
            mrrHistorico,
            evolucaoAssinaturas,
            planosRateio,
            tipoClienteRateio,
            faixaAlunosRateio,
            mapaClientes,
        });

    } catch (err: any) {
        console.error('[Admin Dashboard GET] Erro:', err);
        return NextResponse.json({ error: 'Falha ao buscar métricas', detalhes: err.message }, { status: 500 });
    }
}
