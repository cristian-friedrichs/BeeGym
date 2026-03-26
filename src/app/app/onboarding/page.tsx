'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { User, Dumbbell, Building2, Stethoscope, Trophy } from 'lucide-react'
import { useOnboarding } from '@/contexts/OnboardingContext'
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress'
import { BeeGymLogo } from '@/components/ui/beegym-logo'

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

    // Attempt to self-heal stuck sessions - REMOVED: potentially causing redirect loops
    /*
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
    */

    const handleSelect = (typeId: string) => {
        updateData({ businessType: typeId })
        router.push('/app/onboarding/step-2')
    }

    return (
        <div className="flex min-h-[100dvh] bg-[#0B0F1A] p-4 md:p-8">
            <div className="max-w-6xl mx-auto w-full my-auto space-y-10 pb-24">
                {/* Logo */}
                <div className="flex justify-center">
                    <BeeGymLogo variant="dark" size="lg" />
                </div>

                <OnboardingProgress currentStep={1} />

                {/* Title */}
                <div className="text-center space-y-3">
                    <h1 className="text-4xl font-black text-white font-display tracking-tight">Qual o seu tipo de negócio?</h1>
                    <p className="text-slate-500 max-w-xl mx-auto">Selecione a opção que melhor descreve sua atuação para personalizarmos sua experiência no BeeGym.</p>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px bg-white/10">
                    {businessTypes.map((type) => {
                        const Icon = type.icon
                        return (
                            <div
                                key={type.id}
                                className="cursor-pointer transition-all duration-300 bg-[#0B0F1A] hover:bg-white/[0.04] group p-8 flex flex-col items-center text-center space-y-4"
                                onClick={() => handleSelect(type.id)}
                            >
                                <div className="w-14 h-14 bg-bee-amber/10 flex items-center justify-center group-hover:bg-bee-amber transition-all duration-500">
                                    <Icon className="w-7 h-7 text-bee-amber group-hover:text-bee-midnight transition-colors" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white mb-1 font-display">{type.title}</h3>
                                    <p className="text-xs leading-relaxed text-slate-500 font-medium">{type.description}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Back Button */}
                <div className="flex justify-center">
                    <button
                        onClick={handleLogout}
                        className="text-xs text-slate-600 hover:text-bee-amber transition-colors font-bold uppercase tracking-widest"
                    >
                        Sair e voltar ao Login
                    </button>
                </div>
            </div>
        </div>
    )
}
