'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import {
    Layout,
    Building2,
    Users,
    AlignLeft,
} from 'lucide-react';

const roomSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    unit_id: z.string().uuid('Selecione uma unidade válida'),
    capacity: z.coerce.number().min(0, 'Capacidade deve ser válida'),
    description: z.string().optional().or(z.literal('')),
});

export type RoomFormValues = z.infer<typeof roomSchema>;

interface RoomFormProps {
    initialData?: any;
    units: Array<{ id: string; name: string }>;
    onSubmit: (values: RoomFormValues) => void;
    isLoading?: boolean;
    showButtons?: boolean;
    formId?: string;
}

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

    // Effect to handle unlimited toggle
    useEffect(() => {
        if (isUnlimited) {
            form.setValue('capacity', 0);
            form.clearErrors('capacity');
        } else if (form.getValues('capacity') === 0) {
            form.setValue('capacity', 10);
        }
    }, [isUnlimited, form]);

    return (
        <Form {...form}>
            <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-8 p-1">
                    {/* Informações Básicas */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
                            <div className="h-2 w-2 rounded-full bg-bee-amber shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Identificação</h3>
                        </div>

                        <div className="grid gap-5">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nome da Sala</FormLabel>
                                        <FormControl>
                                            <div className="group relative transition-all">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-bee-amber transition-colors">
                                                    <Layout className="h-4 w-4" />
                                                </div>
                                                <Input
                                                    placeholder="Ex: Sala de Bike Indoor"
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
                                name="unit_id"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Unidade</FormLabel>
                                        <div className="group relative transition-all">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-bee-amber z-10 transition-colors pointer-events-none">
                                                <Building2 className="h-4 w-4" />
                                            </div>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="pl-11 h-12 bg-slate-50/50 border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-bee-amber/5 focus:border-bee-amber/20 transition-all font-medium text-slate-900 overflow-hidden">
                                                        <SelectValue placeholder="Selecione a unidade" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                                                    {units.length > 0 ? (
                                                        units.map((unit) => (
                                                            <SelectItem key={unit.id} value={unit.id} className="rounded-xl focus:bg-bee-amber/10 focus:text-bee-midnight py-3">
                                                                {unit.name}
                                                            </SelectItem>
                                                        ))
                                                    ) : (
                                                        <div className="p-4 text-xs text-slate-400 text-center font-medium">
                                                            Nenhuma unidade disponível.
                                                        </div>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {units.length === 0 && (
                                            <p className="text-[10px] font-bold text-red-500 ml-1 mt-1">
                                                É necessário ter pelo menos uma unidade ativa para criar uma sala.
                                            </p>
                                        )}
                                        <FormMessage className="text-[10px] font-bold text-red-500 ml-1" />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    {/* Capacidade e Detalhes */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
                            <div className="h-2 w-2 rounded-full bg-bee-amber shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Capacidade & Detalhes</h3>
                        </div>

                        <div className="grid gap-5">
                            <FormField
                                control={form.control}
                                name="capacity"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <div className="flex items-center justify-between mb-2">
                                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Capacidade Máxima</FormLabel>
                                            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                                                <Checkbox
                                                    id="unlimited"
                                                    checked={isUnlimited}
                                                    onCheckedChange={(checked) => setIsUnlimited(checked as boolean)}
                                                    className="rounded-md border-slate-300 data-[state=checked]:bg-bee-amber data-[state=checked]:border-bee-amber"
                                                />
                                                <label
                                                    htmlFor="unlimited"
                                                    className="text-[10px] font-black uppercase tracking-tighter text-slate-600 cursor-pointer select-none"
                                                >
                                                    Ilimitado
                                                </label>
                                            </div>
                                        </div>
                                        <FormControl>
                                            <div className="group relative transition-all">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-bee-amber transition-colors">
                                                    <Users className="h-4 w-4" />
                                                </div>
                                                <Input
                                                    type="number"
                                                    placeholder="Ex: 15"
                                                    className="pl-11 h-12 bg-slate-50/50 border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-bee-amber/5 focus:border-bee-amber/20 transition-all font-medium placeholder:text-slate-400"
                                                    {...field}
                                                    disabled={isUnlimited}
                                                    onChange={(e) => field.onChange(Number(e.target.value))}
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
                                                    placeholder="Descreva os equipamentos ou características desta sala..."
                                                    className="pl-11 min-h-[120px] bg-slate-50/50 border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-bee-amber/5 focus:border-bee-amber/20 transition-all font-medium placeholder:text-slate-400 resize-none py-4"
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
                </div>


                {showButtons && (
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="submit" disabled={isLoading || units.length === 0} className="w-full md:w-auto">
                            {isLoading ? 'Salvando...' : 'Salvar Sala'}
                        </Button>
                    </div>
                )}
            </form>
        </Form>
    );
}
