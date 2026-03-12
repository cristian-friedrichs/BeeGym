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

    // Map to membership_plans schema
    const insertData = {
        name: formData.name,
        description: formData.description || null,
        price: formData.price,
        plan_type: formData.plan_type,
        organization_id: formData.organization_id,
        duration_months: formData.plan_type === 'membership' ? (formData.duration_months || 1) : (formData.validity_months || 3),
        recurrence: formData.plan_type === 'membership' ? (formData.recurrence || 'monthly') : 'one_time',
        days_per_week: formData.plan_type === 'membership' ? formData.days_per_week : null,
        credits: formData.plan_type === 'pack' ? formData.credits : null,
        active: true,
    };

    const { data, error } = await supabase
        .from('membership_plans')
        .insert([insertData])
        .select()
        .single();

    if (error) {
        console.error('Error creating plan:', error);
        return { success: false, error: error.message };
    }

    // Log activity
    await logActivity({
        action: 'CREATE',
        resource: 'membership_plans',
        details: `Criou o plano de aluno "${formData.name}" com valor de R$ ${formData.price}`,
        metadata: { plan_id: data.id, ...formData },
    });

    revalidatePath('/app/configuracoes/plans');
    return { success: true, data };
}

export async function updatePlanAction(planId: string, formData: any) {
    await requirePermission('settings', 'manage');
    const supabase = await createClient();

    // Map to membership_plans schema
    const updateData = {
        name: formData.name,
        description: formData.description || null,
        price: formData.price,
        plan_type: formData.plan_type,
        duration_months: formData.plan_type === 'membership' ? formData.duration_months : formData.validity_months,
        recurrence: formData.plan_type === 'membership' ? formData.recurrence : 'one_time',
        days_per_week: formData.plan_type === 'membership' ? formData.days_per_week : null,
        credits: formData.plan_type === 'pack' ? formData.credits : null,
        active: formData.active,
    };

    const { error } = await supabase
        .from('membership_plans')
        .update(updateData)
        .eq('id', planId);

    if (error) {
        console.error('Error updating plan:', error);
        return { success: false, error: error.message };
    }

    // Log activity
    await logActivity({
        action: 'UPDATE',
        resource: 'membership_plans',
        details: `Atualizou o plano de aluno (ID: ${planId})`,
        metadata: { plan_id: planId, changes: formData },
    });

    revalidatePath('/app/configuracoes/plans');
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
        console.error('Error toggling plan status:', error);
        return { success: false, error: error.message };
    }

    // Log activity
    await logActivity({
        action: 'UPDATE',
        resource: 'membership_plans',
        details: `${active ? 'Ativou' : 'Desativou'} o plano de aluno (ID: ${planId})`,
        metadata: { plan_id: planId, active },
    });

    revalidatePath('/app/configuracoes/plans');
    return { success: true };
}


