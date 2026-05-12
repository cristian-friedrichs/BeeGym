'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Calendar, Ticket, Infinity as InfinityIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const planSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    description: z.string().optional().or(z.literal('')),
    price: z.coerce.number().min(0, 'Preço deve ser maior ou igual a zero'),
    plan_type: z.enum(['membership', 'pack']),
    duration_months: z.number().optional().nullable(),
    recurrence: z.enum(['monthly', 'quarterly', 'yearly']).optional().nullable(),
    days_per_week: z.coerce.number().optional().nullable(),
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

const fieldCls = 'h-9 rounded-xl border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:border-bee-amber focus:ring-2 focus:ring-bee-amber/20 focus:ring-offset-0';
const labelCls = 'text-sm font-medium text-slate-700';

export function PlanForm({ initialData, onSubmit, onClose, isLoading, formId = 'plan-form', showButtons = true }: PlanFormProps) {
    const [planType, setPlanType] = useState<'membership' | 'pack'>(initialData?.plan_type || 'membership');

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
            <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

                {/* Tipo de plano */}
                <FormField control={form.control} name="plan_type" render={({ field }) => (
                    <FormItem>
                        <FormLabel className={labelCls}>Tipo de plano</FormLabel>
                        <FormControl>
                            <RadioGroup onValueChange={handlePlanTypeChange} defaultValue={field.value} className="grid grid-cols-2 gap-2">
                                {[
                                    { value: 'membership', icon: Calendar, label: 'Assinatura', desc: 'Cobrança recorrente' },
                                    { value: 'pack', icon: Ticket, label: 'Pacote de créditos', desc: 'Número fixo de aulas' },
                                ].map(({ value, icon: Icon, label, desc }) => (
                                    <div
                                        key={value}
                                        onClick={() => handlePlanTypeChange(value as 'membership' | 'pack')}
                                        className={cn(
                                            'flex items-start gap-2.5 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors',
                                            planType === value ? 'border-bee-amber bg-bee-amber/5' : 'border-slate-200 hover:border-slate-300'
                                        )}
                                    >
                                        <RadioGroupItem value={value} className="mt-0.5 data-[state=checked]:border-bee-amber data-[state=checked]:text-bee-amber" />
                                        <div>
                                            <Label className="text-sm font-medium text-slate-700 cursor-pointer flex items-center gap-1.5">
                                                <Icon className={cn('h-3.5 w-3.5', planType === value ? 'text-bee-amber' : 'text-slate-400')} />
                                                {label}
                                            </Label>
                                            <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <hr className="border-slate-100" />
                <p className="text-sm font-semibold text-slate-700">Identificação e preço</p>

                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                        <FormLabel className={labelCls}>Nome do plano *</FormLabel>
                        <FormControl><Input placeholder={planType === 'pack' ? 'Ex: Pacote 20 Aulas' : 'Ex: Mensal 3x/Semana'} className={fieldCls} {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem>
                        <FormLabel className={labelCls}>Preço (R$)</FormLabel>
                        <FormControl><Input type="number" step="0.01" placeholder="0,00" className={fieldCls} {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <hr className="border-slate-100" />
                <p className="text-sm font-semibold text-slate-700">Regras de acesso</p>

                {planType === 'membership' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <FormField control={form.control} name="duration_months" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={labelCls}>Duração do contrato</FormLabel>
                                    <Select onValueChange={v => field.onChange(v === 'unlimited' ? null : parseInt(v))} defaultValue={field.value === null ? 'unlimited' : field.value?.toString()}>
                                        <FormControl><SelectTrigger className={fieldCls}><SelectValue placeholder="Selecione…" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="unlimited"><span className="flex items-center gap-1.5"><InfinityIcon className="h-3 w-3" />Ilimitado</span></SelectItem>
                                            <SelectItem value="1">1 mês</SelectItem>
                                            <SelectItem value="3">3 meses</SelectItem>
                                            <SelectItem value="6">6 meses</SelectItem>
                                            <SelectItem value="12">12 meses</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="recurrence" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={labelCls}>Cobrança</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value || 'monthly'}>
                                        <FormControl><SelectTrigger className={fieldCls}><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="monthly">Mensal</SelectItem>
                                            <SelectItem value="quarterly">Trimestral</SelectItem>
                                            <SelectItem value="yearly">Anual</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="days_per_week" render={({ field }) => (
                            <FormItem>
                                <FormLabel className={labelCls}>Frequência semanal</FormLabel>
                                <Select onValueChange={v => field.onChange(v === 'unlimited' ? null : parseInt(v))} defaultValue={field.value ? field.value.toString() : 'unlimited'}>
                                    <FormControl><SelectTrigger className={fieldCls}><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="unlimited"><span className="flex items-center gap-1.5"><InfinityIcon className="h-3 w-3" />Ilimitado</span></SelectItem>
                                        {[1,2,3,4,5,6,7].map(n => <SelectItem key={n} value={n.toString()}>{n}x por semana</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-slate-400 mt-1">Limite de treinos por semana.</p>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                )}

                {planType === 'pack' && (
                    <div className="grid grid-cols-2 gap-3">
                        <FormField control={form.control} name="credits" render={({ field }) => (
                            <FormItem>
                                <FormLabel className={labelCls}>Quantidade de aulas</FormLabel>
                                <FormControl><Input type="number" placeholder="Ex: 20" className={fieldCls} {...field} value={field.value || ''} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="validity_months" render={({ field }) => (
                            <FormItem>
                                <FormLabel className={labelCls}>Validade (meses)</FormLabel>
                                <FormControl><Input type="number" placeholder="Ex: 3" className={fieldCls} {...field} value={field.value || ''} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                )}

                <hr className="border-slate-100" />

                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                        <FormLabel className={labelCls}>Descrição</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Descreva o que este plano inclui…" className="rounded-xl border-slate-200 bg-white text-sm resize-none placeholder:text-slate-400 focus:border-bee-amber focus:ring-2 focus:ring-bee-amber/20" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="active" render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                        <div>
                            <FormLabel className="text-sm font-medium text-slate-700">Plano ativo</FormLabel>
                            <FormDescription className="text-xs text-slate-400">
                                {field.value ? 'Disponível para novas matrículas.' : 'Arquivado — não aparece nas opções de venda.'}
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-green-500" />
                        </FormControl>
                    </FormItem>
                )} />

                {showButtons && (
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="h-9 rounded-full px-5 border-slate-200 text-slate-600 text-sm">Cancelar</Button>
                        <Button type="submit" disabled={isLoading} className="h-9 rounded-full px-6 bg-bee-amber hover:bg-amber-500 text-bee-midnight font-semibold text-sm shadow-sm">
                            {isLoading ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Salvando…</> : 'Salvar plano'}
                        </Button>
                    </div>
                )}
            </form>
        </Form>
    );
}
