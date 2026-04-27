'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Send, Clock, LifeBuoy, Paperclip, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { isSuperAdmin, isOrgAdmin } from '@/lib/auth/role-checks';

interface TicketDetailsSheetProps {
    ticket: any;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export function TicketDetailsSheet({ ticket, isOpen, onClose, onUpdate }: TicketDetailsSheetProps) {
    const supabase = createClient();
    const { toast } = useToast();

    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchMessages = async () => {
        if (!ticket) return;
        setLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from('support_messages')
                .select(`*, sender:profiles!support_messages_sender_id_fkey ( full_name, avatar_url, role )`)
                .eq('ticket_id', ticket.id)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMessages(data || []);
            setTimeout(scrollToBottom, 100);
        } catch (err) {
            console.error('[TicketDetailsSheet] fetchMessages:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isOpen || !ticket) return;

        // Fetch current user role to know how to label this sender
        const resolveRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: profile } = await (supabase as any)
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();
            setCurrentUserRole(profile?.role ?? null);
        };

        resolveRole();
        fetchMessages();
    }, [isOpen, ticket]);

    const handleSendMessage = async () => {
        const msg = newMessage.trim();
        if (!msg || !ticket) return;
        if (msg.length > 2000) {
            toast({ variant: 'destructive', title: 'Mensagem muito longa', description: 'Máximo de 2000 caracteres.' });
            return;
        }

        setIsSending(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Não autenticado');

            // Insert message
            const { error: msgError } = await (supabase as any)
                .from('support_messages')
                .insert({ ticket_id: ticket.id, sender_id: user.id, message: msg });

            if (msgError) throw msgError;

            // Update ticket updated_at (so it bubbles up in the list)
            // Also set status to in_progress when admin replies to an open ticket
            const isAdminUser = isSuperAdmin(currentUserRole) || isOrgAdmin(currentUserRole);
            const shouldSetInProgress = isAdminUser && ticket.status === 'open';

            await (supabase as any)
                .from('support_tickets')
                .update({
                    updated_at: new Date().toISOString(),
                    ...(shouldSetInProgress ? { status: 'in_progress' } : {}),
                })
                .eq('id', ticket.id);

            setNewMessage('');
            await fetchMessages();
            onUpdate();
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Erro ao enviar mensagem', description: err.message });
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const getStatusBadge = (status: string) => {
        if (status === 'open') return <Badge className="bg-blue-100 text-blue-700 border-none font-bold uppercase text-[10px]">Aberto</Badge>;
        if (status === 'in_progress') return <Badge className="bg-orange-100 text-orange-700 border-none font-bold uppercase text-[10px]">Em Atendimento</Badge>;
        if (status === 'resolved') return <Badge className="bg-green-100 text-green-700 border-none font-bold uppercase text-[10px]">Resolvido</Badge>;
        return <Badge variant="outline">{status}</Badge>;
    };

    if (!ticket) return null;

    const isResolved = ticket.status === 'resolved';

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="sm:max-w-[520px] flex flex-col h-full p-0 border-l shadow-2xl">
                {/* Header */}
                <SheetHeader className="p-8 border-b relative overflow-hidden shrink-0 bg-white">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-bee-amber/[0.04] rounded-full -mr-24 -mt-24 blur-3xl" />
                    <div className="flex items-center gap-2 mb-3 relative">
                        {getStatusBadge(ticket.status)}
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded-md">
                            Ticket #{ticket.id.slice(0, 8).toUpperCase()}
                        </span>
                    </div>
                    <div className="flex items-start gap-4 relative">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-bee-amber/10 border border-bee-amber/20">
                            <LifeBuoy className="h-6 w-6 text-bee-amber" />
                        </div>
                        <div className="space-y-1 min-w-0">
                            <SheetTitle className="text-lg font-black font-display tracking-tight text-bee-midnight leading-snug">
                                {ticket.subject}
                            </SheetTitle>
                            <SheetDescription className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                                <Clock className="h-3 w-3" />
                                Aberto em {format(new Date(ticket.created_at), "dd 'de' MMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                {/* Body */}
                <div className="flex-1 flex flex-col min-h-0">
                    <ScrollArea className="flex-1 p-6">
                        <div className="space-y-6">
                            {/* Original description */}
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Descrição original</p>
                                <p className="text-sm text-slate-600 leading-relaxed">{ticket.description}</p>
                                {ticket.attachment_url && (
                                    <div className="mt-3 pt-3 border-t border-slate-200">
                                        <a
                                            href={ticket.attachment_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-bee-amber hover:underline"
                                        >
                                            <Paperclip className="h-3 w-3" />
                                            Visualizar Anexo
                                        </a>
                                    </div>
                                )}
                            </div>

                            <Separator />

                            {/* Messages thread */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                                    Histórico de Mensagens
                                </h4>

                                {loading ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-bee-amber" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <p className="text-sm text-slate-400 italic text-center py-6">
                                        Nenhuma mensagem ainda. Seja o primeiro a responder.
                                    </p>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        {messages.map((msg) => {
                                            // A message is "from support" when the sender is SUPER_ADMIN
                                            // A message is "from client" when it's OWNER/ADMIN (the gym owner)
                                            const senderRole = msg.sender?.role ?? '';
                                            const isSupport = isSuperAdmin(senderRole);
                                            const senderLabel = isSupport
                                                ? 'Suporte BeeGym'
                                                : (msg.sender?.full_name || 'Cliente');

                                            return (
                                                <div
                                                    key={msg.id}
                                                    className={cn(
                                                        "flex flex-col max-w-[85%] gap-1",
                                                        isSupport ? "self-start" : "self-end items-end"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                                                        isSupport
                                                            ? "bg-bee-midnight text-white rounded-tl-none"
                                                            : "bg-bee-amber/10 text-bee-midnight border border-bee-amber/20 rounded-tr-none"
                                                    )}>
                                                        {msg.message}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase px-1">
                                                        {senderLabel} · {format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>
                    </ScrollArea>

                    {/* Input area */}
                    <div className="p-6 border-t bg-white shrink-0">
                        {isResolved ? (
                            <div className="flex items-center justify-center gap-2 py-4 text-slate-400">
                                <LifeBuoy className="h-4 w-4" />
                                <p className="text-xs font-black uppercase tracking-widest">
                                    Ticket resolvido — sem novas mensagens
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="relative">
                                    <Textarea
                                        placeholder="Escreva sua mensagem... (Ctrl+Enter para enviar)"
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        maxLength={2000}
                                        className="min-h-[100px] pr-14 p-4 bg-slate-50/50 border-slate-100 rounded-2xl focus:ring-4 focus:ring-bee-amber/5 focus:border-bee-amber/20 transition-all font-medium text-bee-midnight resize-none leading-relaxed text-sm"
                                    />
                                    <Button
                                        size="icon"
                                        className="absolute bottom-3 right-3 rounded-full bg-bee-amber hover:bg-amber-500 text-bee-midnight h-9 w-9 shadow-lg shadow-bee-amber/10 transition-all active:scale-95 disabled:opacity-40"
                                        onClick={handleSendMessage}
                                        disabled={!newMessage.trim() || isSending}
                                    >
                                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium text-right">
                                    {newMessage.length}/2000 · Ctrl+Enter para enviar
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
