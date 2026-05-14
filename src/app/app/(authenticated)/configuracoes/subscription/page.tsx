'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { useSubscription } from '@/hooks/useSubscription';
import { useStudentLimit } from '@/hooks/useStudentLimit';
import { PlanFeature, BEEGYM_PLANS, BeeGymPlan } from '@/config/plans';
import { Crown, Check, CheckCircle2, AlertTriangle, ArrowRight, Loader2, CreditCard, CalendarDays, ShieldCheck, TrendingUp, TrendingDown, PartyPopper, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

import { SectionHeader } from '@/components/ui/section-header';

export default function SubscriptionPage() {
    const { plan, isActive, status, loading: subLoading, metodo, proximoVencimento, displayFeatures, effectivePrice } = useSubscription();
    const { activeCount, maxStudents, isUnlimited, loading: limitLoading } = useStudentLimit();
    const { toast } = useToast();
    const searchParams = useSearchParams();

    // Mode: 'overview' | 'upgrade' | 'downgrade' | 'cancel'
    const [mode, setMode] = useState<'overview' | 'plans' | 'cancel'>('overview');
    const [isCanceling, setIsCanceling] = useState(false);
    const [upgradeSuccess, setUpgradeSuccess] = useState<string | null>(null);

    // Detect return from Kiwify checkout (?upgraded=PLUS)
    useEffect(() => {
        const upgraded = searchParams.get('upgraded');
        if (upgraded) {
            setUpgradeSuccess(upgraded);
            // Clean URL without reload
            window.history.replaceState({}, '', window.location.pathname);
            toast({
                title: '🎉 Upgrade realizado!',
                description: `Seu plano está sendo atualizado para ${upgraded}. Pode levar alguns instantes.`,
            });
        }
    }, []);

    const isTestPlan = ['TESTE', 'TESTE_MANUAL', 'MANUAL_ADMIN'].includes(metodo || '') || ['teste', 'demo'].includes(status?.toLowerCase() || '');

    const handleCancel = async () => {
        if (!confirm('Para cancelar sua assinatura você será redirecionado ao portal Kiwify. Deseja continuar?')) return;

        setIsCanceling(true);
        try {
            const res = await fetch('/api/subscription/cancel', { method: 'POST' });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Erro ao processar cancelamento');

            if (data.action === 'redirect' && data.url) {
                window.open(data.url, '_blank', 'noopener,noreferrer');
                toast({
                    title: "Portal Kiwify aberto",
                    description: data.message,
                });
            }
        } catch (error: any) {
            toast({
                title: "Erro",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsCanceling(false);
        }
    };

    const isLoading = subLoading || limitLoading;

    if (isLoading) {
        return (
            <div className="flex flex-col h-[400px] w-full items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-bee-amber" />
            </div>
        );
    }

    if (mode === 'plans') {
        return <PlanSelectionView currentPlanId={plan.id} onBack={() => setMode('overview')} />;
    }

    const usagePercentage = isUnlimited ? 0 : Math.round((activeCount / (maxStudents as number)) * 100);

    return (<>
        {/* Post-payment success banner */}
        {upgradeSuccess && (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 mb-4">
                <PartyPopper className="h-5 w-5 text-emerald-500 shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-emerald-800">Pagamento recebido pelo Kiwify!</p>
                    <p className="text-xs text-emerald-600 mt-0.5">Seu plano <span className="font-bold">{upgradeSuccess}</span> será ativado em instantes após a confirmação do webhook. Atualize a página em alguns segundos.</p>
                </div>
                <button onClick={() => setUpgradeSuccess(null)} className="text-emerald-400 hover:text-emerald-600 text-lg font-bold shrink-0">×</button>
            </div>
        )}
        <div className="space-y-8 max-w-5xl">
            <SectionHeader
                title="Meu Plano & Assinatura"
                subtitle="Gerencie sua assinatura, limites e histórico de faturamento"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Plano Atual */}
                <div className="md:col-span-2 bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm flex flex-col">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-start">
                        <div>
                            <div className="flex gap-3 items-center mb-1">
                                <h2 className="text-xl font-bold font-display text-slate-900">{plan.name}</h2>
                                {isActive ? (
                                    <Badge className="bg-emerald-50 text-emerald-600 border-none shadow-none font-bold uppercase tracking-widest text-[10px]">Ativo</Badge>
                                ) : (
                                    <Badge className="bg-red-50 text-red-600 border-none shadow-none font-bold uppercase tracking-widest text-[10px]">Suspenso</Badge>
                                )}
                            </div>
                            <p className="text-slate-500 font-sans text-sm">{plan.description}</p>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-bold text-slate-900 font-display">
                                {effectivePrice > 0
                                    ? `R$ ${effectivePrice.toFixed(2).replace('.', ',')}`
                                    : <span className="text-bee-amber">Custom</span>
                                }
                            </span>
                            {effectivePrice > 0 && <span className="text-sm text-slate-500 font-sans">/mês</span>}
                        </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col md:flex-row gap-6">
                        {/* Features incluídas */}
                        <div className="flex-1 space-y-2">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">O que está incluído</h3>
                            <ul className="space-y-2">
                                {displayFeatures.map((f, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <CheckCircle2 className="w-[18px] h-[18px] text-emerald-500" />
                                        <span className="text-sm font-sans font-medium text-slate-700">{f}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Faturamento e Próximo Ciclo */}
                        <div className="flex-1 space-y-4">
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Faturamento</h3>
                                <div className="space-y-2">
                                    {isTestPlan ? (
                                        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                            <ShieldCheck className="w-5 h-5 text-bee-amber" />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700 font-sans">Plano Cortesia / Teste</span>
                                                <span className="text-xs text-slate-500 font-sans">Conta isenta de cobranças</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                                <CreditCard className="w-5 h-5 text-slate-400" />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-700 font-sans">
                                                        {metodo === 'PIX' || metodo === 'PIX_AUTOMATICO' ? 'PIX' : 
                                                         metodo === 'CARTAO_RECORRENTE' ? 'Cartão de Crédito' : 
                                                         metodo === 'BOLETO' ? 'Boleto Bancário' : 'Cartão de Crédito'}
                                                    </span>
                                                    <span className="text-xs text-slate-500 font-sans">Forma de pagamento ativa</span>
                                                </div>
                                            </div>
                                            {proximoVencimento && (
                                                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                                    <CalendarDays className="w-5 h-5 text-slate-400" />
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-700 font-sans">Próxima cobrança</span>
                                                        <span className="text-xs text-slate-500 font-sans">
                                                            {new Intl.DateTimeFormat('pt-BR').format(new Date(proximoVencimento))}
                                                            {effectivePrice > 0 && ` · R$ ${effectivePrice.toFixed(2).replace('.', ',')}`}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Botão de Upgrade dentro do card */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-[2rem]">
                        <Button
                            variant="outline"
                            className="font-bold font-sans rounded-full shadow-sm transition-all hover:-translate-y-0.5 active:scale-95"
                            onClick={handleCancel}
                            disabled={isCanceling}
                        >
                            {isCanceling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Cancelar Assinatura
                        </Button>
                        <Button
                            className="bg-bee-amber hover:bg-amber-500 text-bee-midnight font-bold font-sans rounded-full shadow-sm transition-all hover:-translate-y-0.5 active:scale-95 uppercase tracking-wider text-[11px]"
                            onClick={() => setMode('plans')}
                        >
                            <Crown className="w-4 h-4 mr-2" />
                            Fazer Upgrade
                        </Button>
                    </div>
                </div>

                {/* Limite de Alunos Card */}
                <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm flex flex-col p-5 space-y-4">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 font-display mb-1 flex items-center justify-between">
                            Limite de Alunos Ativos
                            <Badge variant="outline" className="font-sans text-[10px] uppercase tracking-wider">
                                {isUnlimited ? 'Ilimitado' : `${activeCount} / ${maxStudents}`}
                            </Badge>
                        </h3>
                        <p className="text-xs text-slate-500 font-sans">
                            Contagem atual de alunos com status ATIVO.
                        </p>
                    </div>

                    {!isUnlimited && (
                        <div className="space-y-2">
                            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all",
                                        usagePercentage > 90 ? "bg-red-500" :
                                            usagePercentage > 75 ? "bg-amber-500" :
                                                "bg-emerald-500"
                                    )}
                                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between items-center text-xs font-bold font-sans">
                                <span className="text-slate-500">{activeCount} ativos</span>
                                <span className={cn(usagePercentage > 90 ? "text-red-500" : "text-slate-500")}>
                                    {Math.max((maxStudents as number) - activeCount, 0)} restantes
                                </span>
                            </div>
                        </div>
                    )}

                    {isUnlimited && (
                        <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                            <div className="text-center space-y-2">
                                <Crown className="w-8 h-8 text-bee-amber mx-auto opacity-80" />
                                <p className="text-sm font-bold text-slate-700 font-sans">Espaço Ilimitado</p>
                                <p className="text-xs text-slate-500 font-sans">Seu plano permite cadastrar quantos alunos quiser.</p>
                            </div>
                        </div>
                    )}

                    <div className="bg-orange-50/50 p-3 mt-auto rounded-2xl border border-orange-100/50 flex gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-bee-amber flex-shrink-0 mt-0.5" />
                        <p className="text-orange-900 font-sans text-[11px] font-medium leading-relaxed">
                            Alunos inadimplentes ou inativos não são contabilizados.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </>);
}

// ---- Sub-View for Plan Upgrades ----
function PlanSelectionView({
    currentPlanId,
    onBack
}: {
    currentPlanId: string,
    onBack: () => void
}) {
    // Array order from config
    const order = ['plan_starter', 'plan_plus', 'plan_studio', 'plan_pro', 'plan_enterprise'];
    const plansArray = order.map(id => BEEGYM_PLANS[id]);

    // Determine user level to visually separate Downgrade vs Upgrade
    const currentIndex = order.indexOf(currentPlanId);

    const { toast } = useToast();
    const { activeCount } = useStudentLimit();

    const [isUpgrading, setIsUpgrading] = useState<string | null>(null);
    const [pendingPlan, setPendingPlan] = useState<{ plan: BeeGymPlan; index: number } | null>(null);
    const [awaitingTier, setAwaitingTier] = useState<string | null>(null); // tier being paid on Kiwify
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // When user opens Kiwify in new tab, poll for subscription change on visibility return
    useEffect(() => {
        if (!awaitingTier) return;

        const handleVisibility = () => {
            if (document.visibilityState !== 'visible') return;
            // Start polling every 3s for up to 2 minutes
            let attempts = 0;
            pollRef.current = setInterval(async () => {
                attempts++;
                try {
                    const res = await fetch('/api/subscription/status', { cache: 'no-store' });
                    if (!res.ok) return;
                    const data = await res.json();
                    if (data.plan_tier === awaitingTier && data.status === 'ACTIVE') {
                        clearInterval(pollRef.current!);
                        setAwaitingTier(null);
                        toast({ title: '🎉 Plano atualizado!', description: `Bem-vindo ao plano ${awaitingTier}!` });
                        // Hard reload to refresh subscription context
                        window.location.reload();
                    }
                } catch {}
                if (attempts >= 40) { // 2 min max
                    clearInterval(pollRef.current!);
                    setAwaitingTier(null);
                }
            }, 3000);
        };

        document.addEventListener('visibilitychange', handleVisibility);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [awaitingTier]);

    const handleSelectPlan = (plan: BeeGymPlan, index: number) => {
        if (index === currentIndex) return;

        const isDowngrade = index < currentIndex;

        if (isDowngrade && plan.max_students !== null && activeCount > plan.max_students) {
            toast({
                title: "Downgrade bloqueado",
                description: `Você tem ${activeCount} alunos ativos. O plano ${plan.name} permite apenas ${plan.max_students}. Inative alunos primeiro.`,
                variant: "destructive",
            });
            return;
        }

        setPendingPlan({ plan, index });
    };

    const confirmPlanChange = async () => {
        if (!pendingPlan) return;
        const { plan } = pendingPlan;
        setPendingPlan(null);
        setIsUpgrading(plan.id);

        try {
            const tierStr = plan.id.replace('plan_', '').toUpperCase();
            const res = await fetch('/api/subscription/upgrade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tier: tierStr }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro ao alterar plano');

            if (data.action === 'redirect' && data.url) {
                // Open Kiwify in new tab — BeeGym stays open to detect payment return
                window.open(data.url, '_blank', 'noopener,noreferrer');
                setAwaitingTier(tierStr);
                return;
            }

            if (data.action === 'contact') {
                toast({ title: `Plano ${plan.name}`, description: data.message });
                return;
            }

            toast({ title: "Solicitação enviada", description: data.message });
        } catch (error: any) {
            toast({ title: "Erro ao atualizar plano", description: error.message, variant: "destructive" });
        } finally {
            setIsUpgrading(null);
        }
    };

    const isUpgradeAction = pendingPlan ? pendingPlan.index > currentIndex : false;

    return (<>
        {/* Awaiting Kiwify payment banner */}
        {awaitingTier && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-4">
                <Loader2 className="h-5 w-5 text-bee-amber animate-spin shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-amber-800">Aguardando confirmação do pagamento...</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                        Conclua o pagamento na aba Kiwify. Esta página atualizará automaticamente após a confirmação.
                    </p>
                </div>
                <button onClick={() => { setAwaitingTier(null); if (pollRef.current) clearInterval(pollRef.current); }} className="text-amber-400 hover:text-amber-600 text-lg font-bold shrink-0">×</button>
            </div>
        )}

        <>
        {/* ── Confirmation Dialog ──────────────────────────────────────── */}
        <Dialog open={!!pendingPlan} onOpenChange={(open) => !open && setPendingPlan(null)}>
            <DialogContent className="sm:max-w-sm p-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
                <DialogHeader className="px-7 pt-7 pb-5 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "h-11 w-11 rounded-2xl flex items-center justify-center shrink-0",
                            isUpgradeAction ? "bg-bee-amber/15 border border-bee-amber/25" : "bg-slate-100"
                        )}>
                            {isUpgradeAction
                                ? <TrendingUp className="h-5 w-5 text-bee-amber" />
                                : <TrendingDown className="h-5 w-5 text-slate-500" />
                            }
                        </div>
                        <div>
                            <DialogTitle className="text-base font-black font-display text-slate-900 leading-tight">
                                {isUpgradeAction ? 'Confirmar Upgrade' : 'Confirmar Downgrade'}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-400 mt-0.5">
                                Plano <span className="font-bold text-slate-600">{pendingPlan?.plan.name}</span>
                                {' · '}
                                {pendingPlan?.plan.price
                                    ? `R$ ${pendingPlan.plan.price.toFixed(2).replace('.', ',')}/mês`
                                    : 'Contato comercial'}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="px-7 py-5 space-y-4">
                    {/* Pricing detail */}
                    {isUpgradeAction && pendingPlan?.plan.price && (
                        <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                            {pendingPlan.plan.promo_price && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">1º mês (promo)</span>
                                    <span className="font-black text-bee-amber">
                                        R$ {pendingPlan.plan.promo_price.toFixed(2).replace('.', ',')}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Renovação mensal</span>
                                <span className="font-bold text-slate-800">
                                    R$ {pendingPlan.plan.price.toFixed(2).replace('.', ',')}/mês
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-2 mt-1">
                                <span className="text-slate-500">Alunos ativos</span>
                                <span className="font-bold text-slate-800">
                                    {pendingPlan.plan.max_students === null ? 'Ilimitados' : `Até ${pendingPlan.plan.max_students}`}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Flow instructions */}
                    {isUpgradeAction && (
                        <div className="space-y-2">
                            {[
                                'Você será redirecionado ao checkout Kiwify',
                                'Conclua o pagamento com os dados corretos',
                                'Seu plano BeeGym atualiza automaticamente',
                            ].map((step, i) => (
                                <div key={i} className="flex items-center gap-2.5 text-xs text-slate-600">
                                    <span className="h-5 w-5 rounded-full bg-bee-amber/20 text-bee-amber font-black text-[10px] flex items-center justify-center shrink-0">
                                        {i + 1}
                                    </span>
                                    {step}
                                </div>
                            ))}
                        </div>
                    )}

                    {!isUpgradeAction && (
                        <p className="text-sm text-slate-600">
                            Você está fazendo <span className="font-bold text-slate-800">downgrade</span> para um plano com menos recursos e limite de alunos. Confirma a mudança?
                        </p>
                    )}

                    <div className="space-y-2 pt-1">
                        <button
                            onClick={confirmPlanChange}
                            disabled={isUpgrading !== null}
                            className={cn(
                                "w-full h-11 font-bold text-sm rounded-full flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:scale-95 shadow-sm disabled:opacity-50",
                                isUpgradeAction
                                    ? "bg-bee-amber hover:bg-amber-500 text-bee-midnight"
                                    : "bg-slate-800 hover:bg-slate-700 text-white"
                            )}
                        >
                            {isUpgrading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                isUpgradeAction
                                    ? <><ExternalLink className="h-4 w-4" /> Ir para o Checkout Kiwify</>
                                    : <><Check className="h-4 w-4" /> Confirmar Downgrade</>
                            )}
                        </button>
                        <button
                            onClick={() => setPendingPlan(null)}
                            className="w-full h-10 text-slate-400 hover:text-slate-600 text-sm font-semibold rounded-full transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" onClick={onBack} size="sm" className="font-bold shadow-sm rounded-full transition-all hover:-translate-y-0.5 active:scale-95">
                    Voltar
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#0B0F1A] font-display">Opções de Planos</h1>
                    <p className="text-muted-foreground font-sans text-sm">Faça upgrade e libere mais funcionalidades.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {plansArray.map((plan, index) => {
                    const isCurrent = index === currentIndex;
                    const isDowngrade = index < currentIndex;
                    const isUpgrade = index > currentIndex;

                    return (
                        <div
                            key={plan.id}
                            className={cn(
                                "flex flex-col bg-white rounded-[2rem] border overflow-hidden transition-all duration-300",
                                isCurrent ? "border-bee-amber shadow-md ring-1 ring-bee-amber" : "border-slate-200 shadow-sm hover:border-amber-300"
                            )}
                        >
                            {/* Header */}
                            <div className={cn(
                                "p-4 border-b flex flex-col gap-2",
                                isCurrent ? "bg-amber-50/30 border-amber-100" : "bg-slate-50/50 border-slate-100"
                            )}>
                                <div className="flex items-center justify-between">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100">
                                        <plan.icon className="w-4 h-4 text-slate-500" />
                                    </div>
                                    {isCurrent && <Badge className="bg-bee-amber hover:bg-bee-amber text-[10px] font-bold shadow-none border-none text-bee-midnight px-3 py-1 rounded-full">ATUAL</Badge>}
                                </div>
                                <h3 className="font-bold font-display text-lg text-slate-900">{plan.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    {plan.price > 0 ? (
                                        <>
                                            <span className="text-sm font-bold text-slate-400">R$</span>
                                            <span className="text-2xl font-black font-display text-slate-900">{plan.price.toFixed(2).replace('.', ',')}</span>
                                            <span className="text-xs text-slate-500 font-bold">/mês</span>
                                        </>
                                    ) : (
                                        <span className="text-2xl font-black font-display text-slate-900">Custom</span>
                                    )}
                                </div>
                            </div>

                            {/* Features */}
                            <div className="flex-1 p-4">
                                <ul className="space-y-3">
                                    {plan.featuresList.map((feature, i) => (
                                        <li key={i} className="flex gap-2 items-start text-xs font-sans text-slate-600 font-medium leading-tight">
                                            <Check className="w-3.5 h-3.5 text-bee-amber flex-shrink-0 mt-0.5" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Limits */}
                            <div className="px-4 pb-4 border-t border-slate-50 pt-4 bg-slate-50/30">
                                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100/70 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                    <span>Alunos:</span>
                                    <span>{plan.max_students === null ? 'Ilimitado' : `Até ${plan.max_students}`}</span>
                                </div>
                            </div>

                            {/* Action */}
                            <div className="p-4 pt-0 bg-slate-50/30">
                                <Button
                                    onClick={() => handleSelectPlan(plan, index)}
                                    disabled={isCurrent || isUpgrading !== null}
                                    variant={isCurrent ? "outline" : isUpgrade ? "default" : "secondary"}
                                    className={cn(
                                        "w-full font-bold text-xs h-10 rounded-full transition-all hover:-translate-y-0.5 active:scale-95 uppercase tracking-wider",
                                        isUpgrade && "bg-bee-amber hover:bg-amber-500 text-bee-midnight border-none shadow-sm",
                                        isCurrent && "border-bee-amber text-bee-amber"
                                    )}
                                >
                                    {isUpgrading === plan.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                    {isCurrent && 'Plano Atual'}
                                    {isUpgrade && 'Fazer Upgrade'}
                                    {isDowngrade && 'Fazer Downgrade'}
                                </Button>
                                {isDowngrade && plan.max_students !== null && activeCount > plan.max_students && (
                                    <p className="text-[10px] text-red-500 font-bold text-center mt-2 font-sans tracking-wide">
                                        Excede limite de {plan.max_students}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
        </>
        </>
    );
}
