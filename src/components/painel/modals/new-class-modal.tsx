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
    Loader2,
    type LucideIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getClassType } from '@/lib/class-definitions';

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

interface ClassTemplate {
    id: string;
    name: string;
    duration_minutes: number;
    color: string | null;
    icon_name: string | null;
    capacity: number | null;
}

// Local constants removed or moved to lib/class-definitions

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
    const { organizationId } = useAuth();

    const [rooms, setRooms] = useState<Room[]>([]);
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [classTemplates, setClassTemplates] = useState<ClassTemplate[]>([]);
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
        if (!organizationId) return;
        try {
            const { data: roomsData } = await (supabase as any)
                .from('rooms')
                .select('id, name, capacity')
                .eq('organization_id', organizationId)
                .order('name');

            if (roomsData) setRooms((roomsData as any[]).map(r => ({
                id: r.id,
                name: r.name,
                capacity: r.capacity || 0
            })));

            const { data: instructorsData } = await (supabase as any)
                .from('instructors')
                .select('id, name')
                .eq('organization_id', organizationId)
                .order('name');

            if (instructorsData) setInstructors((instructorsData as any[]).map(i => ({
                id: i.id,
                full_name: i.name || 'Instrutor',
                avatar_url: null
            })));

            const { data: templatesData } = await (supabase as any)
                .from('class_templates')
                .select('id, name, duration_minutes, color, icon_name, capacity')
                .eq('organization_id', organizationId)
                .order('name');

            if (templatesData) setClassTemplates(templatesData);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    const handleTemplateChange = (templateId: string) => {
        setClassType(templateId);
        const template = classTemplates.find(t => t.id === templateId);
        if (template) {
            setClassName(template.name);
            setSelectedDuration(template.duration_minutes.toString());
            if (template.capacity) setCapacity(template.capacity.toString());
        }
    };

    async function handleSubmit() {
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
            if (!organizationId) throw new Error('Organização não encontrada');

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
                    organization_id: organizationId,
                    class_template_id: classType,
                    start_datetime: startDateTime.toISOString(),
                    end_datetime: endDateTime.toISOString(),
                    capacity: capacityNum,
                    type: 'CLASS',
                    status: 'SCHEDULED',
                });

            if (error) throw error;

            toast({
                title: 'Aula agendada!',
                description: 'A aula foi criada com sucesso.',
            });

            onSuccess?.();
            onOpenChange(false);
        } catch (error) {
            console.error('Error creating class:', error);
            toast({
                title: 'Erro ao agendar aula',
                description: 'Não foi possível salvar os dados.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }

    const labelCls = "text-sm font-medium text-slate-700";
    const fieldCls = "h-9 rounded-xl border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:border-bee-amber focus:ring-2 focus:ring-bee-amber/20 focus:ring-offset-0";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl bg-white rounded-3xl">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-50">
                    <DialogTitle className="text-xl font-bold text-slate-900">
                        Agendar Nova Aula
                    </DialogTitle>
                    <DialogDescription className="text-slate-500">
                        Preencha as informações para criar uma nova turma.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className={labelCls}>Modalidade</Label>
                            <Select value={classType} onValueChange={handleTemplateChange}>
                                <SelectTrigger className={fieldCls}>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {classTemplates.map((template) => {
                                        const classInfo = getClassType(null, template.icon_name || template.name);
                                        const Icon = classInfo.icon;
                                        return (
                                            <SelectItem key={template.id} value={template.id}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: template.color || classInfo.color }} />
                                                    <Icon className="h-3.5 w-3.5 text-slate-400" />
                                                    <span>{template.name}</span>
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className={labelCls}>Nome da aula</Label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                <Input
                                    placeholder="Ex: Yoga Matinal"
                                    value={className}
                                    onChange={(e) => setClassName(e.target.value)}
                                    className={cn(fieldCls, "pl-9")}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className={labelCls}>Sala</Label>
                            <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                                <SelectTrigger className={fieldCls}>
                                    <div className="flex items-center gap-2">
                                        <Home className="h-3.5 w-3.5 text-slate-400" />
                                        <SelectValue placeholder="Selecione a sala" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    {rooms.map((room) => (
                                        <SelectItem key={room.id} value={room.id}>
                                            {room.name} {room.capacity ? `(${room.capacity} cap.)` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className={labelCls}>Instrutor</Label>
                            <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
                                <SelectTrigger className={fieldCls}>
                                    <div className="flex items-center gap-2">
                                        <Users className="h-3.5 w-3.5 text-slate-400" />
                                        <SelectValue placeholder="Selecione o instrutor" />
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className={labelCls}>Data</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(fieldCls, "w-full justify-start font-normal", !selectedDate && "text-slate-400")}
                                    >
                                        <CalendarIcon className="mr-2 h-3.5 w-3.5 text-slate-400" />
                                        {selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione...'}
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

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Início</Label>
                                <Select value={selectedTime} onValueChange={setSelectedTime}>
                                    <SelectTrigger className={fieldCls}>
                                        <SelectValue placeholder="00:00" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px]">
                                        {TIME_SLOTS.map((time) => (
                                            <SelectItem key={time} value={time}>{time}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Capacidade</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    placeholder="0"
                                    value={capacity}
                                    onChange={(e) => setCapacity(e.target.value)}
                                    className={fieldCls}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className={labelCls}>Duração</Label>
                        <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                            <SelectTrigger className={fieldCls}>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                                    <SelectValue placeholder="Duração" />
                                </div>
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

                <DialogFooter className="px-6 pb-6 pt-4 border-t border-slate-50 flex items-center justify-between sm:justify-between">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
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
                            'Agendar Aula'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
