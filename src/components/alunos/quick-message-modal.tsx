'use client';

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2, MessageSquare, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!message.trim() || !studentId) return;

        setLoading(true);
        try {
            // 1. Pega os dados do usuário logado (Remetente)
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const { data: profile } = await (supabase as any).from('profiles').select('organization_id').eq('id', user.id).single();
            if (!(profile as any)?.organization_id) throw new Error("Organização não encontrada");

            // 2. Tenta encontrar um chat existente entre os dois
            const { data: myChats } = await (supabase as any).from('chat_participants').select('chat_id').eq('participant_id', user.id) as any;
            const myChatIds = (myChats as any[])?.map((c: any) => c.chat_id) || [];

            let chatId = null;

            if (myChatIds.length > 0) {
                const { data: sharedChat } = await (supabase as any)
                    .from('chat_participants')
                    .select('chat_id')
                    .in('chat_id', myChatIds)
                    .eq('participant_id', studentId)
                    .limit(1)
                    .maybeSingle();

                if (sharedChat) chatId = (sharedChat as any).chat_id;
            }

            // 3. Se não existe chat, cria a sala e insere os participantes
            if (!chatId) {
                const { data: newChat, error: chatError } = await (supabase as any)
                    .from('chats')
                    .insert({ organization_id: (profile as any).organization_id } as any)
                    .select('id').single();

                if (chatError) throw chatError;
                chatId = (newChat as any).id;

                await (supabase as any).from('chat_participants').insert([
                    { chat_id: chatId, participant_id: user.id, participant_type: 'USER' },
                    { chat_id: chatId, participant_id: studentId, participant_type: 'STUDENT' }
                ] as any);
            }

            // 4. Insere a mensagem de fato na nova estrutura
            const { error: msgError } = await (supabase as any).from('chat_messages').insert({
                chat_id: chatId,
                sender_id: user.id,
                sender_type: 'USER',
                content: message,
                message_type: 'TEXT'
            } as any);

            if (msgError) throw msgError;

            // 5. Atualiza o updated_at do chat para subir na lista
            await (supabase as any).from('chats').update({ updated_at: new Date().toISOString(), last_message_content: message } as any).eq('id', chatId);

            toast({
                title: "Mensagem enviada!",
                description: "A mensagem foi salva no histórico de conversas e já está disponível no módulo."
            });

            setMessage("");
            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
            toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[600px] flex flex-col h-full overflow-y-auto">
                <SheetHeader className="space-y-3 pb-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                            <MessageSquare className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                            <SheetTitle className="text-xl">Nova Mensagem Rápida</SheetTitle>
                            <SheetDescription>Envie uma mensagem direta para o aluno.</SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 py-6 space-y-5">
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700">Destinatário</Label>
                        <div className="p-3 bg-slate-50 rounded-xl text-sm font-medium text-slate-700 border">
                            {studentName} <span className="text-slate-400 font-normal">{studentEmail ? `<${studentEmail}>` : ''}</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700">Mensagem</Label>
                        <Textarea
                            placeholder="Olá, gostaria de confirmar seu horário de treino..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={6}
                            className="resize-none"
                        />
                    </div>
                </div>

                <SheetFooter className="mt-auto border-t pt-4 flex gap-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 gap-2">
                        <X className="h-4 w-4" />
                        Cancelar
                    </Button>
                    <Button onClick={handleSend} disabled={loading || !message.trim()} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold gap-2">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Enviar
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
