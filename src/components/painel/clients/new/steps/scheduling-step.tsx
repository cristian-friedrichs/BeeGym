'use client';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFormContext } from '../form-context';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCapacityCheck } from '@/hooks/use-capacity-check';
import { generateFixedScheduleEvents } from '@/lib/generate-fixed-schedule';
import { useOrganizationSettings } from '@/hooks/use-organization-settings';
import { AlertCircle, Calendar, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Segunda' },
  { value: 'tuesday', label: 'Terça' },
  { value: 'wednesday', label: 'Quarta' },
  { value: 'thursday', label: 'Quinta' },
  { value: 'friday', label: 'Sexta' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
];

export function SchedulingStep() {
  const { form, prevStep } = useFormContext();
  const { control, watch } = form;
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();
  const { checkCapacity } = useCapacityCheck();
  const { settings } = useOrganizationSettings();

  const [schedulingMode, setSchedulingMode] = useState<'fixed' | 'free'>('free');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [dayTimes, setDayTimes] = useState<Record<string, string>>({});
  const [capacityStatus, setCapacityStatus] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const planType = watch('plan.planType');
  const frequencyLimit = watch('plan.frequencyLimit');
  const totalCredits = watch('plan.totalCredits');

  // Generate time slots dynamically based on organization opening_hours
  const [availableTimeSlots, setAvailableTimeSlots] = useState<Record<string, string[]>>({});

  // Generate time slots for each day when settings load
  useEffect(() => {
    if (settings.opening_hours) {
      const slotsPerDay: Record<string, string[]> = {};

      DAYS_OF_WEEK.forEach(({ value: dayKey }) => {
        const dayHours = settings.opening_hours?.[dayKey];

        if (dayHours && dayHours.open) {
          const slots: string[] = [];
          const [startHour, startMin] = dayHours.start.split(':').map(Number);
          const [endHour, endMin] = dayHours.end.split(':').map(Number);

          const startMinutes = startHour * 60 + startMin;
          const endMinutes = endHour * 60 + endMin;
          const sessionDuration = settings.default_session_duration || 60;

          // Generate slots every 30 minutes
          for (let time = startMinutes; time + sessionDuration <= endMinutes; time += 30) {
            const hours = Math.floor(time / 60);
            const minutes = time % 60;
            slots.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
          }

          slotsPerDay[dayKey] = slots;
        } else {
          slotsPerDay[dayKey] = [];
        }
      });

      setAvailableTimeSlots(slotsPerDay);
    }
  }, [settings.opening_hours, settings.default_session_duration]);

  // Handle day selection
  const handleDayToggle = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
      const newDayTimes = { ...dayTimes };
      delete newDayTimes[day];
      setDayTimes(newDayTimes);
    } else {
      // Check if day is open
      const dayHours = settings.opening_hours?.[day];
      if (!dayHours || !dayHours.open) {
        toast({
          title: 'Dia Fechado',
          description: 'A academia não funciona neste dia.',
          variant: 'destructive',
        });
        return;
      }

      // Check frequency limit
      if (frequencyLimit && selectedDays.length >= frequencyLimit) {
        toast({
          title: 'Limite de Frequência Atingido',
          description: `Este plano permite apenas ${frequencyLimit}x por semana.`,
          variant: 'destructive',
        });
        return;
      }
      setSelectedDays([...selectedDays, day]);
    }
  };

  // Handle time selection for a specific day
  const handleTimeSelection = async (day: string, time: string) => {
    // Check capacity
    const result = await checkCapacity(day, time);

    if (result.isFull) {
      toast({
        title: 'Horário Lotado',
        description: `Este horário já atingiu a capacidade máxima de ${result.maxCapacity} aluno(s).`,
        variant: 'destructive',
      });
      return;
    }

    setDayTimes({ ...dayTimes, [day]: time });
    setCapacityStatus({ ...capacityStatus, [`${day}-${time}`]: result.isFull });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const formData = form.getValues();

      // Get current user and organization
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: userData } = await (supabase as any)
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userData?.organization_id) throw new Error('Organization not found');

      // Prepare fixed schedule if applicable
      const fixedSchedule = schedulingMode === 'fixed'
        ? selectedDays.map(day => ({
          dayOfWeek: day,
          time: dayTimes[day] || '',
        })).filter(slot => slot.time)
        : [];

      // Validate fixed schedule
      if (schedulingMode === 'fixed' && fixedSchedule.length === 0) {
        toast({
          title: 'Agendamento Incompleto',
          description: 'Por favor, selecione pelo menos um dia e horário.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // 1. Create student in Supabase
      // NOTE: address/cpf/scheduling_mode columns don't exist on students table.
      // They were referencing a schema version that never landed. Removed to
      // prevent silent INSERT failure. If needed, add them via migration first.
      const { data: student, error: studentError } = await (supabase as any)
        .from('students')
        .insert({
          full_name: formData.name,
          email: formData.email,
          phone: formData.phone,
          birth_date: formData.birthDate ? format(formData.birthDate, 'yyyy-MM-dd') : null,
          organization_id: userData.organization_id,
          unit_id: formData.primaryUnitId,
          plan_id: formData.plan.planId,
          status: 'ACTIVE',
          credits_balance: planType === 'PACKAGE' ? totalCredits : null,
        })
        .select()
        .single();

      if (studentError) throw studentError;

      // 2. Create student plan history entry (replaces non-existent 'subscriptions' table)
      const { error: subscriptionError } = await (supabase as any)
        .from('student_plan_history')
        .insert({
          student_id: student.id,
          plan_id: formData.plan.planId,
          discount_type: formData.plan.discount.type,
          discount_value: formData.plan.discount.value,
          started_at: new Date().toISOString(),
          expiration_date: format(formData.plan.dueDate, 'yyyy-MM-dd'),
        });

      if (subscriptionError) throw subscriptionError;

      // 3. Generate fixed schedule events if applicable
      if (schedulingMode === 'fixed' && fixedSchedule.length > 0) {
        const result = await generateFixedScheduleEvents({
          studentId: student.id,
          organizationId: userData.organization_id,
          unitId: formData.primaryUnitId,
          fixedSchedule,
          duration: settings.default_session_duration,
          monthsAhead: 1,
        });

        if (!result.success) {
          console.error('Error generating schedule:', result.error);
          toast({
            title: 'Aluno criado, mas houve um problema ao gerar a agenda',
            description: 'Você pode adicionar as aulas manualmente.',
            variant: 'destructive',
          });
        }
      }

      toast({
        title: 'Aluno criado com sucesso!',
        description: schedulingMode === 'fixed'
          ? 'As aulas foram agendadas automaticamente para o próximo mês.'
          : 'O aluno pode agendar suas aulas conforme disponibilidade.',
      });

      router.push('/clients');
    } catch (error: any) {
      console.error('Error creating student:', error);
      toast({
        title: 'Erro ao criar aluno',
        description: error.message || 'Por favor, tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-soft rounded-2xl">
      <CardHeader>
        <CardTitle>Agendamento</CardTitle>
        <CardDescription>
          Configure como o aluno irá agendar suas aulas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scheduling Mode Selection */}
        <div className="space-y-3">
          <Label>Modo de Agendamento *</Label>
          <RadioGroup value={schedulingMode} onValueChange={(value: 'fixed' | 'free') => setSchedulingMode(value)}>
            <div className="flex items-center space-x-2 border rounded-lg p-4">
              <RadioGroupItem value="fixed" id="fixed" />
              <Label htmlFor="fixed" className="flex-1 cursor-pointer">
                <div className="font-medium">Horário Fixo</div>
                <div className="text-sm text-muted-foreground">
                  O aluno terá dias e horários fixos semanais
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 border rounded-lg p-4">
              <RadioGroupItem value="free" id="free" />
              <Label htmlFor="free" className="flex-1 cursor-pointer">
                <div className="font-medium">Agendamento Livre</div>
                <div className="text-sm text-muted-foreground">
                  O aluno agenda conforme disponibilidade
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Fixed Schedule Configuration */}
        {schedulingMode === 'fixed' && (
          <div className="space-y-4">
            {frequencyLimit && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Este plano permite até {frequencyLimit}x por semana. Selecione até {frequencyLimit} dia(s).
                </AlertDescription>
              </Alert>
            )}

            {/* Day Selection */}
            <div className="space-y-2">
              <Label>Dias da Semana *</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <Button
                    key={day.value}
                    type="button"
                    variant={selectedDays.includes(day.value) ? 'default' : 'outline'}
                    onClick={() => handleDayToggle(day.value)}
                    className="w-full"
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Time Selection for Each Day */}
            {selectedDays.length > 0 && (
              <div className="space-y-4">
                <Label>Horários *</Label>
                {selectedDays.map(day => {
                  const dayLabel = DAYS_OF_WEEK.find(d => d.value === day)?.label;
                  return (
                    <div key={day} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{dayLabel}</span>
                      </div>
                      <Select
                        value={dayTimes[day] || ''}
                        onValueChange={(time) => handleTimeSelection(day, time)}
                      >
                        <SelectTrigger className="h-11 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-xl focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                          <SelectValue placeholder="Selecione um horário" />
                        </SelectTrigger>
                        <SelectContent>
                          {(availableTimeSlots[day] || []).map((slot: string) => {
                            const key = `${day}-${slot}`;
                            const isFull = capacityStatus[key];
                            return (
                              <SelectItem key={slot} value={slot} disabled={isFull}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{slot}</span>
                                  {isFull && <Badge variant="destructive" className="ml-2">Lotado</Badge>}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Free Scheduling Info */}
        {schedulingMode === 'free' && (
          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertDescription>
              O aluno poderá agendar suas aulas conforme disponibilidade no calendário.
              {planType === 'PACKAGE' && totalCredits && (
                <div className="mt-2 font-medium">
                  Créditos disponíveis: {totalCredits} aulas
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Summary */}
        <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
          <h4 className="font-bold">Resumo</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Nome</p>
              <p className="font-medium">{watch('name')}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Plano</p>
              <p className="font-medium">{watch('plan.planId')}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Agendamento</p>
              <p className="font-medium">
                {schedulingMode === 'fixed' ? 'Horário Fixo' : 'Livre'}
              </p>
            </div>
            {schedulingMode === 'fixed' && selectedDays.length > 0 && (
              <div>
                <p className="text-muted-foreground">Dias/Horários</p>
                <div className="space-y-1">
                  {selectedDays.map(day => {
                    const dayLabel = DAYS_OF_WEEK.find(d => d.value === day)?.label;
                    const time = dayTimes[day];
                    return time ? (
                      <p key={day} className="font-medium text-xs">
                        {dayLabel}: {time}
                      </p>
                    ) : null;
                  })}
                </div>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Vencimento da Fatura</p>
              <p className="font-medium">{format(watch('plan.dueDate'), 'dd/MM/yyyy')}</p>
            </div>
          </div>
        </div>

        {/* Reminders */}
        <div className="space-y-4">
          <FormField
            control={control}
            name="reminders.email"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Enviar lembretes de pagamento por e-mail.
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="reminders.whatsapp"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Enviar lembretes de pagamento por WhatsApp.
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>

      </CardContent>
      <CardFooter className="justify-between">
        <Button variant="ghost" onClick={prevStep} type="button" disabled={isSubmitting}>
          Voltar
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Criando...' : 'Criar Aluno'}
        </Button>
      </CardFooter>
    </Card>
  );
}
