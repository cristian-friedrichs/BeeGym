'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { CreditCard, Loader2, Check, Save, X, Tag, Hash, CalendarIcon, Info } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addMonths } from "date-fns";
const dateAddMonths = addMonths;
import { Separator } from '@/components/ui/separator';

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
    monthly: 'Mensal',
    quarterly: 'Trimestral',
    yearly: 'Anual',
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

    // Discount State
    const [discountActive, setDiscountActive] = useState(false);
    const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
    const [discountValue, setDiscountValue] = useState('');
    const [discountDuration, setDiscountDuration] = useState('1_month');

    // Permissions (TODO: Implement real RBAC)
    const [canManageDiscounts, setCanManageDiscounts] = useState(true);

    const selectedPlanDetails = plans.find(p => p.id === selectedPlanId);

    const calculateFinalPrice = () => {
        if (!selectedPlanDetails) return 0;
        if (!discountActive || !discountValue) return selectedPlanDetails.price;

        const value = parseFloat(discountValue.replace(',', '.'));
        if (isNaN(value)) return selectedPlanDetails.price;

        if (discountType === 'percent') {
            return selectedPlanDetails.price * (1 - value / 100);
        } else {
            return Math.max(0, selectedPlanDetails.price - value);
        }
    };

    const calculateDiscountEndDate = () => {
        if (!discountActive) return null;
        const now = new Date();
        switch (discountDuration) {
            case '1_month': return addMonths(now, 1);
            case '3_months': return addMonths(now, 3);
            case '6_months': return addMonths(now, 6);
            case '12_months': return addMonths(now, 12);
            case 'indefinite': return null;
            default: return null;
        }
    };

    useEffect(() => {
        if (!open || !studentId) return;

        const loadData = async () => {
            setLoading(true);
            try {
                // 1. Resolve Organization ID (If admin, we need the student's org)
                let resolvedOrgId = organizationId;

                // If we're not sure about the org or to be safe, fetch student's org
                const { data: studentData } = await (supabase as any)
                    .from('students')
                    .select('organization_id')
                    .eq('id', studentId)
                    .single();

                if (studentData?.organization_id) {
                    resolvedOrgId = studentData.organization_id;
                }

                if (!resolvedOrgId) return;

                // 2. Fetch Plans for that Org
                const { data, error } = await supabase
                    .from('membership_plans')
                    .select('*')
                    .eq('active', true)
                    .eq('organization_id', resolvedOrgId)
                    .order('name');

                if (!error && data) {
                    setPlans(data as Plan[]);
                }

                setSelectedPlanId(currentPlanId || '');
            } catch (err) {
                console.error('Error loading modal data:', err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [open, studentId, currentPlanId, organizationId]);

    const handleSubmit = async () => {
        if (!selectedPlanId) {
            toast({ title: "Selecione um plano", variant: "destructive" });
            return;
        }

        // Discount validation
        if (discountActive && discountValue) {
            const dv = parseFloat(discountValue.replace(',', '.'));
            if (isNaN(dv) || dv <= 0) {
                toast({ title: "Desconto inválido", description: "O valor do desconto deve ser maior que zero.", variant: "destructive" });
                return;
            }
            if (discountType === 'percent' && dv >= 100) {
                toast({ title: "Desconto inválido", description: "O desconto percentual deve ser menor que 100%.", variant: "destructive" });
                return;
            }
            if (discountType === 'fixed' && selectedPlanDetails && dv >= selectedPlanDetails.price) {
                toast({ title: "Desconto inválido", description: "O desconto fixo não pode ser igual ou maior que o valor do plano.", variant: "destructive" });
                return;
            }
        }

        setLoading(true);
        try {
            // Fetch current student data for credits calculation
            const { data: currentStudent } = await (supabase as any)
                .from('students')
                .select('credits_balance')
                .eq('id', studentId)
                .single();

            // Calculate new credits balance (Cumulative)
            let newCreditsBalance = undefined;
            if (selectedPlanDetails?.plan_type === 'pack') {
                const currentBalance = currentStudent?.credits_balance || 0;
                newCreditsBalance = currentBalance + (selectedPlanDetails.credits || 0);
            }

            // Calculate Expiration Date
            let expirationDate = null;
            if (selectedPlanDetails?.duration_months) {
                expirationDate = dateAddMonths(new Date(), selectedPlanDetails.duration_months).toISOString();
            }
            const discountEndDate = calculateDiscountEndDate()?.toISOString() || null;
            const discountVal = discountActive && discountValue ? parseFloat(discountValue.replace(',', '.')) : null;

            // 1. Close any current active history row for this student
            await (supabase as any)
                .from('student_plan_history' as any)
                .update({ ended_at: new Date().toISOString() } as any)
                .eq('student_id', studentId)
                .is('ended_at', null);

            // 2. Insert new history row with snapshot of chosen plan + discount
            const finalPrice = calculateFinalPrice();
            await (supabase as any)
                .from('student_plan_history' as any)
                .insert({
                    student_id: studentId,
                    plan_id: selectedPlanId,
                    plan_name: selectedPlanDetails?.name ?? null,
                    plan_price: selectedPlanDetails?.price ?? null,
                    discount_type: discountActive ? discountType : null,
                    discount_value: discountVal,
                    discount_end_date: discountEndDate,
                    final_price: finalPrice,
                    started_at: new Date().toISOString(),
                    expiration_date: expirationDate,
                } as any);

            // 3. Update the student record
            const { error } = await (supabase as any)
                .from('students')
                .update({
                    plan_id: selectedPlanId,
                    discount_type: discountActive ? discountType : null,
                    discount_value: discountVal,
                    discount_end_date: discountEndDate,
                    updated_at: new Date().toISOString(),
                    // Cumulative credits if pack plan
                    ...(selectedPlanDetails?.plan_type === 'pack' ? { credits_balance: newCreditsBalance } : {})
                } as any)
                .eq('id', studentId);

            if (error) throw error;

            toast({ title: "Plano atualizado com sucesso!" });
            if (onSuccess) onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
            toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="p-0 border-none bg-white sm:max-w-[600px] flex flex-col h-full overflow-hidden">
                <SheetHeader className="p-6 border-b border-slate-50 bg-white shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="h-12 w-12 rounded-xl bg-bee-amber/10 flex items-center justify-center border border-bee-amber/20">
                            <CreditCard className="h-6 w-6 text-bee-amber" />
                        </div>
                        <div className="text-left">
                            <div className="flex items-center gap-2 mb-0.5">
                                <SheetTitle className="text-xl font-bold tracking-tight text-bee-midnight uppercase">
                                    Assinatura
                                </SheetTitle>
                                <Badge className="bg-bee-amber text-bee-midnight border-none font-black uppercase text-[10px] tracking-tight h-5 px-2 rounded-full">
                                    Financeiro
                                </Badge>
                            </div>
                            <SheetDescription className="text-slate-400 font-medium text-xs">
                                Gerencie o plano e benefícios do aluno.
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 scrollbar-hide">
                    {/* Lista de Planos */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-bee-amber/10 flex items-center justify-center">
                                <CreditCard className="h-4 w-4 text-bee-amber" />
                            </div>
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Planos Disponíveis</h3>
                        </div>

                        <div className="space-y-3">
                            {plans.length === 0 && (
                                <div className="p-12 border-2 border-dashed border-slate-100 rounded-[32px] text-center space-y-2">
                                    <Info className="h-8 w-8 text-slate-200 mx-auto" />
                                    <p className="text-sm font-semibold text-slate-500">Nenhum plano ativo encontrado.</p>
                                    <p className="text-xs text-slate-400">Cadastre planos em Configurações &gt; Planos.</p>
                                </div>
                            )}

                            {plans.map((plan) => (
                                <div
                                    key={plan.id}
                                    onClick={() => setSelectedPlanId(plan.id)}
                                    className={cn(
                                        "group relative flex items-center justify-between p-6 rounded-[32px] cursor-pointer transition-all duration-300 border-2",
                                        selectedPlanId === plan.id
                                            ? "bg-bee-amber/[0.03] border-bee-amber shadow-xl shadow-bee-amber/5"
                                            : "border-slate-50 hover:border-bee-amber/20 hover:bg-slate-50/50 bg-slate-50/30"
                                    )}
                                >
                                    {selectedPlanId === plan.id && (
                                        <div className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-bee-amber flex items-center justify-center text-bee-midnight shadow-lg border-2 border-white animate-in zoom-in-50 duration-300 z-10">
                                            <Check className="h-4 w-4 stroke-[4px]" />
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "font-black text-lg tracking-tight transition-colors uppercase",
                                                selectedPlanId === plan.id ? "text-bee-midnight" : "text-slate-700"
                                            )}>
                                                {plan.name}
                                            </span>
                                            {plan.plan_type === 'pack' && (
                                                <Badge className="bg-blue-50 text-blue-600 border-none font-black uppercase text-[9px] tracking-widest px-2 h-5 rounded-full">Pack</Badge>
                                            )}
                                        </div>

                                        {plan.description && (
                                            <span className="text-sm text-slate-400 font-medium leading-tight max-w-[300px]">{plan.description}</span>
                                        )}

                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {plan.plan_type === 'pack' ? (
                                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/50 border border-blue-100/50 text-blue-600 text-[10px] font-black uppercase tracking-wider">
                                                    <Hash className="h-3 w-3" />
                                                    {plan.credits} Créditos
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-bee-amber/10 border border-bee-amber/10 text-bee-amber text-[10px] font-black uppercase tracking-wider">
                                                    <Check className="h-3 w-3 stroke-[3px]" />
                                                    {plan.duration_months ? `${plan.duration_months} meses` : 'Ilimitado'}
                                                </div>
                                            )}
                                            {plan.recurrence && plan.recurrence !== 'one_time' && (
                                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                                                    <CalendarIcon className="h-3 w-3" />
                                                    {recurrenceLabel[plan.recurrence] || plan.recurrence}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className={cn(
                                            "text-2xl font-black tracking-tighter transition-colors",
                                            selectedPlanId === plan.id ? "text-bee-amber" : "text-slate-900"
                                        )}>
                                            {plan.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </div>
                                        {plan.recurrence && plan.plan_type !== 'pack' && (
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1 block">por período</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Área de Desconto */}
                </div>
                {selectedPlanDetails && canManageDiscounts && (
                    <div className="px-8 mt-auto pb-4">
                        <div className={cn(
                            "p-6 rounded-[32px] border-2 transition-all duration-500",
                            discountActive
                                ? "bg-bee-amber/[0.02] border-bee-amber/20 shadow-xl shadow-bee-amber/5"
                                : "bg-slate-50 border-dashed border-slate-200"
                        )}>
                            <div className="flex items-center justify-between mb-6">
                                <Label className="flex items-center gap-3 cursor-pointer group/label" htmlFor="discount-toggle-manage">
                                    <div className={cn(
                                        "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                                        discountActive ? "bg-bee-amber/20" : "bg-slate-200"
                                    )}>
                                        <Tag className={cn("h-4 w-4", discountActive ? "text-bee-amber" : "text-slate-400")} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-0.5">Promoção</span>
                                        <span className="font-bold text-slate-700">Aplicar Desconto</span>
                                    </div>
                                </Label>
                                <Switch
                                    id="discount-toggle-manage"
                                    checked={discountActive}
                                    onCheckedChange={setDiscountActive}
                                    className="data-[state=checked]:bg-bee-amber"
                                />
                            </div>

                            {discountActive && (
                                <div className="space-y-6 animate-in slide-in-from-top-4 fade-in duration-500">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Valor</Label>
                                            <div className="group/input relative">
                                                <Input
                                                    type="number"
                                                    value={discountValue}
                                                    onChange={e => setDiscountValue(e.target.value)}
                                                    placeholder={discountType === 'percent' ? "0" : "0,00"}
                                                    className="h-11 border-slate-100 bg-white rounded-2xl transition-all font-black text-bee-midnight text-lg px-5 focus:ring-bee-amber/20"
                                                />
                                                <div className="absolute right-2 top-2 bottom-2 flex bg-slate-50 rounded-xl border p-1 border-slate-100 shadow-inner">
                                                    <button
                                                        type="button"
                                                        onClick={() => setDiscountType('percent')}
                                                        className={cn(
                                                            "px-3 text-xs font-black rounded-lg transition-all",
                                                            discountType === 'percent' ? "bg-white shadow-sm text-bee-amber" : "text-slate-400 hover:text-slate-600"
                                                        )}
                                                    >
                                                        %
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDiscountType('fixed')}
                                                        className={cn(
                                                            "px-3 text-xs font-black rounded-lg transition-all",
                                                            discountType === 'fixed' ? "bg-white shadow-sm text-bee-amber" : "text-slate-400 hover:text-slate-600"
                                                        )}
                                                    >
                                                        R$
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Duração</Label>
                                            <Select value={discountDuration} onValueChange={setDiscountDuration}>
                                                <SelectTrigger className="h-11 bg-white border-slate-100 rounded-2xl transition-all font-bold text-bee-midnight px-5 focus:ring-bee-amber/20 focus:border-bee-amber/30 shadow-sm">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-2 bg-white">
                                                    <SelectItem value="1_month" className="rounded-xl focus:bg-bee-amber/10 focus:text-bee-amber font-bold py-3 px-4 transition-colors">1º Mês apenas</SelectItem>
                                                    <SelectItem value="3_months" className="rounded-xl focus:bg-bee-amber/10 focus:text-bee-amber font-bold py-3 px-4 transition-colors">3 Meses</SelectItem>
                                                    <SelectItem value="6_months" className="rounded-xl focus:bg-bee-amber/10 focus:text-bee-amber font-bold py-3 px-4 transition-colors">6 Meses</SelectItem>
                                                    <SelectItem value="12_months" className="rounded-xl focus:bg-bee-amber/10 focus:text-bee-amber font-bold py-3 px-4 transition-colors">12 Meses</SelectItem>
                                                    <SelectItem value="indefinite" className="rounded-xl focus:bg-bee-amber/10 focus:text-bee-amber font-bold py-3 px-4 transition-colors">VITALÍCIO</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="bg-white border border-bee-amber/10 rounded-2xl p-4 flex justify-between items-center shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-bee-amber flex items-center justify-center text-bee-midnight">
                                                <Check className="h-5 w-5 stroke-[3px]" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total com Desconto</p>
                                                <p className="text-xl font-black text-bee-midnight tracking-tighter leading-none mt-1">
                                                    {calculateFinalPrice()?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </p>
                                            </div>
                                        </div>
                                        {calculateDiscountEndDate() && (
                                            <div className="text-right">
                                                <div className="flex items-center justify-end gap-1.5 text-bee-amber">
                                                    <CalendarIcon className="h-3.5 w-3.5" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Até {format(new Date(calculateDiscountEndDate()!), 'dd/MM/yyyy')}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <SheetFooter className="p-8 border-t bg-white flex items-center gap-3 shrink-0 sm:justify-end sticky bottom-0 z-30">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="flex-1 sm:flex-none text-slate-400 hover:text-slate-600 hover:bg-slate-50 font-black h-10 rounded-full uppercase text-[10px] tracking-widest transition-all"
                    >
                        <X className="mr-2 h-4 w-4" />
                        Descartar
                    </Button>
                    <Button
                        disabled={loading || !selectedPlanId}
                        onClick={handleSubmit}
                        className="flex-1 sm:flex-none bg-bee-amber hover:bg-amber-500 text-bee-midnight font-black h-10 rounded-full shadow-lg shadow-bee-amber/10 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-[10px] px-10"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processando...
                            </>
                        ) : (
                            <>
                                <Check className="mr-2 h-4 w-4 stroke-[3px]" />
                                Atualizar Assinatura
                            </>
                        )}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet >
    );
}
