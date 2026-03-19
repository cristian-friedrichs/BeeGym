'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

/**
 * Finaliza o onboarding marcando a organização como concluída.
 * Chamado após o usuário visualizar o QR Code do PIX.
 */
export async function finalizeOnboardingAction() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Usuário não autenticado' }
    }

    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )

    // Buscar o perfil para encontrar a organização
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    if (!profile?.organization_id) {
        return { error: 'Organização não encontrada para este usuário.' }
    }

    // Finalizar a organização
    const { error: orgError } = await supabaseAdmin
        .from('organizations')
        .update({
            onboarding_completed: true,
            updated_at: new Date().toISOString()
        })
        .eq('id', profile.organization_id)

    if (orgError) {
        console.error('[finalizeOnboardingAction] Error updating organization:', orgError)
        return { error: `Erro ao finalizar onboarding: ${orgError.message}` }
    }

    revalidatePath('/')
    return { success: true }
}
