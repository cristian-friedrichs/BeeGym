'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ContratanteStatusBadge } from './ContratanteStatusBadge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChevronLeft, ChevronRight, Search, CreditCard, QrCode } from 'lucide-react';
import Link from 'next/link';
import { NovoClienteModal } from './NovoClienteModal';
import { cn } from '@/lib/utils';

const tierBadge: Record<string, string> = {
    STARTER: 'bg-amber-50 text-amber-600 border border-amber-200/50',
    PLUS: 'bg-blue-50 text-blue-600 border border-blue-200/50',
    STUDIO: 'bg-emerald-50 text-emerald-600 border border-emerald-200/50',
    PRO: 'bg-indigo-50 text-indigo-600 border border-indigo-200/50',
    ENTERPRISE: 'bg-bee-amber/10 text-bee-amber border border-bee-amber/20',
};

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export function ContratantesTable({ externalOpenNew, onExternalOpenHandled }: { externalOpenNew?: boolean; onExternalOpenHandled?: () => void } = {}) {
    const [data, setData] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('TODOS');
    const [plano, setPlano] = useState('TODOS');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const LIMIT = 20;

    const load = useCallback(() => {
        const controller = new AbortController();

        const params = new URLSearchParams({
            page: String(page),
            limit: String(LIMIT),
            search,
            status,
            plano,
        });

        fetch(`/api/admin/contratantes?${params}`, { signal: controller.signal })
            .then(async (r) => {
                if (!r.ok) throw new Error('Falha ao carregar dados');
                return r.json();
            })
            .then(d => {
                setData(d.data || []);
                setTotal(d.total || 0);
            })
            .catch(err => {
                if (err.name === 'AbortError' || err.message?.includes('aborted')) {
                    return;
                }
                console.error('Erro ao carregar contratantes:', err);
            });

        return controller;
    }, [page, search, status, plano]);

    useEffect(() => {
        const controller = load();
        return () => controller.abort();
    }, [load]);

    useEffect(() => {
        if (externalOpenNew) {
            setIsModalOpen(true);
            onExternalOpenHandled?.();
        }
    }, [externalOpenNew, onExternalOpenHandled]);

    const totalPages = Math.ceil(total / LIMIT);

    return (
        <div className="space-y-4">
            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-4 bg-white/40 p-2 rounded-[2.5rem] border border-white/60 backdrop-blur-sm shadow-sm mb-2">
                <div className="relative flex-1 min-w-[300px] group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-bee-amber transition-colors" />
                    <Input
                        placeholder="Buscar por nome, e-mail ou documento..."
                        className="pl-12 h-14 bg-white border-slate-100 rounded-[1.5rem] focus-visible:ring-bee-amber/10 focus-visible:border-bee-amber transition-all shadow-sm font-medium"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
                <div className="flex items-center gap-2 pr-2">
                    <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
                        <SelectTrigger className="w-48 h-14 rounded-[1.5rem] border-slate-100 bg-white font-bold text-slate-600 focus:ring-bee-amber/10 focus:border-bee-amber shadow-sm px-6">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2">
                            <SelectItem value="TODOS" className="rounded-xl font-bold py-3">Todos os status</SelectItem>
                            <SelectItem value="PENDENTE" className="rounded-xl font-bold py-3">Pendente</SelectItem>
                            <SelectItem value="TRIAL" className="rounded-xl font-bold py-3 text-emerald-600">Trial</SelectItem>
                            <SelectItem value="ATIVO" className="rounded-xl font-bold py-3 text-blue-600">Ativo</SelectItem>
                            <SelectItem value="INADIMPLENTE" className="rounded-xl font-bold py-3 text-red-600">Inadimplente</SelectItem>
                            <SelectItem value="INATIVO" className="rounded-xl font-bold py-3 text-slate-400">Inativo</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={plano} onValueChange={v => { setPlano(v); setPage(1); }}>
                        <SelectTrigger className="w-44 h-14 rounded-[1.5rem] border-slate-100 bg-white font-bold text-slate-600 focus:ring-bee-amber/10 focus:border-bee-amber shadow-sm px-6">
                            <SelectValue placeholder="Plano" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2">
                            <SelectItem value="TODOS" className="rounded-xl font-bold py-3">Todos os planos</SelectItem>
                            <SelectItem value="STARTER" className="rounded-xl font-bold py-3">Starter</SelectItem>
                            <SelectItem value="PLUS" className="rounded-xl font-bold py-3">Plus</SelectItem>
                            <SelectItem value="STUDIO" className="rounded-xl font-bold py-3">Studio</SelectItem>
                            <SelectItem value="PRO" className="rounded-xl font-bold py-3">Pro</SelectItem>
                            <SelectItem value="ENTERPRISE" className="rounded-xl font-bold py-3 text-bee-amber">Enterprise</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <NovoClienteModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onClientCreated={load}
            />

            {/* Tabela */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-50/30 to-transparent pointer-events-none" />
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b-slate-100">
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-14 px-6">Cliente</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-14">Localização</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-14 text-center">Alunos</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-14">Plano</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-14">Pagamento</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-14">Status</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-14">Cadastro</TableHead>
                            <TableHead className="h-14 w-10" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((c) => (
                            <TableRow key={c.id} className="hover:bg-amber-50/30 transition-all duration-300 border-b-slate-50 cursor-default group/row">
                                <TableCell className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <Avatar className="h-11 w-11 bg-white border-2 border-slate-100 shadow-sm transition-transform group-hover/row:scale-110 duration-500">
                                                <AvatarFallback className="text-xs font-black text-bee-midnight bg-gradient-to-br from-bee-amber/20 to-bee-amber/5">
                                                    {c.nome.slice(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white bg-emerald-500 shadow-sm" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-bee-midnight group-hover/row:text-bee-amber transition-colors">{c.nome}</p>
                                            <p className="text-[11px] font-bold text-slate-400 tracking-tight">{c.email}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-600">{c.cidade}</span>
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{c.uf}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="inline-flex flex-col items-center bg-slate-50 px-3 py-1 rounded-xl border border-slate-100/50">
                                        <span className="font-black text-sm text-bee-midnight leading-none">{c.alunos_ativos}</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Ativos</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className={cn(
                                        'text-[9px] font-black tracking-widest px-3 py-1.5 rounded-lg uppercase shadow-sm',
                                        tierBadge[c.plano] ?? 'bg-slate-100 text-slate-500'
                                    )}>
                                        {c.plano}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {c.metodo === 'PIX_AUTOMATICO' ? (
                                            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100/50 shadow-sm">
                                                <QrCode className="w-4 h-4 text-emerald-600" />
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100/50 shadow-sm">
                                                <CreditCard className="w-4 h-4 text-blue-600" />
                                            </div>
                                        )}
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                                            {c.metodo === 'PIX_AUTOMATICO' ? 'Pix' : 'Cartão'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <ContratanteStatusBadge status={c.status} />
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-500">{formatDate(c.desde)}</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Há 2 meses</span>
                                    </div>
                                </TableCell>
                                <TableCell className="px-6">
                                    <Link href={`/admin/contratantes/${c.id}`}>
                                        <Button variant="ghost" size="icon" className="w-10 h-10 rounded-2xl text-slate-300 hover:text-bee-amber hover:bg-amber-50 hover:border-bee-amber/20 border-2 border-transparent transition-all">
                                            <ChevronRight className="w-5 h-5" />
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {/* Paginação */}
                <div className="flex items-center justify-between px-8 py-5 border-t border-slate-50 bg-slate-50/20 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-bee-amber animate-pulse" />
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                            {total} cliente{total !== 1 ? 's' : ''} total
                        </p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Página</span>
                            <div className="bg-white border-2 border-slate-100 rounded-xl px-3 py-1 text-sm font-black text-bee-midnight shadow-sm min-w-[3rem] text-center">
                                {page}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">de {totalPages || 1}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 rounded-xl border-slate-100 text-slate-400 hover:text-bee-amber hover:border-bee-amber/20 disabled:opacity-30 shadow-sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 rounded-xl border-slate-100 text-slate-400 hover:text-bee-amber hover:border-bee-amber/20 disabled:opacity-30 shadow-sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                            >
                                <ChevronRight className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
