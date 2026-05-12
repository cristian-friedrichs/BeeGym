'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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

const fieldCls = 'h-9 rounded-xl border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:border-bee-amber focus:ring-2 focus:ring-bee-amber/20 focus:ring-offset-0';
const labelCls = 'text-sm font-medium text-slate-700';

export function ClassModal({ open, onOpenChange, onSuccess, initialDate, initialTime, eventId }: ClassModalProps) {
    const { toast } = useToast();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);

    const [rooms, setRooms] = useState<Room[]>([]);
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);

    const [title, setTitle] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
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
        setDate(initialDate || new Date());
        setTime(initialTime || '08:00');
        setTitle('');
        setSelectedTemplateId(null);
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

            const [{ data: roomsData }, { data: instructorsData }, { data: templatesData }] = await Promise.all([
                (supabase as any).from('rooms').select('id, name, capacity').eq('organization_id', orgId).order('name'),
                (supabase as any).from('instructors').select('id, name').eq('organization_id', orgId).order('name'),
                (supabase as any).from('class_templates').select('*').eq('organization_id', orgId).order('title'),
            ]);

            if (roomsData) setRooms(roomsData);
            if (instructorsData) setInstructors(instructorsData.map((i: any) => ({ id: i.id, full_name: i.name })));
            if (templatesData) setTemplates(templatesData);
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
                class_template_id: selectedTemplateId || null,
                start_datetime: format(startDateTime, "yyyy-MM-dd'T'HH:mm:ss"),
                end_datetime: format(endDateTime, "yyyy-MM-dd'T'HH:mm:ss"),
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[576px] p-0 gap-0 rounded-2xl overflow-hidden">

                {/* Header */}
                <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100">
                    <DialogTitle className="text-[17px] font-semibold text-slate-900 leading-tight">
                        Nova Aula
                    </DialogTitle>
                    <p className="text-sm text-slate-500 mt-0.5">Agende uma aula coletiva para sua turma.</p>
                </DialogHeader>

                {/* Body */}
                <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className={labelCls}>Modalidade</Label>
                            <Select
                                value={selectedTemplateId || ''}
                                onValueChange={v => {
                                    setSelectedTemplateId(v);
                                    const template = templates.find(t => t.id === v);
                                    if (template) {
                                        setTitle(template.title);
                                        if (template.duration_minutes) setDuration(template.duration_minutes.toString());
                                    }
                                }}
                            >
                                <SelectTrigger className={fieldCls}>
                                    <SelectValue placeholder="Selecione…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {templates.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                                    ))}
                                    {templates.length === 0 && (
                                        <div className="px-4 py-3 text-sm text-slate-400 text-center">Nenhuma modalidade cadastrada.</div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className={labelCls}>Nome da aula *</Label>
                            <Input
                                placeholder="Ex: Yoga Matinal"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className={fieldCls}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className={labelCls}>Instrutor *</Label>
                        <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
                            <SelectTrigger className={fieldCls}>
                                <SelectValue placeholder="Selecione…" />
                            </SelectTrigger>
                            <SelectContent>
                                {instructors.map(i => (
                                    <SelectItem key={i.id} value={i.id}>{i.full_name}</SelectItem>
                                ))}
                                {instructors.length === 0 && (
                                    <div className="px-4 py-3 text-sm text-slate-400 text-center">Nenhum instrutor encontrado.</div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className={labelCls}>Sala</Label>
                            <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                                <SelectTrigger className={fieldCls}>
                                    <SelectValue placeholder="Selecione…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {rooms.map(r => (
                                        <SelectItem key={r.id} value={r.id}>
                                            {r.name}{r.capacity ? ` (${r.capacity})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className={labelCls}>Capacidade *</Label>
                            <Input
                                type="number"
                                min="1"
                                placeholder="Ex: 20"
                                value={capacity}
                                onChange={e => setCapacity(e.target.value)}
                                className={fieldCls}
                            />
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1 space-y-1.5">
                            <Label className={labelCls}>Data *</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            fieldCls,
                                            'w-full justify-start font-normal',
                                            !date && 'text-slate-400'
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
                                        {date ? format(date, 'P', { locale: ptBR }) : 'Selecione…'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus locale={ptBR} />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-1.5">
                            <Label className={labelCls}>Horário *</Label>
                            <Select value={time} onValueChange={setTime}>
                                <SelectTrigger className={fieldCls}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-56">
                                    {timeSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className={labelCls}>Duração</Label>
                            <Select value={duration} onValueChange={setDuration}>
                                <SelectTrigger className={fieldCls}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="30">30 min</SelectItem>
                                    <SelectItem value="45">45 min</SelectItem>
                                    <SelectItem value="60">1 hora</SelectItem>
                                    <SelectItem value="90">1h 30min</SelectItem>
                                    <SelectItem value="120">2 horas</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="px-6 pb-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="h-9 rounded-full px-5 border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="h-9 rounded-full px-6 bg-bee-amber hover:bg-amber-500 text-bee-midnight font-semibold text-sm shadow-sm"
                    >
                        {loading ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Criando…</> : 'Criar aula'}
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
}
