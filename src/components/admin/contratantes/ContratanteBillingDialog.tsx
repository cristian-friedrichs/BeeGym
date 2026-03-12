'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from '@/components/ui/sheet';
import { CreditCard, Edit2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

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
        <Sheet open={open} onOpenChange={setOpen}>
            <Button variant="ghost" size="icon" onClick={() => setOpen(true)} className="h-6 w-6 text-slate-400 hover:text-bee-amber">
                <Edit2 className="w-3.5 h-3.5" />
            </Button>
            <SheetContent side="right" className="sm:max-w-md border-l shadow-2xl p-0 flex flex-col h-full">
                <SheetHeader className="p-8 border-b relative overflow-hidden shrink-0 bg-white/50 backdrop-blur-sm">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-bee-amber/[0.03] rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-bee-amber/[0.05] rounded-full -mr-16 -mt-16 blur-2xl opacity-50" />
                    <div className="flex items-center gap-5 relative text-left">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-bee-amber/20 via-bee-amber/10 to-transparent border border-bee-amber/20 shadow-inner group transition-all">
                            <CreditCard className="h-8 w-8 text-bee-amber drop-shadow-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <SheetTitle className="text-2xl font-black font-display tracking-tight text-bee-midnight">
                                Ajuste de Faturamento
                            </SheetTitle>
                            <SheetDescription className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-bee-amber animate-pulse" />
                                Ajuste o valor que este cliente pagará. Válido para assinaturas Pix.
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <ScrollArea className="flex-1">
                    <div className="p-8 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Tipo de Ajuste</Label>
                            <div className="relative">
                                <select
                                    className="flex h-11 w-full items-center justify-between rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-5 text-sm font-bold text-bee-midnight focus:outline-none focus:border-bee-amber focus:bg-white transition-all appearance-none cursor-pointer"
                                    value={overrideType}
                                    onChange={(e) => setOverrideType(e.target.value as any)}
                                    disabled={loading}
                                >
                                    <option value="none">Nenhum (Preço do plano)</option>
                                    <option value="price">Forçar preço fixo (R$)</option>
                                    <option value="discount_amount">Desconto fixo (R$)</option>
                                    <option value="discount_percentage">Desconto percentual (%)</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                    <Edit2 className="w-4 h-4" />
                                </div>
                            </div>
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
                                    className="h-11 px-5 rounded-2xl border-slate-200 focus-visible:ring-bee-amber/20 focus-visible:border-bee-amber shadow-sm"
                                />
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <SheetFooter className="p-8 border-t bg-slate-50/50 gap-3 shrink-0">
                    <Button
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        disabled={loading}
                        className="flex-1 h-10 rounded-full font-bold text-slate-400 hover:text-slate-600 transition-all uppercase tracking-widest text-[10px]"
                    >
                        Cancelar
                    </Button>
                    <Button
                        disabled={loading}
                        onClick={handleSave}
                        className="flex-[1.5] h-10 rounded-full bg-bee-amber text-bee-midnight hover:bg-bee-amber/90 font-black shadow-lg shadow-bee-amber/20 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-[10px]"
                    >
                        {loading ? 'Salvando...' : 'Aplicar Alteração'}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
