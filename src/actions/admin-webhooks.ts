'use server'

import { supabaseAdmin } from '@/lib/supabase/admin';

export async function getWebhookLogs() {
    try {
        const { data, error } = await supabaseAdmin
            .from('webhook_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('[Admin] Erro ao buscar logs de webhook:', error);
            return { success: false, data: [] };
        }

        return { success: true, data: data || [] };
    } catch (err: any) {
        console.error('[Admin] Erro fatal ao buscar logs:', err.message);
        return { success: false, data: [] };
    }
}

export async function getValidWebhookEmails() {
    try {
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('email, full_name')
            .not('email', 'is', null)
            .order('email');

        if (error) {
            console.error('[Admin] Erro ao buscar emails válidos:', error);
            return { success: false, data: [] };
        }

        return { success: true, data: data || [] };
    } catch (err: any) {
        console.error('[Admin] Erro fatal ao buscar emails:', err.message);
        return { success: false, data: [] };
    }
}
