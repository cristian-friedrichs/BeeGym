'use client'

import { createContext, useContext, useEffect, useState, useMemo, useCallback, ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthContext'
import { PlanFeature, BeeGymPlan, getPlanById } from '@/config/plans'
import { isSuperAdmin } from '@/lib/auth/role-checks'

const ACTIVE_STATUSES = ['active', 'trial'].map(s => s.toLowerCase())

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
    'salas': 'Gestão de Salas',
}

interface SubscriptionContextValue {
    plan: BeeGymPlan
    isActive: boolean
    status: string | null
    loading: boolean
    hasFeature: (feature: PlanFeature) => boolean
    metodo: string | null
    proximoVencimento: string | null
    organizationId: string | null
    maxStudents: number | null
    displayFeatures: string[]
    isAdmin: boolean
    effectivePrice: number
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: ReactNode }) {
    const { organizationId, profile, loading: authLoading } = useAuth()
    const [planId, setPlanId] = useState<string | null>(null)
    const [status, setStatus] = useState<string | null>(null)
    const [metodo, setMetodo] = useState<string | null>(null)
    const [proximoVencimento, setProximoVencimento] = useState<string | null>(null)
    const [dbAllowedFeatures, setDbAllowedFeatures] = useState<PlanFeature[] | null>(null)
    const [dbMaxStudents, setDbMaxStudents] = useState<number | null>(null)
    const [dbPrice, setDbPrice] = useState<number | null>(null)
    // Fix race condition: start as true and only flip to false once authLoading is done
    // AND we've either fetched the subscription OR confirmed there's no org to fetch for.
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Don't make any decision until auth has resolved
        if (authLoading) return

        if (!organizationId) {
            setLoading(false)
            return
        }

        let isMounted = true

        const fetchOrgSub = async () => {
            if (!isMounted) return
            setLoading(true)

            try {
                const { data: orgData, error: orgError } = await supabase
                    .from('organizations')
                    .select('subscription_status')
                    .eq('id', organizationId)
                    .single()

                if (orgError) {
                    console.error('[SubscriptionContext] Erro ao buscar organização:', orgError)
                }

                if (!isMounted) return

                if (orgData) {
                    setStatus((orgData as any).subscription_status)
                }

                const { data: subData, error: subError } = await supabase
                    .from('saas_subscriptions')
                    .select('status, plan_tier, valor_mensal, saas_plans!saas_plan_id ( tier, allowed_features, max_students, price ), metodo, proximo_vencimento')
                    .eq('organization_id', organizationId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle()

                if (subError) {
                    console.error('[SubscriptionContext] Erro ao buscar assinatura:', subError)
                }

                if (!isMounted) return

                if (subData) {
                    const sub = subData as any

                    // Use subscription status as source of truth if available
                    if (sub.status) {
                        setStatus(sub.status)
                    }

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

                    const realPrice = sub.valor_mensal ?? sub.saas_plans?.price ?? null
                    if (realPrice !== null) {
                        setDbPrice(Number(realPrice))
                    }
                }
            } catch (error: any) {
                if (isMounted) {
                    console.error('[SubscriptionContext] Erro fatal no fetch:', error)
                }
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        fetchOrgSub()
        return () => { isMounted = false }
    }, [organizationId, authLoading])

    const plan: BeeGymPlan = useMemo(() => getPlanById(planId), [planId])

    const isMasterAdmin = useMemo(() => {
        return isSuperAdmin(profile?.role as string | undefined)
    }, [profile])

    const isActive = useMemo(() => {
        if (isMasterAdmin) return true
        return status ? ACTIVE_STATUSES.includes(status.toLowerCase()) : false
    }, [status, isMasterAdmin])

    const hasFeature = useCallback((feature: PlanFeature) => {
        if (isMasterAdmin) return true
        if (dbAllowedFeatures !== null && dbAllowedFeatures.length > 0) {
            return dbAllowedFeatures.includes(feature)
        }
        return plan.allowedFeatures.includes(feature)
    }, [dbAllowedFeatures, plan.allowedFeatures, isMasterAdmin])

    const { max_students: maxStudentsFromPlan } = plan as any
    const maxStudents = useMemo(() => {
        if (isMasterAdmin) return null
        return dbMaxStudents !== null ? dbMaxStudents : maxStudentsFromPlan
    }, [dbMaxStudents, maxStudentsFromPlan, isMasterAdmin])

    const displayFeatures = useMemo(() => {
        if (isMasterAdmin) {
            return Object.values(FEATURE_LABELS)
        }
        const features = dbAllowedFeatures && dbAllowedFeatures.length > 0
            ? dbAllowedFeatures
            : plan.allowedFeatures
        return features.map(f => FEATURE_LABELS[f] || (f as string))
    }, [dbAllowedFeatures, plan.allowedFeatures, isMasterAdmin])

    const effectivePrice = dbPrice !== null ? dbPrice : plan.price

    const value = useMemo<SubscriptionContextValue>(() => ({
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
        isAdmin: isMasterAdmin,
        effectivePrice,
    }), [plan, isActive, status, loading, authLoading, hasFeature, metodo, proximoVencimento, organizationId, maxStudents, displayFeatures, isMasterAdmin, effectivePrice])

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    )
}

export function useSubscriptionContext(): SubscriptionContextValue {
    const ctx = useContext(SubscriptionContext)
    if (ctx === undefined) {
        throw new Error('useSubscriptionContext must be used within a SubscriptionProvider')
    }
    return ctx
}
