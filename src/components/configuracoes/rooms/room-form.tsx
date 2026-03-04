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
}

export function RoomForm({ initialData, units, onSubmit, isLoading }: RoomFormProps) {
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome da Sala</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Sala de Bike Indoor" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="unit_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Unidade</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger className="h-10 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-lg focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                                        <SelectValue placeholder="Selecione a unidade" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {units.length > 0 ? (
                                        units.map((unit) => (
                                            <SelectItem key={unit.id} value={unit.id}>
                                                {unit.name}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <div className="p-2 text-sm text-muted-foreground text-center">
                                            Nenhuma unidade disponível.
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                            {units.length === 0 && (
                                <FormDescription className="text-destructive">
                                    É necessário ter pelo menos uma unidade ativa para criar uma sala.
                                </FormDescription>
                            )}
                            <FormDescription>
                                Unidade à qual esta sala pertence.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="space-y-3">
                    <FormField
                        control={form.control}
                        name="capacity"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Capacidade Máxima</FormLabel>
                                <div className="flex items-center gap-4">
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="Ex: 15"
                                            {...field}
                                            disabled={isUnlimited}
                                            className={isUnlimited ? "opacity-50" : ""}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                        />
                                    </FormControl>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="unlimited"
                                            checked={isUnlimited}
                                            onCheckedChange={(checked) => setIsUnlimited(checked as boolean)}
                                        />
                                        <label
                                            htmlFor="unlimited"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            Ilimitado
                                        </label>
                                    </div>
                                </div>
                                <FormDescription>
                                    {isUnlimited
                                        ? "Sem limite de alunos para esta sala."
                                        : "Número máximo de alunos permitidos simultaneamente."}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descrição (Opcional)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Descreva os equipamentos ou características desta sala..."
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button type="submit" disabled={isLoading || units.length === 0} className="w-full md:w-auto">
                        {isLoading ? 'Salvando...' : 'Salvar Sala'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
