'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { createClient } from '@/lib/supabase/client';
import { ResumoPlano, PlanoInfo } from '@/components/onboarding/pagamento/ResumoPlano';
import { MetodoPagamento, Metodo } from '@/components/onboarding/pagamento/MetodoPagamento';
import { InstrucoesPix } from '@/components/onboarding/pagamento/InstrucoesPix';
import { FormCartao, FormCartaoRef } from '@/components/onboarding/pagamento/FormCartao';
import { useToast } from '@/hooks/use-toast';
import { Lock, Loader2, CheckCircle, CheckCircle2, QrCode as QrCodeIcon, Copy, Check, ArrowRight, Shield, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { finalizeOnboardingAction } from '@/actions/onboarding-complete';
import { verifyPixStatusAction } from '@/actions/verify-pix';
import { BeeGymLogo } from '@/components/ui/beegym-logo';

// O plano é carregado dinamicamente do BD no useEffect

export default function PagamentoPage() {
    const router = useRouter();
    const { toast } = useToast();

    const [metodo, setMetodo] = useState<Metodo>('PIX_AUTOMATICO');
    const [userEmail, setUserEmail] = useState('');
    const [orgData, setOrgData] = useState<{ name: string; cpf_cnpj: string } | null>(null);
    const [plano, setPlano] = useState<PlanoInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const { data: onboardingData, resetData, isHydrated } = useOnboarding();

    // Estado para PIX (Exibição Inline)
    const [showPix, setShowPix] = useState(false);
    const [pixCopiaECola, setPixCopiaECola] = useState<string | null>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [copiado, setCopiado] = useState(false);

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

    // POLLING ATIVO PARA PIX
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (showPix) {
            console.log('[Pagamento] Iniciando polling para PIX...');
            interval = setInterval(async () => {
                try {
                    const result = await verifyPixStatusAction();
                    
                    // Se o status for CONCLUIDA ou se o retorno indicar que já está ativo/trial
                    if (result.success && (result.status === 'CONCLUIDA' || result.status === 'active' || result.status === 'trial')) {
                        console.log('[Pagamento] PIX detectado como pago! Redirecionando...');
                        clearInterval(interval);
                        
                        toast({ title: 'Pagamento Confirmado!', description: 'Sua assinatura foi ativada com sucesso.' });
                        
                        // Executa o finalize para limpar contexto e garantir acesso
                        const finalizeResult = await finalizeOnboardingAction();
                        if (!finalizeResult?.error) {
                            resetData();
                            router.push('/app/painel');
                        }
                    }
                } catch (error: any) {
                    console.error('[Pagamento] Erro no polling:', error);
                }
            }, 5000); // 5 segundos
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [showPix, router, toast, resetData]);

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

            if (metodo === 'PIX_AUTOMATICO') {
                if (data.pixCopiaECola) {
                    setPixCopiaECola(data.pixCopiaECola);
                    setShowPix(true);
                    
                    // Gerar imagem do QR Code
                    try {
                        const url = await QRCode.toDataURL(data.pixCopiaECola, {
                            width: 300,
                            margin: 2,
                            color: { dark: '#0B0F1A', light: '#ffffff' }
                        });
                        setQrCodeUrl(url);
                    } catch (err) {
                        console.error('Erro ao gerar QR Code:', err);
                    }
                    return;
                }
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

            // SUCESSO CARTÃO: Redirecionar para confirmação
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

    const handleCopyPix = () => {
        if (!pixCopiaECola) return;
        navigator.clipboard.writeText(pixCopiaECola);
        setCopiado(true);
        toast({ title: 'Código Copiado!', description: 'Agora cole no app do seu banco para autorizar.' });
        setTimeout(() => setCopiado(false), 2000);
    };

    const handleFinalizeOnboarding = async () => {
        setIsFinalizing(true);
        try {
            // 1. Verificar se o pagamento realmente caiu no banco
            const verif = await verifyPixStatusAction();
            
            if (verif.success && (verif.status === 'CONCLUIDA' || verif.status === 'active' || verif.status === 'trial')) {
                // 2. Se caiu, finalizar o onboarding
                const result = await finalizeOnboardingAction();
                if (result?.error) throw new Error(result.error);
                
                toast({ title: 'Pagamento Confirmado!', description: 'Sua conta foi ativada com sucesso. Bem-vindo ao BeeGym!' });
                resetData();
                router.push('/app/painel');
            } else {
                // 3. Se não caiu, avisar o usuário (Fim do Falso Sucesso)
                toast({ 
                    variant: 'destructive',
                    title: 'Pagamento não detectado', 
                    description: 'Ainda não recebemos a confirmação do seu banco. Aguarde alguns instantes e tente novamente.' 
                });
            }
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Erro ao verificar pagamento',
                description: err.message || 'Tente novamente.'
            });
        } finally {
            setIsFinalizing(false);
        }
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
        <div className="flex min-h-[100dvh] bg-[#0B0F1A] p-4 md:p-8">
            <div className="max-w-6xl mx-auto w-full my-auto space-y-6 pb-24">
                <div className="flex justify-center">
                    <BeeGymLogo variant="dark" size="lg" />
                </div>
                <OnboardingProgress currentStep={4} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    {/* Coluna Esquerda: Plano */}
                    <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <ResumoPlano plano={plano} isPromo={['STUDIO', 'PRO', 'ENTERPRISE'].includes(plano.tier)} />
                            {!showPix && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push('/app/onboarding/step-3')}
                                    className="text-slate-600 hover:text-bee-amber font-bold h-auto p-1 -ml-1 text-[10px] uppercase tracking-widest"
                                >
                                    ← Escolher outro plano
                                </Button>
                            )}
                        </div>

                        {!showPix && (
                            /* Card de Cupom */
                            <div className="bg-[#0B0F1A] p-4 border border-white/10 mt-4">
                                <h4 className="text-sm font-bold text-white mb-3">Possui um cupom de desconto?</h4>
                                {!appliedCoupon ? (
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Digite seu código"
                                                className="flex-1 border border-white/10 bg-white/5 text-white px-3 py-2 text-sm uppercase placeholder:normal-case placeholder:text-slate-600 focus:outline-none focus:border-bee-amber"
                                                value={couponCode}
                                                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                                            />
                                            <Button
                                                onClick={handleApplyCoupon}
                                                disabled={!couponCode || couponLoading}
                                                className="bg-white/10 text-slate-300 hover:bg-white/20"
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
                        )}
                    </div>

                    {/* Coluna Direita: Seleção e Formulário OU QR CODE */}
                    {!showPix ? (
                        <div className="flex flex-col space-y-6">
                            {/* Método */}
                            <div className="space-y-3">
                                <p className="text-sm font-bold text-white">Como você quer pagar?</p>
                                <MetodoPagamento value={metodo} onChange={m => setMetodo(m)} />
                            </div>

                            {/* Formulário Branco (Base apenas para dados) */}
                            <div className="bg-[#0B0F1A] border border-white/10 p-8 flex flex-col space-y-6 flex-1">

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
                                        className="w-full h-14 text-sm font-black bg-bee-amber hover:bg-amber-500 text-bee-midnight rounded-full shadow-xl shadow-bee-amber/20 transition-all font-display uppercase tracking-wider"
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
                    ) : (
                        /* VIEW DO QR CODE PIX */
                        <div className="flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-white rounded-[2.5rem] border-2 border-bee-amber shadow-2xl shadow-bee-amber/5 p-8 flex flex-col items-center text-center space-y-6">
                                <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center">
                                    <QrCodeIcon className="w-8 h-8 text-bee-amber" />
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-xl font-black font-display text-bee-midnight">Quase lá! Autorize no seu banco</h2>
                                    <p className="text-sm text-slate-500 max-w-xs mx-auto">
                                        Escaneie o QR Code abaixo ou copie o código para realizar o pagamento do primeiro mês.
                                    </p>
                                </div>

                                {/* QR Code Container */}
                                <div className="p-4 bg-white border-2 border-slate-50 rounded-3xl shadow-inner">
                                    {qrCodeUrl ? (
                                        <img src={qrCodeUrl} alt="QR Code Pix" className="w-56 h-56 mx-auto" />
                                    ) : (
                                        <div className="w-56 h-56 flex items-center justify-center bg-slate-50 rounded-2xl">
                                            <Loader2 className="w-8 h-8 animate-spin text-bee-amber" />
                                        </div>
                                    )}
                                </div>

                                {/* Copia e Cola */}
                                <div className="w-full space-y-3">
                                    <Button
                                        variant="outline"
                                        onClick={handleCopyPix}
                                        className="w-full h-12 border-2 border-slate-100 hover:border-bee-amber/30 text-bee-midnight font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                                    >
                                        {copiado ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                                        {copiado ? 'Código Copiado!' : 'Copiar Código Copia e Cola'}
                                    </Button>
                                    
                                    <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 uppercase font-black tracking-widest">
                                        <Shield className="w-3 h-3" />
                                        <span>Transação Segura via Banco Central</span>
                                    </div>
                                </div>

                                <div className="pt-4 w-full border-t border-slate-50 mt-2">
                                    <Button
                                        onClick={handleFinalizeOnboarding}
                                        disabled={isFinalizing}
                                        className="w-full h-14 bg-bee-midnight hover:bg-black text-white rounded-2xl font-black shadow-lg transition-all group font-display uppercase tracking-wider text-sm"
                                    >
                                        {isFinalizing ? (
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        ) : (
                                            <>Já realizei o pagamento <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" /></>
                                        )}
                                    </Button>
                                    <p className="text-[10px] text-slate-400 mt-3 font-medium">
                                        Ao clicar, você será levado ao painel e seu acesso será liberado.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowPix(false)}
                                className="text-xs text-slate-400 font-bold hover:text-bee-midnight transition-colors uppercase tracking-widest text-center"
                            >
                                ← Voltar para formas de pagamento
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
