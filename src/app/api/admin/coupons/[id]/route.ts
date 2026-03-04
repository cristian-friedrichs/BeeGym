import { NextRequest, NextResponse } from 'next/server';
import { SupabaseCouponRepository } from '@/application/repositories/SupabaseCouponRepository';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
