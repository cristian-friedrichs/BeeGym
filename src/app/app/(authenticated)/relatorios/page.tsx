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
    Play,
    Download,
    ChevronDown
} from 'lucide-react';

// UI Components
import { SectionHeader } from '@/components/ui/section-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Config and Context
import { useUnit } from '@/context/UnitContext';

// Export Libraries
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
        color: 'emerald'
    },
    {
        id: 'students',
        name: 'Alunos',
        description: 'Cadastros, planos e status de alunos',
        icon: Users,
        statuses: ['TODOS', 'ATIVO', 'INATIVO', 'ATRASADO'],
        color: 'orange'
    },
    {
        id: 'attendance',
        name: 'Frequência',
        description: 'Presença e faltas em aulas coletivas',
        icon: CalendarDays,
        statuses: ['TODOS', 'CONFIRMADO', 'FALTOU'],
        color: 'blue'
    },
    {
        id: 'workouts',
        name: 'Treinos',
        description: 'Execução e agendamento de treinos',
        icon: Dumbbell,
        statuses: ['TODOS', 'CONCLUÍDO', 'AGENDADO', 'CANCELADO'],
        color: 'pink'
    }
];

const STATUS_MAP: Record<string, string> = {
    'ACTIVE': 'ATIVO',
    'INACTIVE': 'INATIVO',
    'OVERDUE': 'ATRASADO',
    'COMPLETED': 'CONCLUÍDO',
    'Concluido': 'CONCLUÍDO',
    'SCHEDULED': 'AGENDADO',
    'Agendado': 'AGENDADO',
    'CANCELLED': 'CANCELADO',
    'CANCELADO': 'CANCELADO',
    'Cancelado': 'CANCELADO',
    'PAID': 'PAGO',
    'PAGO': 'PAGO',
    'PENDENTE': 'PENDENTE',
    'Confirmado': 'CONFIRMADO',
    'Faltou': 'FALTOU',
};

const DB_STATUS_MAP: Record<string, string> = {
    'ATIVO': 'ACTIVE',
    'INATIVO': 'INACTIVE',
    'ATRASADO': 'OVERDUE',
    'CONCLUÍDO': 'Concluido',
    'AGENDADO': 'Agendado',
    'CANCELADO': 'Cancelado',
    'CONFIRMADO': 'Confirmado',
    'FALTOU': 'Faltou',
    'PAGO': 'PAGO',
    'PENDENTE': 'PENDENTE'
};

