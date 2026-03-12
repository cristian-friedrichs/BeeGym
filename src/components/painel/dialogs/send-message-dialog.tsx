'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, X, Send } from 'lucide-react';

type SendMessageDialogProps = {
    studentName: string;
    studentId: string;
    triggerButton?: React.ReactNode;
    onSend?: (message: string) => void | Promise<void>;
};

export function SendMessageDialog({
    studentName,
    studentId,
    triggerButton,
    onSend,
}: SendMessageDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSend = async () => {
        if (!message.trim()) {
            toast({
                title: 'Mensagem vazia',
                description: 'Por favor, escreva uma mensagem para enviar.',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);

        try {
            if (onSend) {
                await onSend(message);
            } else {
                // Default behavior: save to localStorage (for compatibility with existing system)
                const messageData = {
                    id: Date.now(),
                    content: message,
                    sender: 'me',
                    timestamp: new Date().toISOString(),
                    status: 'sent',
                };

                const storageKey = `chat_messages_${studentId}`;
                const existing = localStorage.getItem(storageKey);
                const messages = existing ? JSON.parse(existing) : [];

                messages.push(messageData);
                localStorage.setItem(storageKey, JSON.stringify(messages));
            }

            toast({
                title: 'Mensagem enviada!',
                description: `Sua mensagem para ${studentName} foi enviada com sucesso.`,
            });

            setMessage('');
            setIsOpen(false);
        } catch (error) {
            console.error('Error sending message:', error);
            toast({
                title: 'Erro ao enviar mensagem',
                description: 'Não foi possível enviar a mensagem. Tente novamente.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                {triggerButton || (
                    <Button variant="outline" size="icon" className="rounded-full hover:bg-bee-amber/10 hover:border-bee-amber/30 transition-all">
                        <MessageSquare className="h-5 w-5" />
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent side="right" className="sm:max-w-md p-0 overflow-hidden border-l border-slate-100 shadow-2xl flex flex-col h-full bg-white">
                <SheetHeader className="relative p-0 overflow-hidden shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-bee-midnight via-slate-900 to-bee-midnight" />
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-bee-amber/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-bee-amber/5 rounded-full blur-3xl" />

                    <div className="relative px-8 pt-12 pb-10 flex flex-col gap-5 text-left">
                        <div className="flex items-center gap-5">
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-bee-amber to-amber-600 p-[1px] shadow-lg shadow-bee-amber/20">
                                <div className="flex h-full w-full items-center justify-center rounded-[15px] bg-bee-midnight/90 backdrop-blur-xl">
                                    <MessageSquare className="h-7 w-7 text-bee-amber" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <SheetTitle className="text-2xl font-black text-white tracking-tight leading-none font-display">
                                    Chat Direto
                                </SheetTitle>
                                <SheetDescription className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-bee-amber/10 text-bee-amber border-bee-amber/30 font-bold uppercase tracking-wider text-[10px] px-2.5 py-0.5 rounded-full font-sans">
                                        {studentName}
                                    </Badge>
                                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                                        Histórico registrado
                                    </span>
                                </SheetDescription>
                            </div>
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-bee-amber/20 to-transparent" />
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-8 py-10 space-y-6">
                    <div className="space-y-4">
                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 ml-1">
                            Sua Mensagem
                        </label>
                        <Textarea
                            placeholder="Olá, gostaria de falar sobre..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="min-h-[200px] resize-none border-slate-100 bg-slate-50/50 rounded-2xl focus:ring-2 focus:ring-bee-amber/10 focus:border-bee-amber/30 transition-all font-sans p-6 text-slate-700 leading-relaxed shadow-inner"
                            disabled={isLoading}
                        />
                        <div className="flex items-start gap-2 px-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-bee-amber mt-1.5 shrink-0" />
                            <p className="text-[11px] text-slate-400 italic leading-snug">
                                Esta mensagem será enviada diretamente para o aluno e ficará salva no histórico de comunicações.
                            </p>
                        </div>
                    </div>
                </div>

                <SheetFooter className="p-8 bg-slate-50/50 backdrop-blur-sm border-t shrink-0 flex flex-row items-center gap-3 sm:justify-end">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsOpen(false)}
                        disabled={isLoading}
                        className="flex-1 sm:flex-none h-10 rounded-full font-black text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all uppercase tracking-widest text-[10px]"
                    >
                        <X className="mr-2 h-4 w-4" />
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={isLoading}
                        className="flex-1 sm:flex-none h-10 rounded-full bg-bee-amber hover:bg-amber-500 text-bee-midnight font-black shadow-lg shadow-bee-amber/20 transition-all hover:-translate-y-0.5 active:scale-95 uppercase tracking-widest text-[10px] px-8"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Enviando...
                            </span>
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
