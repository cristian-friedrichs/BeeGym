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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Mail, Lock, ShieldCheck } from 'lucide-react';
import { createInstructorAction, updateInstructorAction } from '@/actions/instructors';
import { cn } from '@/lib/utils';

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

const fieldCls = 'h-9 rounded-xl border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:border-bee-amber focus:ring-2 focus:ring-bee-amber/20 focus:ring-offset-0';
const labelCls = 'text-sm font-medium text-slate-700';

export function InstructorFormSheet({ open, onOpenChange, mode, units, roles, instructor }: Props) {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { fullName: '', bio: '', allowedUnitIds: [], hasSystemAccess: false, email: '', password: '', roleId: '' },
    });

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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[540px] p-0 gap-0 rounded-2xl overflow-hidden">

                <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100">
                    <DialogTitle className="text-[17px] font-semibold text-slate-900 leading-tight">
                        {mode === 'create' ? 'Adicionar Instrutor(a)' : (instructor?.name ?? 'Editar Instrutor')}
                    </DialogTitle>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {mode === 'create' ? 'Cadastre um instrutor com ou sem acesso ao sistema.' : 'Atualize os dados deste instrutor.'}
                    </p>
                </DialogHeader>

                <Form {...form}>
                    <form id="instructor-form" onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">

                            <FormField control={form.control} name="fullName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={labelCls}>Nome completo *</FormLabel>
                                    <FormControl><Input placeholder="Ex: Marcos Andrade" className={fieldCls} {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="bio" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={labelCls}>Bio / Especialidades</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Ex: Especialista em musculação, 10 anos de experiência…" className="rounded-xl border-slate-200 bg-white text-sm resize-none placeholder:text-slate-400 focus:border-bee-amber focus:ring-2 focus:ring-bee-amber/20" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            {units.length > 0 && (
                                <div className="space-y-2">
                                    <p className={labelCls}>Unidades onde atua</p>
                                    <p className="text-xs text-slate-400">Deixe em branco para permitir todas as unidades.</p>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {units.map(unit => {
                                            const checked = (allowedUnitIds ?? []).includes(unit.id);
                                            return (
                                                <label key={unit.id} className={cn('flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors', checked ? 'border-bee-amber/30 bg-bee-amber/5' : 'border-slate-200 hover:border-slate-300')}>
                                                    <Checkbox checked={checked} onCheckedChange={c => toggleUnit(unit.id, c === true)} className="data-[state=checked]:bg-bee-amber data-[state=checked]:border-bee-amber" />
                                                    <span className="text-sm text-slate-700">{unit.name}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {mode === 'create' && (
                                <div className="space-y-4 pt-2">
                                    <hr className="border-slate-100" />
                                    <FormField control={form.control} name="hasSystemAccess" render={({ field }) => (
                                        <FormItem className="flex items-start gap-3 rounded-xl border border-slate-200 px-4 py-3">
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-bee-amber mt-0.5" />
                                            </FormControl>
                                            <div>
                                                <FormLabel className="text-sm font-medium text-slate-700 flex items-center gap-1.5 mb-0.5">
                                                    <ShieldCheck className="h-4 w-4 text-bee-amber" /> Acesso ao sistema
                                                </FormLabel>
                                                <FormDescription className="text-xs text-slate-400">Cria um usuário com e-mail e senha para entrar no app.</FormDescription>
                                            </div>
                                        </FormItem>
                                    )} />

                                    {hasSystemAccess && (
                                        <div className="space-y-4 animate-in fade-in duration-200">
                                            <FormField control={form.control} name="email" render={({ field }) => (
                                                <FormItem>
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
                                            <div className="grid grid-cols-2 gap-3">
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
                                                <FormField control={form.control} name="roleId" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className={labelCls}>Perfil de acesso *</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl><SelectTrigger className={fieldCls}><SelectValue placeholder={roles.length === 0 ? 'Nenhum perfil' : 'Selecione…'} /></SelectTrigger></FormControl>
                                                            <SelectContent>
                                                                {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
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
                                <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">
                                    Para alterar acesso ao sistema, edite o membro pela página <strong>Equipe</strong>.
                                </p>
                            )}
                        </div>

                        <div className="px-6 pb-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}
                                className="h-9 rounded-full px-5 border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting}
                                className="h-9 rounded-full px-6 bg-bee-amber hover:bg-amber-500 text-bee-midnight font-semibold text-sm shadow-sm">
                                {isSubmitting
                                    ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Salvando…</>
                                    : mode === 'create' ? 'Cadastrar instrutor' : 'Salvar alterações'
                                }
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
