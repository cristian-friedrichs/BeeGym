'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/services/logger';

import { requirePermission } from '@/lib/rbac';

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
    organization_id: string;
    services?: string[];
}) {
    await requirePermission('settings', 'manage');
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('units')
        .insert([{
            ...formData,
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

    const { error } = await supabase
        .from('units')
        .update(formData)
        .eq('id', unitId);

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

    // 1. Check if it's main
    const { data: unit } = await supabase
        .from('units')
        .select('is_main')
        .eq('id', unitId)
        .single();

    if (unit?.is_main) {
        return { success: false, error: 'A Matriz não pode ser excluída.' };
    }

    const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', unitId);

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
