'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SectionHeader } from '@/components/ui/section-header';
import { KpiCard } from '@/components/ui/kpi-card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    LifeBuoy, MoreHorizontal, Clock, CheckCircle2, Loader2,
    MessageSquare, AlertCircle, Search,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { TicketDetailsSheet } from '@/components/app/configuracoes/TicketDetailsSheet';
import { cn } from '@/lib/utils';

interface SupportTicket {
    id: string;
    status: 'open' | 'in_progress' | 'resolved';
    subject: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    created_at: string;
    updated_at: string;
    organization_id: string | null;
    user?: { full_name: string | null; email: string | null };
    organization?: { name: string | null };
}

const STATUS_LABELS: Record<string, string> = {
    open: 'Aberto',
    in_progress: 'Em Atendimento',
    resolved: 'Resolvido',
};

const PRIORITY_LABELS: Record<string, string> = {
    high: 'Alta',
    medium: 'Média',
    low: 'Baixa',
};

export default function AdminSupportPage() {
    const supabase = createClient();
    const { toast } = useToast();

    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [kpis, setKpis] = useState({ total: 0, open: 0, unresolved: 0 });

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from('support_tickets')
                .select(`
                    *,
                    user:profiles!support_tickets_user_id_fkey ( full_name, email ),
                    organization:organizations!support_tickets_organization_id_fkey ( name )
                `)
                .order('updated_at', { ascending: false });

            if (error) throw error;

            const all: SupportTicket[] = data || [];
            setTickets(all);
            setKpis({
                total: all.length,
                open: all.filter(t => t.status === 'open').length,
                unresolved: all.filter(t => t.status !== 'resolved').length,
            });
        } catch (err: any) {
            console.error('[Admin Suporte] Erro:', err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTickets(); }, []);

    const updateStatus = async (ticketId: string, newStatus: string) => {
        try {
            const { error } = await (supabase as any)
                .from('support_tickets')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', ticketId);

            if (error) throw error;

            toast({
                title: 'Status atualizado',
                description: `Ticket marcado como ${STATUS_LABELS[newStatus] ?? newStatus}.`,
                className: 'bg-green-600 text-white border-none',
            });
            fetchTickets();
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Erro ao atualizar', description: err.message });
        }
    };

    const getStatusBadge = (status: string) => {
        if (status === 'open') return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-bold uppercase text-[10px]">Aberto</Badge>;
        if (status === 'in_progress') return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none font-bold uppercase text-[10px]">Em Atendimento</Badge>;
        if (status === 'resolved') return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none font-bold uppercase text-[10px]">Resolvido</Badge>;
        return <Badge variant="outline">{status}</Badge>;
    };

    const filtered = tickets.filter(t => {
        const matchStatus = statusFilter === 'all' || t.status === statusFilter;
        const q = search.toLowerCase();
        const matchSearch = !q ||
            t.subject.toLowerCase().includes(q) ||
            (t.user?.full_name ?? '').toLowerCase().includes(q) ||
            (t.user?.email ?? '').toLowerCase().includes(q) ||
            (t.organization?.name ?? '').toLowerCase().includes(q);
        return matchStatus && matchSearch;
    });

    if (loading && tickets.length === 0) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-bee-amber" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-500">
            <SectionHeader
                title="Hub de Suporte"
                subtitle="Gerencie as solicitações dos clientes BeeGym"
            />

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KpiCard title="Total de Tickets" value={String(kpis.total)} color="default" icon={<LifeBuoy className="h-6 w-6" />} />
                <KpiCard title="Em Aberto" value={String(kpis.open)} color="amber" icon={<Clock className="h-6 w-6" />} />
                <KpiCard title="Pendentes" value={String(kpis.unresolved)} color="black" icon={<AlertCircle className="h-6 w-6" />} />
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[260px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Buscar por cliente, assunto ou organização..."
                        className="pl-10 h-11 rounded-2xl border-slate-100 bg-white shadow-sm"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48 h-11 rounded-2xl border-slate-100 bg-white shadow-sm font-bold text-slate-600">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                        <SelectItem value="all" className="rounded-xl font-bold">Todos os status</SelectItem>
                        <SelectItem value="open" className="rounded-xl font-bold text-blue-600">Aberto</SelectItem>
                        <SelectItem value="in_progress" className="rounded-xl font-bold text-orange-600">Em Atendimento</SelectItem>
                        <SelectItem value="resolved" className="rounded-xl font-bold text-green-600">Resolvido</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Tabela */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-slate-50 bg-slate-50/50">
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-12">Status</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-12">Cliente / Org</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-12">Assunto</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-12">Prioridade</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-12">Atualizado</TableHead>
                            <TableHead className="w-[50px] h-12" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-slate-400 font-medium">
                                    Nenhum ticket encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((ticket) => (
                                <TableRow
                                    key={ticket.id}
                                    className="group hover:bg-amber-50/30 border-slate-50 transition-colors cursor-pointer"
                                    onClick={() => { setSelectedTicket(ticket); setIsSheetOpen(true); }}
                                >
                                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-bee-midnight text-sm">{ticket.user?.full_name || '—'}</span>
                                            <span className="text-[11px] text-slate-400 font-medium">{ticket.organization?.name || ticket.user?.email || '—'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <p className="font-bold text-bee-midnight text-sm max-w-[220px] truncate">{ticket.subject}</p>
                                        <p className="text-xs text-slate-400 line-clamp-1">{ticket.description}</p>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn(
                                            "font-bold uppercase text-[10px] border-none",
                                            ticket.priority === 'high' ? "bg-red-50 text-red-600" :
                                                ticket.priority === 'medium' ? "bg-orange-50 text-orange-600" :
                                                    "bg-blue-50 text-blue-600"
                                        )}>
                                            {PRIORITY_LABELS[ticket.priority] ?? ticket.priority}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs font-medium text-slate-400">
                                        {format(new Date(ticket.updated_at || ticket.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                                    </TableCell>
                                    <TableCell onClick={e => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-bee-amber hover:bg-amber-50">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-52 rounded-2xl border-slate-100 shadow-xl p-2">
                                                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-slate-400 font-black px-3">Ações</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="rounded-xl font-bold gap-2 cursor-pointer"
                                                    onClick={() => { setSelectedTicket(ticket); setIsSheetOpen(true); }}
                                                >
                                                    <MessageSquare className="h-4 w-4 text-blue-500" />
                                                    Responder Cliente
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="rounded-xl font-bold gap-2 cursor-pointer"
                                                    onClick={() => updateStatus(ticket.id, 'in_progress')}
                                                    disabled={ticket.status === 'in_progress'}
                                                >
                                                    <Clock className="h-4 w-4 text-orange-500" />
                                                    Marcar em Atendimento
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="rounded-xl font-bold gap-2 cursor-pointer"
                                                    onClick={() => updateStatus(ticket.id, 'resolved')}
                                                    disabled={ticket.status === 'resolved'}
                                                >
                                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                    Marcar como Resolvido
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="rounded-xl font-bold gap-2 cursor-pointer"
                                                    onClick={() => updateStatus(ticket.id, 'open')}
                                                    disabled={ticket.status === 'open'}
                                                >
                                                    <LifeBuoy className="h-4 w-4 text-slate-400" />
                                                    Reabrir Ticket
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                <div className="px-6 py-4 border-t border-slate-50 bg-slate-50/20 text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-bee-amber animate-pulse" />
                    {filtered.length} ticket{filtered.length !== 1 ? 's' : ''} {statusFilter !== 'all' ? `· filtro: ${STATUS_LABELS[statusFilter]}` : ''}
                </div>
            </div>

            <TicketDetailsSheet
                isOpen={isSheetOpen}
                ticket={selectedTicket}
                onClose={() => { setIsSheetOpen(false); setSelectedTicket(null); }}
                onUpdate={fetchTickets}
            />
        </div>
    );
}
