'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

import { requirePermission } from '@/lib/rbac';

export interface LogFilters {
    dateFrom?: string;
    dateTo?: string;
    userId?: string;
    action?: string;
    resource?: string;
}

export async function getSystemLogsAction(filters: LogFilters = {}) {
    await requirePermission('settings', 'view');
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Usuário não autenticado' };
    }

    // Get organization_id from profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) {
        return { success: false, error: 'Organização não encontrada' };
    }

    // Build query with filters
    let query = supabase
        .from('system_logs')
        .select(`
            id,
            action,
            resource,
            details,
            metadata,
            created_at,
            user:user_id (
                id,
                full_name,
                avatar_url
            )
        `)
        .eq('organization_id', profile.organization_id);

    if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
    }

    if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
    }

    if (filters.userId) {
        query = query.eq('user_id', filters.userId);
    }

    if (filters.action) {
        query = query.eq('action', filters.action);
    }

    if (filters.resource) {
        query = query.eq('resource', filters.resource);
    }

    const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Error fetching system logs:', error);
        return { success: false, error: error.message };
    }

    const logs = data?.map((log: any) => ({
        ...log,
        user: Array.isArray(log.user) ? log.user[0] : log.user
    }));

    return { success: true, data: logs };
}

export async function createTestLogAction() {
    await requirePermission('settings', 'manage');
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    // ... (rest of code logic is fine, just injecting permission check)
    if (!user) {
        return { success: false, error: 'Usuário não autenticado' };
    }
    // ...
    // Since I can't use // ... effectively without risking deletion, I will provide the context carefully or use multi_replace for safety if I was editing multiple chunks. 
    // Here I am replacing the function start.

    // Actually, I should use the exact content.
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) {
        return { success: false, error: 'Organização não encontrada' };
    }

    const { error } = await supabase
        .from('system_logs')
        .insert({
            organization_id: profile.organization_id,
            user_id: user.id,
            action: 'CREATE',
            resource: 'test',
            details: 'Log de teste gerado pela interface',
            metadata: {
                timestamp: new Date().toISOString(),
                test: true,
            },
        });

    if (error) {
        console.error('Error creating test log:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/painel/configuracoes/logs');
    return { success: true };
}

// Fetch team members for the user filter
export async function getTeamMembersAction() {
    await requirePermission('settings', 'view');
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Usuário não autenticado' };
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) {
        return { success: false, error: 'Organização não encontrada' };
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('organization_id', profile.organization_id)
        .order('full_name');

    if (error) {
        console.error('Error fetching team members:', error);
        return { success: false, error: error.message };
    }

    return { success: true, data };
}
