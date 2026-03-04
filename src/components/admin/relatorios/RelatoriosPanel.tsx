'use client';

import { useState } from 'react';
import {
    FileBarChart,
    Download,
    FileSpreadsheet,
    FileText,
    Loader2,
    Search,
    Filter,
    TrendingUp,
    Users,
    PieChart,
    MapPin,
    AlertTriangle,
} from 'lucide-react';

type ReportType =
    | 'receita_por_plano'
    | 'contratantes_ativos'
    | 'assinaturas_por_status'
    | 'churn_mensal'
    | 'contratantes_por_cidade';

interface ReportConfig {
    key: ReportType;
    label: string;
    desc: string;
    icon: typeof FileBarChart;
    color: string;
    hasDateFilter: boolean;
    hasPlanFilter: boolean;
}

const REPORTS: ReportConfig[] = [
    {
        key: 'receita_por_plano',
        label: 'Receita por Plano',
        desc: 'Comparativo de receita e quantidade de assinantes por plano ativo.',
        icon: TrendingUp,
        color: 'from-emerald-500 to-teal-600',
        hasDateFilter: false,
        hasPlanFilter: false,
    },
    {
        key: 'contratantes_ativos',
        label: 'Contratantes Ativos',
        desc: 'Lista completa de todos os contratantes com assinatura ativa.',
        icon: Users,
        color: 'from-blue-500 to-indigo-600',
        hasDateFilter: true,
        hasPlanFilter: true,
    },
    {
        key: 'assinaturas_por_status',
        label: 'Assinaturas por Status',
        desc: 'Visão geral de todas as assinaturas, agrupadas pelo status atual.',
        icon: PieChart,
        color: 'from-amber-500 to-orange-600',
        hasDateFilter: false,
        hasPlanFilter: false,
    },
    {
        key: 'churn_mensal',
        label: 'Churn / Cancelamentos',
        desc: 'Relatório de assinaturas canceladas e suspensas com perda financeira.',
        icon: AlertTriangle,
        color: 'from-red-500 to-rose-600',
        hasDateFilter: false,
        hasPlanFilter: false,
    },
    {
        key: 'contratantes_por_cidade',
        label: 'Contratantes por Cidade',
        desc: 'Distribuição geográfica dos contratantes ativos por cidade/estado.',
        icon: MapPin,
        color: 'from-violet-500 to-purple-600',
        hasDateFilter: false,
        hasPlanFilter: false,
    },
];

interface ReportData {
    titulo: string;
    colunas: string[];
    linhas: (string | number)[][];
}

