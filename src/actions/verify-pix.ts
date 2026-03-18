'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { efiClient } from '@/payments/efi/efi.client'

export async function verifyPixStatusAction() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Não autenticado' }

        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: { autoRefreshToken: false, persistSession: false }
            }
        )

        // 1. Get user profile
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) return { error: 'Sem organização' }

        // 2. Get pending subscription
        const { data: sub } = await supabaseAdmin
            .from('saas_subscriptions')
            .select('id, payment_token, status')
            .eq('organization_id', profile.organization_id)
            .eq('status', 'pending')
            .single()

        if (!sub || !sub.payment_token) return { status: 'NOT_FOUND' }

        // 3. Call EFI API GET /v2/cob/{txid}
        const res = await efiClient.get(`/v2/cob/${sub.payment_token}`)
        
        const status = res.data.status // CONCLUIDA, ATIVA, etc

        if (status === 'CONCLUIDA' || status === 'paid' || status === 'approved' || status === 'settled') {
            // Activate as TRIAL (7 days guarantee)
            const trialEnd = new Date()
            trialEnd.setDate(trialEnd.getDate() + 7)

            await supabaseAdmin.from('saas_subscriptions').update({ 
                status: 'trial', 
                updated_at: new Date().toISOString() 
            }).eq('id', sub.id)

            await supabaseAdmin.from('organizations').update({ 
                subscription_status: 'trial', 
                trial_end: trialEnd.toISOString(),
                updated_at: new Date().toISOString() 
            }).eq('id', profile.organization_id)

            await supabaseAdmin.from('profiles').update({ 
                status: 'active' 
            }).eq('organization_id', profile.organization_id)

            return { success: true, status: 'CONCLUIDA' }
        }

        return { success: true, status, res }
    } catch (err: any) {
        console.error('Erro no verifyPixStatusAction:', err)
        return { error: 'Erro de comunicação', details: err.message }
    }
}
