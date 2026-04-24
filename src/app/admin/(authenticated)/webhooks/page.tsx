'use client';

import { useState, useEffect } from 'react';
import { SectionHeader } from '@/components/ui/section-header';
import { getWebhookLogs } from '@/actions/admin-webhooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Play, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function WebhooksAdminPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    
    // Form State
    const [simEmail, setSimEmail] = useState('');
    const [simProduct, setSimProduct] = useState('BeeGym Starter');
    const [simEvent, setSimEvent] = useState('subscription_renewed');
    const [simToken, setSimToken] = useState('dczv229jm85');
    const [isSimulating, setIsSimulating] = useState(false);

    const fetchLogs = async () => {
        setLoadingLogs(true);
        const res = await getWebhookLogs();
        if (res.success) {
            setLogs(res.data);
        } else {
            toast.error('Erro ao buscar logs de webhook.');
        }
        setLoadingLogs(false);
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const handleSimulate = async () => {
        if (!simEmail) {
            toast.error('E-mail é obrigatório para a simulação.');
            return;
        }

        setIsSimulating(true);
        try {
            const res = await fetch('/api/webhooks/kiwify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: simEmail,
                    product_name: simProduct,
                    webhook_event: simEvent,
                    token: simToken,
                    status: 'simulated'
                })
            });

            const data = await res.json();
            
            if (res.ok) {
                toast.success('Webhook simulado com sucesso: ' + (data.message || 'Ativação concluída'));
                fetchLogs();
            } else {
                toast.error('Erro na simulação: ' + (data.error || 'Acesso Negado'));
            }
        } catch (err: any) {
            toast.error('Falha de conexão com a API.');
        }
        setIsSimulating(false);
    };

    return (
        <div className="space-y-6 pb-12">
            <SectionHeader
                title="Integração Kiwify"
                subtitle="Monitore e simule eventos de webhook de assinaturas (Kiwify)"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* SIMULADOR */}
                <Card className="lg:col-span-1 shadow-sm border-neutral-800 bg-neutral-900/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Play className="w-4 h-4 text-bee-amber" /> Simulador de Webhook
                        </CardTitle>
                        <CardDescription>Envie um payload fake para testar as regras.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>E-mail da Conta (Existente)</Label>
                            <Input 
                                placeholder="exemplo@beegym.com.br" 
                                value={simEmail}
                                onChange={e => setSimEmail(e.target.value)}
                                className="bg-neutral-950 border-neutral-800"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Produto</Label>
                            <Select value={simProduct} onValueChange={setSimProduct}>
                                <SelectTrigger className="bg-neutral-950 border-neutral-800">
                                    <SelectValue placeholder="Selecione o plano" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BeeGym Starter">BeeGym Starter (20 alunos)</SelectItem>
                                    <SelectItem value="BeeGym Plus">BeeGym Plus (40 alunos)</SelectItem>
                                    <SelectItem value="BeeGym Studio">BeeGym Studio (100 alunos)</SelectItem>
                                    <SelectItem value="BeeGym Pro">BeeGym Pro (500 alunos)</SelectItem>
                                    <SelectItem value="BeeGym Enterprise">BeeGym Enterprise (Ilimitado)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Evento</Label>
                            <Select value={simEvent} onValueChange={setSimEvent}>
                                <SelectTrigger className="bg-neutral-950 border-neutral-800">
                                    <SelectValue placeholder="Selecione o evento" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="subscription_renewed">Pagamento/Renovação (Ativar)</SelectItem>
                                    <SelectItem value="subscription_canceled">Cancelamento (Suspender)</SelectItem>
                                    <SelectItem value="subscription_late">Atraso (Inadimplente)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Token de Segurança</Label>
                            <Input 
                                value={simToken}
                                onChange={e => setSimToken(e.target.value)}
                                className="bg-neutral-950 border-neutral-800 font-mono text-xs"
                            />
                        </div>

                        <Button 
                            className="w-full bg-bee-amber text-black hover:bg-amber-500 font-bold"
                            onClick={handleSimulate}
                            disabled={isSimulating}
                        >
                            {isSimulating ? 'Disparando...' : 'Disparar Webhook Fake'}
                        </Button>
                    </CardContent>
                </Card>

                {/* LOGS */}
                <Card className="lg:col-span-2 shadow-sm border-neutral-800 bg-neutral-900/50">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                Auditoria de Logs
                            </CardTitle>
                            <CardDescription>Últimos 50 webhooks recebidos</CardDescription>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={fetchLogs} 
                            disabled={loadingLogs}
                            className="border-neutral-800 bg-neutral-950 hover:bg-neutral-800"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${loadingLogs ? 'animate-spin' : ''}`} />
                            Atualizar
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {logs.length === 0 ? (
                            <div className="text-center py-12 text-neutral-500 text-sm border border-dashed border-neutral-800 rounded-md">
                                Nenhum log de webhook encontrado ainda.
                            </div>
                        ) : (
                            <div className="relative overflow-x-auto rounded-md border border-neutral-800">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-neutral-950 text-neutral-400">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Data/Hora</th>
                                            <th className="px-4 py-3 font-medium">E-mail</th>
                                            <th className="px-4 py-3 font-medium">Evento</th>
                                            <th className="px-4 py-3 font-medium">Status API</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-800/50 bg-neutral-900/30">
                                        {logs.map((log) => {
                                            const isSuccessEvent = ['payment_approved', 'subscription_renewed', 'approved', 'paid'].includes(log.event_type);
                                            const isDeniedEvent = ['subscription_canceled', 'subscription_late', 'refunded', 'chargeback'].includes(log.event_type);

                                            return (
                                                <tr key={log.id} className="hover:bg-neutral-800/50 transition-colors">
                                                    <td className="px-4 py-3 whitespace-nowrap text-neutral-300">
                                                        {new Date(log.created_at).toLocaleString('pt-BR')}
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-white truncate max-w-[200px]" title={log.email}>
                                                        {log.email}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                            isSuccessEvent 
                                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                                                : isDeniedEvent 
                                                                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                                    : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                                                        }`}>
                                                            {log.event_type || 'Desconhecido'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {/* Token Validation Icon (Basic representation based on payload) */}
                                                        {log.payload?.token === 'dczv229jm85' ? (
                                                            <div className="flex items-center text-emerald-400 gap-1 text-xs">
                                                                <CheckCircle2 className="w-3 h-3" /> Permitido
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center text-red-400 gap-1 text-xs">
                                                                <ShieldAlert className="w-3 h-3" /> Negado
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
