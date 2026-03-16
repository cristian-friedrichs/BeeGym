import { useEffect, useState, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthContext'
import { PlanFeature, BEEGYM_PLANS, BeeGymPlan, getPlanById } from '@/config/plans'
import { MODULE_TO_MARKETING } from '@/lib/marketing/plan-utils'

const ACTIVE_STATUSES = [
    'ativo', 'trial', 'teste', 'pago', 'active', 'status_ativo', 'status_teste',
].map(s => s.toLowerCase())

export function useSubscription() {
    const { organizationId, profile, user, loading: authLoading } = useAuth()
    const [planId, setPlanId] = useState<string | null>(null)
    const [status, setStatus] = useState<string | null>(null)
    const [metodo, setMetodo] = useState<string | null>(null)
    const [proximoVencimento, setProximoVencimento] = useState<string | null>(null)
    const [dbAllowedFeatures, setDbAllowedFeatures] = useState<import('@/config/plans').PlanFeature[] | null>(null)
    const [dbMaxStudents, setDbMaxStudents] = useState<number | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!organizationId) {
            setLoading(false)
            return
        }

        let isMounted = true

        const fetchOrgSub = async () => {
            if (!isMounted) return
            setLoading(true)
            console.log('[useSubscription] Iniciando fetch para:', organizationId)

            try {
                // 1. Buscar status da organização
                const { data: orgData, error: orgError } = await supabase
                    .from('organizations')
                    .select('subscription_status')
                    .eq('id', organizationId)
                    .single()

                if (orgError) {
                    console.error('[useSubscription] Erro ao buscar organização:', orgError)
                }

                if (!isMounted) return

                if (orgData) {
                    const rawStatus = (orgData as any).subscription_status
                    console.log('[useSubscription] Status da organização:', rawStatus)
                    setStatus(rawStatus)
                }

                // 2. Buscar plano via saas_subscriptions (independe do pagamento)
                const { data: subData, error: subError } = await supabase
                    .from('saas_subscriptions')
                    .select('status, plan_tier, saas_plans!saas_plan_id ( tier, allowed_features, max_students ), metodo, proximo_vencimento')
                    .eq('organization_id', organizationId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle()

                if (subError) {
                    console.error('[useSubscription] Erro ao buscar assinatura:', subError)
                }

                if (!isMounted) return

                if (subData) {
                    const sub = subData as any
                    console.log('[useSubscription] Assinatura encontrada:', {
                        tier: sub.plan_tier,
                        dbTier: sub.saas_plans?.tier,
                        metodo: sub.metodo
                    })

                    // Priorizamos plan_tier da assinatura se existir
                    if (sub.plan_tier) {
                        setPlanId(`plan_${sub.plan_tier.toLowerCase()}`)
                    } else if (sub.saas_plans?.tier) {
                        setPlanId(`plan_${sub.saas_plans.tier.toLowerCase()}`)
                    }

                    setMetodo(sub.metodo)
                    setProximoVencimento(sub.proximo_vencimento)
                    
                    if (sub.saas_plans?.max_students !== undefined) {
                        setDbMaxStudents(sub.saas_plans.max_students)
                    }

                    if (sub.saas_plans?.allowed_features) {
                        setDbAllowedFeatures(sub.saas_plans.allowed_features)
                    }
                } else {
                    console.log('[useSubscription] Nenhuma assinatura encontrada - usando plano padrão')
                }
            } catch (error: any) {
                if (isMounted) {
                    console.error('[useSubscription] Erro fatal no fetch:', error)
                }
            } finally {
                if (isMounted) {
                    console.log('[useSubscription] Finalizando loading')
                    setLoading(false)
                }
            }
        }

        fetchOrgSub()
        return () => { isMounted = false }
    }, [organizationId])

    const plan: BeeGymPlan = useMemo(() => getPlanById(planId), [planId])

    const isMasterAdmin = useMemo(() => {
        const masterEmail = 'cristian_friedrichs@live.com'
        const userEmail = (user?.email || profile?.email || '')?.toLowerCase();
        const role = (profile?.role as string || '').toUpperCase();
        
        // 🚨 CRITICAL: Only the developer email is a TRUE Master Admin
        // Regular owners/admins are subject to plan limits
        return userEmail === masterEmail ||
            role === 'BEEGYM_ADMIN'
    }, [profile, user])

    const isActive = useMemo(() => {
        if (isMasterAdmin) return true
        return status ? ACTIVE_STATUSES.includes(status.toLowerCase()) : false
    }, [status, isMasterAdmin])

    const hasFeature = useCallback((feature: import('@/config/plans').PlanFeature) => {
        if (isMasterAdmin) return true

        // Se temos features customizadas no DB para esse plano e NÃO está vazio, usamos elas
        if (dbAllowedFeatures !== null && dbAllowedFeatures.length > 0) {
            return dbAllowedFeatures.includes(feature)
        }
        // Fallback para as features hardcoded baseadas no tier se o DB for null ou vazio
        return plan.allowedFeatures.includes(feature)
    }, [dbAllowedFeatures, plan.allowedFeatures, isMasterAdmin])

    const { max_students: maxStudentsFromPlan } = plan as any
    const maxStudents = useMemo(() => {
        if (isMasterAdmin) return null // Unlimited for master
        return dbMaxStudents !== null ? dbMaxStudents : maxStudentsFromPlan
    }, [dbMaxStudents, maxStudentsFromPlan, isMasterAdmin])

    const FEATURE_LABELS: Record<string, string> = {
        'painel': 'Dashboard',
        'agenda': 'Agenda',
        'treinos': 'Gestão de Treinos',
        'alunos': 'Gestão de Alunos',
        'financeiro': 'Financeiro',
        'mensalidades': 'Mensalidades',
        'unidades': 'Múltiplas Unidades',
        'multipropriedade': 'Múltiplas Unidades (Redes)',
        'equipe': 'Gestão de Equipe',
        'configuracoes': 'Configurações',
        'exercicios': 'Biblioteca de Exercícios',
        'relatorios': 'Relatórios Avançados',
        'frequencia': 'Controle de Frequência',
        'salas': 'Gestão de Salas'
    }

    const displayFeatures = useMemo(() => {
        if (isMasterAdmin) {
            return Object.values(FEATURE_LABELS)
        }

        const features = dbAllowedFeatures && dbAllowedFeatures.length > 0
            ? dbAllowedFeatures
            : plan.allowedFeatures

        return features.map(f => FEATURE_LABELS[f] || (f as string))
    }, [dbAllowedFeatures, plan.allowedFeatures, isMasterAdmin])

    return {
        plan,
        isActive,
        status,
        loading: loading || authLoading,
        hasFeature,
        metodo,
        proximoVencimento,
        organizationId,
        maxStudents,
        displayFeatures,
        isAdmin: isMasterAdmin
    }
}
