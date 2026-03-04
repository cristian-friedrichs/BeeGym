'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Check, Users, User, Dumbbell, Building2, Crown, Zap } from 'lucide-react'
import { useOnboarding } from '@/contexts/OnboardingContext'
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress'
import { completeOnboardingAction } from '@/actions/onboarding'
import { cn } from '@/lib/utils'

interface Plan {
    id: string
    name: string
    description: string
    max_students: number | null
    price: number
    promo_price?: number | null
    startingFrom?: boolean
    features: string[]
    icon: any
    colorClass: string
    bgClass: string
}

const localPlans: Plan[] = [
    {
        id: '12532d9c-ace2-400d-81a7-4daf951966f8',
        name: 'STARTER',
        description: 'Ideal para profissionais independentes e iniciantes.',
        max_students: 20,
        price: 19.90,
        promo_price: 9.90,
        features: ['Gestão de Alunos e Pagamentos', 'Calendário Completo', 'Controle de Frequência e Treinos', 'Relatórios e Alertas'],
        icon: User,
        colorClass: 'text-amber-600',
        bgClass: 'bg-amber-50'
    },
    {
        id: '03f4ca44-ec71-4321-b425-634ab7c85791',
        name: 'PLUS',
        description: 'Para quem está crescendo e precisa de mais espaço.',
        max_students: 40,
        price: 29.90,
        promo_price: 19.90,
        features: ['Tudo do STARTER', 'App do Aluno', 'Chat'],
        icon: Zap,
        colorClass: 'text-blue-600',
        bgClass: 'bg-blue-50'
    },
    {
        id: 'd37dadee-1f91-4a2c-ae7e-00f94392bda0',
        name: 'STUDIO',
        description: 'Perfeito para Studios e Boxes com turmas e treinos coletivos.',
        max_students: 100,
        price: 49.90,
        promo_price: 29.90,
        features: ['Tudo do PLUS', 'Aulas Coletivas e Turmas', 'Múltiplos Agendamentos'],
        icon: Dumbbell,
        colorClass: 'text-teal-600',
        bgClass: 'bg-teal-50'
    },
    {
        id: '20a6a4a6-6b9d-4880-b6d3-bdc3693be00d',
        name: 'PRO',
        description: 'Gestão completa para Academias de médio porte.',
        max_students: 400,
        price: 79.90,
        promo_price: 49.90,
        features: ['Tudo do STUDIO', 'Múltiplos Usuários/Instrutores', 'Automatização de Cobrança'],
        icon: Building2,
        colorClass: 'text-slate-600',
        bgClass: 'bg-slate-50'
    },
    {
        id: '5dd1476d-23f7-4c05-8fa7-cc2da8f99baa',
        name: 'ENTERPRISE',
        description: 'Solução ilimitada para grandes redes e franqueadoras.',
        max_students: null,
        price: 0,
        features: ['Tudo do PRO', 'Multipropriedade (Redes)', 'Integração API Externa', 'CRM e Relacionamento'],
        icon: Crown,
        colorClass: 'text-orange-600',
        bgClass: 'bg-orange-50'
    }
]

