'use client';

import { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    Edit2, Trash2, Users, Search, CheckCircle2, XCircle, Clock, MapPin,
    User, Calendar as CalendarIcon, Loader2, Dumbbell, ChevronRight,
} from 'lucide-react';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { cn } from '@/lib/utils';

interface EventDetailsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    event: any | null;
    onSuccess?: () => void;
    onEdit?: (event: any) => void;
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    SCHEDULED:  { label: 'Agendado',     cls: 'bg-blue-50 text-blue-600 border-blue-100' },
    Agendado:   { label: 'Agendado',     cls: 'bg-blue-50 text-blue-600 border-blue-100' },
    IN_PROGRESS:{ label: 'Em Andamento', cls: 'bg-orange-50 text-orange-600 border-orange-100' },
    COMPLETED:  { label: 'Realizado',    cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    Concluido:  { label: 'Realizado',    cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    CANCELLED:  { label: 'Cancelado',    cls: 'bg-red-50 text-red-600 border-red-100' },
    Cancelado:  { label: 'Cancelado',    cls: 'bg-red-50 text-red-600 border-red-100' },
    MISSED:     { label: 'Falta',        cls: 'bg-slate-100 text-slate-500 border-slate-200' },
    PENDING:    { label: 'Pendente',     cls: 'bg-amber-50 text-amber-600 border-amber-100' },
};

export function EventDetailsModal({ open, onOpenChange, event, onSuccess, onEdit }: EventDetailsModalProps) {
    const { toast } = useToast();
    const supabase = createClient();
    const { organizationId } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);

    // Participants
    const [participants, setParticipants] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Exercises (for workouts)
    const [viewExercises, setViewExercises] = useState<any[]>([]);

    // Dialogs
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showMissedDialog, setShowMissedDialog] = useState(false);

    useEffect(() => {
        if (open) {
            setShowParticipants(false);
            setParticipants([]);
            setSearchTerm('');
            setSearchResults([]);
            setViewExercises([]);
        }
    }, [open, event]);

    // Fetch participants for CLASS / TRAINING
    useEffect(() => {
        if (!open || !event?.id) return;
        const type = event.eventType || event.type || '';
        if (type === 'CLASS' || type === 'TRAINING') {
            fetchParticipants();
        }
    }, [open, event?.id]);

    // Fetch exercises for WORKOUT / TRAINING
    useEffect(() => {
        if (!open || !event?.id) return;
        const type = event.eventType || event.type || '';
        if (type === 'WORKOUT' || type === 'TRAINING') {
            fetchViewExercises();
        }
    }, [open, event?.id]);

    const fetchParticipants = async () => {
        try {
            const { data, error } = await (supabase as any)
                .from('event_enrollments')
                .select('id, student_id, status, students(id, full_name, avatar_url)')
                .eq('event_id', event.id);
            if (!error) setParticipants(data || []);
        } catch {}
    };

    const fetchViewExercises = async () => {
        try {
            const { data } = await (supabase as any)
                .from('workout_exercises')
                .select('*, exercise:exercises(name, muscle_group)')
                .eq('workout_id', event.id);
            setViewExercises(data || []);
        } catch {}
    };

    // Student search
    useEffect(() => {
        if (searchTerm.length < 2) { setSearchResults([]); return; }
        const timeout = setTimeout(async () => {
            setIsSearching(true);
            const { data } = await (supabase as any)
                .from('students')
                .select('id, full_name, avatar_url')
                .eq('status', 'ACTIVE')
                .ilike('full_name', `%${searchTerm}%`)
                .limit(5);
            setSearchResults(data || []);
            setIsSearching(false);
        }, 300);
        return () => clearTimeout(timeout);
    }, [searchTerm]);

    const handleEnroll = async (studentId: string) => {
        if (!organizationId) return;
        setSearchTerm(''); setSearchResults([]);
        setLoading(true);
        try {
            const { data: existing } = await (supabase as any)
                .from('event_enrollments').select('id')
                .eq('event_id', event.id).eq('student_id', studentId).maybeSingle();
            if (existing) throw new Error('Aluno já matriculado nesta aula.');
            const { error } = await (supabase as any).from('event_enrollments').insert({
                event_id: event.id, student_id: studentId,
                status: 'CONFIRMED', organization_id: organizationId,
            });
            if (error) throw error;
            toast({ title: 'Aluno matriculado!' });
            await fetchParticipants();
            onSuccess?.();
        } catch (e: any) {
            toast({ title: 'Atenção', description: e.message, variant: 'destructive' });
        } finally { setLoading(false); }
    };

    const handleRemoveParticipant = async (enrollmentId: string) => {
        setLoading(true);
        try {
            const { error } = await (supabase as any).from('event_enrollments').delete().eq('id', enrollmentId);
            if (error) throw error;
            toast({ title: 'Inscrição cancelada.' });
            await fetchParticipants();
            onSuccess?.();
        } catch (e: any) {
            toast({ title: 'Erro', description: e.message, variant: 'destructive' });
        } finally { setLoading(false); }
    };

    const handleToggleAttendance = async (enrollmentId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'ABSENT' ? 'CONFIRMED' : 'ABSENT';
        try {
            const { error } = await (supabase as any).from('event_enrollments').update({ status: newStatus }).eq('id', enrollmentId);
            if (error) throw error;
            toast({ title: newStatus === 'ABSENT' ? 'Falta registrada.' : 'Presença confirmada.' });
            fetchParticipants();
        } catch (e: any) {
            toast({ title: 'Erro', description: e.message, variant: 'destructive' });
        }
    };

    const handleCancelConfirm = async () => {
        setLoading(true);
        try {
            const { error } = await (supabase as any).from('calendar_events').update({ status: 'CANCELLED' }).eq('id', event.id);
            if (error) throw error;
            toast({ title: 'Agendamento cancelado.' });
            onSuccess?.(); onOpenChange(false);
        } catch {
            toast({ title: 'Erro ao cancelar', variant: 'destructive' });
        } finally { setLoading(false); }
    };

    const handleMissedConfirm = async () => {
        setLoading(true);
        try {
            const { error } = await (supabase as any).from('calendar_events').update({ status: 'MISSED' }).eq('id', event.id);
            if (error) throw error;
            toast({ title: 'Falta registrada.' });
            onSuccess?.(); onOpenChange(false);
        } catch {
            toast({ title: 'Erro ao registrar falta', variant: 'destructive' });
        } finally { setLoading(false); }
    };

    const handleCompleteWorkout = async () => {
        setLoading(true);
        try {
            const isModern = !!event.calendar_event_id || event.source === 'calendar';
            const table = isModern ? 'calendar_events' : 'workouts';
            const { error } = await (supabase as any).from(table).update({ status: isModern ? 'COMPLETED' : 'Concluido' }).eq('id', event.id);
            if (error) throw error;
            toast({ title: 'Treino concluído!' });
            onSuccess?.(); onOpenChange(false);
        } catch {
            toast({ title: 'Erro ao concluir', variant: 'destructive' });
        } finally { setLoading(false); }
    };

    if (!event) return null;

    // ── Derived display data ───────────────────────────────────────────────────
    const eventType = event.eventType || event.type || 'WORKOUT';
    const isWorkout = eventType === 'WORKOUT';
    const isClass = eventType === 'CLASS';
    const isTraining = eventType === 'TRAINING';
    const isFinished = ['COMPLETED', 'CANCELLED', 'MISSED', 'Concluido', 'Cancelado'].includes(event.status);

    const title = event.title || event.name || (isClass ? 'Aula' : 'Treino');
    const status = event.status || 'SCHEDULED';
    const statusInfo = STATUS_MAP[status] || { label: status, cls: 'bg-slate-100 text-slate-500 border-slate-200' };

    const rawDate = event.start_datetime || event.scheduled_at || event.start;
    let dateLabel = 'N/A';
    let timeLabel = event.time || 'N/A';
    if (rawDate) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
            dateLabel = format(d, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
            if (timeLabel === 'N/A') timeLabel = format(d, 'HH:mm');
        }
    }

    const durationLabel = event.duration ? `${event.duration} min` : null;

    const instructorRaw = event.instructor;
    const instructorName = typeof instructorRaw === 'object' ? instructorRaw?.name : instructorRaw;
    const studentName = event.student?.full_name || event.student_name || event.student?.name;
    const roomName = typeof event.room === 'object' ? event.room?.name : event.room;
    const location = event.address || roomName || null;

    const modality = event.template?.title || (isClass ? 'Aula Coletiva' : isTraining ? 'Treino em Grupo' : 'Treino Individual');
    const eventColor = event.color || event.template?.color || '#F97316';
    const iconName = event.iconName || event.template?.icon || (isWorkout || isTraining ? 'dumbbell' : 'users');

    return (
        <>
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[520px] p-0 gap-0 rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-xl">

                {/* ── Header ─────────────────────────────────────────────── */}
                <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100">
                    <div className="flex items-start gap-3">
                        <div
                            className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                            style={{ backgroundColor: `${eventColor}18`, color: eventColor }}
                        >
                            <DynamicIcon name={iconName} className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <DialogTitle className="text-[17px] font-bold text-slate-900 leading-tight">
                                    {title}
                                </DialogTitle>
                                <Badge className={cn('text-[10px] font-bold border rounded-full px-2.5 py-0.5 shadow-none', statusInfo.cls)}>
                                    {statusInfo.label}
                                </Badge>
                            </div>
                            <DialogDescription className="text-xs text-slate-400 mt-0.5">{modality}</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* ── Body ───────────────────────────────────────────────── */}
                <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">

                    {/* Info grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 rounded-xl p-3.5 space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <CalendarIcon className="h-3 w-3" /> Data
                            </p>
                            <p className="text-sm font-semibold text-slate-800 capitalize leading-snug">{dateLabel}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3.5 space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <Clock className="h-3 w-3" /> Horário
                            </p>
                            <p className="text-sm font-semibold text-slate-800">
                                {timeLabel}{durationLabel && <span className="text-slate-400 font-normal ml-1.5">· {durationLabel}</span>}
                            </p>
                        </div>

                        {(instructorName || studentName) && (
                            <div className="bg-slate-50 rounded-xl p-3.5 space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                    <User className="h-3 w-3" /> {isClass || isTraining ? 'Instrutor' : 'Aluno'}
                                </p>
                                <p className="text-sm font-semibold text-slate-800 truncate">
                                    {isClass || isTraining ? (instructorName || '—') : (studentName || '—')}
                                </p>
                            </div>
                        )}

                        {location && (
                            <div className="bg-slate-50 rounded-xl p-3.5 space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                    <MapPin className="h-3 w-3" /> Local
                                </p>
                                <p className="text-sm font-semibold text-slate-800 truncate">{location}</p>
                            </div>
                        )}

                        {(isClass || isTraining) && typeof event.capacity === 'number' && (
                            <div className="bg-slate-50 rounded-xl p-3.5 space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                    <Users className="h-3 w-3" /> Capacidade
                                </p>
                                <p className="text-sm font-semibold text-slate-800">
                                    {participants.length} <span className="text-slate-400 font-normal">/ {event.capacity}</span>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Workout exercises list */}
                    {(isWorkout || isTraining) && viewExercises.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <Dumbbell className="h-3.5 w-3.5" /> Exercícios
                            </p>
                            <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden">
                                {viewExercises.map((ex: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between px-4 py-2.5 bg-white">
                                        <span className="text-sm font-medium text-slate-700">{ex.exercise?.name || ex.name || 'Exercício'}</span>
                                        {ex.sets && <span className="text-xs text-slate-400">{ex.sets}x{ex.reps} · {ex.weight}kg</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Participants section for CLASS / TRAINING */}
                    {(isClass || isTraining) && (
                        <div className="space-y-3">
                            <button
                                className="w-full flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors"
                                onClick={() => setShowParticipants(p => !p)}
                            >
                                <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Alunos inscritos ({participants.length})</span>
                                <ChevronRight className={cn('h-3.5 w-3.5 transition-transform', showParticipants && 'rotate-90')} />
                            </button>

                            {showParticipants && (
                                <div className="space-y-3">
                                    {/* Search */}
                                    {!isFinished && (
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                            <Input
                                                placeholder="Adicionar aluno..."
                                                value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                                className="h-9 pl-9 rounded-xl border-slate-200 text-sm bg-slate-50"
                                            />
                                            {/* Search dropdown */}
                                            {(searchResults.length > 0 || isSearching) && (
                                                <div className="absolute z-50 top-full mt-1 w-full bg-white border border-slate-100 rounded-xl shadow-lg overflow-hidden">
                                                    {isSearching && (
                                                        <div className="px-4 py-2.5 text-xs text-slate-400 flex items-center gap-2">
                                                            <Loader2 className="h-3 w-3 animate-spin" /> Buscando...
                                                        </div>
                                                    )}
                                                    {searchResults.map(s => {
                                                        const already = participants.some(p => p.student_id === s.id);
                                                        return (
                                                            <button
                                                                key={s.id}
                                                                disabled={already || loading}
                                                                onClick={() => handleEnroll(s.id)}
                                                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors disabled:opacity-50"
                                                            >
                                                                <Avatar className="h-7 w-7">
                                                                    <AvatarImage src={s.avatar_url} />
                                                                    <AvatarFallback className="text-[10px] bg-slate-100">{s.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                                </Avatar>
                                                                <span className="text-sm font-medium text-slate-700 flex-1 text-left">{s.full_name}</span>
                                                                {already && <span className="text-[10px] text-slate-400">já inscrito</span>}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Participant list */}
                                    {participants.length === 0 ? (
                                        <p className="text-sm text-slate-400 text-center py-4">Nenhum aluno inscrito</p>
                                    ) : (
                                        <div className="space-y-1.5">
                                            {participants.map((p: any) => {
                                                const isAbsent = p.status === 'ABSENT';
                                                const name = p.students?.full_name || 'Aluno';
                                                return (
                                                    <div key={p.id} className={cn(
                                                        'flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors',
                                                        isAbsent ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'
                                                    )}>
                                                        <Avatar className="h-7 w-7 shrink-0">
                                                            <AvatarImage src={p.students?.avatar_url} />
                                                            <AvatarFallback className="text-[10px] bg-slate-100">{name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm font-medium text-slate-700 flex-1 truncate">{name}</span>
                                                        {isAbsent
                                                            ? <Badge className="bg-red-100 text-red-600 border-none text-[10px] font-bold rounded-full px-2 py-0.5 shadow-none">Falta</Badge>
                                                            : <Badge className="bg-emerald-100 text-emerald-600 border-none text-[10px] font-bold rounded-full px-2 py-0.5 shadow-none">Presente</Badge>
                                                        }
                                                        {!isFinished && (
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() => handleToggleAttendance(p.id, p.status)}
                                                                    className={cn('h-7 w-7 rounded-lg flex items-center justify-center transition-colors',
                                                                        isAbsent ? 'hover:bg-emerald-50 text-slate-400 hover:text-emerald-600' : 'hover:bg-red-50 text-slate-400 hover:text-red-500'
                                                                    )}
                                                                    title={isAbsent ? 'Marcar presença' : 'Marcar falta'}
                                                                >
                                                                    {isAbsent ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRemoveParticipant(p.id)}
                                                                    className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                                                                    title="Remover"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Footer ─────────────────────────────────────────────── */}
                {!isFinished && (
                    <DialogFooter className="px-6 py-4 border-t border-slate-100 flex flex-row items-center gap-2 sm:justify-between">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEdit?.(event)}
                                className="h-9 gap-1.5 rounded-xl border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                            >
                                <Edit2 className="h-3.5 w-3.5" /> Editar
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowCancelDialog(true)}
                                className="h-9 gap-1.5 rounded-xl border-slate-200 text-red-500 hover:bg-red-50 hover:border-red-200 text-xs font-bold"
                            >
                                <Trash2 className="h-3.5 w-3.5" /> Cancelar
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            {isWorkout && (
                                <Button
                                    size="sm"
                                    onClick={() => setShowMissedDialog(true)}
                                    variant="outline"
                                    className="h-9 gap-1.5 rounded-xl border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                                >
                                    <XCircle className="h-3.5 w-3.5" /> Falta
                                </Button>
                            )}
                            {isWorkout && (
                                <Button
                                    size="sm"
                                    onClick={handleCompleteWorkout}
                                    disabled={loading}
                                    className="h-9 gap-1.5 rounded-xl bg-bee-amber hover:bg-bee-amber/90 text-bee-midnight font-bold text-xs shadow-none"
                                >
                                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                    Concluir Treino
                                </Button>
                            )}
                            {(isClass || isTraining) && (
                                <Button
                                    size="sm"
                                    onClick={() => { setShowParticipants(true); }}
                                    className="h-9 gap-1.5 rounded-xl bg-bee-amber hover:bg-bee-amber/90 text-bee-midnight font-bold text-xs shadow-none"
                                >
                                    <Users className="h-3.5 w-3.5" /> Ver Alunos
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>

        {/* Cancel confirmation */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
            <AlertDialogContent className="max-w-sm rounded-2xl border-slate-100">
                <AlertDialogHeader>
                    <AlertDialogTitle>Cancelar agendamento?</AlertDialogTitle>
                    <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Voltar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancelConfirm} disabled={loading} className="rounded-xl bg-red-500 hover:bg-red-600">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancelar agendamento'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {/* Missed confirmation */}
        <AlertDialog open={showMissedDialog} onOpenChange={setShowMissedDialog}>
            <AlertDialogContent className="max-w-sm rounded-2xl border-slate-100">
                <AlertDialogHeader>
                    <AlertDialogTitle>Registrar falta?</AlertDialogTitle>
                    <AlertDialogDescription>O aluno será marcado como ausente e o treino encerrado.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Voltar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleMissedConfirm} disabled={loading} className="rounded-xl bg-bee-amber hover:bg-bee-amber/90 text-bee-midnight font-bold">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar Falta'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}
