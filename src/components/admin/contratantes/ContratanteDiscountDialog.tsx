'use client';

import { useState } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from '@/components/ui/sheet';
import { Loader2, Percent, DollarSign, Tag } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface ContratanteDiscountDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    contratanteId: string;
    currentPrice: number;
    currentDiscountAmount?: number;
    currentDiscountPercentage?: number;
    onChanged: () => void;
}

export function ContratanteDiscountDialog({
    open, onOpenChange, contratanteId, currentPrice,
    currentDiscountAmount, currentDiscountPercentage, onChanged
}: ContratanteDiscountDialogProps) {
    const { toast } = useToast();
    const [submitting, setSubmitting] = useState(false);

    const hasExistingDiscount = !!(currentDiscountAmount || currentDiscountPercentage);
    const [discountMode, setDiscountMode] = useState<'percent' | 'fixed'>(
        currentDiscountPercentage ? 'percent' : 'fixed'
    );

    const [percentValue, setPercentValue] = useState(currentDiscountPercentage?.toString() || '');
    const [fixedValue, setFixedValue] = useState(currentDiscountAmount?.toString() || '');

    const calculateNewPrice = () => {
        let discount = 0;
        if (discountMode === 'percent') {
            const p = parseFloat(percentValue) || 0;
            discount = currentPrice * (p / 100);
        } else {
            discount = parseFloat(fixedValue) || 0;
        }
        return Math.max(0, currentPrice - discount);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const payload: any = {
                manualDiscountAmount: null,
                manualDiscountPercentage: null,
            };

            if (discountMode === 'percent' && percentValue) {
                payload.manualDiscountPercentage = parseFloat(percentValue);
            } else if (discountMode === 'fixed' && fixedValue) {
                payload.manualDiscountAmount = parseFloat(fixedValue);
            }

            const res = await fetch(`/api/admin/contratantes/${contratanteId}/discount`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Erro ao aplicar desconto');
            }

            toast({ title: 'Desconto atualizado com sucesso!' });
            onChanged();
            onOpenChange(false);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Erro', description: e.message });
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemove = async () => {
        setSubmitting(true);
        try {
            const res = await fetch(`/api/admin/contratantes/${contratanteId}/discount`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ manualDiscountAmount: null, manualDiscountPercentage: null }),
            });
            if (!res.ok) throw new Error('Erro ao remover desconto');
            toast({ title: 'Desconto removido com sucesso!' });
            setPercentValue('');
            setFixedValue('');
            onChanged();
            onOpenChange(false);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Erro', description: e.message });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-md border-l shadow-2xl p-0 flex flex-col h-full">
                <SheetHeader className="p-8 border-b relative overflow-hidden shrink-0 bg-white/50 backdrop-blur-sm">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-bee-amber/[0.03] rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-bee-amber/[0.05] rounded-full -mr-16 -mt-16 blur-2xl opacity-50" />
                    <div className="flex items-center gap-5 relative text-left">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-bee-amber/20 via-bee-amber/10 to-transparent border border-bee-amber/20 shadow-inner group transition-all">
                            <Tag className="h-8 w-8 text-bee-amber drop-shadow-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <SheetTitle className="text-2xl font-black font-display tracking-tight text-bee-midnight">
                                Personalizar Preço
                            </SheetTitle>
                            <SheetDescription className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-bee-amber animate-pulse" />
                                Preço Base: <span className="font-bold text-slate-500">R$ {currentPrice.toFixed(2)}</span>
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <ScrollArea className="flex-1">
                    <div className="p-8 space-y-8">
                        <Tabs value={discountMode} onValueChange={(v: any) => setDiscountMode(v)} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-2xl h-12">
                                <TabsTrigger value="percent" className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs uppercase tracking-widest">
                                    <Percent className="w-3.5 h-3.5 mr-2" /> Porcentagem
                                </TabsTrigger>
                                <TabsTrigger value="fixed" className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs uppercase tracking-widest">
                                    <DollarSign className="w-3.5 h-3.5 mr-2" /> Valor Fixo
                                </TabsTrigger>
                            </TabsList>

                            <div className="mt-8">
                                <TabsContent value="percent" className="space-y-4 m-0 animate-in fade-in slide-in-from-right-2 duration-200">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Porcentagem (%)</Label>
                                        <Input
                                            type="number"
                                            placeholder="Ex: 10"
                                            className="h-11 px-5 bg-white border-slate-200 rounded-2xl focus-visible:ring-bee-amber/20 focus-visible:border-bee-amber shadow-sm"
                                            value={percentValue}
                                            onChange={(e) => setPercentValue(e.target.value)}
                                            max="100"
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="fixed" className="space-y-4 m-0 animate-in fade-in slide-in-from-right-2 duration-200">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Desconto Bruto (R$)</Label>
                                        <Input
                                            type="number"
                                            placeholder="Ex: 50.00"
                                            className="h-11 px-5 bg-white border-slate-200 rounded-2xl focus-visible:ring-bee-amber/20 focus-visible:border-bee-amber shadow-sm"
                                            value={fixedValue}
                                            onChange={(e) => setFixedValue(e.target.value)}
                                        />
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>

                        <div className="p-6 bg-slate-50/80 rounded-3xl border border-slate-100/50 flex flex-col gap-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Valor Final Estimado</span>
                            <span className="text-3xl font-black font-display text-bee-midnight">
                                R$ {calculateNewPrice().toFixed(2)}
                            </span>
                        </div>
                    </div>
                </ScrollArea>

                <SheetFooter className="p-8 border-t bg-slate-50/50 flex flex-col gap-3 shrink-0">
                    <div className="flex w-full gap-3">
                        <Button
                            variant="ghost"
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 h-10 rounded-full font-bold text-slate-400 hover:text-slate-600 transition-all uppercase tracking-widest text-[10px]"
                        >
                            Cancelar
                        </Button>
                        <Button
                            disabled={submitting || (discountMode === 'percent' ? !percentValue : !fixedValue)}
                            onClick={handleSubmit}
                            className="flex-[1.5] h-10 rounded-full bg-bee-amber text-bee-midnight hover:bg-bee-amber/90 font-black shadow-lg shadow-bee-amber/20 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-[10px]"
                        >
                            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Aplicar Desconto
                        </Button>
                    </div>
                    {hasExistingDiscount && (
                        <Button
                            variant="ghost"
                            type="button"
                            disabled={submitting}
                            onClick={handleRemove}
                            className="w-full h-10 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50/50 font-bold transition-all uppercase tracking-wider text-[10px]"
                        >
                            Remover Desconto Atual
                        </Button>
                    )}
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
