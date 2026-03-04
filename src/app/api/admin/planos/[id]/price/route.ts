import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { SupabaseSaasPlanRepository } from '@/application/repositories/SupabaseSaasPlanRepository';
import { SupabaseAssinaturaRepository } from '@/application/repositories/SupabaseAssinaturaRepository';
import { efiPixAutomatico } from '@/payments/efi/efi.pix-automatico';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();

        if (!body.new_price || isNaN(Number(body.new_price))) {
            return NextResponse.json({ error: 'Preço inválido' }, { status: 400 });
        }

        const newPrice = Number(body.new_price);

        // 1. Atualiza preço base no plano
        const updated = await SupabaseSaasPlanRepository.updatePrice(id, newPrice);

        if (!updated) {
            return NextResponse.json({ error: 'Falha ao atualizar o preço base do plano.' }, { status: 500 });
        }

        // 2. Processo de Sincronização em Background Otimizado (vamos aguardar para ter certeza de completude)
        const { data: assinaturas, error } = await supabaseAdmin
            .from('saas_subscriptions')
            .select('*')
            .eq('saas_plan_id', id)
            .in('status', ['ATIVO', 'INADIMPLENTE']);

        if (error) {
            console.error('[Admin Plan Sync] Erro ao buscar assinaturas vinculadas:', error);
            return NextResponse.json({ success: true, warning: 'Preço base atualizado, mas não foi possível sincronizar as assinaturas ativas devido a um erro de banco de dados.' });
        }

        let successCount = 0;
        let pularCount = 0;
        let erroCount = 0;

        for (const sub of assinaturas) {
            try {
                // Se a assinatura possui manual_price_override, preservamos o override.
                if (sub.manual_price_override !== null) {
                    pularCount++;
                    continue;
                }

                let newSubValue = newPrice;

                // Aplica descontos manuais se existirem
                if (sub.manual_discount_amount) {
                    newSubValue = Math.max(0, newSubValue - Number(sub.manual_discount_amount));
                } else if (sub.manual_discount_percentage) {
                    newSubValue = Math.max(0, newSubValue * (1 - (Number(sub.manual_discount_percentage) / 100)));
                }

                // // Também deveríamos recalcular coupon_id se duration_months permitir, mas para MVP 
                // manteremos simples: aplicamos apenas os descontos manuais que já são reflexo do coupon ou overrides base.
                // Como atualizarPlano do Repository recarrega essas coisas, podemos apenas usá-lo passando o mesmo plano.

                // Atualiza a EFI se aplicavel
                if (sub.metodo === 'PIX_AUTOMATICO' && sub.acordo_efi_id) {
                    try {
                        await efiPixAutomatico.alterarValorAcordo(sub.acordo_efi_id, newSubValue);
                    } catch (e: any) {
                        console.error(`[Admin Plan Sync] Falha ao atualizar EFI Pix para a assinatura ${sub.id}:`, e.response?.data || e.message);
                        erroCount++;
                        continue; // skip DB update se falhou na EFI
                    }
                } else if (sub.metodo === 'CARTAO_RECORRENTE') {
                    // Cartão na EFI v1 requer recriação, não atualizamos o valor no gateway, mas atualizamos no DB
                    // Logamos para admin que cartões antigos rodam com preço antigo
                    pularCount++;
                }

                // Atualiza o DB para refletir o novo valor
                await SupabaseAssinaturaRepository.actualizarPlano(
                    sub.id,
                    id, // mesmo saasPlanId
                    newSubValue,
                    {
                        manualPriceOverride: sub.manual_price_override,
                        manualDiscountAmount: sub.manual_discount_amount,
                        manualDiscountPercentage: sub.manual_discount_percentage,
                        couponId: sub.coupon_id
                    }
                );

                successCount++;

            } catch (innerErr) {
                console.error(`[Admin Plan Sync] Erro processando assinatura ${sub.id}`, innerErr);
                erroCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Plano atualizado',
            sync_result: {
                total: assinaturas.length,
                success: successCount,
                skipped: pularCount,
                errors: erroCount
            }
        });

    } catch (err: any) {
        console.error('[Admin Plan PUT] Erro:', err);
        return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
    }
}
