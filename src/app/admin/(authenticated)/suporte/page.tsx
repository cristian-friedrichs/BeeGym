'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SectionHeader } from '@/components/ui/section-header';
import { KpiCard } from '@/components/ui/kpi-card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    LifeBuoy,
    MoreHorizontal,
    Clock,
    CheckCircle2,
    Loader2,
    MessageSquare,
    AlertCircle,
    Filter,
    Check
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
    user?: {
        full_name: string | null;
        email: string | null;
    };
}

export default function AdminSupportPage() {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [kpis, setKpis] = useState({
        total: 0,
        open: 0,
        unresolved: 0
    });
    const { toast } = useToast();
    const supabase = createClient();

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('support_tickets')
                .select(`
          *,
          user:profiles (
            full_name,
            email
          )
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const ticketsData = data || [];
            setTickets(ticketsData);

            // Calculate KPIs
            setKpis({
                total: ticketsData.length,
                open: ticketsData.filter((t: SupportTicket) => t.status === 'open').length,
                unresolved: ticketsData.filter((t: SupportTicket) => t.status !== 'resolved').length
            });

        } catch (error) {
            console.error('Erro ao buscar tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const updateTicketStatus = async (ticketId: string, newStatus: string) => {
        try {
            const { error } = await (supabase as any)
                .from('support_tickets')
                .update({ status: newStatus })
                .eq('id', ticketId);

            if (error) throw error;

            toast({
                title: 'Status Atualizado',
                description: `O ticket foi marcado como ${newStatus === 'resolved' ? 'Resolvido' : newStatus === 'in_progress' ? 'Em Atendimento' : 'Aberto'}.`,
                className: 'bg-green-600 text-white border-none',
            });

            fetchTickets();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Erro ao atualizar status',
                description: error.message,
            });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open':
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-bold uppercase text-[10px]">Aberto</Badge>;
            case 'in_progress':
                return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none font-bold uppercase text-[10px]">Em Atendimento</Badge>;
            case 'resolved':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none font-bold uppercase text-[10px]">Resolvido</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (loading && tickets.length === 0) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#FFBF00]" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-500">
            <SectionHeader
                title="Hub de Suporte"
                subtitle="Gerencie as solicitações e dúvidas dos clientes da BeeGym."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KpiCard
                    title="Total de Tickets"
                    value={String(kpis.total)}
                    color="default"
                    icon={<LifeBuoy className="h-6 w-6" />}
                />
                <KpiCard
                    title="Em Aberto"
                    value={String(kpis.open)}
                    color="amber"
                    icon={<Clock className="h-6 w-6" />}
                />
                <KpiCard
                    title="Pendentes de Solução"
                    value={String(kpis.unresolved)}
                    color="black"
                    icon={<AlertCircle className="h-6 w-6" />}
                />
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-bold text-deep-midnight">Lista de Tickets</h3>
                    <Button variant="outline" size="sm" className="rounded-full gap-2">
                        <Filter className="h-4 w-4" />
                        Filtrar
                    </Button>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-slate-50">
                            <TableHead className="w-[100px] font-bold">Status</TableHead>
                            <TableHead className="font-bold">Cliente</TableHead>
                            <TableHead className="font-bold">Assunto</TableHead>
                            <TableHead className="font-bold">Prioridade</TableHead>
                            <TableHead className="font-bold">Data</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tickets.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-slate-500 font-medium">
                                    Nenhum ticket encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            tickets.map((ticket) => (
                                <TableRow
                                    key={ticket.id}
                                    className="group hover:bg-slate-50/50 border-slate-50 transition-colors cursor-pointer"
                                    onClick={() => {
                                        setSelectedTicket(ticket);
                                        setIsSheetOpen(true);
                                    }}
                                >
                                    <TableCell>
                                        {getStatusBadge(ticket.status)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-deep-midnight">{ticket.user?.full_name || 'Usuário'}</span>
                                            <span className="text-xs text-slate-400 font-medium">{ticket.user?.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <p className="font-bold text-deep-midnight max-w-[200px] truncate">{ticket.subject}</p>
                                        <p className="text-xs text-slate-400 line-clamp-1">{ticket.description}</p>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn(
                                            "font-bold uppercase text-[10px] border-none",
                                            ticket.priority === 'high' ? "bg-red-50 text-red-600" :
                                                ticket.priority === 'medium' ? "bg-orange-50 text-orange-600" :
                                                    "bg-blue-50 text-blue-600"
                                        )}>
                                            {ticket.priority === 'high' ? 'Alta' : ticket.priority === 'medium' ? 'Média' : 'Baixa'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm font-medium text-slate-500">
                                        {format(new Date(ticket.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56">
                                                <DropdownMenuLabel>Ações do Ticket</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => updateTicketStatus(ticket.id, 'in_progress')}>
                                                    <Clock className="mr-2 h-4 w-4" />
                                                    Marcar em Atendimento
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => updateTicketStatus(ticket.id, 'resolved')}>
                                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                                    Marcar como Resolvido
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => updateTicketStatus(ticket.id, 'open')}>
                                                    <LifeBuoy className="mr-2 h-4 w-4" />
                                                    Reabrir Ticket
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedTicket(ticket);
                                                    setIsSheetOpen(true);
                                                }} className="text-blue-600 font-bold">
                                                    <MessageSquare className="mr-2 h-4 w-4" />
                                                    Responder Cliente
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <TicketDetailsSheet
                isOpen={isSheetOpen}
                ticket={selectedTicket}
                onClose={() => {
                    setIsSheetOpen(false);
                    setSelectedTicket(null);
                }}
                onUpdate={fetchTickets}
            />
        </div>
    );
}
