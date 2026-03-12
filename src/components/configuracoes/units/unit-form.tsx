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
import {
    Building2,
    User,
    Mail,
    Phone,
    MapPin,
    Hash,
    CheckCircle2,
    X,
    Dumbbell,
    Loader2
} from 'lucide-react';
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
    showButtons?: boolean;
    formId?: string;
}

export function UnitForm({ initialData, onSubmit, isLoading, showButtons = true, formId }: UnitFormProps) {
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
            <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Nome da Unidade</FormLabel>
                                <FormControl>
                                    <div className="relative group">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-bee-amber transition-colors" />
                                        <Input
                                            placeholder="Ex: BeeGym - Unidade Central"
                                            {...field}
                                            className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-bee-amber/5 transition-all font-bold text-slate-700"
                                        />
                                    </div>
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
                                <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Nome do Gerente</FormLabel>
                                <FormControl>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-bee-amber transition-colors" />
                                        <Input
                                            placeholder="Ex: João Silva"
                                            {...field}
                                            className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-bee-amber/5 transition-all font-bold text-slate-700"
                                        />
                                    </div>
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
                                <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Email</FormLabel>
                                <FormControl>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-bee-amber transition-colors" />
                                        <Input
                                            type="email"
                                            placeholder="unidade@exemplo.com"
                                            {...field}
                                            className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-bee-amber/5 transition-all font-bold text-slate-700"
                                        />
                                    </div>
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
                                <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Telefone</FormLabel>
                                <FormControl>
                                    <div className="relative group">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-bee-amber transition-colors" />
                                        <Input
                                            placeholder="(00) 00000-0000"
                                            {...field}
                                            onChange={(e) => field.onChange(maskPhone(e.target.value))}
                                            className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-bee-amber/5 transition-all font-bold text-slate-700"
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-bee-amber/10 flex items-center justify-center">
                            <Dumbbell className="h-4 w-4 text-bee-amber" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">Serviços e Atividades</h3>
                    </div>

                    <FormField
                        control={form.control}
                        name="services"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Atividades Oferecidas</FormLabel>
                                <FormControl>
                                    <div className="space-y-3">
                                        {/* Display existing tags */}
                                        {field.value.length > 0 && (
                                            <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-white border border-slate-100 ring-1 ring-slate-200/50">
                                                {field.value.map((service) => (
                                                    <Badge
                                                        key={service}
                                                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 border-none font-bold py-1.5 px-3 rounded-full gap-2 transition-colors"
                                                    >
                                                        {service}
                                                        <X
                                                            className="h-3.5 w-3.5 cursor-pointer hover:text-red-500 transition-colors"
                                                            onClick={() => handleRemoveService(service)}
                                                        />
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}

                                        {/* Input for adding new tags */}
                                        <div className="relative group">
                                            <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-bee-amber transition-colors" />
                                            <Input
                                                placeholder="Digite a atividade (Enter ou vírgula)"
                                                value={serviceInput}
                                                onChange={(e) => setServiceInput(e.target.value)}
                                                onKeyDown={handleServiceKeyDown}
                                                onBlur={handleAddService}
                                                className="h-12 pl-12 rounded-2xl border-slate-100 bg-white focus:ring-4 focus:ring-bee-amber/5 transition-all font-bold text-slate-700"
                                            />
                                        </div>
                                    </div>
                                </FormControl>
                                <FormDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                                    Pressione <kbd className="px-1.5 py-0.5 text-xs font-black bg-slate-100 border rounded-md">Enter</kbd> para adicionar
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-bee-amber/10 flex items-center justify-center">
                            <MapPin className="h-4 w-4 text-bee-amber" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">Localização e Endereço</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField
                            control={form.control}
                            name="address_zip"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">CEP</FormLabel>
                                    <FormControl>
                                        <div className="relative group">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-bee-amber transition-colors" />
                                            <Input
                                                placeholder="00000-000"
                                                {...field}
                                                onChange={handleZipChange}
                                                className="h-14 pl-12 rounded-2xl border-slate-100 bg-white focus:ring-4 focus:ring-bee-amber/5 transition-all font-bold text-slate-700"
                                            />
                                            {isSearchingZip && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                    <Loader2 className="animate-spin h-5 w-5 text-bee-amber" />
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
                                        <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Logradouro</FormLabel>
                                        <FormControl>
                                            <div className="relative group">
                                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-bee-amber transition-colors" />
                                                <Input
                                                    placeholder="Ex: Rua das Flores"
                                                    {...field}
                                                    className="h-14 pl-12 rounded-2xl border-slate-100 bg-white focus:ring-4 focus:ring-bee-amber/5 transition-all font-bold text-slate-700"
                                                />
                                            </div>
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
                                    <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Número</FormLabel>
                                    <FormControl>
                                        <div className="relative group">
                                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-bee-amber transition-colors" />
                                            <Input
                                                placeholder="123"
                                                {...field}
                                                className="h-14 pl-12 rounded-2xl border-slate-100 bg-white focus:ring-4 focus:ring-bee-amber/5 transition-all font-bold text-slate-700"
                                            />
                                        </div>
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
                                    <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Bairro</FormLabel>
                                    <FormControl>
                                        <div className="relative group">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-bee-amber transition-colors" />
                                            <Input
                                                placeholder="Ex: Centro"
                                                {...field}
                                                className="h-14 pl-12 rounded-2xl border-slate-100 bg-white focus:ring-4 focus:ring-bee-amber/5 transition-all font-bold text-slate-700"
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="address_city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Cidade</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ex: São Paulo"
                                                {...field}
                                                className="h-14 rounded-2xl border-slate-100 bg-white focus:ring-4 focus:ring-bee-amber/5 transition-all font-bold text-slate-700 px-5"
                                            />
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
                                        <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">UF</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="UF"
                                                maxLength={2}
                                                {...field}
                                                className="h-14 rounded-2xl border-slate-100 bg-white focus:ring-4 focus:ring-bee-amber/5 transition-all font-bold text-slate-700 text-center uppercase"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </div>


                {showButtons && (
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => form.reset()} disabled={isLoading}>
                            Limpar
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Salvando...' : 'Salvar Unidade'}
                        </Button>
                    </div>
                )}
            </form>
        </Form>
    );
}
