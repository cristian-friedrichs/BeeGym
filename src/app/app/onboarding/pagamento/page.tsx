'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ResumoPlano, PlanoInfo } from '@/components/onboarding/pagamento/ResumoPlano';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { BeeGymLogo } from '@/components/ui/beegym-logo';
import { BEEGYM_PLANS } from '@/config/plans';

export default function PagamentoPage() {
    const router = useRouter();
    const { toast } = useToast();

    const [userEmail, setUserEmail] = useState('');
    const [userName, setUserName] = useState('');
    const [orgId, setOrgId] = useState('');
    const [isUserLoaded, setIsUserLoaded] = useState(false);
    const [plano, setPlano] = useState<PlanoInfo | null>(null);
    const [kiwifyLink, setKiwifyLink] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { data: onboardingData, isHydrated } = useOnboarding();

    useEffect(() => {
        const supabase = createClient();

        async function init() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.replace('/app/onboarding');
                return;
            }
            setUserEmail(user.email || '');

            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, organization_id')
                .eq('id', user.id)
                .single() as { data: { full_name: string | null, organization_id: string | null } | null };

            if (profile?.full_name) {
                setUserName(profile.full_name);
            }
            if (profile?.organization_id) {
                setOrgId(profile.organization_id);
            }
            setIsUserLoaded(true);
        }

        init();
    }, [router]);

    // Carregar plano do BD (ou recuperar do banco se localStorage perdeu o planId)
    useEffect(() => {
        const fetchPlan = async () => {
            if (!isHydrated || !isUserLoaded) return;

            let planId = onboardingData.planId;

            // Se não tem planId no localStorage, tentar recuperar do banco
            if (!planId && orgId) {
                const supabase = createClient();
                const { data: sub } = await supabase
                    .from('saas_subscriptions')
                    .select('saas_plan_id')
                    .eq('organization_id', orgId)
                    .maybeSingle();

                if (sub?.saas_plan_id) {
                    planId = sub.saas_plan_id;
                }
            }

            if (!planId) {
                router.replace('/app/onboarding/step-3');
                return;
            }

            const supabase = createClient();
            const { data: dbPlan } = await supabase.from('saas_plans').select('*').eq('id', planId).single() as { data: any };
            if (dbPlan) {
                setPlano({
                    id: dbPlan.id,
                    name: dbPlan.name,
                    tier: dbPlan.tier,
                    price: dbPlan.price,
                    description: dbPlan.description || '',
                    features: dbPlan.features || [],
                    promo_price: dbPlan.promo_price,
                    promo_months: dbPlan.promo_months
                });

                // Buscar o link correspondente no config
                const configPlan = Object.values(BEEGYM_PLANS).find(p => p.id === dbPlan.id || p.name.toUpperCase() === dbPlan.tier.toUpperCase());
                if (configPlan && configPlan.kiwify_link) {
                    setKiwifyLink(configPlan.kiwify_link);
                }
            } else {
                router.replace('/app/onboarding/step-3');
            }
        };
        fetchPlan();
    }, [isHydrated, isUserLoaded, onboardingData.planId, orgId, router]);


    const handleCheckoutKiwify = () => {
        if (!kiwifyLink) {
            toast({
                variant: 'destructive',
                title: 'Erro de Configuração',
                description: 'Link de checkout não encontrado para este plano.'
            });
            return;
        }

        setIsLoading(true);
        
        // Passar parâmetros para a Kiwify para facilitar o checkout
        const url = new URL(kiwifyLink);
        if (userEmail) url.searchParams.append('email', userEmail);
        if (userName) url.searchParams.append('name', userName);
        if (orgId) url.searchParams.append('src', orgId);

        // Redirecionar
        window.location.href = url.toString();
    };

    if (!plano) {
        if (isHydrated && !onboardingData.planId) {
            return (
                <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0F1A] space-y-4 p-4 text-center">
                    <div className="w-16 h-16 bg-white/10 flex items-center justify-center mb-4">
                        <AlertCircle className="w-8 h-8 text-slate-400" />
                    </div>
                    <h2 className="text-xl font-bold font-display text-white">Sessão Expirada</h2>
                    <p className="text-slate-500 max-w-md">Não encontramos um plano selecionado. Por favor, volte e escolha um plano novamente para prosseguir.</p>
                    <Button onClick={() => router.replace('/app/onboarding/step-3')} className="mt-4 bg-bee-amber text-bee-midnight hover:bg-amber-500 font-bold rounded-full h-12 px-8">
                        Voltar para os planos
                    </Button>
                </div>
            );
        }
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#0B0F1A]">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
        );
    }

    const discountedPrice = plano.promo_price ?? plano.price;
    const precoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(discountedPrice);

    return (
        <div className="flex min-h-[100dvh] bg-[#0B0F1A] p-4 md:p-8">
            <div className="max-w-6xl mx-auto w-full my-auto space-y-6 pb-24">
                <div className="flex justify-center">
                    <BeeGymLogo variant="dark" size="lg" />
                </div>
                <OnboardingProgress currentStep={4} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-4xl mx-auto">
                    {/* Coluna Esquerda: Plano */}
                    <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <ResumoPlano plano={plano} isPromo={['STUDIO', 'PRO', 'ENTERPRISE'].includes(plano.tier)} />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push('/app/onboarding/step-3')}
                                className="text-slate-600 hover:text-bee-amber font-bold h-auto p-1 -ml-1 text-[10px] uppercase tracking-widest"
                            >
                                ← Escolher outro plano
                            </Button>
                        </div>
                    </div>

                    {/* Coluna Direita: Call to Action Checkout */}
                    <div className="flex flex-col space-y-6">
                        <div className="bg-[#0B0F1A] border border-white/10 p-8 flex flex-col space-y-6 flex-1 rounded-2xl">
                            
                            <div className="flex-1 space-y-4 text-center flex flex-col justify-center">
                                <h3 className="text-xl font-display font-black text-white uppercase tracking-wider">
                                    Finalize sua Assinatura
                                </h3>
                                <p className="text-sm text-slate-400">
                                    Você será redirecionado para o ambiente de pagamento seguro da Kiwify.
                                </p>
                            </div>

                            {/* Botão Assinar */}
                            <div className="pt-4 mt-auto space-y-4">
                                <Button
                                    onClick={handleCheckoutKiwify}
                                    disabled={isLoading || !kiwifyLink}
                                    className="w-full h-14 text-sm font-black bg-bee-amber hover:bg-amber-500 text-bee-midnight rounded-full shadow-xl shadow-bee-amber/20 transition-all font-display uppercase tracking-wider group"
                                >
                                    {isLoading ? (
                                        <><Loader2 className="w-5 h-5 animate-spin mr-2 text-bee-midnight" />Redirecionando...</>
                                    ) : (
                                        <>
                                            Assinar por {precoFormatado}/mês 
                                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </Button>

                                <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mt-4">
                                    <Lock className="w-3 h-3" />
                                    <span>Pagamento 100% Seguro via Kiwify</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Botão Sair */}
                <div className="flex justify-center pt-4">
                    <button
                        onClick={async () => {
                            const { createClient } = await import('@/lib/supabase/client')
                            const supabase = createClient()
                            await supabase.auth.signOut()
                            router.push('/login')
                            router.refresh()
                        }}
                        className="text-[10px] text-slate-600 hover:text-bee-amber transition-colors font-bold uppercase tracking-widest text-center"
                    >
                        Sair e voltar ao Login
                    </button>
                </div>
            </div>
        </div>
    );
}
