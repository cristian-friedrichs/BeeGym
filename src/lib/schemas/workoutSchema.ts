import { z } from 'zod';

export const exerciseSchema = z.object({
    exerciseId: z.string().min(1, 'Selecione um exercício'),
    sets: z.number().min(1, 'Mínimo de 1 série'),
    reps: z.string().min(1, 'Defina as repetições (ex: 10, 10-12)'),
    weight: z.number().min(0, 'Peso não pode ser negativo').optional(),
    durationSeconds: z.number().min(0).optional(),
    restSeconds: z.number().min(0).optional(),
    intensity: z.string().optional(),
    notes: z.string().optional(),
});

export const workoutSchema = z.object({
    title: z.string().min(3, 'O título deve ter no mínimo 3 caracteres'),
    studentId: z.string().min(1, 'Selecione um aluno').uuid('ID de aluno inválido').optional(), // Optional if template
    goal: z.string().optional(),
    exercises: z.array(exerciseSchema).min(1, 'Adicione pelo menos um exercício'),
});

export type WorkoutFormValues = z.infer<typeof workoutSchema>;
