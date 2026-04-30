'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/services/logger';
import { randomUUID } from 'crypto';
import { requirePermission } from '@/lib/rbac';

// Resolves the organization_id of the currently authenticated user (server-side).
async function getCallerOrgId(): Promise<string | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();
    return profile?.organization_id ?? null;
}

// Validates that a role_id belongs to the given organization.
async function validateRoleOwnership(roleId: string, organizationId: string): Promise<boolean> {
    const { data } = await supabaseAdmin
        .from('app_roles')
        .select('id')
        .eq('id', roleId)
        .eq('organization_id', organizationId)
        .maybeSingle();
    return !!data;
}

export async function createTeamMemberAction(formData: {
    fullName: string;
    email?: string;
    password?: string;
    role: string;
    roleId?: string;
    organizationId: string;
    hasSystemAccess: boolean;
    isInstructor: boolean;
}) {
    await requirePermission('settings', 'manage');

    // Security: verify caller belongs to the org they're creating into
    const callerOrgId = await getCallerOrgId();
    if (!callerOrgId || callerOrgId !== formData.organizationId) {
        return { success: false, error: 'Sem permissão para criar membros nesta organização.' };
    }

    // Security: verify role_id belongs to the same org
    if (formData.roleId) {
        const roleValid = await validateRoleOwnership(formData.roleId, formData.organizationId);
        if (!roleValid) {
            return { success: false, error: 'Perfil de acesso inválido ou não pertence a esta organização.' };
        }
    }

    // Security: require role when system access is enabled
    if (formData.hasSystemAccess && !formData.roleId) {
        return { success: false, error: 'Selecione um perfil de acesso antes de habilitar o acesso ao sistema.' };
    }

    try {
        let profileId: string;

        // Scenario 1: No System Access - Create profile only (no auth user)
        if (!formData.hasSystemAccess) {
            profileId = randomUUID();

            const { error: dbError } = await supabaseAdmin
                .from('profiles')
                .insert({
                    id: profileId,
                    full_name: formData.fullName,
                    role: formData.role || 'STAFF',
                    role_id: formData.roleId || null,
                    organization_id: formData.organizationId,
                    status: 'ACTIVE',
                    has_system_access: false,
                    is_instructor: formData.isInstructor,
                    email: null,
                });

            if (dbError) {
                console.error('Error inserting profile (no access):', dbError);
                return { success: false, error: dbError.message };
            }
        } else {
            // Scenario 2: With System Access - Create auth user + profile
            if (!formData.email || !formData.password) {
                return { success: false, error: 'Email e senha são obrigatórios para usuários com acesso ao sistema' };
            }

            // 1. Create Auth User
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: formData.email,
                password: formData.password,
                email_confirm: true,
                user_metadata: {
                    full_name: formData.fullName,
                },
                app_metadata: {
                    status: 'ACTIVE',
                    organization_id: formData.organizationId,
                    role: formData.role,
                }
            });

            if (authError) {
                console.error('Error creating auth user:', authError);
                return { success: false, error: authError.message };
            }

            if (!authData.user) {
                return { success: false, error: 'User creation failed' };
            }

            profileId = authData.user.id;

            // 2. Update profile with access flags
            const { error: dbError } = await supabaseAdmin
                .from('profiles')
                .update({
                    full_name: formData.fullName,
                    role: formData.role || 'STAFF',
                    role_id: formData.roleId || null,
                    organization_id: formData.organizationId,
                    status: 'ACTIVE',
                    has_system_access: true,
                    must_change_password: true,
                    is_instructor: formData.isInstructor,
                })
                .eq('id', authData.user.id);

            if (dbError) {
                console.error('Error updating profile (with access):', dbError);
                // Optionally: delete the auth user if profile update fails
                return { success: false, error: dbError.message };
            }
        }

        // 3. Create instructor record if needed
        if (formData.isInstructor) {
            const { data: instructorData, error: instructorError } = await supabaseAdmin
                .from('instructors')
                .insert({
                    id: profileId,
                    organization_id: formData.organizationId,
                    name: formData.fullName,
                    user_id: profileId,
                    allowed_unit_ids: [],
                })
                .select()
                .single();

            if (instructorError) {
                console.error('❌ CRITICAL ERROR creating instructor record:', {
                    error: instructorError,
                    code: instructorError.code,
                    message: instructorError.message,
                    details: instructorError.details,
                    hint: instructorError.hint,
                });

                // Return error to user instead of silently failing
                return {
                    success: false,
                    error: `Perfil criado, mas falhou ao criar registro de instrutor: ${instructorError.message}`
                };
            }

        }


        // Log activity
        await logActivity({
            action: 'CREATE',
            resource: 'team',
            details: `Adicionou ${formData.fullName} à equipe como ${formData.role}${formData.isInstructor ? ' (Instrutor)' : ''}${!formData.hasSystemAccess ? ' (sem acesso ao sistema)' : ''}`,
            metadata: {
                profile_id: profileId,
                email: formData.email,
                role: formData.role,
                has_access: formData.hasSystemAccess,
                is_instructor: formData.isInstructor,
            },
        });

        revalidatePath('/painel/configuracoes/team');
        return { success: true, data: { id: profileId } };
    } catch (error: any) {
        console.error('Unexpected error in createTeamMemberAction:', error);
        return { success: false, error: error.message || 'Erro inesperado' };
    }
}

