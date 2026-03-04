import { createContext, useContext } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { studentSchema } from '@/lib/schemas/studentSchema';

export const newStudentSchema = studentSchema;

export type NewStudentFormValues = z.infer<typeof newStudentSchema>;

interface IFormContext {
  form: UseFormReturn<NewStudentFormValues>;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  steps: string[];
  nextStep: () => void;
  prevStep: () => void;
}

export const FormContext = createContext<IFormContext | null>(null);

export function useFormContext() {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
}

