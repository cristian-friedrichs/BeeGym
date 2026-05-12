'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

const roomSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    unit_id: z.string().optional().default(''),
    capacity: z.coerce.number().min(0, 'Capacidade deve ser válida'),
    description: z.string().optional().or(z.literal('')),
});

export type RoomFormValues = z.infer<typeof roomSchema>;

interface RoomFormProps {
    initialData?: any;
    units?: Array<{ id: string; name: string }>;
    onSubmit: (values: RoomFormValues) => void;
    isLoading?: boolean;
    showButtons?: boolean;
    formId?: string;
}

const fieldCls = 'h-9 rounded-xl border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:border-bee-amber focus:ring-2 focus:ring-bee-amber/20 focus:ring-offset-0';
const labelCls = 'text-sm font-medium text-slate-700';

export function RoomForm({ initialData, units, onSubmit, isLoading, showButtons = true, formId }: RoomFormProps) {
    const form = useForm<RoomFormValues>({
        resolver: zodResolver(roomSchema),
        defaultValues: {
            name: initialData?.name || '',
            unit_id: initialData?.unit_id || '',
            capacity: initialData?.capacity || 10,
            description: initialData?.description || '',
        },
    });

    const [isUnlimited, setIsUnlimited] = useState(initialData?.capacity === 0);

    useEffect(() => {
        if (isUnlimited) { form.setValue('capacity', 0); form.clearErrors('capacity'); }
        else if (form.getValues('capacity') === 0) form.setValue('capacity', 10);
    }, [isUnlimited, form]);

    return (
        <Form {...form}>
            <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                        <FormLabel className={labelCls}>Nome da sala *</FormLabel>
                        <FormControl>
                            <Input placeholder="Ex: Sala de Bike Indoor" className={fieldCls} {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="capacity" render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center justify-between mb-1.5">
                            <FormLabel className={labelCls}>Capacidade máxima</FormLabel>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <Checkbox
                                    checked={isUnlimited}
                                    onCheckedChange={c => setIsUnlimited(c as boolean)}
                                    className="data-[state=checked]:bg-bee-amber data-[state=checked]:border-bee-amber"
                                />
                                <span className="text-sm text-slate-500">Ilimitado</span>
                            </label>
                        </div>
                        <FormControl>
                            <Input
                                type="number"
                                placeholder="Ex: 15"
                                className={fieldCls}
                                {...field}
                                disabled={isUnlimited}
                                onChange={e => field.onChange(Number(e.target.value))}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                        <FormLabel className={labelCls}>Descrição</FormLabel>
                        <FormControl>
                            <Textarea
                                placeholder="Equipamentos ou características desta sala…"
                                className="rounded-xl border-slate-200 bg-white text-sm resize-none placeholder:text-slate-400 focus:border-bee-amber focus:ring-2 focus:ring-bee-amber/20"
                                {...field}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                {showButtons && (
                    <div className="flex justify-end pt-2">
                        <Button type="submit" disabled={isLoading} className="h-9 rounded-full px-6 bg-bee-amber hover:bg-amber-500 text-bee-midnight font-semibold text-sm">
                            {isLoading ? 'Salvando…' : 'Salvar sala'}
                        </Button>
                    </div>
                )}
            </form>
        </Form>
    );
}
