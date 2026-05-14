'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, X, UserCog, Briefcase, Shield, Info, Check, UserPlus, Lock, Users } from 'lucide-react';
import { updateTeamMemberAction } from '@/actions/team';
import { getRolesAction } from '@/actions/roles';
import type { AppRole } from '@/types/permissions';
import { cn } from '@/lib/utils';
import { ConfirmDiscardDialog } from '@/components/ui/confirm-discard-dialog';

const formSchema = z.object({
    fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    jobTitle: z.string().optional(),
    isInstructor: z.boolean().default(false),
    roleId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditMemberModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    member: any | null;
    organizationId: string;
}

const fieldCls = "h-9 rounded-xl border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:border-bee-amber focus:ring-2 focus:ring-bee-amber/20 focus:ring-offset-0 transition-all";
const labelCls = "text-sm font-medium text-slate-700";

export function EditMemberModal({ open, onOpenChange, member, organizationId }: EditMemberModalProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    const [roles, setRoles] = useState<AppRole[]>([]);
    const [isLoadingRoles, setIsLoadingRoles] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { fullName: '', jobTitle: '', isInstructor: false, roleId: '' },
    });

    useEffect(() => {
        if (member && open) {
            form.reset({
                fullName: member.full_name || member.name || '',
                jobTitle: member.job_title || '',
                isInstructor: member.is_instructor || false,
                roleId: member.role_id || '',
            });

            setIsLoadingRoles(true);
            getRolesAction().then((result) => {
                if (result.success && result.data) setRoles(result.data as AppRole[]);
            }).finally(() => setIsLoadingRoles(false));
        }
    }, [member, open, form]);

    async function onSubmit(values: FormValues) {
        if (!member) return;
        setIsSubmitting(true);
        try {
            const result = await updateTeamMemberAction({
                profileId: member.id,
                fullName: values.fullName,
                jobTitle: values.jobTitle,
                isInstructor: values.isInstructor,
                roleId: values.roleId || undefined,
                organizationId,
            });

            if (result.success) {
                toast({ title: 'Sucesso', description: 'Membro atualizado com sucesso!' });
                onOpenChange(false);
                setTimeout(() => router.refresh(), 300);
            } else {
                toast({ title: 'Erro', description: result.error, variant: 'destructive' });
            }
        } catch {
            toast({ title: 'Erro', description: 'Ocorreu um erro inesperado', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen && form.formState.isDirty) {
            setShowCloseConfirm(true);
        } else {
            onOpenChange(newOpen);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="max-w-[576px] p-0 gap-0 rounded-2xl overflow-hidden border-none shadow-2xl bg-white flex flex-col max-h-[90vh]">
                
                <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100 bg-white shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-bee-amber/10 flex items-center justify-center border border-bee-amber/20 shrink-0">
                            <UserCog className="h-5 w-5 text-bee-amber" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-2">
                                <DialogTitle className="text-[17px] font-semibold text-slate-900 leading-tight">
                                    Editar Membro
                                </DialogTitle>
                                {member?.id && (
                                    <Badge className="bg-slate-100 text-slate-500 border-none font-medium text-[10px] px-2 py-0 rounded-md">
                                        ID: {member.id.slice(0, 8)}
                                    </Badge>
                                )}
                            </div>
                            <DialogDescription className="text-sm text-slate-500 mt-0.5">
                                Gerencie as informações e permissões de {member?.name || 'seu colaborador'}.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                            
                            <div className="space-y-6">
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-1 rounded-full bg-bee-amber" />
                                    <h3 className="text-sm font-semibold text-slate-900">Dados Gerais</h3>
                                </div>

                                <FormField control={form.control} name="fullName" render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className={labelCls}>Nome Completo *</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input placeholder="Ex: João Silva" className={cn(fieldCls, 'pl-9')} {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={form.control} name="jobTitle" render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className={labelCls}>Cargo / Título</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input placeholder="Ex: Recepcionista, Personal Trainer…" className={cn(fieldCls, 'pl-9')} {...field} />
                                            </div>
                                        </FormControl>
                                        <p className="text-[10px] text-slate-400 font-medium ml-1">Texto livre para identificação visual.</p>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={form.control} name="isInstructor" render={({ field }) => (
                                    <FormItem className={cn('flex items-center justify-between rounded-2xl border p-4 transition-all', field.value ? 'border-bee-amber/20 bg-bee-amber/5' : 'border-slate-100 bg-slate-50/30')}>
                                        <div>
                                            <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Instrutor Ativo</FormLabel>
                                            <p className="text-xs font-semibold text-bee-midnight">Habilitar na agenda de aulas</p>
                                        </div>
                                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-bee-amber" /></FormControl>
                                    </FormItem>
                                )} />
                            </div>

                            {member?.has_system_access && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <hr className="border-slate-100" />
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-1 rounded-full bg-bee-amber" />
                                        <h3 className="text-sm font-semibold text-slate-900">Segurança e Acesso</h3>
                                    </div>

                                    <FormField control={form.control} name="roleId" render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className={labelCls}>Perfil de Permissões *</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className={fieldCls}>
                                                        <div className="flex items-center gap-2">
                                                            <Shield className="h-4 w-4 text-bee-amber shrink-0" />
                                                            <SelectValue placeholder={isLoadingRoles ? 'Carregando…' : 'Selecione o perfil…'} />
                                                        </div>
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                                    {isLoadingRoles ? (
                                                        <div className="py-4 flex items-center justify-center gap-2 text-sm text-slate-400"><Loader2 className="h-3.5 w-3.5 animate-spin" />Carregando…</div>
                                                    ) : roles.length === 0 ? (
                                                        <div className="py-4 text-sm text-slate-400 text-center font-medium">Nenhum perfil criado</div>
                                                    ) : roles.map(r => (
                                                        <SelectItem key={r.id} value={r.id} className="py-2.5 focus:bg-bee-amber/10 rounded-lg mx-1 my-0.5 font-medium">
                                                            {r.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <div className="flex items-start gap-3 rounded-2xl bg-bee-amber/5 border border-bee-amber/10 p-4">
                                        <Info className="h-4 w-4 text-bee-amber shrink-0 mt-0.5" />
                                        <p className="text-[11px] font-bold text-bee-amber/80 uppercase tracking-tight leading-relaxed">
                                            As alterações de permissão entrarão em vigor no próximo login do colaborador.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-5 border-t border-slate-100 bg-white shrink-0 flex flex-row items-center justify-between gap-3">
                            <Button 
                                type="button" 
                                variant="ghost" 
                                onClick={() => handleOpenChange(false)} 
                                disabled={isSubmitting}
                                className="h-9 rounded-full px-5 border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium"
                            >
                                Cancelar
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="h-9 rounded-full px-6 bg-bee-amber hover:bg-amber-500 text-bee-midnight font-semibold text-sm shadow-sm"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        Salvar alterações
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
                </DialogContent>
            </Dialog>

            <ConfirmDiscardDialog 
                open={showCloseConfirm}
                onOpenChange={setShowCloseConfirm}
                onConfirm={() => {
                    setShowCloseConfirm(false);
                    onOpenChange(false);
                }}
            />
        </>
    );
}
