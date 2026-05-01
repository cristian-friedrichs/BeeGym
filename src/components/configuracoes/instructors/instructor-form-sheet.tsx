'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import {
    Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Loader2, Save, X, Mail, Lock, ShieldCheck } from 'lucide-react';
import { createInstructorAction, updateInstructorAction } from '@/actions/instructors';

const formSchema = z.object({
    fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    bio: z.string().optional(),
    allowedUnitIds: z.array(z.string()).default([]),
    hasSystemAccess: z.boolean().default(false),
    email: z.string().optional(),
    password: z.string().optional(),
    roleId: z.string().optional(),
}).refine((data) => {
    if (data.hasSystemAccess) {
        return !!data.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
    }
    return true;
}, { message: 'E-mail válido é obrigatório.', path: ['email'] })
.refine((data) => {
    if (data.hasSystemAccess) {
        return !!data.password && data.password.length >= 6;
    }
    return true;
}, { message: 'Senha de no mínimo 6 caracteres.', path: ['password'] })
.refine((data) => {
    if (data.hasSystemAccess) {
        return !!data.roleId;
    }
    return true;
}, { message: 'Selecione um perfil de acesso.', path: ['roleId'] });

type FormValues = z.infer<typeof formSchema>;

interface Unit { id: string; name: string }
interface AppRole { id: string; name: string }

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'create' | 'edit';
    units: Unit[];
    roles: AppRole[];
    instructor?: {
        id: string;
        name: string | null;
        bio: string | null;
        allowed_unit_ids: string[] | null;
        has_system_access: boolean;
        email: string | null;
    } | null;
}

