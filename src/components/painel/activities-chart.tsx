'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useRouter } from 'next/navigation';

type ChartData = {
    day: string;
    date: Date;
    total: number;
    resolved: number;
    agendadas: number;
    // Keep individual for tooltip
    realizadas: number;
    faltas: number;
    details: {
        workouts: {
            total: number;
            realizados: number;
            agendados: number;
            faltas: number;
        };
        classes: {
            total: number;
            realizadas: number;
            agendadas: number;
            faltas: number;
        };
    };
};

export function ActivitiesChart() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [data, setData] = useState<ChartData[]>([]);
    const [period, setPeriod] = useState<'week' | 'month'>('week');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setMounted(true);
    }, []);
    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const now = new Date();
            let start: Date, end: Date;

            if (period === 'week') {
                start = startOfWeek(now, { weekStartsOn: 1 }); // Monday
                end = endOfWeek(now, { weekStartsOn: 1 });
            } else {
                start = startOfMonth(now);
                end = endOfMonth(now);
            }

            // 1. Fetch Workouts
            const { data: workouts } = await supabase
                .from('workouts' as any)
                .select('id, status, scheduled_at')
                .gte('scheduled_at', start.toISOString())
                .lte('scheduled_at', end.toISOString());

            // 2. Fetch Classes/Events
            const { data: events } = await supabase
                .from('calendar_events' as any)
                .select('id, status, start_datetime, type')
                .gte('start_datetime', start.toISOString())
                .lte('start_datetime', end.toISOString());

            // 3. Aggregate
            const days = eachDayOfInterval({ start, end });

            const isRealizada = (status: string) =>
                ['REALIZADA', 'EM_EXECUCAO', 'Realizada', 'Em Execução', 'COMPLETED', 'IN_PROGRESS', 'Concluido', 'Finalizado', 'Realizada'].includes(status);

            const isFalta = (status: string) =>
                ['FALTA', 'Faltou', 'MISSED'].includes(status);

            const chartData: ChartData[] = days.map((day) => {
                const dayWorkouts = (workouts || []).filter((w: any) => isSameDay(new Date(w.scheduled_at), day));
                const dayEvents = (events || []).filter((e: any) => isSameDay(new Date(e.start_datetime), day));

                const workoutStats = {
                    total: dayWorkouts.length,
                    realizados: dayWorkouts.filter((w: any) => isRealizada(w.status)).length,
                    faltas: dayWorkouts.filter((w: any) => isFalta(w.status)).length,
                    agendados: 0
                };
                workoutStats.agendados = workoutStats.total - workoutStats.realizados - workoutStats.faltas;

                const classStats = {
                    total: dayEvents.length,
                    realizadas: dayEvents.filter((e: any) => isRealizada(e.status)).length,
                    faltas: dayEvents.filter((e: any) => isFalta(e.status)).length,
                    agendadas: 0
                };
                classStats.agendadas = classStats.total - classStats.realizadas - classStats.faltas;

                const totalRealizadas = workoutStats.realizados + classStats.realizadas;
                const totalFaltas = workoutStats.faltas + classStats.faltas;

                return {
                    day: format(day, period === 'week' ? 'EEE' : 'dd', { locale: ptBR }),
                    date: day,
                    total: workoutStats.total + classStats.total,
                    resolved: totalRealizadas + totalFaltas,
                    agendadas: workoutStats.agendados + classStats.agendadas,
                    realizadas: totalRealizadas,
                    faltas: totalFaltas,
                    details: {
                        workouts: workoutStats,
                        classes: classStats
                    }
                };
            });

            setData(chartData);
            setLoading(false);
        };

        fetchData();
    }, [period]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload as ChartData;
            return (
                <div className="bg-slate-800 text-white text-xs rounded-xl p-4 shadow-2xl border border-slate-700 min-w-[200px]">
                    <p className="font-bold text-sm mb-3 capitalize text-orange-400">{format(data.date, "dd 'de' MMMM", { locale: ptBR })}</p>

                    <div className="space-y-3">
                        {/* Summary */}
                        <div className="flex justify-between items-end border-b border-slate-700 pb-2 mb-2">
                            <span className="text-slate-400">Total:</span>
                            <span className="text-xl font-bold">{data.total} atividades</span>
                        </div>

                        {/* Type Breakdown */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Por Tipo</p>
                                <div className="space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-slate-300">Treinos:</span>
                                        <span className="font-medium">{data.details.workouts.total}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-300">Aulas:</span>
                                        <span className="font-medium">{data.details.classes.total}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Por Status</p>
                                <div className="space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-green-400">Realizadas:</span>
                                        <span className="font-medium">{data.realizadas}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-blue-400">Agendadas:</span>
                                        <span className="font-medium">{data.agendadas}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-red-400">Faltas:</span>
                                        <span className="font-medium">{data.faltas}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (!mounted) {
        return (
            <div className="h-full w-full flex flex-col p-6 animate-pulse">
                <div className="h-8 bg-slate-100 rounded w-1/4 mb-6"></div>
                <div className="flex-1 bg-slate-50 rounded-lg"></div>
            </div>
        );
    }

    if (loading) return <div className="h-[250px] w-full flex items-center justify-center text-muted-foreground">Carregando gráfico...</div>;

    const handleCellClick = (data: ChartData) => {
        const dateStr = format(data.date, 'yyyy-MM-dd');
        router.push(`/agenda?date=${dateStr}&view=day`);
    };

    return (
        <div className="w-full h-full flex flex-col">
            <div className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-[#FFBF00] rounded-full" />
                    <h3 className="text-base font-bold text-[#0B0F1A] font-display">Atividades Diárias</h3>
                </div>
                <div className="relative">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value as 'week' | 'month')}
                        className="appearance-none bg-transparent border-none py-0 pl-3 pr-8 text-[11px] font-bold uppercase tracking-widest text-slate-500 cursor-pointer hover:text-orange-600 focus:ring-0 transition-all text-right"
                    >
                        <option value="week">Esta Semana</option>
                        <option value="month">Este Mês</option>
                    </select>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                    </div>
                </div>
            </div>

            <div className="p-6 flex-1 min-h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={(props) => {
                                const { x, y, payload } = props;
                                const date = new Date(payload.value);
                                const isToday = isSameDay(date, new Date());
                                const label = isToday ? 'Hoje' : format(date, period === 'week' ? 'EEE' : 'dd', { locale: ptBR });

                                return (
                                    <text
                                        x={x}
                                        y={y + 20}
                                        fill={isToday ? '#FFBF00' : '#94a3b8'}
                                        textAnchor="middle"
                                        className={`text-[11px] font-bold ${isToday ? '' : 'capitalize'}`}
                                    >
                                        {label}
                                    </text>
                                );
                            }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 'bold' }}
                            allowDecimals={false}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: '#f8fafc', radius: 12 }}
                            wrapperStyle={{ outline: 'none' }}
                        />
                        <Bar
                            dataKey="total"
                            fill="#cbd5e1"
                            radius={[8, 8, 8, 8]}
                            onClick={(d) => handleCellClick(d)}
                            style={{ cursor: 'pointer' }}
                        >
                            {data.map((entry, index) => {
                                const isToday = isSameDay(entry.date, new Date());
                                return (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={isToday ? '#FFBF00' : '#e2e8f0'}
                                        width={period === 'week' ? 44 : 20}
                                    />
                                );
                            })}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
