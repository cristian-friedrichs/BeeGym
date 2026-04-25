'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { User, Dumbbell, Building2, Zap, ArrowRight, Check, LogOut, Info } from 'lucide-react'
import { useOnboarding } from '@/contexts/OnboardingContext'
import { BeeGymLogo } from '@/components/ui/beegym-logo'
import { BEEGYM_PLANS, BeeGymPlan } from '@/config/plans'
import { motion, AnimatePresence } from 'framer-motion'

const RANGES = [
    { value: 20, label: 'Até 20 alunos', planId: 'plan_starter' },
    { value: 40, label: 'Até 40 alunos', planId: 'plan_plus' },
    { value: 100, label: 'Até 100 alunos', planId: 'plan_studio' },
    { value: 500, label: 'Até 500 alunos', planId: 'plan_pro' },
]

export default function OnboardingPage() {
    const router = useRouter()
    const { data, updateData } = useOnboarding()
    const supabase = createClient()

    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [orgId, setOrgId] = useState<string | null>(null)
    const [establishmentName, setEstablishmentName] = useState(data.organizationName || '')
    const [studentRange, setStudentRange] = useState<number>(Number(data.studentRange) || 20)
    const [step, setStep] = useState(1) // 1: Basic Info, 2: Plans

    useEffect(() => {
        const getUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            
            if (user) {
                // Fetch profile to get organization_id
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('organization_id, establishment_name, student_range')
                    .eq('user_id', user.id)
                    .single()
                
                if (profile) {
                    if (profile.organization_id) setOrgId(profile.organization_id)
                    if (profile.establishment_name && !establishmentName) setEstablishmentName(profile.establishment_name)
                    if (profile.student_range && !data.studentRange) setStudentRange(profile.student_range)
                }
            }
        }
        getUserData()
    }, [supabase])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    const suggestedPlanId = RANGES.find(r => r.value >= studentRange)?.planId || 'plan_pro'
    const suggestedPlan = BEEGYM_PLANS[suggestedPlanId]

    const handleProceedToPlans = () => {
        if (!establishmentName.trim()) return
        updateData({ organizationName: establishmentName, studentRange: studentRange.toString() })
        setStep(2)
    }

    const handleSelectPlan = async (plan: BeeGymPlan) => {
        setLoading(true)
        try {
            // 1. Update Profile in Supabase
            const { error: profileError } = await (supabase as any)
                .from('profiles')
                .upsert({
                    user_id: user?.id,
                    establishment_name: establishmentName,
                    student_range: studentRange,
                })

            if (profileError) throw profileError

            // 2. Update Organization in Supabase
            if (orgId) {
                const { error: orgError } = await (supabase as any)
                    .from('organizations')
                    .update({
                        name: establishmentName,
                        student_range: studentRange.toString(),
                        onboarding_completed: true,
                    })
                    .eq('id', orgId)
                
                if (orgError) throw orgError
            }

            // 3. Build Kiwify URL
            if (plan.kiwify_link) {
                const kiwifyUrl = new URL(plan.kiwify_link)
                
                // Attach user info for auto-fill in Kiwify
                if (user?.email) kiwifyUrl.searchParams.append('email', user.email)
                
                // Try to get name from metadata or profile
                const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name
                if (fullName) kiwifyUrl.searchParams.append('name', fullName)
                
                // Redirect to Kiwify
                window.location.href = kiwifyUrl.toString()
            }
        } catch (error) {
            console.error('Error during onboarding submission:', error)
            alert('Ocorreu um erro ao salvar suas informações. Por favor, tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-[100dvh] bg-[#0B0F1A] text-white overflow-x-hidden font-sans">
            <div className="max-w-5xl mx-auto w-full px-6 py-12 flex flex-col items-center">
                
                {/* Header */}
                <header className="w-full flex justify-between items-center mb-12">
                    <BeeGymLogo variant="dark" size="md" />
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Sair</span>
                    </button>
                </header>

                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.div 
                            key="step-1"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full max-w-2xl space-y-12"
                        >
                            <div className="text-center space-y-4">
                                <h1 className="text-4xl md:text-5xl font-black tracking-tight font-display">
                                    Vamos configurar seu <span className="text-bee-amber">Ecossistema</span>
                                </h1>
                                <p className="text-slate-400 text-lg">Conte-nos um pouco sobre o seu negócio para começarmos.</p>
                            </div>

                            <div className="space-y-8 bg-white/5 border border-white/10 p-8 md:p-12 rounded-3xl backdrop-blur-sm shadow-2xl">
                                {/* Section A: Basic Info */}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold uppercase tracking-wider text-bee-amber flex items-center gap-2">
                                            <Building2 className="w-4 h-4" />
                                            Nome do seu Estabelecimento
                                        </label>
                                        <input 
                                            type="text" 
                                            placeholder="Ex: Arena BeeGym, Studio Fit, etc."
                                            value={establishmentName}
                                            onChange={(e) => setEstablishmentName(e.target.value)}
                                            className="w-full bg-[#161C2C] border-2 border-white/5 focus:border-bee-amber outline-none p-5 rounded-2xl text-lg font-medium transition-all placeholder:text-slate-600"
                                        />
                                    </div>

                                    {/* Section B: Capacity */}
                                    <div className="space-y-4 pt-4">
                                        <label className="text-sm font-bold uppercase tracking-wider text-bee-amber flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            Quantos alunos você atende hoje?
                                        </label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {RANGES.map((range) => (
                                                <button
                                                    key={range.value}
                                                    onClick={() => setStudentRange(range.value)}
                                                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                                                        studentRange === range.value 
                                                        ? 'border-bee-amber bg-bee-amber/10 text-bee-amber font-bold' 
                                                        : 'border-white/5 bg-[#161C2C] text-slate-400 hover:border-white/20'
                                                    }`}
                                                >
                                                    {range.label}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-2 bg-blue-500/5 border border-blue-500/10 p-3 rounded-lg">
                                            <Info className="w-4 h-4 text-blue-400 shrink-0" />
                                            <p>Isso nos ajuda a sugerir o plano que melhor se adapta à sua estrutura atual.</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleProceedToPlans}
                                    disabled={!establishmentName.trim()}
                                    className="w-full bg-bee-amber hover:bg-bee-amber/90 disabled:opacity-50 disabled:hover:bg-bee-amber text-bee-midnight font-black text-xl py-6 rounded-2xl flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl shadow-bee-amber/20 group"
                                >
                                    Próximo Passo
                                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="step-2"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="w-full space-y-12"
                        >
                            <div className="text-center space-y-4">
                                <button 
                                    onClick={() => setStep(1)}
                                    className="text-bee-amber hover:underline text-sm font-bold flex items-center gap-1 mx-auto"
                                >
                                    ← Voltar e alterar dados
                                </button>
                                <h2 className="text-4xl md:text-5xl font-black tracking-tight font-display">
                                    Escolha o seu <span className="text-bee-amber">Plano</span>
                                </h2>
                                <p className="text-slate-400 text-lg">
                                    Sugerimos o plano <span className="text-white font-bold">{suggestedPlan.name}</span> baseado em sua capacidade de {studentRange} alunos.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {Object.values(BEEGYM_PLANS)
                                    .filter(p => p.id !== 'plan_enterprise')
                                    .map((plan) => {
                                        const isSuggested = plan.id === suggestedPlanId
                                        const Icon = plan.icon
                                        return (
                                            <div 
                                                key={plan.id}
                                                className={`relative flex flex-col p-8 rounded-3xl border-2 transition-all duration-500 hover:translate-y-[-8px] ${
                                                    isSuggested 
                                                    ? 'bg-bee-amber/5 border-bee-amber shadow-2xl shadow-bee-amber/10' 
                                                    : 'bg-white/5 border-white/10 hover:border-white/20'
                                                }`}
                                            >
                                                {isSuggested && (
                                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-bee-amber text-bee-midnight text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                                                        Recomendado
                                                    </div>
                                                )}

                                                <div className="mb-6">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${isSuggested ? 'bg-bee-amber text-bee-midnight' : 'bg-white/10 text-white'}`}>
                                                        <Icon className="w-6 h-6" />
                                                    </div>
                                                    <h3 className="text-2xl font-black font-display tracking-tight">{plan.name}</h3>
                                                    <p className="text-slate-500 text-sm font-medium mt-1">{plan.description}</p>
                                                </div>

                                                <div className="mb-8">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-sm font-bold text-slate-500">R$</span>
                                                        <span className="text-4xl font-black text-white">{plan.promo_price?.toFixed(2).replace('.', ',') || plan.price.toFixed(2).replace('.', ',')}</span>
                                                        <span className="text-sm font-medium text-slate-500">/mês</span>
                                                    </div>
                                                    {plan.promo_price && (
                                                        <div className="mt-1 flex flex-col">
                                                            <span className="text-xs text-slate-500 line-through">De R$ {plan.price.toFixed(2).replace('.', ',')}</span>
                                                            <span className="text-[10px] text-bee-amber font-bold uppercase tracking-wide bg-bee-amber/10 px-2 py-0.5 rounded w-fit mt-1">
                                                                Preço Promocional
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <ul className="space-y-4 mb-10 flex-grow">
                                                    {plan.featuresList.map((feature, i) => (
                                                        <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                                                            <Check className={`w-4 h-4 mt-0.5 shrink-0 ${isSuggested ? 'text-bee-amber' : 'text-slate-500'}`} />
                                                            <span>{feature}</span>
                                                        </li>
                                                    ))}
                                                </ul>

                                                <button
                                                    onClick={() => handleSelectPlan(plan)}
                                                    disabled={loading}
                                                    className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
                                                        isSuggested 
                                                        ? 'bg-bee-amber text-bee-midnight hover:scale-105 shadow-lg shadow-bee-amber/20' 
                                                        : 'bg-white/10 text-white hover:bg-white/20'
                                                    } disabled:opacity-50`}
                                                >
                                                    {loading ? 'Processando...' : 'Assinar Agora'}
                                                </button>
                                            </div>
                                        )
                                    })}
                            </div>
                            
                            <div className="text-center p-8 bg-white/5 border border-dashed border-white/10 rounded-3xl">
                                <h3 className="text-xl font-bold mb-2">Precisa de algo maior?</h3>
                                <p className="text-slate-400 mb-6">Para redes de academias ou projetos personalizados, fale com nosso time enterprise.</p>
                                <button className="text-bee-amber font-black uppercase tracking-widest text-sm hover:underline">
                                    Consultar Enterprise
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer Quote */}
                <footer className="mt-24 text-center">
                    <p className="text-slate-600 text-sm italic font-medium">
                        "Onde o foco encontra a disciplina, a tecnologia encontra a eficiência."
                    </p>
                </footer>
            </div>
        </div>
    )
}
