import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
    try {
        const supabase = supabaseAdmin;
        const { data: planos, error } = await supabase
            .from('saas_plans')
            .select('*')
            .order('price', { ascending: true });

        if (error) throw error;

        // Formata os dados no padrao esperado pela tabela do admin
        const payload = planos.map((p: any) => ({
            id: p.id,
            nome: p.name,
            descricao: p.description,
            tier: p.tier,
            valor_mensal: Number(p.price),
            intervalo: p.interval || 'Mensal',
            assinantes_ativos: 0, // Mock visual por enquanto, será preenchido via count na tabela de saas_subscriptions futuramente
            efi_plan_id_hml: p.efi_plan_id_hml,
            efi_plan_id_prd: p.efi_plan_id_prd,
            ativo: p.active,
        }));

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

        // Insere novo plano do SaaS
        const { data: novoPlano, error } = await supabase
            .from('saas_plans')
            .insert({
                name: body.nome,
                description: body.descricao,
                tier: body.tier,
                price: body.valor_mensal,
                interval: body.intervalo || 'Mensal'
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