export default function RelatoriosPage() {
    const supabase = createClient();
    const { toast } = useToast();
    const { currentUnitId } = useUnit();

    const [activeTab, setActiveTab] = useState(REPORT_TYPES[0].id);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);

    // Filters
    const [startDate, setStartDate] = useState(format(new Date(new Date().setDate(1)), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [status, setStatus] = useState('TODOS');

    const activeReport = REPORT_TYPES.find(r => r.id === activeTab) || REPORT_TYPES[0];

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        setStatus('TODOS');
        setHasGenerated(false);
        setData([]);
    };

    const fetchReportData = async () => {
        setLoading(true);
        setHasGenerated(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado.");

            const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
            const orgId = (profile as any)?.organization_id;

            if (!orgId) throw new Error("Organização não encontrada.");

            let resultData: any[] = [];
            let dbStatus = status;

            // Tratamento especial para os tipos (alguns usam inglês no banco legadamente)
            if (status !== 'TODOS') {
                if (activeTab === 'students' || activeTab === 'finance') {
                    // Mapeamento extra para tabelas que ainda usam EN por baixo dos panos nestas telas, se houver necessidade
                    if (status === 'ATIVO') dbStatus = 'ACTIVE';
                    if (status === 'INATIVO') dbStatus = 'INACTIVE';
                    if (status === 'ATRASADO') dbStatus = 'OVERDUE';
                    if (status === 'PAGO') dbStatus = 'PAGO'; // Invoices aparentemente usa PAID ou PAGO
                    if (status === 'PENDENTE') dbStatus = 'PENDENTE';
                    if (status === 'CANCELADO') dbStatus = 'CANCELADO';
                } else {
                    dbStatus = DB_STATUS_MAP[status] || status;
                }
            } else {
                dbStatus = 'TODOS';
            }

            switch (activeTab) {
                case 'finance': {
                    let query = supabase.from('vw_payments').select('id, amount, due_date, dynamic_status, payment_date, student_name, student_id').eq('organization_id', orgId).gte('due_date', startDate).lte('due_date', endDate);
                    if (dbStatus !== 'TODOS') query = query.eq('dynamic_status', dbStatus);
                    const { data: financeData, error } = await query.order('due_date', { ascending: false });
                    if (error) throw error;

                    let finalData = financeData || [];
                    if (currentUnitId && currentUnitId !== orgId && finalData.length > 0) {
                        const studentIds = finalData.map((item: any) => item.student_id).filter(Boolean);
                        if (studentIds.length > 0) {
                            const { data: validStudents } = await supabase.from('students').select('id').in('id', studentIds).eq('unit_id', currentUnitId);
                            const validSet = new Set(validStudents?.map((s: any) => s.id) || []);
                            finalData = finalData.filter((item: any) => validSet.has(item.student_id));
                        }
                    }

                    resultData = finalData.map((item: any) => ({
                        'Aluno': item.student_name || 'N/A',
                        'Vencimento': format(new Date(item.due_date), 'dd/MM/yyyy'),
                        'Valor (R$)': Number(item.amount).toFixed(2),
                        'Status': STATUS_MAP[item.dynamic_status] || item.dynamic_status,
                        'Pagamento': item.payment_date ? format(new Date(item.payment_date), 'dd/MM/yyyy') : '-'
                    }));
                    break;
                }
                case 'students': {
                    let query = supabase.from('students').select('full_name, status, created_at, membership_plans(name)').eq('organization_id', orgId).gte('created_at', `${startDate}T00:00:00Z`).lte('created_at', `${endDate}T23:59:59Z`);
                    if (dbStatus !== 'TODOS') query = query.ilike('status', dbStatus);
                    if (currentUnitId && currentUnitId !== orgId) query = query.eq('unit_id', currentUnitId);
                    
                    const { data: studentData, error } = await query.order('created_at', { ascending: false });
                    if (error) throw error;

                    resultData = studentData?.map((item: any) => ({
                        'Nome': item.full_name,
                        'Plano': item.membership_plans?.name || 'Sem plano',
                        'Status': STATUS_MAP[item.status] || item.status,
                        'Cadastrado em': format(new Date(item.created_at), 'dd/MM/yyyy')
                    })) || [];
                    break;
                }
                case 'attendance': {
                    let query = supabase.from('event_enrollments').select('status, created_at, student_id, students(full_name), calendar_events(title, start_datetime)').eq('organization_id', orgId).gte('created_at', `${startDate}T00:00:00Z`).lte('created_at', `${endDate}T23:59:59Z`);
                    if (dbStatus !== 'TODOS') query = query.eq('status', dbStatus);
                    
                    const { data: attendanceData, error } = await (query as any).order('created_at', { ascending: false });
                    if (error) throw error;

                    let finalData = attendanceData || [];
                    if (currentUnitId && currentUnitId !== orgId && finalData.length > 0) {
                        const studentIds = finalData.map((item: any) => item.student_id).filter(Boolean);
                        if (studentIds.length > 0) {
                            const { data: validStudents } = await supabase.from('students').select('id').in('id', studentIds).eq('unit_id', currentUnitId);
                            const validSet = new Set(validStudents?.map((s: any) => s.id) || []);
                            finalData = finalData.filter((item: any) => validSet.has(item.student_id));
                        }
                    }

                    resultData = finalData.map((item: any) => ({
                        'Aluno': item.students?.full_name || 'N/A',
                        'Aula': item.calendar_events?.title || 'Aula / Evento',
                        'Data da Aula': item.calendar_events?.start_datetime ? format(new Date(item.calendar_events.start_datetime), 'dd/MM/yyyy HH:mm') : '-',
                        'Status': STATUS_MAP[item.status] || item.status
                    }));
                    break;
                }
                case 'workouts': {
                    let query = supabase.from('workouts').select('title, status, scheduled_at, student_id, students(full_name)').eq('organization_id', orgId).gte('scheduled_at', `${startDate}T00:00:00Z`).lte('scheduled_at', `${endDate}T23:59:59Z`);
                    if (dbStatus !== 'TODOS') query = query.eq('status', dbStatus);
                    
                    const { data: workoutData, error } = await (query as any).order('scheduled_at', { ascending: false });
                    if (error) throw error;

                    let finalData = workoutData || [];
                    if (currentUnitId && currentUnitId !== orgId && finalData.length > 0) {
                        const studentIds = finalData.map((item: any) => item.student_id).filter(Boolean);
                        if (studentIds.length > 0) {
                            const { data: validStudents } = await supabase.from('students').select('id').in('id', studentIds).eq('unit_id', currentUnitId);
                            const validSet = new Set(validStudents?.map((s: any) => s.id) || []);
                            finalData = finalData.filter((item: any) => validSet.has(item.student_id));
                        }
                    }

                    resultData = finalData.map((item: any) => ({
                        'Treino': item.title || 'Treino Individual',
                        'Aluno': item.students?.full_name || 'N/A',
                        'Data Agendada': item.scheduled_at ? format(new Date(item.scheduled_at), 'dd/MM/yyyy HH:mm') : '-',
                        'Status': STATUS_MAP[item.status] || item.status
                    }));
                    break;
                }
            }

            setData(resultData);
        } catch (error: any) {
            console.error("Relatorios Error:", error);
            toast({ title: "Erro ao gerar dados", description: error.message || "Erro desconhecido", variant: "destructive" });
            setData([]); // Prevent hanging UI
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = () => {
        if (data.length === 0) return toast({ title: "Aviso", description: "Não há dados para exportar." });
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");
        XLSX.writeFile(workbook, `Relatorio_${activeReport.name}_${format(new Date(), 'ddMMyyyy')}.xlsx`);
        toast({ title: "Excel gerado com sucesso!" });
    };

    const exportToPDF = () => {
        if (data.length === 0) return toast({ title: "Aviso", description: "Não há dados para exportar." });

        const doc = new jsPDF('landscape', 'pt', 'a4');
        const headers = Object.keys(data[0]);
        const body = data.map(obj => Object.values(obj));

        doc.setFontSize(18);
        doc.text(`BeeGym: ${activeReport.name}`, 40, 40);
        doc.setFontSize(10);
        doc.text(`Período: ${format(new Date(startDate), 'dd/MM/yyyy')} até ${format(new Date(endDate), 'dd/MM/yyyy')} | Status: ${status}`, 40, 60);

        autoTable(doc, {
            head: [headers],
            body: body as string[][],
            startY: 80,
            styles: { fontSize: 8, cellPadding: 4 },
            headStyles: { fillColor: [249, 115, 22] },
            alternateRowStyles: { fillColor: [248, 250, 252] },
        });

        doc.save(`Relatorio_${activeReport.name}_${format(new Date(), 'ddMMyyyy')}.pdf`);
        toast({ title: "PDF gerado com sucesso!" });
    };

    const getStatusBadge = (value: string) => {
        const statusMap: Record<string, string> = {
            'PAGO': 'bg-emerald-100 text-emerald-700',
            'ATIVO': 'bg-emerald-100 text-emerald-700',
            'CONCLUÍDO': 'bg-emerald-100 text-emerald-700',
            'CONFIRMADO': 'bg-emerald-100 text-emerald-700',
            'PENDENTE': 'bg-orange-100 text-orange-700',
            'AGENDADO': 'bg-blue-100 text-blue-700',
            'ATRASADO': 'bg-red-100 text-red-700',
            'CANCELADO': 'bg-slate-100 text-slate-700',
            'FALTOU': 'bg-red-100 text-red-700',
            'INATIVO': 'bg-slate-100 text-slate-700',
        };

        return (
            <Badge className={`${statusMap[value] || 'bg-slate-100 text-slate-700'} border-none shadow-none font-bold uppercase text-[11px]`}>
                {value}
            </Badge>
        );
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="pb-4">
                <SectionHeader
                    title="Relatórios"
                    subtitle="Selecione os filtros e clique em Gerar Relatório para visualizar e exportar."
                />
            </div>

            <div className="flex flex-col gap-6">

                {/* Type Selector Tabs */}
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="bg-white border p-1.5 rounded-full h-auto flex flex-wrap gap-1 shadow-sm">
                        {REPORT_TYPES.map((report) => (
                            <TabsTrigger
                                key={report.id}
                                value={report.id}
                                className="flex flex-1 items-center gap-2 px-6 py-2.5 rounded-full data-[state=active]:bg-slate-50 data-[state=active]:text-orange-600 data-[state=active]:border-orange-200 border border-transparent transition-all hover:bg-slate-50/50"
                            >
                                <report.icon className="w-4 h-4" />
                                <span className="font-bold text-sm whitespace-nowrap">{report.name}</span>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                {/* Filter Bar */}
                <Card className="border-slate-200 shadow-sm overflow-visible rounded-[2rem]">
                    <CardContent className="p-4 pt-4">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Data Inicial</label>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="h-10 bg-slate-50/50 border-slate-200 rounded-full"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Data Final</label>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="h-10 bg-slate-50/50 border-slate-200 rounded-full"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Status</label>
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger className="h-10 bg-slate-50/50 border-slate-200 rounded-full px-4">
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
                                className="h-11 bg-orange-500 hover:bg-orange-600 text-white font-bold gap-2 px-8 shrink-0 rounded-full shadow-lg shadow-orange-100 transition-all hover:-translate-y-0.5 active:scale-95 uppercase tracking-wider text-xs"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                Gerar Relatório
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Results Area — only shown after generate */}
                {hasGenerated && (
                    <Card className="border-slate-100 shadow-sm overflow-hidden flex flex-col bg-white rounded-[2rem]">
                        <CardHeader className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/60">
                            <div className="flex items-center gap-2">
                                <activeReport.icon className="h-5 w-5 text-orange-500" />
                                <CardTitle className="text-lg font-bold text-deep-midnight tracking-tight font-display">
                                    Relatório: {activeReport.name}
                                </CardTitle>
                                <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-orange-100 font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider ml-1">
                                    {data.length} registros
                                </Badge>
                            </div>

                            {/* Export Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        disabled={loading || data.length === 0}
                                        className="h-10 gap-2 border-slate-200 font-bold text-slate-700 text-[11px] uppercase tracking-wider px-6 rounded-full shadow-sm transition-all hover:-translate-y-0.5 active:scale-95"
                                    >
                                        <Download className="w-4 h-4" />
                                        Exportar
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-2xl border-slate-100 shadow-xl p-1.5 bg-white min-w-[200px]">
                                    <DropdownMenuItem
                                        onClick={exportToExcel}
                                        className="flex items-center gap-2 rounded-full p-2.5 px-4 text-sm font-medium text-emerald-700 focus:bg-emerald-50 cursor-pointer"
                                    >
                                        <FileSpreadsheet className="w-4 h-4" />
                                        Exportar para Excel
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={exportToPDF}
                                        className="flex items-center gap-2 rounded-full p-2.5 px-4 text-sm font-medium text-red-700 focus:bg-red-50 cursor-pointer"
                                    >
                                        <FileText className="w-4 h-4" />
                                        Exportar para PDF
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>

                        <CardContent className="p-0">
                            <div className="overflow-x-auto min-h-[300px]">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center h-[300px] gap-3 text-slate-400">
                                        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
                                        <p className="text-sm font-medium animate-pulse">Buscando dados...</p>
                                    </div>
                                ) : data.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-[300px] text-slate-400 gap-4">
                                        <div className="p-4 rounded-full bg-slate-50 text-slate-300">
                                            <TableIcon className="w-10 h-10" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-bold text-slate-600">Nenhum dado encontrado</p>
                                            <p className="text-xs mt-1">Tente ajustar os filtros de data e status.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
                                                {Object.keys(data[0]).map(key => (
                                                    <TableHead key={key} className="h-12 font-bold text-[11px] uppercase tracking-wider text-slate-500">
                                                        {key}
                                                    </TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.map((row, idx) => (
                                                <TableRow key={idx} className="hover:bg-slate-50/30 transition-colors">
                                                    {Object.entries(row).map(([key, val]: [string, any], colIdx) => (
                                                        <TableCell key={colIdx} className="py-3 text-sm text-slate-600">
                                                            {key.toLowerCase() === 'status' ? getStatusBadge(val) : val}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
