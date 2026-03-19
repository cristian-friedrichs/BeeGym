import { createClient } from '@/lib/supabase/client';

export async function getTeamMembers(organizationId: string) {
    const supabase = createClient();

    const { data, error } = await (supabase as any)
        .from('profiles')
        .select('id, full_name, email, role, avatar_url, status, phone')
        .eq('organization_id', organizationId)
        .order('full_name');

    if (error) throw error;
    return data;
}

export async function updateMemberRole(userId: string, role: string, hasSystemAccess: boolean) {
    const supabase = createClient();

    // Se 'hasSystemAccess' for falso, poderíamos marcar como inativo 
    // ou apenas mudar o role para algo com zero permissões.
    const { error } = await (supabase as any)
        .from('profiles')
        .update({
            role,
            status: hasSystemAccess ? 'ACTIVE' : 'PENDING'
        })
        .eq('id', userId);

    if (error) throw error;
}
