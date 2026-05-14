'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { CreditCard, Loader2, Check, Tag, CalendarIcon, Info, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addMonths } from 'date-fns';

interface Plan {
    id: string;
    name: string;
    description: string | null;
    price: number;
    plan_type: 'membership' | 'pack';
    duration_months: number | null;
    recurrence: 'monthly' | 'quarterly' | 'yearly' | 'one_time' | null;
    days_per_week: number | null;
    credits: number | null;
    active: boolean;
}

const recurrenceLabel: Record<string, string> = {
    monthly: 'Mensal', quarterly: 'Trimestral', yearly: 'Anual',
};

interface ManagePlanModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    studentId: string;
    currentPlanId?: string;
    onSuccess?: () => void;
}

export function ManagePlanModal({ open, onOpenChange, studentId, currentPlanId, onSuccess }: ManagePlanModalProps) {
    const supabase = createClient();
    const { toast } = useToast();
    const { organizationId } = useSubscription();
    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string>(currentPlanId || '');

    const [discountActive, setDiscountActive] = useState(false);
    const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
    const [discountValue, setDiscountValue] = useState('');
    const [discountDuration, setDiscountDuration] = useState('1_month');

    const selectedPlan = plans.find(p => p.id === selectedPlanId);

    const finalPrice = (() => {
        if (!selectedPlan || !discountActive || !discountValue) return selectedPlan?.price ?? 0;
        const v = parseFloat(discountValue.replace(',', '.'));
        if (isNaN(v)) return selectedPlan.price;
        return discountType === 'percent'
            ? selectedPlan.price * (1 - v / 100)
            : Math.max(0, selectedPlan.price - v);
    })();

    const discountEndDate = (() => {
        if (!discountActive) return null;
        const now = new Date();
        const map: Record<string, Date | null> = {
            '1_month': addMonths(now, 1), '3_months': addMonths(now, 3),
            '6_months': addMonths(now, 6), '12_months': addMonths(now, 12), 'indefinite': null,
        };
        return map[discountDuration] ?? null;
    })();

    useEffect(() => {
        if (!open || !studentId) return;
        const load = async () => {
            setLoading(true);
            try {
                let orgId = organizationId;
                const { data: s } = await (supabase as any).from('students').select('organization_id').eq('id', studentId).single();
                if (s?.organization_id) orgId = s.organization_id;
                if (!orgId) return;

                const { data } = await supabase.from('membership_plans').select('*').eq('active', true).eq('organization_id', orgId).order('name');
                if (data) setPlans(data as Plan[]);
                setSelectedPlanId(currentPlanId || '');
            } catch {}
            finally { setLoading(false); }
        };
        load();
    }, [open, studentId, currentPlanId, organizationId]);

    const handleSubmit = async () => {
        if (!selectedPlanId) {
            toast({ title: 'Selecione um plano', variant: 'destructive' }); return;
        }
        if (discountActive && discountValue) {
            const dv = parseFloat(discountValue.replace(',', '.'));
            if (isNaN(dv) || dv <= 0) {
                toast({ title: 'Desconto inválido', description: 'O valor deve ser maior que zero.', variant: 'destructive' }); return;
            }
            if (discountType === 'percent' && dv >= 100) {
                toast({ title: 'Desconto inválido', description: 'Percentual deve ser menor que 100%.', variant: 'destructive' }); return;
            }
        }

        setLoading(true);
        try {
            const { data: cur } = await (supabase as any).from('students').select('credits_balance').eq('id', studentId).single();
            let newCredits: number | undefined;
            if (selectedPlan?.plan_type === 'pack') {
                newCredits = (cur?.credits_balance || 0) + (selectedPlan.credits || 0);
            }

            const expDate = selectedPlan?.duration_months
                ? format(addMonths(new Date(), selectedPlan.duration_months), 'yyyy-MM-dd HH:mm:ss')
                : null;
            const discountEndStr = discountEndDate ? format(discountEndDate, 'yyyy-MM-dd HH:mm:ss') : null;
            const discountVal = discountActive && discountValue ? parseFloat(discountValue.replace(',', '.')) : null;

            await (supabase as any).from('student_plan_history').update({ ended_at: format(new Date(), 'yyyy-MM-dd HH:mm:ss') }).eq('student_id', studentId).is('ended_at', null);
            await (supabase as any).from('student_plan_history').insert({
                student_id: studentId, plan_id: selectedPlanId,
                plan_name: selectedPlan?.name, plan_price: selectedPlan?.price,
                discount_type: discountActive ? discountType : null,
                discount_value: discountVal, discount_end_date: discountEndStr,
                final_price: finalPrice,
                started_at: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
                expiration_date: expDate,
            });

            const { error } = await (supabase as any).from('students').update({
                plan_id: selectedPlanId,
                discount_type: discountActive ? discountType : null,
                discount_value: discountVal,
                discount_end_date: discountEndStr,
                updated_at: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
                ...(selectedPlan?.plan_type === 'pack' ? { credits_balance: newCredits } : {}),
            }).eq('id', studentId);

            if (error) throw error;
            toast({ title: 'Plano atualizado!' });
            onSuccess?.();
            onOpenChange(false);
        } catch (e: any) {
            toast({ title: 'Erro ao atualizar', description: e.message, variant: 'destructive' });
        } finally { setLoading(false); }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[540px] p-0 gap-0 rounded-2xl overflow-hidden bg-white border border-slate-100">

                {/* Header */}
                <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-bee-amber/10 flex items-center justify-center">
                            <CreditCard className="h-4.5 w-4.5 text-bee-amber" />
                        </div>
                        <div>
                            <DialogTitle className="text-[17px] font-bold text-slate-900 leading-tight">Gerenciar Plano</DialogTitle>
                            <DialogDescription className="text-xs text-slate-400 mt-0.5">Selecione o plano e aplique descontos se necessário.</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Body */}
                <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">

                    {/* Plan list */}
                    <div className="space-y-2">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Planos disponíveis</p>

                        {loading && plans.length === 0 ? (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
                            </div>
                        ) : plans.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
                                <Info className="h-8 w-8 text-slate-200" />
                                <p className="text-sm font-medium text-slate-500">Nenhum plano ativo encontrado.</p>
                                <p className="text-xs text-slate-400">Cadastre planos em Configurações &gt; Planos.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {plans.map(plan => (
                                    <button
                                        key={plan.id}
                                        type="button"
                                        onClick={() => setSelectedPlanId(plan.id)}
                                        className={cn(
                                            'w-full flex items-center justify-between px-4 py-3.5 rounded-xl border-2 text-left transition-all',
                                            selectedPlanId === plan.id
                                                ? 'border-bee-amber bg-bee-amber/5'
                                                : 'border-slate-100 hover:border-slate-200 bg-white'
                                        )}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-bold text-slate-800">{plan.name}</span>
                                                {plan.plan_type === 'pack' && (
                                                    <Badge className="bg-blue-50 text-blue-600 border-none text-[10px] font-bold rounded-full px-2 py-0 shadow-none">Pack</Badge>
                                                )}
                                                {plan.recurrence && plan.recurrence !== 'one_time' && (
                                                    <Badge className="bg-slate-100 text-slate-500 border-none text-[10px] font-bold rounded-full px-2 py-0 shadow-none">{recurrenceLabel[plan.recurrence] || plan.recurrence}</Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1">
                                                {plan.plan_type === 'pack' && plan.credits && (
                                                    <span className="text-xs text-slate-500 flex items-center gap-1"><Hash className="h-3 w-3" />{plan.credits} créditos</span>
                                                )}
                                                {plan.plan_type !== 'pack' && plan.duration_months && (
                                                    <span className="text-xs text-slate-500">{plan.duration_months} meses</span>
                                                )}
                                                {plan.description && (
                                                    <span className="text-xs text-slate-400 truncate max-w-[200px]">{plan.description}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2.5 shrink-0 ml-4">
                                            <span className={cn('text-base font-bold', selectedPlanId === plan.id ? 'text-bee-amber' : 'text-slate-800')}>
                                                {plan.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </span>
                                            <div className={cn(
                                                'h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                                                selectedPlanId === plan.id ? 'border-bee-amber bg-bee-amber' : 'border-slate-200'
                                            )}>
                                                {selectedPlanId === plan.id && <Check className="h-3 w-3 text-bee-midnight stroke-[3px]" />}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Discount section — only when a plan is selected */}
                    {selectedPlan && (
                        <div className={cn(
                            'rounded-xl border-2 px-4 py-4 transition-all',
                            discountActive ? 'border-bee-amber/30 bg-bee-amber/[0.03]' : 'border-dashed border-slate-200'
                        )}>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="discount-toggle" className="flex items-center gap-2.5 cursor-pointer">
                                    <Tag className={cn('h-4 w-4', discountActive ? 'text-bee-amber' : 'text-slate-400')} />
                                    <span className="text-sm font-semibold text-slate-700">Aplicar desconto</span>
                                </Label>
                                <Switch
                                    id="discount-toggle"
                                    checked={discountActive}
                                    onCheckedChange={setDiscountActive}
                                    className="data-[state=checked]:bg-bee-amber"
                                />
                            </div>

                            {discountActive && (
                                <div className="mt-4 space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Discount value */}
                                        <div className="space-y-1.5">
                                            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Valor</Label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    value={discountValue}
                                                    onChange={e => setDiscountValue(e.target.value)}
                                                    placeholder={discountType === 'percent' ? '0' : '0,00'}
                                                    className="h-9 rounded-xl border-slate-200 bg-white pr-20 text-sm font-semibold"
                                                />
                                                <div className="absolute right-1 top-1 bottom-1 flex bg-slate-50 rounded-lg border border-slate-100 overflow-hidden">
                                                    <button
                                                        type="button"
                                                        onClick={() => setDiscountType('percent')}
                                                        className={cn('px-2.5 text-xs font-bold transition-colors', discountType === 'percent' ? 'bg-white text-bee-amber' : 'text-slate-400 hover:text-slate-600')}
                                                    >%</button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDiscountType('fixed')}
                                                        className={cn('px-2.5 text-xs font-bold transition-colors', discountType === 'fixed' ? 'bg-white text-bee-amber' : 'text-slate-400 hover:text-slate-600')}
                                                    >R$</button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Duration */}
                                        <div className="space-y-1.5">
                                            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Duração</Label>
                                            <Select value={discountDuration} onValueChange={setDiscountDuration}>
                                                <SelectTrigger className="h-9 rounded-xl border-slate-200 bg-white text-sm">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                                    <SelectItem value="1_month">1 mês</SelectItem>
                                                    <SelectItem value="3_months">3 meses</SelectItem>
                                                    <SelectItem value="6_months">6 meses</SelectItem>
                                                    <SelectItem value="12_months">12 meses</SelectItem>
                                                    <SelectItem value="indefinite">Vitalício</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Price preview */}
                                    {discountValue && (
                                        <div className="flex items-center justify-between bg-white rounded-xl border border-slate-100 px-4 py-3">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total com desconto</p>
                                                <p className="text-lg font-black text-slate-800 mt-0.5">
                                                    {finalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </p>
                                            </div>
                                            {discountEndDate && (
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Válido até</p>
                                                    <p className="text-sm font-semibold text-slate-700 mt-0.5 flex items-center gap-1">
                                                        <CalendarIcon className="h-3.5 w-3.5 text-bee-amber" />
                                                        {format(discountEndDate, 'dd/MM/yyyy')}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <DialogFooter className="px-6 py-4 border-t border-slate-100 flex flex-row items-center gap-2 sm:justify-end">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="h-9 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                    >
                        Cancelar
                    </Button>
                    <Button
                        size="sm"
                        disabled={loading || !selectedPlanId}
                        onClick={handleSubmit}
                        className="h-9 rounded-xl bg-bee-amber hover:bg-bee-amber/90 text-bee-midnight font-bold text-xs px-6 gap-1.5 shadow-none"
                    >
                        {loading ? (
                            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvando...</>
                        ) : (
                            <><Check className="h-3.5 w-3.5 stroke-[3px]" /> Salvar plano</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
