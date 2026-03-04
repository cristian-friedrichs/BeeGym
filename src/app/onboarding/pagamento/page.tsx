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

// Planos disponíveis (sincronizado com step-3)
const planosMap: Record<string, PlanoInfo> = {
    '12532d9c-ace2-400d-81a7-4daf951966f8': { id: '12532d9c-ace2-400d-81a7-4daf951966f8', name: 'STARTER', tier: 'STARTER', price: 9.90, description: 'Ideal para profissionais independentes.', features: ['Gestão de Alunos e Pagamentos', 'Calendário Completo', 'Controle de Frequência', 'Relatórios e Alertas'] },
    '03f4ca44-ec71-4321-b425-634ab7c85791': { id: '03f4ca44-ec71-4321-b425-634ab7c85791', name: 'PLUS', tier: 'PLUS', price: 19.90, description: 'Para quem está crescendo.', features: ['Tudo do Starter', 'App do Aluno', 'Chat'] },
    'd37dadee-1f91-4a2c-ae7e-00f94392bda0': { id: 'd37dadee-1f91-4a2c-ae7e-00f94392bda0', name: 'STUDIO', tier: 'STUDIO', price: 29.90, description: 'Perfeito para Studios e Boxes.', features: ['Tudo do Plus', 'Aulas Coletivas', 'Múltiplos Agendamentos'] },
    '20a6a4a6-6b9d-4880-b6d3-bdc3693be00d': { id: '20a6a4a6-6b9d-4880-b6d3-bdc3693be00d', name: 'PRO', tier: 'PRO', price: 49.90, description: 'Gestão completa para médio porte.', features: ['Tudo do Studio', 'Múltiplos Instrutores', 'Automatização de Cobrança'] },
    '5dd1476d-23f7-4c05-8fa7-cc2da8f99baa': { id: '5dd1476d-23f7-4c05-8fa7-cc2da8f99baa', name: 'ENTERPRISE', tier: 'ENTERPRISE', price: 79.90, description: 'Solução ilimitada para grandes redes.', features: ['Tudo do Pro', 'Multipropriedade', 'Integração API', 'CRM'] },
};

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
                router.replace('/onboarding');
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

    // Carregar plano do context
    useEffect(() => {
        if (isHydrated) {
            const planId = onboardingData.planId;
            if (!planId || !planosMap[planId]) {
                router.replace('/onboarding/step-3');
                return;
            }
            setPlano(planosMap[planId]);
        }
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
            router.push(`/onboarding/pagamento/confirmacao?${params.toString()}`);

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

    let discountedPrice = plano.price;
    if (appliedCoupon) {
        if (appliedCoupon.discount_type === 'PERCENTAGE') {
            discountedPrice = Math.max(0, plano.price * (1 - (appliedCoupon.discount_value / 100)));
        } else if (appliedCoupon.discount_type === 'FIXED_AMOUNT') {
            discountedPrice = Math.max(0, plano.price - appliedCoupon.discount_value);
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
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-orange-50/20 p-4 md:p-8">
            <div className="max-w-6xl mx-auto w-full my-auto space-y-6">
                <OnboardingProgress currentStep={4} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    {/* Coluna Esquerda: Plano */}
                    <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <ResumoPlano plano={plano} isPromo={['STUDIO', 'PRO', 'ENTERPRISE'].includes(plano.tier)} />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push('/onboarding/step-3')}
                                className="text-slate-400 hover:text-bee-orange font-medium h-auto p-1 -ml-1 text-xs"
                            >
                                ← Escolher outro plano
                            </Button>
                        </div>

                        {/* Card de Cupom */}
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm mt-4">
                            <h4 className="text-sm font-bold text-[#00173F] mb-3">Possui um cupom de desconto?</h4>
                            {!appliedCoupon ? (
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Digite seu código"
                                            className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm uppercase placeholder:normal-case focus:outline-none focus:border-bee-orange"
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
                            <p className="text-sm font-bold text-[#00173F]">Como você quer pagar?</p>
                            <MetodoPagamento value={metodo} onChange={m => setMetodo(m)} />
                        </div>

                        {/* Formulário Branco (Base apenas para dados) */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col space-y-6 flex-1">

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
                                    className="w-full h-12 text-base font-bold bg-bee-orange hover:bg-orange-500 text-white rounded-2xl shadow-orange-200 shadow-md transition-all"
                                >
                                    {isLoading ? (
                                        <><Loader2 className="w-4 h-4 animate-spin mr-2" />Processando...</>
                                    ) : (
                                        `Assinar por ${precoFormatado}/mês →`
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
