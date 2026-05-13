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
} from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { UserPlus, Loader2, Mail, Lock, Shield, AlertCircle, Info } from 'lucide-react';
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
}

const fieldCls = 'h-9 rounded-xl border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:border-bee-amber focus:ring-2 focus:ring-bee-amber/20 focus:ring-offset-0';
const labelCls = 'text-sm font-medium text-slate-700';

export function AddMemberModal({ organizationId }: AddMemberModalProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [open, setOpen] = useState(false);
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

    return (
        <>
            <Button onClick={() => setOpen(true)} className="gap-2 bg-bee-amber hover:bg-amber-500 text-bee-midnight font-semibold rounded-full text-sm shadow-sm">
                <UserPlus className="h-4 w-4" />
                Adicionar Membro
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-[520px] p-0 gap-0 rounded-2xl overflow-hidden">

                    <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100">
                        <DialogTitle className="text-[17px] font-semibold text-slate-900 leading-tight">Adicionar Membro</DialogTitle>
                        <p className="text-sm text-slate-500 mt-0.5">Adicione um novo colaborador à sua organização.</p>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">

                                <FormField control={form.control} name="fullName" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className={labelCls}>Nome completo *</FormLabel>
                                        <FormControl><Input placeholder="Ex: João Silva" className={fieldCls} {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={form.control} name="jobTitle" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className={labelCls}>Cargo / Título</FormLabel>
                                        <FormControl><Input placeholder="Ex: Recepcionista, Personal Trainer…" className={fieldCls} {...field} /></FormControl>
                                        <p className="text-xs text-slate-400 mt-1">Texto livre para identificação visual. Não afeta permissões.</p>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <div className="grid grid-cols-2 gap-3">
                                    <FormField control={form.control} name="isInstructor" render={({ field }) => (
                                        <FormItem className={cn('flex items-center justify-between rounded-xl border px-4 py-3', field.value ? 'border-bee-amber/20 bg-bee-amber/5' : 'border-slate-200')}>
                                            <div>
                                                <FormLabel className="text-sm font-medium text-slate-700 leading-tight">Instrutor</FormLabel>
                                                <p className="text-xs text-slate-400">Pode ministrar aulas</p>
                                            </div>
                                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-bee-amber" /></FormControl>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="hasSystemAccess" render={({ field }) => (
                                        <FormItem className={cn('flex items-center justify-between rounded-xl border px-4 py-3', field.value ? 'border-bee-amber/20 bg-bee-amber/5' : 'border-slate-200')}>
                                            <div>
                                                <FormLabel className="text-sm font-medium text-slate-700 leading-tight">Acesso sistema</FormLabel>
                                                <p className="text-xs text-slate-400">Permitir login</p>
                                            </div>
                                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-bee-amber" /></FormControl>
                                        </FormItem>
                                    )} />
                                </div>

                                {hasSystemAccess && (
                                    <div className="space-y-4 animate-in fade-in duration-200">
                                        <hr className="border-slate-100" />
                                        <p className="text-sm font-semibold text-slate-700">Credenciais e Permissões</p>

                                        <FormField control={form.control} name="roleId" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className={labelCls}>Perfil de permissões *</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className={fieldCls}>
                                                            <div className="flex items-center gap-2">
                                                                <Shield className="h-4 w-4 text-slate-400 shrink-0" />
                                                                <SelectValue placeholder={isLoadingRoles ? 'Carregando…' : 'Selecione o perfil…'} />
                                                            </div>
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {isLoadingRoles ? (
                                                            <div className="py-4 flex items-center justify-center gap-2 text-sm text-slate-400"><Loader2 className="h-3.5 w-3.5 animate-spin" />Carregando…</div>
                                                        ) : roles.length === 0 ? (
                                                            <div className="py-4 text-sm text-slate-400 text-center">Nenhum perfil criado</div>
                                                        ) : roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-xs text-slate-400 mt-1">Define o que este membro pode acessar no sistema.</p>
                                                <FormMessage />
                                            </FormItem>
                                        )} />

                                        <div className="grid grid-cols-2 gap-3">
                                            <FormField control={form.control} name="email" render={({ field }) => (
                                                <FormItem>
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
                                                <FormItem>
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
                                            <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                                                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                                                <p className="text-xs text-red-600">Crie pelo menos um perfil de acesso em <strong>Configurações → Perfis de Acesso</strong> antes de adicionar membros com acesso.</p>
                                            </div>
                                        ) : (
                                            <div className="flex items-start gap-2.5 rounded-xl bg-bee-amber/5 border border-bee-amber/20 px-4 py-3">
                                                <Info className="h-4 w-4 text-bee-amber shrink-0 mt-0.5" />
                                                <p className="text-xs text-slate-600">O usuário poderá trocar a senha no primeiro acesso.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!hasSystemAccess && (
                                    <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                                        <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                                        <p className="text-xs text-slate-500">Cadastrado apenas como registro. Não poderá fazer login no sistema.</p>
                                    </div>
                                )}
                            </div>

                            <div className="px-6 pb-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}
                                    className="h-9 rounded-full px-5 border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium">
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={isSubmitting || noRolesAvailable}
                                    className="h-9 rounded-full px-6 bg-bee-amber hover:bg-amber-500 text-bee-midnight font-semibold text-sm shadow-sm disabled:opacity-50">
                                    {isSubmitting ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Salvando…</> : 'Salvar membro'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    );
}
