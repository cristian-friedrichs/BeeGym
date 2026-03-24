import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth-utils';
import { withRateLimit } from '@/lib/rate-limit/limiter';

export async function GET(request: NextRequest) {
    const rateLimitResponse = await withRateLimit(request, 30);
    if (rateLimitResponse) return rateLimitResponse;

    const auth = await requireAdmin(request);
    if ('error' in auth) return auth.error;

    try {
        const { searchParams } = new URL(request.url);
        const page = Number(searchParams.get('page') ?? 1);
        const limit = Number(searchParams.get('limit') ?? 20);
        const search = searchParams.get('search')?.toLowerCase() ?? '';
        const status = searchParams.get('status') ?? 'TODOS';
        // Note: The new saas_plans might not be fully linked.
        const planoStr = searchParams.get('plano') ?? 'TODOS';

        const supabase = supabaseAdmin;

        // Faz a query baseada em organizations para trazer todos os registrados!
        let query = supabase
            .from('organizations')
            .select(`
                id,
                name,
                email,
                contact_phone,
                address_city,
                address_state,
                cpf_cnpj,
                created_at,
                subscription_status,
                saas_subscriptions (
                    status,
                    metodo,
                    valor_mensal,
                    saas_plans!saas_plan_id ( name, tier )
                )
            `, { count: 'exact' });

        if (status !== 'TODOS') {
            query = query.eq('subscription_status', status.toLowerCase()); // organizations use basic strings or we map
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to).order('created_at', { ascending: false });

        const { data, count, error } = await query;

        if (error) throw error;

        // Count active students per organization
        const { data: activeStudents, error: studentsErr } = await supabase
            .from('students')
            .select('organization_id')
            .in('status', ['ACTIVE', 'TRIALING']);

        const studentCountMap = (activeStudents || []).reduce((acc: any, s: any) => {
            if (s.organization_id) {
                acc[s.organization_id] = (acc[s.organization_id] || 0) + 1;
            }
            return acc;
        }, {});

        let formatedData = (data as any[]).map(org => {
            // Se houver uma saas_subscription real (V2), nós pegamos. Se não, pegamos o base da org.
            // Para garantir fallback:
            const sub = org.saas_subscriptions && org.saas_subscriptions.length > 0 ? org.saas_subscriptions[0] : null;

            return {
                id: org.id,
                nome: org.name || 'Academia Sem Nome',
                email: org.email || '-',
                telefone: org.contact_phone || '-',
                cidade: org.address_city || '-',
                uf: org.address_state || '-',
                // Se não tem saas_subscription, mostra 'Sem Plano'
                plano: sub?.saas_plans?.name || sub?.saas_plans?.tier || 'Sem Plano',
                metodo: sub?.metodo || '-',
                // Utiliza o status da assinatura se existir, caso não usa da base
                status: sub?.status || org.subscription_status?.toUpperCase() || 'PENDENTE',
                valor_mensal: sub?.valor_mensal || 0,
                desde: org.created_at,
                cpf_cnpj: org.cpf_cnpj || '***.***.***-**',
                alunos_ativos: studentCountMap[org.id] || 0,
            };
        });

        if (search) {
            formatedData = formatedData.filter(c => c.nome.toLowerCase().includes(search) || c.email.toLowerCase().includes(search));
        }
        if (planoStr !== 'TODOS') {
            // In memory filter
            formatedData = formatedData.filter(c => c.plano === planoStr);
        }

        return NextResponse.json({
            data: formatedData,
            total: count || formatedData.length,
            page
        });

    } catch (err: any) {
        console.error('[Admin Clientes GET] Erro:', err);
        return NextResponse.json({ error: 'Erro ao buscar clientes' }, { status: 500 });
    }
}


