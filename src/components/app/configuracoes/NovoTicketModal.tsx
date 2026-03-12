'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from '@/components/ui/sheet';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, X, LifeBuoy } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const formSchema = z.object({
    subject: z.enum(['Financeiro', 'Configuração', 'Reclamação', 'Outros']),
    description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
    priority: z.enum(['low', 'medium', 'high']),
});

interface NovoTicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function NovoTicketModal({ isOpen, onClose, onSuccess }: NovoTicketModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const { toast } = useToast();
    const { user } = useAuth();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            subject: 'Financeiro' as any,
            description: '',
            priority: 'medium',
        },
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            if (!user) throw new Error('Usuário não autenticado');

            let attachmentUrl = null;

            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('support-attachments')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('support-attachments')
                    .getPublicUrl(fileName);

                attachmentUrl = publicUrl;
            }

            const { error } = await supabase
                .from('support_tickets')
                .insert({
                    user_id: user.id,
                    subject: values.subject,
                    description: values.description,
                    priority: values.priority,
                    attachment_url: attachmentUrl,
                    status: 'open',
                } as any);

            if (error) throw error;

            toast({
                title: 'Sucesso!',
                description: 'Seu ticket foi aberto com sucesso.',
                className: 'bg-green-600 text-white border-none',
            });

            form.reset();
            setFile(null);
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Erro ao abrir ticket',
                description: error.message || 'Ocorreu um erro inesperado.',
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="right" className="sm:max-w-[500px] p-0 flex flex-col h-full border-l shadow-2xl">
                <SheetHeader className="relative p-0 mb-8 mt-[-24px] mx-[-24px] overflow-hidden rounded-t-[2rem]">
                    <div className="absolute inset-0 bg-gradient-to-r from-bee-midnight via-slate-900 to-bee-midnight" />
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-bee-amber/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-bee-amber/5 rounded-full blur-3xl" />

                    <div className="relative px-8 pt-10 pb-8 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-bee-amber to-amber-600 p-[1px] shadow-lg shadow-bee-amber/20 group animate-in zoom-in-50 duration-500">
                                    <div className="flex h-full w-full items-center justify-center rounded-[15px] bg-bee-midnight/90 backdrop-blur-xl transition-colors group-hover:bg-bee-midnight/40">
                                        <LifeBuoy className="h-7 w-7 text-bee-amber animate-pulse" />
                                    </div>
                                </div>
                                <div>
                                    <SheetTitle className="text-3xl font-black text-white tracking-tight leading-none font-display mb-2">
                                        Suporte
                                    </SheetTitle>
                                    <SheetDescription className="flex items-center gap-3">
                                        <Badge variant="outline" className="bg-bee-amber/10 text-bee-amber border-bee-amber/30 font-bold uppercase tracking-wider text-[10px] px-2.5 py-0.5 rounded-full font-sans">
                                            Novo Ticket
                                        </Badge>
                                        <div className="h-1 w-1 rounded-full bg-slate-700" />
                                        <span className="flex items-center gap-1.5 text-slate-400 font-bold text-[11px] uppercase tracking-wider font-sans">
                                            Estamos aqui para ajudar
                                        </span>
                                    </SheetDescription>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-bee-amber/20 to-transparent" />
                </SheetHeader>

                <ScrollArea className="flex-1">
                    <Form {...form}>
                        <form id="support-ticket-form" onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="subject"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-deep-midnight font-bold font-sans">Assunto</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-11 rounded-xl border-slate-200 focus:ring-bee-amber">
                                                        <SelectValue placeholder="Selecione o assunto" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Financeiro">Financeiro</SelectItem>
                                                    <SelectItem value="Configuração">Configuração</SelectItem>
                                                    <SelectItem value="Reclamação">Reclamação</SelectItem>
                                                    <SelectItem value="Outros">Outros</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="priority"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-deep-midnight font-bold font-sans">Prioridade</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-11 rounded-xl border-slate-200 focus:ring-bee-amber">
                                                        <SelectValue placeholder="Selecione a prioridade" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="low">Baixa</SelectItem>
                                                    <SelectItem value="medium">Média</SelectItem>
                                                    <SelectItem value="high">Alta</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-deep-midnight font-bold font-sans">Descrição do Problema *</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Detalhe o que está acontecendo..."
                                                className="min-h-[150px] rounded-xl border-slate-200 resize-none focus:ring-bee-amber focus:border-bee-amber transition-all"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="space-y-3">
                                <FormLabel className="text-deep-midnight font-bold font-sans">Anexo (Opcional)</FormLabel>
                                <div className="flex items-center gap-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full h-10 border-dashed border-2 rounded-xl text-slate-500 hover:text-bee-amber hover:border-bee-amber transition-all font-sans"
                                        onClick={() => document.getElementById('file-upload-sidebar')?.click()}
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        <span className="truncate">{file ? file.name : 'Selecionar arquivo (Imagem, PDF)'}</span>
                                    </Button>
                                    <input
                                        id="file-upload-sidebar"
                                        type="file"
                                        className="hidden"
                                        onChange={handleFileChange}
                                        accept="image/*,.pdf,.doc,.docx"
                                    />
                                    {file && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="rounded-full text-red-500 hover:bg-red-50 shrink-0"
                                            onClick={() => setFile(null)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </Form>
                </ScrollArea>

                <SheetFooter className="p-8 bg-slate-50/50 backdrop-blur-sm border-t gap-3 mt-auto">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onClose()}
                        disabled={isSubmitting}
                        className="h-10 rounded-full font-bold text-slate-400 hover:text-slate-600 transition-all uppercase tracking-wider text-xs"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={form.handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                        className="flex-1 h-10 rounded-full bg-bee-amber hover:bg-bee-amber/90 text-bee-midnight font-black shadow-lg shadow-bee-amber/20 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider text-xs"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Enviando...
                            </span>
                        ) : 'Criar Ticket'}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
