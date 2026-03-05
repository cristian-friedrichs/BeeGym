'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CupomFormModal } from './CupomFormModal';
import { Pencil, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export function CuponsTable({ externalOpenNew, onExternalOpenHandled }: { externalOpenNew?: boolean; onExternalOpenHandled?: () => void } = {}) {
    const [cupons, setCupons] = useState<any[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editando, setEditando] = useState<any>(null);
    const { toast } = useToast();

    const load = useCallback(() => {
        let active = true;
        fetch('/api/admin/coupons')
            .then(r => r.json())
            .then(data => {
                if (active && data.coupons) setCupons(data.coupons);
            })
            .catch(err => {
                if (active) {
                    console.error('Erro ao carregar cupons:', err);
                }
            });
        return () => { active = false; };
    }, []);

    useEffect(() => {
        const cleanup = load();
        return cleanup;
    }, [load]);

    useEffect(() => {
        if (externalOpenNew) {
            setEditando(null);
            setModalOpen(true);
            onExternalOpenHandled?.();
        }
    }, [externalOpenNew, onExternalOpenHandled]);

    return (
        <div className="space-y-4">

            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/60">
                            <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Ações</TableHead>
                            <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Código</TableHead>
                            <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Tipo / Valor</TableHead>
                            <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Duração</TableHead>
                            <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {cupons.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-6 text-slate-400">Nenhum cupom cadastrado.</TableCell>
                            </TableRow>
                        ) : cupons.map((c) => (
                            <TableRow key={c.id} className="hover:bg-slate-50/60 transition-colors">
                                <TableCell>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-bee-amber"
                                        onClick={() => { setEditando(c); setModalOpen(true); }}>
                                        <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                </TableCell>
                                <TableCell>
                                    <p className="font-bold font-mono text-sm text-[#0B0F1A]">{c.code}</p>
                                    {c.description && <p className="text-xs text-slate-400">{c.description}</p>}
                                </TableCell>
                                <TableCell className="font-bold text-sm">
                                    {c.discount_type === 'PERCENTAGE' && `${c.discount_value}%`}
                                    {c.discount_type === 'FIXED_AMOUNT' && `R$ ${c.discount_value.toFixed(2).replace('.', ',')}`}
                                    {c.discount_type === 'FREE_MONTHS' && `${c.discount_value} mês(es) grátis`}
                                </TableCell>
                                <TableCell className="text-sm text-slate-600">
                                    {c.duration_months ? `${c.duration_months} meses` : 'Permanente'}
                                </TableCell>
                                <TableCell>
                                    <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-md',
                                        c.is_active ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                                    )}>
                                        {c.is_active ? 'ATIVO' : 'INATIVO'}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <CupomFormModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                cupom={editando}
                onSaved={load}
            />
        </div>
    );
}