export function RelatoriosPanel() {
    const [selected, setSelected] = useState<ReportConfig | null>(null);
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<ReportData | null>(null);

    // Filters
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [planoFilter, setPlanoFilter] = useState('TODOS');

    const handleGenerate = async () => {
        if (!selected) return;
        setLoading(true);
        setReportData(null);

        try {
            const params = new URLSearchParams({ tipo: selected.key });
            if (dateFrom) params.set('de', dateFrom);
            if (dateTo) params.set('ate', dateTo);
            if (planoFilter !== 'TODOS') params.set('plano', planoFilter);

            const res = await fetch(`/api/admin/relatorios?${params.toString()}`);
            if (!res.ok) throw new Error('Erro ao gerar relatório');
            const data = await res.json();
            setReportData(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = async () => {
        if (!reportData) return;
        const XLSX = await import('xlsx');
        const ws = XLSX.utils.aoa_to_sheet([reportData.colunas, ...reportData.linhas]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
        XLSX.writeFile(wb, `${reportData.titulo.replace(/\s/g, '_')}.xlsx`);
    };

    const handleExportPDF = async () => {
        if (!reportData) return;
        const jsPDF = (await import('jspdf')).default;
        const autoTable = (await import('jspdf-autotable')).default;

        const doc = new jsPDF({ orientation: reportData.colunas.length > 5 ? 'landscape' : 'portrait' });

        doc.setFontSize(16);
        doc.setTextColor(0, 23, 63);
        doc.text(`BeeGym — ${reportData.titulo}`, 14, 20);

        doc.setFontSize(9);
        doc.setTextColor(120);
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28);

        autoTable(doc, {
            startY: 34,
            head: [reportData.colunas],
            body: reportData.linhas.map(row => row.map(c => String(c))),
            styles: { fontSize: 8, cellPadding: 3 },
            headStyles: { fillColor: [0, 23, 63], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 247, 250] },
        });

        doc.save(`${reportData.titulo.replace(/\s/g, '_')}.pdf`);
    };

    return (
        <div className="space-y-6">
            {/* Report Selection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {REPORTS.map((report) => {
                    const Icon = report.icon;
                    const isSelected = selected?.key === report.key;
                    return (
                        <button
                            key={report.key}
                            onClick={() => {
                                setSelected(report);
                                setReportData(null);
                            }}
                            className={`
                                relative overflow-hidden text-left p-4 rounded-xl border-2 transition-all duration-200
                                ${isSelected
                                    ? 'border-bee-orange bg-bee-orange/5 shadow-lg shadow-orange-500/10 ring-2 ring-bee-orange/30'
                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                                }
                            `}
                        >
                            <div className={`
                                w-9 h-9 rounded-lg bg-gradient-to-br ${report.color}
                                flex items-center justify-center mb-3
                            `}>
                                <Icon className="w-4.5 h-4.5 text-white" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800">{report.label}</h3>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{report.desc}</p>
                            {isSelected && (
                                <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-bee-orange animate-pulse" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Filters + Generate */}
            {selected && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <h3 className="text-sm font-bold text-slate-700">Filtros — {selected.label}</h3>
                    </div>

                    <div className="flex flex-wrap items-end gap-4">
                        {selected.hasDateFilter && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">De</label>
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={e => setDateFrom(e.target.value)}
                                        className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-slate-50 focus:ring-2 focus:ring-bee-orange/30 focus:border-bee-orange outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Até</label>
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={e => setDateTo(e.target.value)}
                                        className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-slate-50 focus:ring-2 focus:ring-bee-orange/30 focus:border-bee-orange outline-none"
                                    />
                                </div>
                            </>
                        )}

                        {selected.hasPlanFilter && (
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Plano</label>
                                <select
                                    value={planoFilter}
                                    onChange={e => setPlanoFilter(e.target.value)}
                                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-slate-50 focus:ring-2 focus:ring-bee-orange/30 focus:border-bee-orange outline-none"
                                >
                                    <option value="TODOS">Todos</option>
                                    <option value="STARTER">Starter</option>
                                    <option value="PLUS">Plus</option>
                                    <option value="STUDIO">Studio</option>
                                    <option value="PRO">Pro</option>
                                    <option value="ENTERPRISE">Enterprise</option>
                                </select>
                            </div>
                        )}

                        {!selected.hasDateFilter && !selected.hasPlanFilter && (
                            <p className="text-xs text-slate-400 italic">
                                Este relatório não possui filtros adicionais.
                            </p>
                        )}

                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="ml-auto inline-flex items-center gap-2 bg-[#00173F] text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg hover:bg-[#001a4d] disabled:opacity-50 transition-all shadow-md"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Search className="w-4 h-4" />
                            )}
                            Gerar Relatório
                        </button>
                    </div>
                </div>
            )}

            {/* Results Table */}
            {reportData && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Table Header */}
                    <div className="flex items-center justify-between p-5 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-bold text-slate-800">{reportData.titulo}</h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {reportData.linhas.length} registro{reportData.linhas.length !== 1 ? 's' : ''} encontrado{reportData.linhas.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleExportExcel}
                                className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-2 rounded-lg hover:bg-emerald-100 transition-all"
                            >
                                <FileSpreadsheet className="w-3.5 h-3.5" />
                                Excel
                            </button>
                            <button
                                onClick={handleExportPDF}
                                className="inline-flex items-center gap-1.5 text-xs font-bold bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-100 transition-all"
                            >
                                <FileText className="w-3.5 h-3.5" />
                                PDF
                            </button>
                        </div>
                    </div>

                    {/* Table Body */}
                    {reportData.linhas.length === 0 ? (
                        <div className="p-12 text-center">
                            <FileBarChart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-sm text-slate-400">Nenhum dado encontrado para os filtros selecionados.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50/80">
                                        {reportData.colunas.map((col, i) => (
                                            <th
                                                key={i}
                                                className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100"
                                            >
                                                {col}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {reportData.linhas.map((row, ri) => (
                                        <tr key={ri} className="hover:bg-slate-50/50 transition-colors">
                                            {row.map((cell, ci) => (
                                                <td key={ci} className="px-5 py-3 text-sm text-slate-600 whitespace-nowrap">
                                                    {cell}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Table Footer */}
                    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
                        <p className="text-[11px] text-slate-400">
                            Relatório gerado em {new Date().toLocaleString('pt-BR')}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <Download className="w-3 h-3 text-slate-400" />
                            <span className="text-[11px] text-slate-400">Exporte em Excel ou PDF</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
