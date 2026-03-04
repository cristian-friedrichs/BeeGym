'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Clock, MapPin, Radio } from 'lucide-react';
import { getClassType } from '@/lib/class-definitions';

interface ActiveSession {
    id: string;
    title: string;
    type: 'class' | 'workout';
    instructor_name?: string;
    student_name?: string;
    start_time: string;
    location?: string;
    attendees_count?: number;
    capacity?: number;
    /** Value used to resolve icon/color from CLASS_TYPES (template icon name or title) */
    class_type_value?: string;
}

export function ActiveSessionBanner() {
    const supabase = createClient();
    const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
    const [now, setNow] = useState(new Date());

    // Tick every second for the real-time elapsed timer
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const fetchActiveSessions = async () => {
            const nowIso = new Date().toISOString();
            const sessions: ActiveSession[] = [];

            // Trigger status transitions before fetching to ensure fresh data
            await supabase.rpc('update_class_statuses' as any);
            await supabase.rpc('auto_update_session_statuses' as any);

            // --- 1. Live calendar events: use IN_PROGRESS status (set by RPC) ---
            const { data: liveClasses } = await supabase
                .from('calendar_events' as any)
                .select(`
                    id, title, start_datetime, end_datetime, capacity, instructor_name, type,
                    instructor:instructor_id ( name ),
                    room:room_id ( name ),
                    template:class_template_id ( icon, color, title ),
                    unit:organization_id ( name ),
                    enrollments:event_enrollments ( count )
                `)
                .eq('status', 'IN_PROGRESS');


            if (liveClasses) {
                liveClasses.forEach((c: any) => {
                    const locationName = c.room?.name || c.unit?.name || undefined;
                    // Resolve instructor name with fallback to relation
                    const resolvedInstructor = c.instructor?.name || c.instructor_name;

                    sessions.push({
                        id: c.id,
                        title: c.title,
                        type: 'class',
                        instructor_name: resolvedInstructor,
                        start_time: c.start_datetime,
                        location: locationName,
                        attendees_count: c.enrollments?.[0]?.count ?? 0,
                        capacity: c.capacity ?? undefined,
                        // Priority: 1. Direct Type (from creation) -> 2. Template -> 3. Title guess
                        class_type_value: c.type || c.template?.icon || c.template?.title || c.title,
                    });
                });
            }

            // --- 2. Workouts with explicit "Em Execução" status ---
            const { data: liveWorkouts } = await supabase
                .from('workouts' as any)
                .select(`
                    id, title, scheduled_at,
                    student:student_id ( full_name ),
                    unit:organization_id ( name )
                `)
                .eq('status', 'Em Execução');

            if (liveWorkouts) {
                liveWorkouts.forEach((w: any) => {
                    const unitName = (w.unit as any)?.name;
                    sessions.push({
                        id: w.id,
                        title: w.title,
                        type: 'workout',
                        student_name: (w.student as any)?.full_name ?? 'Aluno',
                        start_time: w.scheduled_at,
                        location: unitName ? `Personal · ${unitName}` : undefined,
                        class_type_value: 'musculacao', // Workouts use the Musculação standard (Dumbbell + Amber)
                    });
                });
            }

            setActiveSessions(sessions);
        };

        fetchActiveSessions();

        // Realtime subscriptions for instant updates
        const channel = supabase.channel('live_sessions_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'workouts' }, fetchActiveSessions)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' }, fetchActiveSessions)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const getElapsedTime = (startTime: string) => {
        const diff = Math.max(0, now.getTime() - new Date(startTime).getTime());
        const h = Math.floor(diff / 3_600_000);
        const m = Math.floor((diff % 3_600_000) / 60_000);
        const s = Math.floor((diff % 60_000) / 1000);
        if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    if (activeSessions.length === 0) return null;

    return (
        <div className="space-y-3 mb-6">
            {activeSessions.map((session) => {
                const isClass = session.type === 'class';

                // ✅ Resolve icon & color from the official CLASS_TYPES registry
                const classTypeDef = getClassType(session.class_type_value ?? null, session.title);
                const IconComponent = classTypeDef.icon;
                const color = classTypeDef.color;

                return (
                    <div
                        key={session.id}
                        className="relative bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6"
                        style={{ borderColor: `${color}40` }}
                    >
                        {/* Animated left accent bar */}
                        <div
                            className="absolute left-0 top-0 bottom-0 w-1.5 rounded-r-full"
                            style={{ backgroundColor: color }}
                        />

                        {/* Left: Icon + Info */}
                        <div className="flex items-center gap-5 z-10 pl-2">
                            {/* Icon resolved from CLASS_TYPES */}
                            <div
                                className="h-16 w-16 rounded-2xl flex items-center justify-center shrink-0"
                                style={{ backgroundColor: `${color}18`, color }}
                            >
                                <IconComponent className="h-7 w-7" />
                            </div>

                            <div className="space-y-1.5">
                                {/* Badge row */}
                                <div className="flex items-center gap-3 flex-wrap">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[11px] font-bold uppercase tracking-wider">
                                        <Radio className="h-2.5 w-2.5 animate-pulse" />
                                        Ao Vivo Agora
                                    </span>
                                    {session.location && (
                                        <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                                            <MapPin className="h-3 w-3" />
                                            {session.location}
                                        </span>
                                    )}
                                </div>

                                {/* Title */}
                                <h2 className="text-xl font-bold text-slate-800 tracking-tight leading-none">
                                    {session.title}
                                </h2>

                                {/* Subtitle — name only, no label prefix */}
                                <p className="text-sm text-slate-500 font-medium">
                                    {isClass
                                        ? (session.instructor_name || 'Sem instrutor definido')
                                        : `Aluno(a): ${session.student_name}`}
                                </p>
                            </div>
                        </div>

                        {/* Right: Stats */}
                        <div className="flex items-center gap-8 md:gap-10 w-full md:w-auto z-10 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 pl-2 md:pl-0">
                            {/* Attendance (classes only) */}
                            {isClass && session.capacity != null && (
                                <div className="flex flex-col items-start md:items-end">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Presença</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-lg font-bold text-slate-800">
                                            {session.attendees_count}/{session.capacity}
                                        </span>
                                        <span className="text-xs font-medium text-slate-500">alunos</span>
                                    </div>
                                    <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{
                                                width: `${Math.min(100, ((session.attendees_count ?? 0) / session.capacity) * 100)}%`,
                                                backgroundColor: color
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Elapsed Timer */}
                            <div className="flex flex-col items-start md:items-end ml-auto md:ml-0">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tempo Decorrido</p>
                                <div className="flex items-center gap-2" style={{ color }}>
                                    <Clock className="h-4 w-4" />
                                    <span className="text-2xl font-bold font-mono tracking-tight tabular-nums">
                                        {getElapsedTime(session.start_time)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
