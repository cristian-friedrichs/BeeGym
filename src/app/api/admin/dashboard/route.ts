import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Helpers para Mapa e Agrupamento de Meses
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

export async function GET() {
    try {
        const supabase = supabaseAdmin;

        // 1. Busca Organizacoes (Contratantes / Clientes)
        const { data: orgs, error: orgErr } = await supabase
            .from('organizations')
            .select('*');

        // 2. Busca Assinaturas (Faturamento e Status)
        const { data: subs, error: subErr } = await supabase
            .from('saas_subscriptions')
            .select(`
                *,
                saas_plans!saas_plan_id ( name, tier, price )
            `);

        if (orgErr || subErr) throw new Error('Falha ao consultar métricas');

        const now = new Date();
        const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

        // == KPIs ==
        let currentMRR = 0;
        let prevMRR = 0;
        let ativos = 0;
        let prevAtivos = 0;
        let emCarencia = 0; // Agora é Trial
        let suspensos = 0; // Agora é Churn

        (subs || []).forEach(s => {
            if (!s.created_at) return;
            const dateObj = new Date(s.created_at);
            const mKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;

            // MRR e Ativos consideram ATIVO, TRIAL, PENDENTE e TESTE
            if (['ATIVO', 'TRIAL', 'PENDENTE', 'TESTE'].includes(s.status)) {
                currentMRR += Number(s.valor_mensal);
                ativos++;
                if (mKey <= prevMonthKey) {
                    prevMRR += Number(s.valor_mensal);
                    prevAtivos++;
                }
            }

            // Trial é apenas TRIAL
            if (s.status === 'TRIAL') {
                emCarencia++;
            }

            // Churn são inativos/cancelados
            if (['INATIVO', 'CANCELADO'].includes(s.status)) {
                suspensos++;
            }
        });

        const mrrVariacao = prevMRR > 0 ? ((currentMRR - prevMRR) / prevMRR) * 100 : (currentMRR > 0 ? 100 : 0);
        const ativosVariacao = prevAtivos > 0 ? ((ativos - prevAtivos) / prevAtivos) * 100 : (ativos > 0 ? 100 : 0);

        const kpis = {
            mrr: currentMRR,
            mrrVariacao: Number(mrrVariacao.toFixed(1)),
            ativos,
            ativosVariacao: Number(ativosVariacao.toFixed(1)),
            emCarencia,
            suspensos,
        };

        // == Evolução Assinaturas 6 Meses ==
        const months6 = generateMonthLabels(6);
        const evolucaoAssinaturas = months6.map(m => {
            const novas = (subs || []).filter(s => {
                if (!s.created_at) return false;
                const d = new Date(s.created_at);
                const mKeyMatch = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

                // Incluímos PENDENTE nas novas assinaturas para o gráfico bater com o KPI de "Novas do Dia/Mes"
                const isValidStatus = ['ATIVO', 'TRIAL', 'PENDENTE', 'TESTE'].includes(s.status);
                return isValidStatus && mKeyMatch === m.monthKey;
            }).length;

            const cancelamentos = (subs || []).filter(s => {
                const dateToUse = s.updated_at || s.created_at;
                if (!dateToUse) return false;
                const d = new Date(dateToUse);
                const mKeyMatch = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                return (s.status === 'INATIVO' || s.status === 'CANCELADO') && mKeyMatch === m.monthKey;
            }).length;

            return { mes: m.label, novas, cancelamentos };
        });

        // == Historico MRR (12 Meses Crescimento) ==
        // Ajustado para mostrar o MRR acumulado conforme ele cresceu nos meses
        const months12 = generateMonthLabels(12);
        const mrrHistorico = months12.map(m => {
            const mrrNoMes = (subs || []).filter(s => {
                if (!s.created_at) return false;
                const d = new Date(s.created_at);
                const mKeyInner = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

                // No histórico, mostramos MRR de quem já estava ATIVO ou TRIAL naquele mês
                // e que foi criado até aquele mês.
                const isCreatedUntilThisMonth = mKeyInner <= m.monthKey;
                const wasActuallyPaid = ['ATIVO', 'TRIAL'].includes(s.status);

                return wasActuallyPaid && isCreatedUntilThisMonth;
            }).reduce((acc, s) => acc + Number(s.valor_mensal), 0);

            return { mes: m.label, valor: mrrNoMes };
        });

        // == Rateio por Planos ==
        const planMap: Record<string, { name: string; receita: number; clientes: number }> = {};
        (subs || []).filter(s => ['ATIVO', 'TRIAL', 'TESTE'].includes(s.status)).forEach(s => {
            const t = s.saas_plans?.tier || 'N/A';
            if (!planMap[t]) planMap[t] = { name: t, receita: 0, clientes: 0 };
            planMap[t].receita += Number(s.valor_mensal);
            planMap[t].clientes++;
        });
        const planosRateio = Object.values(planMap);

        // == Rateio Tipo Cliente (Baseado em organizações e suas assinaturas) ==
        const typeMap: Record<string, { name: string; value: number; receita: number }> = {};
        (orgs || []).forEach(o => {
            const t = o.business_type || 'Outros';
            if (!typeMap[t]) typeMap[t] = { name: t, value: 0, receita: 0 };
            typeMap[t].value++;

            // Tenta achar a receita dessa org nas assinaturas
            const orgSub = (subs || []).find(s => s.organization_id === o.id && ['ATIVO', 'TRIAL', 'TESTE'].includes(s.status));
            if (orgSub) {
                typeMap[t].receita += Number(orgSub.valor_mensal);
            }
        });
        const tipoClienteRateio = Object.values(typeMap);

        // == Rateio Faixa Alunos ==
        const rangeMap: Record<string, { faixa: string; clientes: number; receita: number }> = {};
        (orgs || []).forEach(o => {
            const r = o.student_range || 'Desconhecido';
            if (!rangeMap[r]) rangeMap[r] = { faixa: r, clientes: 0, receita: 0 };
            rangeMap[r].clientes++;

            const orgSub = (subs || []).find(s => s.organization_id === o.id && ['ATIVO', 'TRIAL', 'TESTE'].includes(s.status));
            if (orgSub) {
                rangeMap[r].receita += Number(orgSub.valor_mensal);
            }
        });
        const faixaAlunosRateio = Object.values(rangeMap).map(rm => ({
            faixa: rm.faixa,
            clientes: rm.clientes,
            receita: rm.receita
        }));

        // == Mapa de Clientes ==
        const geoMap: Record<string, any> = {};
        (orgs || []).forEach(o => {
            if (!o.address_state) return;
            const st = o.address_state.toUpperCase();
            if (!geoMap[st]) geoMap[st] = { id: st.toLowerCase(), name: o.address_city ? `${o.address_city}, ${st} ` : st, position: STATE_COORDS[st] || STATE_COORDS['SP'], clientes: 0, radius: 2 };
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
            mapaClientes
        });

    } catch (err: any) {
        console.error('[Admin Dashboard GET] Erro:', err);
        return NextResponse.json({ error: 'Falha ao buscar métricas', detalhes: err.message }, { status: 500 });
    }
}

