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
import { Dumbbell, Users, Loader2, Edit, Calendar as CalendarIcon, User, MapPin, X, Plus, Trash2 } from "lucide-react";
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
}

export function WorkoutModal({ open, onOpenChange, defaultStudentId, workoutToEdit, onSuccess }: WorkoutModalProps) {
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
                const now = new Date();
                setDate(now);
                setTime("08:00");
                setTitle("");
                setType("Hipertrofia");
                setDuration("60");
                setSessionType("individual");
                setIsMakeup(false);
                setIgnoreOverbooking(false);
                setLocationType("internal");
                setLocationDetails("");
                setRecurrenceType("none");
                setEndDate(addDays(now, 30));
                setSelectedStudentId(defaultStudentId || "");
                setExercises([]);
            }

            const fetchStudents = async () => {
                const { data } = await (supabase as any).from('students').select('id, full_name').eq('status', 'ACTIVE').order('full_name');
                if (data) setAvailableStudents(data.map((s: any) => ({ id: s.id, name: s.full_name })));
            };
            fetchStudents();
        }
    }, [open, workoutToEdit, defaultStudentId]);

    const generateRecurrencePayloads = (baseDate: Date, orgId: string) => {
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
                title,
                type,
                status: 'Agendado',
                scheduled_at: current.toISOString(),
                end_time: addMinutes(current, parseInt(duration)).toISOString(),
                is_makeup: isMakeup,
                location_type: locationType,
                location_details: locationDetails,
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
        if (!title || !date || !time || !selectedStudentId || (locationType === 'external' && !locationDetails)) {
            toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
            return;
        }

        // Combine date and time
        const dateStr = format(date, 'yyyy-MM-dd');
        const scheduledDate = new Date(`${dateStr}T${time}:00`);
        const endDateTime = addMinutes(scheduledDate, parseInt(duration));

        // MODO EDIÇÃO
        if (workoutToEdit) {
            const payload = {
                title,
                type,
                scheduled_at: scheduledDate.toISOString(),
                end_time: endDateTime.toISOString(),
                is_makeup: isMakeup,
                location_type: locationType,
                location_details: locationDetails,
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
                payloadsToInsert = generateRecurrencePayloads(scheduledDate, profile?.organization_id || '');
            } else {
                payloadsToInsert = [{
                    organization_id: profile?.organization_id,
                    student_id: selectedStudentId,
                    title,
                    type,
                    status: 'Agendado',
                    scheduled_at: scheduledDate.toISOString(),
                    end_time: endDateTime.toISOString(),
                    is_makeup: isMakeup,
                    location_type: locationType,
                    location_details: locationDetails,
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
                    exercise_id: ex.exercise_id,
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
                <SheetContent className="sm:max-w-[550px] w-full h-full flex flex-col overflow-y-auto">
                    <SheetHeader className="mb-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-orange-100 flex items-center justify-center rounded-xl text-orange-600">
                                {workoutToEdit ? <Edit className="h-5 w-5" /> : <Dumbbell className="h-5 w-5" />}
                            </div>
                            <div>
                                <SheetTitle className="text-xl font-bold">
                                    {workoutToEdit ? 'Editar Treino' : 'Novo Treino'}
                                </SheetTitle>
                                <SheetDescription>
                                    {workoutToEdit ? 'Altere as informações abaixo.' : 'Preencha os detalhes abaixo para agendar.'}
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="grid gap-6 flex-1">
                        {/* ABAS INDIVIDUAL / GRUPO */}
                        {!workoutToEdit && (
                            <Tabs value={sessionType} onValueChange={(v) => setSessionType(v as "individual" | "group")} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 h-14 bg-slate-100 p-1">
                                    <TabsTrigger value="individual" className="h-full data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm font-bold flex gap-2">
                                        <User className="h-4 w-4" /> Individual
                                    </TabsTrigger>
                                    <TabsTrigger value="group" className="h-full data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm font-bold flex gap-2">
                                        <Users className="h-4 w-4" /> Em Grupo
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        )}

                        <div className="space-y-5">
                            {/* ALUNO & MODALIDADE */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-slate-700 font-semibold">Aluno</Label>
                                    <Command className="overflow-visible bg-transparent">
                                        <div className={cn("group border border-slate-300 px-3 py-2 text-sm ring-offset-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 bg-white", !!workoutToEdit && "opacity-50 cursor-not-allowed")}>
                                            <div className="flex gap-1 flex-wrap items-center h-[26px]">
                                                {selectedStudentId && (
                                                    <Badge variant="secondary" className="mb-1">
                                                        {availableStudents.find(s => s.id === selectedStudentId)?.name}
                                                        {!workoutToEdit && (
                                                            <button onClick={(e) => { e.preventDefault(); setSelectedStudentId(""); }} className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                                                                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                                            </button>
                                                        )}
                                                    </Badge>
                                                )}
                                                {!selectedStudentId && (
                                                    <CommandInput
                                                        placeholder="Buscar aluno..."
                                                        className="ml-2 bg-transparent outline-none placeholder:text-muted-foreground flex-1 h-[26px]"
                                                        onFocus={() => { if (!workoutToEdit) setOpenCommand(true); }}
                                                        onBlur={() => setTimeout(() => setOpenCommand(false), 200)}
                                                        disabled={!!workoutToEdit}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        <div className="relative mt-2">
                                            {openCommand && !selectedStudentId && (
                                                <div className="absolute w-full z-10 top-0 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
                                                    <CommandList className="max-h-[200px] overflow-y-auto">
                                                        <CommandEmpty>Nenhum aluno encontrado.</CommandEmpty>
                                                        <CommandGroup>
                                                            {availableStudents.map(student => (
                                                                <CommandItem
                                                                    key={student.id}
                                                                    value={student.name}
                                                                    onSelect={() => { setSelectedStudentId(student.id); setOpenCommand(false); }}
                                                                    className="flex items-center gap-2 cursor-pointer"
                                                                >
                                                                    {student.name}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </div>
                                            )}
                                        </div>
                                    </Command>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-slate-700 font-semibold">Modalidade</Label>
                                    <Select value={type} onValueChange={setType}>
                                        <SelectTrigger className="h-11 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-xl focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Hipertrofia">Hipertrofia</SelectItem>
                                            <SelectItem value="Força">Força</SelectItem>
                                            <SelectItem value="Cardio">Cardio</SelectItem>
                                            <SelectItem value="Pilates">Pilates</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* CHECKBOXES DE REGRAS */}
                            <div className="flex items-center gap-6 pt-1 pb-1">
                                <div className="flex items-center gap-2">
                                    <Checkbox id="makeup" checked={isMakeup} onCheckedChange={(c) => setIsMakeup(c as boolean)} className="border-slate-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500" />
                                    <Label htmlFor="makeup" className="text-sm font-medium text-slate-700 cursor-pointer">Aula de Reposição</Label>
                                </div>
                                {!workoutToEdit && (
                                    <div className="flex items-center gap-2">
                                        <Checkbox id="overbooking" checked={ignoreOverbooking} onCheckedChange={(c) => setIgnoreOverbooking(c as boolean)} className="border-slate-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500" />
                                        <Label htmlFor="overbooking" className="text-sm font-medium text-slate-700 cursor-pointer">Forçar Agendamento</Label>
                                    </div>
                                )}
                            </div>

                            {/* NOME DO TREINO */}
                            <div className="space-y-1.5">
                                <Label className="text-slate-700 font-semibold">Nome do Treino / Aula *</Label>
                                <Input placeholder="Ex: Treino A - Full Body" value={title} onChange={e => setTitle(e.target.value)} className="h-11 border-slate-300" />
                            </div>

                            {/* LOCALIZAÇÃO */}
                            <div className="space-y-1.5 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <Label className="text-slate-700 font-semibold flex items-center gap-2"><MapPin className="h-4 w-4" /> Localização</Label>
                                    <div className="flex bg-slate-200 p-0.5 rounded-lg">
                                        <button onClick={() => setLocationType('internal')} className={cn("px-3 py-1 text-xs font-bold rounded-md transition-all", locationType === 'internal' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500')}>Interno</button>
                                        <button onClick={() => setLocationType('external')} className={cn("px-3 py-1 text-xs font-bold rounded-md transition-all", locationType === 'external' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500')}>Externo</button>
                                    </div>
                                </div>
                                {locationType === 'internal' ? (
                                    <Input placeholder="Ex: Sala de Musculação, Estúdio A" value={locationDetails} onChange={e => setLocationDetails(e.target.value)} className="bg-white border-slate-200" />
                                ) : (
                                    <Input placeholder="Ex: Parque do Ibirapuera, Av. Principal 123" value={locationDetails} onChange={e => setLocationDetails(e.target.value)} className="bg-white border-slate-200" />
                                )}
                            </div>

                            {/* DATA E HORA */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-slate-700 font-semibold">Data *</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full h-11 justify-start text-left font-normal border-slate-300 shadow-sm",
                                                    !date && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                                                {date ? format(date, "P", { locale: ptBR }) : <span>Selecione...</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={date}
                                                onSelect={setDate}
                                                initialFocus
                                                locale={ptBR}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-slate-700 font-semibold">Horário *</Label>
                                    <Select value={time} onValueChange={setTime}>
                                        <SelectTrigger className="h-11 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-xl focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60">
                                            {timeSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-slate-700 font-semibold">Duração (min) *</Label>
                                    <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} className="h-11 border-slate-300 shadow-sm" />
                                </div>
                            </div>

                            {/* RECORRÊNCIA (Estilo Google Calendar) */}
                            {!workoutToEdit && (
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-1.5">
                                        <Label className="text-slate-700 font-semibold">Repetição</Label>
                                        <Select value={recurrenceType} onValueChange={(v: any) => setRecurrenceType(v)}>
                                            <SelectTrigger className="h-11 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-xl focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Não se repete</SelectItem>
                                                <SelectItem value="weekly">Semanalmente (Toda semana)</SelectItem>
                                                <SelectItem value="monthly">Mensalmente (Todo mês no dia)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {recurrenceType !== 'none' && (
                                        <div className="space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
                                            <Label className="text-slate-700 font-semibold">Data Término</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full h-11 justify-start text-left font-normal border-slate-300 shadow-sm",
                                                            !endDate && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                                                        {endDate ? format(endDate, "P", { locale: ptBR }) : <span>Selecione...</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={endDate}
                                                        onSelect={setEndDate}
                                                        initialFocus
                                                        locale={ptBR}
                                                        disabled={(date) => isBefore(date, new Date())}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* SEÇÃO DE EXERCÍCIOS */}
                        <div className="space-y-4 border-t pt-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-slate-700 font-bold flex items-center gap-2">
                                    <Dumbbell className="h-4 w-4 text-orange-500" /> Exercícios do Treino
                                </Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setExercises([...exercises, { name: '', exercise_id: null, sets: 3, reps: '10', weight: '0' }])}
                                    className="text-xs h-8 border-orange-200 text-orange-600 hover:bg-orange-50"
                                >
                                    <Plus className="h-3 w-3 mr-1" /> Adicionar
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {exercises.map((exercise, index) => (
                                    <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl relative group animate-in fade-in slide-in-from-top-2 duration-200">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                const newEx = [...exercises];
                                                newEx.splice(index, 1);
                                                setExercises(newEx);
                                            }}
                                            className="absolute top-3 right-3 h-8 w-8 text-slate-400 hover:text-destructive hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>

                                        <div className="mb-4 pr-10">
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Nome do Exercício</label>
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

                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Séries</label>
                                                <Input
                                                    type="number"
                                                    className="h-10 border-slate-200 focus:ring-orange-500"
                                                    value={exercise.sets}
                                                    onChange={(e) => {
                                                        const newEx = [...exercises];
                                                        newEx[index].sets = parseInt(e.target.value) || 0;
                                                        setExercises(newEx);
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Reps</label>
                                                <Input
                                                    type="text"
                                                    className="h-10 border-slate-200 focus:ring-orange-500"
                                                    value={exercise.reps}
                                                    onChange={(e) => {
                                                        const newEx = [...exercises];
                                                        newEx[index].reps = e.target.value;
                                                        setExercises(newEx);
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Carga (kg)</label>
                                                <Input
                                                    type="text"
                                                    className="h-10 border-slate-200 focus:ring-orange-500"
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
                                    <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                                        <Dumbbell className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                        <p className="text-sm text-slate-400">Nenhum exercício adicionado a este treino.</p>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setExercises([{ name: '', exercise_id: null, sets: 3, reps: '10', weight: '0' }])}
                                            className="mt-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 font-bold"
                                        >
                                            + Montar Ficha agora
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <SheetFooter className="pt-4 border-t mt-auto flex gap-2 sm:justify-end">
                        <Button variant="outline" onClick={() => onOpenChange(false)} className="h-11 font-semibold text-slate-600 flex-1 sm:flex-none">Cancelar</Button>
                        <Button onClick={handleSave} disabled={loading} className="h-11 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 shadow-sm transition-all hover:shadow-md flex-1 sm:flex-none">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salvar"}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* DIALOG DA REGRA MASTER */}
            <AlertDialog open={editScopeDialog} onOpenChange={setEditScopeDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Editar Evento Recorrente</AlertDialogTitle>
                        <AlertDialogDescription>
                            Você alterou as informações de um treino recorrente. Deseja aplicar essa alteração (Data/Hora/Local) apenas a este dia ou reagendar todos os treinos futuros desta série baseados nesta nova data?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex flex-col gap-2 mt-2">
                        <Button variant="secondary" onClick={() => executeEdit('single', pendingEditPayload)} disabled={loading} className="justify-start h-12">
                            Apenas este evento
                        </Button>
                        <Button variant="default" onClick={() => executeEdit('future', pendingEditPayload)} disabled={loading} className="justify-start h-12 bg-orange-500 hover:bg-orange-600 text-white">
                            Este evento e todos os futuros
                        </Button>
                    </div>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel onClick={() => setPendingEditPayload(null)}>Cancelar Edição</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
