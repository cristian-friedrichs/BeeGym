'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const dayScheduleSchema = z.object({
    active: z.boolean(),
    start: z.string(),
    end: z.string(),
});

const scheduleSchema = z.object({
    sunday: dayScheduleSchema,
    monday: dayScheduleSchema,
    tuesday: dayScheduleSchema,
    wednesday: dayScheduleSchema,
    thursday: dayScheduleSchema,
    friday: dayScheduleSchema,
    saturday: dayScheduleSchema,
    holidays: dayScheduleSchema,
});

const settingsSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    description: z.string().optional(),
    website: z.string().optional().or(z.literal('')),
    instagram: z.string().optional().or(z.literal('')),
    schedule: scheduleSchema,
});

export async function getOrganizationSettings() {
    const supabase = await createClient()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { error: 'Usuário não autenticado', org: null }
        }

        const { data: profile, error: profileError } = await (supabase as any)
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (profileError || !profile?.organization_id) {
            console.error('Error fetching profile or mission orgId:', profileError)
            return { error: 'Perfil não encontrado ou organização não vinculada', org: null }
        }

        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', profile.organization_id)
            .single()

        if (orgError) {
            console.error('Error fetching organization:', orgError)
            return { error: 'Erro ao carregar dados da organização', org: null }
        }

        return { org, error: null }
    } catch (error) {
        console.error('Unexpected error in getOrganizationSettings:', error)
        return { error: 'Ocorreu um erro inesperado ao carregar as configurações', org: null }
    }
}

export async function updateOrganizationSettings(values: z.infer<typeof settingsSchema>) {
    const supabase = await createClient()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { error: 'Usuário não autenticado' }
        }

        const validatedFields = settingsSchema.safeParse(values)
        if (!validatedFields.success) {
            return { error: 'Dados inválidos', details: validatedFields.error.flatten() }
        }

        const { data: profile } = await (supabase as any)
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) {
            return { error: 'Você não tem uma organização vinculada' }
        }

        const { error } = await (supabase as any)
            .from('organizations')
            .update({
                name: values.name,
                description: values.description,
                website: values.website,
                instagram: values.instagram,
                schedule: values.schedule,
                updated_at: new Date().toISOString(),
            })
            .eq('id', profile.organization_id)

        if (error) {
            console.error('Error updating organization:', error)
            return { error: `Erro ao salvar no banco de dados: ${error.message}` }
        }

        revalidatePath('/app/configuracoes/general')
        return { success: true }
    } catch (error) {
        console.error('Unexpected error in updateOrganizationSettings:', error)
        return { error: 'Ocorreu um erro inesperado ao salvar as configurações' }
    }
}
