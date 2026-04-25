'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { User, Building2, Zap, Check, LogOut, Phone, CreditCard, Users, Loader2 } from 'lucide-react'
import { useOnboarding } from '@/contexts/OnboardingContext'
import { BeeGymLogo } from '@/components/ui/beegym-logo'
import { BEEGYM_PLANS, BeeGymPlan } from '@/config/plans'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'

const onboardingSchema = z.object({
    establishment_name: z.string().min(3, 'Nome do estabelecimento deve ter pelo menos 3 caracteres'),
    phone: z.string().min(14, 'Telefone inválido'),
    document_id: z.string().min(14, 'CPF/CNPJ inválido'),
    student_range: z.string().min(1, 'Selecione a quantidade de alunos'),
})

type OnboardingFormValues = z.infer<typeof onboardingSchema>

const RANGES = [
    { value: 'até-20', label: 'Até 20 alunos', min: 0, planIds: ['plan_starter', 'plan_plus', 'plan_studio', 'plan_pro'] },
    { value: '21-40', label: 'De 21 a 40 alunos', min: 21, planIds: ['plan_plus', 'plan_studio', 'plan_pro'] },
    { value: '41-100', label: 'De 41 a 100 alunos', min: 41, planIds: ['plan_studio', 'plan_pro'] },
    { value: '101-500', label: 'De 101 a 500 alunos', min: 101, planIds: ['plan_pro'] },
]

