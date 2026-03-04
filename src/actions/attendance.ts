'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/rbac';

export interface FrequencySettings {
    config_min_presence_pct: number;
    config_late_checkin_policy: string;
    config_cancellation_window_minutes: number;
    config_max_absences_month: number;
    config_absence_penalty_action: string;
    config_churn_days: number;
    config_notify_churn: boolean;
}

export async function getFrequencySettingsAction() {
    await requirePermission('agenda', 'view');
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
            config_min_presence_pct,
            config_late_checkin_policy,
            config_cancellation_window_minutes,
            config_max_absences_month,
            config_absence_penalty_action,
            config_churn_days,
            config_notify_churn
        `)
        .eq('id', profile.organization_id)
        .single();

    if (error) {
        console.error('Error fetching frequency settings:', error);
        return { success: false, error: error.message };
    }

    return { success: true, data };
}

export async function updateFrequencySettingsAction(settings: Partial<FrequencySettings>) {
    await requirePermission('agenda', 'manage');
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
        console.error('Error updating frequency settings:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/painel/configuracoes/attendance');
    return { success: true };
}
