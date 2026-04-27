'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/lib/supabase/client';
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
import { Loader2, Upload, X, LifeBuoy, Paperclip } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const formSchema = z.object({
    subject: z.enum(['Financeiro', 'Configuração', 'Bug', 'Reclamação', 'Outros']),
    description: z.string().min(10, 'Descreva o problema com pelo menos 10 caracteres.').max(2000, 'Máximo de 2000 caracteres.'),
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
    const [fileError, setFileError] = useState('');
    const { toast } = useToast();
    const supabase = createClient();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            subject: 'Outros',
            description: '',
            priority: 'medium',
        },
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (!selected) return;
        setFileError('');

        if (!ALLOWED_TYPES.includes(selected.type)) {
            setFileError('Formato não suportado. Use PNG, JPG, WebP ou PDF.');
            e.target.value = '';
            return;
        }
        if (selected.size > MAX_FILE_SIZE) {
            setFileError('O arquivo deve ter no máximo 5MB.');
            e.target.value = '';
            return;
        }
        setFile(selected);
    };

    const handleClose = () => {
        form.reset();
        setFile(null);
        setFileError('');
        onClose();
    };

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            // 1. Get authenticated user
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) throw new Error('Usuário não autenticado.');

            // 2. Fetch organization_id from profile
            const { data: profile, error: profileError } = await (supabase as any)
                .from('profiles')
                .select('organization_id')
                .eq('id', user.id)
                .single();

            if (profileError) throw new Error('Não foi possível carregar o perfil do usuário.');
            if (!profile?.organization_id) throw new Error('Nenhuma organização vinculada ao seu perfil.');

            // 3. Upload attachment if provided
            let attachmentUrl: string | null = null;
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${profile.organization_id}/${user.id}/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('support-attachments')
                    .upload(fileName, file, { upsert: false });

                if (uploadError) throw new Error(`Erro ao enviar anexo: ${uploadError.message}`);

                const { data: { publicUrl } } = supabase.storage
                    .from('support-attachments')
                    .getPublicUrl(fileName);

                attachmentUrl = publicUrl;
            }

            // 4. Insert ticket with organization_id
            const { error: insertError } = await (supabase as any)
                .from('support_tickets')
                .insert({
                    user_id: user.id,
                    organization_id: profile.organization_id,
                    subject: values.subject,
                    description: values.description,
                    priority: values.priority,
                    attachment_url: attachmentUrl,
                    status: 'open',
                });

            if (insertError) throw insertError;

            toast({
                title: 'Ticket aberto com sucesso!',
                description: 'Nossa equipe responderá em breve.',
                className: 'bg-green-600 text-white border-none',
            });

            handleClose();
            onSuccess();
        } catch (error: any) {
            console.error('[NovoTicketModal]', error);
            toast({
                variant: 'destructive',
                title: 'Erro ao abrir ticket',
                description: error.message || 'Ocorreu um erro inesperado.',
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    const description = form.watch('description');

    return (
        <Sheet open={isOpen} onOpenChange={handleClose}>
            <SheetContent side="right" className="sm:max-w-[500px] p-0 flex flex-col h-full border-l shadow-2xl">
                <SheetHeader className="relative p-0 mb-0 overflow-hidden shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-bee-midnight via-slate-900 to-bee-midnight" />
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-bee-amber/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-bee-amber/5 rounded-full blur-3xl" />
                    <div className="relative px-8 pt-10 pb-8 flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-bee-amber to-amber-600 p-[1px] shadow-lg shadow-bee-amber/20">
                                <div className="flex h-full w-full items-center justify-center rounded-[15px] bg-bee-midnight/90 backdrop-blur-xl">
                                    <LifeBuoy className="h-7 w-7 text-bee-amber" />
                                </div>
                            </div>
                            <div>
                                <SheetTitle className="text-2xl font-black text-white tracking-tight leading-none font-display mb-1">
                                    Suporte
                                </SheetTitle>
                                <SheetDescription className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-bee-amber/10 text-bee-amber border-bee-amber/30 font-bold uppercase tracking-wider text-[10px] px-2.5 py-0.5 rounded-full">
                                        Novo Ticket
                                    </Badge>
                                    <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Estamos aqui para ajudar</span>
                                </SheetDescription>
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
                                            <FormLabel className="text-slate-700 font-bold text-xs uppercase tracking-wider">Assunto *</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-11 rounded-xl border-slate-200 focus:ring-bee-amber">
                                                        <SelectValue placeholder="Selecione o assunto" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Financeiro">Financeiro</SelectItem>
                                                    <SelectItem value="Configuração">Configuração</SelectItem>
                                                    <SelectItem value="Bug">Bug / Erro no sistema</SelectItem>
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
                                            <FormLabel className="text-slate-700 font-bold text-xs uppercase tracking-wider">Prioridade *</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-11 rounded-xl border-slate-200 focus:ring-bee-amber">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="low">🟢 Baixa</SelectItem>
                                                    <SelectItem value="medium">🟡 Média</SelectItem>
                                                    <SelectItem value="high">🔴 Alta</SelectItem>
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
                                        <div className="flex items-center justify-between">
                                            <FormLabel className="text-slate-700 font-bold text-xs uppercase tracking-wider">Descrição do Problema *</FormLabel>
                                            <span className={`text-[10px] font-medium ${description.length > 1800 ? 'text-red-500' : 'text-slate-400'}`}>
                                                {description.length}/2000
                                            </span>
                                        </div>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Detalhe o que está acontecendo, incluindo passos para reproduzir o problema..."
                                                className="min-h-[160px] rounded-xl border-slate-200 resize-none focus:ring-bee-amber focus:border-bee-amber transition-all text-sm"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Anexo */}
                            <div className="space-y-2">
                                <FormLabel className="text-slate-700 font-bold text-xs uppercase tracking-wider block">Anexo <span className="font-normal text-slate-400 normal-case">(opcional · PNG, JPG, PDF, máx 5MB)</span></FormLabel>
                                <div className="flex items-center gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className={`flex-1 h-10 border-dashed border-2 rounded-xl text-sm font-medium transition-all ${file ? 'border-bee-amber/50 text-bee-amber bg-bee-amber/5' : 'border-slate-200 text-slate-500 hover:border-bee-amber hover:text-bee-amber'}`}
                                        onClick={() => document.getElementById('file-upload-support')?.click()}
                                    >
                                        {file ? <Paperclip className="h-4 w-4 mr-2 shrink-0" /> : <Upload className="h-4 w-4 mr-2 shrink-0" />}
                                        <span className="truncate">{file ? file.name : 'Selecionar arquivo'}</span>
                                    </Button>
                                    <input
                                        id="file-upload-support"
                                        type="file"
                                        className="hidden"
                                        onChange={handleFileChange}
                                        accept="image/*,.pdf"
                                    />
                                    {file && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="rounded-full text-red-500 hover:bg-red-50 shrink-0"
                                            onClick={() => { setFile(null); setFileError(''); }}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                                {fileError && <p className="text-xs font-bold text-red-500 mt-1">{fileError}</p>}
                            </div>
                        </form>
                    </Form>
                </ScrollArea>

                <SheetFooter className="p-6 bg-slate-50/50 border-t gap-3 shrink-0">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="h-10 rounded-full font-bold text-slate-400 hover:text-slate-600 transition-all uppercase tracking-wider text-xs px-6"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={form.handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                        className="flex-1 h-10 rounded-full bg-bee-amber hover:bg-amber-500 text-bee-midnight font-black shadow-lg shadow-bee-amber/20 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider text-xs"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Enviando...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <LifeBuoy className="h-4 w-4" />
                                Abrir Ticket
                            </span>
                        )}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
