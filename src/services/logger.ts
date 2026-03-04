'use server';

import { createClient } from '@/lib/supabase/server';

export interface LogActivityParams {
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'VIEW';
    resource: string;
    details: string;
    metadata?: Record<string, any>;
}

/**
 * Logs an activity to the system_logs table.
 * Automatically captures user_id and organization_id from the current session.
 */
export async function logActivity({ action, resource, details, metadata = {} }: LogActivityParams) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.warn('No user session found for logging activity');
            return { success: false };
        }

        // Get organization_id from profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            console.warn('No organization found for user when logging activity');
            return { success: false };
        }

        // Insert log entry
        const { error } = await supabase
            .from('system_logs')
            .insert({
                organization_id: profile.organization_id,
                user_id: user.id,
                action,
                resource,
                details,
                metadata,
            });

        if (error) {
            console.error('Error logging activity:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error('Exception when logging activity:', error);
        return { success: false };
    }
}
