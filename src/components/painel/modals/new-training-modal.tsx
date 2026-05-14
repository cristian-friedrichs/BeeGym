'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { MultiSelect } from '@/components/ui/multi-select';
import { checkStudentScheduleLimits } from '@/actions/aulas';
import { CalendarIcon, Users as UsersIcon, User, Dumbbell, MapPin, Plus, Trash2, Loader2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ExerciseSearch } from '@/components/treinos/exercise-search';
import { useUnit } from '@/context/UnitContext';

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
interface ModalityTemplate { id: string; title: string; duration_minutes: number; color: string; }

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
    { value: '90', label: '1h 30min' },
];

const ACTIVITY_TYPES = [
    'Hipertrofia', 'Musculação', 'Cardio', 'Crossfit', 'Pilates', 'Yoga',
    'Natação', 'Boxe', 'Jiu-Jitsu', 'Muay Thai', 'Zumba', 'Spinning',
    'Funcional', 'Alongamento', 'Reabilitação', 'Avaliação Física',
    'Personal Training', 'Outro',
];

const fieldCls = 'h-9 rounded-xl border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:border-bee-amber focus:ring-2 focus:ring-bee-amber/20 focus:ring-offset-0';
const labelCls = 'text-sm font-medium text-slate-700';

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
    const { organizationId } = useAuth();
    const { currentUnitId } = useUnit();
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(false);

    const [modality, setModality] = useState<Modality>(eventKind === 'workout' ? 'individual' : 'group');

    const [students, setStudents] = useState<Student[]>([]);
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [modalities, setModalities] = useState<ModalityTemplate[]>([]);

    const [trainingName, setTrainingName] = useState('');
    const [selectedStudent, setSelectedStudent] = useState('');
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [selectedInstructor, setSelectedInstructor] = useState('');
    const [selectedRoom, setSelectedRoom] = useState('');
    const [selectedModalityId, setSelectedModalityId] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
    const [selectedTime, setSelectedTime] = useState(initialTime || '');
    const [selectedDuration, setSelectedDuration] = useState('60');

    const [activityType, setActivityType] = useState('Hipertrofia');
    const [isMakeup, setIsMakeup] = useState(false);
    const [forceSchedule, setForceSchedule] = useState(false);

    const [locationType, setLocationType] = useState<'internal' | 'external'>('internal');
    const [address, setAddress] = useState('');

    const [isRecurring, setIsRecurring] = useState(false);
    const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([]);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);
    const [datePickerOpen, setDatePickerOpen] = useState(false);

    const [exercises, setExercises] = useState<{ name: string; exercise_id: string | null; sets: number; reps: string; weight: string; }[]>([]);

    useEffect(() => {
        if (open) {
            fetchData();
            if (eventId) {
                fetchEventDetails(eventId);
            } else {
                if (initialDate) setSelectedDate(initialDate);
                if (initialTime) setSelectedTime(initialTime);
                if (initialStudentId) setSelectedStudent(initialStudentId);
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
        if (!organizationId) return;
        try {
            const { data: studentsData } = await (supabase as any).from('students').select('id, full_name').eq('organization_id', organizationId).eq('status', 'ACTIVE').order('full_name');
            if (studentsData) setStudents((studentsData as any[]).map(s => ({ id: s.id, name: s.full_name })));

            const { data: instructorsData } = await (supabase as any).from('profiles').select('id, full_name').eq('organization_id', organizationId).order('full_name');
            if (instructorsData) setInstructors(instructorsData as any[]);

            const { data: roomsData } = await (supabase as any).from('rooms').select('id, name, capacity').eq('organization_id', organizationId).order('name');
            if (roomsData) setRooms(roomsData.map((r: any) => ({ ...r, capacity: r.capacity || 0 })));

            const { data: modalitiesData } = await (supabase as any).from('class_templates').select('id, title, duration_minutes, color').eq('organization_id', organizationId).order('title');
            if (modalitiesData) setModalities(modalitiesData as ModalityTemplate[]);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({ title: 'Erro ao carregar dados', variant: 'destructive' });
        }
    }

    async function fetchEventDetails(id: string) {
        setDataLoading(true);
        try {
            if (eventKind === 'workout') {
                const { data: workout, error } = await (supabase as any).from('workouts').select('*').eq('id', id).single();
                if (error) throw error;
                if (workout) {
                    setTrainingName(workout.title);
                    setActivityType(workout.type || 'Hipertrofia');
                    setSelectedStudent(workout.student_id);
                    setIsMakeup(workout.is_makeup || false);
                    setModality('individual');
                    setSelectedInstructor('');
                    setSelectedRoom('');
                    if (workout.scheduled_at) {
                        const startDate = new Date(workout.scheduled_at);
                        setSelectedDate(startDate);
                        setSelectedTime(format(startDate, 'HH:mm'));
                        if (workout.end_time) {
                            const endDate = new Date(workout.end_time);
                            setSelectedDuration(Math.round((endDate.getTime() - startDate.getTime()) / 60000).toString());
                        }
                    }
                }
            } else {
                const { data: event, error } = await (supabase as any)
                    .from('calendar_events')
                    .select(`*, enrollments:event_enrollments(student_id, status)`)
                    .eq('id', id)
                    .single();
                if (error) throw error;
                if (event) {
                    setTrainingName(event.title);
                    setSelectedInstructor(event.instructor_id || '');
                    setSelectedModalityId(event.class_template_id || '');
                    setActivityType(event.event_type || 'Funcional');
                    if (event.room_id) { setLocationType('internal'); setSelectedRoom(event.room_id); }
                    else if (event.address) { setLocationType('external'); setAddress(event.address); }
                    if (event.start_datetime) {
                        const startDate = new Date(event.start_datetime);
                        setSelectedDate(startDate);
                        setSelectedTime(format(startDate, 'HH:mm'));
                        if (event.end_datetime) {
                            const endDate = new Date(event.end_datetime);
                            setSelectedDuration(Math.round((endDate.getTime() - startDate.getTime()) / 60000).toString());
                        }
                    }
                    const enrollments = event.enrollments || [];
                    setModality('group');
                    setSelectedStudents(enrollments.map((e: any) => e.student_id));
                }
            }
        } catch (error) {
            console.error('Error fetching event details:', error);
            toast({ title: 'Erro ao carregar evento', variant: 'destructive' });
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
            setSelectedModalityId('');
        } else {
            if (!initialDate) setSelectedDate(undefined);
            if (!initialTime) setSelectedTime('');
            if (!initialStudentId) setSelectedStudent('');
            setTrainingName(''); setSelectedStudents([]);
            setSelectedInstructor(''); setSelectedRoom(''); setSelectedDuration('60');
            setActivityType('Hipertrofia'); setIsMakeup(false); setForceSchedule(false);
            setIsRecurring(false); setSelectedWeekDays([]); setEndDate(undefined);
            setLocationType('internal'); setAddress(''); setExercises([]);
            setSelectedModalityId('');
        }
    }

    async function handleSubmit() {
        if (!trainingName || !selectedDate || !selectedTime || !selectedDuration) {
            toast({ title: 'Campos obrigatórios', description: 'Preencha todos os campos básicos.', variant: 'destructive' }); return;
        }
        if (modality === 'individual') {
            if (!selectedStudent) { toast({ title: 'Selecione um aluno', variant: 'destructive' }); return; }
        } else {
            if (!selectedInstructor) { toast({ title: 'Selecione um instrutor', variant: 'destructive' }); return; }
            if (locationType === 'internal' && !selectedRoom) { toast({ title: 'Selecione uma sala', variant: 'destructive' }); return; }
            if (locationType === 'external' && !address) { toast({ title: 'Digite o endereço', variant: 'destructive' }); return; }
            if (selectedStudents.length === 0) { toast({ title: 'Selecione pelo menos 1 aluno', variant: 'destructive' }); return; }
        }

        setLoading(true);
        try {
            if (!organizationId) throw new Error('Organização não encontrada');

            const processDates = (dateSource: Date) => {
                // Cria uma nova data baseada no dia selecionado (local)
                const sd = new Date(dateSource);
                const [hours, minutes] = selectedTime.split(':').map(Number);
                
                // Define as horas e minutos no fuso local do navegador
                sd.setHours(hours, minutes, 0, 0);
                
                const ed = new Date(sd);
                ed.setMinutes(ed.getMinutes() + parseInt(selectedDuration));
                
                // Envia como string ISO que preserva o instante exato. 
                // O timestamptz do Postgres converterá para UTC corretamente.
                return {
                    start: sd.toISOString(),
                    end: ed.toISOString()
                };
            };

            if (modality === 'individual') {
                const basePayload = {
                    title: trainingName, type: activityType, status: 'Agendado',
                    student_id: selectedStudent, organization_id: organizationId,
                    unit_id: currentUnitId, is_makeup: isMakeup, credit_cost: isMakeup ? 0 : 1,
                };

                const insertWorkout = async (date: Date, recurrenceId?: string) => {
                    const { start, end } = processDates(date);
                    const { data, error } = await (supabase as any).from('workouts').insert({ ...basePayload, scheduled_at: start, end_time: end, recurrence_id: recurrenceId, unit_id: currentUnitId }).select();
                    if (error) throw error;
                    return data;
                };

                const saveLinkedExercises = async (workoutId: string) => {
                    const validExercises = exercises.filter(ex => ex.name.trim() !== '');
                    if (validExercises.length > 0) {
                        const exercisePayloads = validExercises.map(ex => ({ workout_id: workoutId, exercise_id: ex.exercise_id, sets: ex.sets, reps: ex.reps, weight: ex.weight || '0', unit_id: currentUnitId, notes: '' }));
                        const { error: exError } = await (supabase as any).from('workout_exercises').insert(exercisePayloads);
                        if (exError) console.error('Error saving linked exercises:', exError);
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
                        const { error } = await (supabase as any).from('workouts').update({ ...basePayload, scheduled_at: start, end_time: end }).eq('id', eventId);
                        if (error) throw error;
                        toast({ title: 'Treino atualizado.' });
                    } else {
                        if (!isMakeup && !forceSchedule) {
                            const dateStr = format(selectedDate, 'yyyy-MM-dd');
                            const limitCheck = await checkStudentScheduleLimits(selectedStudent, dateStr);
                            if (!limitCheck.allowed) throw new Error(limitCheck.message);
                        }
                        const workout = await insertWorkout(selectedDate);
                        if (workout) await saveLinkedExercises(workout[0].id);
                        toast({ title: 'Treino agendado.' });
                    }
                }
            } else {
                const baseEvent = {
                    title: trainingName, instructor_id: selectedInstructor,
                    room_id: locationType === 'internal' ? selectedRoom : null,
                    class_template_id: selectedModalityId || null,
                    address: locationType === 'external' ? address : null,
                    organization_id: organizationId, unit_id: currentUnitId, status: 'SCHEDULED',
                };
                const { start, end } = processDates(selectedDate);
                const eventPayload = { 
                    ...baseEvent, 
                    start_datetime: start, 
                    end_datetime: end, 
                    type: 'TRAINING', 
                    event_type: activityType,
                    capacity: selectedStudents.length || null 
                };

                if (eventId) {
                    const { error } = await (supabase as any).from('calendar_events').update(eventPayload).eq('id', eventId);
                    if (error) throw error;
                    toast({ title: 'Treino em grupo atualizado.' });
                } else {
                    const { data: eventData, error: eventError } = await (supabase as any).from('calendar_events').insert(eventPayload).select().single();
                    if (eventError) throw eventError;
                    if (eventData && selectedStudents.length > 0) {
                        const attendances = selectedStudents.map(studentId => ({ event_id: eventData.id, student_id: studentId, organization_id: organizationId, unit_id: currentUnitId, status: 'CONFIRMED' }));
                        await ((supabase as any).from('event_enrollments') as any).insert(attendances);
                    }
                    toast({ title: 'Treino em grupo criado.' });
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
    const isEditing = !!eventId;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl bg-white rounded-3xl">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-50">
                    <DialogTitle className="text-xl font-bold text-slate-900">
                        {isEditing ? 'Editar Treino' : modality === 'individual' ? 'Novo Treino' : 'Novo Treino em Grupo'}
                    </DialogTitle>
                    <DialogDescription className="text-slate-500">
                        {isEditing ? 'Atualize os detalhes do agendamento.' : 'Agende uma sessão para um ou mais alunos.'}
                    </DialogDescription>
                </DialogHeader>

                {dataLoading ? (
                    <div className="flex items-center justify-center py-16 gap-2 text-slate-500 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
                    </div>
                ) : (
                    <div className="px-6 py-5 space-y-4 max-h-[72vh] overflow-y-auto">

                        {/* Modality selector (only for new workouts) */}
                        {!isEditing && eventKind === 'workout' && (
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setModality('individual')}
                                    className={cn(
                                        'flex items-center gap-2.5 rounded-xl border px-4 py-3 text-left transition-colors',
                                        modality === 'individual'
                                            ? 'border-bee-amber bg-bee-amber/5 text-bee-midnight'
                                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                    )}
                                >
                                    <User className="h-4 w-4 shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium leading-tight">Individual</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Para um único aluno</p>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setModality('group')}
                                    className={cn(
                                        'flex items-center gap-2.5 rounded-xl border px-4 py-3 text-left transition-colors',
                                        modality === 'group'
                                            ? 'border-bee-amber bg-bee-amber/5 text-bee-midnight'
                                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                    )}
                                >
                                    <UsersIcon className="h-4 w-4 shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium leading-tight">Em grupo</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Para turma de alunos</p>
                                    </div>
                                </button>
                            </div>
                        )}

                        {/* ─── INDIVIDUAL FORM ─────────────────────────────── */}
                        {modality === 'individual' && (
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className={labelCls}>Nome do treino *</Label>
                                    <Input
                                        placeholder="Ex: Treino A — Peito e Tríceps"
                                        value={trainingName}
                                        onChange={e => setTrainingName(e.target.value)}
                                        className={fieldCls}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className={labelCls}>Aluno *</Label>
                                        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                                            <SelectTrigger className={fieldCls}>
                                                <SelectValue placeholder="Selecione…" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {students.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className={labelCls}>Modalidade</Label>
                                        <Select value={activityType} onValueChange={setActivityType}>
                                            <SelectTrigger className={fieldCls}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-56">
                                                {modalities.length > 0 ? (
                                                    modalities.map(m => <SelectItem key={m.id} value={m.title}>{m.title}</SelectItem>)
                                                ) : (
                                                    ACTIVITY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex items-center gap-5 pt-0.5">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <Checkbox checked={isMakeup} onCheckedChange={c => setIsMakeup(!!c)} />
                                        <span className="text-sm text-slate-600">Aula de reposição</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <Checkbox checked={forceSchedule} onCheckedChange={c => setForceSchedule(!!c)} />
                                        <span className="text-sm text-slate-600">Forçar agendamento</span>
                                    </label>
                                </div>

                                {/* Exercises */}
                                <div className="space-y-3 pt-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <Dumbbell className="h-4 w-4 text-slate-400" />
                                            <span className="text-sm font-medium text-slate-700">Exercícios</span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setExercises([...exercises, { name: '', exercise_id: null, sets: 3, reps: '10', weight: '0' }])}
                                            className="h-7 text-xs text-bee-amber hover:text-amber-600 hover:bg-bee-amber/5 gap-1"
                                        >
                                            <Plus className="h-3 w-3" /> Adicionar
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        {exercises.map((ex, idx) => (
                                            <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3 relative">
                                                <button
                                                    type="button"
                                                    onClick={() => { const n = [...exercises]; n.splice(idx, 1); setExercises(n); }}
                                                    className="absolute top-2.5 right-2.5 p-1 text-slate-400 hover:text-red-500 rounded"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                                <div className="mb-2 pr-6">
                                                    <Label className="text-xs text-slate-500 mb-1 block">Exercício</Label>
                                                    <ExerciseSearch
                                                        value={ex.name}
                                                        onChange={(id, name) => {
                                                            const n = [...exercises];
                                                            n[idx].name = name;
                                                            n[idx].exercise_id = id;
                                                            setExercises(n);
                                                        }}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {[
                                                        { label: 'Séries', key: 'sets' as const, type: 'number' },
                                                        { label: 'Reps', key: 'reps' as const, type: 'text' },
                                                        { label: 'Carga', key: 'weight' as const, type: 'text' },
                                                    ].map(f => (
                                                        <div key={f.key}>
                                                            <Label className="text-xs text-slate-500 mb-1 block">{f.label}</Label>
                                                            <Input
                                                                type={f.type}
                                                                className="h-8 rounded-lg border-slate-200 bg-white text-sm"
                                                                value={ex[f.key]}
                                                                onChange={e => {
                                                                    const n = [...exercises];
                                                                    (n[idx] as any)[f.key] = f.key === 'sets' ? (parseInt(e.target.value) || 0) : e.target.value;
                                                                    setExercises(n);
                                                                }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ─── GROUP FORM ───────────────────────────────────── */}
                        {modality === 'group' && (
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className={labelCls}>Nome do treino *</Label>
                                    <Input
                                        placeholder="Ex: Treino Funcional Manhã"
                                        value={trainingName}
                                        onChange={e => setTrainingName(e.target.value)}
                                        className={fieldCls}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className={labelCls}>Instrutor *</Label>
                                        <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
                                            <SelectTrigger className={fieldCls}>
                                                <SelectValue placeholder="Selecione…" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {instructors.map(i => <SelectItem key={i.id} value={i.id}>{i.full_name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <Label className={labelCls}>Local</Label>
                                            <div className="flex items-center gap-1.5">
                                                <span className={cn('text-xs cursor-pointer', locationType === 'internal' ? 'text-bee-amber font-medium' : 'text-slate-400')} onClick={() => setLocationType('internal')}>Interno</span>
                                                <Switch checked={locationType === 'external'} onCheckedChange={c => setLocationType(c ? 'external' : 'internal')} className="h-4 w-7 data-[state=checked]:bg-bee-amber" />
                                                <span className={cn('text-xs cursor-pointer', locationType === 'external' ? 'text-bee-amber font-medium' : 'text-slate-400')} onClick={() => setLocationType('external')}>Externo</span>
                                            </div>
                                        </div>
                                        {locationType === 'internal' ? (
                                            <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                                                <SelectTrigger className={fieldCls}>
                                                    <SelectValue placeholder="Selecione sala…" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input placeholder="Endereço externo…" className={cn(fieldCls, 'pl-9')} value={address} onChange={e => setAddress(e.target.value)} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className={labelCls}>Alunos *</Label>
                                    <MultiSelect
                                        options={studentOptions}
                                        selected={selectedStudents}
                                        onChange={setSelectedStudents}
                                        placeholder="Selecione os alunos…"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className={labelCls}>Modalidade *</Label>
                                    <Select 
                                        value={selectedModalityId} 
                                        onValueChange={(val) => {
                                            setSelectedModalityId(val);
                                            const mod = modalities.find(m => m.id === val);
                                            if (mod) {
                                                setActivityType(mod.title);
                                                setSelectedDuration(mod.duration_minutes.toString());
                                                if (!trainingName) setTrainingName(mod.title);
                                            }
                                        }}
                                    >
                                        <SelectTrigger className={fieldCls}>
                                            <SelectValue placeholder="Selecione a modalidade…" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-56">
                                            {modalities.map(m => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        <hr className="border-slate-100" />

                        {/* ─── SHARED: Data / Horário / Duração ─────────────── */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Data *</Label>
                                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(fieldCls, 'w-full justify-start font-normal', !selectedDate && 'text-slate-400')}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
                                            {selectedDate ? format(selectedDate, 'P', { locale: ptBR }) : 'Selecione…'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={selectedDate} onSelect={d => { setSelectedDate(d); setDatePickerOpen(false); }} initialFocus locale={ptBR} />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Horário *</Label>
                                <Select value={selectedTime} onValueChange={setSelectedTime}>
                                    <SelectTrigger className={fieldCls}>
                                        <SelectValue placeholder="Hrs…" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-56">
                                        {TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Duração</Label>
                                <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                                    <SelectTrigger className={fieldCls}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DURATION_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                    </div>
                )}

                <DialogFooter className="px-6 pb-6 pt-4 border-t border-slate-50 flex items-center justify-between sm:justify-between">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="rounded-full text-slate-500 hover:text-slate-700 h-9 px-5"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-bee-amber hover:bg-amber-500 text-bee-midnight rounded-full font-bold h-9 px-8 shadow-sm"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            isEditing ? 'Salvar Alterações' : 'Criar Treino'
                        )}
                    </Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
}
