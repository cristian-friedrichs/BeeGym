'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    CheckCircle2, XCircle, Edit, Dumbbell, Trash2, Plus, Users, Search, AlertCircle, ChevronsUpDown, Check,
    Clock, MapPin, User, Calendar as CalendarIcon, X, LogOut, ArrowRight, Home, Loader2
} from 'lucide-react';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EventDetailsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    event: any | null;
    onSuccess?: () => void;
    onEdit?: (event: any) => void;
}

interface Exercise {
    id: string;
    name: string;
    muscle_group: string | null;
}

interface WorkoutLogItem {
    exerciseId: string;
    sets: number;
    reps: string;
    weight: number;
}

export function EventDetailsModal({ open, onOpenChange, event, onSuccess, onEdit }: EventDetailsModalProps) {
    const { toast } = useToast();
    const supabase = createClient();
    const [view, setView] = useState<'details' | 'log' | 'participants'>('details');
    const [loading, setLoading] = useState(false);

    // Participants State (for Classes)
    const [participants, setParticipants] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Workout Log State
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogItem[]>([]);
    const [rpe, setRpe] = useState<number>(5);
    const [notes, setNotes] = useState('');

    // Temporary state for adding a new exercise row
    const [newExerciseId, setNewExerciseId] = useState('');
    const [newSets, setNewSets] = useState(3);
    const [newReps, setNewReps] = useState('10');
    const [newWeight, setNewWeight] = useState(0);

    useEffect(() => {
        if (open) {
            setView('details'); // Reset view on open
            setWorkoutLogs([]);
            setNotes('');
            setRpe(5);
            setParticipants([]);
            setSearchTerm("");
            setSearchResults([]);
        }
    }, [open, event]);

    // Fetch participants when modal opens for CLASS events
    useEffect(() => {
        if (open && event?.id && (event.eventType === 'CLASS' || event.type === 'CLASS' || event.eventType === 'TRAINING' || event.type === 'TRAINING')) {
            fetchParticipants();
        }
    }, [open, event]);

    const fetchParticipants = async () => {
        // Pega o ID de forma dinâmica dependendo de como a prop chega no componente
        const currentEventId = event?.id || (event as any)?.classData?.id;
        if (!currentEventId) return;

        try {
            // Busca na tabela ponte já trazendo os dados do aluno embutidos (Join Nativo)
            const { data, error } = await (supabase as any)
                .from('class_attendees')
                .select(`
                    id,
                    student_id,
                    status,
                    organization_id,
                    students (
                        id,
                        full_name,
                        avatar_url
                    )
                `)
                .eq('class_id', currentEventId);

            if (error) {
                console.error("Erro Supabase na busca de matrículas:", error);
                throw error;
            }

            // Atualiza o estado da lista de alunos
            setParticipants(data || []);

        } catch (error: any) {
            console.error("Erro fatal no fetchParticipants:", error);
            toast({
                title: "Erro ao carregar participantes",
                description: "Não foi possível carregar a lista. Tente novamente.",
                variant: "destructive"
            });
        }
    };

    useEffect(() => {
        const searchStudents = async () => {
            if (searchTerm.length < 2) {
                setSearchResults([]);
                return;
            }
            setIsSearching(true);
            const { data } = await (supabase as any)
                .from('students')
                .select('id, full_name, avatar_url')
                .eq('status', 'ACTIVE')
                .ilike('full_name', `%${searchTerm}%`)
                .limit(5);

            if (data) setSearchResults(data);
            setIsSearching(false);
        };

        const timeoutId = setTimeout(() => { searchStudents(); }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, supabase]);

    const handleEnroll = async (studentId: string) => {
        const currentEventId = event?.id || (event as any)?.classData?.id;
        if (!currentEventId) {
            toast({ title: "Erro fatal", description: "ID da Aula não encontrado.", variant: "destructive" });
            return;
        }

        setSearchTerm("");
        setSearchResults([]);
        setLoading(true);

        try {
            // 1. Get organization_id of current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado.");

            const { data: profile } = await (supabase as any).from('profiles').select('organization_id').eq('id', user.id).single();

            if (!profile?.organization_id) {
                throw new Error("Organização não encontrada para o usuário logado.");
            }

            // 2. Check if already enrolled in class_attendees
            const { data: existing } = await (supabase as any)
                .from('class_attendees')
                .select('id')
                .eq('class_id', currentEventId)
                .eq('student_id', studentId)
                .maybeSingle();

            if (existing) throw new Error("Este aluno já está matriculado nesta aula.");

            // 3. Insert into class_attendees with organization_id
            const { error: insertError } = await (supabase as any)
                .from('class_attendees')
                .insert({
                    class_id: currentEventId,
                    student_id: studentId,
                    status: 'Confirmado',
                    organization_id: profile.organization_id
                });

            if (insertError) {
                if (insertError.code === '23505') throw new Error("Este aluno já está matriculado nesta aula.");
                throw insertError;
            }

            // 4. Update attendees_count manually in classes table
            const { data: currentClass } = await (supabase as any).from('classes').select('attendees_count').eq('id', currentEventId).single();
            await (supabase as any).from('classes').update({ attendees_count: (currentClass?.attendees_count || 0) + 1 }).eq('id', currentEventId);

            toast({ title: "Aluno matriculado com sucesso!" });
            await fetchParticipants();
            onSuccess?.();
        } catch (error: any) {
            toast({ title: "Atenção", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveParticipant = async (attendeeId: string) => {
        const currentEventId = event?.id || (event as any)?.classData?.id;
        if (!currentEventId) return;

        setLoading(true);
        try {
            // 1. Delete from class_attendees
            const { error: deleteError } = await (supabase as any)
                .from('class_attendees')
                .delete()
                .eq('id', attendeeId);

            if (deleteError) throw deleteError;

            // 2. Decrement count in classes
            const { data: currentClass } = await (supabase as any).from('classes').select('attendees_count').eq('id', currentEventId).single();
            await (supabase as any).from('classes').update({ attendees_count: Math.max(0, (currentClass?.attendees_count || 1) - 1) }).eq('id', currentEventId);

            toast({ title: 'Inscrição cancelada.' });
            await fetchParticipants();
            onSuccess?.();
        } catch (error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const updateAttendance = async (attendeeId: string, status: 'PRESENT' | 'ABSENT' | 'CONFIRMED' | 'Confirmado' | 'Faltou') => {
        setLoading(true);
        try {
            const { error } = await (supabase as any)
                .from('class_attendees')
                .update({ status })
                .eq('id', attendeeId);

            if (error) throw error;

            toast({ title: status === 'PRESENT' || status === 'Confirmado' ? 'Presença confirmada' : status === 'ABSENT' || status === 'Faltou' ? 'Falta registrada' : 'Status resetado' });
            await fetchParticipants(); // Refresh list to update UI
        } catch (error) {
            console.error('Error updating attendance:', error);
            toast({ title: 'Erro ao atualizar presença', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    // Alterna entre Confirmado (Presença) e Faltou
    const handleToggleAttendance = async (attendeeId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'Faltou' ? 'Confirmado' : 'Faltou';
        try {
            const { error } = await (supabase as any)
                .from('class_attendees')
                .update({ status: newStatus })
                .eq('id', attendeeId);

            if (error) throw error;

            toast({ title: newStatus === 'Faltou' ? "Falta registrada no sistema." : "Presença confirmada." });
            fetchParticipants(); // Recarrega a lista
        } catch (error: any) {
            toast({ title: "Erro ao atualizar presença", description: error.message, variant: "destructive" });
        }
    };


    // Fetch exercises when entering log view
    useEffect(() => {
        if (view === 'log' && exercises.length === 0) {
            fetchExercises();
        }
    }, [view]);

    const fetchExercises = async () => {
        try {
            const { data, error } = await supabase
                .from('exercises')
                .select('id, name, muscle_group')
                .order('name');

            if (error) throw error;
            setExercises(data || []);
        } catch (error) {
            console.error('Error fetching exercises:', error);
            toast({
                title: 'Erro ao carregar exercícios',
                variant: 'destructive'
            });
        }
    };

    // Cancela o evento inteiro (Workouts ou Aulas)
    const handleCancelEvent = async () => {
        if (!event) return;
        if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;

        setLoading(true);
        try {
            const { error } = await (supabase as any)
                .from('calendar_events')
                .update({ status: 'CANCELLED' })
                .eq('id', event.id);

            if (error) throw error;

            toast({ title: 'Agendamento cancelado com sucesso' });
            onSuccess?.();
            onOpenChange(false);
        } catch (error) {
            console.error('Error cancelling event:', error);
            toast({
                title: 'Erro ao cancelar',
                description: 'Não foi possível cancelar o agendamento.',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    // Marca o evento inteiro como FALTA (Workouts apenas)
    const handleMissedEvent = async () => {
        if (!event) return;
        if (!confirm('Confirmar falta neste treino?')) return;

        setLoading(true);
        try {
            // 1. Update Event Status
            const { error: updateError } = await (supabase as any)
                .from('calendar_events')
                .update({ status: 'MISSED' }) // Assuming 'MISSED' is valid or mapped to display logic
                .eq('id', event.id);

            if (updateError) throw updateError;

            toast({ title: 'Falta registrada no treino.' });
            onSuccess?.();
            onOpenChange(false);
        } catch (error) {
            console.error('Error updating missed status:', error);
            toast({
                title: 'Erro ao registrar falta',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    }


    const handleAddLogItem = () => {
        if (!newExerciseId) return;

        setWorkoutLogs([...workoutLogs, {
            exerciseId: newExerciseId,
            sets: newSets,
            reps: newReps,
            weight: newWeight
        }]);

        // Reset inputs
        setNewExerciseId('');
        setNewSets(3);
        setNewReps('10');
        setNewWeight(0);
    };

    const handleRemoveLogItem = (index: number) => {
        const newLogs = [...workoutLogs];
        newLogs.splice(index, 1);
        setWorkoutLogs(newLogs);
    };

    const handleCompleteWorkout = async () => {
        if (!event) return;
        setLoading(true);

        try {
            const isModern = !!event.calendar_event_id || event.source === 'calendar';
            const table = isModern ? 'calendar_events' : 'workouts';

            const { error: updateError } = await (supabase as any)
                .from(table)
                .update({ status: isModern ? 'COMPLETED' : 'Concluido' })
                .eq('id', event.id);

            if (updateError) throw updateError;

            if (workoutLogs.length > 0) {
                const logsToInsert = workoutLogs.map(log => ({
                    event_id: isModern ? event.id : null,
                    workout_id: !isModern ? event.id : null,
                    exercise_id: log.exerciseId,
                    sets: log.sets,
                    reps: log.reps,
                    weight: log.weight,
                    notes: `RPE: ${rpe}. ${notes}`
                }));

                const { error: logError } = await (supabase as any)
                    .from('workout_logs')
                    .insert(logsToInsert);

                if (logError) throw logError;
            }

            toast({ title: 'Treino concluído com sucesso!' });
            onSuccess?.();
            onOpenChange(false);
        } catch (error: any) {
            console.error('Error completing workout:', error);
            toast({
                title: 'Erro ao concluir',
                description: error.message,
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const getDisplayData = () => {
        if (!event) return null;

        const isLegacyWorkout = !!event.student_id && !event.start_datetime;
        const type = event.eventType || event.type || (isLegacyWorkout ? 'TRAINING' : 'CLASS');

        const title = event.title || event.name || (type === 'CLASS' ? 'Aula' : 'Treino');
        const status = event.status || 'Agendado';

        let dateLabel = 'N/A';
        let timeLabel = event.time || 'N/A';
        let durationLabel = event.duration ? `${event.duration} min` : 'N/A';

        const rawDate = event.start_datetime || event.scheduled_at || event.start;
        if (rawDate) {
            const d = new Date(rawDate);
            if (!isNaN(d.getTime())) {
                dateLabel = format(d, "EEEE, d 'de' MMMM", { locale: ptBR });
                if (timeLabel === 'N/A') {
                    timeLabel = format(d, "HH:mm");
                }
            }
        }

        let personLabel = 'Não atribuído';
        let personRole = (type === 'CLASS' || type === 'Aula Coletiva') ? 'Instrutor' : 'Aluno';

        if (personRole === 'Instrutor') {
            personLabel = event.instructor || 'Não atribuído';
        } else {
            personLabel = event.student?.full_name || event.student_name || event.student?.name || 'Aluno Desconhecido';
        }

        const location = event.address || event.room || event.location || 'Sem local';

        let modality = '';
        if (event.template?.title) {
            modality = event.template.title;
        } else if (type === 'CLASS' || type === 'Aula Coletiva') {
            modality = 'Aula Coletiva';
        } else {
            modality = 'Treino Individual';
        }

        return {
            title,
            type,
            status,
            dateLabel,
            timeLabel,
            durationLabel,
            personLabel,
            personRole,
            location,
            modality,
            color: event.color || event.template?.color || '#F97316',
            icon: event.iconName || event.template?.icon || (type === 'CLASS' ? 'Users' : 'Dumbbell')
        };
    };

    const display = getDisplayData();

    const [viewExercises, setViewExercises] = useState<any[]>([]);
    const [loadingExercises, setLoadingExercises] = useState(false);

    useEffect(() => {
        const fetchViewExercises = async () => {
            if (!open || !event?.id || !display) return;
            if (display.type !== 'TRAINING' && display.type !== 'WORKOUT') return;

            setLoadingExercises(true);
            try {
                const { data, error } = await (supabase as any)
                    .from('workout_exercises')
                    .select('*, exercise:exercises(name, muscle_group)')
                    .eq('workout_id', event.id);

                if (!error) setViewExercises(data || []);
            } catch (err) {
                console.error("Error fetching exercises:", err);
            } finally {
                setLoadingExercises(false);
            }
        };

        fetchViewExercises();
    }, [open, event?.id, display?.type]);

    if (!event || !display) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SCHEDULED': return 'bg-blue-500 text-white';
            case 'IN_PROGRESS': return 'bg-pink-500 text-white';
            case 'COMPLETED': return 'bg-emerald-500 text-white';
            case 'CANCELLED': return 'bg-red-500 text-white';
            case 'PENDING': return 'bg-orange-500 text-white';
            case 'Pendente': return 'bg-orange-500 text-white';
            case 'PENDENTE': return 'bg-orange-500 text-white';
            case 'MISSED': return 'bg-slate-900 text-white';
            case 'Agendado': return 'bg-blue-500 text-white';
            case 'Em Execução': return 'bg-pink-500 text-white';
            case 'Concluido': return 'bg-emerald-500 text-white';
            case 'Realizado': return 'bg-emerald-500 text-white';
            case 'Cancelado': return 'bg-red-500 text-white';
            case 'Faltou': return 'bg-slate-900 text-white';
            default: return 'bg-slate-500 text-white';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'SCHEDULED': return 'Agendado';
            case 'IN_PROGRESS': return 'Em Execução';
            case 'COMPLETED': return 'Realizado';
            case 'CANCELLED': return 'Cancelado';
            case 'PENDING': return 'Pendente';
            case 'PENDENTE': return 'Pendente';
            case 'Pendente': return 'Pendente';
            case 'MISSED': return 'Falta';
            default: return status;
        }
    };

    const getModalityName = () => {
        return display.modality;
    };


    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[600px] flex flex-col h-full overflow-y-auto p-0 gap-0">
                <SheetDescription className="sr-only">Detalhes do evento</SheetDescription>

                {/* Modern Header */}
                <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent z-0" />

                    <SheetHeader className="relative z-10 p-6 pr-12 space-y-0">
                        <div className="flex items-center gap-4">
                            {/* Icon Container */}
                            <div
                                className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 flex-shrink-0 shadow-sm bg-white"
                                style={{
                                    borderColor: `${display.color}20`,
                                    backgroundColor: `${display.color}05`,
                                    color: display.color,
                                }}
                            >
                                <DynamicIcon
                                    name={display.icon}
                                    className="h-8 w-8"
                                />
                            </div>

                            <div className="flex-1 min-w-0">
                                <SheetTitle className="text-2xl font-bold text-deep-midnight tracking-tight truncate">
                                    {display.title}
                                </SheetTitle>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge
                                        className={cn(
                                            "px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider border-none text-white shadow-sm",
                                            getStatusColor(display.status)
                                        )}
                                    >
                                        {getStatusLabel(display.status)}
                                    </Badge>
                                    <span className="text-muted-foreground text-sm font-semibold truncate capitalize">
                                        {display.modality.toLowerCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </SheetHeader>

                    <Separator className="bg-border/40" />
                </div>

                <div className="flex-1 p-6 overflow-y-auto">
                    {view === 'participants' ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 ease-out">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Users className="h-5 w-5 text-primary" />
                                    Participantes
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                    {participants.length} inscritos / {event.capacity || 'Unlimited'}
                                </Badge>
                            </div>

                            {/* Search & Add */}
                            <div className="relative mb-4">
                                <div className="relative flex items-center">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Buscar aluno para adicionar (min. 2 letras)..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 border-dashed border-primary/50 focus-visible:ring-primary/50 h-11"
                                    />
                                    {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />}
                                </div>

                                {/* Dropdown de Resultados Customizado */}
                                {searchTerm.length >= 2 && searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 shadow-xl rounded-xl z-50 max-h-48 overflow-y-auto overflow-x-hidden">
                                        {searchResults.map(student => {
                                            const isEnrolled = participants.some(p => p.students?.id === student.id || p.student_id === student.id);
                                            return (
                                                <div
                                                    key={student.id}
                                                    onClick={() => !isEnrolled && handleEnroll(student.id)}
                                                    className={cn("px-4 py-3 cursor-pointer flex items-center gap-3 text-sm text-slate-700 transition-colors border-b border-slate-50 last:border-0", isEnrolled ? "opacity-50 cursor-not-allowed bg-slate-50" : "hover:bg-primary/5")}
                                                >
                                                    <Avatar className="h-8 w-8 shrink-0">
                                                        <AvatarImage src={student.avatar_url} />
                                                        <AvatarFallback className="bg-primary/10 text-primary font-bold">{student.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-semibold truncate flex-1">{student.full_name}</span>
                                                    {isEnrolled && <span className="text-xs text-muted-foreground mr-1">Inscrito</span>}
                                                    {isEnrolled && <Check className="h-4 w-4 text-primary" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Lista de Participantes Matriculados */}
                            <div className="mt-6 space-y-3">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-bold text-slate-700">Participantes Confirmados</h4>
                                    <span className="text-xs font-bold text-slate-400">{participants.length} / {event.capacity || 10}</span>
                                </div>

                                {participants.length === 0 ? (
                                    <div className="text-center p-8 bg-slate-50 text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl">
                                        Nenhum aluno inscrito nesta aula ainda.
                                    </div>
                                ) : (
                                    participants.map((participant) => {
                                        // REGRA DE NEGÓCIO: Trava de 24 horas após o término da aula
                                        // Busca o end_time de forma segura
                                        const endTimeStr = event?.end_time || event?.end_datetime || event?.end;
                                        const eventEndTime = endTimeStr ? new Date(endTimeStr) : new Date();
                                        const lockTime = new Date(eventEndTime.getTime() + 24 * 60 * 60 * 1000); // Fim + 24h
                                        const isLocked = new Date() > lockTime;

                                        const isAbsent = participant.status === 'Faltou' || participant.status === 'ABSENT';

                                        return (
                                            <div key={participant.id} className={cn(
                                                "flex items-center justify-between p-3 border rounded-xl transition-colors",
                                                isAbsent ? 'bg-red-50 border-red-100' : 'bg-white border-slate-200 shadow-sm'
                                            )}>
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                                                        isAbsent ? 'bg-red-200 text-red-700' : 'bg-slate-100 text-slate-600'
                                                    )}>
                                                        {participant.students?.full_name?.charAt(0).toUpperCase() || '?'}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-800 line-clamp-1">
                                                            {participant.students?.full_name || 'Aluno Excluído'}
                                                        </span>
                                                        <span className={cn(
                                                            "text-[11px] font-bold uppercase tracking-wider",
                                                            isAbsent ? 'text-red-500' : 'text-green-500'
                                                        )}>
                                                            {isAbsent ? 'Falta Registrada' : 'Presença Confirmada'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Controles: Só exibe se estiver dentro da janela de 24h */}
                                                {!isLocked ? (
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleToggleAttendance(participant.id, participant.status)}
                                                            className={cn(
                                                                "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                                                                isAbsent ? 'text-green-600 hover:bg-green-100' : 'text-red-600 hover:bg-red-50'
                                                            )}
                                                        >
                                                            {isAbsent ? 'Registrar Presença' : 'Registrar Falta'}
                                                        </button>

                                                        <button
                                                            onClick={() => handleRemoveParticipant(participant.id)}
                                                            className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Remover da aula"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded uppercase tracking-wider">
                                                        Registro Fechado
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="flex justify-between pt-4 border-t">
                                <Button variant="outline" onClick={() => setView('details')} disabled={loading} className="gap-2">
                                    <LogOut className="h-4 w-4 rotate-180" /> Voltar
                                </Button>
                            </div>
                        </div>
                    ) : view === 'details' ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500 ease-out">
                            {/* Info Grid - Premium Style */}
                            <div className="grid grid-cols-2 gap-px bg-border/40 rounded-2xl border overflow-hidden shadow-sm">
                                <div className="p-4 bg-white hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-1.5">
                                        <CalendarIcon className="h-3.5 w-3.5" /> Data
                                    </div>
                                    <p className="text-sm font-bold text-slate-700">
                                        {display.dateLabel}
                                    </p>
                                </div>
                                <div className="p-4 bg-white hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-1.5">
                                        <Clock className="h-3.5 w-3.5" /> Horário
                                    </div>
                                    <p className="text-sm font-bold text-slate-700">
                                        {display.timeLabel} <span className="text-slate-400 font-medium ml-1">({display.durationLabel})</span>
                                    </p>
                                </div>
                                <div className="p-4 bg-white hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-1.5">
                                        <User className="h-3.5 w-3.5" /> {display.personRole}
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 truncate">
                                        {display.personLabel}
                                    </p>
                                </div>
                                <div className="p-4 bg-white hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-1.5">
                                        <MapPin className="h-3.5 w-3.5" /> Local
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 line-clamp-1">{display.location}</p>
                                </div>
                            </div>

                            {/* ── Exercises List (WORKOUT events only) ── */}
                            {(display.type === 'TRAINING' || display.type === 'WORKOUT') && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold flex items-center gap-2">
                                            <Dumbbell className="h-4 w-4 text-primary" />
                                            Ficha de Exercícios
                                        </h3>
                                        <Badge variant="secondary" className="text-[11px] font-bold">
                                            {viewExercises.length} Exercícios
                                        </Badge>
                                    </div>

                                    <div className="rounded-xl border bg-muted/5 overflow-hidden">
                                        {loadingExercises ? (
                                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm">
                                                <Loader2 className="h-6 w-6 animate-spin mb-2 opacity-50" />
                                                <p>Buscando exercícios...</p>
                                            </div>
                                        ) : viewExercises.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm">
                                                <Dumbbell className="h-8 w-8 mb-2 opacity-20" />
                                                <p>Nenhum exercício listado.</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-border/50">
                                                {viewExercises.map((ex, idx) => (
                                                    <div key={ex.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="h-8 w-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                                                {idx + 1}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-bold text-slate-700 truncate">{ex.exercise?.name || 'Exercício'}</p>
                                                                <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">{ex.exercise?.muscle_group || 'Geral'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
                                                            <div className="text-center w-12">
                                                                <p className="text-[10px] text-slate-400 uppercase tracking-tighter mb-0.5">Séries</p>
                                                                <p>{ex.sets || '-'}</p>
                                                            </div>
                                                            <div className="text-center w-12">
                                                                <p className="text-[10px] text-slate-400 uppercase tracking-tighter mb-0.5">Reps</p>
                                                                <p>{ex.reps || '-'}</p>
                                                            </div>
                                                            <div className="text-center w-12">
                                                                <p className="text-[10px] text-slate-400 uppercase tracking-tighter mb-0.5">Carga</p>
                                                                <p>{ex.weight ? `${ex.weight}kg` : '-'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ── Inline Attendance List (CLASS events only) ── */}
                            {(event.eventType === 'CLASS' || event.type === 'CLASS' || event.eventType === 'TRAINING' || event.type === 'TRAINING') && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold flex items-center gap-2">
                                            <Users className="h-4 w-4 text-primary" />
                                            Participantes
                                        </h3>
                                        <Badge variant="outline" className="text-[11px]">
                                            {participants.length} / {event.capacity || '∞'}
                                        </Badge>
                                    </div>

                                    {/* Add student inline search */}
                                    {event.status !== 'CANCELLED' && event.status !== 'COMPLETED' && event.status !== 'MISSED' && (
                                        <div className="relative w-full mb-3">
                                            <div className="relative flex items-center">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                                <Input
                                                    placeholder="Buscar aluno para adicionar..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="pl-8 border-dashed border-primary/50 focus-visible:ring-primary/50 h-9 text-xs"
                                                />
                                                {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-slate-400" />}
                                            </div>

                                            {/* Dropdown de Resultados Customizado */}
                                            {searchTerm.length >= 2 && searchResults.length > 0 && (
                                                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 shadow-xl rounded-xl z-50 max-h-48 overflow-y-auto overflow-x-hidden">
                                                    {searchResults.map(student => {
                                                        const isEnrolled = participants.some(p => p.students?.id === student.id || p.student_id === student.id);
                                                        return (
                                                            <div
                                                                key={student.id}
                                                                onClick={() => !isEnrolled && handleEnroll(student.id)}
                                                                className={cn("px-4 py-2 cursor-pointer flex items-center gap-3 text-sm text-slate-700 transition-colors border-b border-slate-50 last:border-0", isEnrolled ? "opacity-50 cursor-not-allowed bg-slate-50" : "hover:bg-primary/5")}
                                                            >
                                                                <Avatar className="h-6 w-6 shrink-0">
                                                                    <AvatarImage src={student.avatar_url} />
                                                                    <AvatarFallback className="text-[11px] bg-primary/10 text-primary font-bold">{student.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                                </Avatar>
                                                                <span className="font-semibold truncate text-xs flex-1">{student.full_name}</span>
                                                                {isEnrolled && <Check className="h-3.5 w-3.5 text-primary" />}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Attendance list */}
                                    <div className="rounded-xl border bg-muted/5 overflow-hidden">
                                        {participants.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm">
                                                <Users className="h-8 w-8 mb-2 opacity-20" />
                                                <p>Nenhum aluno inscrito.</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-border/50">
                                                {participants.map((participant) => {
                                                    const canManageAttendance = event.status === 'SCHEDULED' || event.status === 'IN_PROGRESS';
                                                    const isPresent = participant.status === 'Confirmado' || participant.status === 'PRESENT';
                                                    const isAbsent = participant.status === 'Faltou' || participant.status === 'ABSENT';

                                                    return (
                                                        <div key={participant.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/30 transition-colors group">
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <Avatar className="h-8 w-8 border-2 border-white ring-1 ring-border flex-shrink-0">
                                                                    <AvatarImage src={participant.students?.avatar_url} />
                                                                    <AvatarFallback className="text-[11px] font-bold bg-primary/5 text-primary">
                                                                        {participant.students?.full_name?.substring(0, 2).toUpperCase() || '?'}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-bold leading-none truncate text-slate-700">{participant.students?.full_name || 'Aluno Excluído'}</p>
                                                                    <span className={cn(
                                                                        "text-[11px] font-bold uppercase tracking-wider",
                                                                        isPresent && 'text-emerald-500',
                                                                        isAbsent && 'text-red-500',
                                                                        (!isPresent && !isAbsent) && 'text-muted-foreground',
                                                                    )}>
                                                                        {isPresent ? 'Presente' : isAbsent ? 'Faltou' : 'Inscrito'}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-1 shrink-0">
                                                                {canManageAttendance ? (
                                                                    <>
                                                                        <Button
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            className={cn(
                                                                                "h-8 w-8 rounded-full transition-all",
                                                                                isPresent
                                                                                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                                                                    : "text-slate-300 hover:text-emerald-600 hover:bg-emerald-50"
                                                                            )}
                                                                            onClick={() => handleToggleAttendance(participant.id, participant.status)}
                                                                            title="Confirmar Presença (V)"
                                                                        >
                                                                            <CheckCircle2 className="h-5 w-5" />
                                                                        </Button>
                                                                        <Button
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            className={cn(
                                                                                "h-8 w-8 rounded-full transition-all",
                                                                                isAbsent
                                                                                    ? "bg-red-500 text-white hover:bg-red-600"
                                                                                    : "text-slate-300 hover:text-red-600 hover:bg-red-50"
                                                                            )}
                                                                            onClick={() => handleToggleAttendance(participant.id, participant.status)}
                                                                            title="Registrar Falta (X)"
                                                                        >
                                                                            <XCircle className="h-5 w-5" />
                                                                        </Button>
                                                                        <Separator orientation="vertical" className="h-4 mx-1" />

                                                                        <button
                                                                            onClick={() => handleRemoveParticipant(participant.id)}
                                                                            className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                            title="Excluir aluno desta aula"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <Badge variant="outline" className={cn(
                                                                        "text-[11px] px-2 font-bold uppercase",
                                                                        isPresent && 'border-emerald-200 bg-emerald-50 text-emerald-700',
                                                                        isAbsent && 'border-red-200 bg-red-50 text-red-700',
                                                                    )}>
                                                                        {isPresent ? '✓ Presente' : isAbsent ? '✗ Faltou' : 'Inscrito'}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Actions Footer */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                {event.status !== 'CANCELLED' && event.status !== 'COMPLETED' && event.status !== 'MISSED' && (
                                    <>
                                        {/* Actions for WORKOUTS only - CLASS actions are now inline */}
                                        {(event.eventType === 'WORKOUT' || event.type === 'WORKOUT') && (
                                            <>
                                                <Button
                                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white h-11 shadow-sm"
                                                    onClick={() => setView('log')}
                                                >
                                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                                    Concluir Treino
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-11"
                                                    onClick={handleMissedEvent}
                                                >
                                                    <XCircle className="w-4 h-4 mr-2" />
                                                    Falta
                                                </Button>
                                            </>
                                        )}

                                        <Button variant="outline" className="h-11 px-3" onClick={() => onEdit?.(event)} title="Editar">
                                            <Edit className="w-4 h-4" />
                                        </Button>

                                        <Button variant="outline" className="text-muted-foreground hover:text-destructive border-transparent hover:bg-destructive/5 h-11 px-3" onClick={handleCancelEvent} title="Cancelar Agendamento">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </>
                                )}

                                {(event.status === 'COMPLETED' || event.status === 'MISSED' || event.status === 'CANCELLED') && (
                                    <Button variant="ghost" className="w-full text-muted-foreground cursor-not-allowed" disabled>
                                        Evento Finalizado
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : (
                        // LOG VIEW (Workout Completion)
                        <div className="space-y-6 pt-2 animate-in fade-in zoom-in-95 duration-500 ease-out">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Dumbbell className="h-5 w-5 text-primary" />
                                    Registrar Conclusão
                                </h3>
                            </div>

                            {/* Exercise Inputs */}
                            <div className="border rounded-xl p-4 space-y-4 bg-muted/10 border-border/60">
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                                    <div className="sm:col-span-4 lg:col-span-1 space-y-1.5">
                                        <Label className="text-xs font-semibold uppercase text-muted-foreground">Exercício</Label>
                                        <Select value={newExerciseId} onValueChange={setNewExerciseId}>
                                            <SelectTrigger className="h-10 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-lg focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {exercises.map(ex => (
                                                    <SelectItem key={ex.id} value={ex.id}>{ex.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-3 sm:col-span-2 lg:col-span-2 grid grid-cols-3 gap-2">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold uppercase text-muted-foreground">Carga (kg)</Label>
                                            <Input type="number" className="h-9 text-xs bg-white" value={newWeight} onChange={e => setNewWeight(Number(e.target.value))} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold uppercase text-muted-foreground">Reps</Label>
                                            <Input className="h-9 text-xs bg-white" value={newReps} onChange={e => setNewReps(e.target.value)} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold uppercase text-muted-foreground">Séries</Label>
                                            <Input type="number" className="h-9 text-xs bg-white" value={newSets} onChange={e => setNewSets(Number(e.target.value))} />
                                        </div>
                                    </div>
                                    <div className="col-span-3 sm:col-span-1 lg:col-span-1">
                                        <Button size="sm" className="w-full h-9 bg-primary hover:bg-primary/90" onClick={handleAddLogItem} disabled={!newExerciseId}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Table of added exercises */}
                                {workoutLogs.length > 0 && (
                                    <div className="rounded-lg border bg-white overflow-hidden shadow-sm">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/30 hover:bg-muted/30 text-xs">
                                                    <TableHead className="h-8 pl-4">Exercício</TableHead>
                                                    <TableHead className="h-8 text-right">Carga</TableHead>
                                                    <TableHead className="h-8 text-center">Séries x Reps</TableHead>
                                                    <TableHead className="h-8 w-[40px]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {workoutLogs.map((log, index) => {
                                                    const exerciseName = exercises.find(e => e.id === log.exerciseId)?.name || 'Desconhecido';
                                                    return (
                                                        <TableRow key={index} className="hover:bg-muted/5 text-xs">
                                                            <TableCell className="py-2 pl-4 font-medium">{exerciseName}</TableCell>
                                                            <TableCell className="py-2 text-right text-muted-foreground">{log.weight}kg</TableCell>
                                                            <TableCell className="py-2 text-center text-muted-foreground">{log.sets} x {log.reps}</TableCell>
                                                            <TableCell className="py-2 text-center">
                                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive rounded-full" onClick={() => handleRemoveLogItem(index)}>
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </div>

                            <Separator className="bg-border/60" />

                            {/* Feedback */}
                            <div className="space-y-5">
                                <div className="space-y-3">
                                    <Label className="flex justify-between font-semibold">
                                        <span>Percepção de Esforço (RPE): <span className="text-primary text-lg ml-1">{rpe}</span></span>
                                    </Label>
                                    <Input
                                        type="range"
                                        min="1"
                                        max="10"
                                        step="1"
                                        value={rpe}
                                        className="cursor-pointer accent-primary h-2"
                                        onChange={(e) => setRpe(Number(e.target.value))}
                                    />
                                    <div className="flex justify-between text-[11px] uppercase font-bold text-muted-foreground px-1 tracking-wider">
                                        <span>Leve</span>
                                        <span>Moderado</span>
                                        <span>Intenso</span>
                                        <span>Exaustivo</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="font-semibold">Notas do Treino</Label>
                                    <Textarea
                                        placeholder="Como foi o desempenho? Alguma dor ou observação importante?"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="resize-none min-h-[80px]"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between pt-4 gap-4">
                                <Button variant="ghost" onClick={() => setView('details')} disabled={loading}>
                                    Voltar
                                </Button>
                                <Button className="bg-green-600 hover:bg-green-700 text-white gap-2 flex-1 shadow-md hover:shadow-lg transition-all" onClick={handleCompleteWorkout} disabled={loading}>
                                    {loading ? 'Salvando...' : 'Finalizar Treino'} <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
