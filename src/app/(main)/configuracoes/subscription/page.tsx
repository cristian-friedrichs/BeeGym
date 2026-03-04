'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from '@/hooks/useSubscription';
import { useStudentLimit } from '@/hooks/useStudentLimit';
import { PlanFeature, BEEGYM_PLANS, BeeGymPlan } from '@/config/plans';
import { Crown, Check, CheckCircle2, AlertTriangle, ArrowRight, Loader2, CreditCard, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function SubscriptionPage() {
    const { plan, isActive, status, loading: subLoading } = useSubscription();
    const { activeCount, maxStudents, isUnlimited, loading: limitLoading } = useStudentLimit();
    const { toast } = useToast();

    // Mode: 'overview' | 'upgrade' | 'downgrade' | 'cancel'
    const [mode, setMode] = useState<'overview' | 'plans' | 'cancel'>('overview');
    const [isCanceling, setIsCanceling] = useState(false);

    const handleCancel = async () => {
        if (!confirm('Tem certeza que deseja cancelar sua assinatura? Você perderá acesso aos recursos premium no próximo ciclo.')) return;

        setIsCanceling(true);
        try {
            const res = await fetch('/api/subscription/cancel', { method: 'POST' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Erro ao cancelar assinatura');
            }
            toast({
                title: "Assinatura cancelada",
                description: "Sua solicitação de cancelamento foi processada.",
            });
            window.location.reload();
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
                <Loader2 className="h-8 w-8 animate-spin text-bee-orange" />
                <div className="text-xs text-slate-500 font-mono bg-slate-100 p-2 rounded">
                    subLoading: {String(subLoading)} | limitLoading: {String(limitLoading)}
                </div>
            </div>
        );
    }

    if (mode === 'plans') {
        return <PlanSelectionView currentPlanId={plan.id} onBack={() => setMode('overview')} />;
    }

    const usagePercentage = isUnlimited ? 0 : Math.round((activeCount / (maxStudents as number)) * 100);

    return (
        <div className="space-y-4 max-w-5xl">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#00173F] font-display">Meu Plano</h1>
                <p className="text-muted-foreground font-sans">Gerencie sua assinatura e os limites do seu negócio.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Plano Atual */}
                <div className="md:col-span-2 bg-white rounded-[12px] border border-slate-200 overflow-hidden shadow-sm flex flex-col">
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
                                R$ {plan.price.toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-sm text-slate-500 font-sans">/mês</span>
                        </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col md:flex-row gap-6">
                        {/* Features incluídas */}
                        <div className="flex-1 space-y-2">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">O que está incluído</h3>
                            <ul className="space-y-2">
                                {plan.featuresList.map((f, i) => (
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
                                    <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <CreditCard className="w-5 h-5 text-slate-400" />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700 font-sans">Cartão de Crédito final 4242</span>
                                            <span className="text-xs text-slate-500 font-sans">Expira em 12/2028</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <CalendarDays className="w-5 h-5 text-slate-400" />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700 font-sans">Próxima cobrança</span>
                                            <span className="text-xs text-slate-500 font-sans">05/03/2026 (R$ {plan.price.toFixed(2).replace('.', ',')})</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Botão de Upgrade dentro do card */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-[12px]">
                        <Button
                            variant="outline"
                            className="font-bold font-sans rounded-lg shadow-sm"
                            onClick={handleCancel}
                            disabled={isCanceling}
                        >
                            {isCanceling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Cancelar Assinatura
                        </Button>
                        <Button
                            className="bg-bee-orange hover:bg-orange-600 text-white font-bold font-sans rounded-lg shadow-sm"
                            onClick={() => setMode('plans')}
                        >
                            <Crown className="w-4 h-4 mr-2" />
                            Fazer Upgrade
                        </Button>
                    </div>
                </div>

                {/* Limite de Alunos Card */}
                <div className="bg-white rounded-[12px] border border-slate-200 overflow-hidden shadow-sm flex flex-col p-5 space-y-4">
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
                                <Crown className="w-8 h-8 text-bee-orange mx-auto opacity-80" />
                                <p className="text-sm font-bold text-slate-700 font-sans">Espaço Ilimitado</p>
                                <p className="text-xs text-slate-500 font-sans">Seu plano permite cadastrar quantos alunos quiser.</p>
                            </div>
                        </div>
                    )}

                    <div className="bg-orange-50/50 p-3 mt-auto rounded-xl border border-orange-100/50 flex gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-bee-orange flex-shrink-0 mt-0.5" />
                        <p className="text-orange-900 font-sans text-[11px] font-medium leading-relaxed">
                            Alunos inadimplentes ou inativos não são contabilizados.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
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

    const handleSelectPlan = async (plan: BeeGymPlan, index: number) => {
        if (index === currentIndex) return;

        const isDowngrade = index < currentIndex;

        // Block downgrade if they have too many active students
        if (isDowngrade && plan.max_students !== null && activeCount > plan.max_students) {
            toast({
                title: "Downgrade bloqueado",
                description: `Você tem ${activeCount} alunos ativos. O plano ${plan.name} permite apenas ${plan.max_students}. Inative alunos primeiro.`,
                variant: "destructive"
            });
            return;
        }

        const isUpgrade = index > currentIndex;
        const confirmMsg = isUpgrade
            ? `Confirmar mudança para o plano ${plan.name}?`
            : `Confirmar downgrade para o plano ${plan.name}?`;

        if (!confirm(confirmMsg)) return;

        setIsUpgrading(plan.id);

        try {
            // "plan_plus" -> "PLUS"
            const tierStr = plan.id.replace('plan_', '').toUpperCase();
            const res = await fetch('/api/subscription/upgrade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tier: tierStr })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Erro ao alterar plano');
            }

            toast({
                title: "Sucesso",
                description: `Seu plano foi alterado para ${plan.name}.`,
            });

            window.location.reload();

        } catch (error: any) {
            toast({
                title: "Erro ao atualizar plano",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsUpgrading(null);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" onClick={onBack} size="sm" className="font-bold shadow-sm">
                    Voltar
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#00173F] font-display">Opções de Planos</h1>
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
                                "flex flex-col bg-white rounded-xl border overflow-hidden transition-all duration-300",
                                isCurrent ? "border-bee-orange shadow-md ring-1 ring-bee-orange" : "border-slate-200 shadow-sm hover:border-orange-300"
                            )}
                        >
                            {/* Header */}
                            <div className={cn(
                                "p-4 border-b flex flex-col gap-2",
                                isCurrent ? "bg-orange-50/30 border-orange-100" : "bg-slate-50/50 border-slate-100"
                            )}>
                                <div className="flex items-center justify-between">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10">
                                        <plan.icon className="w-4 h-4 text-primary" />
                                    </div>
                                    {isCurrent && <Badge className="bg-bee-orange hover:bg-bee-orange text-[10px] font-bold shadow-none border-none">ATUAL</Badge>}
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
                                            <Check className="w-3.5 h-3.5 text-bee-orange flex-shrink-0 mt-0.5" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Limits */}
                            <div className="px-4 pb-4 border-t border-slate-50 pt-4 bg-slate-50/30">
                                <div className="flex items-center justify-between px-2 py-1.5 bg-slate-100/70 rounded-md text-[10px] font-bold uppercase tracking-wider text-slate-600">
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
                                        "w-full font-bold text-xs h-9",
                                        isUpgrade && "bg-bee-orange hover:bg-orange-600 text-white shadow-sm",
                                        isCurrent && "border-bee-orange text-bee-orange"
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
    );
}
