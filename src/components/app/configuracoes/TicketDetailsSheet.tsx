'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    Send,
    Clock,
    User,
    LifeBuoy,
    FileIcon,
    Paperclip,
    Loader2,
    Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TicketDetailsSheetProps {
    ticket: any;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export function TicketDetailsSheet({ ticket, isOpen, onClose, onUpdate }: TicketDetailsSheetProps) {
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const { toast } = useToast();
    const supabase = createClient();

    const fetchMessages = async () => {
        if (!ticket) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('support_messages')
                .select(`
          *,
          sender:profiles (
            full_name,
            avatar_url,
            role
          )
        `)
                .eq('ticket_id', ticket.id)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMessages(data || []);
        } catch (error) {
            console.error('Erro ao buscar mensagens:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && ticket) {
            fetchMessages();
        }
    }, [isOpen, ticket]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !ticket) return;
        setIsSending(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Não autenticado');

            const { error } = await (supabase
                .from('support_messages') as any)
                .insert({
                    ticket_id: ticket.id,
                    sender_id: user.id,
                    message: newMessage.trim(),
                });

            if (error) throw error;

            setNewMessage('');
            fetchMessages();
            onUpdate();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Erro ao enviar mensagem',
                description: error.message,
            });
        } finally {
            setIsSending(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open':
                return <Badge className="bg-blue-100 text-blue-700 border-none font-bold uppercase text-[10px]">Aberto</Badge>;
            case 'in_progress':
                return <Badge className="bg-orange-100 text-orange-700 border-none font-bold uppercase text-[10px]">Em Atendimento</Badge>;
            case 'resolved':
                return <Badge className="bg-green-100 text-green-700 border-none font-bold uppercase text-[10px]">Resolvido</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (!ticket) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="sm:max-w-[500px] flex flex-col h-full p-0">
                <SheetHeader className="p-8 border-b relative overflow-hidden shrink-0 bg-white/50 backdrop-blur-sm">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-bee-amber/[0.03] rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-bee-amber/[0.05] rounded-full -mr-16 -mt-16 blur-2xl opacity-50" />

                    <div className="flex items-center gap-2 mb-4 relative">
                        {getStatusBadge(ticket.status)}
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded-md">Ticket #{ticket.id.slice(0, 8)}</span>
                    </div>

                    <div className="flex items-center gap-5 relative text-left">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-bee-amber/20 via-bee-amber/10 to-transparent border border-bee-amber/20 shadow-inner group transition-all">
                            <LifeBuoy className="h-8 w-8 text-bee-amber drop-shadow-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <SheetTitle className="text-xl font-black font-display tracking-tight text-bee-midnight leading-tight">
                                {ticket.subject}
                            </SheetTitle>
                            <SheetDescription className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5" />
                                Criado em {format(new Date(ticket.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 flex flex-col min-h-0">
                    <ScrollArea className="flex-1 p-6">
                        <div className="space-y-6">
                            {/* Opener info */}
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    {ticket.description}
                                </p>
                                {ticket.attachment_url && (
                                    <div className="mt-4 pt-4 border-t border-slate-200">
                                        <a
                                            href={ticket.attachment_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-xs font-bold text-bee-amber hover:underline"
                                        >
                                            <Paperclip className="h-3 w-3" />
                                            Visualizar Anexo
                                        </a>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Histórico de Atualizações</h4>

                                {loading ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-bee-amber" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <p className="text-sm text-slate-400 italic text-center py-4">Nenhuma atualização enviada ainda.</p>
                                ) : (
                                    messages.map((msg) => {
                                        const isAdmin = msg.sender?.role === 'BEEGYM_ADMIN';
                                        return (
                                            <div key={msg.id} className={cn(
                                                "flex flex-col space-y-2 max-w-[85%]",
                                                isAdmin ? "self-start" : "self-end ml-auto items-end"
                                            )}>
                                                <div className={cn(
                                                    "px-4 py-3 rounded-2xl text-sm",
                                                    isAdmin
                                                        ? "bg-slate-100 text-slate-700 rounded-tl-none"
                                                        : "bg-bee-amber/10 text-bee-midnight border border-bee-amber/20 rounded-tr-none"
                                                )}>
                                                    <p className="font-sans leading-relaxed">{msg.message}</p>
                                                </div>
                                                <div className="flex items-center gap-2 px-1">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                        {isAdmin ? 'Suporte BeeGym' : 'Você'} • {format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </ScrollArea>

                    <div className="p-8 border-t bg-white shrink-0">
                        <div className="relative">
                            <Textarea
                                placeholder="Escreva uma mensagem ou atualização..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className="min-h-[120px] p-5 bg-slate-50/50 border-slate-100 rounded-2xl focus:ring-4 focus:ring-bee-amber/5 focus:border-bee-amber/20 transition-all font-medium text-bee-midnight resize-none leading-relaxed"
                                disabled={ticket.status === 'resolved'}
                            />
                            <Button
                                size="icon"
                                className="absolute bottom-4 right-4 rounded-full bg-bee-amber hover:bg-amber-500 text-bee-midnight h-10 w-10 shadow-lg shadow-bee-amber/10 transition-all active:scale-95 disabled:opacity-50"
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim() || isSending || ticket.status === 'resolved'}
                            >
                                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                        </div>
                        {ticket.status === 'resolved' && (
                            <p className="text-[10px] text-center mt-4 text-slate-400 font-black uppercase tracking-widest">
                                Este ticket está resolvido e não aceita mais mensagens.
                            </p>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
