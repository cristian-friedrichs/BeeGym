'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Loader2 } from 'lucide-react';
import { maskCEP, maskPhone } from '@/lib/masks';
import { cn } from '@/lib/utils';

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

const fieldCls = 'h-9 rounded-xl border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:border-bee-amber focus:ring-2 focus:ring-bee-amber/20 focus:ring-offset-0';
const labelCls = 'text-sm font-medium text-slate-700';

export function UnitForm({ initialData, onSubmit, isLoading, showButtons = true, formId }: UnitFormProps) {
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

    const { setValue } = form;

    const handleAddService = () => {
        const v = serviceInput.trim();
        if (v) {
            const cur = form.getValues('services');
            if (!cur.includes(v)) setValue('services', [...cur, v]);
            setServiceInput('');
        }
    };

    const handleZipChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = maskCEP(e.target.value);
        setValue('address_zip', value);
        const raw = value.replace(/\D/g, '');
        if (raw.length === 8) {
            setIsSearchingZip(true);
            try {
                const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    setValue('address_street', data.logradouro);
                    setValue('address_neighborhood', data.bairro);
                    setValue('address_city', data.localidade);
                    setValue('address_state', data.uf);
                }
            } catch { /* silent */ } finally { setIsSearchingZip(false); }
        }
    };

    return (
        <Form {...form}>
            <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                            <FormLabel className={labelCls}>Nome da unidade *</FormLabel>
                            <FormControl><Input placeholder="Ex: BeeGym - Unidade Central" className={fieldCls} {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="manager_name" render={({ field }) => (
                        <FormItem>
                            <FormLabel className={labelCls}>Gerente</FormLabel>
                            <FormControl><Input placeholder="Ex: João Silva" className={fieldCls} {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                            <FormLabel className={labelCls}>Email</FormLabel>
                            <FormControl><Input type="email" placeholder="unidade@exemplo.com" className={fieldCls} {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem>
                            <FormLabel className={labelCls}>Telefone</FormLabel>
                            <FormControl><Input placeholder="(00) 00000-0000" className={fieldCls} {...field} onChange={e => field.onChange(maskPhone(e.target.value))} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                <hr className="border-slate-100" />
                <p className="text-sm font-semibold text-slate-700">Serviços e atividades</p>

                <FormField control={form.control} name="services" render={({ field }) => (
                    <FormItem>
                        <FormLabel className={labelCls}>Atividades oferecidas</FormLabel>
                        <FormControl>
                            <div className="space-y-2">
                                {field.value.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {field.value.map(s => (
                                            <Badge key={s} className="bg-slate-100 text-slate-600 border-0 font-medium gap-1.5 pr-1.5">
                                                {s}
                                                <button type="button" onClick={() => setValue('services', field.value.filter(x => x !== s))} className="hover:text-red-500 transition-colors">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                                <Input
                                    placeholder="Digite e pressione Enter…"
                                    value={serviceInput}
                                    onChange={e => setServiceInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); handleAddService(); } }}
                                    onBlur={handleAddService}
                                    className={fieldCls}
                                />
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <hr className="border-slate-100" />
                <p className="text-sm font-semibold text-slate-700">Endereço</p>

                <div className="grid grid-cols-3 gap-3">
                    <FormField control={form.control} name="address_zip" render={({ field }) => (
                        <FormItem>
                            <FormLabel className={labelCls}>CEP</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input placeholder="00000-000" className={fieldCls} {...field} onChange={handleZipChange} />
                                    {isSearchingZip && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-bee-amber" />}
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <div className="col-span-2">
                        <FormField control={form.control} name="address_street" render={({ field }) => (
                            <FormItem>
                                <FormLabel className={labelCls}>Logradouro</FormLabel>
                                <FormControl><Input placeholder="Ex: Rua das Flores" className={fieldCls} {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <FormField control={form.control} name="address_number" render={({ field }) => (
                        <FormItem>
                            <FormLabel className={labelCls}>Número</FormLabel>
                            <FormControl><Input placeholder="123" className={fieldCls} {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="address_neighborhood" render={({ field }) => (
                        <FormItem>
                            <FormLabel className={labelCls}>Bairro</FormLabel>
                            <FormControl><Input placeholder="Ex: Centro" className={fieldCls} {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-2">
                        <FormField control={form.control} name="address_city" render={({ field }) => (
                            <FormItem>
                                <FormLabel className={labelCls}>Cidade</FormLabel>
                                <FormControl><Input placeholder="SP" className={fieldCls} {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="address_state" render={({ field }) => (
                            <FormItem>
                                <FormLabel className={labelCls}>UF</FormLabel>
                                <FormControl><Input placeholder="SP" maxLength={2} className={cn(fieldCls, 'uppercase text-center')} {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                </div>

                {showButtons && (
                    <div className="flex justify-end pt-2">
                        <Button type="submit" disabled={isLoading} className="h-9 rounded-full px-6 bg-bee-amber hover:bg-amber-500 text-bee-midnight font-semibold text-sm shadow-sm">
                            {isLoading ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Salvando…</> : 'Salvar unidade'}
                        </Button>
                    </div>
                )}
            </form>
        </Form>
    );
}
