'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Plus, Users, Dumbbell, MapPin, User, Clock } from 'lucide-react';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import {
    format, startOfMonth, endOfMonth, eachDayOfInterval, getDay,
    isToday, addMonths, subMonths, isSameDay, startOfWeek, endOfWeek,
    subDays, addDays, setHours,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { SectionHeader } from '@/components/ui/section-header';
import { getClassType } from '@/lib/class-definitions';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { NewEventSelectionDialog } from '@/components/painel/modals/new-event-selection-dialog';

const WorkoutModal = dynamic(() => import('@/components/treinos/workout-modal').then(m => ({ default: m.WorkoutModal })), { ssr: false });
const ClassModal = dynamic(() => import('@/components/painel/modals/class-modal').then(m => ({ default: m.ClassModal })), { ssr: false });
const EventDetailsModal = dynamic(() => import('@/components/painel/modals/event-details-modal').then(m => ({ default: m.EventDetailsModal })), { ssr: false });

// ─── Constants ────────────────────────────────────────────────────────────────
const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 06:00 – 21:00
const HOUR_HEIGHT = 72; // px per hour
const DAY_START_HOUR = 6;
const WORKOUT_COLOR = '#6366f1';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    SCHEDULED:    { label: 'Agendada',     color: '#22c55e' },
    IN_PROGRESS:  { label: 'Em andamento', color: '#f97316' },
    COMPLETED:    { label: 'Realizada',    color: '#6b7280' },
    CANCELLED:    { label: 'Cancelada',    color: '#ef4444' },
    PENDING:      { label: 'Pendente',     color: '#eab308' },
    MISSED:       { label: 'Faltou',       color: '#1e293b' },
    // legacy
    Agendado:     { label: 'Agendado',     color: '#22c55e' },
    'Em Execução':{ label: 'Em andamento', color: '#f97316' },
    Pendente:     { label: 'Pendente',     color: '#eab308' },
    Cancelado:    { label: 'Cancelado',    color: '#ef4444' },
    Concluido:    { label: 'Realizado',    color: '#6b7280' },
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface AgendaEvent {
    id: string;
    kind: 'class' | 'workout';
    title: string;
    start: Date;
    end: Date;
    time: string;
    durationMin: number;
    color: string;
    iconName: string;
    status: string;
    instructor?: string;
    studentName?: string;
    room?: string;
    capacity?: number;
    enrollmentCount: number;
    rawEvent: any;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function capitalize(s: string) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

function resolveStyle(row: any): { color: string; iconName: string } {
    const t = row.template || {};
    const def = getClassType(t.icon || t.title || row.type || null, row.title);
    return {
        color: t.color || def?.color || '#F97316',
        iconName: t.icon || def?.iconName || 'dumbbell',
    };
}

function statusConfig(status: string) {
    return STATUS_MAP[status] ?? { label: status || '—', color: '#94a3b8' };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function CalendarSkeleton() {
    return (
        <div className="flex-1 p-4 space-y-3 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 rounded-2xl bg-slate-100" style={{ opacity: 1 - i * 0.15 }} />
            ))}
        </div>
    );
}

// ─── Event chip (month view) ──────────────────────────────────────────────────
function MonthChip({ event, onClick }: { event: AgendaEvent; onClick: () => void }) {
    const sc = statusConfig(event.status);
    return (
        <button
            onClick={e => { e.stopPropagation(); onClick(); }}
            className="w-full flex items-center gap-1 px-1.5 py-0.5 rounded-md text-left group transition-all hover:brightness-90"
            style={{ backgroundColor: `${event.color}1a`, borderLeft: `2.5px solid ${event.color}` }}
        >
            <span className="text-[10px] font-mono font-semibold shrink-0" style={{ color: event.color }}>
                {event.time}
            </span>
            <span className="text-[10.5px] font-semibold truncate flex-1 leading-tight" style={{ color: event.color }}>
                {event.title}
            </span>
            <span
                className="h-1.5 w-1.5 rounded-full shrink-0"
                style={{ backgroundColor: sc.color }}
            />
        </button>
    );
}

