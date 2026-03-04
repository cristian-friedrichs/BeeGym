'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/services/logger';
import type { Permissions } from '@/types/permissions';

interface CreateRoleData {
    name: string;
    description?: string;
    permissions: Permissions;
}

interface UpdateRoleData {
    name?: string;
    description?: string;
    permissions?: Permissions;
}

import { requirePermission } from '@/lib/rbac';

export async function getRolesAction() {
    await requirePermission('settings', 'view');
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Usuário não autenticado', data: [] };
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) {
        return { success: false, error: 'Organização não encontrada', data: [] };
    }

    const { data, error } = await supabase
        .from('app_roles')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('name');

    if (error) {
        console.error('Error fetching roles:', error);
        return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: data || [] };
}

export async function createRoleAction(roleData: CreateRoleData) {
    await requirePermission('settings', 'manage');
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
        .from('app_roles')
        .insert({
            organization_id: profile.organization_id,
            name: roleData.name,
            description: roleData.description || null,
            permissions: roleData.permissions as any,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating role:', error);
        return { success: false, error: error.message };
    }

    await logActivity({
        action: 'CREATE',
        resource: 'roles',
        details: `Criou perfil de acesso "${roleData.name}"`,
        metadata: { role_id: data.id, permissions: roleData.permissions },
    });

    revalidatePath('/painel/configuracoes/roles');
    return { success: true, data };
}

export async function updateRoleAction(roleId: string, roleData: UpdateRoleData) {
    await requirePermission('settings', 'manage');
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Usuário não autenticado' };
    }

    const updatePayload: Record<string, any> = {};
    if (roleData.name !== undefined) updatePayload.name = roleData.name;
    if (roleData.description !== undefined) updatePayload.description = roleData.description;
    if (roleData.permissions !== undefined) updatePayload.permissions = roleData.permissions;

    const { data, error } = await supabase
        .from('app_roles')
        .update(updatePayload)
        .eq('id', roleId)
        .select()
        .single();

    if (error) {
        console.error('Error updating role:', error);
        return { success: false, error: error.message };
    }

    await logActivity({
        action: 'UPDATE',
        resource: 'roles',
        details: `Atualizou perfil de acesso "${data.name}"`,
        metadata: { role_id: roleId, changes: updatePayload },
    });

    revalidatePath('/painel/configuracoes/roles');
    return { success: true, data };
}

export async function deleteRoleAction(roleId: string) {
    await requirePermission('settings', 'manage');
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Usuário não autenticado' };
    }

    // Check if any profiles are using this role
    const { data: linkedProfiles, error: checkError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role_id', roleId);

    if (checkError) {
        console.error('Error checking linked profiles:', checkError);
        return { success: false, error: checkError.message };
    }

    if (linkedProfiles && linkedProfiles.length > 0) {
        const names = linkedProfiles.map(p => p.full_name).join(', ');
        return {
            success: false,
            error: `Não é possível excluir: ${linkedProfiles.length} membro(s) vinculado(s) (${names}). Reatribua antes de excluir.`,
        };
    }

    // Get role name for logging before deleting
    const { data: role } = await supabase
        .from('app_roles')
        .select('name')
        .eq('id', roleId)
        .single();

    const { error } = await supabase
        .from('app_roles')
        .delete()
        .eq('id', roleId);

    if (error) {
        console.error('Error deleting role:', error);
        return { success: false, error: error.message };
    }

    await logActivity({
        action: 'DELETE',
        resource: 'roles',
        details: `Excluiu perfil de acesso "${role?.name || roleId}"`,
        metadata: { role_id: roleId },
    });

    revalidatePath('/painel/configuracoes/roles');
    return { success: true };
}
