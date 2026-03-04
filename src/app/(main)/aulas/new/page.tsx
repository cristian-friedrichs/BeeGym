'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUnit } from '@/context/UnitContext';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { iconCategories, classColors, getIcon, RecurringClass, classIcons } from '@/lib/class-definitions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import React from 'react';

const classSchema = z.object({
  name: z.string().min(3, { message: 'O nome da aula deve ter pelo menos 3 caracteres.' }),
  instructor: z.string().min(1, { message: 'O instrutor é obrigatório.' }),
  location: z.string().min(1, { message: 'O local é obrigatório.' }),
  icon: z.string().min(1, { message: 'Selecione um ícone.' }),
  color: z.string().min(1, { message: 'Selecione uma cor.' }),
  startDate: z.date({ required_error: 'A data de início é obrigatória.' }),
  endDate: z.date().optional(),
  daysOfWeek: z.array(z.string()).min(1, { message: 'Selecione pelo menos um dia da semana.' }),
  time: z.string().min(1, { message: 'O horário é obrigatório.' }),
  duration: z.string().min(1, { message: 'A duração é obrigatória.' }),
  capacity: z.number().min(1).optional(),
});

type ClassFormValues = z.infer<typeof classSchema>;

const weekDays = [
  { value: "1", label: "Seg" }, { value: "2", label: "Ter" }, { value: "3", label: "Qua" },
  { value: "4", label: "Qui" }, { value: "5", label: "Sex" }, { value: "6", label: "Sab" }, { value: "0", label: "Dom" },
];

const timeSlots: string[] = Array.from({ length: 17 * 2 }, (_, i) => {
  const hour = 6 + Math.floor(i / 2);
  const minute = (i % 2) * 30;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
});

const instructors = [
  { value: 'Kristin Watson', label: 'Kristin Watson' },
  { value: 'John Doe', label: 'John Doe' },
  { value: 'Sarah Jenkins', label: 'Sarah Jenkins' },
];

const locations = [
  { value: 'Estúdio A', label: 'Estúdio A' },
  { value: 'Estúdio B (Pilates)', label: 'Estúdio B (Pilates)' },
  { value: 'Área Externa', label: 'Área Externa' },
  { value: 'Online', label: 'Online' },
];

