'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
    FileText,
    FileSpreadsheet,
    Loader2,
    Users,
    DollarSign,
    CalendarDays,
    Dumbbell,
    Table as TableIcon,
    Download,
    ChevronDown,
    BarChart3,
    TrendingUp,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
} from 'lucide-react';

import { SectionHeader } from '@/components/ui/section-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import { useUnit } from '@/context/UnitContext';
import { useSubscription } from '@/hooks/useSubscription';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const REPORT_TYPES = [
    {
        id: 'finance',
        name: 'Financeiro',
        description: 'Faturas, pagamentos e vencimentos',
        icon: DollarSign,
        statuses: ['TODOS', 'PAGO', 'PENDENTE', 'CANCELADO'],
        accentClass: 'text-emerald-600',
        bgClass: 'bg-emerald-50',
        borderClass: 'border-emerald-200',
        activeBg: 'bg-emerald-600',
    },
    {
        id: 'students',
        name: 'Alunos',
        description: 'Cadastros, planos e status',
        icon: Users,
        statuses: ['TODOS', 'ATIVO', 'INATIVO', 'PAGAMENTO PENDENTE'],
        accentClass: 'text-orange-600',
        bgClass: 'bg-orange-50',
        borderClass: 'border-orange-200',
        activeBg: 'bg-orange-600',
    },
    {
        id: 'attendance',
        name: 'Frequência',
        description: 'Presença e faltas em aulas',
        icon: CalendarDays,
        statuses: ['TODOS', 'CONFIRMADO', 'FALTOU'],
        accentClass: 'text-blue-600',
        bgClass: 'bg-blue-50',
        borderClass: 'border-blue-200',
        activeBg: 'bg-blue-600',
    },
    {
        id: 'workouts',
        name: 'Treinos',
        description: 'Execução e agendamento',
        icon: Dumbbell,
        statuses: ['TODOS', 'CONCLUÍDO', 'AGENDADO', 'CANCELADO'],
        accentClass: 'text-violet-600',
        bgClass: 'bg-violet-50',
        borderClass: 'border-violet-200',
        activeBg: 'bg-violet-600',
    },
];

const STATUS_MAP: Record<string, string> = {
    'ACTIVE': 'ATIVO', 'INACTIVE': 'INATIVO', 'OVERDUE': 'PAGAMENTO PENDENTE',
    'COMPLETED': 'CONCLUÍDO', 'Concluido': 'CONCLUÍDO',
    'SCHEDULED': 'AGENDADO', 'Agendado': 'AGENDADO',
    'CANCELLED': 'CANCELADO', 'CANCELADO': 'CANCELADO', 'Cancelado': 'CANCELADO',
    'PAID': 'PAGO', 'PAGO': 'PAGO', 'PENDENTE': 'PENDENTE',
    'Confirmado': 'CONFIRMADO', 'Faltou': 'FALTOU',
};

const DB_STATUS_MAP: Record<string, string> = {
    'ATIVO': 'ACTIVE', 'INATIVO': 'INACTIVE', 'PAGAMENTO PENDENTE': 'OVERDUE',
    'CONCLUÍDO': 'Concluido', 'AGENDADO': 'Agendado',
    'CANCELADO': 'Cancelado', 'CONFIRMADO': 'Confirmado', 'FALTOU': 'Faltou',
    'PAGO': 'PAGO', 'PENDENTE': 'PENDENTE',
};

const STATUS_BADGE: Record<string, string> = {
    'PAGO': 'bg-emerald-100 text-emerald-700',
    'ATIVO': 'bg-emerald-100 text-emerald-700',
    'CONCLUÍDO': 'bg-emerald-100 text-emerald-700',
    'CONFIRMADO': 'bg-emerald-100 text-emerald-700',
    'PENDENTE': 'bg-orange-100 text-orange-700',
    'AGENDADO': 'bg-blue-100 text-blue-700',
    'PAGAMENTO PENDENTE': 'bg-orange-100 text-orange-700',
    'CANCELADO': 'bg-slate-100 text-slate-600',
    'FALTOU': 'bg-red-100 text-red-700',
    'INATIVO': 'bg-slate-100 text-slate-600',
};

