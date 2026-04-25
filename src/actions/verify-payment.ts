'use server'

import { createClient } from '@/lib/supabase/server'

const ACTIVE_STATUSES = ['active', 'pago', 'ativo', 'trial']

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

        const orgId = profile.organization_id

        // Primary check: saas_subscriptions.status (updated by webhook)
        const { data: subscription } = await supabase
            .from('saas_subscriptions')
            .select('status')
            .eq('organization_id', orgId)
            .maybeSingle()

        if (subscription && ACTIVE_STATUSES.includes(subscription.status)) {
            return { success: true, status: 'CONCLUIDA' }
        }

        // Fallback: organizations.subscription_status (also updated by webhook)
        // Handles the race-condition window before saas_subscriptions is written
        const { data: org } = await supabase
            .from('organizations')
            .select('subscription_status')
            .eq('id', orgId)
            .single()

        if (org && ACTIVE_STATUSES.includes((org.subscription_status || '').toLowerCase())) {
            return { success: true, status: 'CONCLUIDA' }
        }

        return { success: false, status: 'PENDENTE' }
    } catch (error) {
        console.error('Erro ao verificar status:', error)
        return { success: false, error: 'Erro interno' }
    }
}
