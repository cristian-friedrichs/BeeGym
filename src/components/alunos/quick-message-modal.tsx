'use client';

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2, MessageSquare } from "lucide-react";

interface QuickMessageModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    studentId: string;
    studentName: string;
    studentEmail: string | null;
}

export function QuickMessageModal({ open, onOpenChange, studentId, studentName, studentEmail }: QuickMessageModalProps) {
    const { toast } = useToast();
    const supabase = createClient();
    const { organizationId, user: authUser } = useAuth();
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const initials = studentName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    const handleSend = async () => {
        if (!message.trim() || !studentId) return;
        setLoading(true);
        try {
            if (!authUser) throw new Error("Usuário não autenticado");
            if (!organizationId) throw new Error("Organização não encontrada");

            const { data: myChats } = await (supabase as any).from('chat_participants').select('chat_id').eq('participant_id', authUser.id);
            const myChatIds = (myChats as any[])?.map((c: any) => c.chat_id) || [];

            let chatId = null;
            if (myChatIds.length > 0) {
                const { data: sharedChat } = await (supabase as any)
                    .from('chat_participants').select('chat_id')
                    .in('chat_id', myChatIds).eq('participant_id', studentId).limit(1).maybeSingle();
                if (sharedChat) chatId = (sharedChat as any).chat_id;
            }

            if (!chatId) {
                const { data: newChat, error: chatError } = await (supabase as any)
                    .from('chats').insert({ organization_id: organizationId }).select('id').single();
                if (chatError) throw chatError;
                chatId = (newChat as any).id;
                await (supabase as any).from('chat_participants').insert([
                    { chat_id: chatId, participant_id: authUser.id, participant_type: 'USER' },
                    { chat_id: chatId, participant_id: studentId, participant_type: 'STUDENT' },
                ]);
            }

            const { error } = await (supabase as any).from('chat_messages').insert({
                chat_id: chatId, sender_id: authUser.id,
                sender_type: 'USER', content: message, message_type: 'TEXT',
            });
            if (error) throw error;

            await (supabase as any).from('chats').update({ updated_at: new Date().toISOString(), last_message_content: message }).eq('id', chatId);

            toast({ title: "Mensagem enviada!" });
            setMessage("");
            onOpenChange(false);
        } catch (error: any) {
            toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[480px] p-0 gap-0 rounded-2xl overflow-hidden bg-white border border-slate-100">
                <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
                            <MessageSquare className="h-4.5 w-4.5 text-blue-500" />
                        </div>
                        <div>
                            <DialogTitle className="text-[17px] font-bold text-slate-900 leading-tight">Mensagem Rápida</DialogTitle>
                            <DialogDescription className="text-xs text-slate-400 mt-0.5">Envie uma mensagem direta para o aluno</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="px-6 py-5 space-y-4">
                    {/* Recipient */}
                    <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-orange-100 text-orange-600 font-bold">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{studentName}</p>
                            {studentEmail && <p className="text-xs text-slate-400 truncate">{studentEmail}</p>}
                        </div>
                    </div>

                    {/* Message */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Mensagem</label>
                        <Textarea
                            placeholder="Olá, gostaria de conversar sobre seu progresso..."
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            className="min-h-[120px] resize-none rounded-xl border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:border-bee-amber focus:ring-2 focus:ring-bee-amber/20"
                        />
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 border-t border-slate-100 flex flex-row items-center gap-2 sm:justify-end">
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading}
                        className="h-9 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold">
                        Cancelar
                    </Button>
                    <Button size="sm" disabled={loading || !message.trim()} onClick={handleSend}
                        className="h-9 rounded-xl bg-bee-amber hover:bg-bee-amber/90 text-bee-midnight font-bold text-xs px-5 gap-1.5 shadow-none">
                        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        {loading ? 'Enviando...' : 'Enviar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
