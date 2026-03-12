'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { getFinancialSettingsAction, updateFinancialSettingsAction } from '@/actions/financial';
import { useSubscription } from '@/hooks/useSubscription';
import { SectionHeader } from '@/components/ui/section-header';
import { CreditCard, TrendingUp, Bell, Loader2, Save } from 'lucide-react';

const financialSchema = z.object({
    config_currency: z.string().default('BRL'),
    config_fine_percent: z.coerce.number().min(0).max(100),
    config_interest_monthly_percent: z.coerce.number().min(0).max(100),
    config_invoice_days_before: z.coerce.number().min(0),
    config_notify_due_date: z.boolean(),
    config_notify_overdue: z.boolean(),
});

type FinancialFormValues = z.infer<typeof financialSchema>;

export default function FinancialSettingsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { hasFeature, loading: subLoading, isAdmin } = useSubscription();

    useEffect(() => {
        if (!subLoading && !isAdmin && !hasFeature('automacao_cobranca')) {
            router.replace('/app/configuracoes');
        }
    }, [subLoading, hasFeature, isAdmin, router]);

    const form = useForm<FinancialFormValues>({
        resolver: zodResolver(financialSchema),
        defaultValues: {
            config_currency: 'BRL',
            config_fine_percent: 2.0,
            config_interest_monthly_percent: 1.0,
            config_invoice_days_before: 10,
            config_notify_due_date: true,
            config_notify_overdue: true,
        },
    });

    useEffect(() => {
        async function loadSettings() {
            try {
                const result = await getFinancialSettingsAction();
                if (result.success && result.data) {
                    form.reset(result.data);
                }
            } catch (error) {
                console.error('Error loading financial settings:', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadSettings();
    }, [form]);

    async function onSubmit(values: FinancialFormValues) {
        setIsSaving(true);
        const result = await updateFinancialSettingsAction(values);

        if (result.success) {
            toast({
                title: 'Configurações salvas',
                description: 'As regras financeiras foram atualizadas com sucesso.',
            });
            router.refresh();
        } else {
            toast({
                title: 'Erro ao salvar',
                description: result.error || 'Ocorreu um erro ao salvar as configurações.',
                variant: 'destructive',
            });
        }
        setIsSaving(false);
    }

    if (isLoading || subLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!hasFeature('automacao_cobranca')) {
        return null; // Don't render while redirecting
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex-1 p-4 md:p-8 pt-6">
                <SectionHeader
                    title="Configurações Financeiras"
                    subtitle="Configure as regras de cobrança, multas e notificações automáticas"
                    action={
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="bg-bee-amber hover:bg-amber-500 text-bee-midnight font-bold h-11 px-8 rounded-full shadow-lg shadow-bee-amber/20 transition-all hover:scale-[1.02] active:scale-[0.98] text-[13px] uppercase tracking-wider"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Salvar Alterações
                                </>
                            )}
                        </Button>
                    }
                />

                {/* Card 1: Encargos e Multas */}
                <Card className="rounded-[2rem] shadow-sm border-slate-100 overflow-hidden bg-white/50 backdrop-blur-sm">
                    <CardHeader className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-6 bg-[#FFBF00] rounded-full" />
                            <div className="flex items-center gap-2">
                                <div className="h-5 w-5 text-bee-amber">
                                    <TrendingUp className="h-5 w-5" />
                                </div>
                                <CardTitle className="text-lg font-bold text-deep-midnight tracking-tight font-display">Encargos e Multas</CardTitle>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="config_fine_percent"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Multa por Atraso (%)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            placeholder="2.00"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Percentual único aplicado ao vencer.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="config_interest_monthly_percent"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Juros Mensais (%)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            placeholder="1.00"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Juros mora calculados pro-rata dia.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Card 2: Automação de Cobrança */}
                <Card className="rounded-[2rem] shadow-sm border-slate-100 overflow-hidden bg-white/50 backdrop-blur-sm">
                    <CardHeader className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-6 bg-[#FFBF00] rounded-full" />
                            <div className="flex items-center gap-2">
                                <div className="h-5 w-5 text-bee-amber">
                                    <CreditCard className="h-5 w-5" />
                                </div>
                                <CardTitle className="text-lg font-bold text-deep-midnight tracking-tight font-display">Automação de Cobrança</CardTitle>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="config_invoice_days_before"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Geração de Fatura</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="0"
                                            placeholder="10"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Gerar cobrança X dias antes do vencimento.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="config_currency"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Moeda Padrão</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled>
                                        <FormControl>
                                            <SelectTrigger className="h-10 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-lg focus:ring-1 focus:ring-bee-amber/20 transition-all hover:border-slate-200">
                                                <SelectValue placeholder="Selecione a moeda" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="BRL">BRL - Real Brasileiro</SelectItem>
                                            <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Sistema atualmente configurado para BRL.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Card 3: Régua de Cobrança (Notificações) */}
                <Card className="rounded-[2rem] shadow-sm border-slate-100 overflow-hidden bg-white/50 backdrop-blur-sm">
                    <CardHeader className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-6 bg-[#FFBF00] rounded-full" />
                            <div className="flex items-center gap-2">
                                <div className="h-5 w-5 text-bee-amber">
                                    <Bell className="h-5 w-5" />
                                </div>
                                <CardTitle className="text-lg font-bold text-deep-midnight tracking-tight font-display">Régua de Cobrança</CardTitle>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="config_notify_due_date"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Lembrete de Vencimento</FormLabel>
                                        <FormDescription>
                                            Enviar lembrete no dia do vencimento
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            className="data-[state=checked]:bg-bee-amber"
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="config_notify_overdue"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Aviso de Atraso</FormLabel>
                                        <FormDescription>
                                            Enviar cobrança se atrasar
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
                    </CardContent>
                </Card>

            </form>
        </Form>
    );
}
