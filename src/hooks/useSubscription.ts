import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthContext'
import { BeeGymPlan, getPlanById } from '@/config/plans'

const ACTIVE_STATUSES = [
    'active', 'trialing', 'trial', 'teste', 'ativo',
    'ATIVO', 'TRIAL', 'TESTE',
]

export function useSubscription() {
    const { organizationId } = useAuth()
    const [planId, setPlanId] = useState<string | null>(null)
    const [status, setStatus] = useState<string | null>(null)
    const [metodo, setMetodo] = useState<string | null>(null)
    const [proximoVencimento, setProximoVencimento] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!organizationId) {
            setLoading(false)
            return
        }

        let isMounted = true

        const fetchOrgSub = async () => {
            setLoading(true)
            try {
                // 1. Buscar status da organização
                const { data: orgData } = await supabase
                    .from('organizations')
                    .select('subscription_status')
                    .eq('id', organizationId)
                    .single()

                if (!isMounted) return
                if (orgData) {
                    setStatus((orgData as any).subscription_status)
                }

                // 2. Buscar plano via saas_subscriptions (independe do pagamento)
                const { data: subData } = await supabase
                    .from('saas_subscriptions')
                    .select('status, plan_tier, saas_plans!saas_plan_id ( tier ), metodo, proximo_vencimento')
                    .eq('organization_id', organizationId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle()

                if (!isMounted) return
                if (subData) {
                    const sub = subData as any
                    const tier = sub.saas_plans?.tier?.toLowerCase()
                        || sub.plan_tier?.toLowerCase()
                        || 'starter'
                    setPlanId(`plan_${tier}`)
                    setMetodo(sub.metodo)
                    setProximoVencimento(sub.proximo_vencimento)
                }
            } catch (error: any) {
                if (!isMounted || error.name === 'AbortError') return
                console.error('Failed to fetch subscription:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchOrgSub()
        return () => { isMounted = false }
    }, [organizationId])

    const plan: BeeGymPlan = getPlanById(planId)

    const isActive = ACTIVE_STATUSES.includes(status || '')
        || !status // fallback for orgs without status

    const hasFeature = (feature: import('@/config/plans').PlanFeature) => {
        return plan.allowedFeatures.includes(feature)
    }

    return { plan, status, isActive, loading, hasFeature, metodo, proximoVencimento }
}
