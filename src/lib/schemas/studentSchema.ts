import { z } from 'zod';

export const studentSchema = z.object({
    name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
    cpf: z.string().length(14, 'CPF inválido.'), // Expecting format 000.000.000-00
    email: z.string().email('Por favor, insira um email válido.'),
    phone: z.string().min(10, 'Telefone inválido.'),
    address: z.object({
        street: z.string().min(1, 'Rua é obrigatório'),
        number: z.string().min(1, 'Número é obrigatório'),
        complement: z.string().optional(),
        neighborhood: z.string().min(1, 'Bairro é obrigatório'),
        city: z.string().min(1, 'Cidade é obrigatório'),
        state: z.string().min(1, 'Estado é obrigatório'),
        zip: z.string().min(8, 'CEP inválido'),
    }),
    birthDate: z.date().optional(),
    primaryUnitId: z.string().min(1, 'A unidade principal é obrigatória.'),
    unitLinkType: z.enum(['single', 'multiple', 'all']).default('single'),
    unitMemberships: z.array(z.string()).optional(),
    plan: z.object({
        planId: z.string().min(1, 'Por favor, selecione um plano.'),
        planType: z.enum(['RECURRING', 'PACKAGE']).optional(),
        frequencyLimit: z.number().optional(), // e.g., 2 for 2x/week
        totalCredits: z.number().optional(), // for package plans
        discount: z.object({
            type: z.enum(['PERCENT', 'ABSOLUTE']),
            value: z.number().min(0, 'O valor deve ser positivo'),
        }),
        dueDate: z.date(),
    }),
    scheduling: z.object({
        mode: z.enum(['fixed', 'free']).default('free'),
        fixedSchedule: z.array(z.object({
            dayOfWeek: z.string(), // 'monday', 'tuesday', etc.
            time: z.string(), // 'HH:MM'
        })).optional(),
        location: z.string().optional(),
    }).optional(),
    reminders: z.object({
        email: z.boolean(),
        whatsapp: z.boolean(),
    })
});

export type StudentFormValues = z.infer<typeof studentSchema>;
