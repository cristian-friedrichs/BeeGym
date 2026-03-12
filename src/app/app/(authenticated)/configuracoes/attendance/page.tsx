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
import { Loader2, Save, Calendar, AlertCircle, TrendingUp } from 'lucide-react';
import { getFrequencySettingsAction, updateFrequencySettingsAction } from '@/actions/attendance';
import { SectionHeader } from '@/components/ui/section-header';

const frequencySchema = z.object({
    config_min_presence_pct: z.coerce.number().min(0).max(100),
    config_late_checkin_policy: z.enum(['tolerant', 'warn', 'strict']),
    config_cancellation_window_minutes: z.coerce.number().min(0),
    config_max_absences_month: z.coerce.number().min(0),
    config_absence_penalty_action: z.enum(['warning', 'block', 'fine']),
    config_churn_days: z.coerce.number().min(1),
    config_notify_churn: z.boolean(),
});

type FrequencyFormValues = z.infer<typeof frequencySchema>;

export default function AttendanceSettingsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<FrequencyFormValues>({
        resolver: zodResolver(frequencySchema),
        defaultValues: {
            config_min_presence_pct: 75,
            config_late_checkin_policy: 'tolerant',
            config_cancellation_window_minutes: 120,
            config_max_absences_month: 3,
            config_absence_penalty_action: 'warning',
            config_churn_days: 14,
            config_notify_churn: true,
        },
    });

    useEffect(() => {
        async function loadSettings() {
            const result = await getFrequencySettingsAction();
            if (result.success && result.data) {
                form.reset(result.data);
            }
            setIsLoading(false);
        }
        loadSettings();
    }, [form]);

    async function onSubmit(values: FrequencyFormValues) {
        setIsSaving(true);
        const result = await updateFrequencySettingsAction(values);

        if (result.success) {
            toast({
                title: 'Configurações salvas',
                description: 'As regras de frequência foram atualizadas com sucesso.',
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex-1 p-4 md:p-8 pt-6">
                <SectionHeader
                    title="Regras de Frequência"
                    subtitle="Configure as políticas de presença, cancelamento e retenção de alunos"
                    action={
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="bg-bee-amber hover:bg-amber-500 text-bee-midnight font-bold h-11 px-8 rounded-full shadow-lg shadow-bee-amber/20 transition-all hover:scale-[1.02] active:scale-[0.98] text-[13px] uppercase tracking-wider"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
                {/* Card 1: Política de Presença e Cancelamento */}
                <Card className="rounded-[2rem] shadow-sm border-slate-100 overflow-hidden bg-white/50 backdrop-blur-sm">
                    <CardHeader className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-6 bg-[#FFBF00] rounded-full" />
                            <div className="flex items-center gap-2">
                                <div className="h-5 w-5 text-bee-amber">
                                    <Calendar className="h-5 w-5" />
                                </div>
                                <CardTitle className="text-lg font-bold text-deep-midnight tracking-tight font-display">Presença & Cancelamento</CardTitle>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="config_min_presence_pct"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tempo Mínimo de Permanência (%)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            placeholder="75"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Percentual mínimo da aula que o aluno deve permanecer para contar presença.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="config_late_checkin_policy"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Política para Check-in Tardio</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-10 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-lg focus:ring-1 focus:ring-bee-amber/20 transition-all hover:border-slate-200">
                                                <SelectValue placeholder="Selecione a política" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="tolerant">Permitir normalmente</SelectItem>
                                            <SelectItem value="warn">Avisar na recepção</SelectItem>
                                            <SelectItem value="strict">Bloquear entrada</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="config_cancellation_window_minutes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Janela de Cancelamento (minutos)</FormLabel>
                                    <Select
                                        onValueChange={(value) => field.onChange(parseInt(value))}
                                        defaultValue={field.value?.toString()}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="h-10 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-lg focus:ring-1 focus:ring-bee-amber/20 transition-all hover:border-slate-200">
                                                <SelectValue placeholder="Selecione o prazo" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="60">1 hora antes</SelectItem>
                                            <SelectItem value="120">2 horas antes</SelectItem>
                                            <SelectItem value="240">4 horas antes</SelectItem>
                                            <SelectItem value="720">12 horas antes</SelectItem>
                                            <SelectItem value="1440">24 horas antes</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Tempo limite para o aluno cancelar sem levar falta.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Card 2: Faltas e Penalidades */}
                <Card className="rounded-[2rem] shadow-sm border-slate-100 overflow-hidden bg-white/50 backdrop-blur-sm">
                    <CardHeader className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-6 bg-[#FFBF00] rounded-full" />
                            <div className="flex items-center gap-2">
                                <div className="h-5 w-5 text-bee-amber">
                                    <AlertCircle className="h-5 w-5" />
                                </div>
                                <CardTitle className="text-lg font-bold text-deep-midnight tracking-tight font-display">Faltas & Penalidades</CardTitle>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="config_absence_penalty_action"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Penalidade por Acúmulo</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-10 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-lg focus:ring-1 focus:ring-bee-amber/20 transition-all hover:border-slate-200">
                                                <SelectValue placeholder="Selecione a penalidade" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="warning">Apenas Advertência</SelectItem>
                                            <SelectItem value="block">Bloquear Novos Agendamentos</SelectItem>
                                            <SelectItem value="fine">Cobrar Multa</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="config_max_absences_month"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Gatilho da Penalidade</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="0"
                                            placeholder="3"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Número de faltas em 30 dias que acionam a penalidade.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Card 3: Alertas Automáticos (Retenção) */}
                <Card className="rounded-[2rem] shadow-sm border-slate-100 overflow-hidden bg-white/50 backdrop-blur-sm">
                    <CardHeader className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-6 bg-[#FFBF00] rounded-full" />
                            <div className="flex items-center gap-2">
                                <div className="h-5 w-5 text-bee-amber">
                                    <TrendingUp className="h-5 w-5" />
                                </div>
                                <CardTitle className="text-lg font-bold text-deep-midnight tracking-tight font-display">Retenção de Alunos</CardTitle>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="config_churn_days"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Risco de Evasão (Churn)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="1"
                                            placeholder="14"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Alertar quando aluno estiver inativo por esse número de dias.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="config_notify_churn"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Notificações</FormLabel>
                                        <FormDescription>
                                            Notificar instrutor sobre queda de frequência
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
                    </CardContent>
                </Card>

            </form>
        </Form>
    );
}
