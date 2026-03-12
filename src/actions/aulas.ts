'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

import { requirePermission } from '@/lib/rbac';

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

    // ─── Pack Plan: credit check ────────────────────────
    if (plan.plan_type === 'pack' && plan.credits != null && plan.credits > 0) {
        // Count used credits (all non-cancelled scheduled workouts OR class enrollments)
        const { count: usedInWorkouts } = await supabase
            .from('workouts')
            .select('id', { count: 'exact', head: true })
            .eq('student_id', studentId)
            .not('status', 'in', '("Cancelado","CANCELLED")');

        const { count: usedInEvents } = await supabase
            .from('event_enrollments')
            .select('id', { count: 'exact', head: true })
            .eq('student_id', studentId)
            .not('status', 'in', '("Cancelado","CANCELLED")');

        const totalUsed = (usedInWorkouts ?? 0) + (usedInEvents ?? 0);

        if (totalUsed >= plan.credits) {
            return {
                allowed: false,
                message: `Limite de créditos do plano atingido. O aluno tem ${plan.credits} aula(s) no pacote e já utilizou todas.`
            };
        }
    }

    // ─── Membership Plan: weekly frequency limit ────────
    if (plan.plan_type === 'membership' && plan.days_per_week != null && plan.days_per_week > 0) {
        // Get the week boundaries (Mon–Sun) for the proposed date
        const d = new Date(proposedDate);
        const day = d.getDay(); // 0=Sun
        const diffToMon = (day === 0 ? -6 : 1 - day);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() + diffToMon);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        // Count workouts this week (not cancelled)
        const { count: weekWorkoutCount } = await supabase
            .from('workouts')
            .select('id', { count: 'exact', head: true })
            .eq('student_id', studentId)
            .gte('scheduled_at', weekStart.toISOString())
            .lte('scheduled_at', weekEnd.toISOString())
            .not('status', 'in', '("Cancelado","CANCELLED")');

        // Count event enrollments this week
        const { count: weekEnrollmentCount } = await supabase
            .from('event_enrollments')
            .select('id, calendar_events!inner(start_datetime)', { count: 'exact', head: true })
            .eq('student_id', studentId)
            .gte('calendar_events.start_datetime', weekStart.toISOString())
            .lte('calendar_events.start_datetime', weekEnd.toISOString())
            .not('status', 'in', '("Cancelado","CANCELLED")');

        const totalThisWeek = (weekWorkoutCount ?? 0) + (weekEnrollmentCount ?? 0);

        if (totalThisWeek >= plan.days_per_week) {
            return {
                allowed: false,
                message: `Limite semanal do plano atingido. O aluno pode treinar no máximo ${plan.days_per_week}x por semana.`
            };
        }
    }

    return { allowed: true };
}

// ─── Class Enrollment (with overbooking + plan limits) ────────────────────────
export async function enrollStudent(eventId: string, studentId: string) {
    await requirePermission('classes', 'manage');
    const supabase = await createClient();

    try {
        // 1. Get Event Details (Capacity + Date for weekly limit check)
        const { data: event, error: eventError } = await supabase
            .from('calendar_events')
            .select('capacity, start_datetime')
            .eq('id', eventId)
            .single();

        if (eventError || !event) {
            return { error: 'Evento não encontrado.' };
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

        // 5. Enroll
        const { error: insertError } = await supabase
            .from('event_enrollments')
            .insert({
                event_id: eventId,
                student_id: studentId,
                status: 'CONFIRMED'
            });

        if (insertError) {
            console.error('Enrollment error:', insertError);
            return { error: 'Erro ao inscrever aluno.' };
        }

        revalidatePath('/agenda');
        revalidatePath('/aulas');
        return { success: true };

    } catch (error) {
        console.error('Unexpected error:', error);
        return { error: 'Erro interno do servidor.' };
    }
}

// ─── Remove student (no changes) ─────────────────────────────────────────────
export async function removeStudent(eventId: string, studentId: string) {
    await requirePermission('classes', 'manage');
    const supabase = await createClient();

    try {
        const { error } = await supabase
            .from('event_enrollments')
            .delete()
            .eq('event_id', eventId)
            .eq('student_id', studentId);

        if (error) {
            console.error('Remove error:', error);
            return { error: 'Erro ao remover aluno.' };
        }

        revalidatePath('/agenda');
        return { success: true };
    } catch (error) {
        console.error('Unexpected error:', error);
        return { error: 'Erro interno do servidor.' };
    }
}
