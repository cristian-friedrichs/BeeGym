import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthContext'
import { BeeGymPlan, getPlanById } from '@/config/plans'

export function useSubscription() {
    const { organizationId } = useAuth()
    const [planId, setPlanId] = useState<string | null>(null)
    const [status, setStatus] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!organizationId) {
            setLoading(false)
            return
        }

        const fetchOrgSub = async () => {
            setLoading(true)
            try {
                const { data, error } = await supabase
                    .from('organizations')
                    .select('plan_id, subscription_status, saas_plans(tier)')
                    .eq('id', organizationId)
                    .single()

                if (!error && data) {
                    const orgData = data as any
                    const tier = orgData.saas_plans?.tier?.toLowerCase() || 'starter'
                    setPlanId(`plan_${tier}`)
                    setStatus(orgData.subscription_status)
                }
            } catch (error) {
                console.error('Failed to fetch subscription:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchOrgSub()
    }, [organizationId])

    const plan: BeeGymPlan = getPlanById(planId)

    // Sub is active if status is ACITVE or TRIALING, or if no status is set (assuming grandfathered/legacy free access until billing is locked)
    const isActive = status === 'active' || status === 'trialing' || !status

    // Helper for feature checks
    const hasFeature = (feature: import('@/config/plans').PlanFeature) => {
        return plan.allowedFeatures.includes(feature)
    }

    return { plan, status, isActive, loading, hasFeature }
}
