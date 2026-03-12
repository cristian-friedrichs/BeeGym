'use client';

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2, MessageSquare, X, Check, User, Mail, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const { data: profile } = await (supabase as any).from('profiles').select('organization_id').eq('id', user.id).single();
            if (!(profile as any)?.organization_id) throw new Error("Organização não encontrada");

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

            const { error: msgError } = await (supabase as any).from('chat_messages').insert({
                chat_id: chatId,
                sender_id: user.id,
                sender_type: 'USER',
                content: message,
                message_type: 'TEXT'
            } as any);

            if (msgError) throw msgError;

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
            <SheetContent className="p-0 border-none bg-white sm:max-w-[600px] flex flex-col h-full overflow-hidden text-left">
                <SheetHeader className="relative p-8 bg-gradient-to-br from-bee-midnight via-bee-midnight to-slate-900 border-none shrink-0 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-bee-amber/10 blur-3xl rounded-full -mr-16 -mt-16" />

                    <div className="relative flex items-center gap-5">
                        <div className="h-16 w-16 rounded-[22px] bg-bee-amber/10 flex items-center justify-center ring-1 ring-bee-amber/20">
                            <MessageSquare className="h-8 w-8 text-bee-amber" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <SheetTitle className="text-2xl font-black text-white tracking-tight text-left">Mensagem Rápida</SheetTitle>
                                <Badge className="bg-bee-amber text-bee-midnight border-none font-black uppercase text-[10px] tracking-tighter h-5 px-2">Chat</Badge>
                            </div>
                            <SheetDescription className="text-slate-400 font-medium text-sm text-left">
                                Envie uma mensagem direta para o aluno
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10 scrollbar-hide text-left">
                    {/* Destinatário */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-bee-amber/10 flex items-center justify-center">
                                <User className="h-4 w-4 text-bee-amber" />
                            </div>
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 text-left">Destinatário</h3>
                        </div>

                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                <User className="h-6 w-6 text-slate-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-bee-midnight leading-none mb-1">{studentName}</h4>
                                {studentEmail && (
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <Mail className="h-3 w-3" />
                                        {studentEmail}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-slate-50" />

                    {/* Mensagem */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-bee-amber/10 flex items-center justify-center">
                                <MessageSquare className="h-4 w-4 text-bee-amber" />
                            </div>
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 text-left">Conteúdo da Mensagem</h3>
                        </div>

                        <div className="space-y-2.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Sua Mensagem</Label>
                            <Textarea
                                placeholder="Olá, gostaria de conversar sobre seu progresso..."
                                className="min-h-[180px] p-5 bg-slate-50/50 border-slate-100 rounded-3xl focus:ring-4 focus:ring-bee-amber/5 focus:border-bee-amber/20 transition-all font-medium text-bee-midnight resize-none leading-relaxed text-base"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                        </div>

                        {/* Tip */}
                        <div className="p-4 bg-bee-amber/5 rounded-2xl border border-bee-amber/10">
                            <div className="flex gap-3">
                                <Info className="h-5 w-5 text-bee-amber shrink-0 mt-0.5" />
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Esta mensagem será enviada instantaneamente e ficará salva no histórico do chat do aluno.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <SheetFooter className="p-8 border-t bg-white flex items-center gap-3 shrink-0 sm:justify-end sticky bottom-0 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="flex-1 sm:flex-none text-slate-400 hover:text-slate-600 hover:bg-slate-100 font-black h-10 rounded-full uppercase text-[10px] tracking-widest transition-all"
                    >
                        <X className="mr-2 h-4 w-4" />
                        Descartar
                    </Button>
                    <Button
                        disabled={loading || !message.trim()}
                        onClick={handleSend}
                        className="flex-1 sm:flex-none bg-bee-amber hover:bg-amber-500 text-bee-midnight font-black h-10 rounded-full shadow-lg shadow-bee-amber/20 transition-all hover:-translate-y-0.5 active:scale-95 uppercase text-[10px] tracking-widest px-10"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                Enviar Mensagem
                            </>
                        )}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
