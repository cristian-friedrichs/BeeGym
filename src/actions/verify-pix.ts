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

        // 3. Get pending subscription
        // REMOVED 'payment_token' as it doesn't exist in the schema.
        // We use 'acordo_efi_id' for PIX_AUTOMATICO.
        const { data: sub } = await supabaseAdmin
            .from('saas_subscriptions')
            .select('id, status, metodo, acordo_efi_id')
            .eq('organization_id', profile.organization_id)
            .eq('status', 'pending')
            .single()

        if (!sub) return { status: 'NOT_FOUND' }

        // 4. Verification based on method
        let isPaid = false
        const txid = sub.acordo_efi_id // Para Pix Automático, o ID do acordo serve como referência no webhook, mas a verificação ativa pode variar.
        
        if (sub.metodo === 'PIX_AUTOMATICO' && sub.acordo_efi_id) {
            // No Pix Automático, o "status" da cobrança individual é o que importa, 
            // mas se o acordo está ATIVO na EFI, geralmente o primeiro pagamento foi OK.
            // Por enquanto, confiamos no status do banco que é atualizado pelo webhook.
            // Mas podemos tentar uma verificação extra se necessário.
            const res = await efiClient.get(`/v2/pix/config/webhook`) // Apenas exemplo, precisa ver o endpoint real de consulta de acordo se quiser polling
            // Se o webhook já salvou no banco, a verificação no passo 2 já teria retornado.
        } else {
            // Immediate PIX logic (if applicable)
            // const res = await efiClient.get(`/v2/cob/${txid}`)
        }

        // Se chegamos aqui, o status no banco ainda é 'pending' e não detectamos mudança automática.
        // Vamos retornar o status atual para que a UI continue o polling.
        return { success: true, status: sub.status }
    } catch (err: any) {
        console.error('Erro no verifyPixStatusAction:', err)
        return { error: 'Erro de comunicação', details: err.message }
    }
}
