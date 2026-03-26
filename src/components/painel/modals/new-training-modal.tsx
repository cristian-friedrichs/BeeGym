'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { MultiSelect } from '@/components/ui/multi-select';
import { checkStudentScheduleLimits } from '@/actions/aulas';
import {
    CalendarIcon, Users as UsersIcon, User, LayoutGrid, Dumbbell, MapPin
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ExerciseSearch } from '@/components/treinos/exercise-search';
import { Trash2, Plus } from 'lucide-react';
import { useUnit } from '@/context/UnitContext';

interface MultiSelectOption { value: string; label: string; }

interface NewTrainingModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    initialDate?: Date;
    initialTime?: string;
    initialStudentId?: string;
    eventId?: string;
    eventKind?: 'class' | 'workout';
}

interface Student { id: string; name: string; }
interface Instructor { id: string; full_name: string; }
interface Room { id: string; name: string; capacity: number; }

type Modality = 'individual' | 'group';

const TIME_SLOTS = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
];

const DURATION_OPTIONS = [
    { value: '30', label: '30 minutos' },
    { value: '45', label: '45 minutos' },
    { value: '60', label: '1 hora' },
    { value: '90', label: '1 hora e 30 minutos' },
];

export function NewTrainingModal({
    open,
    onOpenChange,
    onSuccess,
    initialDate,
    initialTime,
    initialStudentId,
    eventId,
    eventKind = 'workout'
}: NewTrainingModalProps) {
    const { toast } = useToast();
    const supabase = createClient();
    const { currentUnitId } = useUnit();
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(false);

    // Mode State
    const [modality, setModality] = useState<Modality>(eventKind === 'workout' ? 'individual' : 'group');

    // Data Sources
    const [students, setStudents] = useState<Student[]>([]);
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);

    // Form Fields
    const [trainingName, setTrainingName] = useState('');
    const [selectedStudent, setSelectedStudent] = useState('');
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

    const [selectedInstructor, setSelectedInstructor] = useState('');
    const [selectedRoom, setSelectedRoom] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
    const [selectedTime, setSelectedTime] = useState(initialTime || '');
    const [selectedDuration, setSelectedDuration] = useState('60');

    // Individual Mode Specifics
    const [activityType, setActivityType] = useState('Hipertrofia');
    const [isMakeup, setIsMakeup] = useState(false);
    const [forceSchedule, setForceSchedule] = useState(false);

    // Location State
    const [locationType, setLocationType] = useState<'internal' | 'external'>('internal');
    const [address, setAddress] = useState('');

    // Recurrence State
    const [isRecurring, setIsRecurring] = useState(false);
    const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([]);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);

    // Exercises state
    const [exercises, setExercises] = useState<{ name: string, exercise_id: string | null, sets: number, reps: string, weight: string }[]>([]);

    useEffect(() => {
        if (open) {
            fetchData();
            if (eventId) {
                fetchEventDetails(eventId);
            } else {
                // Reset to initial values creating new
                if (initialDate) setSelectedDate(initialDate);
                if (initialTime) setSelectedTime(initialTime);
                if (initialStudentId) setSelectedStudent(initialStudentId);

                // Initialize based on Kind
                setModality(eventKind === 'workout' ? 'individual' : 'group');
                setEndDate(addDays(new Date(), 30));
                setIsRecurring(false);
                setSelectedWeekDays([]);
                setExercises([]);
                resetForm(true);
            }
        }
    }, [open, eventId, eventKind]);

    async function fetchData() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: userData } = await (supabase as any).from('profiles').select('organization_id').eq('id', user.id).single();
            if (!userData?.organization_id) return;

            const { data: studentsData } = await (supabase as any).from('students').select('id, full_name').eq('organization_id', userData.organization_id).eq('status', 'ACTIVE').order('full_name');
            if (studentsData) setStudents((studentsData as any[]).map(s => ({ id: s.id, name: s.full_name })));

            const { data: instructorsData } = await (supabase as any).from('profiles').select('id, full_name').eq('organization_id', userData.organization_id).order('full_name');
            if (instructorsData) setInstructors(instructorsData as any[]);

            const { data: roomsData } = await (supabase as any).from('rooms').select('id, name, capacity').eq('organization_id', userData.organization_id).order('name');
            if (roomsData) setRooms(roomsData.map((r: any) => ({ ...r, capacity: r.capacity || 0 })));
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({ title: 'Erro ao carregar dados', description: 'Não foi possível carregar alunos, instrutores e salas.', variant: 'destructive' });
        }
    }

    async function fetchEventDetails(id: string) {
        setDataLoading(true);
        try {
            if (eventKind === 'workout') {
                // Fetch from WORKOUTS table
                const { data: workout, error } = await (supabase as any)
                    .from('workouts')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                if (workout) {
                    setTrainingName(workout.title);
                    setActivityType(workout.type || 'Hipertrofia');
                    setSelectedStudent(workout.student_id);
                    setIsMakeup(workout.is_makeup || false);
                    setModality('individual'); // Workouts are always individual

                    setSelectedInstructor('');
                    setSelectedRoom('');

                    if (workout.scheduled_at) {
                        const startDate = new Date(workout.scheduled_at);
                        setSelectedDate(startDate);
                        setSelectedTime(format(startDate, 'HH:mm'));

                        if (workout.end_time) {
                            const endDate = new Date(workout.end_time);
                            const duration = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
                            setSelectedDuration(duration.toString());
                        }
                    }
                }

            } else {
                // Fetch from CALENDAR_EVENTS table (Class/Group)
                const { data: event, error } = await (supabase as any)
                    .from('calendar_events')
                    .select(`
                        *,
                        enrollments:event_enrollments(student_id, status)
                    `)
                    .eq('id', id)
                    .single();

                if (error) throw error;
                if (event) {
                    setTrainingName(event.title);
                    setSelectedInstructor(event.instructor_id || '');
                    if (event.room_id) {
                        setLocationType('internal');
                        setSelectedRoom(event.room_id);
                    } else if (event.address) {
                        setLocationType('external');
                        setAddress(event.address);
                    }

                    if (event.start_datetime) {
                        const startDate = new Date(event.start_datetime);
                        setSelectedDate(startDate);
                        setSelectedTime(format(startDate, 'HH:mm'));

                        if (event.end_datetime) {
                            const endDate = new Date(event.end_datetime);
                            const duration = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
                            setSelectedDuration(duration.toString());
                        }
                    }

                    // Determine modality
                    const enrollments = event.enrollments || [];
                    if (enrollments.length > 0 || (event.capacity && event.capacity > 0)) {
                        setModality('group');
                        setSelectedStudents(enrollments.map((e: any) => e.student_id));
                    } else {
                        setModality('individual');
                        setSelectedStudent(enrollments[0]?.student_id || '');
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching event details:', error);
            toast({ title: 'Erro ao carregar evento', description: 'Não foi possível carregar os detalhes do treino.', variant: 'destructive' });
        } finally {
            setDataLoading(false);
        }
    }

    function resetForm(keepInitial = false) {
        if (!keepInitial) {
            setTrainingName(''); setSelectedStudent(''); setSelectedStudents([]);
            setSelectedInstructor(''); setSelectedRoom(''); setSelectedDate(undefined);
            setSelectedTime(''); setSelectedDuration('60');
            setActivityType('Hipertrofia'); setIsMakeup(false); setForceSchedule(false);
            setIsRecurring(false); setSelectedWeekDays([]); setEndDate(undefined);
            setLocationType('internal'); setAddress(''); setExercises([]);
        } else {
            if (!initialDate) setSelectedDate(undefined);
            if (!initialTime) setSelectedTime('');
            if (!initialStudentId) setSelectedStudent('');
            setTrainingName(''); setSelectedStudents([]);
            setSelectedInstructor(''); setSelectedRoom('');
            setSelectedDuration('60');
            setActivityType('Hipertrofia'); setIsMakeup(false); setForceSchedule(false);
            setIsRecurring(false); setSelectedWeekDays([]); setEndDate(undefined);
            setLocationType('internal'); setAddress(''); setExercises([]);
        }
    }

    async function handleSubmit() {
        if (!trainingName || !selectedDate || !selectedTime || !selectedDuration) {
            toast({ title: 'Campos obrigatórios', description: 'Por favor, preencha todos os campos básicos.', variant: 'destructive' }); return;
        }

        if (modality === 'individual') {
            if (!selectedStudent) {
                toast({ title: 'Aluno obrigatório', description: 'Selecione um aluno.', variant: 'destructive' }); return;
            }
        } else {
            if (!selectedInstructor) {
                toast({ title: 'Instrutor obrigatório', description: 'Selecione um instrutor.', variant: 'destructive' }); return;
            }
            if (locationType === 'internal' && !selectedRoom) {
                toast({ title: 'Local obrigatório', description: 'Selecione uma sala interna.', variant: 'destructive' }); return;
            }
            if (locationType === 'external' && !address) {
                toast({ title: 'Endereço obrigatório', description: 'Digite o endereço.', variant: 'destructive' }); return;
            }
            if (selectedStudents.length === 0) {
                toast({ title: 'Alunos obrigatórios', description: 'Selecione pelo menos 1 aluno.', variant: 'destructive' }); return;
            }
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');
            const { data: userData } = await (supabase as any).from('profiles').select('organization_id').eq('id', user.id).single();
            if (!userData?.organization_id) throw new Error('Organização não encontrada');

            const processDates = (dateStr: Date) => {
                const sd = new Date(dateStr);
                const [hours, minutes] = selectedTime.split(':').map(Number);
                sd.setHours(hours, minutes, 0, 0);
                const ed = new Date(sd);
                ed.setMinutes(ed.getMinutes() + parseInt(selectedDuration));
                return { start: sd.toISOString(), end: ed.toISOString() };
            };

            // --- INDIVIDUAL MODE (WORKOUTS TABLE) ---
            if (modality === 'individual') {
                const basePayload = {
                    title: trainingName,
                    type: activityType,
                    status: 'Agendado',
                    student_id: selectedStudent,
                    organization_id: userData.organization_id,
                    unit_id: currentUnitId,
                    is_makeup: isMakeup,
                    credit_cost: isMakeup ? 0 : 1,
                };

                const insertWorkout = async (date: Date, recurrenceId?: string) => {
                    const { start, end } = processDates(date);
                    const { data, error } = await (supabase as any).from('workouts').insert({
                        ...basePayload,
                        scheduled_at: start,
                        end_time: end,
                        recurrence_id: recurrenceId,
                        unit_id: currentUnitId
                    }).select();
                    if (error) throw error;
                    return data;
                };

                const saveLinkedExercises = async (workoutId: string) => {
                    const validExercises = exercises.filter(ex => ex.name.trim() !== '');
                    if (validExercises.length > 0) {
                        const exercisePayloads = validExercises.map(ex => ({
                            workout_id: workoutId,
                            exercise_id: ex.exercise_id,
                            sets: ex.sets,
                            reps: ex.reps,
                            weight: ex.weight || '0',
                            unit_id: currentUnitId,
                            notes: ''
                        }));
                        const { error: exError } = await (supabase as any).from('workout_exercises').insert(exercisePayloads);
                        if (exError) console.error("Error saving linked exercises:", exError);
                    }
                };

                if (isRecurring && endDate && selectedWeekDays.length > 0) {
                    const recurrenceId = crypto.randomUUID();
                    let current = new Date(selectedDate);
                    const end = new Date(endDate);
                    let count = 0;
                    while (current <= end) {
                        if (selectedWeekDays.includes(current.getDay())) {
                            const workout = await insertWorkout(current, recurrenceId);
                            if (workout) await saveLinkedExercises(workout[0].id);
                            count++;
                        }
                        current = addDays(current, 1);
                    }
                    toast({ title: 'Sucesso', description: `${count} treinos agendados.` });
                } else {
                    if (eventId) {
                        const { start, end } = processDates(selectedDate);
                        const { error } = await (supabase as any).from('workouts').update({
                            ...basePayload,
                            scheduled_at: start,
                            end_time: end
                        }).eq('id', eventId);
                        if (error) throw error;
                        toast({ title: 'Sucesso', description: 'Treino atualizado.' });
                    } else {
                        // Plan limit guard (skip for makeup or force override)
                        if (!isMakeup && !forceSchedule) {
                            const dateStr = selectedDate.toISOString().split('T')[0];
                            const limitCheck = await checkStudentScheduleLimits(selectedStudent, dateStr);
                            if (!limitCheck.allowed) {
                                throw new Error(limitCheck.message);
                            }
                        }
                        const workout = await insertWorkout(selectedDate);
                        if (workout) await saveLinkedExercises(workout[0].id);
                        toast({ title: 'Sucesso', description: 'Treino agendado.' });
                    }
                }
            }

            // --- GROUP MODE (CALENDAR_EVENTS TABLE) ---
            else {
                const baseEvent = {
                    title: trainingName,
                    instructor_id: selectedInstructor,
                    room_id: locationType === 'internal' ? selectedRoom : null,
                    address: locationType === 'external' ? address : null,
                    organization_id: userData.organization_id,
                    unit_id: currentUnitId,
                    status: 'SCHEDULED',
                };

                const { start, end } = processDates(selectedDate);
                const eventPayload = {
                    ...baseEvent,
                    start_datetime: start,
                    end_datetime: end,
                    type: 'CLASS',
                    capacity: null,
                };

                if (eventId) {
                    const { error } = await (supabase as any).from('calendar_events').update(eventPayload).eq('id', eventId);
                    if (error) throw error;
                    toast({ title: 'Sucesso', description: 'Aula atualizada.' });
                } else {
                    const { data: eventData, error: eventError } = await (supabase as any).from('calendar_events').insert(eventPayload).select().single();
                    if (eventError) throw eventError;

                    if (eventData && selectedStudents.length > 0) {
                        const attendances = selectedStudents.map(studentId => ({
                            event_id: eventData.id,
                            student_id: studentId,
                            organization_id: userData.organization_id,
                            unit_id: currentUnitId,
                            status: 'CONFIRMED'
                        }));
                        await ((supabase as any).from('event_enrollments') as any).insert(attendances);
                    }
                    toast({ title: 'Sucesso', description: 'Aula criada.' });
                }
            }

            resetForm();
            onSuccess?.();
            onOpenChange(false);

        } catch (error: any) {
            console.error('Error submitting:', error);
            toast({ title: 'Erro', description: error.message || 'Erro ao salvar.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }

    const studentOptions = students.map(s => ({ value: s.id, label: s.name }));

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[650px] flex flex-col h-full overflow-y-auto p-0 gap-0">
                <SheetHeader className="relative p-0 mb-8 mt-[-24px] mx-[-24px] overflow-hidden rounded-t-[2rem]">
                    <div className="absolute inset-0 bg-gradient-to-r from-bee-midnight via-slate-900 to-bee-midnight" />
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-bee-amber/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-bee-amber/5 rounded-full blur-3xl" />

                    <div className="relative px-8 pt-10 pb-8 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-bee-amber to-amber-600 p-[1px] shadow-lg shadow-bee-amber/20 group animate-in zoom-in-50 duration-500">
                                    <div className="flex h-full w-full items-center justify-center rounded-[15px] bg-bee-midnight/90 backdrop-blur-xl transition-colors group-hover:bg-bee-midnight/40">
                                        <Dumbbell className="h-7 w-7 text-bee-amber animate-pulse" />
                                    </div>
                                </div>
                                <div>
                                    <SheetTitle className="text-3xl font-black text-white tracking-tight leading-none font-display mb-2">
                                        {eventId ? 'Editar ' : 'Novo '}
                                        {modality === 'individual' ? 'Treino' : modality === 'group' ? 'Aula em Grupo' : 'Aula Aberta'}
                                    </SheetTitle>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <Badge variant="outline" className="bg-bee-amber/10 text-bee-amber border-bee-amber/30 font-bold uppercase tracking-wider text-[10px] px-2.5 py-0.5 rounded-full font-sans">
                                            Agendamento
                                        </Badge>
                                        <div className="h-1 w-1 rounded-full bg-slate-700" />
                                        <span className="flex items-center gap-1.5 text-slate-400 font-bold text-[11px] uppercase tracking-wider font-sans">
                                            Preencha os detalhes abaixo
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-bee-amber/20 to-transparent" />
                </SheetHeader>

                {dataLoading ? (
                    <div className="flex flex-col items-center justify-center flex-1 h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="mt-2 text-sm text-muted-foreground">Carregando...</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-6">

                        {/* MODALITY SELECTOR (Only if creating new) */}
                        {!eventId && eventKind === 'workout' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div
                                    className={cn(
                                        "cursor-pointer rounded-xl border-2 p-4 transition-all hover:bg-accent/50",
                                        modality === 'individual' ? "border-primary bg-primary/5" : "border-muted"
                                    )}
                                    onClick={() => setModality('individual')}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <User className="h-5 w-5 text-primary" />
                                        <span className="font-medium text-sm">Individual</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Para um único aluno</p>
                                </div>

                                <div
                                    className={cn(
                                        "cursor-pointer rounded-xl border-2 p-4 transition-all hover:bg-accent/50",
                                        modality === 'group' ? "border-primary bg-primary/5" : "border-muted"
                                    )}
                                    onClick={() => setModality('group')}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <UsersIcon className="h-5 w-5 text-primary" />
                                        <span className="font-medium text-sm">Em Grupo</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Turma com lista de alunos</p>
                                </div>
                            </div>
                        )}

                        {/* INDIVIDUAL FORM */}
                        {modality === 'individual' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Aluno</Label>
                                    <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                                        <SelectTrigger className="w-full bg-white h-11 text-[11px] font-bold uppercase tracking-wider border-slate-100 shadow-sm rounded-lg focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                                            <SelectValue placeholder="Selecione um aluno" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {students.map((student) => (
                                                <SelectItem key={student.id} value={student.id}>
                                                    {student.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Modalidade</Label>
                                    <Select value={activityType} onValueChange={setActivityType}>
                                        <SelectTrigger className="w-full bg-white h-11 text-[11px] font-bold uppercase tracking-wider border-slate-100 shadow-sm rounded-lg focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                                            <SelectValue placeholder="Selecione o tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Hipertrofia">Hipertrofia</SelectItem>
                                            <SelectItem value="Musculação">Musculação</SelectItem>
                                            <SelectItem value="Cardio">Cardio</SelectItem>
                                            <SelectItem value="Crossfit">Crossfit</SelectItem>
                                            <SelectItem value="Pilates">Pilates</SelectItem>
                                            <SelectItem value="Yoga">Yoga</SelectItem>
                                            <SelectItem value="Natação">Natação</SelectItem>
                                            <SelectItem value="Boxe">Boxe</SelectItem>
                                            <SelectItem value="Jiu-Jitsu">Jiu-Jitsu</SelectItem>
                                            <SelectItem value="Muay Thai">Muay Thai</SelectItem>
                                            <SelectItem value="Zumba">Zumba</SelectItem>
                                            <SelectItem value="Spinning">Spinning</SelectItem>
                                            <SelectItem value="Funcional">Funcional</SelectItem>
                                            <SelectItem value="Alongamento">Alongamento</SelectItem>
                                            <SelectItem value="Reabilitação">Reabilitação</SelectItem>
                                            <SelectItem value="Avaliação Física">Avaliação Física</SelectItem>
                                            <SelectItem value="Personal Training">Personal Training</SelectItem>
                                            <SelectItem value="Outro">Outro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center gap-4 pt-2">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="makeup"
                                            checked={isMakeup}
                                            onCheckedChange={(c) => setIsMakeup(!!c)}
                                        />
                                        <label htmlFor="makeup" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Aula de Reposição
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="force"
                                            checked={forceSchedule}
                                            onCheckedChange={(c) => setForceSchedule(!!c)}
                                        />
                                        <label htmlFor="force" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Forçar Agendamento
                                        </label>
                                    </div>
                                </div>

                                {/* Exercises Section for Individual Workout */}
                                <div className="space-y-4 pt-4 border-t">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-bold flex items-center gap-2">
                                            <Dumbbell className="h-4 w-4 text-orange-500" /> Exercícios
                                        </Label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setExercises([...exercises, { name: '', exercise_id: null, sets: 3, reps: '10', weight: '0' }])}
                                            className="h-10 text-xs border-orange-200 text-orange-600 hover:bg-amber-50"
                                        >
                                            <Plus className="h-3 w-3 mr-1" /> Adicionar
                                        </Button>
                                    </div>

                                    <div className="space-y-3">
                                        {exercises.map((ex, idx) => (
                                            <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl relative group">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newEx = [...exercises];
                                                        newEx.splice(idx, 1);
                                                        setExercises(newEx);
                                                    }}
                                                    className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>

                                                <div className="mb-3 pr-8">
                                                    <Label className="text-[11px] uppercase font-bold text-slate-500 mb-1 block">Nome</Label>
                                                    <ExerciseSearch
                                                        value={ex.name}
                                                        onChange={(id, name) => {
                                                            const newEx = [...exercises];
                                                            newEx[idx].name = name;
                                                            newEx[idx].exercise_id = id;
                                                            setExercises(newEx);
                                                        }}
                                                    />
                                                </div>

                                                <div className="grid grid-cols-3 gap-3">
                                                    <div>
                                                        <Label className="text-[11px] uppercase font-bold text-slate-500 mb-1 block">Séries</Label>
                                                        <Input
                                                            type="number"
                                                            className="h-11 text-sm"
                                                            value={ex.sets}
                                                            onChange={(e) => {
                                                                const newEx = [...exercises];
                                                                newEx[idx].sets = parseInt(e.target.value) || 0;
                                                                setExercises(newEx);
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-[11px] uppercase font-bold text-slate-500 mb-1 block">Reps</Label>
                                                        <Input
                                                            type="text"
                                                            className="h-11 text-sm"
                                                            value={ex.reps}
                                                            onChange={(e) => {
                                                                const newEx = [...exercises];
                                                                newEx[idx].reps = e.target.value;
                                                                setExercises(newEx);
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-[11px] uppercase font-bold text-slate-500 mb-1 block">Carga</Label>
                                                        <Input
                                                            type="text"
                                                            className="h-11 text-sm"
                                                            value={ex.weight}
                                                            onChange={(e) => {
                                                                const newEx = [...exercises];
                                                                newEx[idx].weight = e.target.value;
                                                                setExercises(newEx);
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* GROUP FORM */}
                        {(modality === 'group') && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Nome do Treino / Aula</Label>
                                    <Input
                                        placeholder="Ex: Treino Funcional Manhã"
                                        value={trainingName}
                                        onChange={(e) => setTrainingName(e.target.value)}
                                        className="bg-background border-input/60 h-11"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Instrutor</Label>
                                        <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
                                            <SelectTrigger className="h-11 bg-white text-[11px] font-bold uppercase tracking-wider border-slate-100 shadow-sm rounded-lg focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                                                <SelectValue placeholder="Selecione" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {instructors.map((instructor) => (
                                                    <SelectItem key={instructor.id} value={instructor.id}>
                                                        {instructor.full_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between mb-2">
                                            <Label className="text-sm font-medium">Local</Label>
                                            <div className="flex items-center gap-2">
                                                <span className={cn("text-xs cursor-pointer", locationType === 'internal' ? "font-bold text-primary" : "text-muted-foreground")} onClick={() => setLocationType('internal')}>Interno</span>
                                                <Switch
                                                    checked={locationType === 'external'}
                                                    onCheckedChange={(checked) => setLocationType(checked ? 'external' : 'internal')}
                                                    className="h-4 w-7"
                                                />
                                                <span className={cn("text-xs cursor-pointer", locationType === 'external' ? "font-bold text-primary" : "text-muted-foreground")} onClick={() => setLocationType('external')}>Externo</span>
                                            </div>
                                        </div>

                                        {locationType === 'internal' ? (
                                            <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                                                <SelectTrigger className="h-11 bg-white text-[11px] font-bold uppercase tracking-wider border-slate-100 shadow-sm rounded-lg focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                                                    <SelectValue placeholder="Selecione sala" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {rooms.map((room) => (
                                                        <SelectItem key={room.id} value={room.id}>
                                                            {room.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Endereço ou local externo"
                                                    className="pl-9 bg-background border-input/60 h-11"
                                                    value={address}
                                                    onChange={(e) => setAddress(e.target.value)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {modality === 'group' && (
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Alunos</Label>
                                        <MultiSelect
                                            options={studentOptions}
                                            selected={selectedStudents}
                                            onChange={setSelectedStudents}
                                            placeholder="Selecione os alunos"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        <Separator />

                        {/* SHARED FIELDS (Date, Time, Duration, Name if individual) */}
                        <div className="space-y-4">
                            {!trainingName && modality === 'individual' && <div className="space-y-2">
                                <Label className="font-sans font-medium text-sm text-deep-midnight">Nome do Treino *</Label>
                                <Input placeholder="Ex: Treino A" value={trainingName} onChange={(e) => setTrainingName(e.target.value)} className="h-11" />
                            </div>}

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="font-sans font-medium text-sm text-deep-midnight">Data *</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn('w-full h-11 justify-start text-left font-normal', !selectedDate && 'text-muted-foreground')}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {selectedDate ? format(selectedDate, 'PPP', { locale: ptBR }) : 'Selecione'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-sans font-medium text-sm text-deep-midnight">Horário *</Label>
                                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                                        <SelectTrigger className="h-11 bg-white text-[11px] font-bold uppercase tracking-wider border-slate-100 shadow-sm rounded-lg focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200"><SelectValue placeholder="Hrs" /></SelectTrigger>
                                        <SelectContent className="max-h-[200px]">{TIME_SLOTS.map(t => (<SelectItem key={t} value={t}>{t}</SelectItem>))}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-sans font-medium text-sm text-deep-midnight">Duração *</Label>
                                    <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                                        <SelectTrigger className="h-11 bg-white text-[11px] font-bold uppercase tracking-wider border-slate-100 shadow-sm rounded-lg focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200"><SelectValue placeholder="Min" /></SelectTrigger>
                                        <SelectContent>{DURATION_OPTIONS.map(o => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                <SheetFooter className="p-8 bg-slate-50/50 backdrop-blur-sm border-t gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="h-10 rounded-full font-bold text-slate-400 hover:text-slate-600 transition-all uppercase tracking-wider text-xs"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 h-10 rounded-full bg-bee-amber hover:bg-bee-amber/90 text-bee-midnight font-black shadow-lg shadow-bee-amber/20 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider text-xs"
                    >
                        {loading ? 'Salvando...' : (eventId ? 'Salvar Alterações' : 'Salvar')}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
