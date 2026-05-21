'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

import { requirePermission } from '@/lib/rbac';
import { getCallerContext } from '@/lib/auth/tenant-guard';

// ─── Shared: Check student plan limits ────────────────────────────────────────
// Returns an error message string if blocked, or null if allowed.
// Handles both:
//   - membership plans with weekly session limits (checkin_cycle = 'weekly', checkin_limit > 0)
//   - pack plans with remaining credits (type = 'checkin', checkin_limit > 0)
export async function checkStudentScheduleLimits(
    studentId: string,
    proposedDate: string // ISO date string (YYYY-MM-DD) for weekly limit calculation
): Promise<{ allowed: true } | { allowed: false; message: string }> {
    const supabase = await createClient();

    // Fetch student's active plan
    const { data: student } = await supabase
        .from('students')
        .select('plan_id, organization_id')
        .eq('id', studentId)
        .single();

    if (!student?.plan_id) {
        // No plan assigned — no restrictions
        return { allowed: true };
    }

    const { data: plan } = await supabase
        .from('membership_plans')
        .select('plan_type, credits, days_per_week')
        .eq('id', student.plan_id)
        .single();

    if (!plan) return { allowed: true };

    // Fetch available active credits count
    const { count: availableCredits } = await supabase
        .from('student_credits')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .eq('status', 'Disponivel')
        .gt('expires_at', new Date().toISOString());

    const creditsCount = availableCredits ?? 0;

    // ─── Pack Plan: credit check ────────────────────────
    if (plan.plan_type === 'pack') {
        if (creditsCount <= 0) {
            return {
                allowed: false,
                message: `Saldo de créditos insuficiente. Adicione mais créditos para realizar este agendamento.`
            };
        }
    }

    // ─── Membership Plan: weekly frequency limit ────────
    if (plan.plan_type === 'membership' && plan.days_per_week != null && plan.days_per_week > 0) {
        // Get the week boundaries (Sun–Sat) for the proposed date in America/Sao_Paulo timezone (UTC-3)
        const [year, month, dayOfMonth] = proposedDate.split('-').map(Number);
        const d = new Date(Date.UTC(year, month - 1, dayOfMonth));
        const day = d.getUTCDay(); // 0 = Sunday, ..., 6 = Saturday

        const weekStart = new Date(d);
        weekStart.setUTCDate(d.getUTCDate() - day);
        weekStart.setUTCHours(3, 0, 0, 0); // Sunday 00:00 Sao Paulo

        const weekEnd = new Date(weekStart);
        weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
        weekEnd.setUTCDate(weekEnd.getUTCDate() + 1);
        weekEnd.setUTCHours(2, 59, 59, 999); // Saturday 23:59:59.999 Sao Paulo

        // Count weekly workouts (excluding makeup workouts)
        const { count: weekWorkoutCount } = await supabase
            .from('workouts')
            .select('id', { count: 'exact', head: true })
            .eq('student_id', studentId)
            .eq('is_makeup', false)
            .gte('scheduled_at', weekStart.toISOString())
            .lte('scheduled_at', weekEnd.toISOString())
            .not('status', 'eq', 'Cancelado');

        // Count weekly event enrollments using weekly quota
        const { count: weekEnrollmentCount } = await supabase
            .from('event_enrollments')
            .select('id, calendar_events!inner(start_datetime)', { count: 'exact', head: true })
            .eq('student_id', studentId)
            .eq('credit_type', 'Semanal')
            .gte('calendar_events.start_datetime', weekStart.toISOString())
            .lte('calendar_events.start_datetime', weekEnd.toISOString())
            .not('status', 'eq', 'Cancelado');

        const totalThisWeek = (weekWorkoutCount ?? 0) + (weekEnrollmentCount ?? 0);

        if (totalThisWeek >= plan.days_per_week) {
            // Over the weekly limit - must use extra credit
            if (creditsCount <= 0) {
                return {
                    allowed: false,
                    message: `Limite semanal de ${plan.days_per_week}x atingido e saldo de créditos extras insuficiente.`
                };
            }
        }
    }

    return { allowed: true };
}

// ─── Class Enrollment (with overbooking + plan limits) ────────────────────────
export async function enrollStudent(eventId: string, studentId: string) {
    await requirePermission('classes', 'manage');
    const supabase = await createClient();
    const caller = await getCallerContext();

    try {
        // 1. Get Event + Student details — ensure both belong to caller's org
        const { data: event, error: eventError } = await supabase
            .from('calendar_events')
            .select('capacity, start_datetime, organization_id')
            .eq('id', eventId)
            .single();

        if (eventError || !event) {
            return { error: 'Evento não encontrado.' };
        }

        if (event.organization_id !== caller.organizationId) {
            return { error: 'Evento não pertence à sua organização.' };
        }

        const { data: student } = await supabase
            .from('students')
            .select('organization_id')
            .eq('id', studentId)
            .maybeSingle();

        if (!student || student.organization_id !== caller.organizationId) {
            return { error: 'Aluno não encontrado nesta organização.' };
        }

        // 2. Overbooking guard
        const maxCapacity = event.capacity || 0;
        const { count, error: countError } = await supabase
            .from('event_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId)
            .eq('status', 'CONFIRMED');

        if (countError) return { error: 'Erro ao verificar vagas.' };

        if (maxCapacity > 0 && (count ?? 0) >= maxCapacity) {
            return { error: `Turma lotada. Capacidade máxima de ${maxCapacity} aluno(s) atingida.` };
        }

        // 3. Plan limits guard
        const eventDate = event.start_datetime
            ? new Date(event.start_datetime).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];

        const limitCheck = await checkStudentScheduleLimits(studentId, eventDate);
        if (!limitCheck.allowed) {
            return { error: limitCheck.message };
        }

        // 4. Check if already enrolled
        const { data: existing } = await supabase
            .from('event_enrollments')
            .select('id')
            .eq('event_id', eventId)
            .eq('student_id', studentId)
            .maybeSingle();

        if (existing) {
            return { error: 'Aluno já inscrito.' };
        }

        // 5. Enroll — set organization_id explicitly (don't rely on triggers)
        const { error: insertError } = await supabase
            .from('event_enrollments')
            .insert({
                event_id: eventId,
                student_id: studentId,
                status: 'CONFIRMED',
                organization_id: caller.organizationId,
            });

        if (insertError) {
            console.error('Enrollment error:', insertError);
            return { error: insertError.message || 'Erro ao inscrever aluno.' };
        }

        revalidatePath('/agenda');
        revalidatePath('/aulas');
        return { success: true };

    } catch (error: any) {
        console.error('Unexpected error:', error);
        return { error: error.message || 'Erro interno do servidor.' };
    }
}

// ─── Remove student ─────────────────────────────────────────────
export async function removeStudent(eventId: string, studentId: string) {
    await requirePermission('classes', 'manage');
    const supabase = await createClient();
    const caller = await getCallerContext();

    try {
        const { error } = await supabase
            .from('event_enrollments')
            .delete()
            .eq('event_id', eventId)
            .eq('student_id', studentId)
            .eq('organization_id', caller.organizationId);

        if (error) {
            console.error('Remove error:', error);
            return { error: error.message || 'Erro ao remover aluno.' };
        }

        revalidatePath('/agenda');
        return { success: true };
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return { error: error.message || 'Erro interno do servidor.' };
    }
}