export default function OnboardingPage() {
    const router = useRouter()
    const { data: cachedData, updateData } = useOnboarding()
    const { user } = useAuth()
    const supabase = createClient()
    const { toast } = useToast()

    const [loading, setLoading] = useState(false)
    const [mounted, setMounted] = useState(false)

    const {
        register,
        setValue,
        watch,
        trigger,
        getValues,
        formState: { errors },
    } = useForm<OnboardingFormValues>({
        resolver: zodResolver(onboardingSchema),
        defaultValues: {
            establishment_name: cachedData.organizationName || '',
            phone: cachedData.phone || '',
            document_id: cachedData.documentId || '',
            student_range: cachedData.studentRange || '',
        },
    })

    const selectedRangeValue = watch('student_range')
    const currentRange = RANGES.find(r => r.value === selectedRangeValue)

    useEffect(() => {
        setMounted(true)
        const fetchProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            const currentUser = session?.user
            
            if (currentUser) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('establishment_name, phone, document_id, student_range')
                    .eq('id', currentUser.id)
                    .single()
                
                if (profile) {
                    if (profile.establishment_name) setValue('establishment_name', profile.establishment_name)
                    if (profile.phone) setValue('phone', profile.phone)
                    if (profile.document_id) setValue('document_id', profile.document_id)
                    if (profile.student_range) setValue('student_range', profile.student_range)
                }
            }
        }
        fetchProfile()
    }, [supabase, setValue])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    const formatPhone = (value: string) => {
        const numbers = value.replace(/\D/g, '').slice(0, 11)
        if (numbers.length <= 2) return numbers
        if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
    }

    const formatDocument = (value: string) => {
        const numbers = value.replace(/\D/g, '').slice(0, 14)
        if (numbers.length <= 11) {
            return numbers
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        } else {
            return numbers
                .replace(/^(\d{2})(\d)/, '$1.$2')
                .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
                .replace(/\.(\d{3})(\d)/, '.$1/$2')
                .replace(/(\d{4})(\d)/, '$1-$2')
        }
    }

    const onPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const masked = formatPhone(e.target.value)
        setValue('phone', masked)
    }

    const onDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const masked = formatDocument(e.target.value)
        setValue('document_id', masked)
    }

    const handleSelectPlan = async (plan: BeeGymPlan) => {
        // 1. Validate form first
        const isValid = await trigger()
        if (!isValid) {
            toast({
                title: 'Campos incompletos',
                description: 'Por favor, preencha todos os dados do estabelecimento antes de prosseguir.',
                variant: 'destructive',
            })
            return
        }

        // 2. Save to DB
        setLoading(true)
        try {
            const formData = getValues()
            const { data: { session } } = await supabase.auth.getSession()
            const currentUser = session?.user
            if (!currentUser) throw new Error('Usuário não autenticado')

            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    establishment_name: formData.establishment_name,
                    phone: formData.phone,
                    document_id: formData.document_id,
                    student_range: formData.student_range,
                })
                .eq('id', currentUser.id)

            if (profileError) throw profileError

            updateData({
                organizationName: formData.establishment_name,
                phone: formData.phone,
                documentId: formData.document_id,
                studentRange: formData.student_range,
            })

            // 3. Redirect to Kiwify
            if (plan.kiwify_link) {
                const kiwifyUrl = new URL(plan.kiwify_link)
                
                // Prefill user info in checkout
                if (user?.email) kiwifyUrl.searchParams.append('email', user.email)
                
                const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name
                if (fullName) kiwifyUrl.searchParams.append('name', fullName)
                
                // Add phone number to checkout if possible
                if (formData.phone) {
                    const cleanPhone = formData.phone.replace(/\D/g, '')
                    kiwifyUrl.searchParams.append('phone', cleanPhone)
                }

                window.location.href = kiwifyUrl.toString()
            }
        } catch (error: any) {
            console.error('Error during selection:', error)
            toast({
                title: 'Erro ao processar',
                description: error.message || 'Ocorreu um erro ao salvar seus dados.',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    if (!mounted) return null

    return (
        <div className="min-h-screen bg-[#0B0F1A] text-white font-sans selection:bg-bee-amber/30">
            <div className="container mx-auto px-6 py-10">
                
                {/* Header */}
                <header className="flex justify-between items-center mb-12">
                    <BeeGymLogo variant="dark" size="md" />
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-medium bg-white/5 px-4 py-2 rounded-full border border-white/10"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Sair</span>
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    
                    {/* Left Column: Form */}
                    <div className="space-y-8">
                        <div className="space-y-6 bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-md shadow-2xl">
                            {/* Establishment Name */}
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-bee-amber flex items-center gap-2">
                                    <Building2 className="w-4 h-4" />
                                    Nome do seu Estabelecimento
                                </label>
                                <input 
                                    {...register('establishment_name')}
                                    type="text" 
                                    placeholder="Ex: Arena BeeGym, Studio Fit, etc."
                                    className={`w-full bg-[#161C2C] border-2 ${errors.establishment_name ? 'border-red-500/50' : 'border-white/5'} focus:border-bee-amber outline-none p-4 rounded-xl text-lg font-medium transition-all placeholder:text-slate-600`}
                                />
                                {errors.establishment_name && <p className="text-red-400 text-xs font-bold">{errors.establishment_name.message}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Phone */}
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-bee-amber flex items-center gap-2">
                                        <Phone className="w-4 h-4" />
                                        Telefone
                                    </label>
                                    <input 
                                        {...register('phone')}
                                        onChange={onPhoneChange}
                                        type="text" 
                                        placeholder="(99) 99999-9999"
                                        className={`w-full bg-[#161C2C] border-2 ${errors.phone ? 'border-red-500/50' : 'border-white/5'} focus:border-bee-amber outline-none p-4 rounded-xl text-lg font-medium transition-all placeholder:text-slate-600`}
                                    />
                                    {errors.phone && <p className="text-red-400 text-xs font-bold">{errors.phone.message}</p>}
                                </div>

                                {/* Document */}
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-bee-amber flex items-center gap-2">
                                        <CreditCard className="w-4 h-4" />
                                        CPF / CNPJ
                                    </label>
                                    <input 
                                        {...register('document_id')}
                                        onChange={onDocumentChange}
                                        type="text" 
                                        placeholder="000.000.000-00"
                                        className={`w-full bg-[#161C2C] border-2 ${errors.document_id ? 'border-red-500/50' : 'border-white/5'} focus:border-bee-amber outline-none p-4 rounded-xl text-lg font-medium transition-all placeholder:text-slate-600`}
                                    />
                                    {errors.document_id && <p className="text-red-400 text-xs font-bold">{errors.document_id.message}</p>}
                                </div>
                            </div>

                            {/* Student Range Dropdown */}
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-bee-amber flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    Quantos alunos você atende hoje?
                                </label>
                                <select 
                                    {...register('student_range')}
                                    className={`w-full bg-[#161C2C] border-2 ${errors.student_range ? 'border-red-500/50' : 'border-white/5'} focus:border-bee-amber outline-none p-4 rounded-xl text-lg font-medium transition-all appearance-none cursor-pointer`}
                                >
                                    <option value="" disabled className="bg-[#161C2C]">Selecione uma opção...</option>
                                    {RANGES.map(range => (
                                        <option key={range.value} value={range.value} className="bg-[#161C2C] py-2">
                                            {range.label}
                                        </option>
                                    ))}
                                </select>
                                {errors.student_range && <p className="text-red-400 text-xs font-bold">{errors.student_range.message}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Plans */}
                    <div className="space-y-8 min-h-[400px]">
                        <AnimatePresence mode="wait">
                            {!selectedRangeValue ? (
                                <motion.div 
                                    key="placeholder"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="h-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/10 rounded-3xl bg-white/[0.02]"
                                >
                                    <div className="w-20 h-20 rounded-full bg-bee-amber/5 flex items-center justify-center mb-6">
                                        <Zap className="w-10 h-10 text-bee-amber/20" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-center text-slate-400">
                                        Selecione a quantidade de alunos para habilitar os planos.
                                    </h3>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="plans"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-8"
                                >
                                    <div className="text-center lg:text-left space-y-2">
                                        <h2 className="text-3xl font-black font-display">Nossos <span className="text-bee-amber">Planos</span></h2>
                                        <p className="text-slate-400">Selecione o plano desejado para finalizar.</p>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        {Object.values(BEEGYM_PLANS)
                                            .filter(p => p.id !== 'plan_enterprise' && currentRange?.planIds.includes(p.id))
                                            .map((plan) => {
                                                const Icon = plan.icon
                                                return (
                                                    <div 
                                                        key={plan.id}
                                                        className={`relative flex flex-col md:flex-row items-center gap-6 p-6 rounded-2xl border-2 transition-all duration-300 hover:border-bee-amber/50 bg-white/5 border-white/10`}
                                                    >
                                                        <div className="flex items-center gap-4 w-full md:w-1/3">
                                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-bee-amber/10 text-bee-amber shrink-0`}>
                                                                 <Icon className="w-6 h-6" />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-xl font-black font-display tracking-tight">{plan.name}</h3>
                                                                <p className="text-slate-500 text-[10px] font-medium leading-tight">{plan.description}</p>
                                                            </div>
                                                        </div>

                                                        <div className="hidden md:flex flex-col gap-1 w-full md:w-1/3">
                                                            {plan.featuresList.slice(0, 3).map((feature, i) => (
                                                                <div key={i} className="flex items-center gap-2 text-[11px] text-slate-400">
                                                                    <Check className={`w-3 h-3 text-bee-amber`} />
                                                                    <span className="truncate">{feature}</span>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-1/3 gap-4">
                                                            <div className="text-right">
                                                                <div className="flex items-baseline gap-1 justify-end">
                                                                    <span className="text-[10px] font-bold text-slate-500">R$</span>
                                                                    <span className="text-2xl font-black text-white">{plan.promo_price?.toFixed(2).replace('.', ',') || plan.price.toFixed(2).replace('.', ',')}</span>
                                                                </div>
                                                                {plan.promo_price && (
                                                                    <span className="text-[9px] text-bee-amber font-black uppercase tracking-wider bg-bee-amber/10 px-1.5 py-0.5 rounded">
                                                                        Promo
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <button
                                                                onClick={() => handleSelectPlan(plan)}
                                                                disabled={loading}
                                                                className="px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all bg-bee-amber text-bee-midnight hover:scale-105 shadow-lg shadow-bee-amber/10 flex items-center gap-2 disabled:opacity-50"
                                                            >
                                                                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Avançar'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                    </div>

                                    <div className="p-4 bg-bee-amber/5 border border-dashed border-bee-amber/20 rounded-2xl text-center">
                                        <p className="text-xs font-bold text-slate-500 italic">Ao avançar, você será redirecionado para o pagamento seguro.</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Footer Quote */}
                <footer className="mt-20 text-center border-t border-white/5 pt-10">
                    <p className="text-slate-600 text-sm italic font-medium">
                        "Onde o foco encontra a disciplina, a tecnologia encontra a eficiência."
                    </p>
                </footer>
            </div>
        </div>
    )
}