function computeKpis(tab: string, rows: any[]) {
    if (rows.length === 0) return [];

    if (tab === 'finance') {
        const pago = rows.filter(r => r['Status'] === 'PAGO');
        const pendente = rows.filter(r => r['Status'] === 'PENDENTE');
        const atrasado = rows.filter(r => r['Status'] === 'PAGAMENTO PENDENTE');
        const totalPago = pago.reduce((acc, r) => acc + parseFloat(r['Valor (R$)'] || '0'), 0);
        return [
            { title: 'Total de registros', value: String(rows.length), icon: <BarChart3 className="w-5 h-5" /> },
            { title: 'Recebido', value: `R$ ${totalPago.toFixed(2).replace('.', ',')}`, icon: <CheckCircle2 className="w-5 h-5" /> },
            { title: 'Pendente', value: String(pendente.length), icon: <Clock className="w-5 h-5" /> },
            { title: 'Atrasado', value: String(atrasado.length), icon: <AlertCircle className="w-5 h-5" /> },
        ];
    }
    if (tab === 'students') {
        const ativos = rows.filter(r => r['Status'] === 'ATIVO').length;
        const inativos = rows.filter(r => r['Status'] === 'INATIVO').length;
        const atrasados = rows.filter(r => r['Status'] === 'PAGAMENTO PENDENTE').length;
        return [
            { title: 'Total de alunos', value: String(rows.length), icon: <Users className="w-5 h-5" /> },
            { title: 'Ativos', value: String(ativos), icon: <CheckCircle2 className="w-5 h-5" /> },
            { title: 'Inativos', value: String(inativos), icon: <XCircle className="w-5 h-5" /> },
            { title: 'Inadimplentes', value: String(atrasados), icon: <AlertCircle className="w-5 h-5" /> },
        ];
    }
    if (tab === 'attendance') {
        const confirmados = rows.filter(r => r['Status'] === 'CONFIRMADO').length;
        const faltou = rows.filter(r => r['Status'] === 'FALTOU').length;
        const taxa = rows.length > 0 ? Math.round((confirmados / rows.length) * 100) : 0;
        return [
            { title: 'Total de registros', value: String(rows.length), icon: <CalendarDays className="w-5 h-5" /> },
            { title: 'Confirmados', value: String(confirmados), icon: <CheckCircle2 className="w-5 h-5" /> },
            { title: 'Faltas', value: String(faltou), icon: <XCircle className="w-5 h-5" /> },
            { title: 'Taxa de presença', value: `${taxa}%`, icon: <TrendingUp className="w-5 h-5" /> },
        ];
    }
    if (tab === 'workouts') {
        const concluidos = rows.filter(r => r['Status'] === 'CONCLUÍDO').length;
        const agendados = rows.filter(r => r['Status'] === 'AGENDADO').length;
        const cancelados = rows.filter(r => r['Status'] === 'CANCELADO').length;
        return [
            { title: 'Total de treinos', value: String(rows.length), icon: <Dumbbell className="w-5 h-5" /> },
            { title: 'Concluídos', value: String(concluidos), icon: <CheckCircle2 className="w-5 h-5" /> },
            { title: 'Agendados', value: String(agendados), icon: <Clock className="w-5 h-5" /> },
            { title: 'Cancelados', value: String(cancelados), icon: <XCircle className="w-5 h-5" /> },
        ];
    }
    return [];
}

