import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export type ReportType =
    | 'receita_por_plano'
    | 'contratantes_ativos'
    | 'assinaturas_por_status'
    | 'churn_mensal'
    | 'contratantes_por_cidade';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const tipo = searchParams.get('tipo') as ReportType;
        const de = searchParams.get('de');
        const ate = searchParams.get('ate');
        const plano = searchParams.get('plano');

        const supabase = supabaseAdmin;

        switch (tipo) {
            case 'receita_por_plano': {
                const { data, error } = await supabase
                    .from('saas_subscriptions')
                    .select(`
                        valor_mensal,
                        status,
                        saas_plans!saas_plan_id ( name, tier )
                    `)
                    .in('status', ['ATIVO', 'TRIAL']);

                if (error) throw error;

                const grouped: Record<string, { plano: string; receita: number; qtd: number }> = {};
                for (const sub of (data as any[])) {
                    const tier = sub.saas_plans?.tier || 'N/A';
                    if (!grouped[tier]) grouped[tier] = { plano: tier, receita: 0, qtd: 0 };
                    grouped[tier].receita += Number(sub.valor_mensal);
                    grouped[tier].qtd += 1;
                }

                return NextResponse.json({
                    titulo: 'Receita por Plano',
                    colunas: ['Plano', 'Assinantes', 'Receita Mensal (R$)'],
                    linhas: Object.values(grouped).map(g => [g.plano, g.qtd, g.receita.toFixed(2)]),
                });
            }

            case 'contratantes_ativos': {
                let query = supabase
                    .from('saas_subscriptions')
                    .select(`
                        status,
                        metodo,
                        valor_mensal,
                        created_at,
                        organizations ( name, email, address_city, address_state ),
                        saas_plans!saas_plan_id ( tier )
                    `)
                    .in('status', ['ATIVO', 'TRIAL']);

                if (de) query = query.gte('created_at', de);
                if (ate) query = query.lte('created_at', ate);

                const { data, error } = await query;
                if (error) throw error;

                let rows = (data as any[]).map(s => [
                    s.organizations?.name || '-',
                    s.organizations?.email || '-',
                    s.saas_plans?.tier || '-',
                    s.metodo,
                    Number(s.valor_mensal).toFixed(2),
                    `${s.organizations?.address_city || '-'}/${s.organizations?.address_state || '-'}`,
                    new Date(s.created_at).toLocaleDateString('pt-BR'),
                ]);

                if (plano && plano !== 'TODOS') {
                    rows = rows.filter(r => r[2] === plano);
                }

                return NextResponse.json({
                    titulo: 'Contratantes Ativos',
                    colunas: ['Nome', 'E-mail', 'Plano', 'Método', 'Valor (R$)', 'Cidade/UF', 'Desde'],
                    linhas: rows,
                });
            }

            case 'assinaturas_por_status': {
                const { data, error } = await supabase
                    .from('saas_subscriptions')
                    .select(`
                        status,
                        metodo,
                        valor_mensal,
                        created_at,
                        organizations ( name ),
                        saas_plans!saas_plan_id ( tier )
                    `);

                if (error) throw error;

                const rows = (data as any[]).map(s => [
                    s.organizations?.name || '-',
                    s.saas_plans?.tier || '-',
                    s.status,
                    s.metodo,
                    Number(s.valor_mensal).toFixed(2),
                    new Date(s.created_at).toLocaleDateString('pt-BR'),
                ]);

                return NextResponse.json({
                    titulo: 'Assinaturas por Status',
                    colunas: ['Contratante', 'Plano', 'Status', 'Método', 'Valor (R$)', 'Desde'],
                    linhas: rows,
                });
            }

            case 'churn_mensal': {
                const { data, error } = await supabase
                    .from('saas_subscriptions')
                    .select(`
                        status,
                        updated_at,
                        valor_mensal,
                        organizations ( name ),
                        saas_plans!saas_plan_id ( tier )
                    `)
                    .in('status', ['INATIVO', 'INADIMPLENTE']);

                if (error) throw error;

                const rows = (data as any[]).map(s => [
                    s.organizations?.name || '-',
                    s.saas_plans?.tier || '-',
                    s.status,
                    Number(s.valor_mensal).toFixed(2),
                    new Date(s.updated_at).toLocaleDateString('pt-BR'),
                ]);

                return NextResponse.json({
                    titulo: 'Churn / Cancelamentos',
                    colunas: ['Contratante', 'Plano', 'Status', 'Valor Perdido (R$)', 'Data'],
                    linhas: rows,
                });
            }

            case 'contratantes_por_cidade': {
                const { data, error } = await supabase
                    .from('saas_subscriptions')
                    .select(`
                        organizations ( address_city, address_state ),
                        saas_plans!saas_plan_id ( tier )
                    `)
                    .in('status', ['ATIVO', 'TRIAL']);

                if (error) throw error;

                const grouped: Record<string, { cidade: string; uf: string; qtd: number }> = {};
                for (const s of (data as any[])) {
                    const city = s.organizations?.address_city || 'N/A';
                    const uf = s.organizations?.address_state || '-';
                    const key = `${city}/${uf}`;
                    if (!grouped[key]) grouped[key] = { cidade: city, uf, qtd: 0 };
                    grouped[key].qtd += 1;
                }

                const sorted = Object.values(grouped).sort((a, b) => b.qtd - a.qtd);

                return NextResponse.json({
                    titulo: 'Contratantes por Cidade',
                    colunas: ['Cidade', 'UF', 'Contratantes Ativos'],
                    linhas: sorted.map(g => [g.cidade, g.uf, g.qtd]),
                });
            }

            default:
                return NextResponse.json({ error: 'Tipo de relatório inválido' }, { status: 400 });
        }
    } catch (err: any) {
        console.error('[Admin Relatórios] Erro:', err);
        return NextResponse.json({ error: 'Falha ao gerar relatório' }, { status: 500 });
    }
}
