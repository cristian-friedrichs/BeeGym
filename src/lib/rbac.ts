'use server';

import { createClient } from '@/lib/supabase/server';
import { Permissions, ModulePermission, FULL_PERMISSIONS } from '@/types/permissions';

/**
 * Busca as permissões do usuário atual
 * @returns Objeto de permissões ou null se não autenticado
 */
export async function getUserPermissions(): Promise<Permissions | null> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('role_id, role')
        .eq('id', user.id)
        .single();

    if (!profile) return null;

    // Se tem role customizado, buscar permissões da tabela roles
    if (profile.role_id) {
        const { data: customRole } = await supabase
            .from('roles')
            .select('permissions')
            .eq('id', profile.role_id)
            .single();

        if (customRole?.permissions) {
            return customRole.permissions as Permissions;
        }
    }

    // Usar permissões padrão baseadas no UserRole
    return getDefaultPermissionsForRole(profile.role);
}

/**
 * Valida se o usuário tem uma permissão específica
 * @throws Error se não tiver permissão
 */
export async function requirePermission(
    module: keyof Permissions,
    action: keyof ModulePermission
): Promise<void> {
    const permissions = await getUserPermissions();

    if (!permissions) {
        throw new Error('Unauthorized: No active session');
    }

    const modulePermissions = permissions[module];
    if (!modulePermissions) {
        throw new Error(`Forbidden: Module '${module}' not found in permissions`);
    }

    const hasPermission = modulePermissions[action];

    if (!hasPermission) {
        throw new Error(`Forbidden: Missing permission '${module}.${action}'`);
    }
}

/**
 * Retorna permissões padrão baseadas no UserRole
 */
function getDefaultPermissionsForRole(role: string): Permissions {
    switch (role?.toLowerCase()) {
        case 'owner':
        case 'admin':
        case 'beegym_admin':
            return FULL_PERMISSIONS;

        case 'manager':
            return {
                dashboard: { view: true },
                agenda: { view: true, manage: true },
                classes: { view: true, manage: true },
                students: { view: true, create: true, edit: true, delete: true },
                chat: { view: true, manage: true },
                financial: { view: true, manage: false },
                exercises: { view: true, manage: true },
                workouts: { view: true, manage: true },
                reports: { view: true },
                settings: { view: true, manage: false },
            };

        case 'instructor':
            return {
                dashboard: { view: true },
                agenda: { view: true, manage: true },
                classes: { view: true, manage: true },
                students: { view: true, create: false, edit: true, delete: false },
                chat: { view: true, manage: false },
                financial: { view: false, manage: false },
                exercises: { view: true, manage: false },
                workouts: { view: true, manage: true },
                reports: { view: false },
                settings: { view: false, manage: false },
            };

        case 'staff':
            return {
                dashboard: { view: true },
                agenda: { view: true, manage: false },
                classes: { view: true, manage: false },
                students: { view: true, create: false, edit: false, delete: false },
                chat: { view: true, manage: false },
                financial: { view: false, manage: false },
                exercises: { view: true, manage: false },
                workouts: { view: true, manage: false },
                reports: { view: false },
                settings: { view: false, manage: false },
            };

        default:
            // Se role não reconhecido, negar tudo
            return {
                dashboard: { view: false },
                agenda: { view: false, manage: false },
                classes: { view: false, manage: false },
                students: { view: false, create: false, edit: false, delete: false },
                chat: { view: false, manage: false },
                financial: { view: false, manage: false },
                exercises: { view: false, manage: false },
                workouts: { view: false, manage: false },
                reports: { view: false },
                settings: { view: false, manage: false },
            };
    }
}

/**
 * Hook para verificar permissões (pode ser usado em componentes server)
 */
export async function checkPermission(
    module: keyof Permissions,
    action: keyof ModulePermission
): Promise<boolean> {
    try {
        await requirePermission(module, action);
        return true;
    } catch {
        return false;
    }
}
