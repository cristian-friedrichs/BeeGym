'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger } from '@/components/ui/sheet';
import {
    Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { UserPlus, Info, Loader2, Save, X, Check, Mail, Lock, Briefcase, Shield } from 'lucide-react';
import { createTeamMemberAction } from '@/actions/team';
import { getRolesAction } from '@/actions/roles';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { AppRole } from '@/types/permissions';

const formSchema = z.object({
    fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    jobTitle: z.string().optional(),
    isInstructor: z.boolean().default(false),
    hasSystemAccess: z.boolean().default(true),
    roleId: z.string().optional(),
    email: z.string().optional(),
    password: z.string().optional(),
}).refine((data) => {
    if (data.hasSystemAccess) {
        return data.email && data.email.length > 0 && data.password && data.password.length >= 6;
    }
    return true;
}, {
    message: "Email e senha são obrigatórios quando o acesso ao sistema está habilitado",
    path: ["email"],
}).refine((data) => {
    if (data.hasSystemAccess && data.email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
    }
    return true;
}, {
    message: "Email inválido",
    path: ["email"],
}).refine((data) => {
    if (data.hasSystemAccess) {
        return data.roleId && data.roleId.length > 0;
    }
    return true;
}, {
    message: "Selecione um perfil de permissões",
    path: ["roleId"],
});

interface AddMemberModalProps {
    organizationId: string;
}

export function AddMemberModal({ organizationId }: AddMemberModalProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [roles, setRoles] = useState<AppRole[]>([]);
    const [isLoadingRoles, setIsLoadingRoles] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: '', jobTitle: '', email: '', password: '',
            isInstructor: false, hasSystemAccess: true, roleId: '',
        },
    });

    const hasSystemAccess = form.watch('hasSystemAccess');

    useEffect(() => {
        if (open) {
            setIsLoadingRoles(true);
            getRolesAction().then((result) => {
                if (result.success && result.data) setRoles(result.data as AppRole[]);
                setIsLoadingRoles(false);
            });
        }
    }, [open]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            const result = await createTeamMemberAction({
                fullName: values.fullName, email: values.email, password: values.password,
                role: 'STAFF', roleId: values.roleId || undefined, organizationId,
                hasSystemAccess: values.hasSystemAccess, isInstructor: values.isInstructor,
            });

            if (result.success) {
                toast({ title: 'Sucesso', description: 'Membro da equipe criado com sucesso!' });
                setOpen(false);
                setTimeout(() => { router.refresh(); form.reset(); }, 300);
            } else {
                toast({ title: 'Erro', description: result.error || 'Erro ao criar membro da equipe', variant: 'destructive' });
            }
        } catch {
            toast({ title: 'Erro', description: 'Ocorreu um erro inesperado', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button className="gap-2 bg-bee-amber hover:bg-amber-500 text-bee-midnight font-bold rounded-full uppercase text-sm shadow-lg shadow-bee-amber/10 hover:-translate-y-0.5 active:scale-95 transition-all">
                    <UserPlus className="h-4 w-4" />
                    Adicionar Membro
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="sm:max-w-2xl p-0 overflow-hidden border-l border-slate-100 shadow-2xl flex flex-col h-full bg-white">
                <SheetHeader className="p-8 border-b relative overflow-hidden shrink-0 bg-white">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-bee-amber/[0.03] rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />

                    <div className="flex items-center gap-5 relative text-left">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-bee-amber/10 bg-bee-amber/5 text-bee-amber shadow-inner">
                            <UserPlus className="h-8 w-8" />
                        </div>
                        <div className="space-y-1">
                            <SheetTitle className="text-2xl font-bold font-display tracking-tight text-bee-midnight leading-tight">
                                Novo Membro
                            </SheetTitle>
                            <SheetDescription className="flex items-center gap-2 text-sm font-medium text-slate-500">
                                <Badge variant="outline" className="bg-bee-amber/10 text-bee-amber border-bee-amber/30 font-bold uppercase tracking-wider text-[10px] px-2.5 py-0.5 rounded-full font-sans">
                                    Equipe
                                </Badge>
                                <span>Adicione um novo colaborador à sua organização</span>
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
                        <div className="flex-1 overflow-y-auto py-8">
                            <div className="px-8 space-y-8">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-bee-amber/10 flex items-center justify-center">
                                            <UserPlus className="h-4 w-4 text-bee-amber" />
                                        </div>
                                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Dados do Colaborador</h3>
                                    </div>

                                    <div className="grid grid-cols-1 gap-5">
                                        <FormField control={form.control} name="fullName"
                                            render={({ field }) => (
                                                <FormItem className="space-y-2">
                                                    <FormLabel className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Nome Completo</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                            <Input
                                                                placeholder="Ex: João Silva"
                                                                {...field}
                                                                className="h-11 pl-11 border-slate-100 bg-slate-50/50 rounded-xl focus:ring-2 focus:ring-bee-amber/10 focus:border-bee-amber/30 transition-all font-medium"
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage className="text-xs font-bold" />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField control={form.control} name="jobTitle"
                                            render={({ field }) => (
                                                <FormItem className="space-y-2">
                                                    <FormLabel className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Cargo / Título (Crachá)</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                            <Input
                                                                placeholder="Ex: Recepcionista, Personal Trainer"
                                                                {...field}
                                                                className="h-11 pl-11 border-slate-100 bg-slate-50/50 rounded-xl focus:ring-2 focus:ring-bee-amber/10 focus:border-bee-amber/30 transition-all font-medium"
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormDescription className="text-[10px] font-medium text-slate-400 ml-1">Texto livre para identificação visual. Não afeta permissões.</FormDescription>
                                                    <FormMessage className="text-xs font-bold" />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                                            <FormField control={form.control} name="isInstructor"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center justify-between rounded-2xl border border-slate-100 p-4 bg-slate-50/30">
                                                        <div className="space-y-0.5">
                                                            <FormLabel className="text-sm font-bold text-bee-midnight leading-none">Instrutor</FormLabel>
                                                            <FormDescription className="text-[10px] font-medium text-slate-400">Pode ministrar aulas</FormDescription>
                                                        </div>
                                                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-bee-amber" /></FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField control={form.control} name="hasSystemAccess"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center justify-between rounded-2xl border border-bee-amber/10 p-4 bg-bee-amber/[0.02]">
                                                        <div className="space-y-0.5">
                                                            <FormLabel className="text-sm font-bold text-bee-midnight leading-none">Acesso Sistema</FormLabel>
                                                            <FormDescription className="text-[10px] font-medium text-slate-400">Permitir login</FormDescription>
                                                        </div>
                                                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-bee-amber" /></FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {hasSystemAccess && (
                                    <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-bee-amber/10 flex items-center justify-center">
                                                <Lock className="h-4 w-4 text-bee-amber" />
                                            </div>
                                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Credenciais e Permissões</h3>
                                        </div>

                                        <div className="grid grid-cols-1 gap-5">
                                            <FormField control={form.control} name="roleId"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-2">
                                                        <FormLabel className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Perfil de Permissões</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="h-11 border-slate-100 bg-slate-50/50 rounded-xl focus:ring-2 focus:ring-bee-amber/10 focus:border-bee-amber/30 transition-all font-medium">
                                                                    <div className="flex items-center gap-2">
                                                                        <Shield className="h-4 w-4 text-slate-400" />
                                                                        <SelectValue placeholder={isLoadingRoles ? 'Carregando perfis...' : 'Selecione o perfil...'} />
                                                                    </div>
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent className="rounded-xl border-slate-100">
                                                                {roles.length === 0 && !isLoadingRoles ? (
                                                                    <div className="py-8 px-4 text-center space-y-2">
                                                                        <p className="text-sm font-bold text-slate-400">Nenhum perfil criado</p>
                                                                        <p className="text-[10px] uppercase font-bold text-bee-amber">Configurações {'>'} Perfis</p>
                                                                    </div>
                                                                ) : (
                                                                    roles.map((role) => (
                                                                        <SelectItem key={role.id} value={role.id} className="rounded-lg font-medium py-3">
                                                                            {role.name}
                                                                        </SelectItem>
                                                                    ))
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormDescription className="text-[10px] font-medium text-slate-400 ml-1">Define o que este membro pode acessar no sistema.</FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <FormField control={form.control} name="email"
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-2">
                                                            <FormLabel className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Email Profissional</FormLabel>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                                    <Input
                                                                        placeholder="joao@exemplo.com"
                                                                        {...field}
                                                                        className="h-11 pl-11 border-slate-100 bg-slate-50/50 rounded-xl focus:ring-2 focus:ring-bee-amber/10 focus:border-bee-amber/30 transition-all font-medium"
                                                                    />
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField control={form.control} name="password"
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-2">
                                                            <FormLabel className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Senha Temporária</FormLabel>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                                    <Input
                                                                        type="password"
                                                                        placeholder="Min. 6 caracteres"
                                                                        {...field}
                                                                        className="h-11 pl-11 border-slate-100 bg-slate-50/50 rounded-xl focus:ring-2 focus:ring-bee-amber/10 focus:border-bee-amber/30 transition-all font-medium"
                                                                    />
                                                                </div>
                                                            </FormControl>
                                                            <FormDescription className="text-[10px] font-medium text-slate-400 ml-1">Usuário será obrigado a trocar no primeiro login.</FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <Alert className="bg-bee-amber/5 border-bee-amber/10 rounded-2xl p-4 flex items-start gap-3">
                                                <div className="h-6 w-6 rounded-full bg-bee-amber/10 flex items-center justify-center shrink-0 mt-0.5">
                                                    <Info className="h-3 w-3 text-bee-amber" />
                                                </div>
                                                <AlertDescription className="text-[11px] leading-relaxed font-bold text-bee-amber/80 uppercase tracking-tight">
                                                    O usuário receberá uma senha temporária e será solicitado a alterá-la no primeiro acesso.
                                                </AlertDescription>
                                            </Alert>
                                        </div>
                                    </div>
                                )}

                                {!hasSystemAccess && (
                                    <Alert className="bg-slate-50 border-slate-100 rounded-2xl p-4 flex items-start gap-3 animate-in slide-in-from-top-4 duration-500">
                                        <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                                            <Info className="h-3 w-3 text-slate-500" />
                                        </div>
                                        <AlertDescription className="text-[11px] leading-relaxed font-bold text-slate-400 uppercase tracking-tight">
                                            Este funcionário será cadastrado apenas como registro. Ele não poderá fazer login no sistema.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        </div>

                        <SheetFooter className="p-8 border-t bg-slate-50/50 flex flex-row items-center gap-3 shrink-0 sm:justify-end">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setOpen(false)}
                                disabled={isSubmitting}
                                className="flex-1 sm:flex-none text-slate-500 hover:bg-slate-100 font-bold h-10 rounded-full uppercase text-xs"
                            >
                                <X className="mr-2 h-4 w-4" />
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 sm:flex-none bg-bee-amber hover:bg-amber-500 text-bee-midnight font-black h-10 rounded-full shadow-lg shadow-bee-amber/20 transition-all hover:-translate-y-0.5 active:scale-95 uppercase text-xs px-8"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Check className="mr-2 h-4 w-4" />
                                        Salvar Membro
                                    </>
                                )}
                            </Button>
                        </SheetFooter>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}
