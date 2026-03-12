'use server';

import { createClient } from '@/lib/supabase/server';
import { workoutSchema } from '@/lib/schemas/workoutSchema';
import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/rbac';
import { z } from 'zod';
import { 
    addMonths, 
    addDays, 
    startOfDay, 
    getDay, 
    setHours, 
    setMinutes, 
    isAfter 
} from 'date-fns';

export async function saveGeneratedWorkout(data: z.infer<typeof workoutSchema> & { organizationId: string, userId: string, studentId: string }) {
    await requirePermission('workouts', 'manage');
    const supabase = await createClient();

    // 1. Validar dados com Zod
    const validation = workoutSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, error: validation.error.message };
    }

    // 2. Inserir Workout principal
    const { data: workout, error: wError } = await supabase
        .from('workouts')
        .insert({
            organization_id: data.organizationId,
            student_id: data.studentId,
            title: data.title,
            goal: data.goal,
            created_by_user_id: data.userId
        })
        .select()
        .single();

    if (wError) {
        console.error('Error saving workout:', wError);
        return { success: false, error: wError.message };
    }

    // 3. Inserir WorkoutExercise vinculados
    const exercises = data.exercises.map((ex: any) => ({
        workout_id: workout.id,
        exercise_id: ex.exerciseId,
        sets: ex.sets,
        reps: String(ex.reps),
        weight: String(ex.weight || 0),
        duration_seconds: ex.durationSeconds || ex.restSeconds || null,
        intensity: ex.intensity || null,
        notes: ex.notes
    }));

    const { error: exError } = await supabase
        .from('workout_exercises')
        .insert(exercises);

    if (exError) {
        console.error('Error saving exercises:', exError);
        return { success: false, error: exError.message };
    }

    revalidatePath(`/app/alunos/${data.studentId}`);
    revalidatePath(`/app/agenda`);
    return { success: true, id: workout.id };
}

/**
 * Salva a grade recorrente de treinos do aluno.
 * Se já houver treinos futuros vinculados a uma recorrência, eles são removidos.
 */
export async function saveRecurringWorkouts(data: {
    studentId: string;
    organizationId: string;
    title: string;
    type: string;
    schedule: { day: number; time: string }[]; // 0-6 (Sun-Sat)
    studentName?: string;
}) {
    await requirePermission('workouts', 'manage');
    const supabase = await createClient();

    // 1. Deletar treinos PENDENTES futuros que possuem recurrence_id
    // A regra diz: A grade é soberana para o futuro.
    const now = new Date().toISOString();
    const { error: deleteError } = await supabase
        .from('workouts')
        .delete()
        .eq('student_id', data.studentId)
        .in('status', ['Pending', 'Agendado', 'Agendada', 'PENDING'])
        .not('recurrence_id', 'is', null)
        .gte('scheduled_at', now);

    if (deleteError) {
        console.error('Error deleting future workouts:', deleteError);
        return { success: false, error: deleteError.message };
    }

    // Se a grade estiver vazia, apenas limpamos o futuro (feito acima)
    if (!data.schedule || data.schedule.length === 0) {
        revalidatePath(`/app/alunos/${data.studentId}`);
        revalidatePath(`/app/agenda`);
        return { success: true, message: 'Grade de treinos removida.' };
    }

    // 2. Gerar novos treinos para os próximos 3 meses
    const recurrenceId = crypto.randomUUID();
    const workoutsToInsert: any[] = [];
    const calendarEventsToInsert: any[] = [];
    const startDate = new Date();
    const endDate = addMonths(startDate, 3);

    const [defaultHours, defaultMinutes] = [10, 0]; // Fallback

    for (const item of data.schedule) {
        let currentDate = startOfDay(startDate);
        
        // Encontrar a primeira ocorrência do dia da semana
        // getDay: 0=Dom, 1=Seg...
        while (getDay(currentDate) !== item.day) {
            currentDate = addDays(currentDate, 1);
        }

        const [hours, minutes] = item.time.includes(':') 
            ? item.time.split(':').map(Number) 
            : [defaultHours, defaultMinutes];
            
        while (currentDate <= endDate) {
            const scheduledAt = setMinutes(setHours(currentDate, hours), minutes);
            const endDateTime = setMinutes(setHours(currentDate, hours + 1), minutes);
            
            // Adicionar apenas se for no futuro
            if (isAfter(scheduledAt, new Date())) {
                workoutsToInsert.push({
                    organization_id: data.organizationId,
                    student_id: data.studentId,
                    title: data.title,
                    type: data.type,
                    scheduled_at: scheduledAt.toISOString(),
                    end_time: endDateTime.toISOString(),
                    status: 'Agendado',
                    recurrence_id: recurrenceId,
                    recurrence_type: 'WEEKLY'
                });

                // Espelhamento na Agenda (calendar_events)
                calendarEventsToInsert.push({
                    organization_id: data.organizationId,
                    title: `${data.title} - ${data.studentName || 'Aluno'}`,
                    start_datetime: scheduledAt.toISOString(),
                    end_datetime: endDateTime.toISOString(),
                    type: 'TRAINING',
                    status: 'SCHEDULED'
                });
            }
            currentDate = addDays(currentDate, 7);
        }
    }

    if (workoutsToInsert.length > 0) {
        // Inserir em lotes se necessário (Supabase handles large inserts well, but let's be safe if > 1000)
        // Here it will be ~12 dates * 7 days max = 84 rows max. Safe for single insert.
        const { error: insertError } = await supabase
            .from('workouts')
            .insert(workoutsToInsert);

        if (insertError) {
            console.error('Error inserting recurring workouts:', insertError);
            return { success: false, error: insertError.message };
        }

        // Inserir espelhos na agenda
        const { error: eventError } = await supabase
            .from('calendar_events')
            .insert(calendarEventsToInsert);

        if (eventError) {
            console.error('Error Mirroring to Agenda:', eventError);
        }
    }

    // Log activity
    try {
        const { logActivity } = await import('@/services/logger');
        await logActivity({
            action: 'UPDATE',
            resource: 'workouts',
            details: `Atualizou grade de treinos recorrentes (ID: ${data.studentId})`,
            metadata: { student_id: data.studentId, schedule: data.schedule },
        });
    } catch (e) {
        console.warn('Logging failed:', e);
    }

    revalidatePath(`/app/alunos/${data.studentId}`);
    revalidatePath(`/app/agenda`);
    return { success: true };
}

/**
 * Recupera um resumo dos treinos recorrentes futuros para identificar a grade atual.
 */
export async function getStudentRecurringSchedule(studentId: string) {
    const supabase = await createClient();
    const now = new Date().toISOString();

    const { data: workouts, error } = await supabase
        .from('workouts')
        .select('scheduled_at, title, type, recurrence_id')
        .eq('student_id', studentId)
        .eq('status', 'Agendado')
        .not('recurrence_id', 'is', null)
        .gte('scheduled_at', now)
        .order('scheduled_at', { ascending: true });

    if (error) {
        console.error('Error fetching recurring schedule:', error);
        return null;
    }

    if (!workouts || workouts.length === 0) return null;

    // Agrupar por dia da semana e horário para identificar o padrão
    const patternMap = new Map<number, string>();
    workouts.forEach(w => {
        const d = new Date(w.scheduled_at);
        const day = getDay(d);
        const time = format_time(d);
        if (!patternMap.has(day)) {
            patternMap.set(day, time);
        }
    });

    return {
        title: workouts[0].title,
        type: workouts[0].type,
        schedule: Array.from(patternMap.entries()).map(([day, time]) => ({ day, time }))
    };
}

function format_time(date: Date) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
