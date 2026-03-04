'use client';

import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { CLASS_TYPES, WEEKDAYS, DURATION_OPTIONS, TIME_SLOTS, type ClassType } from '@/lib/class-definitions';
import {
    CalendarIcon, Clock, Home, Users, Hash, Palette,
    Dumbbell, Heart, Zap, Activity, Target, Flame, Bike, PersonStanding,
    Wind, Waves, Volleyball, Trophy, Swords, Footprints, Sparkles, Smile,
    X, Save, Repeat, ClipboardList
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { format, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CreateRecurringClassModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    initialDate?: Date;
    initialTime?: string;
}

interface Room {
    id: string;
    name: string;
    capacity: number | null;
}

interface Instructor {
    id: string;
    full_name: string;
    avatar_url: string | null;
}



// Local constants removed in favor of imported ones


// Special PopoverContent without Portal to fix interaction inside Modal
const PopoverContentWithoutPortal = React.forwardRef<
    React.ElementRef<typeof PopoverPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
    <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
            "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            className
        )}
        {...props}
    />
))
PopoverContentWithoutPortal.displayName = PopoverPrimitive.Content.displayName

export function CreateRecurringClassModal({ open, onOpenChange, onSuccess, initialDate, initialTime }: CreateRecurringClassModalProps) {
    const { toast } = useToast();
    const supabase = createClient();

    const [rooms, setRooms] = useState<Room[]>([]);
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [loading, setLoading] = useState(false);

    // Section 1: Basic Info
    const [className, setClassName] = useState<string>('');
    const [selectedInstructor, setSelectedInstructor] = useState<string>('');
    const [selectedRoom, setSelectedRoom] = useState<string>('');

    // Section 2: Class Type
    const [classType, setClassType] = useState<string>('');

    // Section 3: Schedule
    const [isRecurring, setIsRecurring] = useState(false);
    const [startDate, setStartDate] = useState<Date | undefined>(initialDate);
    const [endDate, setEndDate] = useState<Date | undefined>(initialDate);
    const [selectedDays, setSelectedDays] = useState<number[]>([]);
    const [isStartDateOpen, setIsStartDateOpen] = useState(false);
    const [isEndDateOpen, setIsEndDateOpen] = useState(false);
    const [selectedTime, setSelectedTime] = useState<string>(initialTime || '');
    const [selectedDuration, setSelectedDuration] = useState<string>('60');

    // Section 4: Rules
    const [capacity, setCapacity] = useState<string>('');

    useEffect(() => {
        if (open) {
            fetchData();
            if (initialDate) {
                setStartDate(initialDate);
                setEndDate(initialDate);
                if (!isRecurring) {
                    // For single event, we don't strictly need to select days, but it helps if they toggle recurrence on
                    setSelectedDays([initialDate.getDay()]);
                }
            }
            if (initialTime) setSelectedTime(initialTime);
        }
    }, [open, initialDate, initialTime]);

    // Auto-select day of week if start and end dates are the same (only for recurring logic or initial setup)
    useEffect(() => {
        if (startDate && endDate && isRecurring) {
            // Check if it's exactly the same day
            if (startDate.toDateString() === endDate.toDateString()) {
                const dayOfWeek = startDate.getDay();
                setSelectedDays([dayOfWeek]);
            }
        }
    }, [startDate, endDate, isRecurring]);

    async function fetchData() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: userData } = await (supabase as any)
                .from('profiles')
                .select('organization_id')
                .eq('id', user.id)
                .single();

            if (!userData?.organization_id) return;

            // Fetch rooms
            const { data: roomsData } = await (supabase as any)
                .from('rooms')
                .select('id, name, capacity')
                .eq('organization_id', userData.organization_id)
                .order('name');

            if (roomsData) setRooms(roomsData);

            // Fetch instructors
            const { data: instructorsData } = await (supabase as any)
                .from('instructors')
                .select('id, name, user_id')
                .eq('organization_id', userData.organization_id)
                .order('name');

            if (instructorsData) {
                // Map to Instructor interface
                const formattedInstructors = (instructorsData as any[]).map(i => ({
                    id: i.id,
                    full_name: i.name || 'Instrutor sem nome',
                    avatar_url: null // Instructors table doesn't have avatar yet
                }));
                setInstructors(formattedInstructors);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({
                title: 'Erro ao carregar dados',
                description: 'Não foi possível carregar salas e instrutores.',
                variant: 'destructive',
            });
        }
    }

    function toggleDay(day: number) {
        setSelectedDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    }

    function generateRecurringEvents(
        start: Date,
        end: Date,
        days: number[],
        time: string,
        duration: number
    ): Date[] {
        const events: Date[] = [];
        const currentDate = new Date(start);
        const finalDate = new Date(end);

        while (currentDate <= finalDate) {
            if (days.includes(currentDate.getDay())) {
                events.push(new Date(currentDate));
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return events;
    }

    async function handleSubmit() {
        // Validation
        const basicValidation = !classType || !className || !selectedInstructor || !startDate || !selectedTime || !capacity;
        const recurringValidation = isRecurring ? (!endDate || selectedDays.length === 0) : false;

        if (basicValidation || recurringValidation) {
            toast({
                title: 'Campos obrigatórios',
                description: 'Por favor, preencha todos os campos obrigatórios.',
                variant: 'destructive',
            });
            return;
        }

        // Validate end date >= start date (only if recurring)
        if (isRecurring && endDate && startDate && endDate < startDate) {
            toast({
                title: 'Data inválida',
                description: 'A Data de Término deve ser maior ou igual à Data de Início.',
                variant: 'destructive',
            });
            return;
        }

        const capacityNum = parseInt(capacity);
        if (isNaN(capacityNum) || capacityNum <= 0) {
            toast({
                title: 'Capacidade inválida',
                description: 'A capacidade deve ser um número maior que zero.',
                variant: 'destructive',
            });
            return;
        }

        // Check room capacity
        const selectedRoomData = rooms.find(r => r.id === selectedRoom);
        const roomCapacity = selectedRoomData?.capacity || 0;
        if (selectedRoomData && roomCapacity > 0 && capacityNum > roomCapacity) {
            toast({
                title: 'Capacidade excedida',
                description: `A capacidade da sala ${selectedRoomData.name} é de ${selectedRoomData.capacity} pessoas.`,
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const { data: userData } = await (supabase as any)
                .from('profiles')
                .select('organization_id')
                .eq('id', user.id)
                .single();

            if (!userData?.organization_id) throw new Error('Organização não encontrada');

            // Generate recurring events OR single event
            let eventDates: Date[] = [];

            if (isRecurring && endDate) {
                eventDates = generateRecurringEvents(
                    startDate,
                    endDate,
                    selectedDays,
                    selectedTime,
                    parseInt(selectedDuration)
                );
            } else {
                // Single event
                const singleDate = new Date(startDate);
                // Time is applied later, just push the date
                eventDates = [singleDate];
            }

            if (eventDates.length === 0) {
                toast({
                    title: 'Nenhum evento gerado',
                    description: 'Verifique os dias da semana selecionados e o período.',
                    variant: 'destructive',
                });
                setLoading(false);
                return;
            }

            // Prepare events to insert
            const eventsToInsert = eventDates.map(date => {
                const [hours, minutes] = selectedTime.split(':').map(Number);
                const startDateTime = new Date(date);
                startDateTime.setHours(hours, minutes, 0, 0);

                const endDateTime = addMinutes(startDateTime, parseInt(selectedDuration));

                return {
                    title: className,
                    room_id: (selectedRoom && selectedRoom !== '_clear') ? selectedRoom : null,
                    instructor_id: selectedInstructor,
                    organization_id: userData.organization_id,
                    start_datetime: startDateTime.toISOString(),
                    end_datetime: endDateTime.toISOString(),
                    capacity: capacityNum,
                    status: 'SCHEDULED',
                    type: 'CLASS', // Always 'CLASS' — modality is stored in class_template_id relation
                };
            });

            // --- CONFLICT DETECTION START ---
            // 1. Determine the time range for the new batch
            const sortedStarts = eventsToInsert.map(e => new Date(e.start_datetime).getTime()).sort((a, b) => a - b);
            const sortedEnds = eventsToInsert.map(e => new Date(e.end_datetime).getTime()).sort((a, b) => a - b);

            const minStart = new Date(sortedStarts[0]).toISOString();
            const maxEnd = new Date(sortedEnds[sortedEnds.length - 1]).toISOString();

            // 2. Fetch existing events in this range
            const { data: existingEvents, error: conflictError } = await (supabase as any)
                .from('calendar_events')
                .select('id, title, start_datetime, end_datetime, room_id, instructor_id, status')
                .eq('organization_id', userData.organization_id)
                .gte('end_datetime', minStart) // Ends after our batch starts
                .lte('start_datetime', maxEnd); // Starts before our batch ends

            if (conflictError) throw conflictError;

            // 3. Check for overlaps
            const conflicts: string[] = [];
            const newRoomId = (selectedRoom && selectedRoom !== '_clear') ? selectedRoom : null;

            for (const newEvent of eventsToInsert) {
                const newStart = new Date(newEvent.start_datetime).getTime();
                const newEnd = new Date(newEvent.end_datetime).getTime();

                for (const existing of (existingEvents || [])) {
                    if (existing.status === 'CANCELLED') continue; // Ignore cancelled events
                    if (!existing.start_datetime || !existing.end_datetime) continue; // Skip if null

                    const existingStart = new Date(existing.start_datetime).getTime();
                    const existingEnd = new Date(existing.end_datetime).getTime();

                    // Check time overlap
                    const isOverlapping = (newStart < existingEnd) && (newEnd > existingStart);

                    if (isOverlapping) {
                        // Check Room Conflict
                        if (newRoomId && existing.room_id === newRoomId) {
                            const dateStr = format(new Date(newEvent.start_datetime), "dd/MM 'às' HH:mm", { locale: ptBR });
                            conflicts.push(`Sala ocupada: ${existing.title} em ${dateStr}`);
                        }
                        // Check Instructor Conflict
                        if (existing.instructor_id === selectedInstructor) {
                            const dateStr = format(new Date(newEvent.start_datetime), "dd/MM 'às' HH:mm", { locale: ptBR });
                            conflicts.push(`Instrutor ocupado: ${existing.title} em ${dateStr}`);
                        }
                    }
                }
            }

            if (conflicts.length > 0) {
                // Show first 3 conflicts to avoid huge toast
                const message = conflicts.slice(0, 3).join('\n') + (conflicts.length > 3 ? `\n...e mais ${conflicts.length - 3} conflitos.` : '');

                toast({
                    title: 'Conflito de Agendamento',
                    description: message,
                    variant: 'destructive',
                    duration: 5000,
                });
                setLoading(false);
                return; // STOP execution
            }
            // --- CONFLICT DETECTION END ---

            const { error } = await (supabase as any)
                .from('calendar_events')
                .insert(eventsToInsert);

            if (error) throw error;

            toast({
                title: isRecurring ? 'Aulas criadas!' : 'Aula criada!',
                description: isRecurring
                    ? `${eventDates.length} aula(s) recorrente(s) foram agendadas com sucesso.`
                    : 'Sua aula foi agendada com sucesso.',
            });

            // Reset form
            setClassName('');
            setClassType('');
            setSelectedInstructor('');
            setSelectedRoom('');
            // Don't reset initialDate/Time if we want to keep them for next creation, but usually better to reset or keep sync
            if (!initialDate) setStartDate(undefined);
            if (!initialDate) setEndDate(undefined);
            setSelectedDays([]);
            if (!initialTime) setSelectedTime('');
            setSelectedDuration('60');
            setCapacity('');
            setIsRecurring(false);

            onSuccess?.();
            onOpenChange(false);
        } catch (error) {
            console.error('Error creating recurring class:', error);
            toast({
                title: 'Erro ao criar aulas',
                description: 'Não foi possível agendar as aulas. Tente novamente.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }

    const selectedClassType = CLASS_TYPES.find(t => t.value === classType);
    const SelectedIconComponent = selectedClassType?.icon || Dumbbell;
    const selectedColorValue = selectedClassType?.color || '#F59E0B';

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[650px] flex flex-col h-full overflow-y-auto p-0 gap-0">
                <SheetHeader className="p-6 pb-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-100">
                            <ClipboardList className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                            <SheetTitle className="font-display font-bold text-xl text-deep-midnight">
                                Nova Aula
                            </SheetTitle>
                            <SheetDescription>Agende uma nova aula coletiva</SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="space-y-6 p-6 pt-2 flex-1 overflow-y-auto">
                    {/* Section 1: Basic Info */}
                    <div className="space-y-4">
                        <h3 className="font-display font-bold text-lg text-deep-midnight flex items-center gap-2">
                            <Hash className="h-5 w-5 text-primary" />
                            Informações Básicas
                        </h3>

                        <div className="space-y-2">
                            <Label htmlFor="className" className="font-sans font-medium text-sm">
                                Nome da Aula *
                            </Label>
                            <Input
                                id="className"
                                placeholder="Ex: Yoga Matinal, Pilates Avançado"
                                value={className}
                                onChange={(e) => setClassName(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="instructor" className="font-sans font-medium text-sm flex items-center gap-2">
                                    <Users className="h-4 w-4 text-primary" />
                                    Instrutor *
                                </Label>
                                <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
                                    <SelectTrigger id="instructor" className="h-11 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-xl focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
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
                                <Label htmlFor="room" className="font-sans font-medium text-sm flex items-center gap-2">
                                    <Home className="h-4 w-4 text-primary" />
                                    Local (Opcional)
                                </Label>
                                <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                                    <SelectTrigger id="room" className="h-11 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-xl focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="_clear">Sem local definido</SelectItem>
                                        {rooms.map((room) => (
                                            <SelectItem key={room.id} value={room.id}>
                                                {room.name} (Cap: {room.capacity === 0 ? 'Ilimitado' : room.capacity})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Section 2: Tipo de Aula */}
                    <div className="space-y-4">
                        <h3 className="font-display font-bold text-lg text-deep-midnight flex items-center gap-2">
                            <Palette className="h-5 w-5 text-primary" />
                            Tipo de Aula
                        </h3>

                        <div className="space-y-2">
                            <Label htmlFor="classType" className="font-sans font-medium text-sm">Tipo *</Label>
                            <Select value={classType} onValueChange={setClassType}>
                                <SelectTrigger id="classType" className="h-11 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-xl focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                                    <SelectValue placeholder="Selecione o tipo de aula">
                                        {classType && (() => {
                                            const selected = CLASS_TYPES.find(t => t.value === classType);
                                            if (!selected) return null;
                                            const Icon = selected.icon;
                                            return (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center justify-center w-6 h-6 rounded" style={{ backgroundColor: selected.color + '20' }}>
                                                        <Icon className="h-4 w-4" style={{ color: selected.color }} />
                                                    </div>
                                                    <span>{selected.label}</span>
                                                </div>
                                            );
                                        })()}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {CLASS_TYPES.map((type) => {
                                        const Icon = type.icon;
                                        return (
                                            <SelectItem key={type.value} value={type.value}>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center justify-center w-6 h-6 rounded" style={{ backgroundColor: type.color + '20' }}>
                                                        <Icon className="h-4 w-4" style={{ color: type.color }} />
                                                    </div>
                                                    <span>{type.label}</span>
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">Cada tipo tem ícone e cor pré-definidos</p>
                        </div>
                    </div>

                    <Separator />

                    {/* Section 3: Schedule */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-display font-bold text-lg text-deep-midnight flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5 text-primary" />
                                Agendamento
                            </h3>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="recurring-mode"
                                    checked={isRecurring}
                                    onCheckedChange={setIsRecurring}
                                />
                                <Label htmlFor="recurring-mode">Aula Recorrente</Label>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="font-sans font-medium text-sm">{isRecurring ? 'Data de Início *' : 'Data *'}</Label>
                                <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                'w-full justify-start text-left font-normal',
                                                !startDate && 'text-muted-foreground'
                                            )}
                                        >
                                            {startDate ? format(startDate, 'PPP', { locale: ptBR }) : 'Selecione'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContentWithoutPortal className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={startDate}
                                            onSelect={(date) => {
                                                setStartDate(date);
                                                setIsStartDateOpen(false);
                                            }}
                                            locale={ptBR}
                                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                            initialFocus
                                        />
                                    </PopoverContentWithoutPortal>
                                </Popover>
                            </div>



                            {isRecurring && (
                                <div className="space-y-2">
                                    <Label className="font-sans font-medium text-sm">Data de Término *</Label>
                                    <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    'w-full justify-start text-left font-normal',
                                                    !endDate && 'text-muted-foreground'
                                                )}
                                            >
                                                {endDate ? format(endDate, 'PPP', { locale: ptBR }) : 'Selecione'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContentWithoutPortal className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={endDate}
                                                onSelect={(date) => {
                                                    setEndDate(date);
                                                    setIsEndDateOpen(false);
                                                }}
                                                locale={ptBR}
                                                disabled={(date) => {
                                                    const today = new Date(new Date().setHours(0, 0, 0, 0));
                                                    return date < today || (startDate ? date < startDate : false);
                                                }}
                                                initialFocus
                                            />
                                        </PopoverContentWithoutPortal>
                                    </Popover>
                                </div>
                            )}
                        </div>

                        {isRecurring && (
                            <div className="space-y-2">
                                <Label className="font-sans font-medium text-sm">Dias da Semana *</Label>
                                <div className="flex gap-2">
                                    {WEEKDAYS.map((day) => (
                                        <Button
                                            key={day.value}
                                            type="button"
                                            variant={selectedDays.includes(day.value) ? "default" : "outline"}
                                            className={cn(
                                                "w-12 h-12 p-0",
                                                selectedDays.includes(day.value) && "bg-primary hover:bg-primary/90"
                                            )}
                                            onClick={() => toggleDay(day.value)}
                                        >
                                            {day.short}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="time" className="font-sans font-medium text-sm flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-primary" />
                                    Horário *
                                </Label>
                                <Select value={selectedTime} onValueChange={setSelectedTime}>
                                    <SelectTrigger id="time" className="h-11 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-xl focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px]">
                                        {TIME_SLOTS.map((time) => (
                                            <SelectItem key={time} value={time}>
                                                {time}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="duration" className="font-sans font-medium text-sm">
                                    Duração *
                                </Label>
                                <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                                    <SelectTrigger id="duration" className="h-11 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-xl focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DURATION_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Section 4: Rules */}
                    <div className="space-y-4">
                        <h3 className="font-display font-bold text-lg text-deep-midnight flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Regras
                        </h3>

                        <div className="space-y-2">
                            <Label htmlFor="capacity" className="font-sans font-medium text-sm">
                                Capacidade Máxima *
                            </Label>
                            <Input
                                id="capacity"
                                type="number"
                                min="1"
                                max="100"
                                placeholder="Ex: 10"
                                value={capacity}
                                onChange={(e) => setCapacity(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <SheetFooter className="p-6 pt-4 border-t flex flex-row justify-end gap-3 shrink-0">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="gap-2"
                    >
                        <X className="h-4 w-4" />
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2"
                    >
                        <Save className="h-4 w-4" />
                        {loading ? 'Criando...' : 'Salvar Aula'}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet >
    );
}
