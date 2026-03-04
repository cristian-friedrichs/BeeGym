'use server';
/**
 * @fileOverview A Genkit flow that generates a workout plan based on user and student inputs.
 *
 * - generateWorkout - A function that generates a workout.
 * - GenerateWorkoutInput - The input type for the generateWorkout function.
 * - GenerateWorkoutOutput - The return type for the generateWorkout function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWorkoutInputSchema = z.object({
  objective: z.string().describe("The main goal for this specific workout session, as described by the personal trainer."),
  studentGoals: z.string().describe("The student's overall, long-term fitness goals."),
  studentRestrictions: z.string().describe("Any physical restrictions or limitations the student has."),
  exerciseLibrary: z.array(z.object({
      name: z.string(),
      description: z.string(),
      tags: z.array(z.string()),
  })).describe("The complete list of available exercises. The generated workout MUST ONLY use exercises from this list."),
});
export type GenerateWorkoutInput = z.infer<typeof GenerateWorkoutInputSchema>;


const GenerateWorkoutOutputSchema = z.object({
  workoutName: z.string().describe("A concise and descriptive name for the generated workout plan, e.g., 'Treino A - Foco em Peito e Tríceps'."),
  exercises: z.array(z.object({
      name: z.string().describe("The exact name of the exercise, chosen from the provided exercise library."),
      sets: z.string().describe("The suggested number of sets, e.g., '3' or '4'."),
      reps: z.string().describe("The suggested number of repetitions or duration, e.g., '8-12', '15', or '45s'."),
  })).describe("The list of exercises for the workout."),
  notes: z.string().describe("General observations or instructions for the workout, like rest times between sets or general recommendations. e.g., 'Descansar 60 segundos entre as séries. Manter a boa forma em todos os movimentos.'"),
});
export type GenerateWorkoutOutput = z.infer<typeof GenerateWorkoutOutputSchema>;

export async function generateWorkout(input: GenerateWorkoutInput): Promise<GenerateWorkoutOutput> {
  return generateWorkoutFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWorkoutPrompt',
  input: {schema: GenerateWorkoutInputSchema},
  output: {schema: GenerateWorkoutOutputSchema},
  prompt: `Você é um personal trainer especialista em criar planos de treino eficientes e personalizados. Sua tarefa é criar um plano de treino completo com base nas informações fornecidas.

### Contexto do Aluno:
- **Objetivos Gerais do Aluno:** {{{studentGoals}}}
- **Restrições Físicas do Aluno:** {{{studentRestrictions}}}

### Objetivo para este Treino Específico:
"{{{objective}}}"

### Tarefa:
Crie um plano de treino coerente e bem estruturado.

**REGRAS OBRIGATÓRIAS:**
1.  **NOME DO TREINO:** Crie um nome claro e objetivo para o treino.
2.  **SELEÇÃO DE EXERCÍCIOS:** Você DEVE OBRIGATORIAMENTE selecionar exercícios **APENAS** da lista de exercícios disponíveis abaixo. Não invente exercícios que não estão na lista.
3.  **ESTRUTURA:** Defina o número de séries (sets) e repetições (reps) para cada exercício, de forma apropriada para o objetivo.
4.  **OBSERVAÇÕES:** Adicione notas úteis, como tempo de descanso recomendado ou dicas de execução.

### Biblioteca de Exercícios Disponíveis (Use APENAS estes):
{{#each exerciseLibrary}}
- **Nome:** {{name}}
  - **Descrição/Músculos:** {{description}}
  - **Tags:** {{#each tags}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
{{/each}}
`,
});

const generateWorkoutFlow = ai.defineFlow(
  {
    name: 'generateWorkoutFlow',
    inputSchema: GenerateWorkoutInputSchema,
    outputSchema: GenerateWorkoutOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
