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

        // 2. Check if already active/trial (Self-heal/Polling recovery)
        const { data: org } = await supabaseAdmin
            .from('organizations')
            .select('subscription_status')
            .eq('id', profile.organization_id)
            .single()

        if (org && ['active', 'trial'].includes(org.subscription_status)) {
            return { success: true, status: org.subscription_status }
        }

        // 3. Get pending subscription (try both payment_token and acordo_efi_id)
        const { data: sub } = await supabaseAdmin
            .from('saas_subscriptions')
            .select('id, payment_token, acordo_efi_id, status, metodo')
            .eq('organization_id', profile.organization_id)
            .in('status', ['pending', 'AGUARDANDO_PAGAMENTO'])
            .limit(1)
            .maybeSingle()

        if (!sub) return { status: 'NOT_FOUND' }

        // Get the identifier to check (payment_token takes precedence)
        const txid = sub.payment_token || sub.acordo_efi_id
        if (!txid) return { status: 'NO_TOKEN' }

        // 4. Call EFI API GET /v2/cob/{txid}
        const res = await efiClient.get(`/v2/cob/${txid}`)
        
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
                onboarding_completed: true,
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
