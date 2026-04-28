'use client';

import { useEffect, useState } from 'react';
import { SectionHeader } from '@/components/ui/section-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    DollarSign, TrendingUp, AlertTriangle, Users, XCircle,
    CreditCard, Search, ChevronDown, ChevronUp, Clock
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { formatCurrency, formatCurrencyK } from '@/lib/formatters';

interface FinanceiroData {
    kpis: {
        mrr: number;
        iet: number;
        totalReceita: number;
        inadimplencia: number;
        totalAtivos: number;
        totalCancelados: number;
        totalPendentes: number;
        receitaTotal6m: number;
        ticketMedioMRR: number;
    };
    porPlano: Array<{ tier: string; name: string; clientes: number; mrr: number; iet: number }>;
    porMetodo: Array<{ metodo: string; clientes: number; receita: number }>;
    evolucaoReceita: Array<{ mes: string; receita: number; inadimplentes: number }>;
    pagamentosAbertos: Array<{
        id: string; orgName: string; orgEmail: string; status: string;
        valor: number; plano: string; metodo: string; proximoVencimento: string | null; diasAtraso: number | null;
    }>;
    assinantesAtivos: Array<{
        id: string; orgName: string; orgEmail: string; status: string;
        plano: string; tier: string; metodo: string; valor: number; precoBase: number;
        temDesconto: boolean; isIET: boolean; cobrancasPagas: number;
        proximoVencimento: string | null; since: string;
    }>;
    ultimasCobranças: Array<{
        id: string; orgName: string; amount: number; status: string;
        paymentMethod: string | null; paidAt: string | null; createdAt: string;
    }>;
}

const PLAN_COLORS: Record<string, string> = {
    STARTER: '#FFBF00', PLUS: '#F59E0B', STUDIO: '#3B82F6',
    PRO: '#8B5CF6', ENTERPRISE: '#10B981', 'N/A': '#94A3B8',
};

