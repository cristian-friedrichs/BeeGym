'use server';
/**
 * @fileOverview Generates a workout summary for a client based on their weekly activities.
 *
 * - generateWorkoutSummary - A function that generates the workout summary.
 * - WorkoutSummaryInput - The input type for the generateWorkoutSummary function.
 * - WorkoutSummaryOutput - The return type for the generateWorkoutSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WorkoutSummaryInputSchema = z.object({
  activities: z
    .string()
    .describe("A description of all client's workout activities of the week."),
});
export type WorkoutSummaryInput = z.infer<typeof WorkoutSummaryInputSchema>;

const WorkoutSummaryOutputSchema = z.object({
  summary: z.string().describe('A summary of the client workout.'),
});
export type WorkoutSummaryOutput = z.infer<typeof WorkoutSummaryOutputSchema>;

export async function generateWorkoutSummary(input: WorkoutSummaryInput): Promise<WorkoutSummaryOutput> {
  return workoutSummaryFlow(input);
}

const workoutSummaryPrompt = ai.definePrompt({
  name: 'workoutSummaryPrompt',
  input: {schema: WorkoutSummaryInputSchema},
  output: {schema: WorkoutSummaryOutputSchema},
  prompt: `Based on the following workout activities, generate a summary including total duration, calories burned, and major muscle groups trained.

Activities: {{{activities}}}`,
});

const workoutSummaryFlow = ai.defineFlow(
  {
    name: 'workoutSummaryFlow',
    inputSchema: WorkoutSummaryInputSchema,
    outputSchema: WorkoutSummaryOutputSchema,
  },
  async input => {
    const {output} = await workoutSummaryPrompt(input);
    return output!;
  }
);
