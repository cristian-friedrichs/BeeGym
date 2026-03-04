'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface FinancialSettings {
    config_currency: string;
    config_fine_percent: number;
    config_interest_monthly_percent: number;
    config_invoice_days_before: number;
    config_notify_due_date: boolean;
    config_notify_overdue: boolean;
}

import { requirePermission } from '@/lib/rbac';

export async function getFinancialSettingsAction() {
    await requirePermission('financial', 'view');
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Usuário não autenticado' };
    }

    // Get organization_id from profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) {
        return { success: false, error: 'Organização não encontrada' };
    }

    // Fetch organization settings
    const { data, error } = await supabase
        .from('organizations')
        .select(`
            config_currency,
            config_fine_percent,
            config_interest_monthly_percent,
            config_invoice_days_before,
            config_notify_due_date,
            config_notify_overdue
        `)
        .eq('id', profile.organization_id)
        .single();

    if (error) {
        console.error('Error fetching financial settings:', error);
        return { success: false, error: error.message };
    }

    return { success: true, data };
}

export async function updateFinancialSettingsAction(settings: Partial<FinancialSettings>) {
    await requirePermission('financial', 'manage');
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Usuário não autenticado' };
    }

    // Get organization_id from profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) {
        return { success: false, error: 'Organização não encontrada' };
    }

    // Update organization settings
    const { error } = await supabase
        .from('organizations')
        .update(settings)
        .eq('id', profile.organization_id);

    if (error) {
        console.error('Error updating financial settings:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/painel/configuracoes/financial');
    return { success: true };
}
