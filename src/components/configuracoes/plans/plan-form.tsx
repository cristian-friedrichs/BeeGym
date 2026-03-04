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
import { Calendar, Ticket } from 'lucide-react';

const planSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    description: z.string().optional().or(z.literal('')),
    price: z.coerce.number().min(0, 'Preço deve ser maior ou igual a zero'),
    plan_type: z.enum(['membership', 'pack']),

    // Membership fields
    duration_months: z.coerce.number().optional().nullable(),
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
    isLoading?: boolean;
}

export function PlanForm({ initialData, onSubmit, isLoading }: PlanFormProps) {
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Plan Type Selector */}
                <FormField
                    control={form.control}
                    name="plan_type"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel className="text-base">Tipo de Plano</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    onValueChange={handlePlanTypeChange}
                                    defaultValue={field.value}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                >
                                    <Card className={`cursor-pointer transition-all hover:shadow-md ${planType === 'membership' ? 'ring-2 ring-primary' : ''}`}>
                                        <div className="flex items-start space-x-3 p-4" onClick={() => handlePlanTypeChange('membership')}>
                                            <RadioGroupItem value="membership" id="membership" />
                                            <div className="space-y-1 flex-1">
                                                <Label htmlFor="membership" className="font-medium cursor-pointer flex items-center gap-2">
                                                    <Calendar className="h-4 w-4" />
                                                    Assinatura (Recorrente)
                                                </Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Cobrança mensal/anual com acesso contínuo
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                    <Card className={`cursor-pointer transition-all hover:shadow-md ${planType === 'pack' ? 'ring-2 ring-primary' : ''}`}>
                                        <div className="flex items-start space-x-3 p-4" onClick={() => handlePlanTypeChange('pack')}>
                                            <RadioGroupItem value="pack" id="pack" />
                                            <div className="space-y-1 flex-1">
                                                <Label htmlFor="pack" className="font-medium cursor-pointer flex items-center gap-2">
                                                    <Ticket className="h-4 w-4" />
                                                    Pacote de Aulas
                                                </Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Compra X créditos para usar em Y meses
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome do Plano</FormLabel>
                                <FormControl>
                                    <Input placeholder={planType === 'pack' ? 'Ex: Pacote 20 Aulas' : 'Ex: Mensal 3x/Semana'} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Preço (R$)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0,00"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>Valor que o cliente pagará</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Conditional Fields for MEMBERSHIP */}
                {planType === 'membership' && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                        <h3 className="font-medium text-sm">Detalhes da Assinatura</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="duration_months"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Duração do Contrato</FormLabel>
                                        <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                                            <FormControl>
                                                <SelectTrigger className="h-10 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-lg focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="1">1 mês</SelectItem>
                                                <SelectItem value="3">3 meses</SelectItem>
                                                <SelectItem value="6">6 meses</SelectItem>
                                                <SelectItem value="12">12 meses</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="recurrence"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cobrança</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value || 'monthly'}>
                                            <FormControl>
                                                <SelectTrigger className="h-10 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-lg focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="monthly">Mensal</SelectItem>
                                                <SelectItem value="quarterly">Trimestral</SelectItem>
                                                <SelectItem value="yearly">Anual</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="days_per_week"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Frequência Semanal</FormLabel>
                                    <Select
                                        onValueChange={(value) => field.onChange(value === 'unlimited' ? null : parseInt(value))}
                                        defaultValue={field.value ? field.value.toString() : 'unlimited'}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="h-10 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-lg focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                                                <SelectValue placeholder="Selecione" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="unlimited">Ilimitado</SelectItem>
                                            <SelectItem value="1">1x por semana</SelectItem>
                                            <SelectItem value="2">2x por semana</SelectItem>
                                            <SelectItem value="3">3x por semana</SelectItem>
                                            <SelectItem value="4">4x por semana</SelectItem>
                                            <SelectItem value="5">5x por semana</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Quantas vezes o aluno pode treinar por semana
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}

                {/* Conditional Fields for PACK */}
                {planType === 'pack' && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                        <h3 className="font-medium text-sm">Detalhes do Pacote</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="credits"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quantidade de Aulas</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="Ex: 20"
                                                {...field}
                                                value={field.value || ''}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Número de créditos/aulas
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="validity_months"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Validade (Meses)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="Ex: 3"
                                                {...field}
                                                value={field.value || ''}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Tempo para usar os créditos
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                )}

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descrição (Opcional)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Descreva o que este plano inclui..."
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <FormLabel>Ativo</FormLabel>
                                <FormDescription>
                                    Se desativado, o plano não poderá ser selecionado para novas matrículas.
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                        {isLoading ? 'Salvando...' : 'Salvar Plano'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