export default function OnboardingStep3() {
    const router = useRouter()
    const { toast } = useToast()
    const { data, updateData, resetData, isHydrated } = useOnboarding()

    const [plans, setPlans] = useState<Plan[]>([])
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const supabase = createClient()

    // Inicializar plano selecionado se já existir no context
    useEffect(() => {
        if (isHydrated && data.planId) {
            setSelectedPlanId(data.planId)
        }
    }, [isHydrated, data.planId])

    // Redirect if no data
    useEffect(() => {
        if (isHydrated && !isSuccess && (!data.businessType || !data.organizationName)) {
            router.replace('/onboarding')
        }
    }, [data, isHydrated, isSuccess, router])

    // Parse student range to determine minimum students for filtering
    const getMinStudents = (range: string): number => {
        if (!range) return 0
        if (range.includes('+')) return parseInt(range.replace('+', ''))
        const parts = range.split('-')
        return parseInt(parts[0]) || 0
    }

    const minStudents = getMinStudents(data.studentRange)

    // Show all plans, mark which ones are compatible
    useEffect(() => {
        setPlans(localPlans)
    }, [])

    const isPlanCompatible = (plan: Plan): boolean => {
        if (plan.max_students === null) return true // Unlimited
        return plan.max_students >= minStudents
    }

    const handleComplete = async () => {
        if (!selectedPlanId) {
            toast({ variant: 'destructive', title: 'Selecione um plano', description: 'Você deve escolher um plano para continuar.' })
            return
        }

        setIsLoading(true)
        try {
            const isEnterprise = selectedPlanId === '5dd1476d-23f7-4c05-8fa7-cc2da8f99baa'

            const result = await completeOnboardingAction({
                organizationName: data.organizationName,
                businessType: data.businessType!,
                phone: data.phone,
                email: data.email,
                document: data.document,
                studentRange: data.studentRange as any,
                addressLine1: data.addressLine1,
                addressNumber: data.addressNumber,
                addressComplement: data.addressComplement,
                addressNeighborhood: data.addressNeighborhood,
                addressCity: data.addressCity,
                addressState: data.addressState,
                addressZip: data.addressZip,
                hasPhysicalLocation: data.hasPhysicalLocation,
                planId: selectedPlanId,
                subscriptionStatus: isEnterprise ? 'CONSULTA' : 'PENDENTE'
            })

            if (result?.error) {
                throw new Error(result.error)
            }

            // Salvar plano selecionado no contexto (unificado)
            updateData({ planId: selectedPlanId })

            if (!isEnterprise) {
                toast({ title: 'Plano selecionado!', description: 'Agora vamos configurar o seu pagamento.' })
                setIsSuccess(true)
                // REMOVIDO: resetData() - deve ser chamado apenas após sucesso no pagamento
                router.push('/onboarding/pagamento')
            } else {
                toast({ title: 'Perfil recebido!', description: 'Iremos analisar sua solicitação Enterprise.' })
                setIsSuccess(true)
                resetData() // Aqui pode manter pois é o fim do fluxo enterprise
                router.push('/onboarding/obrigado')
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: error.message || 'Falha ao concluir configuração.'
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-orange-50/20 p-4 md:p-8">
            <div className="max-w-6xl mx-auto w-full my-auto space-y-10">
                <OnboardingProgress currentStep={3} />

                <div>
                    <h1 className="text-2xl font-black font-display text-[#00173F]">Escolha o seu Plano</h1>
                    <p className="text-sm text-slate-500 mt-1">Planos flexíveis que crescem com você.</p>
                </div>

                <Card className="border-slate-200 shadow-xl shadow-slate-200/50 bg-white/70 backdrop-blur-md overflow-hidden rounded-3xl">
                    <CardContent className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                            {plans.map((plan) => {
                                const Icon = plan.icon
                                const isSelected = selectedPlanId === plan.id
                                const isCompatible = isPlanCompatible(plan)

                                return (
                                    <div
                                        key={plan.id}
                                        onClick={() => isCompatible && setSelectedPlanId(plan.id)}
                                        className={`relative flex flex-col p-6 rounded-2xl border-2 transition-all cursor-pointer group ${isSelected
                                            ? 'border-orange-500 bg-orange-50 shadow-lg shadow-orange-100'
                                            : isCompatible
                                                ? 'border-slate-100 bg-white hover:border-orange-200 hover:shadow-md'
                                                : 'border-slate-100 bg-slate-50 opacity-60 grayscale cursor-not-allowed'
                                            }`}
                                    >
                                        {!isCompatible && (
                                            <div className="absolute top-2 right-2">
                                                <div className="bg-slate-200 text-slate-500 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
                                                    Incompatível
                                                </div>
                                            </div>
                                        )}

                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${plan.bgClass} ${isSelected ? 'shadow-inner' : ''}`}>
                                            <Icon className={`w-5 h-5 ${plan.colorClass}`} />
                                        </div>

                                        <h3 className="text-sm font-black text-[#00173F] mb-1">{plan.name}</h3>
                                        <p className="text-[10px] text-slate-500 mb-4 line-clamp-2 h-8 leading-tight">
                                            {plan.description}
                                        </p>

                                        <div className="mt-auto pt-4 border-t border-slate-100/50">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-lg font-black text-[#00173F]">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.price)}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-medium">/mês</span>
                                            </div>
                                        </div>

                                        {isSelected && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                                <div className="w-2 h-2 bg-white rounded-full" />
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>

                    <CardFooter className="flex justify-between border-t p-6 bg-slate-50/50">
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/onboarding/step-2')}
                            className="rounded-xl text-slate-500 hover:text-[#00173F]"
                        >
                            Voltar
                        </Button>
                        <Button
                            onClick={handleComplete}
                            disabled={!selectedPlanId || isLoading}
                            className="bg-orange-500 hover:bg-orange-600 px-8 rounded-xl font-bold shadow-lg shadow-orange-200 transition-all font-display text-white"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processando...
                                </>
                            ) : 'Finalizar Onboarding →'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
