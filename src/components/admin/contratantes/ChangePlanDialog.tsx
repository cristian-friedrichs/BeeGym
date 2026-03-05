'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowUp, ArrowDown, Minus, AlertTriangle, Check, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

const TIER_ORDER: Record<string, number> = {
    STARTER: 1, PLUS: 2, STUDIO: 3, PRO: 4, ENTERPRISE: 5,
};

const tierColors: Record<string, string> = {
    STARTER: 'border-amber-200 bg-amber-50',
    PLUS: 'border-blue-200 bg-blue-50',
    STUDIO: 'border-teal-200 bg-teal-50',
    PRO: 'border-slate-200 bg-slate-50',
    ENTERPRISE: 'border-orange-200 bg-orange-50',
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

    const calculateProration = (plan: any): number => {
        if (isNonPaying) return 0;
        const diff = Number(plan.valor_mensal) - currentPrice;
        if (diff <= 0) return 0;
        // Rough estimate: proportional for ~15 days average remaining
        const daysRemaining = 15;
        const totalDays = 30;
        return Math.round((diff / totalDays) * daysRemaining * 100) / 100;
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-none rounded-[2rem] shadow-2xl">
                <DialogHeader className="px-8 pt-8 pb-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-bee-amber/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                    <div className="flex items-center gap-3 mb-2 relative">
                        <div className="w-1.5 h-6 bg-bee-amber rounded-full" />
                        <DialogTitle className="text-xl font-bold font-display tracking-tight text-bee-midnight">
                            Alterar Plano
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-sm font-medium text-slate-400 relative">
                        Plano atual: <span className="text-bee-amber font-black tracking-widest uppercase text-[11px] ml-1">{currentPlanName}</span>
                        {!isNonPaying && <span className="text-slate-300 ml-2">|</span>}
                        {!isNonPaying && <span className="ml-2 font-bold text-slate-500">R$ {currentPrice.toFixed(2)}/mês</span>}
                    </DialogDescription>
                </DialogHeader>

                <div className="px-8 py-4 overflow-y-auto flex-1 space-y-3">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-bee-amber" />
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Buscando planos...</p>
                        </div>
                    ) : (
                        planos.map(plan => {
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
                                        'w-full text-left p-5 rounded-3xl border-2 transition-all duration-300 relative group overflow-hidden',
                                        isCurrent
                                            ? 'border-slate-50 bg-slate-50/50 opacity-60 cursor-not-allowed'
                                            : isSelected
                                                ? 'border-bee-amber bg-amber-50 shadow-lg shadow-bee-amber/5'
                                                : studentLimitExceeded
                                                    ? 'border-red-50 bg-red-50/30 cursor-not-allowed opacity-70'
                                                    : 'border-slate-50 bg-slate-50/50 hover:border-slate-200 hover:bg-white'
                                    )}
                                >
                                    {isSelected && <div className="absolute top-0 right-0 w-16 h-16 bg-bee-amber/10 rounded-full -mr-8 -mt-8 blur-xl" />}

                                    <div className="flex items-center justify-between relative">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                                                isSelected ? 'bg-bee-amber text-bee-midnight' : 'bg-white text-slate-400 shadow-sm'
                                            )}>
                                                {plan.tier === 'ENTERPRISE' ? <Crown className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={cn('text-xs font-black uppercase tracking-widest transition-colors', isSelected ? 'text-bee-midnight' : 'text-slate-400')}>{plan.nome}</span>
                                                <span className="text-sm font-black text-bee-midnight font-display">
                                                    {maxStudents ? `Até ${maxStudents} alunos` : 'Ilimitado'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="flex items-center gap-2">
                                                {isCurrent && (
                                                    <span className="text-[9px] font-black tracking-widest bg-slate-200 text-slate-600 px-2 py-1 rounded-lg">PLANO ATUAL</span>
                                                )}
                                                {!isCurrent && changeType === 'upgrade' && (
                                                    <div className="flex items-center gap-1 text-[9px] font-black tracking-widest bg-emerald-100 text-emerald-600 px-2 py-1 rounded-lg">
                                                        <ArrowUp className="w-3 h-3" /> UPGRADE
                                                    </div>
                                                )}
                                                {!isCurrent && changeType === 'downgrade' && (
                                                    <div className="flex items-center gap-1 text-[9px] font-black tracking-widest bg-orange-100 text-orange-600 px-2 py-1 rounded-lg">
                                                        <ArrowDown className="w-3 h-3" /> DOWNGRADE
                                                    </div>
                                                )}
                                                <span className="text-lg font-display font-black text-bee-midnight">
                                                    R$ {Number(plan.valor_mensal).toFixed(0)}<span className="text-[10px] text-slate-400 font-bold ml-1">/mês</span>
                                                </span>
                                            </div>
                                            {isSelected && <div className="w-5 h-5 rounded-full bg-bee-amber flex items-center justify-center scale-110"><Check className="w-3 h-3 text-white stroke-[3]" /></div>}
                                        </div>
                                    </div>

                                    {studentLimitExceeded && (
                                        <div className="flex items-center gap-2 mt-3 p-2 bg-red-100/50 rounded-xl text-[11px] text-red-600 font-bold border border-red-200/50">
                                            <AlertTriangle className="w-4 h-4" />
                                            Limite excedido: {alunosAtivos} alunos ativos para limite de {maxStudents}
                                        </div>
                                    )}

                                    {!isCurrent && isSelected && !isNonPaying && changeType === 'upgrade' && (
                                        <div className="mt-4 p-3 bg-emerald-50 rounded-2xl border border-emerald-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-lg bg-white flex items-center justify-center shadow-sm"><Check className="w-3 h-3" /></div>
                                                Upgrade Proporcional — a diferença será cobrada até o fim do ciclo
                                            </p>
                                        </div>
                                    )}

                                    {!isCurrent && isSelected && !isNonPaying && changeType === 'downgrade' && (
                                        <div className="mt-4 p-3 bg-amber-50 rounded-2xl border border-amber-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <p className="text-[11px] text-amber-700 font-bold flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-lg bg-white flex items-center justify-center shadow-sm"><Minus className="w-3 h-3" /></div>
                                                Downgrade Agendado — o novo valor será aplicado no próximo ciclo
                                            </p>
                                        </div>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>

                <DialogFooter className="px-8 py-6 border-t bg-slate-50/50 gap-3">
                    <Button variant="ghost" onClick={() => { onOpenChange(false); setSelectedPlan(null); }} className="text-slate-400 font-bold hover:bg-slate-100 rounded-xl">
                        Cancelar
                    </Button>
                    <Button
                        disabled={!selectedPlan || submitting}
                        onClick={handleSubmit}
                        className="h-12 px-8 bg-bee-amber text-bee-midnight hover:bg-bee-amber/90 font-black uppercase tracking-widest text-[11px] rounded-2xl shadow-lg shadow-bee-amber/20 transition-all border-none"
                    >
                        {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Confirmar Alteração
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
