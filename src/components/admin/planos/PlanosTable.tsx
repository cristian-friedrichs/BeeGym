'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { PlanoFormModal } from './PlanoFormModal';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PlanoSyncButton } from './PlanoSyncButton';
import { cn } from '@/lib/utils';

const tierBadge: Record<string, string> = {
    STARTER: 'bg-amber-50 text-amber-600 border border-amber-200/50 shadow-sm',
    PLUS: 'bg-blue-50 text-blue-600 border border-blue-200/50 shadow-sm',
    STUDIO: 'bg-emerald-50 text-emerald-600 border border-emerald-200/50 shadow-sm',
    PRO: 'bg-indigo-50 text-indigo-600 border border-indigo-200/50 shadow-sm',
    ENTERPRISE: 'bg-bee-amber/10 text-bee-amber border border-bee-amber/20 shadow-sm',
    CUSTOM: 'bg-purple-50 text-purple-700 border border-purple-200/50 shadow-sm',
};

const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export function PlanosTable({ externalOpenNew, onExternalOpenHandled }: { externalOpenNew?: boolean; onExternalOpenHandled?: () => void } = {}) {
    const [planos, setPlanos] = useState<any[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editando, setEditando] = useState<any>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; nome: string; assinantes: number } | null>(null);
    const [deleteInput, setDeleteInput] = useState('');
    const { toast } = useToast();

    const load = useCallback(() => {
        let active = true;

        fetch('/api/admin/planos')
            .then(r => {
                if (!r.ok) throw new Error('Falha ao carregar planos');
                return r.json();
            })
            .then(data => {
                if (active && Array.isArray(data)) {
                    setPlanos(data);
                }
            })
            .catch(err => {
                if (active) {
                    console.error('Erro ao carregar planos:', err);
                    toast({ title: 'Erro ao carregar planos', variant: 'destructive' });
                }
            });

        return () => { active = false; };
    }, [toast]);

    useEffect(() => {
        const cleanup = load();
        return cleanup;
    }, [load]);

    // Respond to external trigger from page header
    useEffect(() => {
        if (externalOpenNew) {
            setEditando(null);
            setModalOpen(true);
            onExternalOpenHandled?.();
        }
    }, [externalOpenNew, onExternalOpenHandled]);

    const handleDelete = async (id: string) => {
        const res = await fetch(`/api/admin/planos/${id}`, { method: 'DELETE' });
        if (res.ok) {
            toast({ title: 'Plano removido.' });
            load();
        } else {
            const data = await res.json();
            toast({ title: data.error, variant: 'destructive' });
        }
        setDeleteConfirm(null);
        setDeleteInput('');
    };

    return (
        <div className="space-y-4">

            {/* Tabela */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-50/30 to-transparent pointer-events-none" />
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b-slate-100">
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-14 px-6">Nome / Descrição</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-14">Tier</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-14">Valor</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-14">Intervalo</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-14 text-center">Assinantes</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-14">EFI HML</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-14">EFI PRD</TableHead>
                            <TableHead className="h-14 w-20 px-6 text-right" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {planos.map((p) => (
                            <TableRow key={p.id} className="hover:bg-amber-50/30 transition-all duration-300 border-b-slate-50 cursor-default group/row">
                                <TableCell className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <p className="text-sm font-black text-bee-midnight group-hover/row:text-bee-amber transition-colors">{p.nome}</p>
                                        <p className="text-[11px] font-bold text-slate-400 truncate max-w-[200px]">{p.descricao}</p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className={cn(
                                        'text-[9px] font-black tracking-widest px-3 py-1.5 rounded-lg uppercase',
                                        tierBadge[p.tier] ?? 'bg-slate-100 text-slate-500'
                                    )}>
                                        {p.tier}
                                    </span>
                                </TableCell>
                                <TableCell className="text-sm font-black text-bee-midnight">{formatCurrency(p.valor_mensal)}</TableCell>
                                <TableCell>
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest bg-slate-50 px-2 py-1 rounded-md border border-slate-100/50">
                                        {p.intervalo}
                                    </span>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="inline-flex flex-col items-center bg-slate-50 px-3 py-1 rounded-xl border border-slate-100/50">
                                        <span className="font-black text-sm text-bee-midnight leading-none">{p.assinantes_ativos}</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Ativos</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <code className="bg-slate-50 text-[10px] text-slate-400 px-2 py-1 rounded-lg border border-slate-100/50 font-mono">
                                        {p.efi_plan_id_hml ?? '—'}
                                    </code>
                                </TableCell>
                                <TableCell>
                                    <code className="bg-slate-50 text-[10px] text-slate-400 px-2 py-1 rounded-lg border border-slate-100/50 font-mono">
                                        {p.efi_plan_id_prd ?? '—'}
                                    </code>
                                </TableCell>
                                <TableCell className="px-6 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 rounded-xl text-slate-300 hover:text-bee-amber hover:bg-amber-50 transition-all"
                                            onClick={() => { setEditando(p); setModalOpen(true); }}
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                            onClick={() => setDeleteConfirm({ id: p.id, nome: p.nome, assinantes: p.assinantes_ativos })}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Modal Criar/Editar */}
            <PlanoFormModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                plano={editando}
                onSaved={load}
            />

            {/* Dialog de Deletar */}
            <AlertDialog open={!!deleteConfirm} onOpenChange={open => { if (!open) { setDeleteConfirm(null); setDeleteInput(''); } }}>
                <AlertDialogContent className="border-none rounded-[2rem] shadow-2xl p-0 overflow-hidden">
                    <AlertDialogHeader className="px-8 pt-8 pb-4 relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
                        <div className="flex items-center gap-3 mb-2 relative">
                            <div className="w-1.5 h-6 bg-red-500 rounded-full" />
                            <AlertDialogTitle className="text-xl font-bold font-display tracking-tight text-bee-midnight">
                                Remover Plano
                            </AlertDialogTitle>
                        </div>
                        <AlertDialogDescription asChild>
                            <div className="relative">
                                {(deleteConfirm?.assinantes ?? 0) > 0 ? (
                                    <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-white border border-red-100 flex items-center justify-center shrink-0">
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-red-600">Não é possível remover.</p>
                                            <p className="text-[11px] font-medium text-red-500 leading-tight mt-1">
                                                Este plano possui {deleteConfirm?.assinantes} assinante(s) ativo(s). Remova ou migre os assinantes antes de excluir o plano.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <p className="text-sm text-slate-500 font-medium">
                                            Esta ação é irreversível. O plano <span className="text-bee-midnight font-black uppercase text-[11px] tracking-widest">{deleteConfirm?.nome}</span> será removido permanentemente.
                                        </p>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Para confirmar, digite o nome do plano:</label>
                                            <Input
                                                placeholder={deleteConfirm?.nome}
                                                value={deleteInput}
                                                onChange={e => setDeleteInput(e.target.value)}
                                                className="h-12 rounded-2xl border-slate-200 focus-visible:ring-red-500/10 focus-visible:border-red-500 shadow-sm"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="px-8 py-6 border-t bg-slate-50/50 gap-3 mt-4">
                        <AlertDialogCancel className="text-slate-400 font-bold hover:bg-slate-100 rounded-xl border-none h-11">Cancelar</AlertDialogCancel>
                        {(deleteConfirm?.assinantes ?? 0) === 0 && (
                            <AlertDialogAction
                                onClick={() => deleteConfirm && handleDelete(deleteConfirm.id)}
                                disabled={deleteInput !== deleteConfirm?.nome}
                                className="h-11 px-8 bg-red-600 text-white hover:bg-red-700 font-black uppercase tracking-widest text-[11px] rounded-2xl shadow-lg shadow-red-500/20 transition-all border-none disabled:opacity-40"
                            >
                                Remover Permanentemente
                            </AlertDialogAction>
                        )}
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
