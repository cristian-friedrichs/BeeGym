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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export function AddressStep() {
  const { form, nextStep, prevStep } = useFormContext();
  const { control } = form;
  
  const handleNext = async () => {
    const isValid = await form.trigger(['address', 'birthDate']);
    if (isValid) {
      nextStep();
    }
  }

  return (
    <Card className="shadow-soft rounded-2xl">
      <CardHeader>
        <CardTitle>Endereço e Dados Adicionais</CardTitle>
        <CardDescription>
          Complete o endereço e a data de nascimento do aluno.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
            <div className="sm:col-span-4">
                <FormField
                    control={control}
                    name="address.street"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Rua *</FormLabel>
                        <FormControl>
                            <Input placeholder="Nome da rua" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <div className="sm:col-span-2">
                 <FormField
                    control={control}
                    name="address.number"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Número *</FormLabel>
                        <FormControl>
                            <Input placeholder="Ex: 123" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
         <FormField
            control={control}
            name="address.complement"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Complemento</FormLabel>
                <FormControl>
                    <Input placeholder="Apto, bloco, etc." {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
                control={control}
                name="address.neighborhood"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Bairro *</FormLabel>
                    <FormControl>
                        <Input placeholder="Seu bairro" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={control}
                name="address.city"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Cidade *</FormLabel>
                    <FormControl>
                        <Input placeholder="Sua cidade" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
                control={control}
                name="address.state"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Estado *</FormLabel>
                    <FormControl>
                        <Input placeholder="Seu estado" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={control}
                name="address.zip"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>CEP *</FormLabel>
                    <FormControl>
                        <Input placeholder="00000-000" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
         <FormField
          control={control}
          name="birthDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data de Nascimento</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "dd/MM/yyyy")
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
      <CardFooter className="justify-between">
        <Button variant="ghost" onClick={prevStep} type="button">Voltar</Button>
        <Button onClick={handleNext} type="button">Continuar</Button>
      </CardFooter>
    </Card>
  );
}