export default function RelatoriosPage() {
    const supabase = createClient();
    const { toast } = useToast();
    const { currentUnitId } = useUnit();
    const { organizationId } = useSubscription();

    const [activeTab, setActiveTab] = useState(REPORT_TYPES[0].id);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);

    const [startDate, setStartDate] = useState(format(new Date(new Date().setDate(1)), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [status, setStatus] = useState('TODOS');

    const activeReport = REPORT_TYPES.find(r => r.id === activeTab) || REPORT_TYPES[0];

    const handleTabChange = (id: string) => {
        setActiveTab(id);
        setStatus('TODOS');
        setHasGenerated(false);
        setData([]);
    };

    const fetchReportData = async () => {
        if (!organizationId) {
            toast({ title: 'Aguarde', description: 'Organização ainda carregando.', variant: 'destructive' });
            return;
        }
        setLoading(true);
        setHasGenerated(true);
        try {
            const orgId = organizationId;

            let resultData: any[] = [];
            let dbStatus = status;

            if (status !== 'TODOS') {
                if (activeTab === 'students' || activeTab === 'finance') {
                    if (status === 'ATIVO') dbStatus = 'ACTIVE';
                    else if (status === 'INATIVO') dbStatus = 'INACTIVE';
                    else if (status === 'ATRASADO' || status === 'PAGAMENTO PENDENTE') dbStatus = 'OVERDUE';
                    else dbStatus = status;
                } else {
                    dbStatus = DB_STATUS_MAP[status] || status;
                }
            }

            switch (activeTab) {
                case 'finance': {
                    let query = supabase.from('vw_payments').select('id, amount, due_date, dynamic_status, payment_date, student_name, student_id').eq('organization_id', orgId).gte('due_date', startDate).lte('due_date', endDate);
                    if (dbStatus !== 'TODOS') query = query.eq('dynamic_status', dbStatus);
                    const { data: raw, error } = await query.order('due_date', { ascending: false });
                    if (error) throw error;

                    let finalData = raw || [];
                    if (currentUnitId && currentUnitId !== orgId && finalData.length > 0) {
                        const ids = finalData.map((i: any) => i.student_id).filter(Boolean);
                        if (ids.length > 0) {
                            const { data: valid } = await supabase.from('students').select('id').in('id', ids).eq('unit_id', currentUnitId);
                            const validSet = new Set(valid?.map((s: any) => s.id) || []);
                            finalData = finalData.filter((i: any) => validSet.has(i.student_id));
                        }
                    }
                    resultData = finalData.map((i: any) => ({
                        'Aluno': i.student_name || 'N/A',
                        'Vencimento': format(new Date(i.due_date), 'dd/MM/yyyy'),
                        'Valor (R$)': Number(i.amount).toFixed(2),
                        'Status': STATUS_MAP[i.dynamic_status] || i.dynamic_status,
                        'Pagamento': i.payment_date ? format(new Date(i.payment_date), 'dd/MM/yyyy') : '-',
                    }));
                    break;
                }
                case 'students': {
                    let query = supabase.from('students').select('full_name, status, created_at, membership_plans(name)').eq('organization_id', orgId).gte('created_at', `${startDate}T00:00:00Z`).lte('created_at', `${endDate}T23:59:59Z`);
                    if (dbStatus !== 'TODOS') query = query.ilike('status', dbStatus);
                    if (currentUnitId && currentUnitId !== orgId) query = query.eq('unit_id', currentUnitId);
                    const { data: raw, error } = await query.order('created_at', { ascending: false });
                    if (error) throw error;
                    resultData = raw?.map((i: any) => ({
                        'Nome': i.full_name,
                        'Plano': i.membership_plans?.name || 'Sem plano',
                        'Status': STATUS_MAP[i.status] || i.status,
                        'Cadastrado em': format(new Date(i.created_at), 'dd/MM/yyyy'),
                    })) || [];
                    break;
                }
                case 'attendance': {
                    let query = supabase.from('event_enrollments').select('status, created_at, student_id, students(full_name), calendar_events(title, start_datetime)').eq('organization_id', orgId).gte('created_at', `${startDate}T00:00:00Z`).lte('created_at', `${endDate}T23:59:59Z`);
                    if (dbStatus !== 'TODOS') query = query.eq('status', dbStatus);
                    const { data: raw, error } = await (query as any).order('created_at', { ascending: false });
                    if (error) throw error;
                    let finalData = raw || [];
                    if (currentUnitId && currentUnitId !== orgId && finalData.length > 0) {
                        const ids = finalData.map((i: any) => i.student_id).filter(Boolean);
                        if (ids.length > 0) {
                            const { data: valid } = await supabase.from('students').select('id').in('id', ids).eq('unit_id', currentUnitId);
                            const validSet = new Set(valid?.map((s: any) => s.id) || []);
                            finalData = finalData.filter((i: any) => validSet.has(i.student_id));
                        }
                    }
                    resultData = finalData.map((i: any) => ({
                        'Aluno': i.students?.full_name || 'N/A',
                        'Aula': i.calendar_events?.title || 'Aula / Evento',
                        'Data da Aula': i.calendar_events?.start_datetime ? format(new Date(i.calendar_events.start_datetime), 'dd/MM/yyyy HH:mm') : '-',
                        'Status': STATUS_MAP[i.status] || i.status,
                    }));
                    break;
                }
                case 'workouts': {
                    let query = supabase.from('workouts').select('title, status, scheduled_at, student_id, students(full_name)').eq('organization_id', orgId).gte('scheduled_at', `${startDate}T00:00:00Z`).lte('scheduled_at', `${endDate}T23:59:59Z`);
                    if (dbStatus !== 'TODOS') query = query.eq('status', dbStatus);
                    const { data: raw, error } = await (query as any).order('scheduled_at', { ascending: false });
                    if (error) throw error;
                    let finalData = raw || [];
                    if (currentUnitId && currentUnitId !== orgId && finalData.length > 0) {
                        const ids = finalData.map((i: any) => i.student_id).filter(Boolean);
                        if (ids.length > 0) {
                            const { data: valid } = await supabase.from('students').select('id').in('id', ids).eq('unit_id', currentUnitId);
                            const validSet = new Set(valid?.map((s: any) => s.id) || []);
                            finalData = finalData.filter((i: any) => validSet.has(i.student_id));
                        }
                    }
                    resultData = finalData.map((i: any) => ({
                        'Treino': i.title || 'Treino Individual',
                        'Aluno': i.students?.full_name || 'N/A',
                        'Data Agendada': i.scheduled_at ? format(new Date(i.scheduled_at), 'dd/MM/yyyy HH:mm') : '-',
                        'Status': STATUS_MAP[i.status] || i.status,
                    }));
                    break;
                }
            }

            setData(resultData);
        } catch (error: any) {
            console.error('Relatorios Error:', error);
            toast({ title: 'Erro ao gerar relatório', description: error.message || 'Erro desconhecido', variant: 'destructive' });
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = () => {
        if (data.length === 0) return toast({ title: 'Aviso', description: 'Não há dados para exportar.' });
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
        XLSX.writeFile(wb, `Relatorio_${activeReport.name}_${format(new Date(), 'ddMMyyyy')}.xlsx`);
        toast({ title: 'Excel exportado com sucesso!' });
    };

    const exportToPDF = () => {
        if (data.length === 0) return toast({ title: 'Aviso', description: 'Não há dados para exportar.' });
        const doc = new jsPDF('landscape', 'pt', 'a4');
        const headers = Object.keys(data[0]);
        const body = data.map(obj => Object.values(obj));
        doc.setFontSize(18);
        doc.text(`BeeGym — ${activeReport.name}`, 40, 40);
        doc.setFontSize(10);
        doc.text(`Período: ${format(new Date(startDate), 'dd/MM/yyyy')} até ${format(new Date(endDate), 'dd/MM/yyyy')} | Status: ${status}`, 40, 60);
        autoTable(doc, {
            head: [headers], body: body as string[][], startY: 80,
            styles: { fontSize: 8, cellPadding: 4 },
            headStyles: { fillColor: [249, 115, 22] },
            alternateRowStyles: { fillColor: [248, 250, 252] },
        });
        doc.save(`Relatorio_${activeReport.name}_${format(new Date(), 'ddMMyyyy')}.pdf`);
        toast({ title: 'PDF exportado com sucesso!' });
    };

    const kpis = computeKpis(activeTab, data);
    const columns = data.length > 0 ? Object.keys(data[0]) : [];

    return (
        <div className="space-y-6 pb-12">
            <SectionHeader
                title="Relatórios"
                subtitle="Selecione o tipo, ajuste os filtros e gere seu relatório."
            />

            {/* Report type selector */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {REPORT_TYPES.map((report) => {
                    const isActive = activeTab === report.id;
                    return (
                        <button
                            key={report.id}
                            onClick={() => handleTabChange(report.id)}
                            className={cn(
                                'flex flex-col items-start gap-3 p-4 rounded-2xl border text-left transition-all duration-150 hover:shadow-md',
                                isActive
                                    ? `${report.bgClass} ${report.borderClass} shadow-sm`
                                    : 'bg-white border-slate-100 hover:border-slate-200'
                            )}
                        >
                            <div className={cn(
                                'h-10 w-10 rounded-xl flex items-center justify-center',
                                isActive ? `${report.activeBg} text-white` : `${report.bgClass} ${report.accentClass}`
                            )}>
                                <report.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className={cn('font-bold text-sm', isActive ? report.accentClass : 'text-slate-700')}>
                                    {report.name}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{report.description}</p>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Filters */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-end gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                        <div className="space-y-1.5">
                            <label className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Data Inicial</label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="h-10 border-slate-200 rounded-xl bg-slate-50 text-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Data Final</label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="h-10 border-slate-200 rounded-xl bg-slate-50 text-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Status</label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="h-10 border-slate-200 rounded-xl bg-slate-50 text-sm">
                                    <SelectValue placeholder="Selecione o status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {activeReport.statuses.map(s => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <Button
                        onClick={fetchReportData}
                        disabled={loading}
                        className="h-10 bg-bee-amber hover:bg-bee-amber/90 text-bee-midnight font-bold gap-2 px-8 shrink-0 rounded-full shadow-sm transition-all hover:-translate-y-0.5 active:scale-95 uppercase tracking-wider text-xs"
                    >
                        {loading
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <activeReport.icon className="w-4 h-4" />
                        }
                        Gerar Relatório
                    </Button>
                </div>
            </div>

            {/* Empty prompt — before first generation */}
            {!hasGenerated && (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                    <div className={cn('h-16 w-16 rounded-2xl flex items-center justify-center', activeReport.bgClass)}>
                        <activeReport.icon className={cn('w-7 h-7', activeReport.accentClass)} />
                    </div>
                    <div>
                        <p className="font-bold text-slate-700 text-base">Pronto para gerar o relatório</p>
                        <p className="text-sm text-slate-400 mt-1">
                            Ajuste os filtros acima e clique em <span className="font-semibold text-slate-500">Gerar Relatório</span>.
                        </p>
                    </div>
                </div>
            )}

            {/* KPIs + Table — after generation */}
            {hasGenerated && (
                <div className="space-y-5">
                    {/* KPI Summary */}
                    {!loading && kpis.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {kpis.map((kpi, i) => (
                                <KpiCard key={i} title={kpi.title} value={kpi.value} icon={kpi.icon} />
                            ))}
                        </div>
                    )}

                    {/* Table card */}
                    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                        {/* Card header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50 bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center', activeReport.bgClass)}>
                                    <activeReport.icon className={cn('w-4 h-4', activeReport.accentClass)} />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-slate-800">Relatório: {activeReport.name}</p>
                                    <p className="text-[11px] text-slate-400">
                                        {format(new Date(startDate), 'dd/MM/yyyy')} → {format(new Date(endDate), 'dd/MM/yyyy')}
                                    </p>
                                </div>
                                {!loading && (
                                    <Badge className="bg-slate-100 text-slate-600 border-none shadow-none font-bold text-[10px] uppercase px-2.5 py-0.5 rounded-full">
                                        {data.length} registros
                                    </Badge>
                                )}
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        disabled={loading || data.length === 0}
                                        className="h-9 gap-2 border-slate-200 font-bold text-slate-600 text-[11px] uppercase tracking-wider px-4 rounded-full shadow-sm"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        Exportar
                                        <ChevronDown className="w-3 h-3 text-slate-400" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-2xl border-slate-100 shadow-xl p-1.5 bg-white min-w-[200px]">
                                    <DropdownMenuItem onClick={exportToExcel} className="flex items-center gap-2 rounded-xl p-2.5 px-4 text-sm font-medium text-emerald-700 focus:bg-emerald-50 cursor-pointer">
                                        <FileSpreadsheet className="w-4 h-4" />
                                        Exportar para Excel
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={exportToPDF} className="flex items-center gap-2 rounded-xl p-2.5 px-4 text-sm font-medium text-red-700 focus:bg-red-50 cursor-pointer">
                                        <FileText className="w-4 h-4" />
                                        Exportar para PDF
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Body */}
                        <div className="overflow-x-auto min-h-[240px]">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-[240px] gap-3 text-slate-400">
                                    <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
                                    <p className="text-sm font-medium animate-pulse">Buscando dados...</p>
                                </div>
                            ) : data.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[240px] gap-4 text-slate-400">
                                    <div className="p-4 rounded-2xl bg-slate-50">
                                        <TableIcon className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-slate-500 text-sm">Nenhum registro encontrado</p>
                                        <p className="text-xs mt-1 text-slate-400">Tente ajustar o período ou o filtro de status.</p>
                                    </div>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/40 hover:bg-slate-50/40">
                                            {columns.map(col => (
                                                <TableHead key={col} className="h-11 font-bold text-[11px] uppercase tracking-wider text-slate-400">
                                                    {col}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.map((row, idx) => (
                                            <TableRow key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                {columns.map((col, colIdx) => (
                                                    <TableCell key={colIdx} className="py-3 text-sm text-slate-600">
                                                        {col.toLowerCase() === 'status' ? (
                                                            <Badge className={cn(
                                                                'border-none shadow-none font-bold uppercase text-[10px] px-2.5 py-0.5 rounded-full',
                                                                STATUS_BADGE[row[col]] || 'bg-slate-100 text-slate-600'
                                                            )}>
                                                                {row[col]}
                                                            </Badge>
                                                        ) : (
                                                            <span className={colIdx === 0 ? 'font-medium text-slate-800' : ''}>
                                                                {row[col]}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
