'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarClock, Dumbbell, Users, Loader2, CalendarX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface UpcomingActivity {
    id: string;
    title: string;
    type: 'workout' | 'class';
    scheduled_at: string;
    end_time?: string | null;
    status: string;
    instructor?: string | null;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    Agendado:    { label: 'Agendado',     color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
    'Em Execução': { label: 'Em andamento', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
    Confirmado:  { label: 'Confirmado',   color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    Pendente:    { label: 'Pendente',     color: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
};

function statusBadge(status: string) {
    const s = STATUS_MAP[status] ?? { label: status, color: 'bg-slate-500/15 text-slate-400 border-slate-500/30' };
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${s.color}`}>
            {s.label}
        </span>
    );
}

export function StudentUpcomingActivities({ studentId }: { studentId: string }) {
    const supabase = createClient();
    const [activities, setActivities] = useState<UpcomingActivity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!studentId) return;
        fetchActivities();
    }, [studentId]);

    async function fetchActivities() {
        setLoading(true);
        try {
            const now = new Date().toISOString();

            // 1. Future / today workouts (personal sessions)
            const { data: workouts } = await (supabase as any)
                .from('workouts')
                .select('id, title, type, scheduled_at, end_time, status')
                .eq('student_id', studentId)
                .in('status', ['Agendado', 'Em Execução'])
                .gte('scheduled_at', now.split('T')[0]) // date part only — covers today
                .order('scheduled_at', { ascending: true })
                .limit(20);

            const workoutItems: UpcomingActivity[] = (workouts || []).map((w: any) => ({
                id: w.id,
                title: w.title || w.type || 'Treino',
                type: 'workout' as const,
                scheduled_at: w.scheduled_at,
                end_time: w.end_time,
                status: w.status,
                instructor: null,
            }));

            // 2. Future / today class enrollments via event_enrollments → calendar_events
            const { data: enrollments } = await (supabase as any)
                .from('event_enrollments')
                .select('id, status, calendar_events(id, title, start_datetime, end_datetime, instructor_name, status)')
                .eq('student_id', studentId)
                .gte('calendar_events.start_datetime', now.split('T')[0])
                .not('calendar_events', 'is', null);

            const classItems: UpcomingActivity[] = (enrollments || [])
                .filter((e: any) => e.calendar_events && !isPast(parseISO(e.calendar_events.start_datetime)))
                .map((e: any) => ({
                    id: e.id,
                    title: e.calendar_events.title,
                    type: 'class' as const,
                    scheduled_at: e.calendar_events.start_datetime,
                    end_time: e.calendar_events.end_datetime,
                    status: e.status || e.calendar_events.status || 'Agendado',
                    instructor: e.calendar_events.instructor_name,
                }));

            // 3. Merge + sort chronologically
            const merged = [...workoutItems, ...classItems].sort(
                (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
            );

            setActivities(merged);
        } catch (err) {
            console.error('Error fetching upcoming activities:', err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/20">
                    <CalendarClock className="h-4 w-4 text-orange-400" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-white">Próximas Atividades</h3>
                    <p className="text-[11px] text-slate-400">Treinos e aulas agendados</p>
                </div>
                {!loading && activities.length > 0 && (
                    <span className="ml-auto rounded-full bg-orange-500/20 px-2.5 py-0.5 text-[11px] font-bold text-orange-400">
                        {activities.length}
                    </span>
                )}
            </div>

            {/* Body */}
            {loading ? (
                <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-orange-400" />
                </div>
            ) : activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-500">
                    <CalendarX className="h-7 w-7" />
                    <p className="text-sm">Nenhuma atividade agendada</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tipo</th>
                                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Atividade</th>
                                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Data</th>
                                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Horário</th>
                                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Instrutor</th>
                                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activities.map((act, i) => {
                                const date = parseISO(act.scheduled_at);
                                const todayHighlight = isToday(date);

                                return (
                                    <tr
                                        key={act.id}
                                        className={`border-b border-white/5 transition-colors hover:bg-white/5 ${todayHighlight ? 'bg-orange-500/5' : ''}`}
                                    >
                                        {/* Type pill */}
                                        <td className="px-5 py-3">
                                            <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold ${act.type === 'workout' ? 'bg-purple-500/15 text-purple-400' : 'bg-cyan-500/15 text-cyan-400'}`}>
                                                {act.type === 'workout'
                                                    ? <Dumbbell className="h-3 w-3" />
                                                    : <Users className="h-3 w-3" />}
                                                {act.type === 'workout' ? 'Treino' : 'Aula'}
                                            </span>
                                        </td>

                                        {/* Title */}
                                        <td className="px-5 py-3">
                                            <span className="font-medium text-white">{act.title}</span>
                                            {todayHighlight && (
                                                <span className="ml-2 rounded-full bg-orange-500/20 px-2 py-0.5 text-[10px] font-bold text-orange-400">HOJE</span>
                                            )}
                                        </td>

                                        {/* Date */}
                                        <td className="px-5 py-3 text-slate-300">
                                            {format(date, "dd 'de' MMM, EEE", { locale: ptBR })}
                                        </td>

                                        {/* Time */}
                                        <td className="px-5 py-3 text-slate-300 tabular-nums">
                                            {format(date, 'HH:mm')}
                                            {act.end_time && (
                                                <span className="text-slate-500"> – {format(parseISO(act.end_time), 'HH:mm')}</span>
                                            )}
                                        </td>

                                        {/* Instructor */}
                                        <td className="px-5 py-3 text-slate-400">
                                            {act.instructor || <span className="text-slate-600">—</span>}
                                        </td>

                                        {/* Status */}
                                        <td className="px-5 py-3">
                                            {statusBadge(act.status)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
