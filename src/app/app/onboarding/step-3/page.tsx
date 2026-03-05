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
            router.replace('/app/onboarding')
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
                subscriptionStatus: isEnterprise ? 'consulta' : 'pendente'
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
                router.push('/app/onboarding/pagamento')
            } else {
                toast({ title: 'Perfil recebido!', description: 'Iremos analisar sua solicitação Enterprise.' })
                setIsSuccess(true)
                resetData() // Aqui pode manter pois é o fim do fluxo enterprise
                router.push('/app/onboarding/obrigado')
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
        <div className="flex min-h-screen bg-white p-4 md:p-8">
            <div className="max-w-6xl mx-auto w-full my-auto space-y-10">
                <OnboardingProgress currentStep={3} />

                <div>
                    <h1 className="text-4xl font-black font-display text-bee-midnight tracking-tight">Escolha o seu Plano</h1>
                    <p className="text-sm text-slate-500 mt-2 font-medium">Planos flexíveis que crescem com você no BeeGym.</p>
                </div>

                <Card className="border-slate-100 shadow-2xl shadow-slate-200/40 bg-white overflow-hidden rounded-[2.5rem] border-t-4 border-t-bee-amber">
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
                                        className={`relative flex flex-col p-6 rounded-3xl border-2 transition-all cursor-pointer group hover:scale-[1.02] active:scale-[0.98] ${isSelected
                                            ? 'border-bee-amber bg-amber-50 shadow-xl shadow-bee-amber/10'
                                            : isCompatible
                                                ? 'border-slate-100 bg-white hover:border-bee-amber/30 hover:shadow-lg'
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

                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${plan.bgClass} ${isSelected ? 'shadow-inner' : ''}`}>
                                            <Icon className={`w-6 h-6 ${plan.colorClass}`} />
                                        </div>

                                        <h3 className="text-sm font-black text-[#0B0F1A] mb-1">{plan.name}</h3>
                                        <p className="text-[10px] text-slate-500 mb-4 line-clamp-2 h-8 leading-tight">
                                            {plan.description}
                                        </p>

                                        <div className="mt-auto pt-5 border-t border-slate-100/80">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-xl font-black text-bee-midnight font-display">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.price)}
                                                </span>
                                                <span className="text-xs text-slate-400 font-bold uppercase tracking-tighter">/mês</span>
                                            </div>
                                        </div>

                                        {isSelected && (
                                            <div className="absolute -top-2 -right-2 w-7 h-7 bg-bee-amber rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                                                <Check className="w-3.5 h-3.5 text-bee-midnight weight-black" />
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
                            onClick={() => router.push('/app/onboarding/step-2')}
                            className="rounded-xl text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:text-bee-midnight"
                        >
                            Voltar
                        </Button>
                        <Button
                            onClick={handleComplete}
                            disabled={!selectedPlanId || isLoading}
                            className="bg-bee-amber hover:bg-amber-500 px-10 h-14 rounded-2xl font-black shadow-xl shadow-bee-amber/20 transition-all font-display text-bee-midnight text-sm uppercase tracking-wider"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-bee-midnight" />
                                    Processando...
                                </>
                            ) : (
                                <>
                                    Finalizar Onboarding <ArrowRight className="w-5 h-5 ml-2" />
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
