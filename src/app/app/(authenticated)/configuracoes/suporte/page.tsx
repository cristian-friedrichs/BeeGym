'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    Search,
    MessageSquare,
    Clock,
    AlertCircle,
    CheckCircle2,
    Loader2,
    LifeBuoy
} from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { NovoTicketModal } from '@/components/app/configuracoes/NovoTicketModal';
import { TicketDetailsSheet } from '@/components/app/configuracoes/TicketDetailsSheet';
import { cn } from '@/lib/utils';

export default function SupportPage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState('Iniciando...');

    const fetchTickets = async () => {
        console.log('SupportPage: fetchTickets initiated');
        setLoading(true);
        setLoadingMessage('Verificando sua sessão...');

        // Safety timeout to prevent indefinite loading state
        const timeoutId = setTimeout(() => {
            if (loading) {
                console.warn('SupportPage: fetchTickets taking too long, forcing load finish');
                setLoadingMessage('O carregamento está demorando mais que o esperado. Tentando recuperar...');
            }
        }, 8000);

        try {
            // Use the singleton client if possible, or ensure we don't recreate excessively
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError || !user) {
                console.error('SupportPage: Auth error or no user:', userError);
                setLoadingMessage('Sessão não encontrada ou expirada. Por favor, faça login novamente.');
                setLoading(false);
                clearTimeout(timeoutId);
                return;
            }

            console.log('SupportPage: Authenticated as:', user.email);
            setLoadingMessage('Carregando perfil e permissões...');

            const isMasterAdmin = user.email === 'cristian_friedrichs@live.com';

            // Query profile
            const { data: profile, error: profileError } = await (supabase as any)
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profileError) {
                console.error('SupportPage: Profile fetch error:', profileError);
                // Continue if master admin, otherwise we might have issues
            }

            const role = (profile as any)?.role || null;
            setUserRole(role);

            const hasAccess = role === 'OWNER' || role === 'BEEGYM_ADMIN' || role === 'ADMIN' || isMasterAdmin;
            console.log('SupportPage: Access check:', { role, isMasterAdmin, hasAccess });

            if (!hasAccess) {
                console.warn('SupportPage: Restricted access for role:', role);
                setLoading(false);
                clearTimeout(timeoutId);
                return;
            }

            setLoadingMessage('Buscando seus tickets...');
            const { data, error } = await supabase
                .from('support_tickets')
                .select('*')
                .order('updated_at', { ascending: false });

            if (error) {
                console.error('SupportPage: Database error:', error);
                throw error;
            }

            console.log(`SupportPage: Successfully loaded ${data?.length || 0} tickets`);
            setTickets(data || []);
        } catch (error: any) {
            console.error('SupportPage: Critical fetch error:', error);
            setLoadingMessage(`Erro na conexão: ${error.message || 'Verifique sua internet'}`);
        } finally {
            clearTimeout(timeoutId);
            setLoading(false);
            console.log('SupportPage: fetchTickets completed');
        }
    };

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            if (isMounted) await fetchTickets();
        };

        load();

        return () => {
            isMounted = false;
        };
    }, []);

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
        switch (priority) {
            case 'high':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            case 'medium':
                return <AlertCircle className="h-4 w-4 text-bee-amber" />;
            default:
                return <AlertCircle className="h-4 w-4 text-blue-500" />;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col h-96 items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-bee-amber" />
                <p className="text-sm text-slate-500 animate-pulse">{loadingMessage}</p>
            </div>
        );
    }

    if (userRole !== 'OWNER' && userRole !== 'BEEGYM_ADMIN' && userRole !== 'ADMIN') {
        return (
            <Card className="rounded-[2.5rem] border-dashed border-2">
                <CardContent className="pt-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="p-4 bg-slate-50 rounded-full">
                        <LifeBuoy className="h-12 w-12 text-slate-300" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-lg font-bold text-deep-midnight">Acesso Restrito</h3>
                        <p className="text-slate-500 max-w-sm">
                            Sua função atual ({userRole || 'nenhuma'}) não permite gerenciar tickets de suporte.
                            Apenas proprietários da conta têm este acesso.
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
                subtitle="Acompanhe suas solicitações e histórico de suporte"
                action={
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-bee-amber hover:bg-amber-500 text-bee-midnight font-bold rounded-full gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-bee-amber/10 h-11 px-8 uppercase text-xs tracking-widest"
                    >
                        <Plus className="h-4 w-4" />
                        Novo Suporte
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
                                <p className="text-lg font-bold text-deep-midnight">Nenhum ticket encontrado</p>
                                <p className="text-sm text-slate-500 max-w-xs">
                                    Você ainda não abriu nenhum ticket de suporte. Clique no botão acima para começar.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    tickets.map((ticket) => (
                        <Card
                            key={ticket.id}
                            className="rounded-[2rem] group hover:border-bee-amber/30 transition-all cursor-pointer shadow-sm hover:shadow-md border-slate-100"
                            onClick={() => {
                                setSelectedTicket(ticket);
                                setIsSheetOpen(true);
                            }}
                        >
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-3 flex-1">
                                        <div className="flex items-center gap-2">
                                            {getStatusBadge(ticket.status)}
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">• Ticket #{ticket.id.slice(0, 8)}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-lg font-bold text-deep-midnight group-hover:text-bee-amber transition-colors">
                                                {ticket.subject}
                                            </h3>
                                            <p className="text-sm text-slate-500 line-clamp-1">
                                                {ticket.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 text-sm text-slate-400 font-medium whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            {getPriorityIcon(ticket.priority)}
                                            <span className="capitalize text-xs font-bold text-slate-500">{ticket.priority === 'high' ? 'Alta' : ticket.priority === 'medium' ? 'Média' : 'Baixa'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                            <Clock className="h-3 w-3" />
                                            {format(new Date(ticket.created_at), "dd 'de' MMM", { locale: ptBR })}
                                        </div>
                                        <Button variant="ghost" size="sm" className="rounded-full font-bold uppercase text-[10px] tracking-wider group-hover:bg-bee-amber/10 group-hover:text-bee-amber">
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
                onSuccess={fetchTickets}
            />

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
