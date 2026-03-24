import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { SupabaseAssinaturaRepository } from '@/application/repositories/SupabaseAssinaturaRepository';
import { efiCardRecorrente } from '@/payments/efi/efi.card-recorrente';
import { requireAdmin, logSecurityEvent } from '@/lib/auth-utils';
import { withRateLimit } from '@/lib/rate-limit/limiter';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const rateLimitResponse = await withRateLimit(req, 10);
    if (rateLimitResponse) return rateLimitResponse;

    const auth = await requireAdmin(req);
    if ('error' in auth) return auth.error;

    logSecurityEvent('ADMIN_APPLY_DISCOUNT', {
        userId: auth.user.id,
        path: req.nextUrl.pathname,
        action: 'apply_discount'
    });

    try {
        const body = await req.json();
        const { id } = await params;
        const { manualDiscountAmount, manualDiscountPercentage } = body;

        // Fetch subscription
        const assinatura = await SupabaseAssinaturaRepository.findActiveByOrganization(id);
        if (!assinatura) {
            return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 });
        }

        const isCartao = assinatura.metodo === 'CARTAO_RECORRENTE';
        const isPix = assinatura.metodo === 'PIX_AUTOMATICO';

        let absoluteDiscount = 0;
        let discountPayload: { type: 'currency' | 'percentage', value: number } | undefined = undefined;

        if (manualDiscountAmount !== undefined && manualDiscountAmount > 0) {
            absoluteDiscount = manualDiscountAmount;
            discountPayload = { type: 'currency', value: Math.round(absoluteDiscount * 100) };
        } else if (manualDiscountPercentage !== undefined && manualDiscountPercentage > 0) {
            absoluteDiscount = Number(assinatura.valorMensal) * (manualDiscountPercentage / 100);
            discountPayload = { type: 'currency', value: Math.round(absoluteDiscount * 100) };
        }

        // Se for cartão, atualiza no Gateway
        if (isCartao && assinatura.subscriptionEfiId) {
            if (discountPayload) {
                await efiCardRecorrente.aplicarDesconto(assinatura.subscriptionEfiId, discountPayload);
            } else {
                // Se removeu desconto
                await efiCardRecorrente.removerDesconto(assinatura.subscriptionEfiId);
            }
        }

        // Se for Pix: No momento, os Acordos Pix Automático não têm endpoint de "desconto" sem recriar, 
        // mas o nosso motor vai ler 'manual_discount_amount' e 'manual_discount_percentage' para gerar a cobrança (webhook)
        // do ciclo com o desconto subtraído.

        // Atualiza base de dados
        const updateData: any = {
            manual_discount_amount: manualDiscountAmount || null,
            manual_discount_percentage: manualDiscountPercentage || null,
        };

        const { error } = await supabaseAdmin
            .from('saas_subscriptions')
            .update(updateData)
            .eq('id', assinatura.id);

        if (error) {
            throw error;
        }

        return NextResponse.json({ message: 'Desconto aplicado com sucesso!' });
    } catch (err: any) {
        console.error('Erro ao aplicar desconto:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
