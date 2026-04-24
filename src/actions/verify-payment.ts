'use server'

import { createClient } from '@/lib/supabase/server'

export async function verifyPaymentStatusAction() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return { success: false }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) {
            return { success: false }
        }

        const { data: subscription } = await supabase
            .from('saas_subscriptions')
            .select('status')
            .eq('organization_id', profile.organization_id)
            .eq('status', 'active')
            .maybeSingle()

        if (subscription) {
            return { success: true, status: 'CONCLUIDA' }
        }

        return { success: false, status: 'PENDENTE' }
    } catch (error) {
        console.error('Erro ao verificar status:', error)
        return { success: false, error: 'Erro interno' }
    }
}
