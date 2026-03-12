'use client';

import { useState, useEffect } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
    SheetDescription,
} from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Dumbbell, Building2, Stethoscope, Trophy, Check, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

const BUSINESS_TYPES = [
    { id: 'Personal', title: 'Personal', icon: User },
    { id: 'Studio', title: 'Studio / Box', icon: Dumbbell },
    { id: 'Academia', title: 'Academia', icon: Building2 },
    { id: 'Fisioterapia', title: 'Fisio', icon: Stethoscope },
    { id: 'Escola', title: 'Escola', icon: Trophy },
];

const UF_LIST = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

const formatPhone = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1');
const formatCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
const formatCNPJ = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d)/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
const formatCep = (v: string) => v.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{3})\d+?$/, '$1');

const INITIAL_FORM = {
    // Acesso
    fullName: '', email: '', password: '',
    // Negócio
    businessType: '', empresaName: '', phone: '',
    documentType: 'CNPJ' as 'CPF' | 'CNPJ', document: '',
    studentRange: '',
    // Localização
    hasPhysicalLocation: true,
    addressZip: '', addressLine1: '', addressNumber: '', addressComplement: '',
    addressNeighborhood: '', addressCity: '', addressState: '',
    // Assinatura
    planoId: '', isTeste: false,
    discountType: 'NONE', discountValue: '', discountDurationMonths: ''
};

