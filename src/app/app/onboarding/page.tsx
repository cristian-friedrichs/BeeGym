'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { User, Dumbbell, Building2, Stethoscope, Trophy } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useOnboarding } from '@/contexts/OnboardingContext'
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress'

const businessTypes = [
    {
        id: 'Personal',
        title: 'Personal Trainer',
        description: 'Gerencie seus alunos individualmente com treinos personalizados.',
        icon: User,
    },
    {
        id: 'Studio',
        title: 'Studio / Box',
        description: 'Ideal para pequenos grupos, crossfit, pilates e funcionais.',
        icon: Dumbbell,
    },
    {
        id: 'Academia',
        title: 'Academia',
        description: 'Gestão completa de acesso, catracas e mensalidades recorrentes.',
        icon: Building2,
    },
    {
        id: 'Fisioterapia',
        title: 'Fisioterapia',
        description: 'Agendamento clínico e prontuário eletrônico.',
        icon: Stethoscope,
    },
    {
        id: 'Escola',
        title: 'Escola',
        description: 'Para escolas de esportes (Natação, Futebol) e Artes Marciais.',
        icon: Trophy,
    },
]



export default function OnboardingStep1() {
    const router = useRouter()
    const { updateData } = useOnboarding()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    // Attempt to self-heal stuck sessions
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const { syncAuthMetadata } = await import('@/actions/auth-sync')
                const result = await syncAuthMetadata()
                if (result.success) {
                    router.refresh()
                    router.push('/app/painel')
                }
            } catch (error) {
                console.error('Auto-sync failed:', error)
            }
        }
        checkStatus()
    }, [router])

    const handleSelect = (typeId: string) => {
        updateData({ businessType: typeId })
        router.push('/app/onboarding/step-2')
    }

    return (
        <div className="flex min-h-[100dvh] bg-white p-4 md:p-8">
            <div className="max-w-6xl mx-auto w-full my-auto space-y-10 pb-24">
                <OnboardingProgress currentStep={1} />

                {/* Title */}
                <div className="text-center space-y-3">
                    <h1 className="text-4xl font-black text-bee-midnight font-display tracking-tight">Qual o seu tipo de negócio?</h1>
                    <p className="text-slate-500 max-w-xl mx-auto">Selecione a opção que melhor descreve sua atuação para personalizarmos sua experiência no BeeGym.</p>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {businessTypes.map((type) => {
                        const Icon = type.icon
                        return (
                            <Card
                                key={type.id}
                                className="cursor-pointer transition-all duration-300 hover:ring-2 hover:ring-bee-amber/20 hover:border-bee-amber hover:shadow-2xl hover:shadow-bee-amber/10 group border-slate-100 overflow-hidden bg-white rounded-3xl"
                                onClick={() => handleSelect(type.id)}
                            >
                                <CardHeader className="p-6 flex flex-col items-center text-center space-y-4">
                                    <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center group-hover:bg-bee-amber group-hover:rotate-6 transition-all duration-500 shadow-sm group-hover:shadow-bee-amber/20">
                                        <Icon className="w-7 h-7 text-bee-amber group-hover:text-bee-midnight transition-colors" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-black text-bee-midnight mb-1 font-display">{type.title}</CardTitle>
                                        <CardDescription className="text-xs leading-relaxed text-slate-400 font-medium">{type.description}</CardDescription>
                                    </div>
                                </CardHeader>
                            </Card>
                        )
                    })}
                </div>

                {/* Back Button */}
                <div className="flex justify-center">
                    <button
                        onClick={handleLogout}
                        className="text-xs text-slate-400 hover:text-bee-midnight transition-colors font-bold uppercase tracking-widest"
                    >
                        Sair e voltar ao Login
                    </button>
                </div>
            </div>
        </div>
    )
}
