import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth-utils';
import { withRateLimit } from '@/lib/rate-limit/limiter';
import { SUB_STATUS, isInTrial } from '@/lib/admin/subscription-status';

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
        const statusFilter = searchParams.get('status') ?? 'TODOS';
        const planoStr = searchParams.get('plano') ?? 'TODOS';

        const supabase = supabaseAdmin;

        // Fetch ALL orgs with their latest subscription (status filtering done in JS
        // so we can apply the 7-day Trial window logic correctly)
        const { data, count, error } = await supabase
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
                    id,
                    status,
                    metodo,
                    valor_mensal,
                    created_at,
                    saas_plans!saas_plan_id ( name, tier )
                )
            `, { count: 'exact' })
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Count active students per organization
        const { data: activeStudents } = await supabase
            .from('students')
            .select('organization_id')
            .in('status', ['ACTIVE', 'TRIALING']);

        const studentCountMap = (activeStudents || []).reduce((acc: Record<string, number>, s: any) => {
            if (s.organization_id) acc[s.organization_id] = (acc[s.organization_id] || 0) + 1;
            return acc;
        }, {});

        let formattedData = (data as any[]).map(org => {
            // Supabase can return saas_subscriptions as array OR single object depending on the
            // relationship type resolved at query time — normalise to always get the first item.
            const rawSubs = org.saas_subscriptions;
            const sub: any = Array.isArray(rawSubs)
                ? (rawSubs.length > 0 ? rawSubs[0] : null)
                : (rawSubs ?? null);

            // Derive effective status: prefer saas_subscriptions, fall back to org field
            const rawStatus: string = sub?.status || org.subscription_status || SUB_STATUS.PENDING;

            // Apply 7-day trial window: any ACTIVE/PENDING within 7 days is displayed as TRIAL
            const subCreatedAt: string = sub?.created_at || org.created_at;
            const effectiveStatus = isInTrial(rawStatus, subCreatedAt) ? SUB_STATUS.TRIAL : rawStatus;

            return {
                id: org.id,
                nome: org.name || 'Academia Sem Nome',
                email: org.email || '-',
                telefone: org.contact_phone || '-',
                cidade: org.address_city || '-',
                uf: org.address_state || '-',
                plano: sub?.saas_plans?.name || sub?.saas_plans?.tier || 'Sem Plano',
                plano_tier: sub?.saas_plans?.tier || null,
                metodo: sub?.metodo || '-',
                status: effectiveStatus,
                valor_mensal: sub?.valor_mensal || 0,
                desde: org.created_at,
                cpf_cnpj: org.cpf_cnpj || '***.***.***-**',
                alunos_ativos: studentCountMap[org.id] || 0,
            };
        });

        // Apply in-memory filters (search + status + plano)
        if (search) {
            formattedData = formattedData.filter(c =>
                c.nome.toLowerCase().includes(search) ||
                c.email.toLowerCase().includes(search) ||
                (c.cpf_cnpj && c.cpf_cnpj.includes(search))
            );
        }

        if (statusFilter !== 'TODOS') {
            formattedData = formattedData.filter(c => c.status === statusFilter);
        }

        if (planoStr !== 'TODOS') {
            formattedData = formattedData.filter(c => c.plano_tier === planoStr || c.plano === planoStr);
        }

        // Manual pagination after in-memory filter
        const totalFiltered = formattedData.length;
        const from = (page - 1) * limit;
        const paginated = formattedData.slice(from, from + limit);

        return NextResponse.json({
            data: paginated,
            total: totalFiltered,
            page,
        });

    } catch (err: any) {
        console.error('[Admin Clientes GET] Erro:', err);
        return NextResponse.json({ error: 'Erro ao buscar clientes' }, { status: 500 });
    }
}
