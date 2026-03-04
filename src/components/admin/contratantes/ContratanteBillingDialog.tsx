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
                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-bee-orange">
                    <Edit2 className="w-3.5 h-3.5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Alterar Mensalidade / Aplicar Desconto</DialogTitle>
                    <DialogDescription>
                        Ajuste o valor que este cliente pagará. Válido primariamente para assinaturas Pix Automático.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-4">
                        <Label>Tipo de Ajuste</Label>
                        <select
                            className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            value={overrideType}
                            onChange={(e) => setOverrideType(e.target.value as any)}
                            disabled={loading}
                        >
                            <option value="none">Nenhum (usar preço do plano)</option>
                            <option value="price">Forçar preço fixo (R$)</option>
                            <option value="discount_amount">Desconto fixo (R$)</option>
                            <option value="discount_percentage">Desconto percentual (%)</option>
                        </select>
                    </div>

                    {overrideType !== 'none' && (
                        <div className="space-y-2">
                            <Label>Valor / Porcentagem</Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={overrideValue}
                                onChange={(e) => setOverrideValue(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancelar</Button>
                    <Button className="bg-[#00173F] hover:bg-[#00173f]/90" onClick={handleSave} disabled={loading}>
                        {loading ? 'Salvando...' : 'Aplicar Alteração'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
