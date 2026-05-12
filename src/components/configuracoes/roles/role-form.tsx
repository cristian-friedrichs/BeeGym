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
            <form id={formId} onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">

                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700">Nome do perfil *</FormLabel>
                        <FormControl>
                            <Input placeholder='Ex: Recepção, Estagiário…' className="h-9 rounded-xl border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:border-bee-amber focus:ring-2 focus:ring-bee-amber/20 focus:ring-offset-0" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700">Descrição</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Descreva brevemente o que este perfil pode fazer…" className="rounded-xl border-slate-200 bg-white text-sm resize-none placeholder:text-slate-400 focus:border-bee-amber focus:ring-2 focus:ring-bee-amber/20" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <hr className="border-slate-100" />
                <p className="text-sm font-semibold text-slate-700">Permissões</p>

                <div className="space-y-3">
                    {PERMISSION_MODULES.map((module) => {
                        const allEnabled = isModuleFullyEnabled(module.key);
                        return (
                            <Card key={module.key} className="overflow-hidden border-slate-200 shadow-none rounded-xl">
                                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">{module.label}</p>
                                        <p className="text-xs text-slate-400">{module.description}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-400">Todos</span>
                                        <Switch checked={allEnabled} onCheckedChange={val => toggleAllModule(module.key, val)} className="data-[state=checked]:bg-bee-amber" />
                                    </div>
                                </div>
                                <CardContent className="px-4 py-3 grid grid-cols-2 gap-2">
                                    {module.actions.map((action) => {
                                        const checked = (permissions[module.key] as any)?.[action.key] === true;
                                        return (
                                            <label key={action.key} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 cursor-pointer hover:border-bee-amber/30 transition-colors">
                                                <span className="text-xs font-medium text-slate-600">{action.label}</span>
                                                <Switch checked={checked} onCheckedChange={val => togglePermission(module.key, action.key, val)} className="scale-90 data-[state=checked]:bg-bee-amber" />
                                            </label>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {showButtons && (
                    <div className="flex justify-end pt-2">
                        <Button type="submit" disabled={isLoading} className="h-9 rounded-full px-6 bg-bee-amber hover:bg-amber-500 text-bee-midnight font-semibold text-sm shadow-sm">
                            {isLoading ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Salvando…</> : initialData ? 'Salvar alterações' : 'Criar perfil'}
                        </Button>
                    </div>
                )}
            </form>
        </Form>
    );
}
