'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Mail, Lock, ShieldCheck, UserRoundPlus, Check, X, Briefcase, Globe } from 'lucide-react';
import { createInstructorAction, updateInstructorAction } from '@/actions/instructors';
import { cn } from '@/lib/utils';
import { ConfirmDiscardDialog } from '@/components/ui/confirm-discard-dialog';

const formSchema = z.object({
    fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    bio: z.string().optional(),
    allowedUnitIds: z.array(z.string()).default([]),
    hasSystemAccess: z.boolean().default(false),
    email: z.string().optional(),
    password: z.string().optional(),
    roleId: z.string().optional(),
}).refine((d) => !d.hasSystemAccess || (!!d.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)), { message: 'E-mail válido é obrigatório.', path: ['email'] })
  .refine((d) => !d.hasSystemAccess || (!!d.password && d.password.length >= 6), { message: 'Senha de no mínimo 6 caracteres.', path: ['password'] })
  .refine((d) => !d.hasSystemAccess || !!d.roleId, { message: 'Selecione um perfil de acesso.', path: ['roleId'] });

type FormValues = z.infer<typeof formSchema>;
interface Unit { id: string; name: string }
interface AppRole { id: string; name: string }

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'create' | 'edit';
    units: Unit[];
    roles: AppRole[];
    instructor?: { id: string; name: string | null; bio: string | null; allowed_unit_ids: string[] | null; has_system_access: boolean; email: string | null; } | null;
}

const fieldCls = "h-9 rounded-xl border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:border-bee-amber focus:ring-2 focus:ring-bee-amber/20 focus:ring-offset-0 transition-all";
const labelCls = "text-sm font-medium text-slate-700";