export async function updateTeamMemberAction(formData: {
    profileId: string;
    fullName: string;
    jobTitle?: string;
    isInstructor: boolean;
    roleId?: string;
    organizationId: string;
}) {
    await requirePermission('settings', 'manage');

    // Security: verify caller belongs to the org they're updating into
    const callerOrgId = await getCallerOrgId();
    if (!callerOrgId || callerOrgId !== formData.organizationId) {
        return { success: false, error: 'Sem permissão para editar membros nesta organização.' };
    }

    // Security: verify the profile being edited belongs to this org
    const { data: targetProfile } = await supabaseAdmin
        .from('profiles')
        .select('organization_id')
        .eq('id', formData.profileId)
        .maybeSingle();
    if (!targetProfile || targetProfile.organization_id !== formData.organizationId) {
        return { success: false, error: 'Membro não encontrado nesta organização.' };
    }

    // Security: verify role_id belongs to the same org
    if (formData.roleId) {
        const roleValid = await validateRoleOwnership(formData.roleId, formData.organizationId);
        if (!roleValid) {
            return { success: false, error: 'Perfil de acesso inválido ou não pertence a esta organização.' };
        }
    }

    try {
        // 1. Update profile
        const { error: dbError } = await supabaseAdmin
            .from('profiles')
            .update({
                full_name: formData.fullName,
                job_title: formData.jobTitle || null,
                is_instructor: formData.isInstructor,
                role_id: formData.roleId || null,
            })
            .eq('id', formData.profileId);

        if (dbError) {
            console.error('Error updating profile:', dbError);
            return { success: false, error: dbError.message };
        }

        // 2. Sync instructor record
        if (formData.isInstructor) {
            const { error: instructorError } = await supabaseAdmin
                .from('instructors')
                .upsert({
                    id: formData.profileId,
                    organization_id: formData.organizationId,
                    name: formData.fullName,
                    user_id: formData.profileId,
                }, { onConflict: 'id' });

            if (instructorError) {
                console.error('Error syncing instructor record:', instructorError);
            }
        } else {
            // Remove instructor record if toggle is off
            await supabaseAdmin
                .from('instructors')
                .delete()
                .eq('id', formData.profileId);
        }

        // 3. Update instructor name if it exists
        if (formData.isInstructor) {
            await supabaseAdmin
                .from('instructors')
                .update({ name: formData.fullName })
                .eq('id', formData.profileId);
        }

        await logActivity({
            action: 'UPDATE',
            resource: 'team',
            details: `Atualizou perfil de ${formData.fullName}`,
            metadata: {
                profile_id: formData.profileId,
                is_instructor: formData.isInstructor,
                role_id: formData.roleId,
            },
        });

        revalidatePath('/painel/configuracoes/team');
        return { success: true };
    } catch (error: any) {
        console.error('Unexpected error in updateTeamMemberAction:', error);
        return { success: false, error: error.message || 'Erro inesperado' };
    }
}

