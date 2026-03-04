'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { maskCEP, maskPhone } from '@/lib/masks';

const unitSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    manager_name: z.string().min(2, 'Nome do gerente deve ter pelo menos 2 caracteres').optional().or(z.literal('')),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    address_zip: z.string().min(8, 'CEP inválido').optional().or(z.literal('')),
    address_street: z.string().optional().or(z.literal('')),
    address_number: z.string().optional().or(z.literal('')),
    address_neighborhood: z.string().optional().or(z.literal('')),
    address_city: z.string().optional().or(z.literal('')),
    address_state: z.string().optional().or(z.literal('')),
    services: z.array(z.string()).default([]),
});

type UnitFormValues = z.infer<typeof unitSchema>;

interface UnitFormProps {
    initialData?: any;
    onSubmit: (values: UnitFormValues) => Promise<void>;
    isLoading?: boolean;
}

export function UnitForm({ initialData, onSubmit, isLoading }: UnitFormProps) {
    const { toast } = useToast();
    const [isSearchingZip, setIsSearchingZip] = useState(false);
    const [serviceInput, setServiceInput] = useState('');

    const form = useForm<UnitFormValues>({
        resolver: zodResolver(unitSchema),
        defaultValues: {
            name: initialData?.name || '',
            manager_name: initialData?.manager_name || '',
            email: initialData?.email || '',
            phone: initialData?.phone || '',
            address_zip: initialData?.address_zip || '',
            address_street: initialData?.address_street || '',
            address_number: initialData?.address_number || '',
            address_neighborhood: initialData?.address_neighborhood || '',
            address_city: initialData?.address_city || '',
            address_state: initialData?.address_state || '',
            services: initialData?.services || [],
        },
    });

    const { setValue, watch } = form;

    const handleAddService = () => {
        const trimmedValue = serviceInput.trim();
        if (trimmedValue) {
            const currentServices = form.getValues('services');

            // Avoid duplicates
            if (!currentServices.includes(trimmedValue)) {
                setValue('services', [...currentServices, trimmedValue]);
            }

            setServiceInput('');
        }
    };

    const handleServiceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            handleAddService();
        }
    };

    const handleRemoveService = (serviceToRemove: string) => {
        const currentServices = form.getValues('services');
        setValue('services', currentServices.filter(s => s !== serviceToRemove));
    };

    const handleZipChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = maskCEP(e.target.value);
        setValue('address_zip', value);

        const rawZip = value.replace(/\D/g, '');
        if (rawZip.length === 8) {
            setIsSearchingZip(true);
            try {
                const res = await fetch(`https://viacep.com.br/ws/${rawZip}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    setValue('address_street', data.logradouro);
                    setValue('address_neighborhood', data.bairro);
                    setValue('address_city', data.localidade);
                    setValue('address_state', data.uf);
                }
            } catch (err) {
                console.error("Error searching ZIP", err);
            } finally {
                setIsSearchingZip(false);
            }
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome da Unidade</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: BeeGym - Filial Centro" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="manager_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome do Gerente</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: João Silva" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="unidade@exemplo.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Telefone</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="(00) 00000-0000"
                                        {...field}
                                        onChange={(e) => field.onChange(maskPhone(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="border-t pt-4 mt-4 space-y-4">
                    <h3 className="text-sm font-medium">Serviços e Atividades</h3>
                    <FormField
                        control={form.control}
                        name="services"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Atividades Oferecidas</FormLabel>
                                <FormControl>
                                    <div className="space-y-2">
                                        {/* Display existing tags */}
                                        {field.value.length > 0 && (
                                            <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/50">
                                                {field.value.map((service) => (
                                                    <Badge
                                                        key={service}
                                                        variant="secondary"
                                                        className="gap-1 pr-1"
                                                    >
                                                        {service}
                                                        <X
                                                            className="h-3 w-3 cursor-pointer hover:text-destructive"
                                                            onClick={() => handleRemoveService(service)}
                                                        />
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}

                                        {/* Input for adding new tags */}
                                        <Input
                                            placeholder="Digite o nome da atividade e pressione Enter ou vírgula"
                                            value={serviceInput}
                                            onChange={(e) => setServiceInput(e.target.value)}
                                            onKeyDown={handleServiceKeyDown}
                                            onBlur={handleAddService}
                                        />
                                    </div>
                                </FormControl>
                                <FormDescription>
                                    Digite o nome da atividade e pressione <kbd className="px-1.5 py-0.5 text-xs font-semibold border rounded">Enter</kbd> ou <kbd className="px-1.5 py-0.5 text-xs font-semibold border rounded">,</kbd> para adicionar
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="border-t pt-4 mt-4">
                    <h3 className="text-sm font-medium mb-3">Endereço</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                            control={form.control}
                            name="address_zip"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>CEP</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                placeholder="00000-000"
                                                {...field}
                                                onChange={handleZipChange}
                                            />
                                            {isSearchingZip && (
                                                <div className="absolute right-3 top-2.5">
                                                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                                                </div>
                                            )}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="md:col-span-2">
                            <FormField
                                control={form.control}
                                name="address_street"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Logradouro</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Rua das Flores" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="address_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Número</FormLabel>
                                    <FormControl>
                                        <Input placeholder="123" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="address_neighborhood"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Bairro</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Centro" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <FormField
                                control={form.control}
                                name="address_city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cidade</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: São Paulo" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="address_state"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estado</FormLabel>
                                        <FormControl>
                                            <Input placeholder="UF" maxLength={2} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => form.reset()} disabled={isLoading}>
                        Limpar
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Salvando...' : 'Salvar Unidade'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
