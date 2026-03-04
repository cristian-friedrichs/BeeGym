'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/services/logger';
import { randomUUID } from 'crypto';


import { requirePermission } from '@/lib/rbac';

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
    // ✅ Check permission
    await requirePermission('settings', 'manage');

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
    // ✅ Check permission
    await requirePermission('settings', 'manage');

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
