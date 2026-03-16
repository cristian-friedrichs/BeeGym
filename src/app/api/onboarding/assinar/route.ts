import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { CreateSubscriptionUseCase } from '@/application/use-cases/subscription/CreateSubscriptionUseCase';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();

        // Verificar autenticação
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Buscar perfil para encontrar o organization_id
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return NextResponse.json({ error: 'Cadastro incompleto. Preencha os dados da empresa.' }, { status: 400 });
        }

        // Buscar dados da organização (incluindo CPF/CNPJ para PIX)
        const { data: org, error: orgError } = await supabaseAdmin
            .from('organizations')
            .select('id, name, cpf_cnpj, subscription_status')
            .eq('id', profile.organization_id)
            .single();

        if (orgError || !org) {
            return NextResponse.json({ error: 'Organização não encontrada.' }, { status: 400 });
        }

        // Verificar se já existe assinatura ativa — evitar cobrança dupla
        // Usa supabaseAdmin para contornar RLS em contas em onboarding
        const { data: assinaturaExistente } = await supabaseAdmin
            .from('saas_subscriptions')
            .select('id, status')
            .eq('organization_id', org.id)
            .in('status', ['ATIVO', 'TRIAL']) // Removido 'PENDENTE' para permitir re-tentativas
            .limit(1)
            .maybeSingle();

        if (assinaturaExistente) {
            return NextResponse.json({
                error: 'Já existe uma assinatura ativa para esta conta.',
                redirect: '/app/painel',
            }, { status: 409 });
        }

        const body = await req.json();
        const { planoId, metodo, paymentToken, billingAddress, customerData, devedorNome, devedorCpf, couponId } = body;

        // Validações básicas
        if (!planoId || !metodo) {
            return NextResponse.json({ error: 'planoId e metodo são obrigatórios' }, { status: 400 });
        }
        if (metodo === 'CARTAO_RECORRENTE' && !paymentToken) {
            return NextResponse.json({ error: 'payment_token é obrigatório para cartão' }, { status: 400 });
        }

        // Buscar o plano da tabela saas_plans (usando admin para contornar RLS)
        const { data: plano, error: planoError } = await supabaseAdmin
            .from('saas_plans')
            .select('id, name, tier, price, efi_plan_id_hml, efi_plan_id_prd, promo_price, promo_months')
            .eq('id', planoId)
            .eq('active', true)
            .single();

        if (planoError || !plano) {
            return NextResponse.json({ error: 'Plano inválido ou inativo' }, { status: 400 });
        }

        // Verificar se existe assinatura com AGUARDANDO_PAGAMENTO para atualizar
        const { data: pendingSub } = await supabaseAdmin
            .from('saas_subscriptions')
            .select('id')
            .eq('organization_id', org.id)
            .eq('status', 'AGUARDANDO_PAGAMENTO')
            .limit(1)
            .maybeSingle();

        const useCase = new CreateSubscriptionUseCase();
        const resultado = await useCase.execute({
            contratanteId: org.id,
            planoId: plano.id,
            metodo,
            paymentToken,
            billingAddress,
            customerData,
            devedorCpf: (devedorCpf || org.cpf_cnpj)?.replace(/\D/g, ''),
            devedorNome: devedorNome || org.name,
            couponId
        });

        // Se existia assinatura pendente, atualizar ao invés de duplicar
        if (pendingSub) {
            await supabaseAdmin
                .from('saas_subscriptions')
                .update({
                    status: 'TRIAL',
                    metodo,
                    saas_plan_id: plano.id,
                    valor_mensal: plano.price,
                    dia_vencimento: new Date().getDate(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', pendingSub.id);
        }

        // ✅ Após pagamento solicitado: atualizar status da organização
        // Mantemos onboarding_completed: false para PIX para não disparar o redirect do middleware prematuramente
        const isPix = metodo === 'PIX_AUTOMATICO';
        const acessoLiberado = resultado.acessoLiberado === true;

        await supabaseAdmin
            .from('organizations')
            .update({
                subscription_status: isPix ? 'aguardando_pagamento' : 'trial',
                onboarding_completed: !isPix && acessoLiberado, // Cartão aprovado -> Finaliza. Pix -> Aguarda botão.
                updated_at: new Date().toISOString(),
            })
            .eq('id', org.id);

        return NextResponse.json(resultado, { status: 200 });

    } catch (err: any) {
        const msg = err.message || 'Erro desconhecido';
        const stack = err.stack || '';

        // Log persistente em arquivo
        const logEntry = `\n--- [${new Date().toISOString()}] ERRO 500 ---\nURL: POST /api/onboarding/assinar\nErro: ${msg}\nStack: ${stack}\n`;
        try { fs.appendFileSync('debug_onboarding.log', logEntry); } catch (e) { }

        console.error('[Onboarding Assinar] Erro:', msg);
        console.error('[Onboarding Assinar] Stack:', err.stack);
        // Log detalhado da resposta da EFI para diagnóstico
        if (err.response) {
            const efiError = `EFI Error Status: ${err.response.status}\nData: ${JSON.stringify(err.response.data, null, 2)}\n`;
            try { fs.appendFileSync('debug_onboarding.log', efiError); } catch (e) { }

            console.error('[EFI 404 Debug] URL da falha:', err.config?.url);
            console.error('[Onboarding Assinar] Resposta da EFI:', {
                status: err.response.status,
                statusText: err.response.statusText,
                data: err.response.data,
                headers: err.response.headers,
            });
        }
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
