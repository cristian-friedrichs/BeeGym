import { createClient } from '@/lib/supabase/server'
import { getPlanById, BeeGymPlan } from '@/config/plans'
import type { PlanFeature } from '@/config/plans'

const ACTIVE_STATUSES = [
    'active', 'ativo', 'pago',
    'ATIVO', 'PAGO'
]

/**
 * Server-side plan check utility.
 * Reads the plan from saas_subscriptions regardless of payment status.
 * Plan is always available once the user selects it during onboarding.
 */
export async function getServerPlan(organizationId: string): Promise<{
    plan: BeeGymPlan
    isActive: boolean
}> {
    const supabase = await createClient()

    // 1. Buscar status da organização
    const { data: org } = await supabase
        .from('organizations')
        .select('subscription_status, onboarding_completed')
        .eq('id', organizationId)
        .single()

    const hasAccess = org?.onboarding_completed &&
        (org?.subscription_status === 'active' || org?.subscription_status === 'pago' || org?.subscription_status === 'ativo');
    const isActive = hasAccess

    // 2. Buscar plano via saas_subscriptions (independe do pagamento)
    const { data: sub } = await supabase
        .from('saas_subscriptions')
        .select('status, plan_tier, saas_plans!saas_plan_id ( tier )')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    let planId: string | null = null
    if (sub) {
        const tier = (sub as any).saas_plans?.tier?.toLowerCase()
            || sub.plan_tier?.toLowerCase()
            || 'starter'
        planId = `plan_${tier}`
    }

    const plan = getPlanById(planId)

    return { plan, isActive }
}

/**
 * Quick check: does the organization's plan include a specific feature?
 */
export async function hasServerFeature(
    organizationId: string,
    feature: PlanFeature
): Promise<boolean> {
    const { plan, isActive } = await getServerPlan(organizationId)
    return isActive && plan.allowedFeatures.includes(feature)
}
