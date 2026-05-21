'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
    Plus, Search, Calendar, Clock, Loader2, Dumbbell, Filter,
    MapPin, ArrowLeft, ArrowRight, X, Edit, Trash2, CalendarCheck, User
} from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import dynamic from 'next/dynamic';
import { SectionHeader } from '@/components/ui/section-header';

const WorkoutDetailsSheet = dynamic(() => import('@/components/treinos/workout-details-sheet').then(m => ({ default: m.WorkoutDetailsSheet })), { ssr: false });
const WorkoutExecutionSheet = dynamic(() => import('@/components/treinos/workout-execution-sheet').then(m => ({ default: m.WorkoutExecutionSheet })), { ssr: false });
const WorkoutModal = dynamic(() => import('@/components/treinos/workout-modal').then(m => ({ default: m.WorkoutModal })), { ssr: false });
const EventDetailsModal = dynamic(() => import('@/components/painel/modals/event-details-modal').then(m => ({ default: m.EventDetailsModal })), { ssr: false });
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { addDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast";
import { useSetupStatus } from "@/context/SetupStatusContext";
import { useAuth } from "@/lib/auth/AuthContext";

export default function WorkoutsPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col h-[400px] w-full items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-bee-amber" />
            </div>
        }>
            <WorkoutsList />
        </Suspense>
    );
}