export function NovoClienteModal({ isOpen, onClose, onClientCreated }: { isOpen: boolean, onClose: () => void, onClientCreated: () => void }) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [planos, setPlanos] = useState<any[]>([]);
    const [isCepLoading, setIsCepLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Acesso | 2: Negócio | 3: Assinatura
    const [formData, setFormData] = useState(INITIAL_FORM);

    useEffect(() => {
        const controller = new AbortController();
        if (isOpen) fetchPlanos(controller.signal);
        return () => controller.abort();
    }, [isOpen]);

    const fetchPlanos = async (signal?: AbortSignal) => {
        try {
            const res = await fetch('/api/admin/planos', { signal });
            const data = await res.json();
            // API returns plain array
            if (res.ok && Array.isArray(data)) {
                setPlanos(data.filter((p: any) => p.ativo));
            }
        } catch (e: any) {
            if (e.name === 'AbortError') return;
            console.error('Erro ao buscar planos:', e);
        }
    };

    const set = (field: string, value: any) => setFormData(p => ({ ...p, [field]: value }));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let v = value;
        if (name === 'document') v = formData.documentType === 'CPF' ? formatCPF(value) : formatCNPJ(value);
        else if (name === 'phone') v = formatPhone(value);
        else if (name === 'addressZip') v = formatCep(value);
        else if (name === 'email') v = value.trim();
        set(name, v);
    };

    const handleCepBlur = async () => {
        const cep = formData.addressZip.replace(/\D/g, '');
        if (cep.length !== 8) return;
        setIsCepLoading(true);
        try {
            const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const d = await res.json();
            if (!d.erro) {
                setFormData(p => ({ ...p, addressLine1: d.logradouro, addressNeighborhood: d.bairro, addressCity: d.localidade, addressState: d.uf }));
            }
        } catch (e) { /* ignore */ }
        setIsCepLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/contratantes/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro ao criar cliente');
            toast({ title: 'Cliente criado com sucesso!' });
            onClientCreated();
            handleClose();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Erro ao criar cliente', description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setFormData(INITIAL_FORM);
        setStep(1);
        onClose();
    };

    const steps = ['Acesso', 'Negócio', 'Assinatura'];

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <SheetContent side="right" className="sm:max-w-[600px] p-0 flex flex-col h-full border-l shadow-2xl">
                <SheetHeader className="p-8 border-b relative overflow-hidden shrink-0 bg-white/50 backdrop-blur-sm">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-bee-amber/[0.03] rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-bee-amber/[0.05] rounded-full -mr-16 -mt-16 blur-2xl opacity-50" />
                    <div className="flex items-center gap-5 relative text-left">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-bee-amber/20 via-bee-amber/10 to-transparent border border-bee-amber/20 shadow-inner group transition-all">
                            <UserPlus className="h-8 w-8 text-bee-amber drop-shadow-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <SheetTitle className="text-2xl font-black font-display tracking-tight text-bee-midnight">
                                Novo Cliente
                            </SheetTitle>
                            <SheetDescription className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-bee-amber animate-pulse" />
                                Complete as informações abaixo para criar uma nova conta de cliente.
                            </SheetDescription>
                        </div>
                    </div>

                    {/* Step indicator */}
                    <div className="flex items-center justify-between gap-2 pt-6 overflow-x-auto pb-2 scrollbar-none">
                        {steps.map((s, i) => (
                            <div key={s} className="flex items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => i < step - 1 && setStep(i + 1)}
                                    className={cn(
                                        'group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-2xl transition-all',
                                        step === i + 1 ? 'bg-bee-amber text-bee-midnight shadow-lg shadow-bee-amber/20' : step > i + 1 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400 opacity-60'
                                    )}
                                >
                                    <span className={cn('w-6 h-6 rounded-xl flex items-center justify-center text-[10px] transition-all', step === i + 1 ? 'bg-white/40' : step > i + 1 ? 'bg-emerald-100' : 'bg-slate-100')}>
                                        {step > i + 1 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : i + 1}
                                    </span>
                                    {s}
                                </button>
                                {i < steps.length - 1 && <div className={cn('h-[2px] w-6 md:w-8 rounded-full bg-slate-100', step > i + 1 && 'bg-emerald-200')} />}
                            </div>
                        ))}
                    </div>
                </SheetHeader>

                <ScrollArea className="flex-1">
                    <form id="new-client-form" onSubmit={handleSubmit} className="p-8 space-y-8">
                        {/* STEP 1: Acesso */}
                        {step === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome Completo *</Label>
                                        <Input name="fullName" required value={formData.fullName} onChange={handleChange} placeholder="João Silva" className="h-11 rounded-2xl border-slate-200 focus-visible:ring-bee-amber/20 focus-visible:border-bee-amber shadow-sm px-5" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">E-mail (Login) *</Label>
                                        <Input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="joao@exemplo.com" className="h-11 rounded-2xl border-slate-200 focus-visible:ring-bee-amber/20 focus-visible:border-bee-amber shadow-sm px-5" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Senha Inicial *</Label>
                                        <Input type="password" name="password" required value={formData.password} onChange={handleChange} placeholder="Mínimo 6 caracteres" minLength={6} className="h-11 rounded-2xl border-slate-200 focus-visible:ring-bee-amber/20 focus-visible:border-bee-amber shadow-sm px-5" />
                                        <p className="text-[11px] text-slate-400 ml-1 font-medium">O cliente poderá alterar a senha dentro do App.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: Negócio */}
                        {step === 2 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                {/* Tipo de Negócio */}
                                <div className="space-y-3">
                                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Tipo de Negócio *</Label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                        {BUSINESS_TYPES.map(b => {
                                            const Icon = b.icon;
                                            return (
                                                <button key={b.id} type="button" onClick={() => set('businessType', b.id)}
                                                    className={cn('flex flex-col items-center gap-2 p-4 rounded-3xl border-2 text-[10px] font-black uppercase tracking-tight transition-all duration-300', formData.businessType === b.id ? 'border-bee-amber bg-amber-50 text-bee-midnight shadow-lg shadow-bee-amber/10' : 'border-slate-50 bg-slate-50/30 text-slate-400 hover:border-slate-200 hover:bg-white')}>
                                                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center transition-all', formData.businessType === b.id ? 'bg-bee-amber text-bee-midnight' : 'bg-slate-100 text-slate-400')}>
                                                        <Icon className="w-5 h-5" />
                                                    </div>
                                                    {b.title}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Dados do Negócio */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome do Estabelecimento *</Label>
                                        <Input name="empresaName" required value={formData.empresaName} onChange={handleChange} placeholder="Ex: BeeGym Studio" className="h-11 rounded-2xl border-slate-200 focus-visible:ring-bee-amber/20 focus-visible:border-bee-amber shadow-sm px-5" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Telefone *</Label>
                                        <Input name="phone" required value={formData.phone} onChange={handleChange} placeholder="(00) 00000-0000" maxLength={15} className="h-11 rounded-2xl border-slate-200 focus-visible:ring-bee-amber/20 focus-visible:border-bee-amber shadow-sm px-5" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Tipo Doc</Label>
                                        <Select value={formData.documentType} onValueChange={(v) => setFormData(p => ({ ...p, documentType: v as 'CPF' | 'CNPJ', document: '' }))}>
                                            <SelectTrigger className="h-11 rounded-2xl border-slate-200 focus:ring-bee-amber/20 focus:border-bee-amber shadow-sm px-5">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                                                <SelectItem value="CPF" className="rounded-lg">CPF</SelectItem>
                                                <SelectItem value="CNPJ" className="rounded-lg">CNPJ</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">{formData.documentType} *</Label>
                                        <Input name="document" required value={formData.document} onChange={handleChange} placeholder={formData.documentType === 'CPF' ? '000.000.000-00' : '00.000.000/0001-00'} maxLength={formData.documentType === 'CPF' ? 14 : 18} className="h-11 rounded-2xl border-slate-200 focus-visible:ring-bee-amber/20 focus-visible:border-bee-amber shadow-sm px-5" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Número de Alunos</Label>
                                    <Select value={formData.studentRange} onValueChange={(v) => set('studentRange', v)}>
                                        <SelectTrigger className="h-11 rounded-2xl border-slate-200 focus:ring-bee-amber/20 focus:border-bee-amber shadow-sm px-5">
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                                            <SelectItem value="1-20" className="rounded-lg">1 a 20</SelectItem>
                                            <SelectItem value="21-40" className="rounded-lg">21 a 40</SelectItem>
                                            <SelectItem value="41-100" className="rounded-lg">41 a 100</SelectItem>
                                            <SelectItem value="101-400" className="rounded-lg">101 a 400</SelectItem>
                                            <SelectItem value="400+" className="rounded-lg">Acima de 400</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Localização */}
                                <div className="space-y-6 pt-2">
                                    <div className="flex items-center gap-3 p-5 bg-slate-50/80 rounded-3xl border border-slate-100/50 transition-all hover:bg-white hover:shadow-md">
                                        <Switch id="mobile" checked={!formData.hasPhysicalLocation}
                                            onCheckedChange={(c) => setFormData(p => ({ ...p, hasPhysicalLocation: !c }))} className="data-[state=checked]:bg-bee-amber" />
                                        <Label htmlFor="mobile" className="text-xs font-bold text-slate-500 cursor-pointer select-none">Atendimento Online / Domiciliar</Label>
                                    </div>
                                    {formData.hasPhysicalLocation ? (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="relative">
                                                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">CEP</Label>
                                                <Input name="addressZip" value={formData.addressZip} onChange={handleChange} onBlur={handleCepBlur} placeholder="00000-000" maxLength={9} className="h-11 rounded-2xl border-slate-200 focus-visible:ring-bee-amber/20 focus-visible:border-bee-amber shadow-sm mt-1 px-5" />
                                                {isCepLoading && <Loader2 className="absolute right-4 bottom-4 h-5 w-5 animate-spin text-bee-amber" />}
                                            </div>
                                            <div className="grid grid-cols-4 gap-4">
                                                <div className="col-span-3 space-y-2">
                                                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Endereço</Label>
                                                    <Input name="addressLine1" value={formData.addressLine1} readOnly className="h-11 bg-slate-50/50 border-slate-100 italic rounded-2xl text-slate-500 px-5" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Nº</Label>
                                                    <Input name="addressNumber" value={formData.addressNumber} onChange={handleChange} className="h-11 rounded-2xl border-slate-200 focus-visible:ring-bee-amber/20 focus-visible:border-bee-amber shadow-sm px-5" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Cidade</Label>
                                                    <Input value={formData.addressCity} readOnly className="h-11 bg-slate-50/50 border-slate-100 italic rounded-2xl text-slate-500 px-5" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">UF</Label>
                                                    <Input value={formData.addressState} readOnly className="h-11 bg-slate-50/50 border-slate-100 italic uppercase rounded-2xl text-slate-500 px-5" />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="space-y-2">
                                                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Estado (UF) *</Label>
                                                <Select value={formData.addressState} onValueChange={(v) => setFormData(p => ({ ...p, addressState: v, addressCity: '' }))}>
                                                    <SelectTrigger className="h-11 rounded-2xl border-slate-200 focus:ring-bee-amber/20 focus:border-bee-amber shadow-sm px-5"><SelectValue placeholder="..." /></SelectTrigger>
                                                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl">{UF_LIST.map(uf => <SelectItem key={uf} value={uf} className="rounded-lg">{uf}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Cidade *</Label>
                                                <Input name="addressCity" value={formData.addressCity} onChange={handleChange} placeholder="Ex: São Paulo" className="h-11 rounded-2xl border-slate-200 focus-visible:ring-bee-amber/20 focus-visible:border-bee-amber shadow-sm px-5" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* STEP 3: Assinatura */}
                        {step === 3 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                {/* Plan picking cards */}
                                <div className="space-y-3">
                                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Escolha o Plano *</Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {planos.map(p => (
                                            <button key={p.id} type="button" onClick={() => set('planoId', p.id)}
                                                className={cn(
                                                    'flex flex-col gap-3 p-5 rounded-3xl border-2 text-left transition-all duration-300',
                                                    formData.planoId === p.id ? 'border-bee-amber bg-amber-50 shadow-lg shadow-bee-amber/5' : 'border-slate-50 bg-slate-50/30 hover:border-slate-200 hover:bg-white'
                                                )}>
                                                <div className="flex items-center justify-between w-full">
                                                    <p className={cn('text-xs font-black uppercase tracking-widest transition-colors', formData.planoId === p.id ? 'text-bee-midnight' : 'text-slate-400')}>{p.nome}</p>
                                                    {formData.planoId === p.id && <div className="w-5 h-5 rounded-full bg-bee-amber flex items-center justify-center"><Check className="w-3 h-3 text-white stroke-[3]" /></div>}
                                                </div>
                                                <p className="text-xl font-display font-black text-bee-midnight">R$ {Number(p.valor_mensal).toFixed(0)}<span className="text-[10px] text-slate-400 font-bold">/mês</span></p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Conta Teste */}
                                <div className={cn('flex items-center justify-between rounded-3xl border-2 p-5 transition-all duration-300', formData.isTeste ? 'border-blue-200 bg-blue-50/50 shadow-lg shadow-blue-500/5' : 'border-slate-50 bg-slate-50/30')}>
                                    <div className="flex items-center gap-4">
                                        <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center transition-all', formData.isTeste ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400')}>
                                            <Trophy className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <Label className="text-base font-black text-bee-midnight font-display">Conta Teste / Demo</Label>
                                            <p className="text-xs text-slate-400 font-medium leading-tight">Acesso liberado sem cobrança recorrente.</p>
                                        </div>
                                    </div>
                                    <Switch checked={formData.isTeste} onCheckedChange={(c) => set('isTeste', c)} className="data-[state=checked]:bg-blue-500" />
                                </div>

                                {/* Desconto (apenas se não for Teste) */}
                                {!formData.isTeste && (
                                    <div className="space-y-4 p-6 bg-slate-50/80 rounded-3xl border border-slate-100/50">
                                        <Label className="text-xs font-bold font-black uppercase tracking-widest text-slate-400">Desconto Pontual (Opcional)</Label>
                                        <Select value={formData.discountType} onValueChange={(v) => set('discountType', v)}>
                                            <SelectTrigger className="h-11 rounded-2xl border-slate-200 bg-white px-5"><SelectValue placeholder="Sem desconto" /></SelectTrigger>
                                            <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                                                <SelectItem value="NONE" className="rounded-lg">Sem desconto</SelectItem>
                                                <SelectItem value="FIXED_AMOUNT" className="rounded-lg">Desconto Fixo (R$)</SelectItem>
                                                <SelectItem value="PERCENTAGE" className="rounded-lg">Porcentagem (%)</SelectItem>
                                                <SelectItem value="FREE_MONTHS" className="rounded-lg">Meses Gratuitos</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {formData.discountType !== 'NONE' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                                        {formData.discountType === 'FREE_MONTHS' ? 'Qtd de Meses' : 'Valor do Desconto'}
                                                    </Label>
                                                    <Input type="number" name="discountValue" value={formData.discountValue} onChange={handleChange} className="h-11 rounded-2xl border-slate-200 bg-white px-5" />
                                                </div>
                                                {formData.discountType !== 'FREE_MONTHS' && (
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Duração (meses)</Label>
                                                        <Input type="number" name="discountDurationMonths" value={formData.discountDurationMonths} onChange={handleChange} className="h-11 rounded-2xl border-slate-200 bg-white px-5" />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </form>
                </ScrollArea>

                {/* Footer */}
                <SheetFooter className="p-8 border-t bg-slate-50/50 shrink-0 gap-3">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => step === 1 ? handleClose() : setStep(s => s - 1)}
                        className="flex-1 h-10 rounded-full font-bold text-slate-400 hover:text-slate-600 transition-all uppercase tracking-widest text-[10px]"
                    >
                        {step === 1 ? 'Cancelar' : 'Voltar'}
                    </Button>
                    {step < 3 ? (
                        <Button
                            type="button"
                            onClick={() => {
                                if (step === 1 && (!formData.fullName || !formData.email || !formData.password)) {
                                    toast({ variant: 'destructive', title: 'Preencha todos os campos do passo 1' }); return;
                                }
                                if (step === 2 && (!formData.businessType || !formData.empresaName || !formData.document)) {
                                    toast({ variant: 'destructive', title: 'Preencha os campos obrigatórios do negócio' }); return;
                                }
                                setStep(s => s + 1);
                            }}
                            className="flex-[1.5] h-10 rounded-full bg-bee-amber hover:bg-bee-amber/90 text-bee-midnight font-black shadow-lg shadow-bee-amber/20 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-[10px]"
                        >
                            Próximo Passo
                        </Button>
                    ) : (
                        <Button
                            type="submit"
                            form="new-client-form"
                            disabled={isLoading || !formData.planoId}
                            className="flex-[1.5] h-10 rounded-full bg-bee-amber hover:bg-bee-amber/90 text-bee-midnight font-black shadow-lg shadow-bee-amber/20 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-[10px]"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Criar Conta Agora'}
                        </Button>
                    )}
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
