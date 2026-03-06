import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { BEEGYM_PLANS } from '@/config/plans';
import { efiPlansService } from '@/payments/efi/efi.plans';
import { efiConfig } from '@/payments/efi/efi.config';

export async function GET() {
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
                max_alunos: configPlan?.max_students || null,
                efi_plan_id_hml: p.efi_plan_id_hml,
                efi_plan_id_prd: p.efi_plan_id_prd,
                ativo: p.active,
            };
        });

        return NextResponse.json(payload);
    } catch (err: any) {
        console.error('[Admin Planos GET] Erro:', err);
        return NextResponse.json({ error: 'Falha ao buscar planos do SaaS' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const supabase = supabaseAdmin;

        // 1. Cria o Plano na Efí primeiro (Para garantir que não teremos planos "órfãos" no DB sem id na EFI)
        const isPrd = efiConfig.ambiente === 'producao';
        let newEfiId = null;

        try {
            newEfiId = await efiPlansService.criarPlano({
                name: `BeeGym ${body.nome}`,
                interval: 1, // mensal forçado por padrão na EFI
                repeats: null // contínuo
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

