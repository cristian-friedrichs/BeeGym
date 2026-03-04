// src/ai/flows/suggest-exercises.ts
'use server';
/**
 * @fileOverview A Genkit flow that suggests exercises based on user input.
 *
 * - suggestExercises - A function that suggests exercises based on client goals, training history, and available equipment.
 * - SuggestExercisesInput - The input type for the suggestExercises function.
 * - SuggestExercisesOutput - The return type for the suggestExercises function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestExercisesInputSchema = z.object({
  goals: z
    .string()
    .describe('The fitness goals of the client (e.g., hypertrophy, strength, endurance).'),
  trainingHistory: z
    .string()
    .describe('The training history of the client, including exercises performed and progress made.'),
  availableEquipment: z
    .string()
    .describe('The equipment available to the client (e.g., free weights, machines, bodyweight).'),
});
export type SuggestExercisesInput = z.infer<typeof SuggestExercisesInputSchema>;

const SuggestExercisesOutputSchema = z.object({
  suggestedExercises: z
    .array(z.string())
    .describe('A list of suggested exercises based on the input criteria.'),
});
export type SuggestExercisesOutput = z.infer<typeof SuggestExercisesOutputSchema>;

export async function suggestExercises(input: SuggestExercisesInput): Promise<SuggestExercisesOutput> {
  return suggestExercisesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestExercisesPrompt',
  input: {schema: SuggestExercisesInputSchema},
  output: {schema: SuggestExercisesOutputSchema},
  prompt: `You are a personal trainer. Based on the client's goals, training history, and available equipment, suggest a list of exercises.

Goals: {{{goals}}}
Training History: {{{trainingHistory}}}
Available Equipment: {{{availableEquipment}}}

Suggest a list of exercises:
`,
});

const suggestExercisesFlow = ai.defineFlow(
  {
    name: 'suggestExercisesFlow',
    inputSchema: SuggestExercisesInputSchema,
    outputSchema: SuggestExercisesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
