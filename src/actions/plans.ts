'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/services/logger';

import { requirePermission } from '@/lib/rbac';

export async function createPlanAction(formData: {
    name: string;
    description?: string;
    price: number;
    plan_type: 'membership' | 'pack';

    // For memberships
    duration_months?: number;
    recurrence?: 'monthly' | 'quarterly' | 'yearly';
    days_per_week?: number | null; // null = unlimited

    // For packs
    credits?: number;
    validity_months?: number;

    organization_id: string;
}) {
    await requirePermission('settings', 'manage');
    const supabase = await createClient();

    // Build insert data based on plan type
    const baseData = {
        name: formData.name,
        description: formData.description || null,
        price: formData.price,
        plan_type: formData.plan_type,
        organization_id: formData.organization_id,
        active: true,
    };

    let insertData;

    if (formData.plan_type === 'pack') {
        insertData = {
            ...baseData,
            credits: formData.credits || null,
            duration_months: formData.validity_months || null,
            recurrence: null,
            days_per_week: null,
        };
    } else {
        // membership
        insertData = {
            ...baseData,
            duration_months: formData.duration_months || null,
            recurrence: formData.recurrence || 'monthly',
            days_per_week: formData.days_per_week || null,
            credits: null,
        };
    }

    const { data, error } = await supabase
        .from('membership_plans')
        .insert([insertData])
        .select()
        .single();

    if (error) {
        console.error('Error creating membership plan:', error);
        return { success: false, error: error.message };
    }

    // Log activity
    await logActivity({
        action: 'CREATE',
        resource: 'membership_plans',
        details: `Criou o plano "${formData.name}" com valor de R$ ${formData.price}`,
        metadata: { plan_id: data.id, ...formData },
    });

    revalidatePath('/painel/configuracoes/plans');
    return { success: true, data };
}

export async function updatePlanAction(planId: string, formData: any) {
    await requirePermission('settings', 'manage');
    const supabase = await createClient();

    // Build update data based on plan type
    const baseData = {
        name: formData.name,
        description: formData.description || null,
        price: formData.price,
        plan_type: formData.plan_type,
        active: formData.active,
    };
    // ... avoiding massive duplication, let's use exact match for start.

    let updateData;

    if (formData.plan_type === 'pack') {
        updateData = {
            ...baseData,
            credits: formData.credits || null,
            duration_months: formData.validity_months || null,
            recurrence: null,
            days_per_week: null,
        };
    } else {
        // membership
        updateData = {
            ...baseData,
            duration_months: formData.duration_months || null,
            recurrence: formData.recurrence || 'monthly',
            days_per_week: formData.days_per_week || null,
            credits: null,
        };
    }

    const { error } = await supabase
        .from('membership_plans')
        .update(updateData)
        .eq('id', planId);

    if (error) {
        console.error('Error updating membership plan:', error);
        return { success: false, error: error.message };
    }

    // Log activity
    await logActivity({
        action: 'UPDATE',
        resource: 'membership_plans',
        details: `Atualizou o plano (ID: ${planId})`,
        metadata: { plan_id: planId, changes: formData },
    });

    revalidatePath('/painel/configuracoes/plans');
    return { success: true };
}

export async function togglePlanStatusAction(planId: string, active: boolean) {
    await requirePermission('settings', 'manage');
    const supabase = await createClient();

    const { error } = await supabase
        .from('membership_plans')
        .update({ active })
        .eq('id', planId);

    if (error) {
        console.error('Error toggling membership plan status:', error);
        return { success: false, error: error.message };
    }

    // Log activity
    await logActivity({
        action: 'UPDATE',
        resource: 'membership_plans',
        details: `${active ? 'Ativou' : 'Desativou'} o plano (ID: ${planId})`,
        metadata: { plan_id: planId, active },
    });

    revalidatePath('/painel/configuracoes/plans');
    return { success: true };
}

