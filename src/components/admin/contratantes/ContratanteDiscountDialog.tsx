'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Percent, DollarSign } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-8 pb-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-bee-amber/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                    <DialogTitle className="text-xl font-bold font-display tracking-tight text-bee-midnight">
                        Personalizar Preço
                    </DialogTitle>
                    <DialogDescription className="text-sm font-medium text-slate-400">
                        Adicione um desconto para a mensalidade. Preço Base: <span className="font-bold text-slate-500">R$ {currentPrice.toFixed(2)}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="px-8 py-4 space-y-6">
                    <Tabs value={discountMode} onValueChange={(v: any) => setDiscountMode(v)} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-xl">
                            <TabsTrigger value="percent" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <Percent className="w-4 h-4 mr-2" /> Porcentagem
                            </TabsTrigger>
                            <TabsTrigger value="fixed" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <DollarSign className="w-4 h-4 mr-2" /> Valor Fixo
                            </TabsTrigger>
                        </TabsList>

                        <div className="mt-6">
                            <TabsContent value="percent" className="space-y-4 m-0">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Porcentagem (%)</Label>
                                    <Input
                                        type="number"
                                        placeholder="Ex: 10"
                                        className="h-12 bg-slate-50 border-slate-200 rounded-xl"
                                        value={percentValue}
                                        onChange={(e) => setPercentValue(e.target.value)}
                                        max="100"
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="fixed" className="space-y-4 m-0">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Desconto Bruto (R$)</Label>
                                    <Input
                                        type="number"
                                        placeholder="Ex: 50.00"
                                        className="h-12 bg-slate-50 border-slate-200 rounded-xl"
                                        value={fixedValue}
                                        onChange={(e) => setFixedValue(e.target.value)}
                                    />
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">Valor Final Estimado</span>
                        <span className="text-xl font-black font-display text-bee-midnight">
                            R$ {calculateNewPrice().toFixed(2)}
                        </span>
                    </div>
                </div>

                <DialogFooter className="p-6 border-t bg-slate-50/50 flex-col sm:flex-row gap-3">
                    {hasExistingDiscount && (
                        <Button
                            variant="outline"
                            type="button"
                            disabled={submitting}
                            onClick={handleRemove}
                            className="text-red-600 border-red-200 hover:bg-red-50 rounded-xl sm:mr-auto"
                        >
                            Remover Desconto
                        </Button>
                    )}
                    <Button variant="ghost" type="button" onClick={() => onOpenChange(false)} className="rounded-xl">
                        Cancelar
                    </Button>
                    <Button
                        disabled={submitting || (discountMode === 'percent' ? !percentValue : !fixedValue)}
                        onClick={handleSubmit}
                        className="bg-bee-amber text-bee-midnight hover:bg-bee-amber/90 font-black tracking-widest uppercase text-[11px] rounded-xl shadow-sm"
                    >
                        {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Aplicar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
