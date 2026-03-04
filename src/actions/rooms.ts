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

    const { data, error } = await supabase
        .from('rooms')
        .insert([formData])
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
