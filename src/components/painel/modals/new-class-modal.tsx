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
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import {
    CalendarIcon,
    Clock,
    Users,
    Home,
    Hash,
    Heart,
    Sparkles,
    Zap,
    Dumbbell,
    Activity,
    Target,
    Waves,
    Music,
    MoreHorizontal,
    X,
    Check,
    Save,
    Loader2,
    type LucideIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface NewClassModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
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

interface ClassType {
    value: string;
    label: string;
    icon: LucideIcon;
    color: string;
}

const CLASS_TYPES: ClassType[] = [
    { value: 'yoga', label: 'Yoga', icon: Heart, color: '#10B981' },
    { value: 'pilates', label: 'Pilates', icon: Sparkles, color: '#8B5CF6' },
    { value: 'crossfit', label: 'Crossfit', icon: Zap, color: '#EF4444' },
    { value: 'musculacao', label: 'Musculação', icon: Dumbbell, color: '#F59E0B' },
    { value: 'spinning', label: 'Spinning', icon: Activity, color: '#3B82F6' },
    { value: 'funcional', label: 'Funcional', icon: Target, color: '#EC4899' },
    { value: 'natacao', label: 'Natação', icon: Waves, color: '#06B6D4' },
    { value: 'danca', label: 'Dança', icon: Music, color: '#F97316' },
    { value: 'outro', label: 'Outro', icon: MoreHorizontal, color: '#6B7280' },
];

const DURATION_OPTIONS = [
    { value: '30', label: '30 minutos' },
    { value: '60', label: '1 hora' },
    { value: '90', label: '1 hora e 30 minutos' },
    { value: '120', label: '2 horas' },
];

const TIME_SLOTS = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
];