// ─── Event card (week / day grid) ─────────────────────────────────────────────
function GridCard({
    event,
    style,
    onClick,
    compact = false,
}: {
    event: AgendaEvent;
    style?: React.CSSProperties;
    onClick: () => void;
    compact?: boolean;
}) {
    const sc = statusConfig(event.status);
    const showMeta = event.durationMin >= 45;

    return (
        <div
            className="absolute left-0.5 right-0.5 rounded-lg overflow-hidden cursor-pointer group transition-all hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
            style={{
                ...style,
                background: `linear-gradient(135deg, ${event.color}18 0%, ${event.color}0d 100%)`,
                borderLeft: `3px solid ${event.color}`,
                border: `1px solid ${event.color}30`,
                borderLeftWidth: '3px',
            }}
            onClick={e => { e.stopPropagation(); onClick(); }}
        >
            <div className="p-1.5 h-full flex flex-col gap-0.5 overflow-hidden">
                {/* Title row */}
                <div className="flex items-start gap-1 min-w-0">
                    {event.kind === 'workout'
                        ? <Dumbbell className="h-3 w-3 mt-0.5 shrink-0" style={{ color: event.color }} />
                        : <span style={{ color: event.color }}><DynamicIcon name={event.iconName} className="h-3 w-3 mt-0.5 shrink-0" /></span>
                    }
                    <span className="text-[11px] font-bold leading-tight truncate flex-1 text-slate-800">
                        {event.title}
                    </span>
                    <span
                        className="h-1.5 w-1.5 rounded-full shrink-0 mt-1"
                        style={{ backgroundColor: sc.color }}
                    />
                </div>

                {/* Meta row */}
                {showMeta && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                        <span className="font-mono">{event.time}</span>
                        {event.instructor && <><span>·</span><span className="truncate">{event.instructor}</span></>}
                        {event.studentName && !event.instructor && <><span>·</span><span className="truncate">{event.studentName}</span></>}
                        {typeof event.capacity === 'number' && (
                            <span className="ml-auto flex items-center gap-0.5 shrink-0">
                                <Users className="h-2.5 w-2.5" />
                                {event.enrollmentCount}/{event.capacity}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Event card (day list view) ───────────────────────────────────────────────
function ListCard({ event, onClick }: { event: AgendaEvent; onClick: () => void }) {
    const sc = statusConfig(event.status);

    return (
        <button
            className="w-full text-left flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-200 group"
            style={{ borderLeftColor: event.color, borderLeftWidth: 3 }}
            onClick={onClick}
        >
            {/* Icon */}
            <div
                className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${event.color}18` }}
            >
                {event.kind === 'workout'
                    ? <Dumbbell className="h-5 w-5" style={{ color: event.color }} />
                    : <span style={{ color: event.color }}><DynamicIcon name={event.iconName} className="h-5 w-5" /></span>
                }
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-slate-800 truncate group-hover:text-slate-900">
                        {event.title}
                    </p>
                    <span
                        className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap"
                        style={{ color: sc.color, backgroundColor: `${sc.color}15`, borderColor: `${sc.color}30` }}
                    >
                        {sc.label}
                    </span>
                </div>
                <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-mono font-semibold text-slate-700">
                        <Clock className="h-3 w-3" />
                        {event.time} · {event.durationMin}min
                    </span>
                    {(event.instructor || event.studentName) && (
                        <span className="flex items-center gap-1 truncate">
                            <User className="h-3 w-3" />{event.instructor || event.studentName}
                        </span>
                    )}
                    {event.room && (
                        <span className="hidden sm:flex items-center gap-1 truncate">
                            <MapPin className="h-3 w-3" />{event.room}
                        </span>
                    )}
                    {typeof event.capacity === 'number' && (
                        <span className="flex items-center gap-1 text-slate-500">
                            <Users className="h-3 w-3" />
                            {event.enrollmentCount}/{event.capacity}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AgendaPage() {
    const supabase = createClient();
    const { organizationId } = useAuth();
    const { toast } = useToast();

    const isMobile = useIsMobile();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'day' | 'list' | 'week' | 'month'>('week');
    const [events, setEvents] = useState<AgendaEvent[]>([]);
    const [loading, setLoading] = useState(true);

    // Mobile uses 'list' instead of 'day'; keep state coherent across breakpoint changes
    useEffect(() => {
        if (isMobile) setView(v => (v === 'day' ? 'list' : v));
        else setView(v => (v === 'list' ? 'day' : v));
    }, [isMobile]);

    // Modals
    const [selectionOpen, setSelectionOpen] = useState(false);
    const [classModalOpen, setClassModalOpen] = useState(false);
    const [workoutModalOpen, setWorkoutModalOpen] = useState(false);
    const [workoutToEdit, setWorkoutToEdit] = useState<any>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);
    const [selectedDateForNew, setSelectedDateForNew] = useState<Date | undefined>();

    const scrollRef = useRef<HTMLDivElement>(null);

    // Read URL params on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const v = params.get('view');
        if (v === 'day' || v === 'list' || v === 'week' || v === 'month') setView(v);
        const d = params.get('date');
        if (d) { const parsed = new Date(d); if (!isNaN(parsed.getTime())) setCurrentDate(parsed); }
    }, []);

    // Scroll to business hours on mount / view change (only desktop week has the hour grid)
    useEffect(() => {
        if (view === 'week' && !isMobile) {
            requestAnimationFrame(() => {
                if (scrollRef.current) scrollRef.current.scrollTop = (8 - DAY_START_HOUR) * HOUR_HEIGHT;
            });
        }
    }, [view, isMobile]);

    // ── Fetch range based on view ─────────────────────────────────────────────
    const fetchRange = useMemo(() => {
        if (view === 'day') {
            return {
                start: startOfWeek(currentDate, { locale: ptBR }).toISOString(),
                end: endOfWeek(currentDate, { locale: ptBR }).toISOString(),
            };
        }
        if (view === 'week') {
            return {
                start: startOfWeek(currentDate, { locale: ptBR }).toISOString(),
                end: endOfWeek(currentDate, { locale: ptBR }).toISOString(),
            };
        }
        // month and list: full padded grid
        return {
            start: startOfWeek(startOfMonth(currentDate), { locale: ptBR }).toISOString(),
            end: endOfWeek(endOfMonth(currentDate), { locale: ptBR }).toISOString(),
        };
    }, [currentDate, view]);

    // ── Data fetch ────────────────────────────────────────────────────────────
    const fetchEvents = useCallback(async () => {
        if (!organizationId) return;
        setLoading(true);

        // Fire-and-forget status update — never block the fetch
        supabase.rpc('update_class_statuses' as any).then(null, () => {});

        const [classRes, workoutRes] = await Promise.all([
            supabase
                .from('calendar_events')
                .select(`
                    id, title, start_datetime, end_datetime, type, status, capacity,
                    instructor_name, address,
                    room:rooms ( name ),
                    instructor:instructors ( name ),
                    template:class_template_id ( title, icon, color ),
                    enrollments:event_enrollments ( count )
                ` as any)
                .eq('organization_id', organizationId)
                .in('type', ['CLASS', 'TRAINING'])
                .gte('start_datetime', fetchRange.start)
                .lte('start_datetime', fetchRange.end),

            (supabase as any)
                .from('workouts')
                .select(`
                    id, title, scheduled_at, end_time, type, status,
                    student:students ( full_name ),
                    room:rooms ( name ),
                    instructor:instructors ( name )
                `)
                .eq('organization_id', organizationId)
                .gte('scheduled_at', fetchRange.start)
                .lte('scheduled_at', fetchRange.end)
                .not('scheduled_at', 'is', null),
        ]);

        const classEvents: AgendaEvent[] = (classRes.data || []).map((row: any) => {
            const start = new Date(row.start_datetime);
            const end = new Date(row.end_datetime);
            const durationMin = Math.round((end.getTime() - start.getTime()) / 60000);
            const isTraining = row.type === 'TRAINING';
            const { color, iconName } = resolveStyle(row);
            return {
                id: row.id,
                kind: isTraining ? 'workout' : 'class',
                title: row.title || row.template?.title || (isTraining ? 'Treino' : 'Aula'),
                start, end,
                time: format(start, 'HH:mm'),
                durationMin,
                color: isTraining ? WORKOUT_COLOR : color,
                iconName: isTraining ? 'dumbbell' : iconName,
                status: row.status || 'SCHEDULED',
                instructor: row.instructor?.name || row.instructor_name || undefined,
                room: row.room?.name || undefined,
                capacity: row.capacity ?? undefined,
                enrollmentCount: row.enrollments?.[0]?.count ?? 0,
                rawEvent: {
                    ...row, color: isTraining ? WORKOUT_COLOR : color, iconName,
                    room: row.room?.name, instructor: row.instructor?.name || row.instructor_name,
                    time: format(start, 'HH:mm'), duration: durationMin, eventType: row.type,
                },
            };
        });

        const workoutEvents: AgendaEvent[] = (workoutRes.data || []).map((row: any) => {
            const start = new Date(row.scheduled_at);
            const end = row.end_time ? new Date(row.end_time) : new Date(start.getTime() + 60 * 60000);
            const durationMin = Math.max(Math.round((end.getTime() - start.getTime()) / 60000), 30);
            return {
                id: row.id,
                kind: 'workout',
                title: row.title || 'Treino',
                start, end,
                time: format(start, 'HH:mm'),
                durationMin,
                color: WORKOUT_COLOR,
                iconName: 'dumbbell',
                status: row.status || 'Agendado',
                studentName: row.student?.full_name || undefined,
                room: row.room?.name || undefined,
                instructor: row.instructor?.name || undefined,
                enrollmentCount: 0,
                rawEvent: {
                    ...row, start_datetime: row.scheduled_at, color: WORKOUT_COLOR, iconName: 'dumbbell',
                    time: format(start, 'HH:mm'), duration: durationMin, eventType: 'WORKOUT',
                    student_name: row.student?.full_name, room: row.room?.name || 'Sem local',
                    instructor: row.instructor?.name || 'Não atribuído',
                },
            };
        });

        setEvents([...classEvents, ...workoutEvents].sort((a, b) => a.start.getTime() - b.start.getTime()));
        setLoading(false);
    }, [organizationId, fetchRange]);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    // ── Realtime ──────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!organizationId) return;
        const channel = supabase.channel('agenda_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' }, fetchEvents)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'workouts' }, fetchEvents)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [organizationId, fetchEvents]);

    // ── Navigation ────────────────────────────────────────────────────────────
    const handlePrev = () => {
        if (view === 'month' || view === 'list') setCurrentDate(d => subMonths(d, 1));
        else if (view === 'week') setCurrentDate(d => subDays(d, 7));
        else setCurrentDate(d => subDays(d, 1));
    };
    const handleNext = () => {
        if (view === 'month' || view === 'list') setCurrentDate(d => addMonths(d, 1));
        else if (view === 'week') setCurrentDate(d => addDays(d, 7));
        else setCurrentDate(d => addDays(d, 1));
    };

    // ── Computed ──────────────────────────────────────────────────────────────
    const daysInWeek = useMemo(() => eachDayOfInterval({
        start: startOfWeek(currentDate, { locale: ptBR }),
        end: endOfWeek(currentDate, { locale: ptBR }),
    }), [currentDate]);

    const daysInMonth = useMemo(() => eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentDate), { locale: ptBR }),
        end: endOfWeek(endOfMonth(currentDate), { locale: ptBR }),
    }), [currentDate]);

    const getEventsForDay = useCallback((day: Date) =>
        events.filter(e => isSameDay(e.start, day)).sort((a, b) => a.time.localeCompare(b.time)),
        [events]
    );

    const headerTitle = useMemo(() => {
        if (view === 'day') return capitalize(format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR }));
        if (view === 'week') {
            const ws = startOfWeek(currentDate, { locale: ptBR });
            const we = endOfWeek(currentDate, { locale: ptBR });
            return ws.getMonth() === we.getMonth()
                ? capitalize(format(ws, "MMMM yyyy", { locale: ptBR }))
                : `${capitalize(format(ws, 'MMM', { locale: ptBR }))} – ${capitalize(format(we, "MMM yyyy", { locale: ptBR }))}`;
        }
        return capitalize(format(currentDate, "MMMM yyyy", { locale: ptBR }));
    }, [currentDate, view]);

    const totalEventsToday = useMemo(() => getEventsForDay(new Date()).length, [getEventsForDay]);

    // Days for the mobile "list" view: every day in the current padded-month range,
    // skipping empty days but always keeping today if it falls inside the range.
    const listDays = useMemo(() => {
        return daysInMonth
            .map(day => ({ day, events: getEventsForDay(day) }))
            .filter(({ day, events }) => events.length > 0 || isToday(day));
    }, [daysInMonth, getEventsForDay]);

    // ── Event handlers ────────────────────────────────────────────────────────
    const handleEventClick = (event: AgendaEvent) => {
        setSelectedEvent(event);
        setDetailsOpen(true);
    };

    const handleSlotClick = (date: Date) => {
        setSelectedDateForNew(date);
        setSelectionOpen(true);
    };

    const handleEditEvent = (event: any) => {
        setDetailsOpen(false);
        if (event.eventType === 'WORKOUT' || event.kind === 'workout') {
            setWorkoutToEdit(event);
            setWorkoutModalOpen(true);
        } else {
            setClassModalOpen(true);
        }
    };

    // ── Position helpers ──────────────────────────────────────────────────────
    function eventStyle(event: AgendaEvent): React.CSSProperties {
        const h = event.start.getHours();
        const m = event.start.getMinutes();
        const top = (h - DAY_START_HOUR) * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT;
        const height = Math.max((event.durationMin / 60) * HOUR_HEIGHT - 2, 20);
        return { top: `${top}px`, height: `${height}px` };
    }

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <TooltipProvider>
            <div className="flex flex-col h-full gap-4">

                {/* ── Page Header ───────────────────────────────────────────── */}
                <SectionHeader
                    title="Agenda"
                    subtitle={capitalize(format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR }))}
                    action={
                        <Button
                            className="font-bold shadow-sm bg-bee-amber hover:bg-amber-500 text-bee-midnight rounded-full font-display uppercase tracking-wider text-[11px] h-9 px-3 md:px-4 gap-1 md:gap-1.5 transition-all hover:-translate-y-0.5 active:scale-95"
                            onClick={() => { setSelectedDateForNew(undefined); setSelectionOpen(true); }}
                        >
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline">Nova Atividade</span>
                            <span className="sm:hidden">Nova</span>
                        </Button>
                    }
                />

                {/* ── Calendar Container ────────────────────────────────────── */}
                <div className="flex flex-col flex-1 bg-white border border-slate-100 rounded-3xl overflow-hidden min-h-0 shadow-sm">

                    {/* ── Toolbar ───────────────────────────────────────────── */}
                    <div className="border-b border-slate-100 shrink-0 bg-white">
                        {/* Row 1: Title + view switcher */}
                        <div className="flex items-center justify-between gap-2 px-3 md:px-5 py-2.5">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <h2 className="text-sm md:text-base font-bold text-slate-800 truncate">{headerTitle}</h2>
                                {totalEventsToday > 0 && (
                                    <span className="shrink-0 text-[10px] font-bold bg-bee-amber/20 text-amber-700 px-2 py-0.5 rounded-full">
                                        {totalEventsToday} hoje
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center bg-slate-100 rounded-full p-0.5 gap-0.5 shrink-0">
                                {(isMobile
                                    ? (['list', 'week', 'month'] as const)
                                    : (['day', 'week', 'month'] as const)
                                ).map(v => (
                                    <button
                                        key={v}
                                        onClick={() => setView(v)}
                                        className={cn(
                                            'px-2.5 md:px-3.5 py-1.5 text-[10px] md:text-[11px] font-bold tracking-wide rounded-full transition-all',
                                            view === v
                                                ? 'bg-bee-midnight text-white shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700'
                                        )}
                                    >
                                        {{ day: 'Dia', list: 'Lista', week: 'Semana', month: 'Mês' }[v]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Row 2: Navigation */}
                        <div className="flex items-center gap-1 px-3 md:px-5 pb-2.5">
                            <button
                                onClick={handlePrev}
                                className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-500"
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                            <button
                                onClick={() => setCurrentDate(new Date())}
                                className="h-7 px-3 text-[11px] font-bold text-slate-500 hover:bg-slate-100 rounded-full transition-colors uppercase tracking-wide"
                            >
                                Hoje
                            </button>
                            <button
                                onClick={handleNext}
                                className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-500"
                            >
                                <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* ── Calendar Body ─────────────────────────────────────── */}
                    <div className="flex-1 min-h-0 overflow-hidden">

                        {/* ══ MONTH VIEW (desktop) ════════════════════════════ */}
                        {view === 'month' && !isMobile && (
                            <div className="flex flex-col h-full">
                                {/* Day names header */}
                                <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50 shrink-0">
                                    {WEEK_DAYS.map((d, i) => (
                                        <div key={d} className={cn(
                                            'py-2.5 text-center text-[11px] font-bold uppercase tracking-widest',
                                            (i === 0 || i === 6) ? 'text-rose-400' : 'text-slate-400'
                                        )}>
                                            {d}
                                        </div>
                                    ))}
                                </div>

                                {/* Grid */}
                                <div
                                    className="grid grid-cols-7 flex-1 min-h-0 overflow-y-auto"
                                    style={{ gridTemplateRows: `repeat(${Math.ceil(daysInMonth.length / 7)}, minmax(80px, 1fr))` }}
                                >
                                    {daysInMonth.map(day => {
                                        const dayEvs = getEventsForDay(day);
                                        const isWeekend = getDay(day) === 0 || getDay(day) === 6;
                                        const today = isToday(day);
                                        const currentMonth = day.getMonth() === currentDate.getMonth();

                                        return (
                                            <div
                                                key={day.toISOString()}
                                                className={cn(
                                                    'border-r border-b border-slate-100 p-2 flex flex-col gap-1 cursor-pointer transition-colors',
                                                    today && 'bg-amber-50/60',
                                                    !currentMonth && 'bg-slate-50/80',
                                                    currentMonth && isWeekend && 'bg-rose-50/20',
                                                    'hover:bg-slate-50'
                                                )}
                                                onClick={() => handleSlotClick(day)}
                                            >
                                                <span className={cn(
                                                    'text-sm font-bold self-start w-6 h-6 flex items-center justify-center rounded-full leading-none',
                                                    today ? 'bg-bee-amber text-bee-midnight' : '',
                                                    !today && isWeekend && currentMonth && 'text-rose-400',
                                                    !today && !isWeekend && currentMonth && 'text-slate-700',
                                                    !currentMonth && 'text-slate-300',
                                                )}>
                                                    {format(day, 'd')}
                                                </span>

                                                <div className="flex flex-col gap-0.5 overflow-hidden">
                                                    {dayEvs.slice(0, 3).map(ev => (
                                                        <MonthChip key={ev.id} event={ev} onClick={() => handleEventClick(ev)} />
                                                    ))}
                                                    {dayEvs.length > 3 && (
                                                        <span className="text-[10px] text-slate-400 font-semibold pl-1">
                                                            +{dayEvs.length - 3} mais
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ══ WEEK VIEW (desktop) ═════════════════════════════ */}
                        {view === 'week' && !isMobile && (
                            <div className="flex flex-col h-full">
                                {/* Day headers (fixed) */}
                                <div className="flex shrink-0 border-b border-slate-100 bg-white">
                                    <div className="w-12 shrink-0" />
                                    <div className="grid flex-1 min-w-0" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
                                        {daysInWeek.map(day => {
                                            const today = isToday(day);
                                            const weekend = getDay(day) === 0 || getDay(day) === 6;
                                            return (
                                                <div key={day.toISOString()} className="flex flex-col items-center py-3">
                                                    <span className={cn('text-[10px] font-bold uppercase tracking-widest', weekend ? 'text-rose-400' : 'text-slate-400')}>
                                                        {format(day, 'EEE', { locale: ptBR })}
                                                    </span>
                                                    <span className={cn(
                                                        'text-lg font-bold mt-0.5 h-8 w-8 flex items-center justify-center rounded-full',
                                                        today ? 'bg-bee-amber text-bee-midnight' : weekend ? 'text-rose-400' : 'text-slate-700'
                                                    )}>
                                                        {format(day, 'd')}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Scrollable body */}
                                <div className="flex flex-1 min-h-0 overflow-y-auto" ref={scrollRef}>
                                    {/* Time gutter */}
                                    <div className="w-12 shrink-0 border-r border-slate-100 bg-slate-50/30">
                                        {HOURS.map(h => (
                                            <div
                                                key={h}
                                                className="flex items-start justify-end pr-2 pt-1 border-b border-slate-100 text-[10px] text-slate-400 font-mono"
                                                style={{ height: HOUR_HEIGHT }}
                                            >
                                                {`${String(h).padStart(2, '0')}:00`}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Day columns */}
                                    <div className="grid flex-1 min-w-0" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
                                        {daysInWeek.map(day => {
                                            const dayEvs = getEventsForDay(day);
                                            const today = isToday(day);
                                            return (
                                                <div
                                                    key={day.toISOString()}
                                                    className={cn(
                                                        'border-r border-slate-100 relative',
                                                        today && 'bg-amber-50/30'
                                                    )}
                                                >
                                                    {/* Hour slots */}
                                                    {HOURS.map(h => (
                                                        <div
                                                            key={h}
                                                            className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors cursor-pointer"
                                                            style={{ height: HOUR_HEIGHT }}
                                                            onClick={() => handleSlotClick(setHours(day, h))}
                                                        />
                                                    ))}

                                                    {/* Events */}
                                                    {loading ? null : dayEvs.map(ev => (
                                                        <Tooltip key={ev.id}>
                                                            <TooltipTrigger asChild>
                                                                <GridCard
                                                                    event={ev}
                                                                    style={eventStyle(ev)}
                                                                    onClick={() => handleEventClick(ev)}
                                                                />
                                                            </TooltipTrigger>
                                                            <TooltipContent side="right" className="max-w-52 text-xs">
                                                                <p className="font-bold">{ev.title}</p>
                                                                <p className="text-slate-400">{ev.time} · {ev.durationMin}min</p>
                                                                {ev.instructor && <p>Instrutor: {ev.instructor}</p>}
                                                                {ev.studentName && <p>Aluno: {ev.studentName}</p>}
                                                                <p>{statusConfig(ev.status).label}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {loading && <CalendarSkeleton />}
                            </div>
                        )}

                        {/* ══ DAY VIEW (desktop only) ═════════════════════════ */}
                        {view === 'day' && (
                            <div className="flex flex-col h-full overflow-hidden">
                                {loading ? (
                                    <CalendarSkeleton />
                                ) : (
                                    <div className="flex-1 overflow-y-auto p-4 space-y-2" ref={scrollRef}>
                                        {getEventsForDay(currentDate).length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                                                <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                                                    <Clock className="h-5 w-5 text-slate-300" />
                                                </div>
                                                <p className="text-sm font-semibold">Nenhum evento neste dia</p>
                                                <p className="text-xs mt-1">Clique em + Novo Evento para criar</p>
                                            </div>
                                        ) : (
                                            getEventsForDay(currentDate).map(ev => (
                                                <ListCard key={ev.id} event={ev} onClick={() => handleEventClick(ev)} />
                                            ))
                                        )}
                                        <div className="h-8" />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ══ LIST VIEW (mobile default) ══════════════════════ */}
                        {view === 'list' && (
                            <div className="flex flex-col h-full overflow-hidden">
                                {loading ? (
                                    <CalendarSkeleton />
                                ) : (
                                    <div className="flex-1 overflow-y-auto" ref={scrollRef}>
                                        {listDays.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                                                <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                                                    <Clock className="h-5 w-5 text-slate-300" />
                                                </div>
                                                <p className="text-sm font-semibold">Nenhum evento</p>
                                                <p className="text-xs mt-1">Toque em + para criar</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-slate-100">
                                                {listDays.map(({ day, events: dayEvs }) => {
                                                    const today = isToday(day);
                                                    return (
                                                        <div key={day.toISOString()} className="px-3 pt-3 pb-2">
                                                            <p className={cn(
                                                                'text-[13px] font-bold mb-2',
                                                                today ? 'text-rose-500' : 'text-slate-700'
                                                            )}>
                                                                {capitalize(format(day, "EEEE", { locale: ptBR }))}
                                                                {' – '}
                                                                {format(day, "d 'de' MMM.", { locale: ptBR })}
                                                            </p>
                                                            {dayEvs.length === 0 ? (
                                                                <p className="text-xs text-slate-300 italic pl-1 pb-1">Sem eventos</p>
                                                            ) : (
                                                                <div className="space-y-1.5">
                                                                    {dayEvs.map(ev => (
                                                                        <ListCard key={ev.id} event={ev} onClick={() => handleEventClick(ev)} />
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        <div className="h-8" />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ══ WEEK VIEW (mobile) ══════════════════════════════ */}
                        {view === 'week' && isMobile && (
                            <div className="flex flex-col h-full">
                                {/* Day headers + numbers */}
                                <div className="grid grid-cols-7 border-b border-slate-100 bg-white shrink-0">
                                    {daysInWeek.map((day, i) => {
                                        const today = isToday(day);
                                        const weekend = i === 0 || i === 6;
                                        return (
                                            <div key={day.toISOString()} className="flex flex-col items-center py-2 gap-0.5">
                                                <span className={cn(
                                                    'text-[10px] font-bold uppercase tracking-wider',
                                                    weekend ? 'text-rose-400' : 'text-slate-400'
                                                )}>
                                                    {WEEK_DAYS[i].charAt(0)}
                                                </span>
                                                <span className={cn(
                                                    'text-sm font-bold h-7 w-7 flex items-center justify-center rounded-full',
                                                    today ? 'bg-bee-amber text-bee-midnight' : weekend ? 'text-rose-400' : 'text-slate-700'
                                                )}>
                                                    {format(day, 'd')}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Event chips per day column */}
                                {loading ? <CalendarSkeleton /> : (
                                    <div className="grid grid-cols-7 flex-1 min-h-0 overflow-y-auto px-1 pt-1 pb-3 gap-0.5">
                                        {daysInWeek.map(day => {
                                            const dayEvs = getEventsForDay(day);
                                            return (
                                                <div
                                                    key={day.toISOString()}
                                                    className="flex flex-col gap-1 cursor-pointer rounded-md hover:bg-slate-50/80 p-0.5"
                                                    onClick={() => handleSlotClick(day)}
                                                >
                                                    {dayEvs.map(ev => (
                                                        <button
                                                            key={ev.id}
                                                            onClick={e => { e.stopPropagation(); handleEventClick(ev); }}
                                                            className="text-left rounded-md px-1 py-0.5 transition-all active:scale-95"
                                                            style={{
                                                                backgroundColor: `${ev.color}22`,
                                                                borderLeft: `2px solid ${ev.color}`,
                                                            }}
                                                        >
                                                            <div className="text-[9px] font-bold leading-tight truncate" style={{ color: ev.color }}>
                                                                {ev.title}
                                                            </div>
                                                            <div className="text-[9px] font-mono leading-tight opacity-80" style={{ color: ev.color }}>
                                                                {ev.time}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ══ MONTH VIEW (mobile, iOS-style bars) ═════════════ */}
                        {view === 'month' && isMobile && (
                            <div className="flex flex-col h-full">
                                {/* Day names header */}
                                <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50 shrink-0">
                                    {WEEK_DAYS.map((d, i) => (
                                        <div key={d} className={cn(
                                            'py-1.5 text-center text-[10px] font-bold uppercase tracking-widest',
                                            (i === 0 || i === 6) ? 'text-rose-400' : 'text-slate-400'
                                        )}>
                                            {d.charAt(0)}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar grid: number + colored bars only */}
                                <div
                                    className="grid grid-cols-7 flex-1 min-h-0 overflow-y-auto"
                                    style={{ gridTemplateRows: `repeat(${Math.ceil(daysInMonth.length / 7)}, minmax(56px, 1fr))` }}
                                >
                                    {daysInMonth.map(day => {
                                        const dayEvs = getEventsForDay(day);
                                        const isWeekend = getDay(day) === 0 || getDay(day) === 6;
                                        const today = isToday(day);
                                        const currentMonth = day.getMonth() === currentDate.getMonth();

                                        return (
                                            <button
                                                key={day.toISOString()}
                                                onClick={() => { setCurrentDate(day); setView('list'); }}
                                                className={cn(
                                                    'flex flex-col items-center pt-1.5 pb-1 gap-1 border-b border-slate-100/70',
                                                    !currentMonth && 'opacity-40'
                                                )}
                                            >
                                                <span className={cn(
                                                    'text-sm font-semibold h-6 w-6 flex items-center justify-center rounded-full leading-none',
                                                    today ? 'bg-rose-500 text-white' : '',
                                                    !today && isWeekend && currentMonth && 'text-rose-400',
                                                    !today && !isWeekend && currentMonth && 'text-slate-700',
                                                    !currentMonth && 'text-slate-400',
                                                )}>
                                                    {format(day, 'd')}
                                                </span>
                                                <div className="flex flex-col items-stretch w-full gap-0.5 px-1.5">
                                                    {dayEvs.slice(0, 3).map(ev => (
                                                        <div
                                                            key={ev.id}
                                                            className="h-[3px] rounded-full"
                                                            style={{ backgroundColor: ev.color }}
                                                        />
                                                    ))}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Modals ────────────────────────────────────────────────────── */}
            <NewEventSelectionDialog
                open={selectionOpen}
                onOpenChange={setSelectionOpen}
                onSelect={type => {
                    setSelectionOpen(false);
                    if (type === 'class') setClassModalOpen(true);
                    else { setWorkoutToEdit(null); setWorkoutModalOpen(true); }
                }}
            />

            <ClassModal
                open={classModalOpen}
                onOpenChange={setClassModalOpen}
                onSuccess={fetchEvents}
                initialDate={selectedDateForNew}
                initialTime={selectedDateForNew ? format(selectedDateForNew, 'HH:mm') : undefined}
            />

            <WorkoutModal
                open={workoutModalOpen}
                onOpenChange={open => { setWorkoutModalOpen(open); if (!open) setWorkoutToEdit(null); }}
                onSuccess={fetchEvents}
                workoutToEdit={workoutToEdit}
                initialDate={selectedDateForNew}
                initialTime={selectedDateForNew ? format(selectedDateForNew, 'HH:mm') : undefined}
            />

            <EventDetailsModal
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
                event={selectedEvent?.rawEvent}
                onSuccess={fetchEvents}
                onEdit={handleEditEvent}
            />
        </TooltipProvider>
    );
}
