'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    MessageSquare,
    Clock,
    AlertCircle,
    Loader2,
    LifeBuoy,
} from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { NovoTicketModal } from '@/components/app/configuracoes/NovoTicketModal';
import { TicketDetailsSheet } from '@/components/app/configuracoes/TicketDetailsSheet';
import { isOrgAdmin } from '@/lib/auth/role-checks';

export default function SupportPage() {
    const supabase = createClient();
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [orgId, setOrgId] = useState<string | null>(null);

    const fetchTickets = async (organizationId: string) => {
        const { data, error } = await (supabase as any)
            .from('support_tickets')
            .select('*')
            .eq('organization_id', organizationId)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('[Suporte] Erro ao buscar tickets:', error.message);
            return;
        }
        setTickets(data || []);
    };

    useEffect(() => {
        let mounted = true;

        async function init() {
            setLoading(true);
            try {
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                if (authError || !user || !mounted) return;

                const { data: profile, error: profileError } = await (supabase as any)
                    .from('profiles')
                    .select('role, organization_id')
                    .eq('id', user.id)
                    .single();

                if (profileError || !mounted) return;

                setUserRole(profile?.role ?? null);

                if (!isOrgAdmin(profile?.role)) return;

                const organization_id = profile?.organization_id;
                if (!organization_id) return;

                setOrgId(organization_id);
                await fetchTickets(organization_id);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        init();
        return () => { mounted = false; };
    }, []);

    const handleRefresh = () => {
        if (orgId) fetchTickets(orgId);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open':
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-bold uppercase text-[10px]">Aberto</Badge>;
            case 'in_progress':
                return <Badge className="bg-bee-amber/10 text-bee-amber hover:bg-bee-amber/10 border-none font-bold uppercase text-[10px]">Em Atendimento</Badge>;
            case 'resolved':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none font-bold uppercase text-[10px]">Resolvido</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getPriorityIcon = (priority: string) => {
        if (priority === 'high') return <AlertCircle className="h-4 w-4 text-red-500" />;
        if (priority === 'medium') return <AlertCircle className="h-4 w-4 text-bee-amber" />;
        return <AlertCircle className="h-4 w-4 text-blue-400" />;
    };

    const priorityLabel = (p: string) => p === 'high' ? 'Alta' : p === 'medium' ? 'Média' : 'Baixa';

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-bee-amber" />
            </div>
        );
    }

    if (!isOrgAdmin(userRole)) {
        return (
            <Card className="rounded-[2.5rem] border-dashed border-2">
                <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="p-4 bg-slate-50 rounded-full">
                        <LifeBuoy className="h-12 w-12 text-slate-300" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-lg font-bold text-deep-midnight">Acesso Restrito</h3>
                        <p className="text-slate-500 max-w-sm">
                            Apenas proprietários e administradores da conta podem acessar o suporte.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <SectionHeader
                title="Central de Suporte"
                subtitle="Acompanhe suas solicitações e histórico de atendimento"
                action={
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-bee-amber hover:bg-amber-500 text-bee-midnight font-bold rounded-full gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-bee-amber/10 h-11 px-8 uppercase text-xs tracking-widest"
                    >
                        <Plus className="h-4 w-4" />
                        Novo Chamado
                    </Button>
                }
            />

            <div className="grid gap-4">
                {tickets.length === 0 ? (
                    <Card className="rounded-[2.5rem] border-dashed border-2 border-slate-100">
                        <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="p-4 bg-bee-amber/10 rounded-full">
                                <MessageSquare className="h-10 w-10 text-bee-amber opacity-60" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-lg font-bold text-deep-midnight">Nenhum chamado encontrado</p>
                                <p className="text-sm text-slate-500 max-w-xs">
                                    Você ainda não abriu nenhum chamado. Clique em "Novo Chamado" para começar.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    tickets.map((ticket) => (
                        <Card
                            key={ticket.id}
                            className="rounded-[2rem] group hover:border-bee-amber/30 transition-all cursor-pointer shadow-sm hover:shadow-md border-slate-100"
                            onClick={() => { setSelectedTicket(ticket); setIsSheetOpen(true); }}
                        >
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {getStatusBadge(ticket.status)}
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                Ticket #{ticket.id.slice(0, 8)}
                                            </span>
                                        </div>
                                        <div className="space-y-0.5">
                                            <h3 className="text-base font-bold text-deep-midnight group-hover:text-bee-amber transition-colors">
                                                {ticket.subject}
                                            </h3>
                                            <p className="text-sm text-slate-500 line-clamp-1">{ticket.description}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-5 text-sm text-slate-400 font-medium whitespace-nowrap shrink-0">
                                        <div className="flex items-center gap-1.5">
                                            {getPriorityIcon(ticket.priority)}
                                            <span className="text-xs font-bold text-slate-500">{priorityLabel(ticket.priority)}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                            <Clock className="h-3 w-3" />
                                            {format(new Date(ticket.created_at), "dd 'de' MMM", { locale: ptBR })}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="rounded-full font-bold uppercase text-[10px] tracking-wider group-hover:bg-bee-amber/10 group-hover:text-bee-amber pointer-events-none"
                                        >
                                            Ver Detalhes
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <NovoTicketModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleRefresh}
            />

            <TicketDetailsSheet
                isOpen={isSheetOpen}
                ticket={selectedTicket}
                onClose={() => { setIsSheetOpen(false); setSelectedTicket(null); }}
                onUpdate={handleRefresh}
            />
        </div>
    );
}
