'use client';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function IdentificationStep() {
  const { form, nextStep } = useFormContext();
  const { control } = form;
  const [units, setUnits] = useState<any[]>([]);

  useEffect(() => {
    const storedUnits = JSON.parse(localStorage.getItem('units_data') || '[]');
    setUnits(storedUnits);
  }, []);

  const handleNext = async () => {
    const isValid = await form.trigger(['name', 'cpf', 'email', 'phone', 'primaryUnitId']);
    if (isValid) {
      nextStep();
    }
  }

  return (
    <Card className="shadow-soft rounded-2xl">
      <CardHeader>
        <CardTitle>Identificação e Unidade</CardTitle>
        <CardDescription>
          Informações básicas para o cadastro do novo aluno e sua unidade principal.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src="" alt="Avatar" />
            <AvatarFallback>
              {form.getValues('name')?.substring(0, 2).toUpperCase() || 'AV'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2">
            <Button variant="outline" type="button">
              <Upload className="mr-2 h-4 w-4" />
              Enviar Foto
            </Button>
            <p className="text-xs text-muted-foreground">JPG, GIF ou PNG. Tamanho máximo de 800KB.</p>
          </div>
        </div>

        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo *</FormLabel>
              <FormControl>
                <Input placeholder="Nome completo do aluno" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF *</FormLabel>
                <FormControl>
                  <Input placeholder="000.000.000-00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone (WhatsApp) *</FormLabel>
                <FormControl>
                  <Input placeholder="(00) 00000-0000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail *</FormLabel>
              <FormControl>
                <Input type="email" placeholder="email@exemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="primaryUnitId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unidade Principal *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-11 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-xl focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                    <SelectValue placeholder="Selecione a unidade principal do aluno" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {units.map(unit => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
      <CardFooter>
        <Button onClick={handleNext} type="button">Continuar</Button>
      </CardFooter>
    </Card>
  );
}

