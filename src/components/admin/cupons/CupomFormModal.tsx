'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface CupomFormModalProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    cupom?: any;
    onSaved: () => void;
}

export function CupomFormModal({ open, onOpenChange, cupom, onSaved }: CupomFormModalProps) {
    const isEditing = !!cupom;
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
            if (cupom) {
                setForm({
                    code: cupom.code,
                    description: cupom.description || '',
                    discount_type: cupom.discount_type,
                    discount_value: cupom.discount_value.toString(),
                    duration_months: cupom.duration_months ? cupom.duration_months.toString() : '',
                    is_active: cupom.is_active
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
    }, [open, cupom]);

    const [loading, setLoading] = useState(false);

    const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

    const handleSubmit = async () => {
        if (!form.code || !form.discount_value) {
            toast({ title: 'Código e Valor são obrigatórios.', variant: 'destructive' });
            return;
        }

        setLoading(true);
        const url = isEditing ? `/api/admin/coupons/${cupom.id}` : '/api/admin/coupons';
        const method = isEditing ? 'PUT' : 'POST';

        const payload = {
            ...form,
            discount_value: Number(form.discount_value),
            duration_months: form.duration_months ? Number(form.duration_months) : null
        };

        try {
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro ao salvar cupom');

            toast({ title: isEditing ? 'Cupom atualizado!' : 'Cupom criado!' });
            onSaved();
            onOpenChange(false);
        } catch (err: any) {
            toast({ title: err.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="font-display text-[#00173F]">
                        {isEditing ? 'Editar Cupom' : 'Novo Cupom'}
                    </DialogTitle>
                    <DialogDescription>
                        Crie códigos de desconto para alunos aplicarem no checkout.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-1.5">
                        <Label>Código <span className="text-red-500">*</span></Label>
                        <Input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="ex: BEMVINDO20" />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Descrição</Label>
                        <Input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Promoção de inauguração" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>Tipo de Desconto</Label>
                            <select
                                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={form.discount_type}
                                onChange={(e) => set('discount_type', e.target.value)}
                            >
                                <option value="PERCENTAGE">Porcentagem (%)</option>
                                <option value="FIXED_AMOUNT">Valor Fixo (R$)</option>
                                <option value="FREE_MONTHS">Meses Grátis</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>
                                {form.discount_type === 'PERCENTAGE' ? 'Porcentagem (%)' : form.discount_type === 'FIXED_AMOUNT' ? 'Valor a abater (R$)' : 'Meses a conceder'}
                                <span className="text-red-500"> *</span>
                            </Label>
                            <Input type="number" step={form.discount_type === 'PERCENTAGE' ? '1' : '0.01'} value={form.discount_value} onChange={e => set('discount_value', e.target.value)} placeholder="Ex: 20" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Duração do Cupom (Meses)</Label>
                        <Input type="number" value={form.duration_months} onChange={e => set('duration_months', e.target.value)} placeholder="Deixe em branco para vitalício/único" />
                        <p className="text-xs text-slate-500">Opcional. Quantos meses o desconto se manterá na assinatura recorrente.</p>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                        <Switch id="active" checked={form.is_active} onCheckedChange={(v) => set('is_active', v)} />
                        <Label htmlFor="active">Cupom Ativo</Label>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-bee-orange hover:bg-orange-600 border-none text-white">
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
