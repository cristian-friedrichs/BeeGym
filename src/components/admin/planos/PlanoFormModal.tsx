'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PlanoFormModalProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    plano?: any;
    onSaved: () => void;
}

export function PlanoFormModal({ open, onOpenChange, plano, onSaved }: PlanoFormModalProps) {
    const isEditing = !!plano;
    const { toast } = useToast();

    const [form, setForm] = useState({
        nome: plano?.nome ?? '',
        tier: plano?.tier ?? 'STARTER',
        valor_mensal: plano?.valor_mensal ?? '',
        descricao: plano?.descricao ?? '',
        intervalo: plano?.intervalo ?? 'Mensal',
        repeticoes: plano?.repeticoes ?? 0,
    });

    const [confirmDelete, setConfirmDelete] = useState('');
    const [loading, setLoading] = useState(false);

    const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

    const handleSubmit = async () => {
        if (!form.nome || !form.valor_mensal) {
            toast({ title: 'Preencha todos os campos obrigatórios.', variant: 'destructive' });
            return;
        }
        setLoading(true);
        try {
            if (isEditing) {
                // For this MVP, we are specifically focused on updating the global price
                const url = `/api/admin/planos/${plano.id}/price`;
                const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ new_price: form.valor_mensal }) });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Erro ao atualizar plano');
                toast({ title: 'Plano atualizado!', description: data.sync_result ? `Sincronizados: ${data.sync_result.success}, Falhas: ${data.sync_result.errors}` : '' });
            } else {
                const url = '/api/admin/planos';
                const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
                if (!res.ok) throw new Error('Erro ao criar plano');
                toast({ title: 'Plano criado!' });
            }
        } catch (err: any) {
            toast({ title: err.message, variant: 'destructive' });
        } finally {
            setLoading(false);
            onSaved();
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="font-display text-[#00173F]">
                        {isEditing ? 'Editar Plano' : 'Novo Plano'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing ? 'Alterações afetarão a próxima cobrança dos assinantes ativos.' : 'Configure o novo plano de assinatura.'}
                    </DialogDescription>
                </DialogHeader>

                {/* Aviso de impacto ao editar */}
                {isEditing && plano?.assinantes_ativos > 0 && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                        <span>
                            Alterar o valor deste plano afetará a próxima cobrança de todos os{' '}
                            <strong>{plano.assinantes_ativos} assinantes ativos</strong>. Esta ação não pode ser desfeita.
                        </span>
                    </div>
                )}

                <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5 col-span-2">
                            <Label>Nome do Plano <span className="text-red-500">*</span></Label>
                            <Input value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="ex: Pro Mensal" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Tier</Label>
                            <Select value={form.tier} onValueChange={v => set('tier', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="STARTER">Starter</SelectItem>
                                    <SelectItem value="PLUS">Plus</SelectItem>
                                    <SelectItem value="STUDIO">Studio</SelectItem>
                                    <SelectItem value="PRO">Pro</SelectItem>
                                    <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                                    <SelectItem value="CUSTOM">Custom</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Valor Mensal (R$) <span className="text-red-500">*</span></Label>
                            <Input type="number" value={form.valor_mensal} onChange={e => set('valor_mensal', Number(e.target.value))} placeholder="249" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Intervalo</Label>
                            <Select value={form.intervalo} onValueChange={v => set('intervalo', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Mensal">Mensal</SelectItem>
                                    <SelectItem value="Trimestral">Trimestral</SelectItem>
                                    <SelectItem value="Semestral">Semestral</SelectItem>
                                    <SelectItem value="Anual">Anual</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Repetições (0 = indefinido)</Label>
                            <Input type="number" value={form.repeticoes} onChange={e => set('repeticoes', Number(e.target.value))} min={0} />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-bee-orange hover:bg-orange-600">
                        {loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Plano'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
