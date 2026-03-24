import { NextRequest, NextResponse } from 'next/server';
import { SupabaseCouponRepository } from '@/application/repositories/SupabaseCouponRepository';
import { requireAdmin } from '@/lib/auth-utils';
import { withRateLimit } from '@/lib/rate-limit/limiter';

export async function GET(request: NextRequest) {
    const rateLimitResponse = await withRateLimit(request, 30);
    if (rateLimitResponse) return rateLimitResponse;

    const auth = await requireAdmin(request);
    if ('error' in auth) return auth.error;

    try {
        const coupons = await SupabaseCouponRepository.listAll();
        return NextResponse.json({ coupons });
    } catch (err: any) {
        console.error('[Admin Coupons GET] Erro:', err);
        return NextResponse.json({ error: 'Falha ao buscar cupons' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const rateLimitResponse = await withRateLimit(request, 10);
    if (rateLimitResponse) return rateLimitResponse;

    const auth = await requireAdmin(request);
    if ('error' in auth) return auth.error;

    try {
        const body = await request.json();

        // Validation
        if (!body.code || !body.discount_type || body.discount_value === undefined) {
            return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
        }

        const coupon = await SupabaseCouponRepository.create({
            code: body.code,
            description: body.description || null,
            discount_type: body.discount_type,
            discount_value: Number(body.discount_value),
            duration_months: body.duration_months ? Number(body.duration_months) : null,
            is_active: body.is_active !== undefined ? body.is_active : true
        });

        return NextResponse.json({ success: true, coupon });
    } catch (err: any) {
        console.error('[Admin Coupons POST] Erro:', err);
        return NextResponse.json({ error: 'Falha ao criar cupom. Verifique se o código já existe.' }, { status: 400 });
    }
}
