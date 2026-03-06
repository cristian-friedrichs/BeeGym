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
            <DialogContent className="max-w-lg border-none rounded-[2rem] shadow-2xl p-0 overflow-hidden bg-white">
                <DialogHeader className="px-8 pt-8 pb-4 relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
                    <div className="flex items-center gap-3 mb-2 relative">
                        <div className="w-1.5 h-6 bg-bee-amber rounded-full" />
                        <DialogTitle className="text-xl font-bold font-display tracking-tight text-bee-midnight">
                            {isEditing ? 'Editar Plano' : 'Novo Plano'}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-slate-500 font-medium relative">
                        {isEditing ? 'Alterações afetarão a próxima cobrança dos assinantes ativos.' : 'Configure o novo plano de assinatura.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="px-8 py-2 relative">
                    {/* Aviso de impacto ao editar */}
                    {isEditing && plano?.assinantes_ativos > 0 && (
                        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100 mb-6 group transition-all hover:bg-amber-100/50">
                            <div className="w-8 h-8 rounded-xl bg-white border border-amber-200 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                <AlertTriangle className="w-4 h-4 text-bee-amber" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-amber-700">Atenção ao alterar valores</p>
                                <p className="text-[11px] font-medium text-amber-600 leading-tight">
                                    Alterar o valor deste plano afetará a próxima cobrança de todos os{' '}
                                    <span className="font-black text-amber-700">{plano.assinantes_ativos} assinantes ativos</span>. Esta ação não pode ser desfeita.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2 group">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 group-focus-within:text-bee-amber transition-colors">Nome do Plano <span className="text-bee-amber">*</span></Label>
                                <Input
                                    value={form.nome}
                                    onChange={e => set('nome', e.target.value)}
                                    placeholder="ex: Pro Mensal"
                                    className="h-12 rounded-2xl border-slate-200 focus-visible:ring-bee-amber/10 focus-visible:border-bee-amber shadow-sm"
                                />
                            </div>
                            <div className="space-y-2 group">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 group-focus-within:text-bee-amber transition-colors">Tier</Label>
                                <Select value={form.tier} onValueChange={v => set('tier', v)}>
                                    <SelectTrigger className="h-12 rounded-2xl border-slate-200 focus:ring-bee-amber/10 focus:border-bee-amber shadow-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-2">
                                        <SelectItem value="STARTER" className="rounded-xl focus:bg-amber-50 focus:text-bee-amber font-bold py-3 px-4">Starter</SelectItem>
                                        <SelectItem value="PLUS" className="rounded-xl focus:bg-amber-50 focus:text-bee-amber font-bold py-3 px-4">Plus</SelectItem>
                                        <SelectItem value="STUDIO" className="rounded-xl focus:bg-amber-50 focus:text-bee-amber font-bold py-3 px-4">Studio</SelectItem>
                                        <SelectItem value="PRO" className="rounded-xl focus:bg-amber-50 focus:text-bee-amber font-bold py-3 px-4">Pro</SelectItem>
                                        <SelectItem value="ENTERPRISE" className="rounded-xl focus:bg-amber-50 focus:text-bee-amber font-bold py-3 px-4">Enterprise</SelectItem>
                                        <SelectItem value="CUSTOM" className="rounded-xl focus:bg-amber-50 focus:text-bee-amber font-bold py-3 px-4">Custom</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 group">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 group-focus-within:text-bee-amber transition-colors">Valor Mensal (R$) <span className="text-bee-amber">*</span></Label>
                                <Input
                                    type="number"
                                    value={form.valor_mensal}
                                    onChange={e => set('valor_mensal', Number(e.target.value))}
                                    placeholder="249"
                                    disabled={isEditing}
                                    className="h-12 rounded-2xl border-slate-200 focus-visible:ring-bee-amber/10 focus-visible:border-bee-amber shadow-sm disabled:opacity-50 disabled:bg-slate-50"
                                />
                            </div>
                            <div className="space-y-2 group">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 group-focus-within:text-bee-amber transition-colors">Intervalo</Label>
                                <Select value={form.intervalo} onValueChange={v => set('intervalo', v)} disabled={isEditing}>
                                    <SelectTrigger className="h-12 rounded-2xl border-slate-200 focus:ring-bee-amber/10 focus:border-bee-amber shadow-sm disabled:opacity-50 disabled:bg-slate-50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-2">
                                        <SelectItem value="Mensal" className="rounded-xl focus:bg-amber-50 focus:text-bee-amber font-bold py-3 px-4">Mensal</SelectItem>
                                        <SelectItem value="Trimestral" className="rounded-xl focus:bg-amber-50 focus:text-bee-amber font-bold py-3 px-4">Trimestral</SelectItem>
                                        <SelectItem value="Semestral" className="rounded-xl focus:bg-amber-50 focus:text-bee-amber font-bold py-3 px-4">Semestral</SelectItem>
                                        <SelectItem value="Anual" className="rounded-xl focus:bg-amber-50 focus:text-bee-amber font-bold py-3 px-4">Anual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 group">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 group-focus-within:text-bee-amber transition-colors">Repetições (0 = indefinido)</Label>
                                <Input
                                    type="number"
                                    value={form.repeticoes}
                                    onChange={e => set('repeticoes', Number(e.target.value))}
                                    min={0}
                                    className="h-12 rounded-2xl border-slate-200 focus-visible:ring-bee-amber/10 focus-visible:border-bee-amber shadow-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-8 py-6 border-t bg-slate-50/50 gap-3 mt-6">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="text-slate-400 font-bold hover:bg-slate-100 rounded-xl border-none h-11">Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="h-11 px-8 bg-bee-amber text-bee-midnight hover:bg-amber-500 font-black uppercase tracking-widest text-[11px] rounded-2xl shadow-lg shadow-amber-500/20 transition-all border-none disabled:opacity-40">
                        {loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Plano'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
