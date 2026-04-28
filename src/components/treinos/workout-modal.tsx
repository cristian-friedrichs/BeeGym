'use client';

import { useState, useEffect, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { Dumbbell, Users, Loader2, Edit, Calendar as CalendarIcon, User, MapPin, X, Plus, Trash2, AlertTriangle, Check } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { ExerciseSearch } from "./exercise-search";
import { addDays, format, addMinutes, differenceInMinutes, addMonths, parseISO, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface WorkoutModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultStudentId?: string;
    workoutToEdit?: any | null;
    onSuccess: () => void;
    initialDate?: Date;
    initialTime?: string;
}

export function WorkoutModal({ open, onOpenChange, defaultStudentId, workoutToEdit, onSuccess, initialDate, initialTime }: WorkoutModalProps) {
    const supabase = createClient();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    // States - Geral
    const [sessionType, setSessionType] = useState<"individual" | "group">("individual");
    const [title, setTitle] = useState("");
    const [type, setType] = useState("Hipertrofia");
    const [selectedStudentId, setSelectedStudentId] = useState<string>("");
    const [availableStudents, setAvailableStudents] = useState<{ id: string, name: string }[]>([]);
    const [openCommand, setOpenCommand] = useState(false);

    // States - Tempo e Regras
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [time, setTime] = useState("08:00");
    const [duration, setDuration] = useState("60");
    const [isMakeup, setIsMakeup] = useState(false);
    const [ignoreOverbooking, setIgnoreOverbooking] = useState(false);

    // States - Localização
    const [locationType, setLocationType] = useState<"internal" | "external">("internal");
    const [locationDetails, setLocationDetails] = useState("");
    const [roomId, setRoomId] = useState<string>("");
    const [rooms, setRooms] = useState<{ id: string, name: string }[]>([]);

    // States - Instrutor
    const [instructorId, setInstructorId] = useState<string>("");
    const [instructors, setInstructors] = useState<{ id: string, name: string }[]>([]);

    // States - Recorrência
    const [recurrenceType, setRecurrenceType] = useState<"none" | "weekly" | "monthly">("none");
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);

    // States - Exercícios
    const [exercises, setExercises] = useState<{ name: string, exercise_id: string | null, sets: number, reps: string, weight: string }[]>([]);

    // Edição Recorrente
    const [editScopeDialog, setEditScopeDialog] = useState(false);
    const [pendingEditPayload, setPendingEditPayload] = useState<any>(null);

    // Gerador de Horários (06:00 às 23:00)
    const timeSlots = useMemo(() => {
        const slots = [];
        for (let i = 6; i <= 23; i++) {
            slots.push(`${i.toString().padStart(2, '0')}:00`);
            slots.push(`${i.toString().padStart(2, '0')}:30`);
        }
        return slots;
    }, []);

    useEffect(() => {
        if (open) {
            if (workoutToEdit) {
                // MODO EDIÇÃO
                setTitle(workoutToEdit.title || "");
                setType(workoutToEdit.type || "Hipertrofia");
                setIsMakeup(workoutToEdit.is_makeup || false);
                setSelectedStudentId(workoutToEdit.student_id || defaultStudentId || "");
                setSessionType("individual");
                setLocationType(workoutToEdit.location_type || "internal");
                setLocationDetails(workoutToEdit.location_details || "");
                setRecurrenceType(workoutToEdit.recurrence_type || "none");
                setInstructorId(workoutToEdit.instructor_id || "");
                setRoomId(workoutToEdit.room_id || "");

                if (workoutToEdit.scheduled_at) {
                    const schedDate = new Date(workoutToEdit.scheduled_at);
                    setDate(schedDate);
                    setTime(format(schedDate, 'HH:mm'));
                    if (workoutToEdit.end_time) {
                        setDuration(differenceInMinutes(new Date(workoutToEdit.end_time), schedDate).toString());
                    }
                }
            } else {
                // MODO CRIAÇÃO
                const now = initialDate || new Date();
                setDate(now);
                setTime(initialTime || "08:00");
                setTitle("");
                setType("Hipertrofia");
                setDuration("60");
                setSessionType("individual");
                setIsMakeup(false);
                setIgnoreOverbooking(false);
                setLocationType("internal");
                setLocationDetails("");
                setInstructorId("");
                setRoomId("");
                setRecurrenceType("none");
                setEndDate(addDays(now, 30));
                setSelectedStudentId(defaultStudentId || "");
                setExercises([]);
            }

            const fetchInitialData = async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: profile, error: profileError } = await (supabase as any)
                    .from('profiles')
                    .select('organization_id')
                    .eq('id', user.id)
                    .single();

                if (profileError || !profile?.organization_id) {
                    console.error("WorkoutModal: Failed to fetch organization_id", profileError);
                    return;
                }
                const orgId = profile.organization_id;

                // Students
                const { data: sData } = await (supabase as any)
                    .from('students')
                    .select('id, full_name')
                    .eq('organization_id', orgId)
                    .eq('status', 'ACTIVE')
                    .order('full_name');
                if (sData) setAvailableStudents(sData.map((s: any) => ({ id: s.id, name: s.full_name })));

                // Instructors
                const { data: iData } = await (supabase as any)
                    .from('instructors')
                    .select('id, name')
                    .eq('organization_id', orgId)
                    .order('name');
                if (iData) setInstructors(iData.map((i: any) => ({ id: i.id, name: i.name })));

                // Rooms
                const { data: rData } = await (supabase as any)
                    .from('rooms')
                    .select('id, name')
                    .eq('organization_id', orgId)
                    .order('name');
                if (rData) setRooms(rData.map((r: any) => ({ id: r.id, name: r.name })));
            };
            fetchInitialData();
        }
    }, [open, workoutToEdit, defaultStudentId]);

    const generateRecurrencePayloads = (baseDate: Date, orgId: string, resolvedTitle?: string) => {
        const payloads = [];
        const recurrenceId = crypto.randomUUID();
        // Ensure end date is inclusive and set to end of day
        const end = endDate ? new Date(endDate) : addDays(baseDate, 30);
        end.setHours(23, 59, 59);

        let current = new Date(baseDate);

        // Create a safety break to prevent infinite loops if logic fails
        let count = 0;
        const MAX_RECURRENCES = 52; // e.g., 1 year of weekly

        while (current <= end && count < MAX_RECURRENCES) {
            payloads.push({
                organization_id: orgId,
                student_id: selectedStudentId,
                title: resolvedTitle ?? title,
                type,
                status: 'Agendado',
                scheduled_at: current.toISOString(),
                end_time: addMinutes(current, parseInt(duration)).toISOString(),
                is_makeup: isMakeup,
                location_type: locationType,
                location_details: locationDetails,
                room_id: (roomId && roomId !== 'none') ? roomId : null,
                instructor_id: (instructorId && instructorId !== 'none') ? instructorId : null,
                recurrence_type: recurrenceType,
                recurrence_id: recurrenceId
            });

            if (recurrenceType === 'weekly') current = addDays(current, 7);
            else if (recurrenceType === 'monthly') current = addMonths(current, 1);
            else break;

            count++;
        }
        return payloads;
    };

    const handleSave = async () => {
        if (!date || !time || !selectedStudentId || (locationType === 'external' && !locationDetails)) {
            toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
            return;
        }

        // Combine date and time
        const dateStr = format(date, 'yyyy-MM-dd');
        const scheduledDate = new Date(`${dateStr}T${time}:00`);
        const effectiveTitle = title.trim() || `Treino ${format(scheduledDate, 'dd/MM/yyyy')} ${time}`;
        const endDateTime = addMinutes(scheduledDate, parseInt(duration));

        // MODO EDIÇÃO
        if (workoutToEdit) {
            const payload = {
                title: effectiveTitle,
                type,
                scheduled_at: scheduledDate.toISOString(),
                end_time: endDateTime.toISOString(),
                is_makeup: isMakeup,
                location_type: locationType,
                location_details: locationDetails,
                instructor_id: (instructorId && instructorId !== 'none') ? instructorId : null,
                room_id: (roomId && roomId !== 'none') ? roomId : null,
                status: 'Agendado'
            };

            if (workoutToEdit.recurrence_id) {
                setPendingEditPayload(payload);
                setEditScopeDialog(true);
            } else {
                executeEdit('single', payload);
            }
            return;
        }

        // MODO CRIAÇÃO
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: profile } = await (supabase as any).from('profiles').select('organization_id').eq('id', user?.id || '').single();

            if (!ignoreOverbooking) {
                const { data: isOverbooked } = await (supabase as any).rpc('check_overbooking', {
                    p_start_time: scheduledDate.toISOString(), p_end_time: endDateTime.toISOString(), p_org_id: profile?.organization_id
                });
                if (isOverbooked) {
                    toast({ title: "Conflito de Horário!", description: "Marque 'Forçar Agendamento' para prosseguir.", variant: "destructive" });
                    setLoading(false); return;
                }
            }

            let payloadsToInsert = [];
            if (recurrenceType !== 'none' && endDate) {
                payloadsToInsert = generateRecurrencePayloads(scheduledDate, profile?.organization_id || '', effectiveTitle);
            } else {
                payloadsToInsert = [{
                    organization_id: profile?.organization_id,
                    student_id: selectedStudentId,
                    title: effectiveTitle,
                    type,
                    status: 'Agendado',
                    scheduled_at: scheduledDate.toISOString(),
                    end_time: endDateTime.toISOString(),
                    is_makeup: isMakeup,
                    location_type: locationType,
                    location_details: locationDetails,
                    instructor_id: (instructorId && instructorId !== 'none') ? instructorId : null,
                    room_id: (roomId && roomId !== 'none') ? roomId : null,
                    recurrence_type: 'none',
                    recurrence_id: null
                }];
            }

            const { data: workout, error } = await (supabase as any).from('workouts').insert(payloadsToInsert).select().single();
            if (error) throw error;

            // 3. Inserir Exercícios do Treino (se houver)
            const validExercises = exercises.filter(ex => ex.name.trim() !== '');
            if (validExercises.length > 0) {
                const exercisePayloads = validExercises.map(ex => ({
                    workout_id: workout.id,
                    exercise_id: ex.exercise_id && !ex.exercise_id.startsWith('static-') ? ex.exercise_id : null,
                    exercise_name: ex.name,
                    sets: ex.sets,
                    reps: ex.reps,
                    weight: ex.weight || '0',
                    notes: ''
                }));
                const { error: exError } = await (supabase as any).from('workout_exercises').insert(exercisePayloads);
                if (exError) console.error("Erro ao salvar exercícios vinculados:", exError);
            }

            toast({ title: "Agendamento realizado!" });
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const executeEdit = async (scope: 'single' | 'future', payload: any) => {
        setLoading(true);
        try {
            if (scope === 'single' || !workoutToEdit.recurrence_id) {
                const { error } = await (supabase as any).from('workouts').update(payload).eq('id', workoutToEdit.id);
                if (error) throw error;
            } else if (scope === 'future') {
                // Regra Master Avançada
                // 1. Atualiza este
                await (supabase as any).from('workouts').update(payload).eq('id', workoutToEdit.id);
                // 2. Deleta futuros
                await (supabase as any).from('workouts').delete()
                    .eq('recurrence_id', workoutToEdit.recurrence_id)
                    .gt('scheduled_at', workoutToEdit.scheduled_at);
                // 3. Recria futuros
                if (workoutToEdit.recurrence_type !== 'none') {
                    const { data: { user } } = await supabase.auth.getUser();
                    const { data: profile } = await (supabase as any).from('profiles').select('organization_id').eq('id', user?.id).single();

                    // Extension logic - Recreate from the NEXT occurrence
                    const baseDate = new Date(payload.scheduled_at);
                    const nextDate = workoutToEdit.recurrence_type === 'weekly' ? addDays(baseDate, 7) : addMonths(baseDate, 1);

                    const futurePayloads = [];
                    let current = nextDate;
                    const endLimit = addMonths(baseDate, 6); // Hard limit for safety

                    while (current <= endLimit) {
                        futurePayloads.push({
                            organization_id: profile?.organization_id,
                            student_id: selectedStudentId,
                            title: payload.title,
                            type: payload.type,
                            status: 'Agendado',
                            scheduled_at: current.toISOString(),
                            end_time: addMinutes(current, parseInt(duration)).toISOString(),
                            is_makeup: payload.is_makeup,
                            location_type: payload.location_type,
                            location_details: payload.location_details,
                            instructor_id: (instructorId && instructorId !== 'none') ? instructorId : null,
                            room_id: (roomId && roomId !== 'none') ? roomId : null,
                            recurrence_type: workoutToEdit.recurrence_type,
                            recurrence_id: workoutToEdit.recurrence_id
                        });
                        current = workoutToEdit.recurrence_type === 'weekly' ? addDays(current, 7) : addMonths(current, 1);
                    }
                    if (futurePayloads.length > 0) {
                        await (supabase as any).from('workouts').insert(futurePayloads);
                    }
                }
            }

            toast({ title: "Treino atualizado com sucesso!" });
            setEditScopeDialog(false);
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent side="right" className="sm:max-w-xl p-0 overflow-hidden border-l border-slate-100 shadow-2xl flex flex-col h-full bg-white">
                    <SheetHeader className="p-6 border-b border-slate-50 bg-white shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="h-12 w-12 rounded-xl bg-bee-amber/10 flex items-center justify-center border border-bee-amber/20">
                                {workoutToEdit ? <Edit className="h-6 w-6 text-bee-amber" /> : <Dumbbell className="h-6 w-6 text-bee-amber" />}
                            </div>
                            <div className="text-left">
                                <SheetTitle className="text-xl font-bold tracking-tight text-bee-midnight uppercase">
                                    {workoutToEdit ? 'Editar Treino' : 'Novo Treino'}
                                </SheetTitle>
                                <SheetDescription className="text-slate-400 font-medium text-xs">
                                    {workoutToEdit ? 'Altere as informações abaixo' : 'Agende um novo horário'}
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* ABAS INDIVIDUAL / GRUPO */}
                        {!workoutToEdit && (
                            <Tabs value={sessionType} onValueChange={(v) => setSessionType(v as "individual" | "group")} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 h-11 bg-slate-50 p-1 border border-slate-100 rounded-xl">
                                    <TabsTrigger value="individual" className="h-full data-[state=active]:bg-white data-[state=active]:text-bee-amber data-[state=active]:shadow-sm font-black uppercase text-[10px] tracking-widest flex gap-2 rounded-lg">
                                        <User className="h-3.5 w-3.5" /> Individual
                                    </TabsTrigger>
                                    <TabsTrigger value="group" className="h-full data-[state=active]:bg-white data-[state=active]:text-bee-amber data-[state=active]:shadow-sm font-black uppercase text-[10px] tracking-widest flex gap-2 rounded-lg">
                                        <Users className="h-3.5 w-3.5" /> Em Grupo
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        )}

                        <div className="space-y-6">
                            {/* ALUNO & MODALIDADE */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Aluno</Label>
                                    <Command className="overflow-visible bg-transparent">
                                        <div className="group border border-slate-100 px-4 h-11 text-sm rounded-2xl bg-slate-50/50 flex items-center transition-all focus-within:ring-2 focus-within:ring-bee-amber/20 focus-within:border-bee-amber/30">
                                            <div className="flex gap-1 flex-wrap items-center">
                                                {selectedStudentId && (
                                                    <Badge variant="secondary" className="bg-bee-amber/10 text-bee-amber border-none font-bold">
                                                        {availableStudents.find(s => s.id === selectedStudentId)?.name}
                                                        {!workoutToEdit && (
                                                            <button onClick={(e) => { e.preventDefault(); setSelectedStudentId(""); }} className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                                                                <X className="h-3 w-3 text-bee-amber hover:text-bee-amber/80" />
                                                            </button>
                                                        )}
                                                    </Badge>
                                                )}
                                                {!selectedStudentId && (
                                                    <CommandInput
                                                        placeholder="Buscar aluno..."
                                                        className="bg-transparent outline-none placeholder:text-slate-400 flex-1 h-full border-none focus:ring-0"
                                                        onFocus={() => { if (!workoutToEdit) setOpenCommand(true); }}
                                                        onBlur={() => setTimeout(() => setOpenCommand(false), 200)}
                                                        disabled={!!workoutToEdit}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        <div className="relative">
                                            {openCommand && !selectedStudentId && (
                                                <div className="absolute w-full z-50 mt-2 rounded-2xl border border-slate-100 bg-white text-popover-foreground shadow-2xl outline-none animate-in fade-in slide-in-from-top-1 overflow-hidden">
                                                    <CommandList className="max-h-[200px] overflow-y-auto">
                                                        <CommandEmpty className="p-4 text-xs font-semibold text-slate-400 text-center">Nenhum aluno encontrado.</CommandEmpty>
                                                        <CommandGroup>
                                                            {availableStudents.map(student => (
                                                                <CommandItem
                                                                    key={student.id}
                                                                    value={student.name}
                                                                    onSelect={() => { setSelectedStudentId(student.id); setOpenCommand(false); }}
                                                                    className="flex items-center gap-2 cursor-pointer p-3 hover:bg-slate-50 focus:bg-bee-amber/5"
                                                                >
                                                                    <User className="h-4 w-4 text-slate-400" />
                                                                    <span className="font-semibold text-slate-700">{student.name}</span>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </div>
                                            )}
                                        </div>
                                    </Command>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Modalidade</Label>
                                    <Select value={type} onValueChange={setType}>
                                        <SelectTrigger className="h-11 rounded-2xl border-slate-100 bg-slate-50/50 transition-all font-semibold text-bee-midnight px-5 focus:ring-bee-amber/20">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                                            <SelectItem value="Hipertrofia" className="py-3 focus:bg-bee-amber/10 rounded-xl mx-1 my-0.5 font-medium">Hipertrofia</SelectItem>
                                            <SelectItem value="Força" className="py-3 focus:bg-bee-amber/10 rounded-xl mx-1 my-0.5 font-medium">Força</SelectItem>
                                            <SelectItem value="Cardio" className="py-3 focus:bg-bee-amber/10 rounded-xl mx-1 my-0.5 font-medium">Cardio</SelectItem>
                                            <SelectItem value="Pilates" className="py-3 focus:bg-bee-amber/10 rounded-xl mx-1 my-0.5 font-medium">Pilates</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            {/* INSTRUTOR */}
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Instrutor</Label>
                                <Select value={instructorId} onValueChange={setInstructorId}>
                                    <SelectTrigger className="h-11 rounded-2xl border-slate-100 bg-slate-50/50 transition-all font-semibold text-bee-midnight px-5 focus:ring-bee-amber/20">
                                        <SelectValue placeholder="Selecione um instrutor..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                                        <SelectItem value="none" className="py-3 focus:bg-bee-amber/10 rounded-xl mx-1 my-0.5 font-medium italic opacity-60 text-slate-400">Sem instrutor</SelectItem>
                                        {instructors.map(instructor => (
                                            <SelectItem 
                                                key={instructor.id} 
                                                value={instructor.id} 
                                                className="py-3 focus:bg-bee-amber/10 rounded-xl mx-1 my-0.5 font-medium"
                                            >
                                                {instructor.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* NOME DO TREINO */}
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome do Treino / Aula *</Label>
                                <Input
                                    placeholder="Ex: Treino A - Full Body"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="h-11 rounded-2xl border-slate-100 bg-slate-50/50 transition-all font-semibold text-bee-midnight px-5 focus:ring-bee-amber/20"
                                />
                            </div>

                            {/* DATA E HORA */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Data *</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className="w-full h-11 justify-start text-left font-semibold border-slate-100 bg-slate-50/50 rounded-2xl px-5 hover:bg-slate-100/50 transition-all"
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4 text-bee-amber" />
                                                {date ? format(date, "P", { locale: ptBR }) : <span>Selecione...</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-slate-100 overflow-hidden" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={date}
                                                onSelect={setDate}
                                                initialFocus
                                                locale={ptBR}
                                                className="p-3"
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Horário *</Label>
                                    <Select value={time} onValueChange={setTime}>
                                        <SelectTrigger className="h-11 rounded-2xl border-slate-100 bg-slate-50/50 transition-all font-semibold text-bee-midnight px-5 focus:ring-bee-amber/20">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60 rounded-2xl border-slate-100 shadow-xl">
                                            {timeSlots.map(t => <SelectItem key={t} value={t} className="py-3 focus:bg-bee-amber/10 rounded-xl mx-1 my-0.5 font-medium">{t}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Duração (min) *</Label>
                                    <Input
                                        type="number"
                                        value={duration}
                                        onChange={e => setDuration(e.target.value)}
                                        className="h-11 rounded-2xl border-slate-100 bg-slate-50/50 transition-all font-semibold text-bee-midnight px-5 focus:ring-bee-amber/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Repetição</Label>
                                    {!workoutToEdit ? (
                                        <Select value={recurrenceType} onValueChange={(v: any) => setRecurrenceType(v)}>
                                            <SelectTrigger className="h-11 rounded-2xl border-slate-100 bg-slate-50/50 transition-all font-semibold text-bee-midnight px-5 focus:ring-bee-amber/20">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                                                <SelectItem value="none" className="py-3 focus:bg-bee-amber/10 rounded-xl mx-1 my-0.5 font-medium">Não se repete</SelectItem>
                                                <SelectItem value="weekly" className="py-3 focus:bg-bee-amber/10 rounded-xl mx-1 my-0.5 font-medium">Semanalmente</SelectItem>
                                                <SelectItem value="monthly" className="py-3 focus:bg-bee-amber/10 rounded-xl mx-1 my-0.5 font-medium">Mensalmente</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input disabled value={recurrenceType === 'weekly' ? 'Semanalmente' : recurrenceType === 'monthly' ? 'Mensalmente' : 'Não se repete'} className="h-11 rounded-2xl border-slate-100 bg-slate-100/50 font-semibold" />
                                    )}
                                </div>
                            </div>

                            {/* CHECKBOXES DE REGRAS */}
                            <div className="flex items-center gap-6 p-1 ml-1">
                                <div className="flex items-center gap-2 group cursor-pointer">
                                    <Checkbox id="makeup" checked={isMakeup} onCheckedChange={(c) => setIsMakeup(c as boolean)} className="border-slate-300 data-[state=checked]:bg-bee-amber data-[state=checked]:border-bee-amber rounded-md h-5 w-5" />
                                    <Label htmlFor="makeup" className="text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer group-hover:text-bee-midnight transition-colors">Aula de Reposição</Label>
                                </div>
                                {!workoutToEdit && (
                                    <div className="flex items-center gap-2 group cursor-pointer">
                                        <Checkbox id="overbooking" checked={ignoreOverbooking} onCheckedChange={(c) => setIgnoreOverbooking(c as boolean)} className="border-slate-300 data-[state=checked]:bg-bee-amber data-[state=checked]:border-bee-amber rounded-md h-5 w-5" />
                                        <Label htmlFor="overbooking" className="text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer group-hover:text-bee-midnight transition-colors">Forçar Agendamento</Label>
                                    </div>
                                )}
                            </div>

                            {/* LOCALIZAÇÃO */}
                            <div className="space-y-4 p-5 bg-slate-50/50 border border-slate-100 rounded-3xl group">
                                <div className="flex items-center justify-between mb-1">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <MapPin className="h-3.5 w-3.5 text-bee-amber" /> Localização
                                    </Label>
                                    <div className="flex bg-white p-0.5 rounded-xl border border-slate-100 shadow-sm">
                                        <button onClick={() => setLocationType('internal')} className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-[10px] transition-all">Interno</button>
                                        <button onClick={() => setLocationType('external')} className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-[10px] transition-all">Externo</button>
                                    </div>
                                </div>
                                <Input
                                    placeholder={locationType === 'internal' ? "Ex: Sala de Musculação, Estúdio A" : "Ex: Parque, Av. Principal 123"}
                                    value={locationDetails}
                                    onChange={e => setLocationDetails(e.target.value)}
                                    className="h-11 bg-white border-slate-100 rounded-2xl font-semibold px-4 focus:ring-4 focus:ring-bee-amber/5"
                                />
                                {locationType === 'internal' && (
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Sala / Recinto</Label>
                                        <Select value={roomId} onValueChange={setRoomId}>
                                            <SelectTrigger className="h-11 bg-white border-slate-100 rounded-2xl font-semibold px-4 focus:ring-4 focus:ring-bee-amber/5">
                                                <SelectValue placeholder="Selecione o local..." />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                                                <SelectItem value="none" className="py-3 focus:bg-bee-amber/10 rounded-xl mx-1 my-0.5 font-medium italic opacity-60 text-slate-400">Sem local definido</SelectItem>
                                                {rooms.map(room => (
                                                    <SelectItem 
                                                        key={room.id} 
                                                        value={room.id} 
                                                        className="py-3 focus:bg-bee-amber/10 rounded-xl mx-1 my-0.5 font-medium"
                                                    >
                                                        {room.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>

                        {/* SEÇÃO DE EXERCÍCIOS */}
                        <div className="space-y-4 border-t border-slate-50 pt-6">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-1">
                                    <Dumbbell className="h-3.5 w-3.5 text-bee-amber" /> Exercícios do Treino
                                </Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setExercises([...exercises, { name: '', exercise_id: null, sets: 3, reps: '10', weight: '0' }])}
                                    className="text-[10px] font-black uppercase h-8 px-3 text-bee-amber hover:bg-bee-amber/10 rounded-full transition-all"
                                >
                                    <Plus className="h-3 w-3 mr-1" /> Adicionar
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {exercises.map((exercise, index) => (
                                    <div key={index} className="p-5 bg-white border border-slate-100 rounded-3xl relative group shadow-sm hover:shadow-md transition-all animate-in fade-in slide-in-from-top-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                const newEx = [...exercises];
                                                newEx.splice(index, 1);
                                                setExercises(newEx);
                                            }}
                                            className="absolute top-4 right-4 h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>

                                        <div className="mb-5 pr-12">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block">Exercício</Label>
                                            <ExerciseSearch
                                                value={exercise.name}
                                                onChange={(id, name) => {
                                                    const newEx = [...exercises];
                                                    newEx[index].name = name;
                                                    newEx[index].exercise_id = id;
                                                    setExercises(newEx);
                                                }}
                                            />
                                        </div>

                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Séries</Label>
                                                <Input
                                                    type="number"
                                                    className="h-11 border-slate-100 bg-slate-50/50 rounded-2xl font-bold text-center"
                                                    value={exercise.sets}
                                                    onChange={(e) => {
                                                        const newEx = [...exercises];
                                                        newEx[index].sets = parseInt(e.target.value) || 0;
                                                        setExercises(newEx);
                                                    }}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Reps</Label>
                                                <Input
                                                    type="text"
                                                    className="h-11 border-slate-100 bg-slate-50/50 rounded-2xl font-bold text-center"
                                                    value={exercise.reps}
                                                    onChange={(e) => {
                                                        const newEx = [...exercises];
                                                        newEx[index].reps = e.target.value;
                                                        setExercises(newEx);
                                                    }}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Peso (kg)</Label>
                                                <Input
                                                    type="text"
                                                    className="h-11 border-slate-100 bg-slate-50/50 rounded-2xl font-bold text-center"
                                                    value={exercise.weight}
                                                    onChange={(e) => {
                                                        const newEx = [...exercises];
                                                        newEx[index].weight = e.target.value;
                                                        setExercises(newEx);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {exercises.length === 0 && (
                                    <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/30">
                                        <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-300">
                                            <Dumbbell className="h-6 w-6" />
                                        </div>
                                        <p className="text-sm font-semibold text-slate-400 mb-4">Nenhum exercício na ficha</p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setExercises([{ name: '', exercise_id: null, sets: 3, reps: '10', weight: '0' }])}
                                            className="text-[10px] font-black uppercase h-9 px-6 border-slate-200 text-slate-500 hover:bg-white rounded-full transition-all"
                                        >
                                            + Montar Ficha agora
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                </div>
                    </div>

                    <SheetFooter className="p-8 border-t bg-white flex items-center gap-3 shrink-0 sm:justify-end sticky bottom-0 z-30">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                            className="flex-1 sm:flex-none text-slate-400 hover:text-slate-600 hover:bg-slate-50 font-black h-10 rounded-full uppercase text-[10px] tracking-widest transition-all"
                        >
                            <X className="w-4 h-4 mr-2" /> Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex-1 sm:flex-none bg-bee-amber hover:bg-amber-500 text-bee-midnight font-black h-10 rounded-full shadow-lg shadow-bee-amber/10 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-[10px] px-10"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processando...
                                </>
                            ) : (
                                <>
                                    <Check className="mr-2 h-4 w-4 stroke-[3px]" />
                                    {workoutToEdit ? 'Salvar Alterações' : 'Agendar Treino'}
                                </>
                            )}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* DIALOG DA REGRA MASTER */}
            <AlertDialog open={editScopeDialog} onOpenChange={setEditScopeDialog}>
                <AlertDialogContent className="rounded-[32px] border-slate-100 shadow-2xl p-0 overflow-hidden max-w-[420px] bg-white">
                    <div className="p-8 border-b border-slate-50 flex items-center gap-4 bg-white">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bee-amber/10 border border-bee-amber/20 shrink-0">
                            <AlertTriangle className="h-6 w-6 text-bee-amber" />
                        </div>
                        <div className="text-left">
                            <AlertDialogTitle className="text-xl font-bold text-bee-midnight tracking-tight leading-none uppercase">
                                Editar Recorrência
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-400 font-medium text-xs mt-1">
                                Escolha como aplicar as alterações
                            </AlertDialogDescription>
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        <p className="text-slate-600 font-medium text-sm leading-relaxed">
                            Este é um evento que se repete. Como você deseja aplicar as alterações feitas no treino?
                        </p>

                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={() => executeEdit('single', pendingEditPayload)}
                                className="h-10 justify-center bg-bee-amber hover:bg-amber-500 text-bee-midnight font-black rounded-full transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-bee-amber/10 uppercase tracking-widest text-[10px]"
                            >
                                Apenas este evento
                            </Button>
                            <Button
                                onClick={() => executeEdit('future', pendingEditPayload)}
                                className="h-10 justify-center bg-bee-midnight hover:bg-slate-900 text-white font-black rounded-full transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-bee-midnight/10 uppercase tracking-widest text-[10px]"
                            >
                                Este e todos os futuros
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setEditScopeDialog(false)}
                                className="h-10 rounded-full font-black text-slate-400 hover:text-slate-600 transition-all uppercase tracking-widest text-[10px]"
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
