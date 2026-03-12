'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import {
    CreditCard,
    AlignLeft,
    Banknote,
    Calendar,
    Ticket,
    Clock,
    Infinity as InfinityIcon,
    ChevronRight,
    Save,
    Loader2,
    Shield,
} from 'lucide-react';

const planSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    description: z.string().optional().or(z.literal('')),
    price: z.coerce.number().min(0, 'Preço deve ser maior ou igual a zero'),
    plan_type: z.enum(['membership', 'pack']),

    // Membership fields
    duration_months: z.number().optional().nullable(),
    recurrence: z.enum(['monthly', 'quarterly', 'yearly']).optional().nullable(),
    days_per_week: z.coerce.number().optional().nullable(),

    // Pack fields
    credits: z.coerce.number().optional().nullable(),
    validity_months: z.coerce.number().optional().nullable(),

    active: z.boolean().default(true),
});

export type PlanFormValues = z.infer<typeof planSchema>;

interface PlanFormProps {
    initialData?: any;
    onSubmit: (values: PlanFormValues) => void;
    onClose?: () => void;
    isLoading?: boolean;
    formId?: string;
    showButtons?: boolean;
}
 
export function PlanForm({
    initialData,
    onSubmit,
    onClose,
    isLoading,
    formId = 'plan-form',
    showButtons = true
}: PlanFormProps) {
    const [planType, setPlanType] = useState<'membership' | 'pack'>(
        initialData?.plan_type || 'membership'
    );

    const form = useForm<PlanFormValues>({
        resolver: zodResolver(planSchema),
        defaultValues: {
            name: initialData?.name || '',
            description: initialData?.description || '',
            price: initialData?.price || 0,
            plan_type: initialData?.plan_type || 'membership',
            duration_months: initialData?.duration_months || 1,
            recurrence: initialData?.recurrence || 'monthly',
            days_per_week: initialData?.days_per_week || null,
            credits: initialData?.credits || null,
            validity_months: initialData?.validity_months || 3,
            active: initialData?.active ?? true,
        },
    });

    const handlePlanTypeChange = (value: 'membership' | 'pack') => {
        setPlanType(value);
        form.setValue('plan_type', value);
    };

    return (
        <Form {...form}>
            <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-8 p-1">
                    {/* Tipo de Plano */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
                            <div className="h-2 w-2 rounded-full bg-bee-amber shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tipo de Plano</h3>
                        </div>

                        <FormField
                            control={form.control}
                            name="plan_type"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={handlePlanTypeChange}
                                            defaultValue={field.value}
                                            className="grid grid-cols-1 gap-4"
                                        >
                                            <div
                                                className={`group relative flex items-start space-x-4 p-5 rounded-[2rem] border-2 transition-all cursor-pointer overflow-hidden ${planType === 'membership' ? 'border-bee-amber bg-white shadow-xl shadow-bee-amber/5' : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200'}`}
                                                onClick={() => handlePlanTypeChange('membership')}
                                            >
                                                {planType === 'membership' && (
                                                    <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12 translate-x-2 -translate-y-2">
                                                        <Calendar className="h-24 w-24 text-bee-amber" />
                                                    </div>
                                                )}
                                                <RadioGroupItem value="membership" id="membership" className="mt-1 data-[state=checked]:border-bee-amber data-[state=checked]:text-bee-amber" />
                                                <div className="space-y-1.5 flex-1 relative">
                                                    <Label htmlFor="membership" className="text-sm font-black cursor-pointer flex items-center gap-2 text-slate-900 uppercase tracking-tight">
                                                        <Calendar className={`h-4 w-4 transition-colors ${planType === 'membership' ? 'text-bee-amber' : 'text-slate-400'}`} />
                                                        Assinatura (Recorrente)
                                                    </Label>
                                                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-[280px]">
                                                        Cobrança mensal/anual com acesso contínuo às aulas da academia.
                                                    </p>
                                                </div>
                                            </div>

                                            <div
                                                className={`group relative flex items-start space-x-4 p-5 rounded-[2rem] border-2 transition-all cursor-pointer overflow-hidden ${planType === 'pack' ? 'border-bee-amber bg-white shadow-xl shadow-bee-amber/5' : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200'}`}
                                                onClick={() => handlePlanTypeChange('pack')}
                                            >
                                                {planType === 'pack' && (
                                                    <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12 translate-x-2 -translate-y-2">
                                                        <Ticket className="h-24 w-24 text-bee-amber" />
                                                    </div>
                                                )}
                                                <RadioGroupItem value="pack" id="pack" className="mt-1 data-[state=checked]:border-bee-amber data-[state=checked]:text-bee-amber" />
                                                <div className="space-y-1.5 flex-1 relative">
                                                    <Label htmlFor="pack" className="text-sm font-black cursor-pointer flex items-center gap-2 text-slate-900 uppercase tracking-tight">
                                                        <Ticket className={`h-4 w-4 transition-colors ${planType === 'pack' ? 'text-bee-amber' : 'text-slate-400'}`} />
                                                        Pacote de Aulas (Créditos)
                                                    </Label>
                                                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-[280px]">
                                                        Compra um número específico de créditos para usar em um período.
                                                    </p>
                                                </div>
                                            </div>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Identificação e Preço */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
                            <div className="h-2 w-2 rounded-full bg-bee-amber shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Identificação e Preço</h3>
                        </div>

                        <div className="grid gap-5">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nome do Plano</FormLabel>
                                        <FormControl>
                                            <div className="group relative transition-all">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-bee-amber transition-colors">
                                                    <CreditCard className="h-4 w-4" />
                                                </div>
                                                <Input
                                                    placeholder={planType === 'pack' ? 'Ex: Pacote 20 Aulas' : 'Ex: Mensal 3x/Semana'}
                                                    className="pl-11 h-12 bg-slate-50/50 border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-bee-amber/5 focus:border-bee-amber/20 transition-all font-medium placeholder:text-slate-400"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-[10px] font-bold text-red-500 ml-1" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Preço (R$)</FormLabel>
                                        <FormControl>
                                            <div className="group relative transition-all">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-bee-amber transition-colors">
                                                    <Banknote className="h-4 w-4" />
                                                </div>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0,00"
                                                    className="pl-11 h-12 bg-slate-50/50 border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-bee-amber/5 focus:border-bee-amber/20 transition-all font-medium placeholder:text-slate-400"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-[10px] font-bold text-red-500 ml-1" />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    {/* Regras de Acesso */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
                            <div className="h-2 w-2 rounded-full bg-bee-amber shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Regras de Acesso</h3>
                        </div>

                        {/* Conditional Fields for MEMBERSHIP */}
                        {planType === 'membership' && (
                            <div className="grid gap-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="duration_months"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Duração do Contrato</FormLabel>
                                                <Select
                                                    onValueChange={(value) => field.onChange(value === "unlimited" ? null : parseInt(value))}
                                                    defaultValue={field.value === null ? "unlimited" : field.value?.toString()}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="h-12 px-4 bg-slate-50/50 border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-bee-amber/5 focus:border-bee-amber/20 transition-all text-sm font-bold text-slate-700">
                                                            <div className="flex items-center gap-3">
                                                                <Clock className="h-4 w-4 text-slate-400" />
                                                                <SelectValue placeholder="Selecione" />
                                                            </div>
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl" position="popper" sideOffset={8}>
                                                        <SelectItem value="unlimited" className="text-bee-amber font-black h-10 rounded-xl focus:bg-bee-amber/5 focus:text-bee-amber">
                                                            <div className="flex items-center gap-2">
                                                                <InfinityIcon className="h-3 w-3" />
                                                                ILIMITADO
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="1" className="font-bold h-10 rounded-xl">1 Mês</SelectItem>
                                                        <SelectItem value="3" className="font-bold h-10 rounded-xl">3 Meses</SelectItem>
                                                        <SelectItem value="6" className="font-bold h-10 rounded-xl">6 Meses</SelectItem>
                                                        <SelectItem value="12" className="font-bold h-10 rounded-xl">12 Meses</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage className="text-[10px] font-bold text-red-500 ml-1" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="recurrence"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Cobrança</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value || 'monthly'}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-12 px-4 bg-slate-50/50 border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-bee-amber/5 focus:border-bee-amber/20 transition-all text-sm font-bold text-slate-700">
                                                            <div className="flex items-center gap-3">
                                                                <Banknote className="h-4 w-4 text-slate-400" />
                                                                <SelectValue placeholder="Selecione" />
                                                            </div>
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl" position="popper" sideOffset={8}>
                                                        <SelectItem value="monthly" className="font-bold h-10 rounded-xl">MENSAL</SelectItem>
                                                        <SelectItem value="quarterly" className="font-bold h-10 rounded-xl">TRIMESTRAL</SelectItem>
                                                        <SelectItem value="yearly" className="font-bold h-10 rounded-xl">ANUAL</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage className="text-[10px] font-bold text-red-500 ml-1" />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="days_per_week"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Frequência Semanal</FormLabel>
                                            <Select
                                                onValueChange={(value) => field.onChange(value === 'unlimited' ? null : parseInt(value))}
                                                defaultValue={field.value ? field.value.toString() : 'unlimited'}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="h-12 px-4 bg-slate-50/50 border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-bee-amber/5 focus:border-bee-amber/20 transition-all text-sm font-bold text-slate-700">
                                                        <div className="flex items-center gap-3">
                                                            <Calendar className="h-4 w-4 text-slate-400" />
                                                            <SelectValue placeholder="Selecione" />
                                                        </div>
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-2xl border-slate-100 shadow-xl" position="popper" sideOffset={8}>
                                                    <SelectItem value="unlimited" className="text-green-600 font-black h-10 rounded-xl focus:bg-green-50 focus:text-green-600">
                                                        <div className="flex items-center gap-2">
                                                            <InfinityIcon className="h-3 w-3" />
                                                            ILIMITADO
                                                        </div>
                                                    </SelectItem>
                                                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                                                        <SelectItem key={num} value={num.toString()} className="font-bold h-10 rounded-xl">
                                                            {num}X POR SEMANA
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormDescription className="text-[10px] font-medium text-slate-400 ml-1">
                                                Limite de treinos permitidos por semana
                                            </FormDescription>
                                            <FormMessage className="text-[10px] font-bold text-red-500 ml-1" />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        {/* Conditional Fields for PACK */}
                        {planType === 'pack' && (
                            <div className="grid gap-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="credits"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Quantidade de Aulas</FormLabel>
                                                <FormControl>
                                                    <div className="group relative transition-all">
                                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-bee-amber transition-colors">
                                                            <Ticket className="h-4 w-4" />
                                                        </div>
                                                        <Input
                                                            type="number"
                                                            placeholder="Ex: 20"
                                                            className="pl-11 h-12 bg-slate-50/50 border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-bee-amber/5 focus:border-bee-amber/20 transition-all font-medium placeholder:text-slate-400"
                                                            {...field}
                                                            value={field.value || ''}
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage className="text-[10px] font-bold text-red-500 ml-1" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="validity_months"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Validade (Meses)</FormLabel>
                                                <FormControl>
                                                    <div className="group relative transition-all">
                                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-bee-amber transition-colors">
                                                            <Clock className="h-4 w-4" />
                                                        </div>
                                                        <Input
                                                            type="number"
                                                            placeholder="Ex: 3"
                                                            className="pl-11 h-12 bg-slate-50/50 border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-bee-amber/5 focus:border-bee-amber/20 transition-all font-medium placeholder:text-slate-400"
                                                            {...field}
                                                            value={field.value || ''}
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage className="text-[10px] font-bold text-red-500 ml-1" />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Informações Adicionais */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
                            <div className="h-2 w-2 rounded-full bg-bee-amber shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Informações Adicionais</h3>
                        </div>

                        <div className="grid gap-5">
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Descrição (Opcional)</FormLabel>
                                        <FormControl>
                                            <div className="group relative transition-all">
                                                <div className="absolute left-4 top-4 text-slate-400 group-focus-within:text-bee-amber transition-colors">
                                                    <AlignLeft className="h-4 w-4" />
                                                </div>
                                                <Textarea
                                                    placeholder="Descreva o que este plano inclui..."
                                                    className="pl-11 min-h-[100px] bg-slate-50/50 border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-bee-amber/5 focus:border-bee-amber/20 transition-all font-medium placeholder:text-slate-400 resize-none py-4"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-[10px] font-bold text-red-500 ml-1" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="active"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-[1.5rem] bg-slate-50/50 border border-slate-100 p-5 transition-all hover:bg-white hover:border-slate-200 group/status">
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <Shield className={`h-4 w-4 transition-colors ${field.value ? 'text-green-500' : 'text-slate-400'}`} />
                                                <FormLabel className="text-sm font-black text-slate-900 uppercase tracking-tight">Status do Plano</FormLabel>
                                            </div>
                                            <FormDescription className="text-[11px] font-medium text-slate-500 max-w-[240px]">
                                                {field.value
                                                    ? "O plano está ativo e disponível para novas matrículas."
                                                    : "O plano está arquivado e não aparecerá nas opções de venda."}
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                className="data-[state=checked]:bg-green-500"
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </div>

                {showButtons && (
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 mt-6 border-t">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            disabled={isLoading}
                            className="h-11 rounded-full font-bold text-slate-400 hover:text-slate-600 transition-all uppercase tracking-wider text-xs"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 h-11 rounded-full bg-bee-amber hover:bg-amber-500 text-bee-midnight font-black shadow-lg shadow-bee-amber/20 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider text-xs"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Salvar Plano
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </form>
        </Form>
    );
}
