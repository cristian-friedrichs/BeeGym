'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
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
import { UserPlus, Info, Loader2, Save, X } from 'lucide-react';
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
                <Button className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Adicionar Membro
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-[600px] flex flex-col h-full overflow-y-auto">
                <SheetHeader className="space-y-3 pb-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                            <UserPlus className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                            <SheetTitle className="text-xl">Novo Membro da Equipe</SheetTitle>
                            <SheetDescription>Adicione um novo colaborador à sua organização.</SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
                        <div className="flex-1 overflow-y-auto py-6 space-y-4">
                            <FormField control={form.control} name="fullName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-semibold text-slate-700">Nome Completo</FormLabel>
                                        <FormControl><Input placeholder="Ex: João Silva" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField control={form.control} name="jobTitle"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-semibold text-slate-700">Cargo / Título (Crachá)</FormLabel>
                                        <FormControl><Input placeholder="Ex: Recepcionista, Personal Trainer" {...field} /></FormControl>
                                        <FormDescription className="text-xs">Texto livre para identificação visual. Não afeta permissões.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField control={form.control} name="isInstructor"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-xl border p-3 shadow-sm">
                                        <div className="space-y-0.5">
                                            <FormLabel>Pode ministrar aulas?</FormLabel>
                                            <FormDescription className="text-xs">Habilitar este membro a ser selecionado como instrutor.</FormDescription>
                                        </div>
                                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField control={form.control} name="hasSystemAccess"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-xl border p-3 shadow-sm bg-muted/50">
                                        <div className="space-y-0.5">
                                            <FormLabel>Acesso ao Sistema</FormLabel>
                                            <FormDescription className="text-xs">Permitir que o usuário faça login no BeeGym.</FormDescription>
                                        </div>
                                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    </FormItem>
                                )}
                            />

                            {hasSystemAccess && (
                                <>
                                    <FormField control={form.control} name="roleId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-semibold text-slate-700">Perfil de Permissões</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-11 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-xl focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                                                            <SelectValue placeholder={isLoadingRoles ? 'Carregando perfis...' : 'Selecione (ex: Recepção, Gerente)...'} />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {roles.length === 0 && !isLoadingRoles ? (
                                                            <div className="py-3 px-2 text-center text-sm text-muted-foreground">
                                                                Nenhum perfil criado.<br />
                                                                <span className="text-xs">Crie em Configurações {'>'} Perfis de Acesso.</span>
                                                            </div>
                                                        ) : (
                                                            roles.map((role) => (
                                                                <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                                                            ))
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription className="text-xs">Define o que este membro pode acessar no sistema.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Alert>
                                        <Info className="h-4 w-4" />
                                        <AlertDescription className="text-xs">
                                            O usuário receberá uma senha temporária e será solicitado a alterá-la no primeiro acesso.
                                        </AlertDescription>
                                    </Alert>

                                    <FormField control={form.control} name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-semibold text-slate-700">Email Profissional</FormLabel>
                                                <FormControl><Input placeholder="joao@exemplo.com" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField control={form.control} name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-semibold text-slate-700">Senha Temporária</FormLabel>
                                                <FormControl><Input type="password" placeholder="Min. 6 caracteres" {...field} /></FormControl>
                                                <FormDescription className="text-xs">Usuário será obrigado a trocar no primeiro login.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </>
                            )}

                            {!hasSystemAccess && (
                                <Alert className="bg-muted">
                                    <Info className="h-4 w-4" />
                                    <AlertDescription className="text-xs">
                                        Este funcionário será cadastrado apenas como registro. Ele não poderá fazer login no sistema.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>

                        <SheetFooter className="mt-auto border-t pt-4 flex gap-3">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1 gap-2">
                                <X className="h-4 w-4" />
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold gap-2">
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Salvar Membro
                            </Button>
                        </SheetFooter>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}
