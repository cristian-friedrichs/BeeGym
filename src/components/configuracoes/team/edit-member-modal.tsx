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
import { Button } from '@/components/ui/button';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, X, UserCog, Briefcase, Shield, Info, Check, UserPlus, Lock } from 'lucide-react';
import { updateTeamMemberAction } from '@/actions/team';
import { getRolesAction } from '@/actions/roles';
import type { AppRole } from '@/types/permissions';

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

export function EditMemberModal({ open, onOpenChange, member, organizationId }: EditMemberModalProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
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

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[550px] p-0 flex flex-col h-full overflow-hidden border-l border-slate-100">
                <SheetHeader className="relative p-8 overflow-hidden shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-bee-midnight via-bee-midnight to-slate-900" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-bee-amber/10 rounded-full -translate-y-16 translate-x-16 blur-2xl" />

                    <div className="relative space-y-4">
                        <div className="flex items-center justify-between">
                            <Badge className="bg-bee-amber text-bee-midnight border-none font-black text-[10px] uppercase tracking-tighter px-2.5 py-0.5 rounded-md">
                                Edição de Cadastro
                            </Badge>
                            <UserCog className="h-5 w-5 text-bee-amber/50" />
                        </div>

                        <div className="space-y-1">
                            <SheetTitle className="text-2xl font-black text-white uppercase tracking-tight leading-none">
                                {member?.name || 'Membro do Time'}
                            </SheetTitle>
                            <SheetDescription className="text-slate-400 font-medium text-sm">
                                Gerencie as informações e permissões do colaborador.
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

                                        <FormField control={form.control} name="isInstructor"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-2xl border border-slate-100 p-4 bg-slate-50/30">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-sm font-bold text-bee-midnight leading-none">Instrutor Ativo</FormLabel>
                                                        <FormDescription className="text-[10px] font-medium text-slate-400">Habilitar na agenda de aulas</FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-bee-amber" />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                {member?.has_system_access && (
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
                                                        <Select onValueChange={field.onChange} value={field.value}>
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
                                                        <FormDescription className="text-[10px] font-medium text-slate-400 ml-1">Define as permissões de acesso ao sistema.</FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <Alert className="bg-bee-amber/5 border-bee-amber/10 rounded-2xl p-4 flex items-start gap-3">
                                                <div className="h-6 w-6 rounded-full bg-bee-amber/10 flex items-center justify-center shrink-0 mt-0.5">
                                                    <Info className="h-3 w-3 text-bee-amber" />
                                                </div>
                                                <AlertDescription className="text-[11px] leading-relaxed font-bold text-bee-amber/80 uppercase tracking-tight">
                                                    As alterações de permissão entrarão em vigor no próximo login do colaborador.
                                                </AlertDescription>
                                            </Alert>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <SheetFooter className="p-8 border-t bg-slate-50/50 flex flex-row items-center gap-3 shrink-0 sm:justify-end">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                                className="flex-1 sm:flex-none text-slate-500 hover:bg-slate-100 font-bold h-10 rounded-full uppercase text-xs"
                            >
                                <X className="mr-2 h-4 w-4" />
                                Cancelar
                            </Button>
                            <Button
                                onClick={form.handleSubmit(onSubmit)}
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
                                        Salvar Alterações
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
