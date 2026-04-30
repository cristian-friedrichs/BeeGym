'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/services/logger';
import { requirePermission } from '@/lib/rbac';
import { getCallerContext, assertRowBelongsToOrg } from '@/lib/auth/tenant-guard';
import { randomUUID } from 'crypto';

/**
 * Creates an instructor.
 *
 * Two modes:
 *   - hasSystemAccess=true → also creates an auth user + profile (with role)
 *     so the instructor can log into the system. Mirrors createTeamMemberAction
 *     but always sets isInstructor=true.
 *   - hasSystemAccess=false → only creates a row in `instructors` with no
 *     linked profile. The instructor is a "phantom" record used for assigning
 *     to classes; they cannot log in.
 */
export async function createInstructorAction(formData: {
    fullName: string;
    bio?: string;
    allowedUnitIds?: string[];
    hasSystemAccess: boolean;
    // Required when hasSystemAccess=true:
    email?: string;
    password?: string;
    role?: string;     // legacy text role (e.g. 'INSTRUCTOR')
    roleId?: string;   // app_roles.id
}) {
    await requirePermission('settings', 'manage');
    const caller = await getCallerContext();

    // Validate per-mode requirements
    if (formData.hasSystemAccess) {
        if (!formData.email || !formData.password) {
            return { success: false, error: 'E-mail e senha são obrigatórios para instrutores com acesso ao sistema.' };
        }
        if (!formData.roleId) {
            return { success: false, error: 'Selecione um perfil de acesso.' };
        }
        // Validate role belongs to caller's org
        const { data: roleRow } = await supabaseAdmin
            .from('app_roles')
            .select('id')
            .eq('id', formData.roleId)
            .eq('organization_id', caller.organizationId)
            .maybeSingle();
        if (!roleRow) {
            return { success: false, error: 'Perfil de acesso inválido para esta organização.' };
        }
    }

    // Validate allowed_unit_ids belong to caller's org (if provided)
    if (formData.allowedUnitIds && formData.allowedUnitIds.length > 0) {
        const { data: validUnits } = await supabaseAdmin
            .from('units')
            .select('id')
            .eq('organization_id', caller.organizationId)
            .in('id', formData.allowedUnitIds);
        const validIds = new Set((validUnits ?? []).map((u: any) => u.id));
        const invalid = formData.allowedUnitIds.filter(id => !validIds.has(id));
        if (invalid.length > 0) {
            return { success: false, error: 'Uma ou mais unidades selecionadas são inválidas.' };
        }
    }

    let userId: string | null = null;

    try {
        // 1. If has system access: create auth user + profile
        if (formData.hasSystemAccess) {
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: formData.email!,
                password: formData.password!,
                email_confirm: true,
                user_metadata: { full_name: formData.fullName },
            });

            if (authError || !authData.user) {
                console.error('Auth user creation failed:', authError);
                return { success: false, error: authError?.message || 'Falha ao criar usuário de acesso.' };
            }

            userId = authData.user.id;

            // Create profile (admin client bypasses RLS)
            const { error: profileError } = await (supabaseAdmin as any)
                .from('profiles')
                .insert({
                    id: userId,
                    organization_id: caller.organizationId,
                    full_name: formData.fullName,
                    email: formData.email,
                    role: formData.role || 'INSTRUCTOR',
                    role_id: formData.roleId,
                    status: 'ACTIVE',
                });

            if (profileError) {
                console.error('Profile creation failed:', profileError);
                // Roll back the auth user
                await supabaseAdmin.auth.admin.deleteUser(userId);
                return { success: false, error: 'Falha ao salvar perfil do instrutor.' };
            }
        }

        // 2. Create instructor record
        const instructorId = userId ?? randomUUID();
        const { error: instructorError } = await (supabaseAdmin as any)
            .from('instructors')
            .insert({
                id: instructorId,
                user_id: userId, // null for instructors without system access
                organization_id: caller.organizationId,
                name: formData.fullName,
                bio: formData.bio || null,
                allowed_unit_ids: formData.allowedUnitIds || [],
            });

        if (instructorError) {
            console.error('Instructor creation failed:', instructorError);
            // Roll back the auth user + profile if we created them
            if (userId) {
                await (supabaseAdmin as any).from('profiles').delete().eq('id', userId);
                await supabaseAdmin.auth.admin.deleteUser(userId);
            }
            return { success: false, error: instructorError.message };
        }

        await logActivity({
            action: 'CREATE',
            resource: 'instructors',
            details: `Criou instrutor "${formData.fullName}"${formData.hasSystemAccess ? ' (com acesso ao sistema)' : ''}`,
            metadata: { instructor_id: instructorId, has_system_access: formData.hasSystemAccess },
        });

        revalidatePath('/app/configuracoes/instructors');
        revalidatePath('/app/configuracoes/team');
        return { success: true, id: instructorId };
    } catch (e: any) {
        console.error('Unexpected error creating instructor:', e);
        return { success: false, error: e.message || 'Erro inesperado.' };
    }
}

