'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ResumoPlano, PlanoInfo } from '@/components/onboarding/pagamento/ResumoPlano';
import { MetodoPagamento, Metodo } from '@/components/onboarding/pagamento/MetodoPagamento';
import { InstrucoesPix } from '@/components/onboarding/pagamento/InstrucoesPix';
import { FormCartao, FormCartaoRef } from '@/components/onboarding/pagamento/FormCartao';
import { useToast } from '@/hooks/use-toast';
import { Lock, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';

// O plano é carregado dinamicamente do BD no useEffect

export default function PagamentoPage() {
    const router = useRouter();
    const { toast } = useToast();

    const [metodo, setMetodo] = useState<Metodo>('PIX_AUTOMATICO');
    const [userEmail, setUserEmail] = useState('');
    const [orgData, setOrgData] = useState<{ name: string; cpf_cnpj: string } | null>(null);
    const [plano, setPlano] = useState<PlanoInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { data: onboardingData, resetData, isHydrated } = useOnboarding();

    // Estado para PIX (Billing independente)
    const [pixBilling, setPixBilling] = useState({ devedorNome: '', devedorCpf: '' });

    // Estado para Cupons
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError] = useState('');

    const formCartaoRef = useRef<FormCartaoRef | null>(null);

    const setCartaoRef = useCallback((ref: FormCartaoRef) => {
        formCartaoRef.current = ref;
    }, []);

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
                .select('organization_id')
                .eq('id', user.id)
                .single() as { data: { organization_id: string } | null };

            if (profile?.organization_id) {
                const { data: org } = await supabase
                    .from('organizations')
                    .select('name, cpf_cnpj')
                    .eq('id', profile.organization_id)
                    .single() as { data: { name: string, cpf_cnpj: string | null } | null };

                if (org) {
                    setOrgData({ name: org.name, cpf_cnpj: org.cpf_cnpj || '' });
                    // Inicializa billing do PIX com dados da org por conveniência
                    setPixBilling({
                        devedorNome: org.name,
                        devedorCpf: (org.cpf_cnpj || '').replace(/\D/g, '')
                    });
                }
            }
        }

        init();
    }, [router]);

    // Carregar plano do BD
    useEffect(() => {
        const fetchPlan = async () => {
            if (isHydrated) {
                const planId = onboardingData.planId;
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
                } else {
                    router.replace('/app/onboarding/step-3');
                }
            }
        };
        fetchPlan();
    }, [isHydrated, onboardingData.planId, router]);

    const handleAssinar = async () => {
        if (!plano) return;
        setIsLoading(true);

        try {
            let bodyPayload: Record<string, any> = {
                planoId: plano.id,
                metodo,
                ...(appliedCoupon && { couponId: appliedCoupon.id })
            };

            if (metodo === 'CARTAO_RECORRENTE') {
                if (!formCartaoRef.current) {
                    throw new Error('Formulário de cartão não inicializado.');
                }
                const dados = await formCartaoRef.current.tokenize();
                bodyPayload = {
                    ...bodyPayload,
                    paymentToken: dados.paymentToken,
                    billingAddress: dados.billingAddress,
                    customerData: dados.customerData, // Já contém os dados reais do formulário
                    devedorNome: dados.customerData.name, // Sincroniza campos se necessário no backend
                    devedorCpf: dados.customerData.cpf,
                };
            }

            if (metodo === 'PIX_AUTOMATICO') {
                // Validação básica PIX
                if (!pixBilling.devedorNome || pixBilling.devedorCpf.length < 11) {
                    throw new Error('Por favor, preencha o Nome e CPF/CNPJ do pagador para o PIX.');
                }
                bodyPayload = {
                    ...bodyPayload,
                    devedorNome: pixBilling.devedorNome,
                    devedorCpf: pixBilling.devedorCpf,
                };
            }

            const res = await fetch('/api/onboarding/assinar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyPayload),
            });

            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch {
                console.error('[Onboarding Pagamento] Erro ao parsear JSON:', text);
                throw new Error(`Erro de servidor (${res.status}). Ocorreu um problema ao processar a assinatura.`);
            }

            if (!res.ok) {
                if (data?.redirect) {
                    router.replace(data.redirect);
                    return;
                }
                throw new Error(data?.error || 'Erro ao processar assinatura.');
            }

            const params = new URLSearchParams({
                metodo,
                plano: plano.name,
                preco: String(plano.price),
            });

            if (data.urlConsentimento) params.append('urlConsentimento', data.urlConsentimento);
            if (data.pixCopiaECola) params.append('pixCopiaECola', data.pixCopiaECola);
            if (data.redirectUrl) params.append('urlConsentimento', data.redirectUrl); // Fallback para nomes de campos diferentes
            if (data.acessoLiberado) params.append('acessoLiberado', '1');
            if (data.statusEfi) params.append('statusEfi', data.statusEfi);

            // SUCESSO: Redirecionar para confirmação sem resetar ainda para evitar redirecionamentos em cadeia
            router.push(`/app/onboarding/pagamento/confirmacao?${params.toString()}`);

        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Erro no pagamento',
                description: err.message || 'Tente novamente em instantes.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!plano) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
        );
    }

    let discountedPrice = plano.promo_price ?? plano.price;
    let baseDiscountPrice = plano.promo_price ?? plano.price;

    if (appliedCoupon) {
        if (appliedCoupon.discount_type === 'PERCENTAGE') {
            discountedPrice = Math.max(0, baseDiscountPrice * (1 - (appliedCoupon.discount_value / 100)));
        } else if (appliedCoupon.discount_type === 'FIXED_AMOUNT') {
            discountedPrice = Math.max(0, baseDiscountPrice - appliedCoupon.discount_value);
        } else if (appliedCoupon.discount_type === 'FREE_MONTHS') {
            discountedPrice = 0; // Promocional
        }
    }

    const precoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(discountedPrice);

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setCouponLoading(true);
        setCouponError('');
        try {
            const res = await fetch(`/api/coupons/validate?code=${couponCode}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Cupom inválido');
            setAppliedCoupon(data.coupon);
            toast({ title: 'Cupom aplicado com sucesso!' });
        } catch (err: any) {
            setCouponError(err.message);
            setAppliedCoupon(null);
        } finally {
            setCouponLoading(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponError('');
    };

    return (
        <div className="flex min-h-[100dvh] bg-white p-4 md:p-8">
            <div className="max-w-6xl mx-auto w-full my-auto space-y-6 pb-24">
                <OnboardingProgress currentStep={4} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    {/* Coluna Esquerda: Plano */}
                    <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <ResumoPlano plano={plano} isPromo={['STUDIO', 'PRO', 'ENTERPRISE'].includes(plano.tier)} />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push('/app/onboarding/step-3')}
                                className="text-slate-400 hover:text-bee-midnight font-bold h-auto p-1 -ml-1 text-[10px] uppercase tracking-widest"
                            >
                                ← Escolher outro plano
                            </Button>
                        </div>

                        {/* Card de Cupom */}
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm mt-4">
                            <h4 className="text-sm font-bold text-[#0B0F1A] mb-3">Possui um cupom de desconto?</h4>
                            {!appliedCoupon ? (
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Digite seu código"
                                            className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm uppercase placeholder:normal-case focus:outline-none focus:border-bee-amber"
                                            value={couponCode}
                                            onChange={e => setCouponCode(e.target.value.toUpperCase())}
                                        />
                                        <Button
                                            onClick={handleApplyCoupon}
                                            disabled={!couponCode || couponLoading}
                                            className="bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        >
                                            {couponLoading ? 'Aplicando...' : 'Aplicar'}
                                        </Button>
                                    </div>
                                    {couponError && <p className="text-xs text-red-500">{couponError}</p>}
                                </div>
                            ) : (
                                <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                        <div>
                                            <p className="text-xs font-bold text-green-800 uppercase tracking-wider">{appliedCoupon.code}</p>
                                            <p className="text-[11px] text-green-600 mt-0.5">
                                                {appliedCoupon.discount_type === 'PERCENTAGE' && `${appliedCoupon.discount_value}% de desconto aplicado`}
                                                {appliedCoupon.discount_type === 'FIXED_AMOUNT' && `Desconto de R$ ${appliedCoupon.discount_value}`}
                                                {appliedCoupon.discount_type === 'FREE_MONTHS' && `${appliedCoupon.discount_value} mês(es) grátis aplicado`}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={handleRemoveCoupon} className="text-xs text-red-500 font-medium hover:underline">
                                        Remover
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Coluna Direita: Seleção e Formulário */}
                    <div className="flex flex-col space-y-6">
                        {/* Método */}
                        <div className="space-y-3">
                            <p className="text-sm font-bold text-[#0B0F1A]">Como você quer pagar?</p>
                            <MetodoPagamento value={metodo} onChange={m => setMetodo(m)} />
                        </div>

                        {/* Formulário Branco (Base apenas para dados) */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 p-8 flex flex-col space-y-6 flex-1">

                            {/* Conteúdo variável por método */}
                            <div className="flex-1">
                                {metodo === 'PIX_AUTOMATICO' ? (
                                    <InstrucoesPix
                                        initialName={orgData?.name}
                                        initialDoc={orgData?.cpf_cnpj}
                                        onChange={setPixBilling}
                                    />
                                ) : (
                                    <FormCartao
                                        email={userEmail}
                                        initialName={orgData?.name}
                                        initialDoc={orgData?.cpf_cnpj}
                                        onRef={setCartaoRef}
                                    />
                                )}
                            </div>

                            {/* Botão Assinar */}
                            <div className="pt-4 mt-auto">
                                <Button
                                    onClick={handleAssinar}
                                    disabled={isLoading}
                                    className="w-full h-14 text-sm font-black bg-bee-amber hover:bg-amber-500 text-bee-midnight rounded-2xl shadow-xl shadow-bee-amber/20 transition-all font-display uppercase tracking-wider"
                                >
                                    {isLoading ? (
                                        <><Loader2 className="w-5 h-5 animate-spin mr-2 text-bee-midnight" />Processando...</>
                                    ) : (
                                        `Assinar por ${precoFormatado}/mês`
                                    )}
                                </Button>

                                <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mt-4">
                                    <Lock className="w-3 h-3" />
                                    <span>Pagamento seguro via EFI · Cancele quando quiser</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
