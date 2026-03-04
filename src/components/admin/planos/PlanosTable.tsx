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
    STARTER: 'bg-amber-50 text-amber-600 border border-amber-200',
    PLUS: 'bg-blue-50 text-blue-600 border border-blue-200',
    STUDIO: 'bg-teal-50 text-teal-600 border border-teal-200',
    PRO: 'bg-slate-100 text-slate-600 border border-slate-200',
    ENTERPRISE: 'bg-orange-50 text-bee-orange border border-orange-200',
    CUSTOM: 'bg-purple-50 text-purple-700 border border-purple-200',
};

const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export function PlanosTable() {
    const [planos, setPlanos] = useState<any[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editando, setEditando] = useState<any>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; nome: string; assinantes: number } | null>(null);
    const [deleteInput, setDeleteInput] = useState('');
    const { toast } = useToast();

    const load = useCallback(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        fetch('/api/admin/planos', { signal })
            .then(r => {
                if (!r.ok) throw new Error('Falha ao carregar planos');
                return r.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setPlanos(data);
                }
            })
            .catch(err => {
                if (err.name === 'AbortError') return;
                console.error('Erro ao carregar planos:', err);
                toast({ title: 'Erro ao carregar planos', variant: 'destructive' });
            });

        return () => controller.abort();
    }, [toast]);

    useEffect(() => {
        const cleanup = load();
        return () => {
            if (typeof cleanup === 'function') cleanup();
        };
    }, [load]);

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
            {/* Barra de ações */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <Button className="bg-bee-orange hover:bg-orange-600 gap-2" onClick={() => { setEditando(null); setModalOpen(true); }}>
                        <Plus className="w-4 h-4" /> Novo Plano
                    </Button>
                    <PlanoSyncButton />
                </div>
            </div>

            {/* Tabela */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/60">
                            <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Nome</TableHead>
                            <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Tier</TableHead>
                            <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Valor</TableHead>
                            <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Intervalo</TableHead>
                            <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Assinantes</TableHead>
                            <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">EFI HML</TableHead>
                            <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">EFI PRD</TableHead>
                            <TableHead />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {planos.map((p) => (
                            <TableRow key={p.id} className="hover:bg-slate-50/60 transition-colors">
                                <TableCell>
                                    <p className="font-bold text-sm text-[#00173F]">{p.nome}</p>
                                    <p className="text-xs text-slate-400">{p.descricao}</p>
                                </TableCell>
                                <TableCell>
                                    <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-md', tierBadge[p.tier] ?? '')}>
                                        {p.tier}
                                    </span>
                                </TableCell>
                                <TableCell className="font-bold text-sm">{formatCurrency(p.valor_mensal)}</TableCell>
                                <TableCell className="text-sm text-slate-600">{p.intervalo}</TableCell>
                                <TableCell>
                                    <span className="font-bold text-sm text-[#00173F]">{p.assinantes_ativos}</span>
                                    <span className="text-xs text-slate-400 ml-1">ativos</span>
                                </TableCell>
                                <TableCell className="font-mono text-xs text-slate-500">{p.efi_plan_id_hml ?? '—'}</TableCell>
                                <TableCell className="font-mono text-xs text-slate-500">{p.efi_plan_id_prd ?? '—'}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-bee-orange"
                                            onClick={() => { setEditando(p); setModalOpen(true); }}>
                                            <Pencil className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
                                            onClick={() => setDeleteConfirm({ id: p.id, nome: p.nome, assinantes: p.assinantes_ativos })}>
                                            <Trash2 className="w-3.5 h-3.5" />
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
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover plano "{deleteConfirm?.nome}"?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div>
                                {(deleteConfirm?.assinantes ?? 0) > 0 ? (
                                    <p className="text-red-600 font-bold">
                                        Não é possível remover. {deleteConfirm?.assinantes} assinante(s) ativo(s) neste plano.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        <p>Esta ação é irreversível. Digite o nome do plano para confirmar:</p>
                                        <Input
                                            placeholder={deleteConfirm?.nome}
                                            value={deleteInput}
                                            onChange={e => setDeleteInput(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        {(deleteConfirm?.assinantes ?? 0) === 0 && (
                            <AlertDialogAction
                                onClick={() => deleteConfirm && handleDelete(deleteConfirm.id)}
                                disabled={deleteInput !== deleteConfirm?.nome}
                                className="bg-red-600 hover:bg-red-700 disabled:opacity-40"
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
