import { NextRequest, NextResponse } from 'next/server';
import { SupabaseCouponRepository } from '@/application/repositories/SupabaseCouponRepository';
import { requireAdmin } from '@/lib/auth-utils';
import { withRateLimit } from '@/lib/rate-limit/limiter';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const rateLimitResponse = await withRateLimit(request, 10);
    if (rateLimitResponse) return rateLimitResponse;

    const auth = await requireAdmin(request);
    if ('error' in auth) return auth.error;

    try {
        const { id } = await params;
        const body = await request.json();

        const coupon = await SupabaseCouponRepository.update(id, body);

        return NextResponse.json({ success: true, coupon });
    } catch (err: any) {
        console.error('[Admin Coupons PUT] Erro:', err);
        return NextResponse.json({ error: 'Falha ao atualizar cupom.' }, { status: 400 });
    }
}
