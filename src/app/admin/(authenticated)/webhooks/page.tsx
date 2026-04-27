'use client';

import { useState, useEffect } from 'react';
import { SectionHeader } from '@/components/ui/section-header';
import {
    getWebhookLogs,
    getValidWebhookEmails,
    getKiwifyWebhookConfig,
    simulateKiwifyWebhook,
} from '@/actions/admin-webhooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Play, ShieldAlert, CheckCircle2, History, Copy, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type SimEvent =
    | 'assinatura aprovada'
    | 'assinatura renovada'
    | 'assinatura cancelada'
    | 'assinatura atrasada';

export default function WebhooksAdminPage() {
    const { toast } = useToast();
    const [logs, setLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    // Webhook config
    const [config, setConfig] = useState<{
        baseUrl: string;
        url: string;
        tokenConfigured: boolean;
        tokenMasked: string;
    } | null>(null);

    // Form State
    const [simEmail, setSimEmail] = useState('');
    const [simProduct, setSimProduct] = useState('BeeGym Starter');
    const [simEvent, setSimEvent] = useState<SimEvent>('assinatura renovada');
    const [isSimulating, setIsSimulating] = useState(false);
    const [validEmails, setValidEmails] = useState<{ email: string | null; full_name: string | null }[]>([]);

    const fetchLogs = async () => {
        setLoadingLogs(true);
        const res = await getWebhookLogs();
        if (res.success) {
            setLogs(res.data);
        } else {
            toast({
                title: 'Erro',
                description: (res as any).error || 'Erro ao buscar logs de webhook.',
                variant: 'destructive',
            });
        }
        setLoadingLogs(false);
    };

    const fetchValidEmails = async () => {
        const res = await getValidWebhookEmails();
        if (res.success) setValidEmails(res.data || []);
    };

    const fetchConfig = async () => {
        const res = await getKiwifyWebhookConfig();
        if (res.success) {
            setConfig({
                baseUrl: res.baseUrl,
                url: res.url,
                tokenConfigured: res.tokenConfigured,
                tokenMasked: res.tokenMasked,
            });
        } else {
            toast({
                title: 'Erro',
                description: (res as any).error || 'Erro ao carregar config do webhook.',
                variant: 'destructive',
            });
        }
    };

    useEffect(() => {
        fetchLogs();
        fetchValidEmails();
        fetchConfig();
    }, []);

    const handleCopy = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast({ title: 'Copiado', description: `${label} copiado para a área de transferência.` });
        } catch {
            toast({ title: 'Erro', description: 'Falha ao copiar.', variant: 'destructive' });
        }
    };

    const handleSimulate = async () => {
        if (!simEmail) {
            toast({
                title: 'Atenção',
                description: 'E-mail é obrigatório para a simulação.',
                variant: 'destructive',
            });
            return;
        }

        setIsSimulating(true);
        const res = await simulateKiwifyWebhook({
            email: simEmail,
            produto: simProduct,
            evento: simEvent,
        });

        if (res.success) {
            toast({
                title: 'Sucesso',
                description: (res.data as any)?.message || 'Webhook simulado com sucesso.',
            });
            fetchLogs();
        } else {
            toast({
                title: 'Erro',
                description: (res as any).error || 'Erro na simulação.',
                variant: 'destructive',
            });
        }
        setIsSimulating(false);
    };

    return (
        <div className="space-y-6 pb-12 relative">
            <div className="absolute -top-12 -left-12 w-96 h-96 bg-amber-50 rounded-full blur-[100px] opacity-40 pointer-events-none -z-10" />
            <div className="absolute top-1/2 -right-12 w-64 h-64 bg-slate-50 rounded-full blur-[80px] opacity-30 pointer-events-none -z-10" />

            <SectionHeader
                title="Integração Kiwify"
                subtitle="Monitore e simule eventos de webhook de assinaturas (Kiwify)"
                action={
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchLogs}
                        disabled={loadingLogs}
                        className="border-slate-200 bg-white hover:bg-slate-50 text-slate-500 font-bold rounded-xl h-10 px-4 transition-all active:scale-95"
                    >
                        <RefreshCw className={cn('w-4 h-4 mr-2', loadingLogs && 'animate-spin')} />
                        Atualizar Logs
                    </Button>
                }
            />

            {/* CONFIG CARD - URL DO WEBHOOK */}
            <Card className="rounded-[2.5rem] border-slate-100 bg-white shadow-2xl shadow-slate-200/50 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-50/30 to-transparent pointer-events-none" />
                <CardHeader className="relative">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-1.5 h-6 bg-bee-amber rounded-full" />
                        <CardTitle className="text-xl font-black text-bee-midnight tracking-tight">
                            URL para configurar na Kiwify
                        </CardTitle>
                    </div>
                    <CardDescription className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-4">
                        Cole esta URL no painel da Kiwify (Apps → Webhooks)
                    </CardDescription>
                </CardHeader>
                <CardContent className="relative space-y-4">
                    {config ? (
                        <>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                    URL completa (com token)
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={config.url}
                                        readOnly
                                        className="h-12 rounded-2xl border-slate-200 font-mono text-[11px] bg-slate-50/50 shadow-inner"
                                    />
                                    <Button
                                        variant="outline"
                                        className="h-12 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 text-slate-500 font-bold px-4 transition-all active:scale-95"
                                        onClick={() => handleCopy(config.url, 'URL')}
                                    >
                                        <Copy className="w-4 h-4 mr-2" /> Copiar
                                    </Button>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 pl-1">
                                <span
                                    className={cn(
                                        'inline-flex items-center px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border gap-1.5',
                                        config.tokenConfigured
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            : 'bg-red-50 text-red-600 border-red-100',
                                    )}
                                >
                                    <LinkIcon className="w-3 h-3" />
                                    Token: {config.tokenMasked}
                                </span>
                                {!config.tokenConfigured && (
                                    <span className="text-[11px] font-bold text-red-600">
                                        Configure a env var <code>KIWIFY_TOKEN</code> antes de receber webhooks.
                                    </span>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="text-[11px] font-bold text-slate-400">Carregando configuração...</div>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* SIMULADOR */}
                <Card className="lg:col-span-4 rounded-[2.5rem] border-slate-100 bg-white shadow-2xl shadow-slate-200/50 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-50/30 to-transparent pointer-events-none" />
                    <CardHeader className="relative">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-1.5 h-6 bg-bee-amber rounded-full" />
                            <CardTitle className="text-xl font-black text-bee-midnight tracking-tight">
                                Simulador
                            </CardTitle>
                        </div>
                        <CardDescription className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-4">
                            Teste as regras de automação
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5 relative">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                E-mail da Conta
                            </Label>
                            <Input
                                placeholder="exemplo@beegym.com.br"
                                value={simEmail}
                                onChange={(e) => setSimEmail(e.target.value)}
                                className="h-12 rounded-2xl border-slate-200 focus-visible:ring-bee-amber/10 focus-visible:border-bee-amber shadow-sm font-medium"
                            />

                            {validEmails.length > 0 && (
                                <div className="mt-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                                        Contas Disponíveis (Profiles)
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {validEmails.slice(0, 10).map((acc) => (
                                            <button
                                                key={acc.email ?? ''}
                                                onClick={() => setSimEmail(acc.email ?? '')}
                                                className={cn(
                                                    'text-[10px] font-bold px-3 py-1.5 rounded-xl border transition-all active:scale-95',
                                                    simEmail === acc.email
                                                        ? 'bg-bee-amber border-bee-amber text-bee-midnight'
                                                        : 'bg-white border-slate-200 text-slate-500 hover:border-bee-amber/30',
                                                )}
                                                title={acc.full_name ?? ''}
                                            >
                                                {(acc.email ?? '').split('@')[0]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                Plano Selecionado
                            </Label>
                            <Select value={simProduct} onValueChange={setSimProduct}>
                                <SelectTrigger className="h-12 rounded-2xl border-slate-200 focus:ring-bee-amber/10 focus:border-bee-amber shadow-sm font-medium text-left">
                                    <SelectValue placeholder="Selecione o plano" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                                    <SelectItem value="BeeGym Starter">BeeGym Starter (20 alunos)</SelectItem>
                                    <SelectItem value="BeeGym Plus">BeeGym Plus (40 alunos)</SelectItem>
                                    <SelectItem value="BeeGym Studio">BeeGym Studio (100 alunos)</SelectItem>
                                    <SelectItem value="BeeGym Pro">BeeGym Pro (500 alunos)</SelectItem>
                                    <SelectItem value="BeeGym Enterprise">BeeGym Enterprise (Ilimitado)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                Evento do Webhook
                            </Label>
                            <Select value={simEvent} onValueChange={(v) => setSimEvent(v as SimEvent)}>
                                <SelectTrigger className="h-12 rounded-2xl border-slate-200 focus:ring-bee-amber/10 focus:border-bee-amber shadow-sm font-medium text-left">
                                    <SelectValue placeholder="Selecione o evento" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                                    <SelectItem value="assinatura renovada">Assinatura renovada (Ativar)</SelectItem>
                                    <SelectItem value="assinatura aprovada">Assinatura aprovada (Ativar)</SelectItem>
                                    <SelectItem value="assinatura cancelada">Assinatura cancelada (Suspender)</SelectItem>
                                    <SelectItem value="assinatura atrasada">Assinatura atrasada (Inadimplente)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <p className="text-[10px] text-slate-400 leading-relaxed">
                            O token nunca é enviado pelo navegador. A simulação roda no servidor com o
                            <code className="mx-1 px-1 py-0.5 bg-slate-100 rounded">KIWIFY_TOKEN</code>
                            configurado em variáveis de ambiente.
                        </p>

                        <Button
                            className="w-full h-14 rounded-2xl bg-bee-amber text-bee-midnight hover:bg-amber-500 font-black uppercase tracking-widest text-[11px] shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98] mt-2 gap-2 border-none"
                            onClick={handleSimulate}
                            disabled={isSimulating}
                        >
                            {isSimulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                            {isSimulating ? 'Processando...' : 'Simular Evento'}
                        </Button>
                    </CardContent>
                </Card>

                {/* LOGS */}
                <Card className="lg:col-span-8 rounded-[2.5rem] border-slate-100 bg-white shadow-2xl shadow-slate-200/50 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-50/30 to-transparent pointer-events-none" />
                    <CardHeader className="relative">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-slate-200 rounded-full" />
                            <CardTitle className="text-xl font-black text-bee-midnight tracking-tight">
                                Auditoria de Logs
                            </CardTitle>
                        </div>
                        <CardDescription className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-4">
                            Histórico de recepção da Kiwify
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="relative">
                        {logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-300 border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/30">
                                <History className="w-12 h-12 mb-4 opacity-20" />
                                <p className="text-sm font-black uppercase tracking-widest">Nenhum log disponível</p>
                                <p className="text-[11px] font-bold mt-1">Aguardando primeiro evento da Kiwify...</p>
                            </div>
                        ) : (
                            <div className="rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/50 border-b-slate-100 hover:bg-slate-50/50">
                                            <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400 h-12 px-6">Data / Hora</TableHead>
                                            <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400 h-12">E-mail do Cliente</TableHead>
                                            <th className="font-black text-[9px] uppercase tracking-widest text-slate-400 h-12 text-center">Evento</th>
                                            <th className="font-black text-[9px] uppercase tracking-widest text-slate-400 h-12 text-right px-6">Autenticação</th>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {logs.map((log) => {
                                            const isSuccessEvent = ['payment_approved', 'subscription_renewed', 'order_approved', 'approved', 'paid'].includes(log.event_type);
                                            const isDeniedEvent = ['subscription_canceled', 'subscription_late', 'order_refunded', 'chargeback', 'order_rejected'].includes(log.event_type);
                                            const isAuthFailed = log.event_type === 'auth_failed';

                                            return (
                                                <TableRow key={log.id} className="hover:bg-amber-50/30 transition-colors border-b-slate-50 group/row">
                                                    <TableCell className="px-6 py-4">
                                                        <span className="text-[11px] font-bold text-slate-400">
                                                            {new Date(log.created_at).toLocaleString('pt-BR')}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <p className="text-xs font-black text-bee-midnight truncate max-w-[220px]" title={log.email}>
                                                                {log.email}
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span
                                                            className={cn(
                                                                'inline-flex items-center px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest',
                                                                isSuccessEvent
                                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                                    : isDeniedEvent
                                                                      ? 'bg-red-50 text-red-600 border border-red-100'
                                                                      : 'bg-slate-100 text-slate-500 border border-slate-200',
                                                            )}
                                                        >
                                                            {log.event_type || 'Desconhecido'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="px-6 text-right">
                                                        {isAuthFailed ? (
                                                            <div className="inline-flex items-center text-red-500 bg-red-50/50 px-3 py-1.5 rounded-xl border border-red-100/50 gap-1.5 font-black text-[9px] uppercase tracking-widest">
                                                                <ShieldAlert className="w-3 h-3" /> FALHOU
                                                            </div>
                                                        ) : (
                                                            <div className="inline-flex items-center text-emerald-500 bg-emerald-50/50 px-3 py-1.5 rounded-xl border border-emerald-100/50 gap-1.5 font-black text-[9px] uppercase tracking-widest">
                                                                <CheckCircle2 className="w-3 h-3" /> OK
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
