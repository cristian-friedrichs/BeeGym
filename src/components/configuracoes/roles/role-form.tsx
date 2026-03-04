'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: { name: string; description?: string; permissions: Permissions }) => Promise<void>;
    initialData?: AppRole | null;
}

export function RoleForm({ open, onOpenChange, onSubmit, initialData }: RoleFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
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
        setIsSubmitting(true);
        try {
            await onSubmit({
                name: values.name,
                description: values.description,
                permissions,
            });

            onOpenChange(false);

            setTimeout(() => {
                router.refresh();
            }, 300);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] h-[85vh] flex flex-col p-0">
                <div className="px-6 pt-6">
                    <DialogHeader>
                        <DialogTitle>
                            {initialData ? 'Editar Perfil de Acesso' : 'Novo Perfil de Acesso'}
                        </DialogTitle>
                        <DialogDescription>
                            Defina as permissões que este perfil terá no sistema.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col flex-1 min-h-0">
                        <div className="flex-1 overflow-y-auto px-6 space-y-6">
                            {/* Name & Description */}
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome do Perfil</FormLabel>
                                            <FormControl>
                                                <Input placeholder='Ex: "Recepção", "Estagiário"' {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Descrição (opcional)</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Descreva brevemente o que este perfil pode fazer..."
                                                    rows={2}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Permissions Matrix */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-foreground">Matriz de Permissões</h4>
                                {PERMISSION_MODULES.map((module) => {
                                    const allEnabled = isModuleFullyEnabled(module.key);
                                    return (
                                        <Card key={module.key} className="border">
                                            <CardHeader className="py-3 px-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <CardTitle className="text-sm font-medium">
                                                            {module.label}
                                                        </CardTitle>
                                                        <CardDescription className="text-xs">
                                                            {module.description}
                                                        </CardDescription>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-muted-foreground">Tudo</span>
                                                        <Switch
                                                            checked={allEnabled}
                                                            onCheckedChange={(val) => toggleAllModule(module.key, val)}
                                                        />
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="pt-0 px-4 pb-3">
                                                <div className="flex flex-wrap gap-4">
                                                    {module.actions.map((action) => {
                                                        const checked = (permissions[module.key] as any)?.[action.key] === true;
                                                        return (
                                                            <label
                                                                key={action.key}
                                                                className="flex items-center gap-2 cursor-pointer"
                                                            >
                                                                <Switch
                                                                    checked={checked}
                                                                    onCheckedChange={(val) =>
                                                                        togglePermission(module.key, action.key, val)
                                                                    }
                                                                />
                                                                <span className="text-sm">{action.label}</span>
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

                        <div className="px-6 pb-6 pt-4 border-t">
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? (
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
                            </DialogFooter>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
