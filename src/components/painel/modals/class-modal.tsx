'use client';

import { useState, useEffect, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import {
    CalendarIcon, Users, Home, Loader2, X, Check, LayoutGrid, User
} from 'lucide-react';
import { format, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { getClassType } from '@/lib/class-definitions';

interface ClassModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    initialDate?: Date;
    initialTime?: string;
    eventId?: string;
}

interface Room { id: string; name: string; capacity: number | null; }
interface Instructor { id: string; full_name: string; }

const CLASS_TYPES = [
    { value: 'yoga', label: 'Yoga' },
    { value: 'pilates', label: 'Pilates' },
    { value: 'crossfit', label: 'Crossfit' },
    { value: 'musculacao', label: 'Musculação' },
    { value: 'spinning', label: 'Spinning' },
    { value: 'funcional', label: 'Funcional' },
    { value: 'natacao', label: 'Natação' },
    { value: 'danca', label: 'Dança' },
    { value: 'outro', label: 'Outro' },
];

export function ClassModal({ open, onOpenChange, onSuccess, initialDate, initialTime, eventId }: ClassModalProps) {
    const { toast } = useToast();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);

    // Data
    const [rooms, setRooms] = useState<Room[]>([]);
    const [instructors, setInstructors] = useState<Instructor[]>([]);

    // Form State
    const [classType, setClassType] = useState('');
    const [title, setTitle] = useState('');
    const [selectedRoom, setSelectedRoom] = useState('');
    const [selectedInstructor, setSelectedInstructor] = useState('');
    const [capacity, setCapacity] = useState('');
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [time, setTime] = useState('08:00');
    const [duration, setDuration] = useState('60');

    const timeSlots = useMemo(() => {
        const slots = [];
        for (let i = 6; i <= 23; i++) {
            slots.push(`${i.toString().padStart(2, '0')}:00`);
            slots.push(`${i.toString().padStart(2, '0')}:30`);
        }
        return slots;
    }, []);

    useEffect(() => {
        if (!open) return;
        const now = initialDate || new Date();
        setDate(now);
        setTime(initialTime || '08:00');
        setTitle('');
        setClassType('');
        setSelectedRoom('');
        setSelectedInstructor('');
        setCapacity('');
        setDuration('60');
        fetchData();
    }, [open]);

    async function fetchData() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: profile } = await (supabase as any).from('profiles').select('organization_id').eq('id', user.id).single();
            if (!(profile as any)?.organization_id) return;
            const orgId = (profile as any).organization_id;

            const [{ data: roomsData }, { data: instructorsData }] = await Promise.all([
                (supabase as any).from('rooms').select('id, name, capacity').eq('organization_id', orgId).order('name'),
                (supabase as any).from('instructors').select('id, name').eq('organization_id', orgId).order('name'),
            ]);

            if (roomsData) setRooms(roomsData);
            if (instructorsData) setInstructors(instructorsData.map((i: any) => ({ id: i.id, full_name: i.name })));
        } catch (err) {
            console.error('ClassModal fetchData error:', err);
        }
    }

    async function handleSave() {
        if (!title || !date || !time || !selectedInstructor || !capacity) {
            toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' });
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Não autenticado');
            const { data: profile } = await (supabase as any).from('profiles').select('organization_id').eq('id', user.id).single();
            if (!(profile as any)?.organization_id) throw new Error('Organização não encontrada');
            const orgId = (profile as any).organization_id;

            const dateStr = format(date, 'yyyy-MM-dd');
            const startDateTime = new Date(`${dateStr}T${time}:00`);
            const endDateTime = addMinutes(startDateTime, parseInt(duration));

            const payload = {
                title,
                organization_id: orgId,
                instructor_id: selectedInstructor || null,
                room_id: selectedRoom || null,
                start_datetime: startDateTime.toISOString(),
                end_datetime: endDateTime.toISOString(),
                capacity: parseInt(capacity) || null,
                type: 'CLASS',
                status: 'SCHEDULED',
            };

            const { error } = await (supabase as any).from('calendar_events').insert(payload);
            if (error) throw error;

            toast({ title: 'Aula criada com sucesso!' });
            onSuccess?.();
            onOpenChange(false);
        } catch (error: any) {
            toast({ title: 'Erro ao criar aula', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }

    const selectedInstructorName = instructors.find(i => i.id === selectedInstructor)?.full_name;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-xl p-0 overflow-hidden border-l border-slate-100 shadow-2xl flex flex-col h-full bg-white">

                {/* Header — same premium pattern as WorkoutModal */}
                <SheetHeader className="p-6 border-b border-slate-50 bg-white shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="h-12 w-12 rounded-xl bg-bee-amber/10 flex items-center justify-center border border-bee-amber/20">
                            <LayoutGrid className="h-6 w-6 text-bee-amber" />
                        </div>
                        <div className="text-left">
                            <SheetTitle className="text-xl font-bold tracking-tight text-bee-midnight uppercase">
                                Nova Aula
                            </SheetTitle>
                            <p className="text-slate-400 font-medium text-xs">Agende uma aula para a turma</p>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Tipo & Nome */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tipo de Aula *</Label>
                            <Select value={classType} onValueChange={v => { setClassType(v); if (!title) setTitle(CLASS_TYPES.find(t => t.value === v)?.label || ''); }}>
                                <SelectTrigger className="h-11 rounded-2xl border-slate-100 bg-slate-50/50 font-semibold text-bee-midnight px-5 focus:ring-bee-amber/20">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                                    {CLASS_TYPES.map(t => (
                                        <SelectItem key={t.value} value={t.value} className="py-3 focus:bg-bee-amber/10 rounded-xl mx-1 my-0.5 font-medium">
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome da Aula *</Label>
                            <Input
                                placeholder="Ex: Yoga Matinal"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="h-11 rounded-2xl border-slate-100 bg-slate-50/50 font-semibold text-bee-midnight px-5 focus:ring-bee-amber/20"
                            />
                        </div>
                    </div>

                    {/* Instrutor */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Instrutor *</Label>
                        <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
                            <SelectTrigger className="h-11 rounded-2xl border-slate-100 bg-slate-50/50 font-semibold text-bee-midnight px-5 focus:ring-bee-amber/20">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-60 rounded-2xl border-slate-100 shadow-xl">
                                {instructors.map(i => (
                                    <SelectItem key={i.id} value={i.id} className="py-3 focus:bg-bee-amber/10 rounded-xl mx-1 my-0.5 font-medium">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-slate-400" />
                                            <span>{i.full_name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                                {instructors.length === 0 && (
                                    <div className="p-4 text-xs font-semibold text-slate-400 text-center">Nenhum instrutor encontrado.</div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Sala & Capacidade */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Sala</Label>
                            <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                                <SelectTrigger className="h-11 rounded-2xl border-slate-100 bg-slate-50/50 font-semibold text-bee-midnight px-5 focus:ring-bee-amber/20">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                                    {rooms.map(r => (
                                        <SelectItem key={r.id} value={r.id} className="py-3 focus:bg-bee-amber/10 rounded-xl mx-1 my-0.5 font-medium">
                                            {r.name} {r.capacity ? `(${r.capacity})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Capacidade *</Label>
                            <Input
                                type="number"
                                min="1"
                                placeholder="Ex: 20"
                                value={capacity}
                                onChange={e => setCapacity(e.target.value)}
                                className="h-11 rounded-2xl border-slate-100 bg-slate-50/50 font-semibold text-bee-midnight px-5 focus:ring-bee-amber/20"
                            />
                        </div>
                    </div>

                    {/* Data & Horário */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Data *</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn('w-full h-11 justify-start text-left font-semibold border-slate-100 bg-slate-50/50 rounded-2xl px-5 hover:bg-slate-100/50', !date && 'text-muted-foreground')}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 text-bee-amber" />
                                        {date ? format(date, 'P', { locale: ptBR }) : <span>Selecione...</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-slate-100 overflow-hidden" align="start">
                                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus locale={ptBR} className="p-3" />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Horário *</Label>
                            <Select value={time} onValueChange={setTime}>
                                <SelectTrigger className="h-11 rounded-2xl border-slate-100 bg-slate-50/50 font-semibold text-bee-midnight px-5 focus:ring-bee-amber/20">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-60 rounded-2xl border-slate-100 shadow-xl">
                                    {timeSlots.map(t => <SelectItem key={t} value={t} className="py-3 focus:bg-bee-amber/10 rounded-xl mx-1 my-0.5 font-medium">{t}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Duração */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Duração (min) *</Label>
                        <Select value={duration} onValueChange={setDuration}>
                            <SelectTrigger className="h-11 rounded-2xl border-slate-100 bg-slate-50/50 font-semibold text-bee-midnight px-5 focus:ring-bee-amber/20">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                                {['30', '45', '60', '90', '120'].map(d => (
                                    <SelectItem key={d} value={d} className="py-3 focus:bg-bee-amber/10 rounded-xl mx-1 my-0.5 font-medium">
                                        {d === '30' ? '30 min' : d === '45' ? '45 min' : d === '60' ? '1 hora' : d === '90' ? '1h 30min' : '2 horas'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando...</>
                        ) : (
                            <><Check className="mr-2 h-4 w-4 stroke-[3px]" />Criar Aula</>
                        )}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