export function NewClassModal({ open, onOpenChange, onSuccess }: NewClassModalProps) {
    const { toast } = useToast();
    const supabase = createClient();

    const [rooms, setRooms] = useState<Room[]>([]);
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [loading, setLoading] = useState(false);

    const [classType, setClassType] = useState<string>('');
    const [className, setClassName] = useState<string>('');
    const [selectedRoom, setSelectedRoom] = useState<string>('');
    const [selectedInstructor, setSelectedInstructor] = useState<string>('');
    const [capacity, setCapacity] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<Date>();
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [selectedDuration, setSelectedDuration] = useState<string>('60');

    useEffect(() => {
        if (open) {
            fetchData();
        }
    }, [open]);

    async function fetchData() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: userData } = await (supabase as any)
                .from('profiles')
                .select('organization_id')
                .eq('id', user.id)
                .single();

            if (!(userData as any)?.organization_id) return;

            // Fetch rooms
            const { data: roomsData } = await (supabase as any)
                .from('rooms')
                .select('id, name, capacity')
                .eq('organization_id', (userData as any).organization_id)
                .order('name');

            if (roomsData) setRooms((roomsData as any[]).map(r => ({
                id: r.id,
                name: r.name,
                capacity: r.capacity || 0
            })));

            // Fetch instructors
            const { data: instructorsData } = await (supabase as any)
                .from('profiles')
                .select('id, full_name, avatar_url')
                .eq('organization_id', (userData as any).organization_id)
                .order('full_name');

            if (instructorsData) setInstructors((instructorsData as any[]).map(i => ({
                id: i.id,
                full_name: i.full_name || 'Instrutor',
                avatar_url: i.avatar_url || null
            })));
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({
                title: 'Erro ao carregar dados',
                description: 'Não foi possível carregar salas e instrutores.',
                variant: 'destructive',
            });
        }
    }

    async function handleSubmit() {
        // Validation
        if (!classType || !className || !selectedRoom || !selectedInstructor || !capacity || !selectedDate || !selectedTime || !selectedDuration) {
            toast({
                title: 'Campos obrigatórios',
                description: 'Por favor, preencha todos os campos.',
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

        // Check if capacity exceeds room capacity
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

            if (!(userData as any)?.organization_id) throw new Error('Organização não encontrada');

            const startDateTime = new Date(selectedDate);
            const [hours, minutes] = selectedTime.split(':').map(Number);
            startDateTime.setHours(hours, minutes, 0, 0);

            const endDateTime = new Date(startDateTime);
            endDateTime.setMinutes(endDateTime.getMinutes() + parseInt(selectedDuration));

            const { error } = await ((supabase as any)
                .from('calendar_events') as any)
                .insert({
                    title: className,
                    room_id: selectedRoom,
                    instructor_id: selectedInstructor,
                    organization_id: (userData as any).organization_id,
                    start_datetime: startDateTime.toISOString(),
                    end_datetime: endDateTime.toISOString(),
                    capacity: capacityNum,
                    type: 'CLASS',
                    status: 'SCHEDULED',
                });

            if (error) throw error;

            toast({
                title: 'Aula criada!',
                description: 'A aula foi agendada com sucesso.',
            });

            // Reset form
            setClassType('');
            setClassName('');
            setSelectedRoom('');
            setSelectedInstructor('');
            setCapacity('');
            setSelectedDate(undefined);
            setSelectedTime('');
            setSelectedDuration('60');

            onSuccess?.();
            onOpenChange(false);
        } catch (error) {
            console.error('Error creating class:', error);
            toast({
                title: 'Erro ao criar aula',
                description: 'Não foi possível agendar a aula. Tente novamente.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-xl p-0 overflow-hidden border-l border-slate-100 shadow-2xl flex flex-col h-full bg-white">
                <SheetHeader className="p-8 border-b relative overflow-hidden shrink-0 bg-white">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-bee-amber/[0.03] rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />

                    <div className="flex items-center gap-5 relative text-left">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-bee-amber/10 bg-bee-amber/5 text-bee-amber shadow-inner">
                            <CalendarIcon className="h-8 w-8" />
                        </div>
                        <div className="space-y-1">
                            <SheetTitle className="text-2xl font-bold font-display tracking-tight text-bee-midnight leading-tight">
                                Agendar Aula
                            </SheetTitle>
                            <SheetDescription className="flex items-center gap-2 text-sm font-medium text-slate-500">
                                <Badge variant="outline" className="bg-bee-amber/10 text-bee-amber border-bee-amber/30 font-bold uppercase tracking-wider text-[10px] px-2.5 py-0.5 rounded-full font-sans">
                                    Coletiva
                                </Badge>
                                <span>Crie uma nova turma para os alunos</span>
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 p-8 pt-6 space-y-6 overflow-y-auto">
                    <div className="grid grid-cols-1 gap-6">
                        {/* Class Type & Name row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="classType" className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">
                                    Tipo de Aula *
                                </Label>
                                <Select value={classType} onValueChange={setClassType}>
                                    <SelectTrigger id="classType" className="h-11 border-slate-100 bg-slate-50/50 rounded-xl focus:ring-2 focus:ring-bee-amber/10 focus:border-bee-amber/30 transition-all">
                                        <SelectValue placeholder="Selecione..." />
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
                                                        <span className="text-sm">{type.label}</span>
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="className" className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">
                                    Nome da Aula *
                                </Label>
                                <div className="relative">
                                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="className"
                                        placeholder="Ex: Yoga Matinal"
                                        value={className}
                                        onChange={(e) => setClassName(e.target.value)}
                                        className="h-11 pl-11 border-slate-100 bg-slate-50/50 rounded-xl focus:ring-2 focus:ring-bee-amber/10 focus:border-bee-amber/30 transition-all font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Room & Instructor row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="room" className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">
                                    Sala *
                                </Label>
                                <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                                    <SelectTrigger id="room" className="h-11 border-slate-100 bg-slate-50/50 rounded-xl focus:ring-2 focus:ring-bee-amber/10 focus:border-bee-amber/30 transition-all">
                                        <div className="flex items-center gap-2">
                                            <Home className="h-4 w-4 text-slate-400" />
                                            <SelectValue placeholder="Onde?" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {rooms.map((room) => (
                                            <SelectItem key={room.id} value={room.id}>
                                                {room.name} {room.capacity && room.capacity > 0 ? `(${room.capacity} cap.)` : '(Ilimitado)'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="instructor" className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">
                                    Instrutor *
                                </Label>
                                <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
                                    <SelectTrigger id="instructor" className="h-11 border-slate-100 bg-slate-50/50 rounded-xl focus:ring-2 focus:ring-bee-amber/10 focus:border-bee-amber/30 transition-all">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-slate-400" />
                                            <SelectValue placeholder="Quem?" />
                                        </div>
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
                        </div>

                        {/* Date, Time, Duration, Cap */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">
                                    Data *
                                </Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                'w-full h-11 justify-start text-left border-slate-100 bg-slate-50/50 rounded-xl font-medium',
                                                !selectedDate && 'text-slate-400'
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                                            {selectedDate ? format(selectedDate, 'dd/MM', { locale: ptBR }) : 'Data'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={selectedDate}
                                            onSelect={setSelectedDate}
                                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="time" className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">
                                    Início *
                                </Label>
                                <Select value={selectedTime} onValueChange={setSelectedTime}>
                                    <SelectTrigger id="time" className="h-11 border-slate-100 bg-slate-50/50 rounded-xl focus:ring-2 focus:ring-bee-amber/10 focus:border-bee-amber/30 transition-all">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-slate-400" />
                                            <SelectValue placeholder="Hora" />
                                        </div>
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
                                <Label htmlFor="duration" className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">
                                    Tempo *
                                </Label>
                                <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                                    <SelectTrigger id="duration" className="h-11 border-slate-100 bg-slate-50/50 rounded-xl focus:ring-2 focus:ring-bee-amber/10 focus:border-bee-amber/30 transition-all">
                                        <SelectValue placeholder="Dur..." />
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

                            <div className="space-y-2">
                                <Label htmlFor="capacity" className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">
                                    Capacidade *
                                </Label>
                                <Input
                                    id="capacity"
                                    type="number"
                                    min="1"
                                    placeholder="Máx"
                                    value={capacity}
                                    onChange={(e) => setCapacity(e.target.value)}
                                    className="h-11 border-slate-100 bg-slate-50/50 rounded-xl focus:ring-2 focus:ring-bee-amber/10 focus:border-bee-amber/30 transition-all font-medium"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <SheetFooter className="p-8 bg-slate-50/50 border-t shrink-0 flex flex-row items-center gap-3 sm:justify-end">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="flex-1 sm:flex-none text-slate-500 hover:bg-slate-100 font-bold h-10 rounded-full uppercase text-xs"
                    >
                        <X className="mr-2 h-4 w-4" />
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 sm:flex-none bg-bee-amber hover:bg-amber-500 text-bee-midnight font-black h-10 rounded-full shadow-lg shadow-bee-amber/20 transition-all hover:-translate-y-0.5 active:scale-95 uppercase text-xs px-8"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Criando...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Criar Aula
                            </>
                        )}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
