'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tag, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface OfertaFormModalProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    oferta?: any;
    onSaved: () => void;
}

export function OfertaFormModal({ open, onOpenChange, oferta, onSaved }: OfertaFormModalProps) {
    const isEditing = !!oferta;
    const { toast } = useToast();

    const [form, setForm] = useState({
        code: '',
        description: '',
        discount_type: 'PERCENTAGE',
        discount_value: '',
        duration_months: '',
        is_active: true
    });

    useEffect(() => {
        if (open) {
            if (oferta) {
                setForm({
                    code: oferta.code,
                    description: oferta.description || '',
                    discount_type: oferta.discount_type,
                    discount_value: oferta.discount_value.toString(),
                    duration_months: oferta.duration_months ? oferta.duration_months.toString() : '',
                    is_active: oferta.is_active
                });
            } else {
                setForm({
                    code: '',
                    description: '',
                    discount_type: 'PERCENTAGE',
                    discount_value: '',
                    duration_months: '',
                    is_active: true
                });
            }
        }
    }, [open, oferta]);

    const [loading, setLoading] = useState(false);

    const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

    const handleSubmit = async () => {
        if (!form.code || !form.discount_value) {
            toast({ title: 'Código e Valor são obrigatórios.', variant: 'destructive' });
            return;
        }

        setLoading(true);
        const url = isEditing ? `/api/admin/coupons/${oferta.id}` : '/api/admin/coupons';
        const method = isEditing ? 'PUT' : 'POST';

        const payload = {
            ...form,
            discount_value: Number(form.discount_value),
            duration_months: form.duration_months ? Number(form.duration_months) : null
        };

        try {
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro ao salvar oferta');

            toast({ title: isEditing ? 'Oferta atualizada!' : 'Oferta criada!' });
            onSaved();
            onOpenChange(false);
        } catch (err: any) {
            toast({ title: err.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-md border-l shadow-2xl p-0 flex flex-col h-full bg-white">
                <SheetHeader className="p-8 border-b relative overflow-hidden shrink-0 bg-white/50 backdrop-blur-sm">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-bee-amber/[0.03] rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-bee-amber/[0.05] rounded-full -mr-16 -mt-16 blur-2xl opacity-50" />
                    <div className="flex items-center gap-5 relative text-left">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-bee-amber/20 via-bee-amber/10 to-transparent border border-bee-amber/20 shadow-inner group transition-all">
                            <Tag className="h-8 w-8 text-bee-amber drop-shadow-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <SheetTitle className="text-2xl font-black font-display tracking-tight text-bee-midnight">
                                {isEditing ? 'Editar Oferta' : 'Nova Oferta'}
                            </SheetTitle>
                            <SheetDescription className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-bee-amber animate-pulse" />
                                Crie códigos de desconto e promoções para os planos.
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <ScrollArea className="flex-1">
                    <div className="p-8 space-y-6">
                        <div className="space-y-2 group">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 group-focus-within:text-bee-amber transition-colors">Código <span className="text-bee-amber">*</span></Label>
                            <Input
                                value={form.code}
                                onChange={e => set('code', e.target.value.toUpperCase())}
                                placeholder="ex: BEMVINDO20"
                                className="h-11 rounded-2xl border-slate-200 focus-visible:ring-bee-amber/10 focus-visible:border-bee-amber shadow-sm font-black text-bee-midnight uppercase tracking-wider px-4"
                            />
                        </div>

                        <div className="space-y-2 group">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 group-focus-within:text-bee-amber transition-colors">Descrição</Label>
                            <Input
                                value={form.description}
                                onChange={e => set('description', e.target.value)}
                                placeholder="Promoção de inauguração"
                                className="h-11 rounded-2xl border-slate-200 focus-visible:ring-bee-amber/10 focus-visible:border-bee-amber shadow-sm font-medium text-slate-600 px-4"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 group">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 group-focus-within:text-bee-amber transition-colors">Tipo de Desconto</Label>
                                <Select value={form.discount_type} onValueChange={v => set('discount_type', v)}>
                                    <SelectTrigger className="h-11 rounded-2xl border-slate-200 focus:ring-bee-amber/10 focus:border-bee-amber shadow-sm font-bold text-bee-midnight px-4">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2">
                                        <SelectItem value="PERCENTAGE" className="rounded-xl focus:bg-amber-50 focus:text-bee-amber font-bold py-2.5 px-4 text-xs">Porcentagem (%)</SelectItem>
                                        <SelectItem value="FIXED_AMOUNT" className="rounded-xl focus:bg-amber-50 focus:text-bee-amber font-bold py-2.5 px-4 text-xs">Valor Fixo (R$)</SelectItem>
                                        <SelectItem value="FREE_MONTHS" className="rounded-xl focus:bg-amber-50 focus:text-bee-amber font-bold py-2.5 px-4 text-xs">Meses Grátis</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 group">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 group-focus-within:text-bee-amber transition-colors">
                                    {form.discount_type === 'PERCENTAGE' ? 'Porcentagem (%)' : form.discount_type === 'FIXED_AMOUNT' ? 'Valor (R$)' : 'Meses'}
                                    <span className="text-bee-amber"> *</span>
                                </Label>
                                <Input
                                    type="number"
                                    step={form.discount_type === 'PERCENTAGE' ? '1' : '0.01'}
                                    value={form.discount_value}
                                    onChange={e => set('discount_value', e.target.value)}
                                    placeholder="Ex: 20"
                                    className="h-11 rounded-2xl border-slate-200 focus-visible:ring-bee-amber/10 focus-visible:border-bee-amber shadow-sm font-black text-bee-midnight px-4"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 group p-5 rounded-[1.5rem] bg-slate-50 border border-slate-100 transition-all hover:bg-slate-100/50">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 block mb-2">Duração da Oferta (Meses)</Label>
                            <Input
                                type="number"
                                value={form.duration_months}
                                onChange={e => set('duration_months', e.target.value)}
                                placeholder="Vazio = Vitalício"
                                className="h-11 rounded-2xl border-slate-200 focus-visible:ring-bee-amber/10 focus-visible:border-bee-amber shadow-sm font-bold bg-white px-4"
                            />
                            <p className="text-[10px] font-medium text-slate-400 leading-tight mt-2 px-1">
                                Opcional. Quantos meses o desconto se manterá na assinatura recorrente.
                            </p>
                        </div>

                        <div className="flex items-center justify-between p-5 rounded-[1.5rem] bg-white border border-slate-100 hover:border-bee-amber/30 transition-all group">
                            <div className="space-y-0.5">
                                <Label htmlFor="active" className="text-sm font-bold text-bee-midnight cursor-pointer">Oferta Ativa</Label>
                                <p className="text-[10px] font-medium text-slate-400">Define se o cupom pode ser usado por novos alunos</p>
                            </div>
                            <Switch
                                id="active"
                                checked={form.is_active}
                                onCheckedChange={(v) => set('is_active', v)}
                                className="data-[state=checked]:bg-bee-amber"
                            />
                        </div>
                    </div>
                </ScrollArea>

                <SheetFooter className="p-8 border-t bg-slate-50/50 gap-3 shrink-0">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="flex-1 h-10 rounded-full font-bold text-slate-400 hover:text-slate-600 transition-all uppercase tracking-widest text-[10px]"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-[1.5] h-10 rounded-full bg-bee-amber text-bee-midnight hover:bg-bee-amber/90 font-black shadow-lg shadow-bee-amber/20 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-[10px]"
                    >
                        {loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Oferta'}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
