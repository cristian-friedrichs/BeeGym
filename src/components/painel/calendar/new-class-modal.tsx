'use client';

import { useState, useEffect } from 'react';
import { useUnit } from '@/context/UnitContext';
import { useOrganizationSettings } from '@/hooks/use-organization-settings';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Clock, Users, User, MapPin, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { initialClients as students } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { calculateEndTime, validateBusinessHours, hasConflict, countBookingsInSlot } from '@/lib/scheduling-validation';

// Simplified student data for this component
const activeStudents = students.filter(s => s.status === 'Ativo').map(s => ({ value: s.id.toString(), label: s.name, avatar: s.avatar }));

export function NewClassModal({ setIsOpen }: { setIsOpen: (open: boolean) => void }) {
  const { toast } = useToast();
  const { settings, isLoading: settingsLoading, getDefaultDuration } = useOrganizationSettings();
  const [classType, setClassType] = useState<'individual' | 'group' | 'open'>('individual');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string[]>([]);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>('');
  const [duration, setDuration] = useState<string>('60');
  const [location, setLocation] = useState<string>('');
  const [capacity, setCapacity] = useState<number | undefined>();
  const [openCommand, setOpenCommand] = useState(false);
  const [className, setClassName] = useState('');
  const { currentUnitId } = useUnit();

  // Auto-fill default duration when settings load
  useEffect(() => {
    if (!settingsLoading && settings) {
      const defaultDuration = getDefaultDuration();
      setDuration(defaultDuration.toString());
    }
  }, [settingsLoading, settings, getDefaultDuration]);


  const handleSave = async () => {
    if (!currentUnitId) {
      toast({ title: 'Nenhuma unidade selecionada', description: 'Ocorreu um erro ao identificar a unidade ativa.', variant: 'destructive' });
      return;
    }
    if (!date || !time) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Data e horário são obrigatórios.',
        variant: 'destructive',
      });
      return;
    }
    if (!className.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'O nome do treino é obrigatório.',
        variant: 'destructive',
      });
      return;
    }
    if (classType === 'individual' && !selectedStudent) {
      toast({
        title: 'Aluno obrigatório',
        description: 'Selecione um aluno para o treino individual.',
        variant: 'destructive',
      });
      return;
    }
    if (classType === 'group' && selectedGroup.length === 0) {
      toast({
        title: 'Alunos obrigatórios',
        description: 'Selecione pelo menos um aluno para o treino em grupo.',
        variant: 'destructive',
      });
      return;
    }

    // Calculate end time
    const endTime = calculateEndTime(time, Number(duration));

    // VALIDATION 1: Check if within opening hours
    const businessHoursValidation = validateBusinessHours(date, time, endTime, settings.opening_hours);
    if (!businessHoursValidation.valid) {
      toast({
        title: 'Horário Inválido',
        description: businessHoursValidation.message || 'O horário selecionado está fora do expediente.',
        variant: 'destructive',
      });
      return;
    }

    // Fetch existing bookings from localStorage (TODO: Replace with Supabase query)
    const existingBookings = JSON.parse(localStorage.getItem('calendar_classes') || '[]');

    // VALIDATION 2: Check for conflicts (if concurrent bookings not allowed)
    if (!settings.allow_concurrent_bookings) {
      const conflictCheck = hasConflict(
        { date, startTime: time, endTime },
        existingBookings
      );

      if (conflictCheck.hasConflict) {
        toast({
          title: 'Conflito de Horário',
          description: 'Você já tem um aluno neste horário.',
          variant: 'destructive',
        });
        return;
      }
    }

    // VALIDATION 3: Check capacity (if concurrent bookings allowed)
    if (settings.allow_concurrent_bookings) {
      const currentCount = countBookingsInSlot(date, time, endTime, existingBookings);

      if (currentCount >= settings.max_capacity_per_slot) {
        toast({
          title: 'Capacidade Máxima Atingida',
          description: `Este horário já atingiu a capacidade máxima de ${settings.max_capacity_per_slot} aluno(s).`,
          variant: 'destructive',
        });
        return;
      }
    }

    // All validations passed - proceed with save
    let clientName = className;
    let classColor = 'bg-blue-500'; // Default for open group

    if (classType === 'individual' && selectedStudent) {
      const student = activeStudents.find(s => s.value === selectedStudent);
      clientName = student?.label || 'Aluno Desconhecido';
      classColor = 'bg-primary/80';
    } else if (classType === 'group') {
      clientName = className;
      classColor = 'bg-green-500';
    }

    const newCalendarClass = {
      id: Date.now(),
      date: date.toISOString(),
      time: time,
      duration: Number(duration),
      client: clientName,
      type: className,
      color: classColor,
      classType: classType,
      unitId: currentUnitId,
    };

    try {
      // Save to general calendar
      const existingClassesJSON = localStorage.getItem('scheduled_classes');
      const existingClasses = existingClassesJSON ? JSON.parse(existingClassesJSON) : [];
      const updatedClasses = [...existingClasses, newCalendarClass];
      localStorage.setItem('scheduled_classes', JSON.stringify(updatedClasses));

      // Save to individual student profiles
      const studentIds: string[] = [];
      if (classType === 'individual' && selectedStudent) {
        studentIds.push(selectedStudent);
      } else if (classType === 'group') {
        studentIds.push(...selectedGroup);
      }

      studentIds.forEach(studentId => {
        const newWorkoutForStudent = {
          id: Date.now() + Number(studentId),
          studentId: Number(studentId),
          unitId: currentUnitId,
          name: className,
          status: 'Planejado',
          notes: `Treino agendado para ${format(date, 'dd/MM/yyyy')} às ${time}. Local: ${location}`,
          exercises: [],
          scheduling: {
            type: 'date',
            date: format(date, 'yyyy-MM-dd'),
            time: time,
            duration: Number(duration),
          }
        };
        const workoutsKey = `workouts_${studentId}`;
        const existingWorkouts = JSON.parse(localStorage.getItem(workoutsKey) || '[]');
        const updatedWorkouts = [...existingWorkouts, newWorkoutForStudent];
        localStorage.setItem(workoutsKey, JSON.stringify(updatedWorkouts));
      });


      toast({
        title: 'Treino agendado!',
        description: 'O novo treino foi adicionado ao calendário.',
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to save class to localStorage', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o treino. Verifique o console para mais detalhes.',
        variant: 'destructive'
      });
    }
  };

  // Generate time slots based on opening hours for selected date
  const getAvailableTimeSlots = (): string[] => {
    if (!date || !settings.opening_hours) {
      // Fallback to default time slots if no opening hours configured
      const defaultSlots: string[] = [];
      for (let h = 6; h < 23; h++) {
        defaultSlots.push(`${String(h).padStart(2, '0')}:00`);
        defaultSlots.push(`${String(h).padStart(2, '0')}:30`);
      }
      return defaultSlots;
    }

    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
    const daySettings = settings.opening_hours[dayOfWeek];

    if (!daySettings || !daySettings.open) {
      return []; // No slots available if day is closed
    }

    // Generate slots from opening to closing time
    const slots: string[] = [];
    const [startHour, startMin] = daySettings.start.split(':').map(Number);
    const [endHour, endMin] = daySettings.end.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      slots.push(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`);
    }

    return slots;
  };

  const timeSlots = getAvailableTimeSlots();

  // Get opening hours info for selected date
  const getOpeningHoursInfo = (): string => {
    if (!date || !settings.opening_hours) return '';

    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
    const daySettings = settings.opening_hours[dayOfWeek];

    if (!daySettings || !daySettings.open) {
      return 'Fechado neste dia';
    }

    return `Horário de atendimento: ${daySettings.start} - ${daySettings.end}`;
  };

  const handleSelectGroupMember = (studentId: string) => {
    setSelectedGroup(prev => prev.includes(studentId) ? prev.filter(s => s !== studentId) : [...prev, studentId]);
    setOpenCommand(false);
  }

  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Criar Novo Treino</DialogTitle>
        <DialogDescription>Selecione o tipo de treino e preencha os detalhes para agendar.</DialogDescription>
      </DialogHeader>
      <div className="py-4 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="class-name">Nome do Treino</Label>
          <Input id="class-name" placeholder="Ex: Treino de Força, Aula de Yoga" value={className} onChange={(e) => setClassName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Tipo de Treino</Label>
          <RadioGroup value={classType} onValueChange={(v) => setClassType(v as any)} className="grid grid-cols-3 gap-4">
            <div>
              <RadioGroupItem value="individual" id="individual" className="peer sr-only" />
              <Label htmlFor="individual" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                <User className="mb-3 h-6 w-6" />
                Individual
              </Label>
            </div>
            <div>
              <RadioGroupItem value="group" id="group" className="peer sr-only" />
              <Label htmlFor="group" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                <Users className="mb-3 h-6 w-6" />
                Grupo Definido
              </Label>
            </div>
            <div>
              <RadioGroupItem value="open" id="open" className="peer sr-only" />
              <Label htmlFor="open" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                <Clock className="mb-3 h-6 w-6" />
                Grupo Aberto
              </Label>
            </div>
          </RadioGroup>
        </div>

        {classType === 'individual' && (
          <div className="space-y-4">
            <Label>Aluno</Label>
            <Command className="overflow-visible bg-transparent">
              <div className="group border border-input px-3 py-2 text-sm ring-offset-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 bg-white">
                <div className="flex gap-1 flex-wrap items-center">
                  {selectedStudent && (
                    <Badge variant="secondary" className="mb-1">
                      {activeStudents.find(s => s.value === selectedStudent)?.label}
                      <button onClick={(e) => { e.preventDefault(); setSelectedStudent(null); }} className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    </Badge>
                  )}
                  {!selectedStudent && (
                    <CommandInput
                      placeholder="Buscar aluno..."
                      className="ml-2 bg-transparent outline-none placeholder:text-muted-foreground flex-1"
                      onFocus={() => setOpenCommand(true)}
                      onBlur={() => setTimeout(() => setOpenCommand(false), 200)}
                    />
                  )}
                </div>
              </div>
              <div className="relative mt-2">
                {openCommand && !selectedStudent && (
                  <div className="absolute w-full z-10 top-0 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
                    <CommandList className="max-h-[200px] overflow-y-auto">
                      <CommandEmpty>Nenhum aluno encontrado.</CommandEmpty>
                      <CommandGroup>
                        {activeStudents.map(student => (
                          <CommandItem
                            key={student.value}
                            value={student.label}
                            onSelect={() => { setSelectedStudent(student.value); setOpenCommand(false); }}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            {student.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </div>
                )}
              </div>
            </Command>
          </div>
        )}

        {classType === 'group' && (
          <div className="space-y-2">
            <Label>Alunos</Label>
            <Command className="overflow-visible bg-transparent">
              <div className="group border border-input px-3 py-2 text-sm ring-offset-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <div className="flex gap-1 flex-wrap">
                  {selectedGroup.map(studentId => {
                    const student = activeStudents.find(s => s.value === studentId);
                    return (
                      <Badge key={studentId} variant="secondary">
                        {student?.label}
                        <button onClick={() => handleSelectGroupMember(studentId)} className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                          <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                      </Badge>
                    );
                  })}
                  <CommandInput
                    placeholder="Buscar alunos..."
                    className="ml-2 bg-transparent outline-none placeholder:text-muted-foreground flex-1"
                    onFocus={() => setOpenCommand(true)}
                    onBlur={() => setTimeout(() => setOpenCommand(false), 200)}
                  />
                </div>
              </div>
              <div className="relative mt-2">
                {openCommand ? (
                  <div className="absolute w-full z-10 top-0 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
                    <CommandList className="max-h-[200px] overflow-y-auto">
                      <CommandEmpty>Nenhum aluno encontrado.</CommandEmpty>
                      <CommandGroup>
                        {activeStudents.filter(s => !selectedGroup.includes(s.value)).map(student => (
                          <CommandItem
                            key={student.value}
                            value={student.label}
                            onSelect={() => handleSelectGroupMember(student.value)}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            {student.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </div>
                ) : null}
              </div>
            </Command>
          </div>
        )}

        {classType === 'open' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacidade Máxima</Label>
              <Input id="capacity" type="number" placeholder="Ex: 10 (deixe em branco para ilimitado)" value={capacity || ''} onChange={e => setCapacity(e.target.value ? Number(e.target.value) : undefined)} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: ptBR }) : <span>Escolha a data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus /></PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Horário de Início</Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o horário" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.length === 0 ? (
                  <SelectItem value="closed" disabled>Fechado neste dia</SelectItem>
                ) : (
                  timeSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {date && (
              <p className="text-xs text-muted-foreground mt-1">
                {getOpeningHoursInfo()}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="duration">Duração (minutos)</Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="60"
            />
            {settings && (
              <p className="text-xs text-muted-foreground">
                Duração padrão: {settings.default_session_duration} minutos
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Local</Label>
            <Input placeholder="Ex: Academia Bluefit, Online" value={location} onChange={e => setLocation(e.target.value)} />
          </div>
        </div>

      </div>
      <DialogFooter>
        <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
        <Button onClick={handleSave}>Agendar Treino</Button>
      </DialogFooter>
    </DialogContent>
  );
}