export async function updateInstructorAction(instructorId: string, formData: {
    fullName?: string;
    bio?: string | null;
    allowedUnitIds?: string[];
}) {
    await requirePermission('settings', 'manage');
    const caller = await getCallerContext();

    const owns = await assertRowBelongsToOrg('instructors', instructorId, caller.organizationId);
    if (!owns) return { success: false, error: 'Instrutor não encontrado nesta organização' };

    if (formData.allowedUnitIds && formData.allowedUnitIds.length > 0) {
        const { data: validUnits } = await supabaseAdmin
            .from('units')
            .select('id')
            .eq('organization_id', caller.organizationId)
            .in('id', formData.allowedUnitIds);
        const validIds = new Set((validUnits ?? []).map((u: any) => u.id));
        if (formData.allowedUnitIds.some(id => !validIds.has(id))) {
            return { success: false, error: 'Uma ou mais unidades selecionadas são inválidas.' };
        }
    }

    const patch: any = {};
    if (formData.fullName !== undefined) patch.name = formData.fullName;
    if (formData.bio !== undefined) patch.bio = formData.bio;
    if (formData.allowedUnitIds !== undefined) patch.allowed_unit_ids = formData.allowedUnitIds;

    const { error } = await (supabaseAdmin as any)
        .from('instructors')
        .update(patch)
        .eq('id', instructorId)
        .eq('organization_id', caller.organizationId);

    if (error) {
        console.error('Instructor update failed:', error);
        return { success: false, error: error.message };
    }

    // If linked to a profile, sync the name there too
    if (formData.fullName) {
        const { data: instr } = await supabaseAdmin
            .from('instructors')
            .select('user_id')
            .eq('id', instructorId)
            .maybeSingle();

        const linkedUserId = (instr as any)?.user_id;
        if (linkedUserId) {
            await (supabaseAdmin as any)
                .from('profiles')
                .update({ full_name: formData.fullName })
                .eq('id', linkedUserId)
                .eq('organization_id', caller.organizationId);
        }
    }

    await logActivity({
        action: 'UPDATE',
        resource: 'instructors',
        details: `Atualizou instrutor (ID: ${instructorId})`,
        metadata: { instructor_id: instructorId, changes: formData },
    });

    revalidatePath('/app/configuracoes/instructors');
    return { success: true };
}

export async function deleteInstructorAction(instructorId: string) {
    await requirePermission('settings', 'manage');
    const caller = await getCallerContext();

    const { data: instr } = await supabaseAdmin
        .from('instructors')
        .select('user_id, organization_id, name')
        .eq('id', instructorId)
        .maybeSingle();

    if (!instr || (instr as any).organization_id !== caller.organizationId) {
        return { success: false, error: 'Instrutor não encontrado nesta organização' };
    }

    // Delete the instructor row
    const { error } = await supabaseAdmin
        .from('instructors')
        .delete()
        .eq('id', instructorId)
        .eq('organization_id', caller.organizationId);

    if (error) {
        console.error('Instructor delete failed:', error);
        return { success: false, error: error.message };
    }

    // If linked to an auth/profile user, also delete that — they exist solely as instructor
    const linkedUserId = (instr as any).user_id;
    if (linkedUserId) {
        await (supabaseAdmin as any)
            .from('profiles')
            .delete()
            .eq('id', linkedUserId)
            .eq('organization_id', caller.organizationId);

        try {
            await supabaseAdmin.auth.admin.deleteUser(linkedUserId);
        } catch (e) {
            console.warn('Auth user delete failed (non-fatal):', e);
        }
    }

    await logActivity({
        action: 'DELETE',
        resource: 'instructors',
        details: `Excluiu instrutor "${(instr as any).name ?? instructorId}"`,
        metadata: { instructor_id: instructorId },
    });

    revalidatePath('/app/configuracoes/instructors');
    revalidatePath('/app/configuracoes/team');
    return { success: true };
}
