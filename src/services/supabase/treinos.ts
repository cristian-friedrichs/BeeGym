import { createClient } from "@/lib/supabase/server";

export async function getStudentWorkouts(studentId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("workouts")
        .select(`
      *,
      created_by:profiles(full_name),
      workout_exercises (
        *,
        exercise:exercises(name, muscle_group)
      )
    `)
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching workouts:", error);
        return [];
    }
    return data;
}
