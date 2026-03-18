'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { randomUUID } from 'node:crypto'

interface CompleteOnboardingData {
    organizationName: string
    businessType: string
    phone: string
    email: string
    document?: string
    studentRange: '0-20' | '21-40' | '41-60' | '61-300' | '301-500' | '500+'
    addressLine1?: string
    addressNumber?: string
    addressComplement?: string
    addressNeighborhood?: string
    addressCity?: string
    addressState?: string
    addressZip?: string
    planId: string
    hasPhysicalLocation: boolean
    subscriptionStatus?: string
}

export async function completeOnboardingAction(data: CompleteOnboardingData) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Usuário não autenticado' }
    }

    // Para operações críticas de Onboarding (criar conta e vincular perfil), 
    // usamos o Service Role para contornar políticas rigorosas de RLS temporárias
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

    // 0. Check for existing organization to prevent duplicity
    const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    const orgId = existingProfile?.organization_id || randomUUID()

    // 1. Upsert Organization
    const { data: orgData, error: orgError } = await supabaseAdmin
        .from('organizations')
        .upsert({
            id: orgId,
            name: data.organizationName,
            business_type: data.businessType,
            email: data.email,
            contact_email: data.email,
            phone: data.phone,
            contact_phone: data.phone,
            cpf_cnpj: data.document,
            cnpj_cpf: data.document,
            student_range: data.studentRange,
            address_line1: data.hasPhysicalLocation ? data.addressLine1 : null,
            address_number: data.hasPhysicalLocation ? data.addressNumber : null,
            address_complement: data.hasPhysicalLocation ? data.addressComplement : null,
            address_neighborhood: data.hasPhysicalLocation ? data.addressNeighborhood : null,
            address_city: data.addressCity || null,
            address_state: data.addressState || null,
            address_zip: data.hasPhysicalLocation ? data.addressZip : null,
            has_physical_location: data.hasPhysicalLocation,
            subscription_status: 'pending',
            onboarding_completed: false,
            updated_at: new Date().toISOString(),
        })
        .select()
        .single()

    if (orgError) {
        console.error('Error upserting organization:', orgError)
        return { error: `Erro ao salvar organização: ${orgError.message}` }
    }

    // 2. Update User Profile (Upsert to ensure creation if missing from trigger)
    const { error: userError } = await supabaseAdmin
        .from('profiles')
        .upsert({
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
            avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
            organization_id: orgData.id,
            status: 'active',
            role: 'OWNER',
            is_instructor: true,
        })

    if (userError) {
        console.error('Error updating user:', userError)
        return { error: `Erro do atualizar perfil do usuário: ${userError.message}` }
    }

    // 2.1 Upsert Instructor record for the owner
    const { error: instructorError } = await supabaseAdmin
        .from('instructors')
        .upsert({
            id: user.id,
            organization_id: orgData.id,
            name: user.user_metadata?.full_name || user.user_metadata?.name || 'Administrador',
            user_id: user.id,
            allowed_unit_ids: [],
        })

    if (instructorError) {
        console.error('Error upserting instructor record for owner:', instructorError)
        // Non-blocking, but logged
    }

    // 3. Update Auth Metadata (Critical for Middleware)
    const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        {
            app_metadata: {
                organization_id: orgData.id,
                status: 'active'
            }
        }
    )

    if (metadataError) {
        console.error('Error updating user metadata:', metadataError)
    }

    // 4. Upsert saas_subscriptions with pending status
    // Reads price/promo from saas_plans to ensure EFI charges use admin-configured values
    if (data.planId) {
        // Fetch plan pricing from saas_plans (source of truth)
        const { data: planData } = await supabaseAdmin
            .from('saas_plans')
            .select('price, promo_price, promo_months, tier')
            .eq('id', data.planId)
            .single()

        const { error: subError } = await supabaseAdmin
            .from('saas_subscriptions')
            .upsert({
                organization_id: orgData.id,
                saas_plan_id: data.planId,
                plan_paid_id: data.planId,
                plan_tier: planData?.tier || null,
                status: 'pending',
                metodo: 'pending',
                valor_mensal: planData?.price ?? 0,
                promo_price: planData?.promo_price ?? null,
                promo_months_remaining: planData?.promo_months ?? 0,
                dia_vencimento: new Date().getDate(),
                updated_at: new Date().toISOString(),
            }, { onConflict: 'organization_id' })

        if (subError) {
            console.error('Error upserting subscription record:', subError)
            // Non-blocking: org and profile already created
        }
    }

    // 5. Revalidate and Return
    revalidatePath('/')
    return { success: true }
}
