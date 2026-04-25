'use client';

import { useState, useEffect } from 'react';
import { SectionHeader } from '@/components/ui/section-header';
import { getWebhookLogs, getValidWebhookEmails } from '@/actions/admin-webhooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Play, ShieldAlert, CheckCircle2, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function WebhooksAdminPage() {
    const { toast } = useToast();
    const [logs, setLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    
    // Form State
    const [simEmail, setSimEmail] = useState('');
    const [simProduct, setSimProduct] = useState('BeeGym Starter');
    const [simEvent, setSimEvent] = useState('subscription_renewed');
    const [simToken, setSimToken] = useState('dczv229jm85');
    const [isSimulating, setIsSimulating] = useState(false);
    const [validEmails, setValidEmails] = useState<{email: string | null, full_name: string | null}[]>([]);
    const [loadingEmails, setLoadingEmails] = useState(false);

    const fetchLogs = async () => {
        setLoadingLogs(true);
        const res = await getWebhookLogs();
        if (res.success) {
            setLogs(res.data);
        } else {
            toast({
                title: 'Erro',
                description: 'Erro ao buscar logs de webhook.',
                variant: 'destructive',
            });
        }
        setLoadingLogs(false);
    };

    const fetchValidEmails = async () => {
        setLoadingEmails(true);
        const res = await getValidWebhookEmails();
        if (res.success) {
            setValidEmails(res.data || []);
        }
        setLoadingEmails(false);
    };

    useEffect(() => {
        fetchLogs();
        fetchValidEmails();
    }, []);

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
        try {
            // A Kiwify agora espera o token na URL e payload aninhado
            const res = await fetch(`/api/webhooks/kiwify?token=${simToken}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    Customer: {
                        email: simEmail
                    },
                    Product: {
                        product_name: simProduct
                    },
                    webhook_event_type: simEvent,
                    order_status: simEvent === 'subscription_canceled' ? 'refused' : 'paid',
                    status: 'simulated'
                })
            });

            const data = await res.json();
            
            if (res.ok) {
                toast({
                    title: 'Sucesso',
                    description: 'Webhook simulado com sucesso: ' + (data.message || 'Ativação concluída'),
                });
                fetchLogs();
            } else {
                toast({
                    title: 'Erro',
                    description: 'Erro na simulação: ' + (data.error || 'Acesso Negado'),
                    variant: 'destructive',
                });
            }
        } catch (err: any) {
            toast({
                title: 'Erro',
                description: 'Falha de conexão com a API.',
                variant: 'destructive',
            });
        }
        setIsSimulating(false);
    };

    return (
        <div className="space-y-6 pb-12 relative">
            {/* Efeito de Glow de Fundo */}
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
                        <RefreshCw className={cn("w-4 h-4 mr-2", loadingLogs && "animate-spin")} />
                        Atualizar Logs
                    </Button>
                }
            />

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
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">E-mail da Conta</Label>
                            <Input 
                                placeholder="exemplo@beegym.com.br" 
                                value={simEmail}
                                onChange={e => setSimEmail(e.target.value)}
                                className="h-12 rounded-2xl border-slate-200 focus-visible:ring-bee-amber/10 focus-visible:border-bee-amber shadow-sm font-medium"
                            />
                            
                            {validEmails.length > 0 && (
                                <div className="mt-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Contas Disponíveis (Profiles)</p>
                                    <div className="flex flex-wrap gap-2">
                                        {validEmails.slice(0, 5).map((acc) => (
                                            <button
                                                key={acc.email ?? ''}
                                                onClick={() => setSimEmail(acc.email ?? '')}
                                                className={cn(
                                                    "text-[10px] font-bold px-3 py-1.5 rounded-xl border transition-all active:scale-95",
                                                    simEmail === acc.email 
                                                        ? "bg-bee-amber border-bee-amber text-bee-midnight" 
                                                        : "bg-white border-slate-200 text-slate-500 hover:border-bee-amber/30"
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
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Plano Selecionado</Label>
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
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Evento do Webhook</Label>
                            <Select value={simEvent} onValueChange={setSimEvent}>
                                <SelectTrigger className="h-12 rounded-2xl border-slate-200 focus:ring-bee-amber/10 focus:border-bee-amber shadow-sm font-medium text-left">
                                    <SelectValue placeholder="Selecione o evento" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                                    <SelectItem value="subscription_renewed">Pagamento/Renovação (Ativar)</SelectItem>
                                    <SelectItem value="subscription_canceled">Cancelamento (Suspender)</SelectItem>
                                    <SelectItem value="subscription_late">Atraso (Inadimplente)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Token de Segurança</Label>
                            <Input 
                                value={simToken}
                                onChange={e => setSimToken(e.target.value)}
                                className="h-12 rounded-2xl border-slate-200 font-mono text-[11px] bg-slate-50/50 shadow-inner"
                                readOnly
                            />
                        </div>

                        <Button 
                            className="w-full h-14 rounded-2xl bg-bee-amber text-bee-midnight hover:bg-amber-500 font-black uppercase tracking-widest text-[11px] shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98] mt-2 gap-2 border-none"
                            onClick={handleSimulate}
                            disabled={isSimulating}
                        >
                            {isSimulating ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Play className="w-4 h-4" />
                            )}
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
                                            const isSuccessEvent = ['payment_approved', 'subscription_renewed', 'approved', 'paid'].includes(log.event_type);
                                            const isDeniedEvent = ['subscription_canceled', 'subscription_late', 'refunded', 'chargeback'].includes(log.event_type);

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
                                                        <span className={cn(
                                                            "inline-flex items-center px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest",
                                                            isSuccessEvent 
                                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                                                : isDeniedEvent 
                                                                    ? 'bg-red-50 text-red-600 border border-red-100'
                                                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                                                        )}>
                                                            {log.event_type || 'Desconhecido'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="px-6 text-right">
                                                        {log.event_type === 'auth_failed' ? (
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
