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

const tierBadge: Record<string, string> = {
    STARTER: 'bg-amber-50 text-amber-600 border border-amber-200',
    PLUS: 'bg-blue-50 text-blue-600 border border-blue-200',
    STUDIO: 'bg-teal-50 text-teal-600 border border-teal-200',
    PRO: 'bg-slate-100 text-slate-600 border border-slate-200',
    ENTERPRISE: 'bg-orange-50 text-bee-orange border border-orange-200',
};

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export function ContratantesTable() {
    const [data, setData] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('TODOS');
    const [plano, setPlano] = useState('TODOS');
    const LIMIT = 20;

    const load = useCallback(() => {
        const params = new URLSearchParams({
            page: String(page), limit: String(LIMIT),
            search, status, plano,
        });
        fetch(`/api/admin/contratantes?${params}`)
            .then(r => r.json())
            .then(d => { setData(d.data); setTotal(d.total); });
    }, [page, search, status, plano]);

    useEffect(() => { load(); }, [load]);

    const totalPages = Math.ceil(total / LIMIT);

    return (
        <div className="space-y-4">
            {/* Filtros */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Buscar por nome ou e-mail..."
                        className="pl-9"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
                <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
                    <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="TODOS">Todos os status</SelectItem>
                        <SelectItem value="PENDENTE">Pendente</SelectItem>
                        <SelectItem value="TRIAL">Trial</SelectItem>
                        <SelectItem value="ATIVO">Ativo</SelectItem>
                        <SelectItem value="INADIMPLENTE">Inadimplente</SelectItem>
                        <SelectItem value="INATIVO">Inativo</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={plano} onValueChange={v => { setPlano(v); setPage(1); }}>
                    <SelectTrigger className="w-36"><SelectValue placeholder="Plano" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="TODOS">Todos os planos</SelectItem>
                        <SelectItem value="STARTER">Starter</SelectItem>
                        <SelectItem value="PLUS">Plus</SelectItem>
                        <SelectItem value="STUDIO">Studio</SelectItem>
                        <SelectItem value="PRO">Pro</SelectItem>
                        <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Tabela */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/60">
                            <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Cliente</TableHead>
                            <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Localização</TableHead>
                            <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Plano</TableHead>
                            <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Método</TableHead>
                            <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Status</TableHead>
                            <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Desde</TableHead>
                            <TableHead />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((c) => (
                            <TableRow key={c.id} className="hover:bg-slate-50/60 transition-colors">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8 bg-orange-100">
                                            <AvatarFallback className="text-xs font-bold text-bee-orange bg-orange-100">
                                                {c.nome.slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-bold text-[#00173F] leading-tight">{c.nome}</p>
                                            <p className="text-xs text-slate-400">{c.email}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm text-slate-600">{c.cidade}/{c.uf}</TableCell>
                                <TableCell>
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${tierBadge[c.plano] ?? ''}`}>
                                        {c.plano}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                                        {c.metodo === 'PIX_AUTOMATICO'
                                            ? <><QrCode className="w-3.5 h-3.5 text-green-500" /> Pix</>
                                            : <><CreditCard className="w-3.5 h-3.5 text-blue-500" /> Cartão</>}
                                    </span>
                                </TableCell>
                                <TableCell><ContratanteStatusBadge status={c.status} /></TableCell>
                                <TableCell className="text-xs text-slate-500">{formatDate(c.desde)}</TableCell>
                                <TableCell>
                                    <Link href={`/admin/contratantes/${c.id}`}>
                                        <Button variant="outline" size="sm" className="text-xs h-7">
                                            Ver detalhes
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {/* Paginação */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                    <p className="text-xs text-slate-500">
                        {total} cliente{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-xs text-slate-500">{page} / {totalPages || 1}</span>
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
