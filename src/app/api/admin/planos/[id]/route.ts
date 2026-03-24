import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin, logSecurityEvent } from '@/lib/auth-utils';
import { withRateLimit } from '@/lib/rate-limit/limiter';

const CONTAGEM_ASSINANTES: Record<string, number> = {
    'plan-1': 87,
    'plan-2': 65,
    'plan-3': 35,
};

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const rateLimitResponse = await withRateLimit(request, 10);
    if (rateLimitResponse) return rateLimitResponse;

    const auth = await requireAdmin(request);
    if ('error' in auth) return auth.error;

    const { id } = await params;
    const body = await request.json();
    const supabase = supabaseAdmin;

    const { data: updatedPlan, error } = await supabase
        .from('saas_plans')
        .update({
            name: body.name,
            description: body.description,
            tier: body.tier,
            price: body.price,
            promo_price: body.promo_price,
            promo_months: body.promo_months,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(updatedPlan);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const rateLimitResponse = await withRateLimit(request, 5);
    if (rateLimitResponse) return rateLimitResponse;

    const auth = await requireAdmin(request);
    if ('error' in auth) return auth.error;

    logSecurityEvent('ADMIN_DELETE_PLAN', {
        userId: auth.user.id,
        path: request.nextUrl.pathname,
        action: 'delete_plan'
    });

    const { id } = await params;
    const assinantes = CONTAGEM_ASSINANTES[id] ?? 0;

    if (assinantes > 0) {
        return NextResponse.json(
            { error: `Não é possível remover. ${assinantes} assinante(s) ativo(s) neste plano.` },
            { status: 409 }
        );
    }

    // Aqui chamaremos DeletePlanUseCase
    return NextResponse.json({ success: true });
}
