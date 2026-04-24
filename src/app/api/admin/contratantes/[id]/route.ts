import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin, logSecurityEvent } from '@/lib/auth-utils';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAdmin(request);
    if ('error' in auth) return auth.error;

    try {
        const { id } = await params;
        const supabase = supabaseAdmin;

        // 1. Busca Organizacao
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', id)
            .single();

        if (orgError) {
            console.warn('[Admin Contratante] Org não encontrada:', orgError.message);
            return NextResponse.json({ error: 'Contratante não encontrado' }, { status: 404 });
        }

        // 2. Busca Assinatura do SaaS (Recente)
        const { data: sub } = await supabase
            .from('saas_subscriptions')
            .select(`
                *,
                saas_plans!saas_plan_id ( name, tier )
            `)
            .eq('organization_id', id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        const contratante = {
            id: org.id,
            nome: org.name,
            email: org.email || '-',
            telefone: org.contact_phone || '-',
            cpf_cnpj: org.cpf_cnpj || 'Não informado',
            endereco: [org.address_line1, org.address_number, org.address_city, org.address_state]
                .filter(Boolean)
                .join(', ') || 'Não informado',
            desde: org.created_at,
        };

        const assinatura = sub ? {
            plano: sub.saas_plans?.name || sub.saas_plans?.tier || 'Sem Plano',
            plano_tier: sub.saas_plans?.tier || sub.plan_tier || null,
            saas_plan_id: sub.saas_plan_id,
            metodo: sub.metodo,
            status: sub.status,
            valor_mensal: sub.valor_mensal,
            proximo_vencimento: sub.proximo_vencimento,

            manual_discount_amount: sub.manual_discount_amount,
            manual_discount_percentage: sub.manual_discount_percentage,
        } : {
            plano: 'Sem Assinatura',
            plano_tier: null,
            saas_plan_id: null,
            metodo: '-',
            status: org.subscription_status?.toUpperCase() || 'INATIVA',
            valor_mensal: 0,
            proximo_vencimento: null,

            manual_discount_amount: null,
            manual_discount_percentage: null,
        };

        // Contar alunos ativos
        const { count: alunosAtivos } = await supabase
            .from('students')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', id)
            .in('status', ['ACTIVE', 'TRIALING']);

        // 3. Busca Histórico de Cobranças na tabela saas_charges
        const { data: charges } = await supabase
            .from('saas_charges')
            .select('*')
            .eq('organization_id', id)
            .order('created_at', { ascending: false });

        const cobrancas = (charges || []).map(c => ({
            id: c.id,
            data: c.paid_at || c.created_at,
            valor: Number(c.amount),
            status: c.status
        }));

        return NextResponse.json({ contratante, assinatura, cobrancas, alunos_ativos: alunosAtivos || 0 });

    } catch (err: any) {
        console.error('[Admin Contratante] Erro interno:', err);
        return NextResponse.json({ error: 'Erro interno ao carregar contratante' }, { status: 500 });
    }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAdmin(request);
    if ('error' in auth) return auth.error;

    try {
        logSecurityEvent('ADMIN_CONTRATANTE_ACTION', {
            userId: auth.user.id,
            path: request.nextUrl.pathname,
            action: 'manage_subscription'
        });
        const { id } = await params;
        const body = await request.json(); // Pega body com status/acao

        // A acao suspender/restaurar/cancelar vai atualizar o status da Assinatura e da Organizacao
        const action = body.action;

        const supabase = supabaseAdmin;

        let newStatus = '';
        const messages: Record<string, string> = {
            suspender: `Acesso do contratante ${id} suspenso.`,
            restaurar: `Acesso do contratante ${id} restaurado.`,
            cancelar: `Assinatura do contratante ${id} cancelada.`,
        };

        if (action === 'suspender') newStatus = 'INADIMPLENTE';
        else if (action === 'restaurar') newStatus = 'ATIVO';
        else if (action === 'cancelar') newStatus = 'INATIVO';
        else return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });

        // Atualiza a assinatura recente
        const { data: subToUpdate } = await supabase
            .from('saas_subscriptions')
            .select('id')
            .eq('organization_id', id)
            .order('created_at', { ascending: false })
            .limit(1).single();

        if (subToUpdate) {
            await supabase
                .from('saas_subscriptions')
                .update({ status: newStatus })
                .eq('id', subToUpdate.id);
        }

        // Também marcarmos subscription_status na org (opcional mas bom)
        await supabase
            .from('organizations')
            .update({ subscription_status: newStatus })
            .eq('id', id);

        return NextResponse.json({ success: true, message: messages[action] });
    } catch (err) {
        console.error('[Admin Contratante POST] Erro ao gerir assinatura:', err);
        return NextResponse.json({ error: 'Falha ao gerenciar assinatura' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAdmin(request);
    if ('error' in auth) return auth.error;

    try {
        const { id } = await params;
        const body = await request.json();
        const { name, phone, address, document } = body;

        const { SupabaseContratanteRepository } = await import('@/application/repositories/SupabaseContratanteRepository');

        const success = await SupabaseContratanteRepository.updateBasicInfo(id, { name, phone, address, document });

        if (!success) {
            return NextResponse.json({ error: 'Falha ao atualizar dados do contratante.' }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: 'Dados atualizados com sucesso.' });
    } catch (err) {
        console.error('[Admin Contratante PUT] Erro:', err);
        return NextResponse.json({ error: 'Erro interno ao atualizar dados.' }, { status: 500 });
    }
}
