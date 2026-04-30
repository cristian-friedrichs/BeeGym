'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/services/logger';

import { requirePermission } from '@/lib/rbac';
import { assertRowBelongsToOrg, getCallerContext } from '@/lib/auth/tenant-guard';

export async function createUnitAction(formData: {
    name: string;
    manager_name?: string;
    email?: string;
    phone?: string;
    address_zip?: string;
    address_street?: string;
    address_number?: string;
    address_neighborhood?: string;
    address_city?: string;
    address_state?: string;
    organization_id?: string; // ignored — overridden by caller's org
    services?: string[];
}) {
    await requirePermission('settings', 'manage');
    const supabase = await createClient();
    const caller = await getCallerContext();

    // Strip any client-supplied organization_id and force the caller's org
    const { organization_id: _ignored, ...safeData } = formData;

    const { data, error } = await supabase
        .from('units')
        .insert([{
            ...safeData,
            organization_id: caller.organizationId,
            is_main: false, // Explicitly false for new ones via GUI
            active: true
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating unit:', error);
        return { success: false, error: error.message };
    }

    // Log activity
    await logActivity({
        action: 'CREATE',
        resource: 'units',
        details: `Criou a unidade "${formData.name}"`,
        metadata: { unit_id: data.id, ...formData },
    });

    revalidatePath('/painel/configuracoes/units');
    return { success: true, data };
}

export async function updateUnitAction(unitId: string, formData: any) {
    await requirePermission('settings', 'manage');
    const supabase = await createClient();

    const caller = await getCallerContext();
    const owns = await assertRowBelongsToOrg('units', unitId, caller.organizationId);
    if (!owns) return { success: false, error: 'Unidade não encontrada nesta organização' };

    // Strip any organization_id from the patch — never let the client move a unit between orgs
    const { organization_id: _ignored, ...safe } = formData ?? {};

    const { error } = await supabase
        .from('units')
        .update(safe)
        .eq('id', unitId)
        .eq('organization_id', caller.organizationId);

    if (error) {
        console.error('Error updating unit:', error);
        return { success: false, error: error.message };
    }

    // Log activity
    await logActivity({
        action: 'UPDATE',
        resource: 'units',
        details: `Atualizou a unidade (ID: ${unitId})`,
        metadata: { unit_id: unitId, changes: formData },
    });

    revalidatePath('/painel/configuracoes/units');
    return { success: true };
}

export async function deleteUnitAction(unitId: string) {
    await requirePermission('settings', 'manage');
    const supabase = await createClient();

    const caller = await getCallerContext();

    // 1. Verify ownership and is_main in a single query
    const { data: unit } = await supabase
        .from('units')
        .select('is_main, organization_id')
        .eq('id', unitId)
        .maybeSingle();

    if (!unit || unit.organization_id !== caller.organizationId) {
        return { success: false, error: 'Unidade não encontrada nesta organização' };
    }

    if (unit?.is_main) {
        return { success: false, error: 'A Matriz não pode ser excluída.' };
    }

    const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', unitId)
        .eq('organization_id', caller.organizationId);

    if (error) {
        console.error('Error deleting unit:', error);
        return { success: false, error: error.message };
    }

    // Log activity
    await logActivity({
        action: 'DELETE',
        resource: 'units',
        details: `Excluiu a unidade (ID: ${unitId})`,
        metadata: { unit_id: unitId },
    });

    revalidatePath('/painel/configuracoes/units');
    return { success: true };
}
