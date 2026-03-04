'use server';

import { createClient } from '@/lib/supabase/server';
import { workoutSchema } from '@/lib/schemas/workoutSchema';
import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/rbac';
import { z } from 'zod';

// We need to extend/refine the schema for the action if necessary, 
// or just use the one from lib.
// The snippet implies we receive 'data'.

export async function saveGeneratedWorkout(data: z.infer<typeof workoutSchema> & { organizationId: string, userId: string, studentId: string }) {
    await requirePermission('workouts', 'manage');
    const supabase = await createClient();

    // 1. Validar dados com Zod (autovalidated by TS if using typed arg, but good to parse at runtime if coming from client directly)
    // For now, trust the types or re-parse.
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
    // Map schema fields to DB fields
    const exercises = data.exercises.map((ex: any) => ({
        workout_id: workout.id,
        exercise_id: ex.exerciseId,
        sets: ex.sets,
        // Ensure reps is string as per schema (it is string in schema) 
        // DB assumes text? Yes.
        reps: String(ex.reps),
        weight: String(ex.weight || 0), // Schema number, DB text? Let's check DB.
        // I created DB with: weight TEXT. Schema: weight number.
        // Snippet uses: weight: ex.weight

        duration_seconds: ex.durationSeconds || ex.restSeconds || null,
        intensity: ex.intensity || null,
        notes: ex.notes
    }));

    const { error: exError } = await supabase
        .from('workout_exercises')
        .insert(exercises);

    if (exError) {
        // Rollback? Supabase doesn't support easy rollback in client-side transaction logic without RPC.
        // We'll throw/return error.
        console.error('Error saving exercises:', exError);
        return { success: false, error: exError.message };
    }

    revalidatePath(`/clients/${data.studentId}/treinos`);
    return { success: true, id: workout.id };
}
