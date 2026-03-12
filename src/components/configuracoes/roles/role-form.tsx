'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import {
    Shield,
    AlignLeft,
    Check,
    ChevronRight,
} from 'lucide-react';
import {
    type Permissions,
    type AppRole,
    DEFAULT_PERMISSIONS,
    PERMISSION_MODULES,
} from '@/types/permissions';

const formSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface RoleFormProps {
    onSubmit: (data: { name: string; description?: string; permissions: Permissions }) => Promise<void>;
    initialData?: AppRole | null;
    isLoading?: boolean;
    showButtons?: boolean;
    formId?: string;
    open?: boolean; // Kept for reset logic
}

export function RoleForm({ onSubmit, initialData, isLoading: externalIsLoading, showButtons = true, formId, open }: RoleFormProps) {
    const router = useRouter();
    const [internalIsSubmitting, setInternalIsSubmitting] = useState(false);
    const isLoading = externalIsLoading || internalIsSubmitting;
    const [permissions, setPermissions] = useState<Permissions>(DEFAULT_PERMISSIONS);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            description: '',
        },
    });

    useEffect(() => {
        if (initialData) {
            form.reset({
                name: initialData.name,
                description: initialData.description || '',
            });
            setPermissions(initialData.permissions || DEFAULT_PERMISSIONS);
        } else {
            form.reset({ name: '', description: '' });
            setPermissions(DEFAULT_PERMISSIONS);
        }
    }, [initialData, form, open]);

    function togglePermission(moduleKey: keyof Permissions, actionKey: string, value: boolean) {
        setPermissions((prev) => ({
            ...prev,
            [moduleKey]: {
                ...prev[moduleKey],
                [actionKey]: value,
            },
        }));
    }

    function toggleAllModule(moduleKey: keyof Permissions, value: boolean) {
        const module = PERMISSION_MODULES.find((m) => m.key === moduleKey);
        if (!module) return;
        const updated: Record<string, boolean> = {};
        module.actions.forEach((a) => {
            updated[a.key] = value;
        });
        setPermissions((prev) => ({
            ...prev,
            [moduleKey]: updated,
        }));
    }

    function isModuleFullyEnabled(moduleKey: keyof Permissions): boolean {
        const module = PERMISSION_MODULES.find((m) => m.key === moduleKey);
        if (!module) return false;
        return module.actions.every((a) => (permissions[moduleKey] as any)?.[a.key] === true);
    }

    async function handleFormSubmit(values: FormValues) {
        setInternalIsSubmitting(true);
        try {
            await onSubmit({
                name: values.name,
                description: values.description,
                permissions,
            });
        } finally {
            setInternalIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form id={formId} onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                <div className="grid gap-8 p-1">
                    {/* Identificação do Perfil */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
                            <div className="h-2 w-2 rounded-full bg-bee-amber shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Identificação do Perfil</h3>
                        </div>

                        <div className="grid gap-5">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nome do Perfil</FormLabel>
                                        <FormControl>
                                            <div className="group relative transition-all">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-bee-amber transition-colors">
                                                    <Shield className="h-4 w-4" />
                                                </div>
                                                <Input
                                                    placeholder='Ex: "Recepção", "Estagiário"'
                                                    className="pl-11 h-12 bg-slate-50/50 border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-bee-amber/5 focus:border-bee-amber/20 transition-all font-medium placeholder:text-slate-400"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-[10px] font-bold text-red-500 ml-1" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Descrição (Opcional)</FormLabel>
                                        <FormControl>
                                            <div className="group relative transition-all">
                                                <div className="absolute left-4 top-4 text-slate-400 group-focus-within:text-bee-amber transition-colors">
                                                    <AlignLeft className="h-4 w-4" />
                                                </div>
                                                <Textarea
                                                    placeholder="Descreva brevemente o que este perfil pode fazer..."
                                                    className="pl-11 min-h-[80px] bg-slate-50/50 border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-bee-amber/5 focus:border-bee-amber/20 transition-all font-medium placeholder:text-slate-400 resize-none py-4"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-[10px] font-bold text-red-500 ml-1" />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    {/* Matriz de Permissões */}
                    <div className="space-y-6 pb-10">
                        <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
                            <div className="h-2 w-2 rounded-full bg-bee-amber shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Matriz de Permissões</h3>
                        </div>

                        <div className="grid gap-4">
                            {PERMISSION_MODULES.map((module) => {
                                const allEnabled = isModuleFullyEnabled(module.key);
                                return (
                                    <Card key={module.key} className="overflow-hidden border-slate-100 shadow-sm rounded-3xl transition-all hover:shadow-md group">
                                        <div className="p-5 bg-slate-50/50 group-hover:bg-white transition-colors border-b border-slate-100">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm ring-1 ring-slate-100 group-hover:ring-bee-amber/20 group-hover:bg-bee-amber/5 transition-all">
                                                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-bee-amber transition-colors" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-slate-900 leading-tight tracking-tight">
                                                            {module.label}
                                                        </h4>
                                                        <p className="text-[11px] text-slate-500 font-medium">
                                                            {module.description}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-2xl ring-1 ring-slate-100">
                                                    <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Todo Módulo</span>
                                                    <Switch
                                                        checked={allEnabled}
                                                        onCheckedChange={(val) => toggleAllModule(module.key, val)}
                                                        className="data-[state=checked]:bg-bee-amber"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <CardContent className="p-6 bg-white">
                                            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                                {module.actions.map((action) => {
                                                    const checked = (permissions[module.key] as any)?.[action.key] === true;
                                                    return (
                                                        <label
                                                            key={action.key}
                                                            className="flex items-center justify-between p-3 rounded-2xl bg-white ring-1 ring-slate-100 hover:ring-bee-amber/20 hover:bg-bee-amber/[0.02] cursor-pointer transition-all group/item"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`h-2 w-2 rounded-full transition-all ${checked ? 'bg-bee-amber scale-125' : 'bg-slate-200 group-hover/item:bg-slate-300'}`} />
                                                                <span className="text-[11px] font-bold text-slate-700">{action.label}</span>
                                                            </div>
                                                            <Switch
                                                                checked={checked}
                                                                onCheckedChange={(val) =>
                                                                    togglePermission(module.key, action.key, val)
                                                                }
                                                                className="scale-90 data-[state=checked]:bg-bee-amber"
                                                            />
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {showButtons && (
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : initialData ? (
                                'Salvar Alterações'
                            ) : (
                                'Criar Perfil'
                            )}
                        </Button>
                    </div>
                )}
            </form>
        </Form>
    );
}
