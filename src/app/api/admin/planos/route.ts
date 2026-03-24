import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { BEEGYM_PLANS } from '@/config/plans';
import { efiPlansService } from '@/payments/efi/efi.plans';
import { efiConfig } from '@/payments/efi/efi.config';
import { requireAdmin, logSecurityEvent } from '@/lib/auth-utils';
import { withRateLimit } from '@/lib/rate-limit/limiter';

export async function GET(request: NextRequest) {
    const rateLimitResponse = await withRateLimit(request, 30);
    if (rateLimitResponse) return rateLimitResponse;
    const auth = await requireAdmin(request);
    if ('error' in auth) return auth.error;
    try {
        const supabase = supabaseAdmin;

        // Fetch plans
        const { data: planos, error } = await supabase
            .from('saas_plans')
            .select('*')
            .order('price', { ascending: true });

        if (error) throw error;

        // Fetch active subscriptions count per plan
        const { data: subs, error: subsError } = await supabase
            .from('saas_subscriptions')
            .select('saas_plan_id, status')
            .in('status', ['ATIVO', 'TRIAL', 'PENDENTE']);

        if (subsError) throw subsError;

        // Calculate count
        const activeCountByPlan = subs.reduce((acc: any, sub: any) => {
            if (!sub.saas_plan_id) return acc;
            acc[sub.saas_plan_id] = (acc[sub.saas_plan_id] || 0) + 1;
            return acc;
        }, {});

        // Formata os dados no padrao esperado pela tabela do admin
        const payload = planos.map((p: any) => {
            const configPlan = BEEGYM_PLANS[`plan_${p.tier?.toLowerCase()}`];
            return {
                id: p.id,
                nome: p.name,
                descricao: p.description,
                tier: p.tier,
                valor_mensal: Number(p.price),
                intervalo: p.interval || 'Mensal',
                assinantes_ativos: activeCountByPlan[p.id] || 0,
                max_alunos: p.max_students || configPlan?.max_students || null,
                efi_plan_id_hml: p.efi_plan_id_hml,
                efi_plan_id_prd: p.efi_plan_id_prd,
                ativo: p.active,
                promo_price: p.promo_price ? Number(p.promo_price) : null,
                promo_months: p.promo_months || 0,
                allowed_features: p.allowed_features || [],
                marketing_subtitle: p.marketing_subtitle || '',
                marketing_highlights: p.marketing_highlights || [],
            };
        });

        return NextResponse.json(payload);
    } catch (err: any) {
        console.error('[Admin Planos GET] Erro:', err);
        return NextResponse.json({ error: 'Falha ao buscar planos do SaaS' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const rateLimitResponse = await withRateLimit(request, 10);
    if (rateLimitResponse) return rateLimitResponse;

    const auth = await requireAdmin(request);
    if ('error' in auth) return auth.error;

    try {
        logSecurityEvent('ADMIN_PLAN_CREATE', {
            userId: auth.user.id,
            path: request.nextUrl.pathname,
            action: 'create_plan'
        });

        const body = await request.json();
        const supabase = supabaseAdmin;

        // 1. Cria o Plano na Efí primeiro
        const isPrd = efiConfig.ambiente === 'producao';
        let newEfiId = null;

        try {
            newEfiId = await efiPlansService.criarPlano({
                name: `BeeGym ${body.nome}`,
                interval: 1, // mensal forçado por padrão na EFI
                repeats: body.repeticoes === 0 ? null : body.repeticoes
            });
        } catch (efiError: any) {
            console.error('[Admin Planos POST] Erro ao criar na EFI:', efiError.message);
            return NextResponse.json({ error: 'Falha ao criar plano no gateway de pagamento (EFI).' }, { status: 400 });
        }

        // 2. Insere novo plano do SaaS com a ID da EFI preenchida
        const { data: novoPlano, error } = await supabase
            .from('saas_plans')
            .insert({
                name: body.nome,
                description: body.descricao,
                tier: body.tier,
                price: body.valor_mensal,
                interval: body.intervalo || 'Mensal',
                efi_plan_id_hml: isPrd ? null : newEfiId,
                efi_plan_id_prd: isPrd ? newEfiId : null,
                promo_price: body.promo_price || null,
                promo_months: body.promo_months || null,
                allowed_features: body.allowed_features || [],
                marketing_subtitle: body.marketing_subtitle || null,
                marketing_highlights: body.marketing_highlights || [],
                max_students: body.max_alunos || null
            })
            .select('*')
            .single();

        if (error) throw error;

        return NextResponse.json({
            id: novoPlano.id,
            nome: novoPlano.name,
            descricao: novoPlano.description,
            tier: novoPlano.tier,
            valor_mensal: Number(novoPlano.price),
            intervalo: novoPlano.interval,
            assinantes_ativos: 0,
            efi_plan_id_hml: novoPlano.efi_plan_id_hml,
            efi_plan_id_prd: novoPlano.efi_plan_id_prd,
            ativo: novoPlano.active,
        }, { status: 201 });

    } catch (err: any) {
        console.error('[Admin Planos POST] Erro:', err);
        return NextResponse.json({ error: 'Falha ao criar plano' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const rateLimitResponse = await withRateLimit(request, 10);
    if (rateLimitResponse) return rateLimitResponse;

    const auth = await requireAdmin(request);
    if ('error' in auth) return auth.error;

    try {
        logSecurityEvent('ADMIN_PLAN_UPDATE', {
            userId: auth.user.id,
            path: request.nextUrl.pathname,
            action: 'update_plan'
        });

        const body = await request.json();
        const supabase = supabaseAdmin;

        const { id, ...updates } = body;

        // No PUT, verificamos se o gateway service suporta atualizarPlano. 
        // Como o lint avisou que não existia, vamos remover a chamada por enquanto 
        // para não quebrar o build, até termos certeza da API da EFI.
        /*
        if (updates.nome) {
            const isPrd = efiConfig.ambiente === 'producao';
            const efiPlanId = isPrd ? updates.efi_plan_id_prd : updates.efi_plan_id_hml;
            if (efiPlanId && efiPlansService.atualizarPlano) {
                 await efiPlansService.atualizarPlano({ ... });
            }
        }
        */

        const { data: planoAtualizado, error } = await supabase
            .from('saas_plans')
            .update({
                name: updates.nome,
                description: updates.descricao,
                tier: updates.tier,
                price: updates.valor_mensal,
                interval: updates.intervalo,
                promo_price: updates.promo_price || null,
                promo_months: updates.promo_months || null,
                allowed_features: updates.allowed_features || [],
                marketing_subtitle: updates.marketing_subtitle || null,
                marketing_highlights: updates.marketing_highlights || [],
                max_students: updates.max_alunos || null,
                active: updates.ativo,
            })
            .eq('id', id)
            .select('*')
            .single();

        if (error) throw error;

        return NextResponse.json({
            id: planoAtualizado.id,
            nome: planoAtualizado.name,
            descricao: planoAtualizado.description,
            tier: planoAtualizado.tier,
            valor_mensal: Number(planoAtualizado.price),
            intervalo: planoAtualizado.interval,
            assinantes_ativos: body.assinantes_ativos,
            efi_plan_id_hml: planoAtualizado.efi_plan_id_hml,
            efi_plan_id_prd: planoAtualizado.efi_plan_id_prd,
            ativo: planoAtualizado.active,
        });

    } catch (err: any) {
        console.error('[Admin Planos PUT] Erro:', err);
        return NextResponse.json({ error: 'Falha ao atualizar plano' }, { status: 500 });
    }
}
