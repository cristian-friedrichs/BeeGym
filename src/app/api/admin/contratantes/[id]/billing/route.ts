import { NextRequest, NextResponse } from 'next/server';
import { SupabaseAssinaturaRepository } from '@/application/repositories/SupabaseAssinaturaRepository';
import { SupabaseSaasPlanRepository } from '@/application/repositories/SupabaseSaasPlanRepository';
import { requireAdmin, logSecurityEvent } from '@/lib/auth-utils';
import { withRateLimit } from '@/lib/rate-limit/limiter';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const rateLimitResponse = await withRateLimit(request, 10);
    if (rateLimitResponse) return rateLimitResponse;

    const auth = await requireAdmin(request);
    if ('error' in auth) return auth.error;

    logSecurityEvent('ADMIN_BILLING_UPDATE', {
        userId: auth.user.id,
        path: request.nextUrl.pathname,
        action: 'update_billing'
    });

    try {
        const { id } = await params; // organization_id
        const body = await request.json();

        // Expect fields
        const {
            manual_price_override,
            manual_discount_amount,
            manual_discount_percentage,
            coupon_id
        } = body;

        // 1. Get active subscription
        const assinatura = await SupabaseAssinaturaRepository.findActiveByOrganization(id);

        if (!assinatura) {
            return NextResponse.json({ error: 'Nenhuma assinatura ativa encontrada para este contratante.' }, { status: 404 });
        }

        // 2. Calculate new value based on original plan value
        const plan = await SupabaseSaasPlanRepository.findById(assinatura.saasPlanId!);
        if (!plan) {
            return NextResponse.json({ error: 'Plano base da assinatura não encontrado.' }, { status: 404 });
        }

        let novoValorMensal = plan.price;

        if (manual_price_override !== null && manual_price_override !== undefined) {
            novoValorMensal = Number(manual_price_override);
        } else if (manual_discount_amount) {
            novoValorMensal = Math.max(0, novoValorMensal - Number(manual_discount_amount));
        } else if (manual_discount_percentage) {
            novoValorMensal = Math.max(0, novoValorMensal * (1 - (Number(manual_discount_percentage) / 100)));
        }


        // 4. Update Database
        const updated = await SupabaseAssinaturaRepository.actualizarPlano(
            assinatura.id,
            assinatura.saasPlanId!,
            novoValorMensal,
            {
                manualPriceOverride: manual_price_override,
                manualDiscountAmount: manual_discount_amount,
                manualDiscountPercentage: manual_discount_percentage,
                couponId: coupon_id
            }
        );

        if (!updated) {
            return NextResponse.json({ error: 'Erro ao salvar novo valor na base de dados.' }, { status: 500 });
        }

        return NextResponse.json({ success: true, novoValorMensal });

    } catch (error: any) {
        console.error('[Admin Billing Override]', error);
        return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
    }
}
