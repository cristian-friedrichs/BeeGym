'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Edit2 } from 'lucide-react';

interface Props {
    contratanteId: string;
    assinatura: any;
    onUpdated: () => void;
}

export function ContratanteBillingDialog({ contratanteId, assinatura, onUpdated }: Props) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // The current form state
    const [overrideType, setOverrideType] = useState<'none' | 'price' | 'discount_amount' | 'discount_percentage'>('none');
    const [overrideValue, setOverrideValue] = useState<string>('');

    const handleSave = async () => {
        setLoading(true);

        const payload: any = {
            manual_price_override: null,
            manual_discount_amount: null,
            manual_discount_percentage: null
        };

        if (overrideType === 'price' && overrideValue) payload.manual_price_override = Number(overrideValue);
        if (overrideType === 'discount_amount' && overrideValue) payload.manual_discount_amount = Number(overrideValue);
        if (overrideType === 'discount_percentage' && overrideValue) payload.manual_discount_percentage = Number(overrideValue);

        try {
            const res = await fetch(`/api/admin/contratantes/${contratanteId}/billing`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Erro ao alterar faturamento');

            toast({ title: 'Assinatura atualizada com sucesso. Novo valor base: R$ ' + Number(data.novoValorMensal).toFixed(2) });
            setOpen(false);
            onUpdated();
        } catch (err: any) {
            toast({ title: err.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-bee-amber">
                    <Edit2 className="w-3.5 h-3.5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border-none rounded-[2rem] shadow-2xl overflow-hidden p-0">
                <DialogHeader className="px-8 pt-8 pb-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-bee-amber/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                    <div className="flex items-center gap-3 mb-2 relative">
                        <div className="w-1.5 h-6 bg-bee-amber rounded-full" />
                        <DialogTitle className="text-xl font-bold font-display tracking-tight text-bee-midnight">
                            Ajuste de Faturamento
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-sm font-medium text-slate-400 relative">
                        Ajuste o valor que este cliente pagará. Válido para assinaturas Pix.
                    </DialogDescription>
                </DialogHeader>
                <div className="px-8 py-4 space-y-5">
                    <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Tipo de Ajuste</Label>
                        <select
                            className="flex h-12 w-full items-center justify-between rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-4 py-2 text-sm font-bold text-bee-midnight focus:outline-none focus:border-bee-amber focus:bg-white transition-all appearance-none cursor-pointer"
                            value={overrideType}
                            onChange={(e) => setOverrideType(e.target.value as any)}
                            disabled={loading}
                        >
                            <option value="none">Nenhum (Preço do plano)</option>
                            <option value="price">Forçar preço fixo (R$)</option>
                            <option value="discount_amount">Desconto fixo (R$)</option>
                            <option value="discount_percentage">Desconto percentual (%)</option>
                        </select>
                    </div>

                    {overrideType !== 'none' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Valor / Porcentagem</Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={overrideValue}
                                onChange={(e) => setOverrideValue(e.target.value)}
                                disabled={loading}
                                className="h-12 rounded-2xl border-slate-200 focus-visible:ring-bee-amber/20 focus-visible:border-bee-amber shadow-sm"
                            />
                        </div>
                    )}
                </div>
                <DialogFooter className="px-8 py-6 border-t bg-slate-50/50 gap-3">
                    <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading} className="text-slate-400 font-bold hover:bg-slate-100 rounded-xl">Cancelar</Button>
                    <Button
                        disabled={loading}
                        onClick={handleSave}
                        className="h-12 px-8 bg-bee-amber text-bee-midnight hover:bg-bee-amber/90 font-black uppercase tracking-widest text-[11px] rounded-2xl shadow-lg shadow-bee-amber/20 transition-all border-none"
                    >
                        {loading ? 'Salvando...' : 'Aplicar Alteração'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
