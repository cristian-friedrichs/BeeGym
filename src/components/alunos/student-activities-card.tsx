'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { format, isPast, isToday, parseISO, isFuture, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    Dumbbell, Users, CreditCard, Loader2, CalendarX,
    CheckCircle2, XCircle, Clock, Calendar, ChevronRight,
    AlertCircle, ReceiptText, Filter,
} from 'lucide-react';
import { getActivityInfo } from '@/lib/class-definitions';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────

interface Workout {
    id: string;
    title: string;
    type: string | null;
    created_at: string;
    status: string;
    scheduled_at?: string | null;
}

interface Invoice {
    id: string;
    amount: number;
    due_date: string;
    paid_at?: string | null;
    status: string;
    description?: string | null;
}

interface StudentActivitiesCardProps {
    studentId: string;
    workouts: Workout[];
    invoices: Invoice[];
    onWorkoutClick?: (id: string) => void;
}

// ── Status maps ───────────────────────────────────────────────────────────────

const WORKOUT_STATUS: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    Concluido:    { label: 'Concluído',    cls: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    Faltou:       { label: 'Falta',        cls: 'bg-red-50 text-red-500 border-red-100',             icon: <XCircle className="h-3.5 w-3.5" /> },
    Cancelado:    { label: 'Cancelado',    cls: 'bg-slate-100 text-slate-500 border-slate-200',      icon: <AlertCircle className="h-3.5 w-3.5" /> },
    'Em Execução':{ label: 'Em andamento', cls: 'bg-amber-50 text-amber-500 border-amber-100',       icon: <Clock className="h-3.5 w-3.5" /> },
    Agendado:     { label: 'Agendado',     cls: 'bg-blue-50 text-blue-500 border-blue-100',          icon: <Calendar className="h-3.5 w-3.5" /> },
    SCHEDULED:    { label: 'Agendado',     cls: 'bg-blue-50 text-blue-500 border-blue-100',          icon: <Calendar className="h-3.5 w-3.5" /> },
    COMPLETED:    { label: 'Concluído',    cls: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    CANCELLED:    { label: 'Cancelado',    cls: 'bg-slate-100 text-slate-500 border-slate-200',      icon: <AlertCircle className="h-3.5 w-3.5" /> },
};

const INVOICE_STATUS: Record<string, { label: string; cls: string }> = {
    PAID:     { label: 'Pago',       cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    PAGO:     { label: 'Pago',       cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    OVERDUE:  { label: 'Atrasado',   cls: 'bg-red-50 text-red-500 border-red-100' },
    Atrasado: { label: 'Atrasado',   cls: 'bg-red-50 text-red-500 border-red-100' },
    ATRASADO: { label: 'Atrasado',   cls: 'bg-red-50 text-red-500 border-red-100' },
    PENDENTE: { label: 'Programado', cls: 'bg-amber-50 text-amber-600 border-amber-100' },
    Pendente: { label: 'Programado', cls: 'bg-amber-50 text-amber-600 border-amber-100' },
    CANCELADO:{ label: 'Cancelado',  cls: 'bg-slate-100 text-slate-500 border-slate-200' },
};

// Map canonical status values to display labels for FilterBar
const INVOICE_STATUS_LABELS: Record<string, string> = {
    PAGO: 'Pago', ATRASADO: 'Atrasado', Atrasado: 'Atrasado', PENDENTE: 'Programado', CANCELADO: 'Cancelado',
};

const MONTHS = [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 4 }, (_, i) => currentYear - i);

// ── Filter bar ────────────────────────────────────────────────────────────────

interface FilterBarProps {
    month: string; setMonth: (v: string) => void;
    year: string;  setYear:  (v: string) => void;
    status: string; setStatus: (v: string) => void;
    statusOptions: string[];
}

function FilterBar({ month, setMonth, year, setYear, status, setStatus, statusOptions }: FilterBarProps) {
    const selectCls = "h-7 text-[11px] rounded-lg border-slate-200 bg-white min-w-0 font-medium";
    return (
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-50 bg-slate-50/50">
            <Filter className="h-3 w-3 text-slate-400 shrink-0" />
            <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className={cn(selectCls, "w-[100px]")}>
                    <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl text-sm">
                    <SelectItem value="all">Todos os meses</SelectItem>
                    {MONTHS.map((m, i) => (
                        <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={year} onValueChange={setYear}>
                <SelectTrigger className={cn(selectCls, "w-[80px]")}>
                    <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl text-sm">
                    <SelectItem value="all">Todos</SelectItem>
                    {YEARS.map(y => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className={cn(selectCls, "w-[110px]")}>
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl text-sm">
                    <SelectItem value="all">Todos</SelectItem>
                    {statusOptions.map(s => (
                        <SelectItem key={s} value={s}>
                            {WORKOUT_STATUS[s]?.label || INVOICE_STATUS_LABELS[s] || INVOICE_STATUS[s]?.label || s}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

// ── Workout item ──────────────────────────────────────────────────────────────

function WorkoutRow({ item, onClick }: { item: any; onClick?: () => void }) {
    const st = WORKOUT_STATUS[item.status] || WORKOUT_STATUS.Agendado;
    const dateStr = item.scheduled_at || item.created_at;
    const today = dateStr ? isToday(parseISO(dateStr)) : false;
    const actInfo = getActivityInfo(item.sub || item.type, item.title, item.kind === 'class');
    const IconComponent = actInfo.icon;
    return (
        <div
            onClick={onClick}
            className={cn(
                'flex items-center gap-3 px-4 py-3 transition-colors',
                onClick && 'cursor-pointer hover:bg-slate-50/60',
                today && 'bg-amber-50/40'
            )}
        >
            <div
                className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${actInfo.color}18` }}
            >
                <IconComponent className="h-3.5 w-3.5" style={{ color: actInfo.color }} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-slate-800 truncate">{item.title || 'Treino'}</p>
                    {today && <Badge className="bg-bee-amber text-bee-midnight border-none text-[9px] font-bold rounded-full px-1.5 py-0 shadow-none">HOJE</Badge>}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 capitalize truncate">
                    {dateStr ? format(parseISO(dateStr), "EEE, d 'de' MMM · HH:mm", { locale: ptBR }) : '—'}
                    {item.sub ? ` · ${item.sub}` : ''}
                </p>
            </div>
            <Badge className={cn('text-[10px] font-bold border rounded-full px-2 py-0.5 shadow-none shrink-0', st.cls)}>
                {st.label}
            </Badge>
            {onClick && <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />}
        </div>
    );
}

// ── Invoice row ───────────────────────────────────────────────────────────────

function InvoiceRow({ invoice }: { invoice: Invoice }) {
    const st = INVOICE_STATUS[invoice.status] || { label: invoice.status, cls: 'bg-slate-100 text-slate-500 border-slate-200' };
    const isPaid = invoice.status === 'PAID' || invoice.status === 'paid' || invoice.status === 'PAGO';
    const isOverdue = invoice.status === 'OVERDUE' || invoice.status === 'Atrasado';
    const isPack = invoice.description?.toLowerCase().includes('pack') || invoice.description?.toLowerCase().includes('à vista') || invoice.description?.toLowerCase().includes('a vista');
    const label = invoice.description
        ? invoice.description.replace(/\s*\(.*?\)\s*/g, '').trim()
        : isPack ? 'Pagamento à vista' : 'Mensalidade';
    const dateToShow = isPaid && invoice.paid_at
        ? `Pago em: ${format(new Date(invoice.paid_at + (invoice.paid_at.length === 10 ? 'T12:00:00' : '')), 'dd/MM/yyyy')}`
        : `Vencimento: ${format(new Date(invoice.due_date + 'T12:00:00'), 'dd/MM/yyyy')}`;

    return (
        <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60 transition-colors">
            <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center shrink-0',
                isPaid ? 'bg-emerald-50' : isOverdue ? 'bg-red-50' : 'bg-amber-50'
            )}>
                <CreditCard className={cn('h-3.5 w-3.5', isPaid ? 'text-emerald-500' : isOverdue ? 'text-red-500' : 'text-amber-500')} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                        {invoice.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    {isPack && (
                        <Badge className="bg-blue-50 text-blue-600 border-none text-[9px] font-bold rounded-full px-1.5 py-0 shadow-none shrink-0">Pack</Badge>
                    )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">{label} · {dateToShow}</p>
            </div>
            <Badge className={cn('text-[10px] font-bold border rounded-full px-2 py-0.5 shadow-none shrink-0', st.cls)}>
                {st.label}
            </Badge>
        </div>
    );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function applyFilters<T extends { date: string; status: string }>(
    items: T[], month: string, year: string, status: string
): T[] {
    return items.filter(item => {
        const d = parseISO(item.date);
        if (month !== 'all' && (d.getMonth() + 1) !== parseInt(month)) return false;
        if (year !== 'all' && d.getFullYear() !== parseInt(year)) return false;
        if (status !== 'all' && item.status !== status) return false;
        return true;
    });
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
            {icon}
            <p className="text-xs">{text}</p>
        </div>
    );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

interface PanelProps {
    title: string;
    icon: React.ReactNode;
    upcoming: any[];
    history: any[];
    loadingUpcoming?: boolean;
    renderRow: (item: any) => React.ReactNode;
    upcomingStatusOptions: string[];
    historyStatusOptions: string[];
    emptyUpcoming: string;
    emptyHistory: string;
}

function Panel({
    title, icon, upcoming, history, loadingUpcoming,
    renderRow, upcomingStatusOptions, historyStatusOptions,
    emptyUpcoming, emptyHistory,
}: PanelProps) {
    const [tab, setTab] = useState<'upcoming' | 'history'>('upcoming');

    // Filters for upcoming
    const [upMonth, setUpMonth] = useState('all');
    const [upYear, setUpYear] = useState('all');
    const [upStatus, setUpStatus] = useState('all');

    // Filters for history
    const [hiMonth, setHiMonth] = useState('all');
    const [hiYear, setHiYear] = useState(String(currentYear));
    const [hiStatus, setHiStatus] = useState('all');

    const filteredUpcoming = useMemo(() => applyFilters(
        upcoming.map(i => ({ ...i, date: i.scheduled_at || i.date || i.due_date || i.created_at })),
        upMonth, upYear, upStatus
    ), [upcoming, upMonth, upYear, upStatus]);

    const filteredHistory = useMemo(() => applyFilters(
        history.map(i => ({ ...i, date: i.scheduled_at || i.date || i.due_date || i.created_at })),
        hiMonth, hiYear, hiStatus
    ), [history, hiMonth, hiYear, hiStatus]);

    const items = tab === 'upcoming' ? filteredUpcoming : filteredHistory;

    return (
        <div className="flex flex-col min-h-0">
            {/* Panel header */}
            <div className="flex items-center gap-2 px-4 pt-4 pb-0">
                <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-slate-100 shrink-0">
                    {icon}
                </div>
                <span className="text-sm font-bold text-slate-700">{title}</span>
            </div>

            {/* Sub-tabs */}
            <div className="flex items-center gap-0 px-4 pt-2 pb-0 border-b border-slate-100">
                {(['upcoming', 'history'] as const).map(t => {
                    const count = t === 'upcoming' ? upcoming.length : history.length;
                    return (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold border-b-2 transition-all -mb-px',
                                tab === t ? 'border-bee-amber text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'
                            )}
                        >
                            {t === 'upcoming' ? 'Próximas' : 'Histórico'}
                            {count > 0 && (
                                <span className={cn('text-[10px] font-bold rounded-full px-1.5',
                                    tab === t ? 'bg-bee-amber/15 text-bee-amber' : 'bg-slate-100 text-slate-400'
                                )}>{count}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Filter bar */}
            {tab === 'upcoming' ? (
                <FilterBar
                    month={upMonth} setMonth={setUpMonth}
                    year={upYear} setYear={setUpYear}
                    status={upStatus} setStatus={setUpStatus}
                    statusOptions={upcomingStatusOptions}
                />
            ) : (
                <FilterBar
                    month={hiMonth} setMonth={setHiMonth}
                    year={hiYear} setYear={setHiYear}
                    status={hiStatus} setStatus={setHiStatus}
                    statusOptions={historyStatusOptions}
                />
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-50 max-h-[380px]">
                {loadingUpcoming && tab === 'upcoming' ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
                    </div>
                ) : items.length === 0 ? (
                    <EmptyState
                        icon={<CalendarX className="h-6 w-6 text-slate-200" />}
                        text={tab === 'upcoming' ? emptyUpcoming : emptyHistory}
                    />
                ) : (
                    items.map((item, i) => (
                        <div key={item.id || i}>{renderRow(item)}</div>
                    ))
                )}
            </div>
        </div>
    );
}

// ── Payments panel (no tabs, single sorted list) ─────────────────────────────

function PaymentsPanel({ payments }: { payments: (Invoice & { _sortDate: Date })[] }) {
    const [month, setMonth] = useState('all');
    const [year, setYear] = useState('all');
    const [status, setStatus] = useState('all');

    const filtered = useMemo(() => {
        return payments.filter(inv => {
            const d = inv._sortDate;
            if (month !== 'all' && (d.getMonth() + 1) !== parseInt(month)) return false;
            if (year !== 'all' && d.getFullYear() !== parseInt(year)) return false;
            if (status !== 'all' && inv.status.toUpperCase() !== status.toUpperCase()
                && inv.status !== status) return false;
            return true;
        });
    }, [payments, month, year, status]);

    return (
        <div className="flex flex-col min-h-0">
            <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-slate-100">
                <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-slate-100 shrink-0">
                    <ReceiptText className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <span className="text-sm font-bold text-slate-700 flex-1">Pagamentos</span>
                <span className="text-[11px] font-semibold text-slate-400">{payments.length} registro{payments.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-50 bg-slate-50/50">
                <Filter className="h-3 w-3 text-slate-400 shrink-0" />
                <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger className="h-7 text-[11px] rounded-lg border-slate-200 bg-white w-[100px] font-medium">
                        <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-xl text-sm">
                        <SelectItem value="all">Todos os meses</SelectItem>
                        {MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="h-7 text-[11px] rounded-lg border-slate-200 bg-white w-[80px] font-medium">
                        <SelectValue placeholder="Ano" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-xl text-sm">
                        <SelectItem value="all">Todos</SelectItem>
                        {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-7 text-[11px] rounded-lg border-slate-200 bg-white w-[110px] font-medium">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-xl text-sm">
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="paid">Pago</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="overdue">Atrasado</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-50 max-h-[380px]">
                {filtered.length === 0 ? (
                    <EmptyState
                        icon={<ReceiptText className="h-6 w-6 text-slate-200" />}
                        text="Nenhum pagamento encontrado"
                    />
                ) : (
                    filtered.map(inv => <InvoiceRow key={inv.id} invoice={inv} />)
                )}
            </div>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export function StudentActivitiesCard({ studentId, workouts, invoices, onWorkoutClick }: StudentActivitiesCardProps) {
    const supabase = createClient();
    const [upcomingRaw, setUpcomingRaw] = useState<any[]>([]);
    const [loadingUpcoming, setLoadingUpcoming] = useState(true);

    useEffect(() => {
        if (!studentId) return;
        fetchUpcoming();
    }, [studentId]);

    async function fetchUpcoming() {
        setLoadingUpcoming(true);
        try {
            const todayStr = format(new Date(), 'yyyy-MM-dd');

            const { data: ws } = await (supabase as any)
                .from('workouts').select('id, title, type, scheduled_at, end_time, status')
                .eq('student_id', studentId)
                .in('status', ['Agendado', 'Em Execução'])
                .gte('scheduled_at', todayStr)
                .order('scheduled_at', { ascending: true }).limit(30);

            const { data: enrollments } = await (supabase as any)
                .from('event_enrollments')
                .select('id, status, calendar_events(id, title, type, start_datetime, end_datetime, instructor_name, status)')
                .eq('student_id', studentId)
                .not('calendar_events', 'is', null);

            const wItems = (ws || []).map((w: any) => ({
                id: w.id, title: w.title || 'Treino', kind: 'workout' as const,
                scheduled_at: w.scheduled_at, status: w.status, sub: w.type || '',
            }));

            const cItems = (enrollments || [])
                .filter((e: any) => e.calendar_events && !isPast(parseISO(e.calendar_events.start_datetime)))
                .map((e: any) => ({
                    id: e.id, title: e.calendar_events.title || 'Aula',
                    kind: e.calendar_events.type === 'TRAINING' ? 'workout' as const : 'class' as const,
                    scheduled_at: e.calendar_events.start_datetime,
                    status: e.status || e.calendar_events.status || 'Agendado',
                    sub: e.calendar_events.instructor_name || '',
                }));

            setUpcomingRaw([...wItems, ...cItems].sort(
                (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
            ));
        } catch {}
        finally { setLoadingUpcoming(false); }
    }

    // Split workouts into upcoming / history
    const today = startOfDay(new Date());
    const workoutUpcoming = useMemo(() => upcomingRaw, [upcomingRaw]);
    const workoutHistory = useMemo(() => {
        const filtered = (workouts || []).filter(w => {
            const dateStr = w.scheduled_at || w.created_at;
            if (!dateStr) return true;
            return isPast(parseISO(dateStr)) || ['Concluido', 'Faltou', 'Cancelado', 'COMPLETED', 'CANCELLED'].includes(w.status);
        });
        return filtered.map(w => ({ ...w, kind: 'workout' as const, sub: w.type || '' }));
    }, [workouts]);

    // All payments sorted newest first — packs (paid_at) and recurring (due_date)
    const allPayments = useMemo(() =>
        [...(invoices || [])]
            .map(inv => ({
                ...inv,
                _sortDate: inv.paid_at
                    ? new Date(inv.paid_at + (inv.paid_at.length === 10 ? 'T12:00:00' : ''))
                    : new Date(inv.due_date + 'T12:00:00'),
            }))
            .sort((a, b) => b._sortDate.getTime() - a._sortDate.getTime()),
    [invoices]);

    return (
        <div className="grid grid-cols-2 gap-5">
            {/* ── Card: Aulas & Treinos ── */}
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <Panel
                    title="Aulas & Treinos"
                    icon={<Dumbbell className="h-3.5 w-3.5 text-bee-amber" />}
                    upcoming={workoutUpcoming}
                    history={workoutHistory}
                    loadingUpcoming={loadingUpcoming}
                    renderRow={(item) => (
                        <WorkoutRow
                            item={item}
                            onClick={item.kind !== 'class' ? () => onWorkoutClick?.(item.id) : undefined}
                        />
                    )}
                    upcomingStatusOptions={['Agendado', 'Em Execução']}
                    historyStatusOptions={['Concluido', 'Faltou', 'Cancelado']}
                    emptyUpcoming="Nenhuma atividade agendada"
                    emptyHistory="Nenhuma atividade no histórico"
                />
            </div>

            {/* ── Card: Pagamentos ── */}
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <PaymentsPanel payments={allPayments} />
            </div>
        </div>
    );
}
