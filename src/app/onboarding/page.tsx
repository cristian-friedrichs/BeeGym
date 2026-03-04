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
                    router.push('/painel')
                }
            } catch (error) {
                console.error('Auto-sync failed:', error)
            }
        }
        checkStatus()
    }, [router])

    const handleSelect = (typeId: string) => {
        updateData({ businessType: typeId })
        router.push('/onboarding/step-2')
    }

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-orange-50/20 p-4 md:p-8">
            <div className="max-w-6xl mx-auto w-full my-auto space-y-10">
                <OnboardingProgress currentStep={1} />

                {/* Title */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900">Qual o seu tipo de negócio?</h1>
                    <p className="text-gray-600">Selecione a opção que melhor descreve sua atuação para personalizarmos sua experiência.</p>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {businessTypes.map((type) => {
                        const Icon = type.icon
                        return (
                            <Card
                                key={type.id}
                                className="cursor-pointer transition-all duration-300 hover:ring-2 hover:ring-orange-500/20 hover:border-orange-500 hover:shadow-xl hover:shadow-orange-100 group border-slate-200 overflow-hidden bg-white/50 backdrop-blur-sm"
                                onClick={() => handleSelect(type.id)}
                            >
                                <CardHeader className="p-5 flex flex-col items-center text-center space-y-3">
                                    <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors duration-300">
                                        <Icon className="w-6 h-6 text-orange-500" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-bold text-[#00173F] mb-1">{type.title}</CardTitle>
                                        <CardDescription className="text-[11px] leading-relaxed text-slate-500">{type.description}</CardDescription>
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
                        className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
                    >
                        Sair e voltar ao Login
                    </button>
                </div>
            </div>
        </div>
    )
}
