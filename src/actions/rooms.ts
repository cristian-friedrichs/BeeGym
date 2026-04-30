'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/services/logger';

import { requirePermission } from '@/lib/rbac';

export async function createRoomAction(formData: {
    name: string;
    unit_id: string;
    capacity: number;
    description?: string;
}) {
    await requirePermission('settings', 'manage');
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) return { success: false, error: 'Organização não encontrada' };

    // Resolve unit_id: ensure it points to a real unit row (not the org "master unit").
    // If the provided unit_id doesn't exist in this org's units, fall back to the main/first unit.
    let resolvedUnitId = formData.unit_id;
    if (resolvedUnitId) {
        const { data: unitMatch } = await supabase
            .from('units')
            .select('id')
            .eq('id', resolvedUnitId)
            .eq('organization_id', profile.organization_id)
            .maybeSingle();
        if (!unitMatch) resolvedUnitId = '';
    }

    if (!resolvedUnitId) {
        const { data: fallbackUnit } = await supabase
            .from('units')
            .select('id')
            .eq('organization_id', profile.organization_id)
            .eq('active', true)
            .order('is_main', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (!fallbackUnit?.id) {
            return { success: false, error: 'Nenhuma unidade ativa encontrada. Cadastre uma unidade antes de criar salas.' };
        }
        resolvedUnitId = fallbackUnit.id;
    }

    const { data, error } = await supabase
        .from('rooms')
        .insert([{ ...formData, unit_id: resolvedUnitId, organization_id: profile.organization_id }])
        .select()
        .single();

    if (error) {
        console.error('Error creating room:', error);
        return { success: false, error: error.message };
    }

    // Log activity
    await logActivity({
        action: 'CREATE',
        resource: 'rooms',
        details: `Criou a sala "${formData.name}" com capacidade de ${formData.capacity} pessoas`,
        metadata: { room_id: data.id, ...formData },
    });

    revalidatePath('/painel/configuracoes/rooms');
    return { success: true, data };
}

export async function updateRoomAction(roomId: string, formData: {
    name?: string;
    unit_id?: string;
    capacity?: number;
    description?: string;
}) {
    await requirePermission('settings', 'manage');
    const supabase = await createClient();

    const { error } = await supabase
        .from('rooms')
        .update(formData)
        .eq('id', roomId);

    if (error) {
        console.error('Error updating room:', error);
        return { success: false, error: error.message };
    }

    // Log activity
    await logActivity({
        action: 'UPDATE',
        resource: 'rooms',
        details: `Atualizou a sala (ID: ${roomId})`,
        metadata: { room_id: roomId, changes: formData },
    });

    revalidatePath('/painel/configuracoes/rooms');
    return { success: true };
}

export async function deleteRoomAction(roomId: string) {
    await requirePermission('settings', 'manage');
    const supabase = await createClient();

    const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId);

    if (error) {
        console.error('Error deleting room:', error);
        return { success: false, error: error.message };
    }

    // Log activity
    await logActivity({
        action: 'DELETE',
        resource: 'rooms',
        details: `Excluiu a sala (ID: ${roomId})`,
        metadata: { room_id: roomId },
    });

    revalidatePath('/painel/configuracoes/rooms');
    return { success: true };
}
