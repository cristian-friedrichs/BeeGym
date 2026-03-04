'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

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
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {triggerButton || (
                    <Button variant="outline" size="icon" className="rounded-full">
                        <MessageSquare className="h-5 w-5" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Enviar mensagem para {studentName}</DialogTitle>
                    <DialogDescription>
                        Sua mensagem será enviada e ficará registrada no histórico de conversas.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Textarea
                        placeholder="Digite sua mensagem aqui..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="min-h-[150px] resize-none"
                        disabled={isLoading}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSend} disabled={isLoading}>
                        {isLoading ? 'Enviando...' : 'Enviar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
