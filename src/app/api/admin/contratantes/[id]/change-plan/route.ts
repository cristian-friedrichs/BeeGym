import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { BEEGYM_PLANS } from '@/config/plans';
import { requireAdmin, logSecurityEvent } from '@/lib/auth-utils';
import { withRateLimit } from '@/lib/rate-limit/limiter';

const NON_PAYING_STATUSES = ['TESTE', 'DEMO', 'AGUARDANDO_PAGAMENTO', 'TESTE_MANUAL'];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const rateLimitResponse = await withRateLimit(req, 10);
    if (rateLimitResponse) return rateLimitResponse;

    const auth = await requireAdmin(req);
    if ('error' in auth) return auth.error;

    logSecurityEvent('ADMIN_CHANGE_PLAN', {
        userId: auth.user.id,
        path: req.nextUrl.pathname,
        action: 'change_plan'
    });

    try {
        const { id: orgId } = await params;
        const { newPlanId } = await req.json();

        if (!newPlanId) {
            return NextResponse.json({ error: 'newPlanId é obrigatório.' }, { status: 400 });
        }

        // 1. Buscar novo plano
        const { data: newPlan, error: planErr } = await supabaseAdmin
            .from('saas_plans')
            .select('id, name, tier, price')
            .eq('id', newPlanId)
            .eq('active', true)
            .single();

        if (planErr || !newPlan) {
            return NextResponse.json({ error: 'Plano inválido ou inativo.' }, { status: 400 });
        }

        // 2. Buscar assinatura atual
        const { data: currentSub } = await supabaseAdmin
            .from('saas_subscriptions')
            .select('id, status, saas_plan_id, valor_mensal, metodo, dia_vencimento, proximo_vencimento, saas_plans!saas_plan_id ( name, tier, price )')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        // Se não existe assinatura, criar uma nova com o plano escolhido
        if (!currentSub) {
            // Buscar status atual da org
            const { data: org } = await supabaseAdmin
                .from('organizations')
                .select('subscription_status')
                .eq('id', orgId)
                .single();

            const orgStatus = org?.subscription_status?.toUpperCase() || 'PENDENTE';
            const subStatus = ['TESTE', 'DEMO'].includes(orgStatus) ? orgStatus : 'ATIVO';

            await supabaseAdmin
                .from('saas_subscriptions')
                .insert({
                    organization_id: orgId,
                    saas_plan_id: newPlan.id,
                    plan_tier: newPlan.tier,
                    status: subStatus,
                    metodo: 'MANUAL_ADMIN',
                    valor_mensal: Number(newPlan.price) || 0,
                    dia_vencimento: new Date().getDate(),
                });

            return NextResponse.json({
                success: true,
                type: 'NEW_SUBSCRIPTION',
                message: `Plano ${newPlan.name} atribuído com sucesso.`,
            });
        }

        const sub = currentSub as any;
        const isNonPaying = NON_PAYING_STATUSES.includes(sub.status);
        const currentPrice = Number(sub.valor_mensal) || 0;
        const newPrice = Number(newPlan.price) || 0;
        const isUpgrade = newPrice > currentPrice;
        const isDowngrade = newPrice < currentPrice;

        // 3. Validar alunos ativos para downgrade
        if (isDowngrade || (!isUpgrade && newPlan.tier !== sub.saas_plans?.tier)) {
            const configPlan = BEEGYM_PLANS[`plan_${newPlan.tier?.toLowerCase()}`];
            const maxStudents = configPlan?.max_students || null;

            if (maxStudents) {
                const { count: activeStudents } = await supabaseAdmin
                    .from('students')
                    .select('id', { count: 'exact', head: true })
                    .eq('organization_id', orgId)
                    .in('status', ['ACTIVE', 'TRIALING']);

                if ((activeStudents || 0) > maxStudents) {
                    return NextResponse.json({
                        error: `O plano ${newPlan.name} suporta até ${maxStudents} alunos. Esta organização tem ${activeStudents} alunos ativos. Reduza o número de alunos antes de fazer o downgrade.`,
                        type: 'STUDENT_LIMIT'
                    }, { status: 400 });
                }
            }
        }

        // 4. Conta sem pagamento → troca direta
        if (isNonPaying) {
            await supabaseAdmin
                .from('saas_subscriptions')
                .update({
                    saas_plan_id: newPlan.id,
                    plan_tier: newPlan.tier,
                    valor_mensal: newPrice,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', sub.id);

            return NextResponse.json({
                success: true,
                type: 'DIRECT_CHANGE',
                message: `Plano alterado para ${newPlan.name} com sucesso.`,
            });
        }

        // 5. Upgrade (pagante) → calcular proporcional
        if (isUpgrade) {
            const proratedAmount = calculateProration(currentPrice, newPrice, sub.dia_vencimento);

            // Registrar cobrança de upgrade
            await supabaseAdmin
                .from('saas_charges')
                .insert({
                    organization_id: orgId,
                    saas_subscription_id: sub.id,
                    amount: proratedAmount,
                    status: 'PENDENTE',
                    payment_method: sub.metodo || 'MANUAL_ADMIN',
                    charge_efi_id: `upgrade_${Date.now()}`,
                } as any);

            // Atualizar assinatura
            await supabaseAdmin
                .from('saas_subscriptions')
                .update({
                    saas_plan_id: newPlan.id,
                    plan_tier: newPlan.tier,
                    valor_mensal: newPrice,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', sub.id);

            return NextResponse.json({
                success: true,
                type: 'UPGRADE',
                message: `Upgrade para ${newPlan.name} realizado. Diferença proporcional: R$ ${proratedAmount.toFixed(2)}`,
                proratedAmount,
            });
        }

        // 6. Downgrade (pagante) → troca imediata (MVP), novo valor no próximo ciclo
        await supabaseAdmin
            .from('saas_subscriptions')
            .update({
                saas_plan_id: newPlan.id,
                plan_tier: newPlan.tier,
                valor_mensal: newPrice,
                updated_at: new Date().toISOString(),
            })
            .eq('id', sub.id);

        return NextResponse.json({
            success: true,
            type: 'DOWNGRADE',
            message: `Downgrade para ${newPlan.name} realizado. Novo valor será cobrado no próximo ciclo.`,
        });

    } catch (err: any) {
        console.error('[Admin Change Plan]', err);
        return NextResponse.json({ error: 'Erro interno ao alterar plano.' }, { status: 500 });
    }
}

/**
 * Calcula o valor proporcional de upgrade baseado nos dias restantes do ciclo.
 */
function calculateProration(currentPrice: number, newPrice: number, diaVencimento: number): number {
    const today = new Date();
    const currentDay = today.getDate();

    // Calcula próximo vencimento
    let nextDue = new Date(today.getFullYear(), today.getMonth(), diaVencimento);
    if (nextDue <= today) {
        nextDue = new Date(today.getFullYear(), today.getMonth() + 1, diaVencimento);
    }

    // Dias totais no ciclo (entre último e próximo vencimento)
    const prevDue = new Date(nextDue.getFullYear(), nextDue.getMonth() - 1, diaVencimento);
    const totalDays = Math.ceil((nextDue.getTime() - prevDue.getTime()) / (1000 * 60 * 60 * 24));

    // Dias restantes
    const remainingDays = Math.ceil((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Diferença diária
    const dailyDiff = (newPrice - currentPrice) / totalDays;

    // Valor proporcional
    const prorated = Math.max(0, dailyDiff * remainingDays);

    return Math.round(prorated * 100) / 100;
}