function WorkoutsList() {
    const supabase = createClient();
    const { toast } = useToast();
    const { organizationId } = useAuth();
    const { hasBusinessData, hasStudent, refresh: refreshSetup } = useSetupStatus();
    const treinoBlocker = !hasBusinessData ? 'Dados do Negócio' : !hasStudent ? 'Aluno' : null;
    const [workouts, setWorkouts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const searchParams = useSearchParams();

    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('active'); // Default to active (hide completed)
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    // Detect status parameter in URL
    useEffect(() => {
        const queryStatus = searchParams?.get('status') || searchParams?.get('filter');
        if (queryStatus) {
            const validStatuses = ['active', 'all', 'Agendado', 'Em Execução', 'Concluido', 'Faltou', 'CANCELLED', 'Pendente'];
            const normalized = validStatuses.find(s => s.toLowerCase() === queryStatus.toLowerCase());
            if (normalized) {
                setStatusFilter(normalized);
            }
        }
    }, [searchParams]);

    // Paginação
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;


    // Modal Novo Treino (Master Modal)
    const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
    const [workoutToEdit, setWorkoutToEdit] = useState<any>(null);

    // Workout Execution Sheet
    const [isExecutionSheetOpen, setIsExecutionSheetOpen] = useState(false);
    const [workoutToExecute, setWorkoutToExecute] = useState<any>(null);

    // Event Details Modal
    const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);

    const handleWorkoutClick = (workout: any) => {
        // Universal data normalization for EventDetailsModal
        const eventData = workout.source === 'calendar' ? {
            ...workout,
            eventType: 'TRAINING'
        } : {
            ...workout,
            id: workout.id,
            title: workout.title || 'Treino',
            status: workout.status,
            start_datetime: workout.scheduled_at,
            eventType: 'WORKOUT',
            student_name: workout.student?.full_name,
            instructor: '-', // Legacy workouts might not have instructor recorded this way
            room: workout.room?.name,
            source: 'legacy'
        };

        setSelectedEvent(eventData);
        setIsEventDetailsOpen(true);
    };

    const handleEdit = (workout: any) => {
        setWorkoutToEdit(workout);
        setIsWorkoutModalOpen(true);
    };

    const handleEditFromModal = (event: any) => {
        // Adapt event to workout format if needed, or fetch
        setWorkoutToEdit(event);
        setIsEventDetailsOpen(false);
        setIsWorkoutModalOpen(true);
    };


    const fetchWorkouts = async () => {
        if (!organizationId) return;
        setLoading(true);
        try {
            // Trigger status transitions for both classes and workouts asynchronously (non-blocking)
            supabase.rpc('update_class_statuses' as any).then(null, () => {});

            // Individual workouts (workouts table — single student)
            const { data: workoutsData, error: workoutsError } = await (supabase as any)
                .from('workouts')
                .select(`*, student:students (id, full_name, avatar_url), room:rooms(name), instructor:instructors(name)`)
                .eq('organization_id', organizationId)
                .order('scheduled_at', { ascending: false });

            if (workoutsError) console.error('Workouts error:', workoutsError);

            // Group workouts (calendar_events.type='TRAINING' — many students via event_enrollments)
            const { data: groupData, error: groupError } = await (supabase as any)
                .from('calendar_events')
                .select(`
                    *,
                    room:rooms(name),
                    instructor:instructors(name),
                    enrollments:event_enrollments(student:students(id, full_name, avatar_url))
                `)
                .eq('organization_id', organizationId)
                .eq('type', 'TRAINING')
                .order('start_datetime', { ascending: false });

            if (groupError) console.error('Group workouts error:', groupError);

            const individualItems = (workoutsData || []).map((w: any) => ({
                ...w,
                source: 'workouts',
                date: w.scheduled_at,
                displayTitle: w.title || 'Treino',
                studentName: w.student?.full_name,
                studentAvatar: w.student?.avatar_url,
                address: w.address,
                location_type: w.location_type,
                room_id: w.room_id,
                room_name: w.room?.name,
                instructor_name: w.instructor?.name,
            }));

            const groupItems = (groupData || []).map((e: any) => {
                const students = (e.enrollments || []).map((en: any) => en.student).filter(Boolean);
                const firstStudent = students[0];
                const extraCount = Math.max(0, students.length - 1);
                return {
                    id: e.id,
                    title: e.title,
                    status: e.status === 'SCHEDULED' ? 'Agendado' : e.status,
                    scheduled_at: e.start_datetime,
                    end_time: e.end_datetime,
                    type: 'TRAINING',
                    source: 'calendar',
                    date: e.start_datetime,
                    displayTitle: e.title || 'Treino em grupo',
                    studentName: firstStudent ? `${firstStudent.full_name}${extraCount ? ` +${extraCount}` : ''}` : 'Treino em grupo',
                    studentAvatar: firstStudent?.avatar_url,
                    student: firstStudent,
                    participants: students,
                    room_name: e.room?.name,
                    instructor_name: e.instructor?.name,
                    address: e.address,
                    location: e.address || e.room?.name || 'Local não definido',
                    isGroup: true,
                };
            });

            const allWorkouts = [...individualItems, ...groupItems].sort((a, b) => {
                const da = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
                const db = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
                return db - da;
            });

            setWorkouts(allWorkouts);

        } catch (error) {
            console.error("Erro ao buscar treinos:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (organizationId) fetchWorkouts();
    }, [organizationId]);



    // Lógica de Filtragem e Paginação
    const filteredWorkouts = workouts.filter(workout => {
        if (!workout) return false;
        
        const searchLower = searchTerm.toLowerCase();
        const studentName = workout.studentName?.toLowerCase() || '';
        const title = workout.title?.toLowerCase() || '';

        const matchesSearch = studentName.includes(searchLower) || title.includes(searchLower);

        let matchesStatus = true;
        const status = workout.status || '';
        if (statusFilter === 'active') {
            matchesStatus = ['SCHEDULED', 'IN_PROGRESS', 'PENDING', 'Agendado', 'Em Execução', 'Pendente'].includes(status);
        } else if (statusFilter === 'Pendente') {
            matchesStatus = status === 'Pendente' || status === 'PENDING' || status === 'Pendente de Ação';
        } else if (statusFilter === 'Agendado') {
            matchesStatus = status === 'Agendado' || status === 'SCHEDULED';
        } else if (statusFilter === 'Em Execução') {
            matchesStatus = status === 'Em Execução' || status === 'IN_PROGRESS';
        } else if (statusFilter === 'Concluido') {
            matchesStatus = status === 'Concluido' || status === 'COMPLETED';
        } else if (statusFilter === 'Faltou') {
            matchesStatus = status === 'Faltou' || status === 'MISSED';
        } else if (statusFilter === 'CANCELLED') {
            matchesStatus = status === 'CANCELLED' || status === 'Cancelado';
        } else if (statusFilter !== 'all') {
            matchesStatus = status === statusFilter;
        }

        let matchesDate = true;
        if (dateRange?.from && workout.scheduled_at) {
            const d = new Date(workout.scheduled_at);
            if (!isNaN(d.getTime())) {
                const from = startOfDay(dateRange.from);
                const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
                matchesDate = isWithinInterval(d, { start: from, end: to });
            }
        }

        return matchesSearch && matchesStatus && matchesDate;
    });

    const totalPages = Math.ceil(filteredWorkouts.length / itemsPerPage);
    const paginatedWorkouts = filteredWorkouts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, dateRange]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Concluido': return <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 border-none rounded-full px-3 py-1 font-bold">Realizado</Badge>;
            case 'Em Execução': return <Badge className="bg-pink-500 text-white hover:bg-pink-600 border-none rounded-full px-3 py-1 font-bold">Em Execução</Badge>;
            case 'Agendado': return <Badge className="bg-blue-500 text-white hover:bg-blue-600 border-none rounded-full px-3 py-1 font-bold">Agendado</Badge>;
            case 'Pendente': return <Badge className="bg-orange-500 text-white hover:bg-orange-600 border-none rounded-full px-3 py-1 font-bold">Pendente de Ação</Badge>;
            case 'Faltou': return <Badge className="bg-slate-900 text-white hover:bg-slate-900 border-none rounded-full px-3 py-1 font-bold">Faltou</Badge>;
            case 'Cancelado': return <Badge className="bg-red-500 text-white hover:bg-red-600 border-none rounded-full px-3 py-1 font-bold">Cancelado</Badge>;
            // Mapeamentos extras para garantir compatibilidade
            case 'COMPLETED': return <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 border-none rounded-full px-3 py-1 font-bold">Realizado</Badge>;
            case 'IN_PROGRESS': return <Badge className="bg-pink-500 text-white hover:bg-pink-600 border-none rounded-full px-3 py-1 font-bold">Em Execução</Badge>;
            case 'SCHEDULED': return <Badge className="bg-blue-500 text-white hover:bg-blue-600 border-none rounded-full px-3 py-1 font-bold">Agendado</Badge>;
            case 'MISSED': return <Badge className="bg-slate-900 text-white hover:bg-slate-900 border-none rounded-full px-3 py-1 font-bold">Faltou</Badge>;
            case 'CANCELLED': return <Badge className="bg-red-500 text-white hover:bg-red-600 border-none rounded-full px-3 py-1 font-bold">Cancelado</Badge>;
            default: return <Badge variant="outline" className="rounded-full px-3 py-1 font-bold">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <SectionHeader
                title="Gestão de Treinos"
                subtitle="Crie e gerencie as fichas de treino (A, B, C) dos alunos."
                action={
                    <Button
                        disabled={!!treinoBlocker}
                        title={treinoBlocker ? `Cadastre um(a) ${treinoBlocker} antes de criar treinos.` : undefined}
                        className="font-bold shadow-sm bg-bee-amber text-bee-midnight rounded-full font-display uppercase tracking-wider text-[11px] h-10 px-6 transition-all hover:-translate-y-0.5 active:scale-95 border-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        onClick={() => {
                            if (treinoBlocker) {
                                toast({
                                    variant: 'destructive',
                                    title: 'Configuração incompleta',
                                    description: `Cadastre um(a) ${treinoBlocker} antes de criar treinos.`,
                                });
                                return;
                            }
                            setWorkoutToEdit(null);
                            setIsWorkoutModalOpen(true);
                        }}
                    >
                        <Plus className="mr-2 h-4 w-4 text-[#0B0F1A]" /> Novo Treino
                    </Button>
                }
            />

            {/* FILTROS */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center">
                <div className="relative w-full lg:w-96">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por treino ou aluno..."
                        className="pl-9 bg-slate-50 border-slate-200 rounded-full transition-all focus:bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap gap-2 w-full lg:w-auto items-center justify-end">
                    <Filter className="h-4 w-4 text-muted-foreground hidden sm:block mr-2" />

                    {/* Date Range Picker */}
                    <div className="grid gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                        "w-full sm:w-[240px] justify-start text-left font-normal rounded-full h-10 transition-all hover:-translate-y-0.5",
                                        !dateRange && "text-muted-foreground"
                                    )}
                                >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                            <>
                                                {format(dateRange.from, "dd/MM/y", { locale: ptBR })} -{" "}
                                                {format(dateRange.to, "dd/MM/y", { locale: ptBR })}
                                            </>
                                        ) : (
                                            format(dateRange.from, "dd/MM/y", { locale: ptBR })
                                        )
                                    ) : (
                                        <span>Filtrar por data</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <CalendarComponent
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    numberOfMonths={2}
                                    locale={ptBR}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    {dateRange && (
                        <Button variant="ghost" size="icon" onClick={() => setDateRange(undefined)} title="Limpar datas" className="rounded-full h-8 w-8 transition-all hover:-translate-y-0.5">
                            <X className="h-4 w-4" />
                        </Button>
                    )}

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px] h-10 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-full focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Próximos / Ativos</SelectItem>
                            <SelectItem value="Agendado">Agendados</SelectItem>
                            <SelectItem value="Em Execução">Em Execução</SelectItem>
                            <SelectItem value="Pendente">Pendentes de Ação</SelectItem>
                            <SelectItem value="Concluido">Realizados</SelectItem>
                            <SelectItem value="Faltou">Faltas</SelectItem>
                            <SelectItem value="CANCELLED">Cancelados</SelectItem>
                            <SelectItem value="all">Todos os Status</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* ── Mobile cards (< md) ─────────────────────────── */}
            <div className="md:hidden space-y-3">
                {loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
                ) : filteredWorkouts.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm">Nenhum treino encontrado.</div>
                ) : paginatedWorkouts.map((workout) => (
                    <div key={workout.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 cursor-pointer active:bg-slate-50"
                        onClick={() => handleWorkoutClick(workout)}>
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-900 truncate">{workout.displayTitle}</p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3 text-orange-400" />
                                        {workout.scheduled_at && !isNaN(new Date(workout.scheduled_at).getTime())
                                            ? format(new Date(workout.scheduled_at), "dd MMM, HH:mm", { locale: ptBR })
                                            : '—'}
                                    </span>
                                    {workout.studentName && <span className="flex items-center gap-1"><User className="h-3 w-3" />{workout.studentName}</span>}
                                </div>
                            </div>
                            {getStatusBadge(workout.status)}
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-3">
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {workout.address || workout.room_name || (workout.location_type === 'internal' ? 'Interno' : workout.location_type === 'external' ? 'Externo' : 'Não definido')}
                            </span>
                            <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-slate-400 hover:text-bee-amber" onClick={() => handleEdit(workout)}>
                                    <Edit className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Desktop table (≥ md) ─────────────────────────── */}
            <div className="hidden md:block bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
                            <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Treino / Ficha</TableHead>
                            <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Aluno</TableHead>
                            <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Data & Horário</TableHead>
                            <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Localização</TableHead>
                            <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Status</TableHead>
                            <TableHead className="text-right font-bold text-[11px] uppercase tracking-wider text-slate-500">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                                        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                                        <p>Carregando treinos...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredWorkouts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                                        <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center">
                                            <Dumbbell className="h-6 w-6 text-slate-400" />
                                        </div>
                                        <p className="font-medium text-slate-900">Nenhum treino encontrado</p>
                                        <p className="text-sm">Tente ajustar os filtros ou crie um novo treino.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedWorkouts.map((workout) => (
                                <TableRow
                                    key={workout.id}
                                    className="cursor-pointer hover:bg-slate-50/50 transition-colors"
                                    onClick={() => handleWorkoutClick(workout)}
                                >
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{workout.displayTitle}</span>
                                            <span className="text-xs text-muted-foreground">{workout.type}</span>
                                            {workout.source === 'calendar' && (
                                                <span className="inline-block mt-1 w-fit text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">Novo</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={workout.studentAvatar} />
                                                <AvatarFallback>{workout.studentName?.substring(0, 2).toUpperCase() || '??'}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-sm">{workout.studentName}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                                                <Calendar className="h-3.5 w-3.5 text-orange-500" />
                                                {workout.scheduled_at && !isNaN(new Date(workout.scheduled_at).getTime())
                                                    ? format(new Date(workout.scheduled_at), "dd MMM, yyyy", { locale: ptBR })
                                                    : '-'
                                                }
                                            </div>
                                            {workout.scheduled_at && !isNaN(new Date(workout.scheduled_at).getTime()) && (
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground pl-5">
                                                    <Clock className="h-3 w-3" />
                                                    {format(new Date(workout.scheduled_at), "HH:mm")}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <MapPin className="h-4 w-4 text-slate-400" />
                                            <span className="truncate max-w-[150px] font-medium">
                                                {workout.address ? workout.address :
                                                    workout.room_name ? workout.room_name :
                                                        (workout.location_type === 'internal' ? 'Interno' :
                                                            workout.location_type === 'external' ? 'Externo' : 'Não definido')}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(workout.status)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1 px-2">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-9 w-9 text-bee-midnight hover:bg-bee-amber/10 hover:text-bee-amber rounded-xl transition-all border border-transparent hover:border-bee-amber/20 shadow-none"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEdit(workout);
                                                }}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            {workout.status !== 'Concluido' && workout.status !== 'Cancelado' && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-9 w-9 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-transparent hover:border-emerald-100 shadow-none"
                                                    title="Concluir Treino"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setWorkoutToExecute(workout);
                                                        setIsExecutionSheetOpen(true);
                                                    }}
                                                >
                                                    <CalendarCheck className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-9 w-9 text-slate-400 hover:text-destructive rounded-xl hover:bg-red-50 transition-all border border-transparent hover:border-red-100 shadow-none"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // handleDelete logic...
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {filteredWorkouts.length > 0 && (
                <div className="flex items-center justify-between px-2 py-4 border-t">
                    <div className="text-sm text-muted-foreground">
                        Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredWorkouts.length)} de {filteredWorkouts.length} treinos
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="rounded-full shadow-sm font-bold font-sans transition-all hover:-translate-y-0.5 active:scale-95"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" /> Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="rounded-full shadow-sm font-bold font-sans transition-all hover:-translate-y-0.5 active:scale-95"
                        >
                            Próxima <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}


            {/* Modal Global de Novo Treino */}
            <WorkoutModal
                open={isWorkoutModalOpen}
                onOpenChange={setIsWorkoutModalOpen}
                onSuccess={fetchWorkouts}
                workoutToEdit={workoutToEdit}
            />

            <EventDetailsModal
                open={isEventDetailsOpen}
                onOpenChange={setIsEventDetailsOpen}
                event={selectedEvent}
                onSuccess={fetchWorkouts}
                onEdit={handleEditFromModal}
            />
            {/* Modal de Execução (Concluir Treino) */}
            <WorkoutExecutionSheet
                workout={workoutToExecute}
                isOpen={isExecutionSheetOpen}
                onClose={() => setIsExecutionSheetOpen(false)}
                onSuccess={fetchWorkouts}
            />
        </div>
    );
}