export function InstructorFormSheet({ open, onOpenChange, mode, units, roles, instructor }: Props) {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: '',
            bio: '',
            allowedUnitIds: [],
            hasSystemAccess: false,
            email: '',
            password: '',
            roleId: '',
        },
    });

    // Reset form whenever the sheet opens with a different instructor / mode
    useEffect(() => {
        if (!open) return;
        if (mode === 'edit' && instructor) {
            form.reset({
                fullName: instructor.name ?? '',
                bio: instructor.bio ?? '',
                allowedUnitIds: instructor.allowed_unit_ids ?? [],
                hasSystemAccess: instructor.has_system_access,
                email: instructor.email ?? '',
                password: '',
                roleId: '',
            });
        } else {
            form.reset({
                fullName: '', bio: '', allowedUnitIds: [],
                hasSystemAccess: false, email: '', password: '', roleId: '',
            });
        }
    }, [open, mode, instructor, form]);

    const hasSystemAccess = form.watch('hasSystemAccess');
    const allowedUnitIds = form.watch('allowedUnitIds');

    const toggleUnit = (id: string, checked: boolean) => {
        const current = form.getValues('allowedUnitIds') ?? [];
        if (checked) {
            form.setValue('allowedUnitIds', Array.from(new Set([...current, id])));
        } else {
            form.setValue('allowedUnitIds', current.filter(x => x !== id));
        }
    };

    const onSubmit = async (values: FormValues) => {
        setIsSubmitting(true);
        try {
            if (mode === 'create') {
                const result = await createInstructorAction({
                    fullName: values.fullName,
                    bio: values.bio,
                    allowedUnitIds: values.allowedUnitIds,
                    hasSystemAccess: values.hasSystemAccess,
                    email: values.email,
                    password: values.password,
                    role: 'INSTRUCTOR',
                    roleId: values.roleId,
                });
                if (!result.success) {
                    toast({ title: 'Erro', description: result.error, variant: 'destructive' });
                    return;
                }
                toast({ title: 'Instrutor criado com sucesso' });
            } else if (mode === 'edit' && instructor) {
                const result = await updateInstructorAction(instructor.id, {
                    fullName: values.fullName,
                    bio: values.bio,
                    allowedUnitIds: values.allowedUnitIds,
                });
                if (!result.success) {
                    toast({ title: 'Erro', description: result.error, variant: 'destructive' });
                    return;
                }
                toast({ title: 'Instrutor atualizado' });
            }

            onOpenChange(false);
            router.refresh();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-xl p-0 overflow-hidden border-l border-slate-100 shadow-2xl flex flex-col h-full">
                <SheetHeader className="relative p-8 bg-gradient-to-br from-bee-midnight via-bee-midnight to-slate-900 border-none shrink-0 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-bee-amber/10 blur-3xl rounded-full -mr-16 -mt-16" />
                    <div className="relative flex items-center gap-5">
                        <div className="h-16 w-16 rounded-[22px] bg-bee-amber/10 flex items-center justify-center ring-1 ring-bee-amber/20">
                            <GraduationCap className="h-8 w-8 text-bee-amber" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <SheetTitle className="text-2xl font-black text-white tracking-tight">
                                    {mode === 'create' ? 'Novo Instrutor' : (instructor?.name ?? 'Editar Instrutor')}
                                </SheetTitle>
                                <Badge className="bg-bee-amber text-bee-midnight border-none font-black uppercase text-[10px] tracking-tighter h-5 px-2">
                                    {mode === 'create' ? 'Cadastro' : 'Atualizar'}
                                </Badge>
                            </div>
                            <SheetDescription className="text-slate-400 font-medium">
                                {mode === 'create'
                                    ? 'Cadastre um instrutor com ou sem acesso ao sistema.'
                                    : 'Atualize os dados deste instrutor.'}
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <Form {...form}>
                    <form id="instructor-form" onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-8 pt-6 space-y-6">
                            <FormField
                                control={form.control}
                                name="fullName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nome completo</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Marcos Andrade" className="h-12 rounded-2xl bg-slate-50/50 border-slate-100" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="bio"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Bio / Especialidades (opcional)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Ex: Especialista em musculação, 10 anos de experiência..."
                                                className="min-h-[80px] rounded-2xl bg-slate-50/50 border-slate-100 resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Unidades permitidas */}
                            {units.length > 0 && (
                                <div className="space-y-3">
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        Unidades onde atua
                                    </FormLabel>
                                    <FormDescription className="text-[11px] text-slate-500">
                                        Deixe em branco para permitir todas as unidades.
                                    </FormDescription>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {units.map(unit => {
                                            const checked = (allowedUnitIds ?? []).includes(unit.id);
                                            return (
                                                <label
                                                    key={unit.id}
                                                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-amber-50/40 hover:border-bee-amber/30 transition-colors cursor-pointer"
                                                >
                                                    <Checkbox
                                                        checked={checked}
                                                        onCheckedChange={(c) => toggleUnit(unit.id, c === true)}
                                                        className="data-[state=checked]:bg-bee-amber data-[state=checked]:border-bee-amber"
                                                    />
                                                    <span className="text-sm font-medium text-slate-700">{unit.name}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Acesso ao sistema (apenas no create) */}
                            {mode === 'create' && (
                                <div className="border-t border-slate-100 pt-6 space-y-5">
                                    <FormField
                                        control={form.control}
                                        name="hasSystemAccess"
                                        render={({ field }) => (
                                            <FormItem className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/40">
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        className="data-[state=checked]:bg-bee-amber"
                                                    />
                                                </FormControl>
                                                <div className="flex-1">
                                                    <FormLabel className="text-sm font-bold text-bee-midnight flex items-center gap-2 mb-1">
                                                        <ShieldCheck className="h-4 w-4 text-bee-amber" />
                                                        Permitir acesso ao sistema
                                                    </FormLabel>
                                                    <FormDescription className="text-[11px] text-slate-500">
                                                        Se ativado, será criado um usuário com e-mail e senha para o instrutor entrar no app.
                                                    </FormDescription>
                                                </div>
                                            </FormItem>
                                        )}
                                    />

                                    {hasSystemAccess && (
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <FormField
                                                control={form.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem className="sm:col-span-2">
                                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">E-mail de acesso</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                                <Input type="email" placeholder="instrutor@exemplo.com" className="pl-11 h-12 rounded-2xl bg-slate-50/50 border-slate-100" {...field} />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="password"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Senha temporária</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                                <Input type="password" placeholder="Mín. 6 caracteres" className="pl-11 h-12 rounded-2xl bg-slate-50/50 border-slate-100" {...field} />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="roleId"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Perfil de acesso</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="h-12 rounded-2xl bg-slate-50/50 border-slate-100">
                                                                    <SelectValue placeholder={roles.length === 0 ? 'Nenhum perfil cadastrado' : 'Selecione um perfil'} />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {roles.map(r => (
                                                                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormDescription className="text-[11px] text-slate-500">
                                                            Cadastre perfis em <strong>Perfis de Acesso</strong> antes de dar acesso ao sistema.
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {mode === 'edit' && (
                                <div className="border-t border-slate-100 pt-6">
                                    <p className="text-[11px] text-slate-500">
                                        Para alterar acesso ao sistema (e-mail/senha/perfil), edite o membro pela página <strong>Equipe</strong>.
                                    </p>
                                </div>
                            )}
                        </div>

                        <SheetFooter className="p-8 border-t bg-white flex items-center gap-3 shrink-0 sm:justify-end sticky bottom-0 z-30">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                className="flex-1 sm:flex-none text-slate-400 hover:text-slate-600 hover:bg-slate-100 font-black h-12 rounded-full uppercase text-[10px] tracking-widest"
                            >
                                <X className="mr-2 h-4 w-4" /> Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 sm:flex-none bg-bee-amber hover:bg-amber-500 text-bee-midnight font-black h-12 rounded-full shadow-lg shadow-bee-amber/20 transition-all uppercase text-[10px] tracking-widest px-10"
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
                                ) : (
                                    <><Save className="mr-2 h-4 w-4" /> {mode === 'create' ? 'Cadastrar' : 'Salvar'}</>
                                )}
                            </Button>
                        </SheetFooter>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}