/**
 * Activates or deactivates a team member.
 *
 * When deactivating: marks profile.status='INACTIVE' AND bans the auth user
 * (via Admin API) so they cannot log in. Existing sessions are revoked.
 *
 * When activating: marks profile.status='ACTIVE' AND lifts the auth ban.
 *
 * Cannot be used to deactivate OWNER/PROPRIETARY accounts (frontend disables it,
 * backend enforces it). Cannot deactivate yourself.
 */
export async function setMemberActiveAction(profileId: string, active: boolean) {
    await requirePermission('settings', 'manage');

    const supabase = await createClient();
    const { data: { user: caller } } = await supabase.auth.getUser();
    if (!caller) return { success: false, error: 'Não autenticado.' };

    const callerOrgId = await getCallerOrgId();
    if (!callerOrgId) return { success: false, error: 'Organização do usuário não encontrada.' };

    // Cannot deactivate yourself
    if (profileId === caller.id) {
        return { success: false, error: 'Você não pode alterar o status do seu próprio usuário.' };
    }

    // Verify target profile belongs to caller's org and read role
    const { data: targetProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, organization_id, role, full_name')
        .eq('id', profileId)
        .maybeSingle();

    if (!targetProfile || targetProfile.organization_id !== callerOrgId) {
        return { success: false, error: 'Membro não encontrado nesta organização.' };
    }

    const targetRole = (targetProfile as any).role;
    if (targetRole === 'OWNER' || targetRole === 'PROPRIETARY' || targetRole === 'SUPER_ADMIN') {
        return { success: false, error: 'Não é possível alterar o status desse usuário.' };
    }

    const newStatus = active ? 'ACTIVE' : 'INACTIVE';

    // 1. Update profile status (uses admin client to bypass RLS update-self-only policy)
    const { error: updateError } = await (supabaseAdmin as any)
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', profileId)
        .eq('organization_id', callerOrgId);

    if (updateError) {
        console.error('Error updating profile status:', updateError);
        return { success: false, error: 'Erro ao atualizar status no banco.' };
    }

    // 2. Ban / unban via Admin API
    // ban_duration: 'none' (the literal string 'none') unbans; '876600h' (~100 years) bans effectively forever.
    try {
        const banDuration = active ? 'none' : '876600h';
        const { error: banError } = await (supabaseAdmin.auth.admin as any).updateUserById(profileId, {
            ban_duration: banDuration,
        });
        if (banError) {
            console.error('Error setting auth ban:', banError);
            // Roll back profile status to keep state consistent
            await (supabaseAdmin as any)
                .from('profiles')
                .update({ status: active ? 'INACTIVE' : 'ACTIVE' })
                .eq('id', profileId);
            return { success: false, error: 'Erro ao revogar acesso de autenticação.' };
        }

        // When deactivating, also explicitly revoke any live sessions
        if (!active) {
            try {
                await (supabaseAdmin.auth.admin as any).signOut(profileId, 'global');
            } catch (e) {
                // Best-effort; ban already prevents new logins
                console.warn('signOut failed (non-fatal):', e);
            }
        }
    } catch (e: any) {
        console.error('Unexpected auth admin error:', e);
        return { success: false, error: 'Erro inesperado ao alterar acesso.' };
    }

    await logActivity({
        action: 'UPDATE',
        resource: 'team',
        details: `${active ? 'Ativou' : 'Inativou'} o membro ${(targetProfile as any).full_name ?? profileId}`,
        metadata: { profile_id: profileId, active },
    });

    revalidatePath('/app/configuracoes/team');
    return { success: true };
}
