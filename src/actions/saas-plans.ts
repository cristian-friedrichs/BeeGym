'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { isSuperAdmin } from '@/lib/auth/role-checks';

/**
 * Updates ONLY the financial fields of a SaaS plan.
 * Name, tier, max_students, and allowed_features are IMMUTABLE.
 */
export async function updateSaasPlanPricingAction(planId: string, data: {
    price: number;
    promo_price: number | null;
    promo_months: number | null;
}) {
    const supabase = await createClient();

    // Verify requesting user is a BeeGym admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Não autenticado' };
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!isSuperAdmin((profile as any)?.role)) {
        return { success: false, error: 'Sem permissão para alterar planos SaaS' };
    }

    const { error } = await supabase
        .from('saas_plans')
        .update({
            price: data.price,
            promo_price: data.promo_price,
            promo_months: data.promo_months ?? 0,
            updated_at: new Date().toISOString(),
        })
        .eq('id', planId);

    if (error) {
        console.error('[SaaS Plans] Error updating pricing:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/planos');
    return { success: true };
}

/**
 * Fetches all SaaS plans for admin display.
 */
export async function getSaasPlansAction() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('saas_plans')
        .select('id, name, tier, price, promo_price, promo_months, max_students, allowed_features, active')
        .order('price', { ascending: true });

    if (error) {
        console.error('[SaaS Plans] Error fetching plans:', error);
        return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: data || [] };
}
