'use client';

import { useState, useMemo, useEffect, useCallback, useRef, useLayoutEffect, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Users,
    RefreshCw,
    Dumbbell,
    Calendar as CalendarIcon,
    MapPin,
    User,
} from 'lucide-react';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    getDay,
    isToday,
    addMonths,
    subMonths,
    isSameDay,
    startOfWeek,
    endOfWeek,
    subDays,
    addDays,
    setHours,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { NewTrainingModal } from '@/components/painel/modals/new-training-modal';
import { CreateRecurringClassModal } from '@/components/painel/modals/create-recurring-class-modal';
import { EventDetailsModal } from '@/components/painel/modals/event-details-modal';
import { getClassType } from '@/lib/class-definitions';

import { createClient } from '@/lib/supabase/client';
import { NewEventSelectionDialog } from '@/components/painel/modals/new-event-selection-dialog';

// ─── Constants ───────────────────────────────────────────────────────────────
const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOURS = Array.from({ length: 15 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`);
const HOUR_HEIGHT_PX = 64; // px per hour row
const DAY_START_HOUR = 7;

// Status → visual config
const STATUS_CONFIG: Record<string, { hex: string; label: string; dot: string }> = {
    SCHEDULED: { hex: '#22c55e', label: 'Agendada', dot: 'bg-green-500' },
    IN_PROGRESS: { hex: '#f97316', label: 'Em Andamento', dot: 'bg-orange-500' },
    COMPLETED: { hex: '#6b7280', label: 'Realizada', dot: 'bg-gray-500' },
    MISSED: { hex: '#000000', label: 'Faltou', dot: 'bg-black' },
    CANCELLED: { hex: '#ef4444', label: 'Cancelada', dot: 'bg-red-500' },
    PENDING: { hex: '#eab308', label: 'Pendente', dot: 'bg-yellow-500' },
    // Legacy
    'Agendado': { hex: '#22c55e', label: 'Agendada', dot: 'bg-green-500' },
    'Em Execução': { hex: '#f97316', label: 'Em Andamento', dot: 'bg-orange-500' },
    'Realizada': { hex: '#6b7280', label: 'Realizada', dot: 'bg-gray-500' },
};

const WORKOUT_COLOR = '#6366f1'; // indigo for workouts

// ─── Unified CalendarEvent ───────────────────────────────────────────────────
interface CalendarEvent {
    id: string;
    kind: 'class' | 'workout';
    title: string;
    start: Date;
    end: Date;
    date: Date;           // date-only for day matching
    time: string;         // "HH:mm"
    durationMin: number;
    color: string;
    iconName: string;
    status: string;
    instructor?: string;
    room?: string;
    address?: string;
    capacity?: number;
    enrollmentCount: number;
    studentName?: string;
    template?: any;
    rawEvent?: any;       // original DB row for modals
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

function resolveClassStyle(event: any): { color: string; iconName: string } {
    const template = event.template || {};
    // Priority: template.color → template.icon → type lookup → fallback
    const color = template.color || getClassType(template.icon || template.title || event.type || null, event.title)?.color || '#F97316';
    const iconName = template.icon || getClassType(template.icon || template.title || event.type || null, event.title)?.iconName || 'dumbbell';
    return { color, iconName };
}

// ─── Event Card Components ───────────────────────────────────────────────────
function StatusDot({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status];
    if (!cfg) return null;
    return (
        <span
            className={cn('inline-block h-1.5 w-1.5 rounded-full flex-shrink-0', cfg.dot)}
            title={cfg.label}
        />
    );
}

/** Compact chip for month view */
function MonthChip({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
    const isWorkout = event.kind === 'workout';
    return (
        <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="w-full flex items-center gap-1 px-1 py-0.5 rounded-[3px] text-left hover:brightness-95 transition-all overflow-hidden"
            style={{ borderLeft: `3px solid ${event.color}`, backgroundColor: `${event.color}14` }}
        >
            {isWorkout
                ? <Dumbbell className="h-2.5 w-2.5 flex-shrink-0" style={{ color: event.color }} />
                : <span style={{ color: event.color }}><DynamicIcon name={event.iconName} className="h-2.5 w-2.5 flex-shrink-0" /></span>
            }
            <span className="text-[11px] font-semibold truncate flex-1" style={{ color: event.color }}>
                {event.time} {event.title}
            </span>
            <StatusDot status={event.status} />
        </button>
    );
}

/** Full card for week/day view */
const TimeGridCard = forwardRef<HTMLDivElement, { event: CalendarEvent; style?: React.CSSProperties; isListView?: boolean } & React.HTMLAttributes<HTMLDivElement>>(
    ({ event, style, onClick, isListView, className, ...props }, ref) => {
        const isWorkout = event.kind === 'workout';
        const statusCfg = STATUS_CONFIG[event.status] || { hex: '#9ca3af', label: event.status || '?', dot: 'bg-gray-400' };

        if (isListView) {
            return (
                <div
                    ref={ref}
                    className={cn(
                        "flex flex-col md:flex-row md:items-center justify-between gap-4 p-4",
                        "w-full bg-white border border-slate-200 rounded-xl cursor-pointer hover:shadow-md hover:border-slate-300 transition-all duration-200 group",
                        className
                    )}
                    style={style}
                    onClick={(e) => {
                        e.stopPropagation();
                        onClick?.(e);
                    }}
                    {...props}
                >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* Icon Box Premium */}
                        <div className="h-12 w-12 flex-shrink-0 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-slate-100 transition-colors shadow-sm">
                            {isWorkout
                                ? <Dumbbell className="h-5 w-5" style={{ color: event.color }} />
                                : <span style={{ color: event.color }}><DynamicIcon name={event.iconName} className="h-5 w-5" /></span>
                            }
                        </div>

                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-sm font-bold text-slate-800 truncate group-hover:text-orange-600 transition-colors">
                                {event.title}
                            </span>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                                <span className="flex items-center gap-1 font-medium bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                                    <CalendarIcon className="h-3 w-3" />
                                    {event.time}
                                </span>
                                {event.instructor && (
                                    <span className="flex items-center gap-1 truncate">
                                        <User className="h-3 w-3" />
                                        {event.instructor}
                                    </span>
                                )}
                                {event.studentName && (
                                    <span className="flex items-center gap-1 truncate">
                                        <User className="h-3 w-3" />
                                        {event.studentName}
                                    </span>
                                )}
                                {event.room && (
                                    <span className="flex items-center gap-1 truncate">
                                        <MapPin className="h-3 w-3" />
                                        {event.room}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2 md:pt-0 md:ml-auto">
                        {!isWorkout && typeof event.capacity === 'number' && (
                            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md">
                                <Users className="h-3 w-3 text-slate-400" />
                                <span className="text-xs font-semibold text-slate-600">
                                    {event.enrollmentCount}/{event.capacity}
                                </span>
                            </div>
                        )}
                        <span
                            className="px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide border shadow-sm whitespace-nowrap"
                            style={{
                                backgroundColor: `${statusCfg.hex}15`,
                                color: statusCfg.hex,
                                borderColor: `${statusCfg.hex}30`
                            }}
                        >
                            {statusCfg.label}
                        </span>
                    </div>
                </div>
            );
        }

        // In grid view, hide for short durations.
        const showDetails = event.durationMin > 30;

        return (
            <div
                ref={ref}
                className={cn("absolute left-1 right-1 rounded-[6px] overflow-hidden cursor-pointer bg-white border border-slate-200 border-l-[4px] shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 group", className)}
                style={{
                    ...style,
                    borderLeftColor: event.color,
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    onClick?.(e);
                }}
                {...props}
            >
                {/* Subtle Background Hover Hint using the event color for brand identity without ruining contrast */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] pointer-events-none transition-opacity duration-300" style={{ backgroundColor: event.color }} />

                <div className="relative z-10 h-full p-2 flex flex-col gap-1 overflow-hidden">
                    {/* Row 1: icon + title + status dot */}
                    <div className="flex items-center gap-1.5 min-w-0">
                        {isWorkout
                            ? <Dumbbell className="h-3.5 w-3.5 flex-shrink-0" style={{ color: event.color }} />
                            : <span style={{ color: event.color }}><DynamicIcon name={event.iconName} className="h-3.5 w-3.5 flex-shrink-0" /></span>
                        }
                        <span className="text-[12px] font-bold truncate flex-1 leading-none text-slate-800 group-hover:text-slate-900 transition-colors">
                            {event.title}
                        </span>
                        <StatusDot status={event.status} />
                    </div>

                    {/* Row 2: time + room/student (hidden if very short) */}
                    {showDetails && (
                        <div className="flex items-center gap-1.5 text-[10.5px] font-medium text-slate-500 leading-none">
                            <span className="font-mono bg-slate-100/80 px-1 py-0.5 rounded text-slate-600 shadow-sm border border-slate-200/50">{event.time}</span>
                            {event.room && <><span>·</span><span className="truncate">{event.room}</span></>}
                            {isWorkout && event.studentName && <><span>·</span><span className="truncate">{event.studentName}</span></>}
                            {!isWorkout && typeof event.capacity === 'number' && (
                                <span className="ml-auto flex items-center gap-1 shrink-0 bg-slate-50 border border-slate-200 text-slate-500 shadow-sm px-1 py-0.5 rounded">
                                    <Users className="h-2.5 w-2.5" />
                                    <span>{event.enrollmentCount}/{event.capacity}</span>
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }
);
TimeGridCard.displayName = 'TimeGridCard';

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function CalendarPage() {
    const { toast } = useToast();
    const supabase = createClient();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'day' | 'week' | 'month'>('week');
    const [isClient, setIsClient] = useState(false);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(Date.now());

    const [isRecurringClassModalOpen, setIsRecurringClassModalOpen] = useState(false);
    const [isNewTrainingModalOpen, setIsNewTrainingModalOpen] = useState(false);
    const [isSelectionOpen, setIsSelectionOpen] = useState(false);
    const [selectedDateForCreation, setSelectedDateForCreation] = useState<Date | undefined>(undefined);
    const [selectedEventIdForEdit, setSelectedEventIdForEdit] = useState<string | undefined>(undefined);

    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsClient(true);
        const params = new URLSearchParams(window.location.search);
        const viewParam = params.get('view');
        if (viewParam === 'day' || viewParam === 'week' || viewParam === 'month') {
            setView(viewParam);
        }

        const dateParam = params.get('date');
        if (dateParam) {
            const d = new Date(dateParam);
            if (!isNaN(d.getTime())) {
                // Adjust for timezone offset if needed, or just use as is
                // Simple Date(string) usually works for YYYY-MM-DD
                setCurrentDate(d);
            }
        }
        // Scroll to business hours on mount
        setTimeout(() => {
            if (scrollRef.current) scrollRef.current.scrollTop = 7 * HOUR_HEIGHT_PX;
        }, 100);
    }, []);

    // ── Data Fetching ─────────────────────────────────────────────────────────
    useEffect(() => {
        const fetchAllEvents = async () => {
            setIsLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('organization_id')
                    .eq('id', user.id)
                    .single();

                if (!profile || !(profile as any).organization_id) return;
                const orgId = (profile as any).organization_id;

                // Trigger status transitions before fetching
                await supabase.rpc('update_class_statuses' as any);

                const viewStart = startOfWeek(startOfMonth(currentDate), { locale: ptBR }).toISOString();
                const viewEnd = endOfWeek(endOfMonth(currentDate), { locale: ptBR }).toISOString();

                // ── 1. Classes (calendar_events) ──────────────────────────────
                const { data: classRows, error: classErr } = await supabase
                    .from('calendar_events')
                    .select(`
                        id, title, start_datetime, end_datetime, type, status, capacity,
                        instructor_name, address,
                        room:rooms ( name ),
                        instructor:instructors ( name ),
                        template:class_template_id ( title, icon, color ),
                        enrollments:event_enrollments ( count )
                    ` as any)
                    .eq('organization_id', orgId)
                    .in('type', ['CLASS', 'TRAINING'])
                    .gte('start_datetime', viewStart)
                    .lte('start_datetime', viewEnd);

                if (classErr) console.error('Calendar events error:', classErr);

                const classEvents: CalendarEvent[] = (classRows || []).map((row: any) => {
                    const start = new Date(row.start_datetime);
                    const end = new Date(row.end_datetime);

                    const isTraining = row.type === 'TRAINING';
                    const { color: classColor, iconName: classIcon } = resolveClassStyle(row);

                    const color = isTraining ? WORKOUT_COLOR : classColor;
                    const iconName = isTraining ? 'dumbbell' : classIcon;

                    const durationMin = Math.round((end.getTime() - start.getTime()) / 60000);

                    return {
                        id: row.id,

                        kind: isTraining ? 'workout' : 'class',
                        title: row.title || row.template?.title || (isTraining ? 'Treino' : 'Aula'),
                        start,
                        end,
                        date: new Date(start.getFullYear(), start.getMonth(), start.getDate()),
                        time: format(start, 'HH:mm'),
                        durationMin,
                        color,
                        iconName,
                        status: row.status || 'SCHEDULED',
                        instructor: row.instructor?.name || row.instructor_name || undefined,
                        room: row.room?.name || undefined,
                        address: row.address || undefined,
                        capacity: row.capacity ?? undefined,
                        enrollmentCount: row.enrollments?.[0]?.count ?? 0,
                        template: row.template,
                        rawEvent: {
                            ...row,
                            color,
                            iconName,
                            template: row.template,
                            room: row.room?.name,
                            instructor: row.instructor?.name || row.instructor_name,
                            // Enrich for Modal
                            time: format(start, 'HH:mm'),
                            duration: durationMin,
                            eventType: row.type // 'CLASS' or 'TRAINING'
                        },
                    };
                });

                // ── 2. Workouts ───────────────────────────────────────────────
                const { data: workoutRows, error: workoutErr } = await (supabase as any)
                    .from('workouts')
                    .select(`
                        id, title, scheduled_at, end_time, type, status,
                        student:student_id ( full_name )
                    `)
                    .eq('organization_id', orgId)
                    .gte('scheduled_at', viewStart)
                    .lte('scheduled_at', viewEnd)
                    .not('scheduled_at', 'is', null);

                if (workoutErr) console.error('Workouts error:', workoutErr);

                const workoutEvents: CalendarEvent[] = (workoutRows || []).map((row: any) => {
                    const start = new Date(row.scheduled_at);
                    const end = row.end_time ? new Date(row.end_time) : new Date(start.getTime() + 60 * 60000); // default 1h
                    const durationMin = Math.round((end.getTime() - start.getTime()) / 60000);
                    return {
                        id: row.id,
                        kind: 'workout',
                        title: row.title || 'Treino',
                        start,
                        end,
                        date: new Date(start.getFullYear(), start.getMonth(), start.getDate()),
                        time: format(start, 'HH:mm'),
                        durationMin: Math.max(durationMin, 30),
                        color: WORKOUT_COLOR,
                        iconName: 'dumbbell',
                        status: row.status || 'Agendado',
                        enrollmentCount: 0,
                        studentName: (row.student as any)?.full_name || undefined,
                        rawEvent: {
                            ...row,
                            // Enrich for Modal
                            start_datetime: row.scheduled_at,
                            time: format(start, 'HH:mm'),
                            duration: Math.max(durationMin, 30),
                            eventType: 'WORKOUT',
                            student_name: (row.student as any)?.full_name,
                            // Default fields for modal compatibility
                            room: 'Sem local',
                            instructor: 'Não atribuído',
                            color: WORKOUT_COLOR,
                            iconName: 'dumbbell',
                        },
                    };
                });

                // ── Merge & sort ──────────────────────────────────────────────
                const all = [...classEvents, ...workoutEvents].sort(
                    (a, b) => a.start.getTime() - b.start.getTime()
                );
                setEvents(all);
            } catch (err) {
                console.error('Calendar fetch error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllEvents();
    }, [currentDate, lastUpdate]);

    // ── Navigation ────────────────────────────────────────────────────────────
    const handlePrev = () => {
        if (view === 'month') setCurrentDate(d => subMonths(d, 1));
        else if (view === 'week') setCurrentDate(d => subDays(d, 7));
        else setCurrentDate(d => subDays(d, 1));
    };

    const handleNext = () => {
        if (view === 'month') setCurrentDate(d => addMonths(d, 1));
        else if (view === 'week') setCurrentDate(d => addDays(d, 7));
        else setCurrentDate(d => addDays(d, 1));
    };

    const handleToday = () => setCurrentDate(new Date());

    const handleRefresh = () => {
        setLastUpdate(Date.now());
        toast({ title: 'Agenda atualizada' });
    };

    // ── Event helpers ─────────────────────────────────────────────────────────
    const getEventsForDay = useCallback((day: Date): CalendarEvent[] =>
        events.filter(e => isSameDay(e.date, day)).sort((a, b) => a.time.localeCompare(b.time)),
        [events]
    );

    const handleEventClick = (event: CalendarEvent) => {
        setSelectedEvent(event);
        setIsDetailsModalOpen(true);
    };

    const handleSlotClick = (date: Date) => {
        setSelectedDateForCreation(date);
        setIsSelectionOpen(true);
    };

    const handleEventSelection = (type: 'class' | 'workout') => {
        setIsSelectionOpen(false);
        if (type === 'class') {
            setIsRecurringClassModalOpen(true);
        } else {
            setIsNewTrainingModalOpen(true);
        }
    };

    const handleEditEvent = (event: any) => {
        setSelectedEventIdForEdit(event.id);
        setIsDetailsModalOpen(false);
        setIsNewTrainingModalOpen(true);
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

    const startingDayIndex = useMemo(() => getDay(startOfMonth(currentDate)), [currentDate]);

    const todayLabel = useMemo(() => {
        if (!isClient) return '';
        return capitalize(format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR }));
    }, [isClient]);

    const headerTitle = useMemo(() => {
        if (view === 'day') return capitalize(format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR }));
        if (view === 'week') {
            const ws = startOfWeek(currentDate, { locale: ptBR });
            const we = endOfWeek(currentDate, { locale: ptBR });
            if (ws.getMonth() === we.getMonth())
                return capitalize(format(ws, "MMMM yyyy", { locale: ptBR }));
            return `${capitalize(format(ws, "MMM", { locale: ptBR }))} – ${capitalize(format(we, "MMM yyyy", { locale: ptBR }))}`;
        }
        return capitalize(format(currentDate, "MMMM yyyy", { locale: ptBR }));
    }, [currentDate, view]);

    // ── Time-grid event position ──────────────────────────────────────────────
    function eventStyle(event: CalendarEvent): React.CSSProperties {
        const h = event.start.getHours();
        const m = event.start.getMinutes();
        const top = (h - DAY_START_HOUR) * HOUR_HEIGHT_PX + (m / 60) * HOUR_HEIGHT_PX;
        const height = Math.max((event.durationMin / 60) * HOUR_HEIGHT_PX - 2, 18);
        return { top: `${top}px`, height: `${height}px` };
    }


    // ── Time Grid Components ──────────────────────────────────────────────────
    const DayColHeader = ({ day }: { day: Date }) => {
        const isWeekend = getDay(day) === 0 || getDay(day) === 6;
        const todayDay = isClient && isToday(day);

        return (
            <div className={cn(
                'h-14 flex flex-col items-center justify-center bg-card/95',
            )}>
                <span className={cn('text-[11px] font-semibold uppercase tracking-wider text-muted-foreground', isWeekend && 'text-red-400')}>
                    {format(day, 'EEE', { locale: ptBR })}
                </span>
                <span className={cn(
                    'text-xl font-bold leading-none mt-0.5',
                    todayDay && 'flex items-center justify-center w-8 h-8 rounded-full bg-orange-500 text-white',
                    !todayDay && isWeekend && 'text-red-400',
                    !todayDay && !isWeekend && 'text-foreground',
                )}>
                    {format(day, 'd')}
                </span>
            </div>
        );
    };

    const TimeGridColumn = ({ day }: { day: Date }) => {
        const dayEvents = getEventsForDay(day);
        const todayDay = isClient && isToday(day);

        return (
            <div className={cn('border-r relative flex-1 min-w-0')}>
                {/* Time slots */}
                <div className="relative">
                    {HOURS.map(hour => (
                        <div
                            key={hour}
                            className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                            style={{ height: `${HOUR_HEIGHT_PX}px` }}
                            onClick={() => handleSlotClick(setHours(day, parseInt(hour)))}
                        />
                    ))}

                    {/* Events */}
                    {dayEvents.map(event => (
                        <Tooltip key={event.id}>
                            <TooltipTrigger asChild>
                                <TimeGridCard
                                    event={event}
                                    style={eventStyle(event)}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEventClick(event);
                                    }}
                                />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-[200px]">
                                <p className="font-bold">{event.title}</p>
                                {event.instructor && <p className="text-xs text-muted-foreground">Instrutor: {event.instructor}</p>}
                                {event.room && <p className="text-xs text-muted-foreground">Sala: {event.room}</p>}
                                {event.studentName && <p className="text-xs text-muted-foreground">Aluno: {event.studentName}</p>}
                                <p className="text-xs">{event.time} · {event.durationMin} min</p>
                                <p className="text-xs">{STATUS_CONFIG[event.status]?.label ?? event.status}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </div>
            </div>
        );
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <TooltipProvider>
            <div className="flex flex-col h-full gap-0">

                {/* ── Page Header ── */}
                <div className="flex items-center justify-between pb-4 shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
                        <p className="text-sm text-muted-foreground">{todayLabel}</p>
                    </div>
                    <div className="flex items-center gap-2">

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsNewTrainingModalOpen(true)}
                            className="gap-1.5"
                        >
                            <Dumbbell className="h-4 w-4" />
                            Novo Treino
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => setIsRecurringClassModalOpen(true)}
                            className="gap-1.5"
                        >
                            <Plus className="h-4 w-4" />
                            Nova Aula
                        </Button>
                    </div>
                </div>

                {/* ── Calendar Container ── */}
                <div className="flex flex-col flex-1 bg-card border rounded-xl overflow-hidden min-h-0">

                    {/* ── Calendar Toolbar ── */}
                    <div className="flex items-center justify-between px-4 py-2 border-b shrink-0">
                        {/* Left: navigation */}
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrev}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 font-medium" onClick={handleToday}>
                                Hoje
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNext}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <h2 className="text-base font-semibold ml-2 capitalize">{headerTitle}</h2>
                        </div>

                        {/* Right: view switcher + refresh */}
                        <div className="flex items-center gap-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={handleRefresh}
                                        disabled={isLoading}
                                    >
                                        <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Atualizar</TooltipContent>
                            </Tooltip>
                            <div className="flex rounded-lg border overflow-hidden">
                                {(['day', 'week', 'month'] as const).map(v => (
                                    <button
                                        key={v}
                                        onClick={() => setView(v)}
                                        className={cn(
                                            'px-3 py-1 text-sm font-medium transition-colors',
                                            view === v
                                                ? 'bg-primary text-primary-foreground'
                                                : 'hover:bg-muted text-muted-foreground'
                                        )}
                                    >
                                        {{ day: 'Dia', week: 'Semana', month: 'Mês' }[v]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Calendar Body ── */}
                    <div className="flex-1 overflow-hidden min-h-0">

                        {/* ═══ MONTH VIEW ═══ */}
                        {view === 'month' && (
                            <div className="flex flex-col h-full overflow-hidden">
                                {/* Day-of-week header */}
                                <div className="grid grid-cols-7 border-b shrink-0 bg-card">
                                    {WEEK_DAYS.map(d => (
                                        <div key={d} className="py-2 text-center text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">
                                            {d}
                                        </div>
                                    ))}
                                </div>
                                {/* Grid */}
                                <div
                                    className="grid grid-cols-7 flex-1 min-h-0 border-l border-t bg-card overflow-hidden"
                                    style={{ gridTemplateRows: `repeat(${Math.ceil(daysInMonth.length / 7)}, minmax(0, 1fr))` }}
                                >
                                    {/* Day cells */}
                                    {daysInMonth.map(day => {
                                        const dayEvents = getEventsForDay(day);
                                        const isGridWeekend = getDay(day) === 0 || getDay(day) === 6;
                                        const todayDay = isClient && isToday(day);
                                        const isCurrentMonth = isSameDay(day, startOfMonth(currentDate)) || (day > startOfMonth(currentDate) && day < endOfMonth(currentDate)) || isSameDay(day, endOfMonth(currentDate));
                                        // Simpler check: same month
                                        const isSameMonthDay = day.getMonth() === currentDate.getMonth();

                                        return (
                                            <div
                                                key={day.toString()}
                                                className={cn(
                                                    'border-r border-b p-1.5 flex flex-col gap-1 overflow-hidden cursor-pointer min-h-0',
                                                    'hover:bg-muted/30 transition-colors',
                                                    !isSameMonthDay && 'bg-muted/50 text-muted-foreground',
                                                    isSameMonthDay && isGridWeekend && 'bg-muted/10',
                                                )}
                                                onClick={() => handleSlotClick(day)}
                                            >
                                                {/* Day number */}
                                                <span className={cn(
                                                    'text-sm font-semibold self-start leading-none',
                                                    todayDay && 'flex items-center justify-center h-6 w-6 rounded-full bg-orange-500 text-white text-xs',
                                                    !todayDay && isGridWeekend && isSameMonthDay && 'text-red-400',
                                                    !todayDay && !isGridWeekend && isSameMonthDay && 'text-foreground',
                                                )}>
                                                    {format(day, 'd')}
                                                </span>
                                                {/* Events */}
                                                <div className="flex flex-col gap-0.5 overflow-hidden">
                                                    {dayEvents.slice(0, 4).map(event => (
                                                        <MonthChip
                                                            key={event.id}
                                                            event={event}
                                                            onClick={() => handleEventClick(event)}
                                                        />
                                                    ))}
                                                    {dayEvents.length > 4 && (
                                                        <span className="text-[10px] text-muted-foreground pl-1">
                                                            +{dayEvents.length - 4} mais
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ═══ WEEK VIEW ═══ */}
                        {view === 'week' && (
                            <div className="flex flex-col h-full overflow-hidden">
                                {/* Header Row (Fixed) */}
                                <div className="flex bg-card shrink-0 z-20 border-b">
                                    {/* Corner spacer - same width as time gutter */}
                                    <div className="w-14 h-14 shrink-0" />
                                    {/* Day header cells */}
                                    <div className="grid flex-1 min-w-0" style={{ gridTemplateColumns: `repeat(7, minmax(0, 1fr))` }}>
                                        {daysInWeek.map(day => (
                                            <DayColHeader key={day.toString()} day={day} />
                                        ))}
                                    </div>
                                </div>

                                {/* Body Row (Scrollable) */}
                                <div className="flex overflow-y-auto flex-1 min-h-0" ref={scrollRef}>
                                    {/* Time gutter */}
                                    <div className="w-14 shrink-0 border-r bg-card">
                                        {HOURS.map(hour => (
                                            <div
                                                key={hour}
                                                className="flex items-start justify-end pr-2 pt-1 border-b text-[11px] text-muted-foreground font-mono"
                                                style={{ height: `${HOUR_HEIGHT_PX}px` }}
                                            >
                                                {hour}
                                            </div>
                                        ))}
                                    </div>
                                    {/* Day columns - MUST match header grid exactly */}
                                    <div className="grid flex-1 min-w-0" style={{ gridTemplateColumns: `repeat(7, minmax(0, 1fr))` }}>
                                        {daysInWeek.map(day => (
                                            <TimeGridColumn key={day.toString()} day={day} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ═══ DAY VIEW (LIST) ═══ */}
                        {view === 'day' && (
                            <div className="flex flex-col h-full overflow-hidden">
                                {/* Body (Scrollable List) */}
                                <div className="flex flex-col flex-1 overflow-y-auto min-h-0 bg-background/50 p-4" ref={scrollRef}>
                                    {getEventsForDay(currentDate).length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                                            <p className="text-sm">Nenhum compromisso para hoje.</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            {getEventsForDay(currentDate).map(event => (
                                                <TimeGridCard
                                                    key={event.id}
                                                    event={event}
                                                    isListView
                                                    className="mb-2"
                                                    onClick={() => handleEventClick(event)}
                                                />
                                            ))}
                                            {/* Padding bottom */}
                                            <div className="h-10" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>


            </div>

            {/* ── Modals ── */}
            {/* ── Modals ────────────────────────────────────────────────────────── */}
            <NewEventSelectionDialog
                open={isSelectionOpen}
                onOpenChange={setIsSelectionOpen}
                onSelect={handleEventSelection}
            />

            <CreateRecurringClassModal
                open={isRecurringClassModalOpen}
                onOpenChange={setIsRecurringClassModalOpen}
                onSuccess={handleRefresh}
                initialDate={selectedDateForCreation}
                initialTime={selectedDateForCreation ? format(selectedDateForCreation, 'HH:mm') : undefined}
            />





            <NewTrainingModal
                open={isNewTrainingModalOpen}
                onOpenChange={(open) => {
                    setIsNewTrainingModalOpen(open);
                    if (!open) {
                        setSelectedEventIdForEdit(undefined);
                        // Also clear selected event so next time it defaults cleanly if needed
                        // although state updates might handle it
                    }
                }}
                onSuccess={handleRefresh}
                initialDate={selectedDateForCreation}
                initialTime={selectedDateForCreation ? format(selectedDateForCreation, 'HH:mm') : undefined}
                eventId={selectedEventIdForEdit}
                // If editing, use the kind from selectedEvent; otherwise default to 'workout' (or whatever default you prefer for new)
                // But wait,selectedEvent might be null if we just clicked "New".
                // Actually, handleEditEvent sets selectedEventIdForEdit.
                // We need to know the KIND of that event.
                // We can find it in the `events` array if we have the ID, or we can store it in state when clicking edit.
                // Let's see if I can easily get it.
                eventKind={selectedEventIdForEdit ? (events.find(e => e.id === selectedEventIdForEdit)?.kind === 'class' ? 'class' : 'workout') : 'workout'}
            />

            <EventDetailsModal
                open={isDetailsModalOpen}
                onOpenChange={setIsDetailsModalOpen}
                event={selectedEvent?.rawEvent}
                onSuccess={handleRefresh}
                onEdit={handleEditEvent}
            />
        </TooltipProvider>
    );
}
