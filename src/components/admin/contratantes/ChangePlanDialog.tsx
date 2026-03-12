'use client';

import { useState, useEffect } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from '@/components/ui/sheet';
import { Loader2, ArrowUp, ArrowDown, Minus, AlertTriangle, Check, Crown, LayoutIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const TIER_ORDER: Record<string, number> = {
    'STARTER': 1,
    'PLUS': 2,
    'STUDIO': 3,
    'PRO': 4,
    'ENTERPRISE': 5
};

interface ChangePlanDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    contratanteId: string;
    currentPlanTier: string;
    currentPlanName: string;
    currentPrice: number;
    subscriptionStatus: string;
    alunosAtivos: number;
    onChanged: () => void;
}

export function ChangePlanDialog({
    open, onOpenChange, contratanteId,
    currentPlanTier, currentPlanName, currentPrice,
    subscriptionStatus, alunosAtivos, onChanged
}: ChangePlanDialogProps) {
    const { toast } = useToast();
    const [planos, setPlanos] = useState<any[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const isNonPaying = ['TESTE', 'DEMO', 'AGUARDANDO_PAGAMENTO', 'TESTE_MANUAL'].includes(subscriptionStatus);

    useEffect(() => {
        if (open) fetchPlanos();
    }, [open]);

    const fetchPlanos = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/planos');
            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
                setPlanos(data.filter((p: any) => p.ativo));
            }
        } catch (e) {
            console.error('Erro ao buscar planos:', e);
        }
        setLoading(false);
    };

    const getChangeType = (plan: any): 'upgrade' | 'downgrade' | 'same' => {
        const currentOrder = TIER_ORDER[currentPlanTier] || 0;
        const newOrder = TIER_ORDER[plan.tier] || 0;
        if (newOrder > currentOrder) return 'upgrade';
        if (newOrder < currentOrder) return 'downgrade';
        return 'same';
    };

    const handleSubmit = async () => {
        if (!selectedPlan) return;
        setSubmitting(true);
        try {
            const res = await fetch(`/api/admin/contratantes/${contratanteId}/change-plan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPlanId: selectedPlan.id }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast({ variant: 'destructive', title: 'Erro ao alterar plano', description: data.error });
                return;
            }
            toast({ title: data.message });
            onChanged();
            onOpenChange(false);
            setSelectedPlan(null);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Erro', description: e.message });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-xl border-l shadow-2xl p-0 flex flex-col h-full">
                <SheetHeader className="p-8 border-b relative overflow-hidden shrink-0 bg-white/50 backdrop-blur-sm">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-bee-amber/[0.03] rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-bee-amber/[0.05] rounded-full -mr-16 -mt-16 blur-2xl opacity-50" />
                    <div className="flex items-center gap-5 relative text-left">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-bee-amber/20 via-bee-amber/10 to-transparent border border-bee-amber/20 shadow-inner group transition-all">
                            <LayoutIcon className="h-8 w-8 text-bee-amber drop-shadow-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <SheetTitle className="text-2xl font-black font-display tracking-tight text-bee-midnight">
                                Alterar Plano
                            </SheetTitle>
                            <SheetDescription className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-bee-amber animate-pulse" />
                                Plano atual: <span className="text-bee-amber font-black tracking-widest uppercase text-[11px] ml-1">{currentPlanName}</span>
                                {!isNonPaying && <span className="text-slate-300 ml-2">|</span>}
                                {!isNonPaying && <span className="ml-2 font-bold text-slate-500">R$ {currentPrice.toFixed(2)}/mês</span>}
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <ScrollArea className="flex-1">
                    <div className="p-8 space-y-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <Loader2 className="w-10 h-10 animate-spin text-bee-amber" />
                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Escaneando novos planos...</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {planos.map(plan => {
                                    const isCurrent = plan.tier === currentPlanTier;
                                    const changeType = getChangeType(plan);
                                    const isSelected = selectedPlan?.id === plan.id;
                                    const maxStudents = plan.max_alunos;
                                    const studentLimitExceeded = changeType === 'downgrade' && maxStudents && alunosAtivos > maxStudents;

                                    return (
                                        <button
                                            key={plan.id}
                                            type="button"
                                            disabled={isCurrent || studentLimitExceeded}
                                            onClick={() => setSelectedPlan(plan)}
                                            className={cn(
                                                'w-full text-left p-6 rounded-[2rem] border-2 transition-all duration-300 relative group overflow-hidden',
                                                isCurrent
                                                    ? 'border-slate-50 bg-slate-50/50 opacity-60 cursor-not-allowed'
                                                    : isSelected
                                                        ? 'border-bee-amber bg-bee-amber/[0.02] shadow-xl shadow-bee-amber/5'
                                                        : studentLimitExceeded
                                                            ? 'border-red-50 bg-red-50/30 cursor-not-allowed opacity-70'
                                                            : 'border-slate-100 bg-white hover:border-bee-amber/30 hover:bg-slate-50'
                                            )}
                                        >
                                            {isSelected && <div className="absolute top-0 right-0 w-24 h-24 bg-bee-amber/5 rounded-full -mr-12 -mt-12 blur-2xl" />}

                                            <div className="flex items-center justify-between relative">
                                                <div className="flex items-center gap-5">
                                                    <div className={cn(
                                                        'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm',
                                                        isSelected ? 'bg-bee-amber text-bee-midnight scale-110' : 'bg-slate-50 text-slate-400 group-hover:bg-white group-hover:scale-105'
                                                    )}>
                                                        {plan.tier === 'ENTERPRISE' ? <Crown className="w-7 h-7" /> : <Check className="w-7 h-7" />}
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <span className={cn('text-[10px] font-black uppercase tracking-[0.2em] transition-colors', isSelected ? 'text-bee-amber' : 'text-slate-400')}>{plan.nome}</span>
                                                        <span className="text-lg font-black text-bee-midnight font-display leading-tight">
                                                            {maxStudents ? `Até ${maxStudents} alunos` : 'Ilimitado'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col items-end gap-1">
                                                        <div className="flex items-center gap-2">
                                                            {isCurrent && (
                                                                <span className="text-[9px] font-black tracking-widest bg-slate-200 text-slate-600 px-2.5 py-1 rounded-full">PLANO ATUAL</span>
                                                            )}
                                                            {!isCurrent && changeType === 'upgrade' && (
                                                                <div className="flex items-center gap-1 text-[9px] font-black tracking-widest bg-emerald-100 text-emerald-600 px-2.5 py-1 rounded-full bounce-in">
                                                                    <ArrowUp className="w-3 h-3" /> UPGRADE
                                                                </div>
                                                            )}
                                                            {!isCurrent && changeType === 'downgrade' && (
                                                                <div className="flex items-center gap-1 text-[9px] font-black tracking-widest bg-orange-100 text-orange-600 px-2.5 py-1 rounded-full bounce-in">
                                                                    <ArrowDown className="w-3 h-3" /> DOWNGRADE
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-2xl font-display font-black text-bee-midnight">
                                                            R$ {Number(plan.valor_mensal).toFixed(0)}<span className="text-[10px] text-slate-400 font-bold ml-1">/mês</span>
                                                        </span>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="w-7 h-7 rounded-full bg-bee-amber flex items-center justify-center shadow-lg shadow-bee-amber/30 animate-in zoom-in duration-300">
                                                            <Check className="w-4 h-4 text-bee-midnight stroke-[4]" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {studentLimitExceeded && (
                                                <div className="flex items-center gap-3 mt-4 p-4 bg-red-50/50 rounded-2xl text-[11px] text-red-600 font-bold border border-red-100 animate-in slide-in-from-top-1">
                                                    <AlertTriangle className="w-5 h-5" />
                                                    Limite excedido: {alunosAtivos} alunos ativos para limite de {maxStudents}
                                                </div>
                                            )}

                                            {!isCurrent && isSelected && !isNonPaying && changeType === 'upgrade' && (
                                                <div className="mt-5 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm shadow-emerald-600/5">
                                                    <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-3">
                                                        <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center shadow-sm text-emerald-600"><Check className="w-4 h-4" /></div>
                                                        Upgrade Proporcional — a diferença será cobrada até o fim do ciclo
                                                    </p>
                                                </div>
                                            )}

                                            {!isCurrent && isSelected && !isNonPaying && changeType === 'downgrade' && (
                                                <div className="mt-5 p-4 bg-amber-50 rounded-2xl border border-amber-100 animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm shadow-bee-amber/5">
                                                    <p className="text-[11px] text-amber-700 font-bold flex items-center gap-3">
                                                        <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center shadow-sm text-bee-amber"><Minus className="w-4 h-4" /></div>
                                                        Downgrade Agendado — o novo valor será aplicado no próximo ciclo
                                                    </p>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <SheetFooter className="p-8 border-t bg-slate-50/50 gap-3 shrink-0">
                    <Button
                        variant="ghost"
                        onClick={() => { onOpenChange(false); setSelectedPlan(null); }}
                        className="flex-1 h-10 rounded-full font-bold text-slate-400 hover:text-slate-600 transition-all uppercase tracking-widest text-[10px]"
                    >
                        Cancelar
                    </Button>
                    <Button
                        disabled={!selectedPlan || submitting}
                        onClick={handleSubmit}
                        className="flex-[2] h-10 rounded-full bg-bee-amber text-bee-midnight hover:bg-bee-amber/90 font-black shadow-xl shadow-bee-amber/20 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                    >
                        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        Confirmar Alteração
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
