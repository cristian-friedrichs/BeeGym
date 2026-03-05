'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Dumbbell, Flame, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { EventDetailsModal } from '@/components/painel/modals/event-details-modal';

interface Activity {
    id: string;
    type: 'workout' | 'class';
    title: string;
    time: string;
    person: string;
    capacity: string;
    status: string;
    raw: any; // Armazena o objeto original para o modal
}

export function UpcomingActivities() {
    const supabase = createClient();
    const { toast } = useToast();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchActivities = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Definir o intervalo do dia atual (00:00:00 até 23:59:59)
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);

            // 1. Busca TODOS os Treinos do dia (sem filtro de status)
            const { data: workouts, error: wError } = await supabase
                .from('workouts')
                .select(`
                    id, 
                    title, 
                    scheduled_at, 
                    status, 
                    notes,
                    goal,
                    students (
                        id,
                        full_name,
                        avatar_url
                    )
                `)
                .gte('scheduled_at', todayStart.toISOString())
                .lte('scheduled_at', todayEnd.toISOString())
                .order('scheduled_at', { ascending: true });

            if (wError) console.error("Erro Treinos:", wError);

            // 2. Busca TODAS as Aulas do dia (calendar_events com type = 'CLASS')
            const { data: classes, error: cError } = await supabase
                .from('calendar_events')
                .select(`
                    id, 
                    title, 
                    start_datetime, 
                    end_datetime,
                    status, 
                    type,
                    capacity,
                    instructor:instructors(name), 
                    enrollments:event_enrollments(count),
                    template:class_template_id(icon, color, title)
                `)
                .eq('type', 'CLASS')
                .gte('start_datetime', todayStart.toISOString())
                .lte('start_datetime', todayEnd.toISOString())
                .order('start_datetime', { ascending: true });

            if (cError) {
                console.error("Erro Aulas:", cError);
                toast({ title: "Erro ao buscar Aulas", description: cError.message, variant: "destructive" });
            }

            const combined: Activity[] = [];

            if (workouts) {
                workouts.forEach((w: any) => {
                    combined.push({
                        id: w.id,
                        type: 'workout',
                        title: w.title,
                        time: w.scheduled_at,
                        person: w.students?.full_name || 'Sem Aluno',
                        capacity: '1/1',
                        status: w.status,
                        raw: {
                            ...w,
                            student_name: w.students?.full_name,
                            student: w.students,
                            type: 'TRAINING' // Para o modal tratar como treino
                        }
                    });
                });
            }

            if (classes) {
                classes.forEach((c: any) => {
                    const instructorName = c.instructor?.name || 'Sem Instrutor';
                    const enrollmentsCount = c.enrollments && c.enrollments[0] ? c.enrollments[0].count : 0;

                    combined.push({
                        id: c.id,
                        type: 'class',
                        title: c.title,
                        time: c.start_datetime,
                        person: instructorName,
                        capacity: `${enrollmentsCount}/${c.capacity || 10}`,
                        status: c.status,
                        raw: {
                            ...c,
                            instructor: c.instructor?.name,
                            eventType: 'CLASS'
                        }
                    });
                });
            }

            // Ordena por horário crescente
            combined.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

            // Sem slice limitador, mostra todas as atividades do dia
            setActivities(combined);
        } catch (error) {
            console.error('Erro fatal ao buscar atividades:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();

        const channel = supabase.channel('activities_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'workouts' }, fetchActivities)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' }, fetchActivities)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    // Cores dinâmicas para todos os tipos de status
    const getStatusBadge = (status: string) => {
        const s = status.toUpperCase();
        switch (s) {
            case 'EM EXECUÇÃO':
            case 'EM_EXECUCAO':
            case 'IN_PROGRESS':
            case 'AO VIVO':
                return <Badge className="bg-green-50 text-green-700 hover:bg-green-50 border-none px-2.5 py-1 rounded-lg font-bold text-[11px] uppercase tracking-wider text-center">Em Execução</Badge>;
            case 'AGENDADO':
            case 'AGENDADA':
            case 'SCHEDULED':
            case 'EM BREVE':
                return <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 border-none px-2.5 py-1 rounded-lg font-bold text-[11px] uppercase tracking-wider text-center">Agendado</Badge>;
            case 'CONCLUIDO':
            case 'FINALIZADO':
            case 'REALIZADO':
            case 'REALIZADA':
            case 'COMPLETED':
                return <Badge className="bg-slate-50 text-slate-400 hover:bg-slate-50 border-none px-2.5 py-1 rounded-lg font-bold text-[11px] uppercase tracking-wider text-center">Realizado</Badge>;
            case 'PENDENTE':
            case 'PENDENTE DE AÇÃO':
                return <Badge className="bg-orange-50 text-orange-600 hover:bg-amber-50 border-none px-2.5 py-1 rounded-lg font-bold text-[11px] uppercase tracking-wider text-center">Pendente</Badge>;
            case 'CANCELADO':
            case 'CANCELADA':
            case 'CANCELLED':
                return <Badge className="bg-red-50 text-red-600 hover:bg-red-50 border-none px-2.5 py-1 rounded-lg font-bold text-[11px] uppercase tracking-wider text-center">Cancelado</Badge>;
            case 'FALTOU':
            case 'MISSED':
            case 'FALTA':
                return <Badge className="bg-slate-900 text-white hover:bg-slate-900 border-none px-2.5 py-1 rounded-lg font-bold text-[11px] uppercase tracking-wider text-center">Faltou</Badge>;
            default:
                return <Badge variant="outline" className="px-2.5 py-1 rounded-lg font-bold text-[11px] uppercase tracking-wider text-center">{status}</Badge>;
        }
    };

    if (loading) {
        return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>;
    }

    if (activities.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 text-slate-300">
                    <Flame className="h-6 w-6" />
                </div>
                <p className="text-slate-500 font-medium">Sem Atividades</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="grid grid-cols-12 px-3 mb-4">
                <div className="col-span-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Horário</div>
                <div className="col-span-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Nome da Aula</div>
                <div className="col-span-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Treinador</div>
                <div className="col-span-1 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Capacidade</div>
                <div className="col-span-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Status</div>
            </div>

            <div className="space-y-1 overflow-y-auto max-h-[500px] pr-1 custom-scrollbar">
                {activities.map((act) => (
                    <button
                        key={act.id}
                        onClick={() => {
                            setSelectedEvent(act.raw);
                            setIsModalOpen(true);
                        }}
                        className="w-full text-left grid grid-cols-12 items-center p-3 hover:bg-slate-50 rounded-2xl transition-all duration-200 group border border-transparent hover:border-slate-100"
                    >
                        {/* Horário */}
                        <div className="col-span-2">
                            <span className="text-sm font-bold text-slate-700">{format(new Date(act.time), 'HH:mm')}</span>
                        </div>

                        {/* Nome da Aula */}
                        <div className="col-span-4 flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${act.type === 'workout' ? 'bg-orange-50 text-orange-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                {act.type === 'workout' ? <Dumbbell className="h-5 w-5" /> : <Flame className="h-5 w-5" />}
                            </div>
                            <span className="text-sm font-bold text-slate-800 leading-tight">{act.title}</span>
                        </div>

                        {/* Treinador */}
                        <div className="col-span-3 text-center">
                            <span className="text-sm font-medium text-slate-500">{act.person}</span>
                        </div>

                        {/* Capacidade */}
                        <div className="col-span-1 text-center">
                            <span className="text-sm font-bold text-slate-400">{act.capacity}</span>
                        </div>

                        <div className="col-span-2 flex justify-end">
                            {getStatusBadge(act.status)}
                        </div>
                    </button>
                ))}
            </div>

            <EventDetailsModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                event={selectedEvent}
                onSuccess={fetchActivities}
            />
        </div>
    );
}
