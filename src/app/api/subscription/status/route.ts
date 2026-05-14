import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/subscription/status
 * Returns the current plan_tier and status for the authenticated user's org.
 * Used by the upgrade polling loop to detect when a Kiwify payment is confirmed.
 */
export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    const orgId = profile?.organization_id;
    if (!orgId) {
        return NextResponse.json({ error: 'Organização não encontrada' }, { status: 400 });
    }

    const { data: sub } = await supabaseAdmin
        .from('saas_subscriptions')
        .select('plan_tier, status')
        .eq('organization_id', orgId)
        .maybeSingle();

    return NextResponse.json({
        plan_tier: sub?.plan_tier ?? null,
        status: sub?.status ?? null,
    }, {
        headers: { 'Cache-Control': 'no-store' },
    });
}