export default function NewClassPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { register, handleSubmit, control, formState: { errors } } = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
  });
  const { currentUnitId } = useUnit();

  useEffect(() => {
    if (!currentUnitId) {
      toast({ title: 'Nenhuma unidade selecionada', description: 'Por favor, selecione uma unidade para criar uma aula.', variant: 'destructive' });
      router.back();
    }
  }, [currentUnitId, router, toast]);

  const onSubmit = (data: ClassFormValues) => {
    if (!currentUnitId) {
      toast({ title: 'Nenhuma unidade selecionada', description: 'Ocorreu um erro ao identificar a unidade ativa.', variant: 'destructive' });
      return;
    }
    const selectedColor = classColors.find(c => c.value === data.color);

    const newClass: RecurringClass = {
      id: Date.now(),
      status: 'active',
      ...data,
      unitId: currentUnitId,
      duration: parseInt(data.duration, 10),
      color: selectedColor?.value || 'primary',
      startDate: format(data.startDate, 'yyyy-MM-dd'),
      endDate: data.endDate ? format(data.endDate, 'yyyy-MM-dd') : undefined,
    };

    const existingClasses = JSON.parse(localStorage.getItem('recurring_classes') || '[]');
    localStorage.setItem('recurring_classes', JSON.stringify([...existingClasses, newClass]));

    toast({
      title: 'Aula criada com sucesso!',
      description: `A aula "${data.name}" foi adicionada.`,
    });
    router.push('/aulas');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Criar Nova Aula Coletiva</h1>
          <p className="text-muted-foreground">Defina os detalhes da sua nova aula recorrente.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
          <CardDescription>Identifique a aula, o instrutor e o local.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Aula</Label>
            <Input id="name" {...register('name')} />
            <p className="text-sm text-destructive">{errors.name?.message}</p>
          </div>
          <Controller
            control={control}
            name="instructor"
            render={({ field }) => (
              <div className="space-y-2">
                <Label>Instrutor</Label>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um instrutor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {instructors.map(instructor => (
                      <SelectItem key={instructor.value} value={instructor.value}>{instructor.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-destructive">{errors.instructor?.message}</p>
              </div>
            )}
          />
          <Controller
            control={control}
            name="location"
            render={({ field }) => (
              <div className="space-y-2 md:col-span-2">
                <Label>Local</Label>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um local..." />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(location => (
                      <SelectItem key={location.value} value={location.value}>{location.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-destructive">{errors.location?.message}</p>
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Identidade Visual</CardTitle>
          <CardDescription>Escolha um ícone e uma cor para identificar a aula no sistema.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Controller
            control={control}
            name="icon"
            render={({ field }) => (
              <div className="space-y-2">
                <Label>Ícone</Label>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-between text-left font-normal h-10">
                      {field.value ? (
                        <div className="flex items-center gap-2">
                          {React.createElement(getIcon(field.value), { className: 'h-5 w-5' })}
                          <span>{classIcons.find(i => i.value === field.value)?.label}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Selecione um ícone...</span>
                      )}
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Selecione um Ícone</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                      {Object.entries(iconCategories).map(([category, icons]) => (
                        <div key={category}>
                          <h3 className="font-semibold mb-4 text-lg tracking-tight">{category}</h3>
                          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
                            {icons.map(icon => (
                              <DialogClose key={icon.value} asChild>
                                <button
                                  onClick={() => field.onChange(icon.value)}
                                  className={cn(
                                    "flex flex-col items-center justify-center gap-2 p-3 border rounded-xl aspect-square hover:bg-accent hover:border-primary transition-colors",
                                    field.value === icon.value && "bg-accent border-primary ring-2 ring-primary"
                                  )}
                                >
                                  {React.createElement(icon.icon, { className: 'h-7 w-7' })}
                                  <span className="text-xs text-center truncate w-full">{icon.label}</span>
                                </button>
                              </DialogClose>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
                <p className="text-sm text-destructive">{errors.icon?.message}</p>
              </div>
            )}
          />
          <Controller control={control} name="color" render={({ field }) => (
            <div className="space-y-2">
              <Label>Cor</Label>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger><SelectValue placeholder="Selecione uma cor..." /></SelectTrigger>
                <SelectContent>
                  {classColors.map(color => (
                    <SelectItem key={color.value} value={color.value}><div className="flex items-center gap-2"><div className={`w-4 h-4 rounded-full ${color.background}`}></div> {color.label}</div></SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-destructive">{errors.color?.message}</p>
            </div>
          )} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agendamento Recorrente</CardTitle>
          <CardDescription>Defina quando a aula irá acontecer.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Controller control={control} name="startDate" render={({ field }) => (
              <div className="space-y-2 flex flex-col"><Label>Data de Início</Label>
                <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha a data</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover>
                <p className="text-sm text-destructive">{errors.startDate?.message}</p>
              </div>
            )} />
            <Controller control={control} name="endDate" render={({ field }) => (
              <div className="space-y-2 flex flex-col"><Label>Data de Término (Opcional)</Label>
                <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Sem data final</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover>
              </div>
            )} />
          </div>
          <Controller control={control} name="daysOfWeek" render={({ field }) => (
            <div className="space-y-2"><Label>Dias da Semana</Label>
              <ToggleGroup type="multiple" variant="outline" value={field.value} onValueChange={field.onChange} className="flex flex-wrap gap-2 justify-start">{weekDays.map(day => <ToggleGroupItem key={day.value} value={day.value} className="w-12 h-12 rounded-lg">{day.label}</ToggleGroupItem>)}</ToggleGroup>
              <p className="text-sm text-destructive">{errors.daysOfWeek?.message}</p>
            </div>
          )} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Controller control={control} name="time" render={({ field }) => (
              <div className="space-y-2"><Label>Horário</Label>
                <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{timeSlots.map(slot => (<SelectItem key={slot} value={slot}>{slot}</SelectItem>))}</SelectContent>
                </Select>
                <p className="text-sm text-destructive">{errors.time?.message}</p>
              </div>
            )} />
            <Controller control={control} name="duration" render={({ field }) => (
              <div className="space-y-2"><Label>Duração</Label>
                <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="45">45 minutos</SelectItem>
                    <SelectItem value="60">60 minutos</SelectItem>
                    <SelectItem value="90">90 minutos</SelectItem>
                    <SelectItem value="120">120 minutos</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-destructive">{errors.duration?.message}</p>
              </div>
            )} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Regras e Capacidade</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label htmlFor="capacity">Capacidade Máxima (Opcional)</Label><Input id="capacity" type="number" placeholder="Deixe em branco para ilimitado" {...register('capacity', { valueAsNumber: true })} /><p className="text-sm text-destructive">{errors.capacity?.message}</p></div>
        </CardContent>
      </Card>

      <CardFooter className="flex justify-end gap-2">
        <Button variant="ghost" type="button" onClick={() => router.back()}>Cancelar</Button>
        <Button type="submit">Salvar Aula</Button>
      </CardFooter>
    </form>
  );
}

