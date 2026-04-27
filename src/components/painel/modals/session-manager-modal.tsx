'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import {
    Calendar as CalendarIcon, Clock, MapPin, Users, CheckCircle2, XCircle,
    Edit, Trash2, Plus, Dumbbell, Save, X, AlertTriangle, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SessionManagerModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    eventId?: string;
    eventName?: string;
    eventDate?: string;
    eventTime?: string;
    endTime?: string;
    location?: string;
    studentIds?: string[];
    onSuccess?: () => void;
}

interface Student { id: string; name: string; avatar_url: string | null; present: boolean; }
interface Exercise { id: string; name: string; muscle_group: string | null; organization_id: string | null; }
interface WorkoutExercise {
    id: string; exercise_id: string; exercise_name: string;
    sets: number; reps: string; weight_kg: number; rest_seconds: number; notes: string;
}

export function SessionManagerModal({
    open, onOpenChange, eventId, eventName, eventDate, eventTime, endTime, location, studentIds = [], onSuccess
}: SessionManagerModalProps) {
    const { toast } = useToast();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
    const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
    const [showCreateExercise, setShowCreateExercise] = useState(false);
    const [newExerciseName, setNewExerciseName] = useState('');
    const [newExerciseMuscleGroup, setNewExerciseMuscleGroup] = useState('');
    const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
    const [newDate, setNewDate] = useState<Date | undefined>(undefined);
    const [newTime, setNewTime] = useState('');
    const [showCancelDialog, setShowCancelDialog] = useState(false);

    useEffect(() => {
        if (open && studentIds.length > 0) fetchStudents();
        if (open) { fetchExercises(); fetchWorkoutLogs(); }
    }, [open, studentIds, eventId]);

    async function fetchStudents() {
        try {
            const { data, error } = await (supabase as any).from('students').select('id, full_name').in('id', studentIds);
            if (error) throw error;
            if (data) setStudents((data as any[]).map(s => ({ id: s.id, name: s.full_name, avatar_url: null, present: true })));
        } catch (error) {
            console.error('Error fetching students:', error);
            toast({ title: 'Erro ao carregar alunos', description: 'Não foi possível carregar a lista de alunos.', variant: 'destructive' });
        }
    }

    async function fetchExercises() {
        try {
            const orgId = localStorage.getItem('currentOrganizationId');
            const { data, error } = await (supabase as any).from('exercises').select('*').or(`organization_id.is.null,organization_id.eq.${orgId}`).order('name');
            if (error) throw error;
            if (data) setExercises(data as any);
        } catch (error) {
            console.error('Error fetching exercises:', error);
            toast({ title: 'Erro ao carregar exercícios', description: 'Não foi possível carregar a biblioteca de exercícios.', variant: 'destructive' });
        }
    }

    async function fetchWorkoutLogs() {
        // TODO: Aguardando definição de design do BD para execução de treinos/presença.
        // Tabela `workout_logs` não existe (audit 2026-04-25).
        if (!eventId) return;
        // try {
        //     const { data, error } = await (supabase as any).from('workout_logs').select(`id, exercise_id, sets, reps, notes, exercises ( name )`).eq('event_id', eventId);
        //     if (error) throw error;
        //     if (data && data.length > 0) {
        //         const logs: WorkoutExercise[] = (data as any[]).map(log => ({
        //             id: log.id, exercise_id: log.exercise_id, exercise_name: (log.exercises as any)?.name || 'Exercício',
        //             sets: log.sets || 0, reps: log.reps?.toString() || '', weight_kg: 0, rest_seconds: 0, notes: log.notes || ''
        //         }));
        //         setWorkoutExercises(logs);
        //     }
        // } catch (error) { console.error('Error fetching workout logs:', error); }
    }

    async function handleCreateExercise() {
        if (!newExerciseName.trim() || !newExerciseMuscleGroup.trim()) {
            toast({ title: 'Campos obrigatórios', description: 'Preencha o nome e o grupo muscular do exercício.', variant: 'destructive' }); return;
        }
        try {
            const orgId = localStorage.getItem('currentOrganizationId');
            const { data, error } = await (supabase as any).from('exercises').insert({ name: newExerciseName, muscle_group: newExerciseMuscleGroup, organization_id: orgId }).select().single();
            if (error) throw error;
            if (data) {
                setExercises(prev => [...(prev as any[]), data as any].sort((a: any, b: any) => a.name.localeCompare(b.name)));
                setSelectedExerciseId((data as any).id); setNewExerciseName(''); setNewExerciseMuscleGroup(''); setShowCreateExercise(false);
                toast({ title: 'Exercício criado!', description: `${(data as any).name} foi adicionado à biblioteca.` });
            }
        } catch (error) {
            console.error('Error creating exercise:', error);
            toast({ title: 'Erro ao criar exercício', description: 'Não foi possível criar o exercício. Tente novamente.', variant: 'destructive' });
        }
    }

    function handleAddExercise() {
        if (!selectedExerciseId) { toast({ title: 'Selecione um exercício', description: 'Escolha um exercício da lista antes de adicionar.', variant: 'destructive' }); return; }
        const exercise = exercises.find(e => e.id === selectedExerciseId);
        if (!exercise) return;
        setWorkoutExercises(prev => [...prev, { id: `temp-${Date.now()}`, exercise_id: exercise.id, exercise_name: exercise.name, sets: 3, reps: '10', weight_kg: 0, rest_seconds: 60, notes: '' }]);
        setSelectedExerciseId('');
    }

    function handleRemoveExercise(id: string) { setWorkoutExercises(prev => prev.filter(e => e.id !== id)); }
    function handleUpdateExercise(id: string, field: keyof WorkoutExercise, value: any) { setWorkoutExercises(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e)); }

    async function handleSaveWorkoutLog() {
        if (!eventId || studentIds.length === 0) { toast({ title: 'Erro', description: 'Informações do evento ou aluno não encontradas.', variant: 'destructive' }); return; }
        if (workoutExercises.length === 0) { toast({ title: 'Nenhum exercício', description: 'Adicione pelo menos um exercício antes de salvar.', variant: 'destructive' }); return; }
        setLoading(true);
        try {
            // TODO: Aguardando definição de design do BD para execução de treinos/presença.
            // Tabela `workout_logs` não existe (audit 2026-04-25).
            // await (supabase as any).from('workout_logs').delete().eq('event_id', eventId);
            // const logsToInsert = studentIds.flatMap(studentId => workoutExercises.map(exercise => ({ event_id: eventId, student_id: studentId, exercise_id: exercise.exercise_id, sets: exercise.sets, reps: exercise.reps, notes: exercise.notes })));
            // const { error } = await (supabase as any).from('workout_logs').insert(logsToInsert);
            // if (error) throw error;
            toast({ title: 'Diário salvo!', description: 'Funcionalidade de salvamento desabilitada (aguardando schema do BD).' });
        } catch (error) {
            console.error('Error saving workout log:', error);
            toast({ title: 'Erro ao salvar', description: 'Não foi possível salvar o diário de treino. Tente novamente.', variant: 'destructive' });
        } finally { setLoading(false); }
    }

    function togglePresence(studentId: string) { setStudents(prev => prev.map(s => s.id === studentId ? { ...s, present: !s.present } : s)); }

    async function handleFinalize() {
        if (!eventId) return;
        const unmarked = students.filter(s => s.present === undefined);
        if (unmarked.length > 0) { toast({ title: 'Atenção', description: 'Marque a presença de todos os alunos antes de finalizar.', variant: 'destructive' }); return; }
        setLoading(true);
        try {
            const { error: updateError } = await (supabase as any).from('calendar_events').update({ status: 'COMPLETED' } as any).eq('id', eventId);
            if (updateError) throw updateError;
            for (const student of students) {
                if (student.present) {
                    const { error: creditError } = await (supabase as any).rpc('decrement_student_credits' as any, { p_student_id: student.id, p_amount: 1 });
                    if (creditError) console.error('Error decrementing credits:', creditError);
                }
            }
            toast({ title: 'Treino finalizado!', description: 'O treino foi marcado como concluído.' });
            onSuccess?.(); onOpenChange(false);
        } catch (error) {
            console.error('Error finalizing session:', error);
            toast({ title: 'Erro ao finalizar', description: 'Não foi possível finalizar o treino. Tente novamente.', variant: 'destructive' });
        } finally { setLoading(false); }
    }

    async function handleCancel() {
        if (!eventId) return;
        if (!confirm('Tem certeza que deseja cancelar este treino? Esta ação não pode ser desfeita.')) return;
        setLoading(true);
        try {
            const { error } = await (supabase as any).from('calendar_events').update({ status: 'CANCELED' } as any).eq('id', eventId);
            if (error) throw error;
            toast({ title: 'Treino cancelado', description: 'O treino foi cancelado com sucesso.' });
            onSuccess?.(); onOpenChange(false);
        } catch (error) {
            console.error('Error canceling session:', error);
            toast({ title: 'Erro ao cancelar', description: 'Não foi possível cancelar o treino. Tente novamente.', variant: 'destructive' });
        } finally { setLoading(false); }
    }

    function handleOpenRescheduleDialog() {
        if (eventDate) setNewDate(new Date(eventDate));
        if (eventTime) setNewTime(eventTime);
        setShowRescheduleDialog(true);
    }

    async function handleReschedule() {
        if (!eventId || !newDate || !newTime) { toast({ title: 'Campos obrigatórios', description: 'Selecione a nova data e horário.', variant: 'destructive' }); return; }
        const now = new Date();
        const [hours, minutes] = newTime.split(':').map(Number);
        const scheduledDateTime = new Date(newDate);
        scheduledDateTime.setHours(hours, minutes, 0, 0);
        if (scheduledDateTime < now) { toast({ title: 'Data inválida', description: 'Não é possível reagendar para uma data/hora no passado.', variant: 'destructive' }); return; }
        setLoading(true);
        try {
            const originalDuration = eventTime && endTime ? calculateDuration(eventTime, endTime) : 60;
            const newEndTime = calculateEndTime(newTime, originalDuration);
            const formattedDate = format(newDate!, 'yyyy-MM-dd');
            const { error } = await (supabase as any).from('calendar_events').update({ date: formattedDate, time: newTime, end_time: newEndTime, status: 'SCHEDULED' } as any).eq('id', eventId);
            if (error) throw error;
            toast({ title: 'Treino reagendado!', description: `Novo horário: ${format(newDate!, 'PPP', { locale: ptBR })} às ${newTime}` });
            setShowRescheduleDialog(false); onSuccess?.(); onOpenChange(false);
        } catch (error) {
            console.error('Error rescheduling session:', error);
            toast({ title: 'Erro ao reagendar', description: 'Não foi possível reagendar o treino. Tente novamente.', variant: 'destructive' });
        } finally { setLoading(false); }
    }

    function handleOpenCancelDialog() { setShowCancelDialog(true); }

    async function handleCancelConfirm() {
        if (!eventId) return;
        setLoading(true);
        try {
            const { error } = await (supabase as any).from('calendar_events').update({ status: 'CANCELED' } as any).eq('id', eventId);
            if (error) throw error;
            toast({ title: 'Treino cancelado', description: 'O treino foi cancelado com sucesso. O horário ficou livre na agenda.' });
            setShowCancelDialog(false); onSuccess?.(); onOpenChange(false);
        } catch (error) {
            console.error('Error canceling session:', error);
            toast({ title: 'Erro ao cancelar', description: 'Não foi possível cancelar o treino. Tente novamente.', variant: 'destructive' });
        } finally { setLoading(false); }
    }

    function calculateDuration(startTime: string, eTime: string): number {
        const [sh, sm] = startTime.split(':').map(Number);
        const [eh, em] = eTime.split(':').map(Number);
        return (eh * 60 + em) - (sh * 60 + sm);
    }

    function calculateEndTime(startTime: string, durationMinutes: number): string {
        const [h, m] = startTime.split(':').map(Number);
        const total = h * 60 + m + durationMinutes;
        return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
    }

    const presentCount = students.filter(s => s.present).length;
    const absentCount = students.filter(s => !s.present).length;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-xl p-0 overflow-hidden border-l border-slate-100 shadow-2xl flex flex-col h-full bg-white">
                <SheetHeader className="p-8 border-b relative overflow-hidden shrink-0 bg-white">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-bee-amber/[0.03] rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />

                    <div className="flex items-center gap-5 relative text-left">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-bee-amber/10 bg-bee-amber/5 text-bee-amber shadow-inner">
                            <Users className="h-8 w-8" />
                        </div>
                        <div className="space-y-1">
                            <SheetTitle className="text-2xl font-bold font-display tracking-tight text-bee-midnight leading-tight">
                                Gerenciar Sessão
                            </SheetTitle>
                            <SheetDescription className="flex items-center gap-2 text-sm font-medium text-slate-500">
                                <Badge variant="outline" className="bg-bee-amber/10 text-bee-amber border-bee-amber/30 font-bold uppercase tracking-wider text-[10px] px-2.5 py-0.5 rounded-full font-sans">
                                    Presença
                                </Badge>
                                <span>Controle de presença e treino</span>
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="px-8 py-5 border-b bg-slate-50/50 flex items-center justify-between shrink-0">
                    <div className="space-y-1.5 flex-1 pr-4">
                        <p className="font-display font-bold text-bee-midnight tracking-tight truncate">{eventName}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            <span className="flex items-center gap-1.5"><CalendarIcon className="h-3.5 w-3.5 text-bee-amber" />{eventDate && format(new Date(eventDate), 'dd/MM', { locale: ptBR })}</span>
                            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-bee-amber" />{eventTime} - {endTime}</span>
                            {location && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-bee-amber" />{location}</span>}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleOpenRescheduleDialog}
                            disabled={loading}
                            className="h-10 px-4 rounded-full border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-wider hover:bg-slate-100 transition-all shadow-sm"
                        >
                            <Edit className="h-3.5 w-3.5 mr-2 text-bee-amber" /> Reagendar
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleOpenCancelDialog}
                            disabled={loading}
                            className="h-10 px-4 rounded-full border-red-100 text-red-500 font-bold text-[10px] uppercase tracking-wider hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
                        >
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Cancelar
                        </Button>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4 px-6">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                        <TabsTrigger value="workout">O Treino</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4 mt-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="font-sans font-medium text-sm text-deep-midnight">Lista de Chamada ({students.length} alunos)</Label>
                                <div className="flex gap-2">
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" />{presentCount} Presente{presentCount !== 1 ? 's' : ''}</Badge>
                                    {absentCount > 0 && <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" />{absentCount} Falta{absentCount !== 1 ? 's' : ''}</Badge>}
                                </div>
                            </div>
                            {students.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground"><Users className="h-12 w-12 mx-auto mb-2 opacity-50" /><p className="text-sm">Nenhum aluno cadastrado neste treino.</p></div>
                            ) : (
                                <div className="border rounded-md divide-y">
                                    {students.map(student => (
                                        <div key={student.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10"><AvatarImage src={student.avatar_url || undefined} /><AvatarFallback className="bg-primary/10 text-primary font-semibold">{student.name[0]?.toUpperCase()}</AvatarFallback></Avatar>
                                                <span className="font-sans font-medium">{student.name}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2">
                                                    <Label htmlFor={`presence-${student.id}`} className={cn("text-sm font-medium cursor-pointer", student.present ? "text-green-600" : "text-red-600")}>{student.present ? 'Presente' : 'Falta'}</Label>
                                                    <Switch id={`presence-${student.id}`} checked={student.present} onCheckedChange={() => togglePresence(student.id)} className={cn(student.present ? "data-[state=checked]:bg-green-500" : "data-[state=unchecked]:bg-red-500")} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {absentCount > 0 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                    <p className="text-sm text-yellow-800">⚠️ <strong>{absentCount} aluno{absentCount !== 1 ? 's' : ''} marcado{absentCount !== 1 ? 's' : ''} como falta.</strong>{' '}Isso consumirá {absentCount} crédito{absentCount !== 1 ? 's' : ''} do{absentCount !== 1 ? 's' : ''} plano{absentCount !== 1 ? 's' : ''}.</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="workout" className="space-y-4 mt-4">
                        <div className="space-y-3">
                            <Label className="font-sans font-medium text-sm text-deep-midnight">Adicionar Exercício</Label>
                            {!showCreateExercise ? (
                                <div className="flex gap-2">
                                    <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
                                        <SelectTrigger className="flex-1 h-11 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-lg focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                                            <SelectValue placeholder="Buscar exercício..." />
                                        </SelectTrigger>
                                        <SelectContent>{exercises.map(ex => (<SelectItem key={ex.id} value={ex.id}>{ex.name}{ex.organization_id === null && <Badge variant="outline" className="ml-2 text-xs">Global</Badge>}</SelectItem>))}</SelectContent>
                                    </Select>
                                    <Button onClick={handleAddExercise} disabled={!selectedExerciseId} className="h-10 bg-primary hover:bg-primary/90"><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
                                    <Button variant="outline" onClick={() => setShowCreateExercise(true)} className="h-10"><Plus className="h-4 w-4 mr-1" />Novo</Button>
                                </div>
                            ) : (
                                <div className="border rounded-md p-4 space-y-3 bg-muted/30">
                                    <div className="flex items-center justify-between">
                                        <Label className="font-sans font-medium text-sm">Criar Novo Exercício</Label>
                                        <Button variant="ghost" size="sm" onClick={() => { setShowCreateExercise(false); setNewExerciseName(''); setNewExerciseMuscleGroup(''); }}><X className="h-4 w-4" /></Button>
                                    </div>
                                    <div className="space-y-2">
                                        <Input placeholder="Nome do exercício (ex: Supino Reto)" value={newExerciseName} onChange={(e) => setNewExerciseName(e.target.value)} className="h-11" />
                                        <Input placeholder="Grupo muscular (ex: Peito, Costas, Pernas)" value={newExerciseMuscleGroup} onChange={(e) => setNewExerciseMuscleGroup(e.target.value)} className="h-11" />
                                    </div>
                                    <Button onClick={handleCreateExercise} className="w-full h-10 bg-primary hover:bg-primary/90"><Save className="h-4 w-4 mr-2" />Criar e Adicionar</Button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <Label className="font-sans font-medium text-sm text-deep-midnight">Exercícios do Treino ({workoutExercises.length})</Label>
                            {workoutExercises.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground border rounded-md border-dashed"><Dumbbell className="h-12 w-12 mx-auto mb-2 opacity-50" /><p className="text-sm">Nenhum exercício adicionado ainda.</p><p className="text-xs mt-1">Selecione um exercício acima para começar.</p></div>
                            ) : (
                                <div className="space-y-3">
                                    {workoutExercises.map(exercise => (
                                        <div key={exercise.id} className="border rounded-md p-4 space-y-3 bg-card">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2"><Dumbbell className="h-4 w-4 text-primary" /><span className="font-sans font-semibold text-sm">{exercise.exercise_name}</span></div>
                                                <Button variant="ghost" size="sm" onClick={() => handleRemoveExercise(exercise.id)} className="h-8 w-8 p-0"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1"><Label className="text-xs text-muted-foreground">Séries</Label><Input type="number" value={exercise.sets} onChange={(e) => handleUpdateExercise(exercise.id, 'sets', parseInt(e.target.value) || 0)} className="h-11" min="0" /></div>
                                                <div className="space-y-1"><Label className="text-xs text-muted-foreground">Repetições</Label><Input type="text" value={exercise.reps} onChange={(e) => handleUpdateExercise(exercise.id, 'reps', e.target.value)} placeholder="10-12 ou Falha" className="h-11" /></div>
                                                <div className="space-y-1"><Label className="text-xs text-muted-foreground">Carga (kg)</Label><Input type="number" value={exercise.weight_kg} onChange={(e) => handleUpdateExercise(exercise.id, 'weight_kg', parseFloat(e.target.value) || 0)} className="h-11" min="0" step="0.5" /></div>
                                                <div className="space-y-1"><Label className="text-xs text-muted-foreground">Descanso (s)</Label><Input type="number" value={exercise.rest_seconds} onChange={(e) => handleUpdateExercise(exercise.id, 'rest_seconds', parseInt(e.target.value) || 0)} className="h-11" min="0" /></div>
                                            </div>
                                            <div className="space-y-1"><Label className="text-xs text-muted-foreground">Observações</Label><Textarea value={exercise.notes} onChange={(e) => handleUpdateExercise(exercise.id, 'notes', e.target.value)} placeholder="Ex: Aumentar carga semana que vem..." className="min-h-[60px] resize-none" /></div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {workoutExercises.length > 0 && (
                            <Button onClick={handleSaveWorkoutLog} disabled={loading} variant="outline" className="w-full h-10 border-primary text-primary hover:bg-primary/10">
                                <Save className="h-4 w-4 mr-2" />{loading ? 'Salvando...' : 'Salvar Diário de Treino'}
                            </Button>
                        )}
                    </TabsContent>
                </Tabs>

                <SheetFooter className="p-8 bg-slate-50/50 border-t shrink-0 flex flex-row items-center gap-3 sm:justify-end">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="flex-1 sm:flex-none text-slate-500 hover:bg-slate-100 font-bold h-10 rounded-full uppercase text-xs"
                    >
                        <X className="mr-2 h-4 w-4" />
                        Fechar
                    </Button>
                    <Button
                        onClick={handleFinalize}
                        disabled={loading}
                        className="flex-1 sm:flex-none bg-bee-midnight hover:bg-slate-900 text-white font-black h-10 rounded-full shadow-lg shadow-bee-midnight/20 transition-all hover:-translate-y-0.5 active:scale-95 uppercase text-xs px-8"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Finalizando...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4 text-bee-amber" />
                                Finalizar Treino
                            </>
                        )}
                    </Button>
                </SheetFooter>
            </SheetContent>

            {/* Reschedule Dialog */}
            <AlertDialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
                <AlertDialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
                    <div className="bg-white p-8 space-y-6">
                        <div className="flex items-center gap-5 relative text-left">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-bee-amber/10 bg-bee-amber/5 text-bee-amber shadow-inner">
                                <Clock className="h-8 w-8" />
                            </div>
                            <div className="space-y-1">
                                <AlertDialogTitle className="text-xl font-bold font-display tracking-tight text-bee-midnight leading-tight">
                                    Reagendar Treino
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-sm font-medium text-slate-500">
                                    Escolha uma nova data e horário
                                </AlertDialogDescription>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Nova Data</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left h-11 rounded-xl border-slate-100 bg-slate-50/50 font-medium",
                                                !newDate && "text-slate-400"
                                            )}
                                        >
                                            <CalendarIcon className="mr-3 h-4 w-4 text-bee-amber" />
                                            {newDate ? format(newDate, 'PPP', { locale: ptBR }) : <span>Selecione a data</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={newDate} onSelect={setNewDate} initialFocus locale={ptBR} />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Novo Horário</Label>
                                <Input
                                    type="time"
                                    value={newTime}
                                    onChange={(e) => setNewTime(e.target.value)}
                                    className="h-11 rounded-xl border-slate-100 bg-slate-50/50 focus:ring-2 focus:ring-bee-amber/10 focus:border-bee-amber/30 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <AlertDialogFooter className="flex flex-row gap-3 pt-2">
                            <AlertDialogCancel asChild>
                                <Button
                                    variant="ghost"
                                    className="flex-1 h-10 rounded-full font-bold text-slate-500 hover:bg-slate-100 uppercase text-xs"
                                >
                                    Voltar
                                </Button>
                            </AlertDialogCancel>
                            <AlertDialogAction asChild>
                                <Button
                                    onClick={handleReschedule}
                                    disabled={loading}
                                    className="flex-1 h-10 rounded-full bg-bee-amber hover:bg-amber-500 text-bee-midnight font-black shadow-lg shadow-bee-amber/20 transition-all hover:-translate-y-0.5 active:scale-95 uppercase text-xs"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            Confirmar
                                        </>
                                    )}
                                </Button>
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </div>
                </AlertDialogContent>
            </AlertDialog>

            {/* Cancel Dialog */}
            <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
                    <div className="bg-white p-8 space-y-6">
                        <div className="flex items-center gap-5 relative text-left">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-red-500 shadow-inner">
                                <AlertTriangle className="h-8 w-8" />
                            </div>
                            <div className="space-y-1">
                                <AlertDialogTitle className="text-xl font-bold font-display tracking-tight text-bee-midnight leading-tight">
                                    Cancelar Treino?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-sm font-medium text-slate-500">
                                    Esta ação não pode ser desfeita e o horário ficará livre na agenda.
                                </AlertDialogDescription>
                            </div>
                        </div>

                        <AlertDialogFooter className="flex flex-row gap-3 pt-2">
                            <AlertDialogCancel asChild>
                                <Button
                                    variant="ghost"
                                    className="flex-1 h-10 rounded-full font-bold text-slate-500 hover:bg-slate-100 uppercase text-xs"
                                >
                                    Voltar
                                </Button>
                            </AlertDialogCancel>
                            <AlertDialogAction asChild>
                                <Button
                                    onClick={handleCancelConfirm}
                                    disabled={loading}
                                    className="flex-1 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white font-black shadow-lg shadow-red-500/20 transition-all hover:-translate-y-0.5 active:scale-95 uppercase text-xs"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Cancelando...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Sim, Cancelar
                                        </>
                                    )}
                                </Button>
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </Sheet >
    );
}