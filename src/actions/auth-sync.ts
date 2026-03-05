'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

/**
 * Sincroniza os metadados do Auth (JWT) com os dados reais do perfil no banco.
 * Crucial para garantir que o organization_id esteja disponível no client.
 */
export async function syncAuthMetadata() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Usuário não autenticado' }
    }

    // 1. Buscar Perfil
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, status')
        .eq('id', user.id)
        .single()

    if (!profile?.organization_id) {
        return { error: 'Perfil incompleto' }
    }

    // 2. Buscar Organização separadamente (sem FK join)
    const { data: org } = await supabase
        .from('organizations')
        .select('subscription_status, onboarding_completed')
        .eq('id', profile.organization_id)
        .single()

    // ✅ SEGURANÇA: Só retorna sucesso (que causa o redirect p/ painel)
    // se o onboarding foi concluído E se a assinatura está ativa/trial/teste.
    const hasAccess = org?.onboarding_completed &&
        (org?.subscription_status === 'active' || org?.subscription_status === 'trial' || org?.subscription_status === 'teste');

    if (!hasAccess) {
        return {
            error: 'Pagamento pendente ou onboarding incompleto',
            status: org?.subscription_status
        }
    }

    // 2. Atualizar Metadata do JWT via Admin
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

    const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        {
            app_metadata: {
                organization_id: profile.organization_id,
                status: profile.status || 'ACTIVE'
            }
        }
    )

    if (metadataError) {
        console.error('Error syncing metadata:', metadataError)
        return { error: 'Falha ao sincronizar metadados' }
    }

    // Force session refresh
    await supabase.auth.refreshSession()

    revalidatePath('/')
    return { success: true }
}
