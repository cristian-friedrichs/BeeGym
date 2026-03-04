'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Loader2, Check, Save, X, Tag } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addMonths } from "date-fns";

interface Plan {
    id: string;
    name: string;
    description: string | null;
    price: number;
    plan_type: 'membership' | 'pack';
    duration_months: number | null;
    recurrence: 'monthly' | 'quarterly' | 'yearly' | null;
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
        if (open) {
            const fetchPlans = async () => {
                const { data: { user } } = await supabase.auth.getUser();
                const { data: profile } = await (supabase as any)
                    .from('profiles')
                    .select('organization_id')
                    .eq('id', user?.id || '')
                    .single();

                const { data, error } = await (supabase as any)
                    .from('membership_plans')
                    .select('id, name, description, price, plan_type, duration_months, recurrence, days_per_week, credits, active')
                    .eq('active', true)
                    .eq('organization_id', (profile as any)?.organization_id || '')
                    .order('price');
                if (!error && data) setPlans(data as Plan[]);
            };
            fetchPlans();
            setSelectedPlanId(currentPlanId || '');
        }
    }, [open, currentPlanId]);

    const handleSubmit = async () => {
        if (!selectedPlanId) return;

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
                expirationDate = addMonths(new Date(), selectedPlanDetails.duration_months).toISOString();
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
            <SheetContent className="sm:max-w-[600px] flex flex-col h-full overflow-y-auto">
                <SheetHeader className="space-y-3 pb-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                            <SheetTitle className="text-xl">Gerenciar Assinatura</SheetTitle>
                            <SheetDescription>Selecione o novo plano para este aluno.</SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 py-6 space-y-3 overflow-y-auto">
                    {plans.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">Nenhum plano ativo encontrado. Cadastre planos em Configurações &gt; Planos.</p>
                    )}
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={cn(
                                "flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all",
                                selectedPlanId === plan.id
                                    ? "border-orange-500 bg-orange-50 ring-1 ring-orange-500"
                                    : "hover:bg-slate-50"
                            )}
                            onClick={() => setSelectedPlanId(plan.id)}
                        >
                            <div className="flex flex-col gap-1">
                                <span className={cn("font-bold text-base", selectedPlanId === plan.id ? "text-orange-700" : "text-slate-700")}>
                                    {plan.name}
                                </span>
                                {plan.description && (
                                    <span className="text-xs text-muted-foreground">{plan.description}</span>
                                )}
                                <div className="flex gap-2 mt-1">
                                    {plan.plan_type === 'pack' ? (
                                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">{plan.credits} Créditos</Badge>
                                    ) : plan.days_per_week ? (
                                        <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">{plan.days_per_week}x por semana</Badge>
                                    ) : (
                                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Acesso Ilimitado</Badge>
                                    )}
                                    {plan.recurrence && (
                                        <Badge variant="outline" className="text-xs">{recurrenceLabel[plan.recurrence] || plan.recurrence}</Badge>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 ml-4 shrink-0">
                                <span className="font-bold text-lg text-slate-800">
                                    {plan.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                                {selectedPlanId === plan.id && (
                                    <div className="h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center text-white shrink-0">
                                        <Check className="h-4 w-4" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Área de Desconto (Igual ao Cadastro de Aluno) */}
                {selectedPlanDetails && canManageDiscounts && (
                    <div className="mt-4 pt-4 border-t space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-2 cursor-pointer" htmlFor="discount-toggle-manage">
                                <Tag className="h-4 w-4 text-orange-500" />
                                <span className="font-medium text-slate-700">Aplicar Desconto Promocional</span>
                            </Label>
                            <Switch
                                id="discount-toggle-manage"
                                checked={discountActive}
                                onCheckedChange={setDiscountActive}
                            />
                        </div>

                        {discountActive && (
                            <div className="space-y-4 pt-2 animate-in slide-in-from-top-2 fade-in duration-300">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-slate-600">Valor do Desconto</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="number"
                                                value={discountValue}
                                                onChange={e => setDiscountValue(e.target.value)}
                                                placeholder={discountType === 'percent' ? "10" : "50.00"}
                                                className="flex-1"
                                            />
                                            <div className="flex bg-slate-100 rounded-md border p-1">
                                                <button
                                                    className={`px-3 text-sm font-medium rounded-sm transition-colors ${discountType === 'percent' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}
                                                    onClick={() => setDiscountType('percent')}
                                                >
                                                    %
                                                </button>
                                                <button
                                                    className={`px-3 text-sm font-medium rounded-sm transition-colors ${discountType === 'fixed' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}
                                                    onClick={() => setDiscountType('fixed')}
                                                >
                                                    R$
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-slate-600">Duração</Label>
                                        <Select value={discountDuration} onValueChange={setDiscountDuration}>
                                            <SelectTrigger className="h-11 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-xl focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1_month">1º Mês apenas</SelectItem>
                                                <SelectItem value="3_months">3 Meses</SelectItem>
                                                <SelectItem value="6_months">6 Meses</SelectItem>
                                                <SelectItem value="12_months">12 Meses</SelectItem>
                                                <SelectItem value="indefinite">Indeterminado (Sempre)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Preço Final Calculado */}
                                <div className="bg-orange-50 rounded-md p-3 flex justify-between items-center text-sm border border-orange-100">
                                    <span className="text-orange-800 font-medium">Preço Final com Desconto:</span>
                                    <div className="text-right">
                                        <span className="font-bold text-orange-700 text-lg">
                                            {calculateFinalPrice()?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                        {calculateDiscountEndDate() && (
                                            <p className="text-xs text-orange-600">
                                                Válido até: {format(new Date(calculateDiscountEndDate()!), 'dd/MM/yyyy')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <SheetFooter className="mt-auto border-t pt-4 flex gap-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 gap-2">
                        <X className="h-4 w-4" />
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || !selectedPlanId} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold gap-2">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Atualizar Plano
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet >
    );
}
