import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
    TrendingUp, Dumbbell, Calendar, ChevronRight, ChevronDown,
    RefreshCw, Package, CalendarDays, Plus,
    CheckCircle2, XCircle, Clock, AlertCircle, CreditCard, ReceiptText
} from "lucide-react";
import { format, isAfter, isBefore, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, AreaChart, Area } from 'recharts';

interface Measurement {
    recorded_at: string;
    weight: number | null;
    body_fat: number | null;
    skinfold: number | null;
}

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
    status: string;
    paid_at?: string | null;
}

interface StudentStatsGridProps {
    measurements: Measurement[];
    workouts: Workout[];
    plan?: {
        plan_type?: string;
        days_per_week?: number | null;
        credits?: number | null;
        name?: string;
    } | null;
    creditsBalance?: number | null;
    weeklyWorkoutCount?: number;
    attendancePercentage?: number;
    onChangeView: (view: any) => void;
    onShowWorkoutDetails: (id: string) => void;
    invoices: Invoice[];
}

export function StudentStatsGrid({
    measurements,
    workouts,
    plan,
    creditsBalance,
    weeklyWorkoutCount = 0,
    attendancePercentage = 0,
    onChangeView,
    onShowWorkoutDetails,
    invoices = []
}: StudentStatsGridProps) {
    const [activeTab, setActiveTab] = useState("recent");
    const [activityView, setActivityView] = useState<'workouts' | 'invoices'>('workouts');

    // Pega a medida mais recente para comparar (se houver)
    const currentWeight = measurements[0]?.weight;
    const previousWeight = measurements[1]?.weight;

    // Simples cálculo de tendência (apenas visual)
    const trend = currentWeight && previousWeight
        ? currentWeight < previousWeight ? 'down' : 'up'
        : 'neutral';

    // Filters
    const recentWorkouts = workouts
        .filter(w => w.status === 'Concluido' || w.status === 'Faltou')
        .sort((a, b) => new Date(b.scheduled_at || b.created_at).getTime() - new Date(a.scheduled_at || a.created_at).getTime())
        .slice(0, 5);

    const upcomingWorkouts = workouts
        .filter(w => w.status === 'Agendado' || w.status === 'Em Execução')
        .sort((a, b) => new Date(a.scheduled_at || a.created_at).getTime() - new Date(b.scheduled_at || b.created_at).getTime());

    const cancelledWorkouts = workouts
        .filter(w => w.status === 'Cancelado')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const completedCount = workouts.filter(w => w.status === 'Concluido').length;

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Concluido': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
            case 'Faltou': return <XCircle className="h-4 w-4 text-red-500" />;
            case 'Cancelado': return <AlertCircle className="h-4 w-4 text-slate-400" />;
            case 'Em Execução': return <Clock className="h-4 w-4 text-bee-orange animate-pulse" />;
            default: return <Calendar className="h-4 w-4 text-bee-orange" />;
        }
    };

    const KPIBox = ({ title, value, icon: Icon, colorClass, trendLabel, trendDir }: any) => (
        <div className="bg-white rounded-[8px] p-6 shadow-sm border border-slate-100 flex items-center gap-5 hover:border-bee-orange transition-all group overflow-hidden relative">
            <div className={`h-16 w-16 rounded-[8px] ${colorClass} bg-opacity-10 text-slate-900 flex items-center justify-center shrink-0 shadow-sm border border-slate-50`}>
                <Icon className={`h-7 w-7 ${colorClass === 'bg-bee-orange' ? 'text-bee-orange' : colorClass.replace('bg-', 'text-')}`} />
            </div>
            <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none font-sans mb-1.5">{title}</span>
                <div className="flex items-baseline gap-2">
                    <h2 className="text-3xl font-bold text-deep-midnight tracking-tight leading-none font-display">{value}</h2>
                    {trendLabel && (
                        <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest font-sans ${trendDir === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {trendDir === 'up' ? '▲' : '▼'} {trendLabel}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );

    const WorkoutListItem = ({ workout }: { workout: Workout }) => (
        /* ... existing ... */
        <div
            onClick={() => onShowWorkoutDetails(workout.id)}
            className="flex items-center justify-between p-4 bg-white rounded-[8px] border shadow-sm hover:border-bee-orange transition-all cursor-pointer group"
        >
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-slate-50 rounded-[8px] flex items-center justify-center border group-hover:bg-orange-50 group-hover:border-orange-100 transition-colors">
                    {getStatusIcon(workout.status)}
                </div>
                <div>
                    <h4 className="font-bold text-base text-deep-midnight group-hover:text-bee-orange transition-colors tracking-tight font-sans">{workout.title}</h4>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground uppercase tracking-wider font-bold mt-0.5 font-sans">
                        <span className="text-blue-600">{workout.type || 'Geral'}</span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1">
                            {format(new Date(workout.scheduled_at || workout.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter font-sans ${workout.status === 'Concluido' ? 'bg-emerald-50 text-emerald-600' : workout.status === 'Faltou' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                    {workout.status}
                </span>
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-bee-orange transition-colors" />
            </div>
        </div>
    );

    const InvoiceListItem = ({ invoice }: { invoice: Invoice }) => {
        const isPaid = invoice.status === 'PAID' || invoice.status === 'Pago';
        const isOverdue = invoice.status === 'OVERDUE' || invoice.status === 'Atrasado';

        return (
            <div
                onClick={() => onChangeView('invoices')}
                className="flex items-center justify-between p-4 bg-white rounded-[8px] border shadow-sm hover:border-bee-orange transition-all cursor-pointer group"
            >
                <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-[8px] flex items-center justify-center border group-hover:border-orange-100 transition-colors shadow-sm ${isPaid ? 'bg-emerald-50 text-emerald-600' : isOverdue ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-bee-orange'}`}>
                        <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-base text-deep-midnight group-hover:text-bee-orange transition-colors tracking-tight font-sans">
                            {(invoice.amount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground uppercase tracking-wider font-bold mt-0.5 font-sans">
                            <span className={isPaid ? 'text-emerald-600' : isOverdue ? 'text-red-500' : 'text-bee-orange'}>{invoice.status}</span>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1">
                                Vencimento: {invoice.due_date ? format(new Date(invoice.due_date), "dd/MM/yyyy") : '-'}
                            </span>
                        </div>
                    </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-bee-orange transition-colors" />
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col gap-6">
            {/* TOP ROW: KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 shrink-0 animate-in fade-in slide-in-from-top-4 duration-500">
                <KPIBox
                    title="Total de Treinos"
                    value={completedCount}
                    icon={Dumbbell}
                    colorClass="bg-bee-orange"
                    trendLabel={`${completedCount > 10 ? 'Elite' : 'Ativo'}`}
                    trendDir="up"
                />
                <KPIBox
                    title="Frequência"
                    value={`${attendancePercentage}%`}
                    icon={TrendingUp}
                    colorClass="bg-emerald-500"
                    trendLabel={attendancePercentage > 80 ? 'Excelente' : 'Regular'}
                    trendDir={attendancePercentage > 70 ? 'up' : 'down'}
                />
                {plan?.plan_type === 'pack' ? (
                    <KPIBox
                        title="Créditos"
                        value={creditsBalance ?? 0}
                        icon={Package}
                        colorClass="bg-bee-orange"
                        trendLabel={creditsBalance === 0 ? 'RECUPERAR' : 'OK'}
                        trendDir={(creditsBalance ?? 0) > 3 ? 'up' : 'down'}
                    />
                ) : (
                    <KPIBox
                        title="Peso Atual"
                        value={currentWeight ? `${currentWeight.toString().replace('.', ',')} kg` : '--'}
                        icon={RefreshCw}
                        colorClass="bg-bee-orange"
                        trendLabel={trend === 'down' ? 'Redução' : trend === 'up' ? 'Aumento' : ''}
                        trendDir={trend === 'down' ? 'up' : 'down'}
                    />
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0 items-stretch">
                {/* CARD: EVOLUÇÃO DE MEDIDAS */}
                <Card className="rounded-[16px] shadow-sm border-slate-100 overflow-hidden flex flex-col h-full bg-white">
                    <CardHeader className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <div className="h-5 w-5 text-orange-500">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-lg font-bold text-deep-midnight tracking-tight font-display">Evolução Corporal</CardTitle>
                        </div>
                        <Select defaultValue="weight">
                            <SelectTrigger className="w-[130px] h-8 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-lg focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                                <SelectValue placeholder="Métrica" />
                            </SelectTrigger>
                            <SelectContent className="rounded-[12px] border-slate-100 shadow-xl">
                                <SelectItem value="weight">Peso (kg)</SelectItem>
                                <SelectItem value="body_fat">% Gordura</SelectItem>
                                <SelectItem value="skinfold">Dobras (mm)</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent className="flex-1 p-8 overflow-hidden">
                        {measurements.length > 0 ? (
                            <div className="w-full h-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={[...measurements].reverse()}
                                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                    >
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#FF8C00" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#FF8C00" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                                        <XAxis
                                            dataKey="recorded_at"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 800 }}
                                            tickFormatter={(str) => format(new Date(str), 'dd/MM')}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 800 }}
                                        />
                                        <RechartsTooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                                            labelFormatter={(label) => format(new Date(label), "dd 'de' MMMM", { locale: ptBR })}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="weight"
                                            stroke="#FF8C00"
                                            strokeWidth={4}
                                            fillOpacity={1}
                                            fill="url(#colorValue)"
                                            dot={{ r: 6, fill: '#FF8C00', strokeWidth: 3, stroke: '#fff' }}
                                            activeDot={{ r: 8, strokeWidth: 0 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <div className="bg-slate-50 p-6 rounded-full mb-4">
                                    <TrendingUp className="h-10 w-10 text-slate-200" />
                                </div>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest font-sans">Nenhuma medida registrada</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* CARD: TREINOS RECENTES */}
                <Card className="rounded-[16px] shadow-sm border-slate-100 overflow-hidden flex flex-col h-full bg-white">
                    <CardHeader className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <div className="h-5 w-5 text-orange-500">
                                {activityView === 'workouts' ? (
                                    <RefreshCw className="h-5 w-5" />
                                ) : (
                                    <ReceiptText className="h-5 w-5" />
                                )}
                            </div>
                            <CardTitle className="text-lg font-bold text-deep-midnight tracking-tight font-display">
                                {activityView === 'workouts' ? 'Atividades Recentes' : 'Faturas Recentes'}
                            </CardTitle>
                        </div>
                        <Select
                            value={activityView}
                            onValueChange={(value: 'workouts' | 'invoices') => setActivityView(value)}
                        >
                            <SelectTrigger className="w-[110px] h-8 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-lg focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                                <SelectValue placeholder="Ver" />
                            </SelectTrigger>
                            <SelectContent className="rounded-[12px] border-slate-100 shadow-xl">
                                <SelectItem value="workouts" className="cursor-pointer">Treinos</SelectItem>
                                <SelectItem value="invoices" className="cursor-pointer">Faturas</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent className="p-6 flex-1 overflow-y-auto min-h-0 space-y-3 no-scrollbar">
                        {activityView === 'workouts' ? (
                            recentWorkouts.length > 0 ? (
                                recentWorkouts.map(w => <WorkoutListItem key={w.id} workout={w} />)
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                                    <Dumbbell className="h-10 w-10 text-slate-200 mb-4" />
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhum treino realizado</p>
                                </div>
                            )
                        ) : (
                            invoices.length > 0 ? (
                                invoices.slice(0, 5).map(inv => <InvoiceListItem key={inv.id} invoice={inv} />)
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                                    <ReceiptText className="h-10 w-10 text-slate-200 mb-4" />
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhuma fatura encontrada</p>
                                </div>
                            )
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
