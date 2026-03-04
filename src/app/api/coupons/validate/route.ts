import { NextRequest, NextResponse } from 'next/server';
import { SupabaseCouponRepository } from '@/application/repositories/SupabaseCouponRepository';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');

        if (!code) {
            return NextResponse.json({ error: 'Código de cupom não informado.' }, { status: 400 });
        }

        const coupon = await SupabaseCouponRepository.findByCode(code);

        if (!coupon || !coupon.is_active) {
            return NextResponse.json({ error: 'Cupom inválido ou expirado.' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            coupon: {
                id: coupon.id,
                code: coupon.code,
                discount_type: coupon.discount_type,
                discount_value: coupon.discount_value,
                duration_months: coupon.duration_months
            }
        });
    } catch (err: any) {
        console.error('[Coupons Validate GET] Erro:', err);
        return NextResponse.json({ error: 'Falha ao validar cupom.' }, { status: 500 });
    }
}
