'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OfertaFormModal } from './OfertaFormModal';
import { Pencil, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Tag } from 'lucide-react';

export function OfertasTable({ externalOpenNew, onExternalOpenHandled }: { externalOpenNew?: boolean; onExternalOpenHandled?: () => void } = {}) {
    const [ofertas, setOfertas] = useState<any[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editando, setEditando] = useState<any>(null);
    const { toast } = useToast();

    const load = useCallback(() => {
        let active = true;
        fetch('/api/admin/coupons')
            .then(r => r.json())
            .then(data => {
                if (active && data.coupons) setOfertas(data.coupons);
            })
            .catch(err => {
                if (active) {
                    console.error('Erro ao carregar ofertas:', err);
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
            {/* Tabela de Ofertas */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-50/30 to-transparent pointer-events-none" />
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b-slate-100">
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-14 px-6">Código / Descrição</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-14">Tipo / Valor</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-14">Duração</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-14 text-center">Status</TableHead>
                            <TableHead className="h-14 w-20 px-6 text-right" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {ofertas.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12">
                                    <div className="flex flex-col items-center justify-center gap-2 opacity-20">
                                        <Tag className="w-12 h-12" />
                                        <p className="font-black text-xs uppercase tracking-widest">Nenhuma oferta cadastrada</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : ofertas.map((c) => (
                            <TableRow key={c.id} className="hover:bg-amber-50/30 transition-all duration-300 border-b-slate-50 cursor-default group/row">
                                <TableCell className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <p className="text-sm font-black text-bee-midnight group-hover/row:text-bee-amber transition-colors font-mono tracking-tight">{c.code}</p>
                                        {c.description && <p className="text-[11px] font-bold text-slate-400 truncate max-w-[250px]">{c.description}</p>}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="inline-flex flex-col bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100/50 group-hover/row:bg-white group-hover/row:border-bee-amber/20 transition-all">
                                        <span className="text-sm font-black text-bee-midnight leading-none">
                                            {c.discount_type === 'PERCENTAGE' && `${c.discount_value}%`}
                                            {c.discount_type === 'FIXED_AMOUNT' && `R$ ${c.discount_value.toFixed(2).replace('.', ',')}`}
                                            {c.discount_type === 'FREE_MONTHS' && `${c.discount_value} mês(es)`}
                                        </span>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                                            {c.discount_type === 'PERCENTAGE' ? 'Desconto' : c.discount_type === 'FIXED_AMOUNT' ? 'Abatimento' : 'Grátis'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100/50 group-hover/row:bg-white transition-all">
                                        {c.duration_months ? `${c.duration_months} meses` : 'Permanente'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-center">
                                    <span className={cn(
                                        'text-[9px] font-black tracking-widest px-3 py-1.5 rounded-lg uppercase inline-block',
                                        c.is_active
                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50 shadow-sm'
                                            : 'bg-slate-50 text-slate-400 border border-slate-200/50'
                                    )}>
                                        {c.is_active ? 'ATIVO' : 'INATIVO'}
                                    </span>
                                </TableCell>
                                <TableCell className="px-6 text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-xl text-slate-300 hover:text-bee-amber hover:bg-amber-50 transition-all"
                                        onClick={() => { setEditando(c); setModalOpen(true); }}
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <OfertaFormModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                oferta={editando}
                onSaved={load}
            />
        </div>
    );
}