const METODO_LABELS: Record<string, string> = {
    CARTAO_RECORRENTE: 'Cartão Recorrente', PIX_AUTOMATICO: 'PIX Automático',
    BOLETO: 'Boleto', CARTAO_CREDITO: 'Cartão de Crédito', PIX: 'PIX',
    KIWIFY: 'Kiwify', N_A: 'N/A',
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    ACTIVE:   { label: 'Ativo',      className: 'bg-green-50 text-green-700 border-green-100' },
    TRIAL:    { label: 'Trial',      className: 'bg-blue-50 text-blue-700 border-blue-100' },
    PAST_DUE: { label: 'Atrasado',   className: 'bg-red-50 text-red-700 border-red-100' },
    PENDING:  { label: 'Pendente',   className: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
    CANCELED: { label: 'Cancelado',  className: 'bg-slate-50 text-slate-500 border-slate-100' },
    PAGO:     { label: 'Pago',       className: 'bg-green-50 text-green-700 border-green-100' },
    FALHA:    { label: 'Falha',      className: 'bg-red-50 text-red-700 border-red-100' },
};

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] || { label: status, className: 'bg-slate-50 text-slate-500 border-slate-100' };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${cfg.className}`}>
            {cfg.label}
        </span>
    );
}

function formatDate(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR');
}

export default function FinanceiroPage() {
    const [data, setData] = useState<FinanceiroData | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchAtivos, setSearchAtivos] = useState('');
    const [sortAtivos, setSortAtivos] = useState<'valor' | 'plano' | 'since'>('valor');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [tabAtiva, setTabAtiva] = useState<'ativos' | 'abertos' | 'cobranças'>('ativos');

    useEffect(() => {
        fetch('/api/admin/financeiro')
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="space-y-6 pb-12 animate-pulse">
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {[...Array(5)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-28 border border-slate-100" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl h-72 border border-slate-100" />
                    <div className="bg-white rounded-2xl h-72 border border-slate-100" />
                </div>
            </div>
        );
    }

    if (!data) return <p className="text-slate-500">Erro ao carregar dados financeiros.</p>;

    const { kpis, porPlano, porMetodo, evolucaoReceita, pagamentosAbertos, assinantesAtivos, ultimasCobranças } = data;

    const filteredAtivos = assinantesAtivos
        .filter(a =>
            a.orgName.toLowerCase().includes(searchAtivos.toLowerCase()) ||
            a.orgEmail.toLowerCase().includes(searchAtivos.toLowerCase()) ||
            a.plano.toLowerCase().includes(searchAtivos.toLowerCase())
        )
        .sort((a, b) => {
            let av: any = a[sortAtivos === 'valor' ? 'valor' : sortAtivos === 'plano' ? 'tier' : 'since'];
            let bv: any = b[sortAtivos === 'valor' ? 'valor' : sortAtivos === 'plano' ? 'tier' : 'since'];
            if (sortDir === 'asc') return av > bv ? 1 : -1;
            return av < bv ? 1 : -1;
        });

    const SortIcon = ({ col }: { col: typeof sortAtivos }) =>
        sortAtivos === col
            ? (sortDir === 'desc' ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />)
            : <ChevronDown className="h-3 w-3 opacity-30" />;

    const toggleSort = (col: typeof sortAtivos) => {
        if (sortAtivos === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortAtivos(col); setSortDir('desc'); }
    };

    const pieData = porMetodo.map(m => ({ name: METODO_LABELS[m.metodo] || m.metodo, value: m.receita }));
    const PIE_COLORS = ['#FFBF00', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#94A3B8'];

    return (
        <div className="space-y-8 pb-12">
            <SectionHeader title="Financeiro" subtitle="Visão completa de receita, inadimplência e pagamentos" />

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <KpiCard
                    title="MRR"
                    value={formatCurrencyK(kpis.mrr)}
                    tooltip={`Receita recorrente (2º ciclo+): ${formatCurrency(kpis.mrr)}`}
                    color="amber"
                    icon={<DollarSign className="h-6 w-6" />}
                />
                <KpiCard
                    title="IET"
                    value={formatCurrencyK(kpis.iet)}
                    tooltip={`Ingresso de Entrada (1º ciclo): ${formatCurrency(kpis.iet)}`}
                    color="amber"
                    icon={<TrendingUp className="h-6 w-6" />}
                />
                <KpiCard
                    title="Receita Total (6m)"
                    value={formatCurrencyK(kpis.receitaTotal6m)}
                    tooltip={formatCurrency(kpis.receitaTotal6m)}
                    color="green"
                    icon={<DollarSign className="h-6 w-6" />}
                />
                <KpiCard
                    title="Inadimplência"
                    value={formatCurrencyK(kpis.inadimplencia)}
                    tooltip={`Receita em risco: ${formatCurrency(kpis.inadimplencia)}`}
                    color="default"
                    icon={<AlertTriangle className="h-6 w-6" />}
                />
                <KpiCard
                    title="Ticket Médio MRR"
                    value={formatCurrencyK(kpis.ticketMedioMRR)}
                    tooltip={formatCurrency(kpis.ticketMedioMRR)}
                    color="black"
                    icon={<CreditCard className="h-6 w-6" />}
                />
            </div>

            {/* Counters */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Assinantes Ativos', value: kpis.totalAtivos, icon: <Users className="h-4 w-4 text-green-500" />, color: 'text-green-600' },
                    { label: 'Pagamentos em Aberto', value: kpis.totalPendentes, icon: <Clock className="h-4 w-4 text-yellow-500" />, color: 'text-yellow-600' },
                    { label: 'Cancelados', value: kpis.totalCancelados, icon: <XCircle className="h-4 w-4 text-slate-400" />, color: 'text-slate-600' },
                ].map(c => (
                    <div key={c.label} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">{c.icon}</div>
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{c.label}</p>
                            <p className={`text-2xl font-black ${c.color}`}>{c.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Evolução Receita */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6">
                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-4">Evolução de Receita (6 meses)</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={evolucaoReceita} barSize={28}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v}`} />
                            <Tooltip formatter={(v: any) => formatCurrency(v)} />
                            <Bar dataKey="receita" name="Receita" fill="#FFBF00" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Receita por Método */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-4">Por Método de Pagamento</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                                dataKey="value" nameKey="name" paddingAngle={3}>
                                {pieData.map((_, i) => (
                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(v: any) => formatCurrency(v)} />
                            <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Por Plano */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-4">Receita por Plano</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="text-left py-2 px-3 text-[11px] font-black text-slate-400 uppercase tracking-wider">Plano</th>
                                <th className="text-right py-2 px-3 text-[11px] font-black text-slate-400 uppercase tracking-wider">Clientes</th>
                                <th className="text-right py-2 px-3 text-[11px] font-black text-slate-400 uppercase tracking-wider">MRR</th>
                                <th className="text-right py-2 px-3 text-[11px] font-black text-slate-400 uppercase tracking-wider">IET</th>
                                <th className="text-right py-2 px-3 text-[11px] font-black text-slate-400 uppercase tracking-wider">Total</th>
                                <th className="py-2 px-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {porPlano.sort((a, b) => (b.mrr + b.iet) - (a.mrr + a.iet)).map(p => {
                                const total = p.mrr + p.iet;
                                const maxTotal = Math.max(...porPlano.map(x => x.mrr + x.iet), 1);
                                const pct = Math.round((total / maxTotal) * 100);
                                return (
                                    <tr key={p.tier} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="py-3 px-3">
                                            <span className="inline-flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PLAN_COLORS[p.tier] || '#94A3B8' }} />
                                                <span className="font-bold text-slate-700">{p.name}</span>
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 text-right font-semibold text-slate-600">{p.clientes}</td>
                                        <td className="py-3 px-3 text-right font-semibold text-slate-700">{formatCurrency(p.mrr)}</td>
                                        <td className="py-3 px-3 text-right font-semibold text-bee-amber">{formatCurrency(p.iet)}</td>
                                        <td className="py-3 px-3 text-right font-black text-slate-900">{formatCurrency(total)}</td>
                                        <td className="py-3 px-3 w-32">
                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: PLAN_COLORS[p.tier] || '#94A3B8' }} />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Tabs: Ativos / Abertos / Cobranças */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                {/* Tab bar */}
                <div className="flex border-b border-slate-100">
                    {(['ativos', 'abertos', 'cobranças'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTabAtiva(t)}
                            className={`px-6 py-4 text-[12px] font-black uppercase tracking-wider transition-colors ${
                                tabAtiva === t
                                    ? 'text-bee-amber border-b-2 border-bee-amber -mb-px'
                                    : 'text-slate-400 hover:text-slate-700'
                            }`}
                        >
                            {t === 'ativos' && `Assinantes Ativos (${kpis.totalAtivos})`}
                            {t === 'abertos' && `Pagamentos em Aberto (${pagamentosAbertos.length})`}
                            {t === 'cobranças' && `Últimas Cobranças`}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {/* ATIVOS */}
                    {tabAtiva === 'ativos' && (
                        <div className="space-y-4">
                            <div className="relative max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Buscar por nome, email ou plano..."
                                    value={searchAtivos}
                                    onChange={e => setSearchAtivos(e.target.value)}
                                    className="pl-9 h-9 text-sm border-slate-100 bg-slate-50"
                                />
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="text-left py-2 px-3 text-[11px] font-black text-slate-400 uppercase tracking-wider">Cliente</th>
                                            <th className="text-left py-2 px-3 text-[11px] font-black text-slate-400 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('plano')}>
                                                <span className="flex items-center gap-1">Plano <SortIcon col="plano" /></span>
                                            </th>
                                            <th className="text-left py-2 px-3 text-[11px] font-black text-slate-400 uppercase tracking-wider">Método</th>
                                            <th className="text-right py-2 px-3 text-[11px] font-black text-slate-400 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('valor')}>
                                                <span className="flex items-center justify-end gap-1">Valor <SortIcon col="valor" /></span>
                                            </th>
                                            <th className="text-center py-2 px-3 text-[11px] font-black text-slate-400 uppercase tracking-wider">Tipo</th>
                                            <th className="text-right py-2 px-3 text-[11px] font-black text-slate-400 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('since')}>
                                                <span className="flex items-center justify-end gap-1">Desde <SortIcon col="since" /></span>
                                            </th>
                                            <th className="text-right py-2 px-3 text-[11px] font-black text-slate-400 uppercase tracking-wider">Próx. Venc.</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAtivos.map(a => (
                                            <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                <td className="py-3 px-3">
                                                    <p className="font-bold text-slate-700">{a.orgName}</p>
                                                    <p className="text-[11px] text-slate-400">{a.orgEmail}</p>
                                                </td>
                                                <td className="py-3 px-3">
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PLAN_COLORS[a.tier] || '#94A3B8' }} />
                                                        <span className="font-semibold text-slate-600">{a.plano}</span>
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-slate-500 text-[12px]">{METODO_LABELS[a.metodo] || a.metodo}</td>
                                                <td className="py-3 px-3 text-right">
                                                    <span className="font-black text-slate-900">{formatCurrency(a.valor)}</span>
                                                    {a.temDesconto && (
                                                        <p className="text-[10px] text-slate-400 line-through">{formatCurrency(a.precoBase)}</p>
                                                    )}
                                                </td>
                                                <td className="py-3 px-3 text-center">
                                                    {a.isIET
                                                        ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-600 border border-amber-100">IET</span>
                                                        : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-green-50 text-green-600 border border-green-100">MRR</span>
                                                    }
                                                </td>
                                                <td className="py-3 px-3 text-right text-[12px] text-slate-500">{formatDate(a.since)}</td>
                                                <td className="py-3 px-3 text-right text-[12px] text-slate-500">{formatDate(a.proximoVencimento)}</td>
                                            </tr>
                                        ))}
                                        {filteredAtivos.length === 0 && (
                                            <tr><td colSpan={7} className="py-8 text-center text-slate-400 text-sm">Nenhum resultado encontrado.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ABERTOS */}
                    {tabAtiva === 'abertos' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-left py-2 px-3 text-[11px] font-black text-slate-400 uppercase tracking-wider">Cliente</th>
                                        <th className="text-left py-2 px-3 text-[11px] font-black text-slate-400 uppercase tracking-wider">Plano</th>
                                        <th className="text-left py-2 px-3 text-[11px] font-black text-slate-400 uppercase tracking-wider">Método</th>
                                        <th className="text-right py-2 px-3 text-[11px] font-black text-slate-400 uppercase tracking-wider">Valor</th>
                                        <th className="text-center py-2 px-3 text-[11px] font-black text-slate-400 uppercase tracking-wider">Status</th>
                                        <th className="text-right py-2 px-3 text-[11px] font-black text-slate-400 uppercase tracking-wider">Dias em Atraso</th>
                                        <th className="text-right py-2 px-3 text-[11px] font-black text-slate-400 uppercase tracking-wider">Vencimento</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagamentosAbertos.map(p => (
                                        <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3 px-3">
                                                <p className="font-bold text-slate-700">{p.orgName}</p>
                                                <p className="text-[11px] text-slate-400">{p.orgEmail}</p>
                                            </td>
                                            <td className="py-3 px-3 font-semibold text-slate-600">{p.plano}</td>
                                            <td className="py-3 px-3 text-slate-500 text-[12px]">{METODO_LABELS[p.metodo] || p.metodo}</td>
                                            <td className="py-3 px-3 text-right font-black text-slate-900">{formatCurrency(p.valor)}</td>
                                            <td className="py-3 px-3 text-center"><StatusBadge status={p.status} /></td>
                                            <td className="py-3 px-3 text-right">
                                                {p.diasAtraso != null && p.diasAtraso > 0
                                                    ? <span className="font-black text-red-600">{p.diasAtraso}d</span>
                                                    : <span className="text-slate-400">—</span>
                                                }
                                            </td>
                                            <td className="py-3 px-3 text-right text-[12px] text-slate-500">{formatDate(p.proximoVencimento)}</td>
                                        </tr>
                                    ))}
                                    {pagamentosAbertos.length === 0 && (
                                        <tr><td colSpan={7} className="py-8 text-center text-slate-400 text-sm">Nenhum pagamento em aberto.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* COBRANÇAS */}
                    {tabAtiva === 'cobranças' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-left py-2 px-3 text-[11px] font-black text-slate-400 uppercase tracking-wider">Cliente</th>
                                        <th className="text-right py-2 px-3 text-[11px] font-black text-slate-400 uppercase tracking-wider">Valor</th>
                                        <th className="text-center py-2 px-3 text-[11px] font-black text-slate-400 uppercase tracking-wider">Status</th>
                                        <th className="text-left py-2 px-3 text-[11px] font-black text-slate-400 uppercase tracking-wider">Método</th>
                                        <th className="text-right py-2 px-3 text-[11px] font-black text-slate-400 uppercase tracking-wider">Pago em</th>
                                        <th className="text-right py-2 px-3 text-[11px] font-black text-slate-400 uppercase tracking-wider">Criado em</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ultimasCobranças.map(c => (
                                        <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3 px-3 font-bold text-slate-700">{c.orgName}</td>
                                            <td className="py-3 px-3 text-right font-black text-slate-900">{formatCurrency(c.amount)}</td>
                                            <td className="py-3 px-3 text-center"><StatusBadge status={c.status} /></td>
                                            <td className="py-3 px-3 text-slate-500 text-[12px]">{METODO_LABELS[c.paymentMethod || ''] || c.paymentMethod || '—'}</td>
                                            <td className="py-3 px-3 text-right text-[12px] text-slate-500">{formatDate(c.paidAt)}</td>
                                            <td className="py-3 px-3 text-right text-[12px] text-slate-500">{formatDate(c.createdAt)}</td>
                                        </tr>
                                    ))}
                                    {ultimasCobranças.length === 0 && (
                                        <tr><td colSpan={6} className="py-8 text-center text-slate-400 text-sm">Nenhuma cobrança nos últimos 6 meses.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