export function InstructorModal({ open, onOpenChange, mode, units, roles, instructor }: Props) {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDiscardDialog, setShowDiscardDialog] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { fullName: '', bio: '', allowedUnitIds: [], hasSystemAccess: false, email: '', password: '', roleId: '' },
    });

    const isDirty = form.formState.isDirty;

    const handleCloseAttempt = () => {
        if (isDirty) {
            setShowDiscardDialog(true);
        } else {
            onOpenChange(false);
        }
    };

    useEffect(() => {
        if (!open) return;
        if (mode === 'edit' && instructor) {
            form.reset({ fullName: instructor.name ?? '', bio: instructor.bio ?? '', allowedUnitIds: instructor.allowed_unit_ids ?? [], hasSystemAccess: instructor.has_system_access, email: instructor.email ?? '', password: '', roleId: '' });
        } else {
            form.reset({ fullName: '', bio: '', allowedUnitIds: [], hasSystemAccess: false, email: '', password: '', roleId: '' });
        }
    }, [open, mode, instructor, form]);

    const hasSystemAccess = form.watch('hasSystemAccess');
    const allowedUnitIds = form.watch('allowedUnitIds');

    const toggleUnit = (id: string, checked: boolean) => {
        const current = form.getValues('allowedUnitIds') ?? [];
        form.setValue('allowedUnitIds', checked ? Array.from(new Set([...current, id])) : current.filter(x => x !== id));
    };

    const onSubmit = async (values: FormValues) => {
        setIsSubmitting(true);
        try {
            if (mode === 'create') {
                const result = await createInstructorAction({ fullName: values.fullName, bio: values.bio, allowedUnitIds: values.allowedUnitIds, hasSystemAccess: values.hasSystemAccess, email: values.email, password: values.password, role: 'INSTRUCTOR', roleId: values.roleId });
                if (!result.success) { toast({ title: 'Erro', description: result.error, variant: 'destructive' }); return; }
                toast({ title: 'Instrutor criado com sucesso' });
            } else if (mode === 'edit' && instructor) {
                const result = await updateInstructorAction(instructor.id, { fullName: values.fullName, bio: values.bio, allowedUnitIds: values.allowedUnitIds });
                if (!result.success) { toast({ title: 'Erro', description: result.error, variant: 'destructive' }); return; }
                toast({ title: 'Instrutor atualizado' });
            }
            onOpenChange(false);
            router.refresh();
        } finally { setIsSubmitting(false); }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={handleCloseAttempt}>
                <DialogContent className="max-w-[576px] p-0 gap-0 rounded-2xl overflow-hidden border-none shadow-2xl bg-white flex flex-col max-h-[90vh]">
                    <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100 bg-white shrink-0">
                        <DialogTitle className="text-[17px] font-semibold text-slate-900 leading-tight">
                            {mode === 'create' ? 'Novo Instrutor' : 'Editar Instrutor'}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-500 mt-0.5">
                            {mode === 'create' ? 'Preencha os dados para cadastrar um novo instrutor.' : 'Atualize as informações do instrutor.'}
                        </DialogDescription>
                    </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">
                            
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-1 w-4 rounded-full bg-bee-amber" />
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Dados Profissionais</h3>
                                </div>

                                <FormField control={form.control} name="fullName" render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className={labelCls}>Nome Completo *</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <UserRoundPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input placeholder="Ex: Marcos Andrade" className={cn(fieldCls, 'pl-9')} {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={form.control} name="bio" render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className={labelCls}>Bio / Especialidades</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Ex: Especialista em musculação, 10 anos de experiência…" className="min-h-[100px] rounded-xl border-slate-200 bg-white text-sm p-4 focus:border-bee-amber focus:ring-2 focus:ring-bee-amber/20 focus:ring-offset-0 transition-all" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                {units.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Globe className="h-3.5 w-3.5 text-bee-amber" />
                                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Unidades de Atuação</p>
                                        </div>
                                        <div className="grid gap-2 sm:grid-cols-2">
                                            {units.map(unit => {
                                                const checked = (allowedUnitIds ?? []).includes(unit.id);
                                                return (
                                                    <label key={unit.id} className={cn('flex items-center gap-2.5 px-4 py-2.5 rounded-xl border cursor-pointer transition-all active:scale-[0.98]', checked ? 'border-bee-amber/30 bg-bee-amber/5' : 'border-slate-100 bg-slate-50/30 hover:bg-slate-50')}>
                                                        <Checkbox checked={checked} onCheckedChange={c => toggleUnit(unit.id, c === true)} className="data-[state=checked]:bg-bee-amber data-[state=checked]:border-bee-amber rounded-md" />
                                                        <span className={cn('text-xs font-semibold transition-colors', checked ? 'text-bee-midnight' : 'text-slate-500')}>{unit.name}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium ml-1">Deixe em branco para permitir todas as unidades.</p>
                                    </div>
                                )}
                            </div>

                            {mode === 'create' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <hr className="border-slate-50" />
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="h-1 w-4 rounded-full bg-bee-amber" />
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Segurança e Acesso</h3>
                                    </div>

                                    <FormField control={form.control} name="hasSystemAccess" render={({ field }) => (
                                        <FormItem className={cn('flex items-center justify-between rounded-2xl border p-4 transition-all', field.value ? 'border-bee-amber/20 bg-bee-amber/5' : 'border-slate-100 bg-slate-50/30')}>
                                            <div>
                                                <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                                    <ShieldCheck className="h-3 w-3" /> Acesso ao Sistema
                                                </FormLabel>
                                                <p className="text-xs font-semibold text-bee-midnight">Criar credenciais de acesso</p>
                                            </div>
                                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-bee-amber" /></FormControl>
                                        </FormItem>
                                    )} />

                                    {hasSystemAccess && (
                                        <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                                            <FormField control={form.control} name="email" render={({ field }) => (
                                                <FormItem className="space-y-1.5">
                                                    <FormLabel className={labelCls}>E-mail de acesso *</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                            <Input type="email" placeholder="instrutor@exemplo.com" className={cn(fieldCls, 'pl-9')} {...field} />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />

                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField control={form.control} name="password" render={({ field }) => (
                                                    <FormItem className="space-y-1.5">
                                                        <FormLabel className={labelCls}>Senha *</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                                <Input type="password" placeholder="••••••" className={cn(fieldCls, 'pl-9')} {...field} />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />

                                                <FormField control={form.control} name="roleId" render={({ field }) => (
                                                    <FormItem className="space-y-1.5">
                                                        <FormLabel className={labelCls}>Perfil *</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className={fieldCls}>
                                                                    <SelectValue placeholder="Selecione…" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                                                {roles.map(r => (
                                                                    <SelectItem key={r.id} value={r.id} className="py-2.5 focus:bg-bee-amber/10 rounded-lg mx-1 my-0.5 font-medium">
                                                                        {r.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {mode === 'edit' && (
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                                    <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                                        <Lock className="h-3 w-3 text-slate-500" />
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight leading-relaxed">
                                        Para alterar o acesso ao sistema, utilize o menu <strong>Equipe</strong> nas configurações principais.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="px-6 pb-5 pt-4 border-t border-slate-100 flex items-center justify-between bg-white shrink-0">
                            <Button 
                                type="button" 
                                variant="ghost" 
                                onClick={handleCloseAttempt} 
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
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        {mode === 'create' ? 'Cadastrar Instrutor' : 'Salvar alterações'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
                </DialogContent>
            </Dialog>

            <ConfirmDiscardDialog 
                open={showDiscardDialog}
                onOpenChange={setShowDiscardDialog}
                onConfirm={() => {
                    setShowDiscardDialog(false);
                    onOpenChange(false);
                }}
            />
        </>
    );
}
