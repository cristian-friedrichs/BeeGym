'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { UserPlus, Loader2, Mail, Lock, Shield, AlertCircle, Info, X, Check, Users, Briefcase } from 'lucide-react';
import { ConfirmDiscardDialog } from "@/components/ui/confirm-discard-dialog";
import { createTeamMemberAction } from '@/actions/team';
import { getRolesAction } from '@/actions/roles';
import type { AppRole } from '@/types/permissions';
import { cn } from '@/lib/utils';

const formSchema = z.object({
    fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    jobTitle: z.string().optional(),
    isInstructor: z.boolean().default(false),
    hasSystemAccess: z.boolean().default(true),
    roleId: z.string().optional(),
    email: z.string().optional(),
    password: z.string().optional(),
}).refine((d) => !d.hasSystemAccess || (d.email && d.email.length > 0 && d.password && d.password.length >= 6), { message: 'Email e senha obrigatórios com acesso habilitado', path: ['email'] })
  .refine((d) => !d.hasSystemAccess || !d.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email), { message: 'Email inválido', path: ['email'] })
  .refine((d) => !d.hasSystemAccess || (d.roleId && d.roleId.length > 0), { message: 'Selecione um perfil de permissões', path: ['roleId'] });

interface AddMemberModalProps {
    organizationId: string;
    canCreateMore?: boolean;
}

const fieldCls = "h-9 rounded-xl border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:border-bee-amber focus:ring-2 focus:ring-bee-amber/20 focus:ring-offset-0 transition-all";
const labelCls = "text-sm font-medium text-slate-700";

export function AddMemberModal({ organizationId, canCreateMore = true }: AddMemberModalProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [roles, setRoles] = useState<AppRole[]>([]);
    const [isLoadingRoles, setIsLoadingRoles] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { fullName: '', jobTitle: '', email: '', password: '', isInstructor: false, hasSystemAccess: true, roleId: '' },
    });

    const hasSystemAccess = form.watch('hasSystemAccess');
    const noRolesAvailable = hasSystemAccess && !isLoadingRoles && roles.length === 0;

    useEffect(() => {
        if (open) {
            setIsLoadingRoles(true);
            getRolesAction().then(result => {
                if (result.success && result.data) setRoles(result.data as AppRole[]);
                setIsLoadingRoles(false);
            });
        }
    }, [open]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            const result = await createTeamMemberAction({ fullName: values.fullName, email: values.email, password: values.password, role: 'STAFF', roleId: values.roleId || undefined, organizationId, hasSystemAccess: values.hasSystemAccess, isInstructor: values.isInstructor });
            if (result.success) {
                toast({ title: 'Membro criado com sucesso!' });
                setOpen(false);
                setTimeout(() => { router.refresh(); form.reset(); }, 300);
            } else {
                toast({ title: 'Erro', description: result.error || 'Erro ao criar membro', variant: 'destructive' });
            }
        } catch {
            toast({ title: 'Erro inesperado', variant: 'destructive' });
        } finally { setIsSubmitting(false); }
    }

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen && form.formState.isDirty) {
            setShowCloseConfirm(true);
        } else {
            setOpen(newOpen);
            if (!newOpen) {
                setTimeout(() => form.reset(), 300);
            }
        }
    };

    return (
        <>
            <Button
                onClick={() => canCreateMore && setOpen(true)}
                disabled={!canCreateMore}
                title={!canCreateMore ? 'Adicionar mais membros requer o plano STUDIO ou superior' : undefined}
                className="gap-2 bg-bee-amber hover:bg-amber-500 text-bee-midnight font-black uppercase tracking-widest text-[10px] rounded-full px-6 shadow-lg shadow-bee-amber/10 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
                <UserPlus className="h-4 w-4" />
                Adicionar Membro
            </Button>

            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="max-w-[576px] p-0 gap-0 rounded-2xl overflow-hidden border-none shadow-2xl bg-white flex flex-col max-h-[90vh]">
                    <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100 bg-white shrink-0">
                        <DialogTitle className="text-[17px] font-semibold text-slate-900 leading-tight">
                            Adicionar Membro
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-500 mt-0.5">
                            Adicione um novo colaborador à sua organização.
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                                <FormField control={form.control} name="fullName" render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className={labelCls}>Nome completo *</FormLabel>
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
                                        <p className="text-[10px] text-slate-400 font-medium ml-1">Texto livre para identificação visual. Não afeta permissões.</p>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="isInstructor" render={({ field }) => (
                                        <FormItem className={cn('flex items-center justify-between rounded-2xl border p-4 transition-all', field.value ? 'border-bee-amber/20 bg-bee-amber/5' : 'border-slate-100 bg-slate-50/30')}>
                                            <div>
                                                <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Instrutor</FormLabel>
                                                <p className="text-xs font-semibold text-bee-midnight">Ministra aulas</p>
                                            </div>
                                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-bee-amber" /></FormControl>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="hasSystemAccess" render={({ field }) => (
                                        <FormItem className={cn('flex items-center justify-between rounded-2xl border p-4 transition-all', field.value ? 'border-bee-amber/20 bg-bee-amber/5' : 'border-slate-100 bg-slate-50/30')}>
                                            <div>
                                                <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Acesso</FormLabel>
                                                <p className="text-xs font-semibold text-bee-midnight">Permitir login</p>
                                            </div>
                                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-bee-amber" /></FormControl>
                                        </FormItem>
                                    )} />
                                </div>

                                {hasSystemAccess && (
                                    <div className="space-y-6 animate-in fade-in duration-200">
                                        <hr className="border-slate-50" />
                                        
                                        <FormField control={form.control} name="roleId" render={({ field }) => (
                                            <FormItem className="space-y-1.5">
                                                <FormLabel className={labelCls}>Perfil de permissões *</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={form.control} name="email" render={({ field }) => (
                                                <FormItem className="space-y-1.5">
                                                    <FormLabel className={labelCls}>Email *</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                            <Input placeholder="joao@exemplo.com" className={cn(fieldCls, 'pl-9')} {...field} />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="password" render={({ field }) => (
                                                <FormItem className="space-y-1.5">
                                                    <FormLabel className={labelCls}>Senha temporária *</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                            <Input type="password" placeholder="Mín. 6 caracteres" className={cn(fieldCls, 'pl-9')} {...field} />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>

                                        {noRolesAvailable ? (
                                            <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-100 p-4">
                                                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                                                <p className="text-xs text-red-600 font-medium">Crie pelo menos um perfil de acesso em <strong>Configurações → Perfis de Acesso</strong> antes de adicionar membros com acesso.</p>
                                            </div>
                                        ) : (
                                            <div className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-100 p-4">
                                                <Info className="h-4 w-4 text-bee-amber shrink-0 mt-0.5" />
                                                <p className="text-xs text-slate-500 font-medium">O usuário poderá trocar a senha no primeiro acesso.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!hasSystemAccess && (
                                    <div className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-100 p-4">
                                        <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                                        <p className="text-xs text-slate-500 font-medium">Cadastrado apenas como registro. Não poderá fazer login no sistema.</p>
                                    </div>
                                )}
                            </div>

                            <div className="px-6 pb-5 pt-4 border-t border-slate-100 flex items-center justify-between bg-white shrink-0">
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
                                    disabled={isSubmitting || noRolesAvailable}
                                    className="h-9 rounded-full px-6 bg-bee-amber hover:bg-amber-500 text-bee-midnight font-semibold text-sm shadow-sm"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            Salvar membro
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
                    setOpen(false);
                    setTimeout(() => form.reset(), 300);
                }}
            />
        </>
    );
}
