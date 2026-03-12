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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Percent } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Plan {
  id: string;
  name: string;
  price: number;
  plan_type: 'RECURRING' | 'PACKAGE';
  frequency_limit?: number;
  total_credits?: number;
}

export function PlanStep() {
  const { form, nextStep, prevStep } = useFormContext();
  const { control, watch } = form;
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  // Fetch plans from Supabase
  useEffect(() => {
    async function fetchPlans() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: userData } = await (supabase as any)
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single();

        if (!userData?.organization_id) return;

        // Note: transitioning to canonical plans table
        const { data: plansData, error } = await (supabase as any)
          .from('plans')
          .select('*')
          .eq('organization_id', userData.organization_id)
          .eq('active', true)
          .order('name');
 
        if (error) {
          console.error('Error fetching plans:', error);
          return;
        }
 
        const mappedPlans = (plansData || []).map((p: any) => ({
          ...p,
          plan_type: p.type === 'checkin' ? 'PACKAGE' : 'RECURRING', 
          frequency_limit: p.checkin_limit,
          total_credits: p.type === 'checkin' ? p.checkin_limit : undefined
        })) as Plan[];
 
        setPlans(mappedPlans);
      } catch (error) {
        console.error('Error in fetchPlans:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlans();
  }, [supabase]);

  const handleNext = async () => {
    const isValid = await form.trigger(['plan']);
    if (isValid) {
      nextStep();
    }
  }

  const selectedPlanId = watch('plan.planId');
  const discountType = watch('plan.discount.type');
  const discountValue = watch('plan.discount.value');

  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const price = selectedPlan?.price || 0;

  // Handle plan selection - auto-populate metadata
  const handlePlanChange = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      form.setValue('plan.planId', planId);
      form.setValue('plan.planType', plan.plan_type);
      form.setValue('plan.frequencyLimit', plan.frequency_limit);
      form.setValue('plan.totalCredits', plan.total_credits);
    }
  };

  let finalPrice = price;
  if (selectedPlan) {
    if (discountType === 'PERCENT') {
      finalPrice = price * (1 - discountValue / 100);
    } else {
      finalPrice = price - discountValue;
    }
  }

  return (
    <Card className="shadow-soft rounded-2xl">
      <CardHeader>
        <CardTitle>Plano & Pagamento</CardTitle>
        <CardDescription>
          Selecione o plano, aplique descontos e defina a data de vencimento.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={control}
          name="plan.planId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plano *</FormLabel>
              <Select onValueChange={handlePlanChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-11 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-xl focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                    <SelectValue placeholder={isLoading ? "Carregando planos..." : "Selecione um plano"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {plans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>
                      <div className="flex justify-between w-full">
                        <span>{plan.name}</span>
                        <span className="text-muted-foreground">R$ {plan.price.toFixed(2)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPlan && (
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedPlan.plan_type === 'PACKAGE'
                    ? `Pacote de ${selectedPlan.total_credits} aulas`
                    : selectedPlan.frequency_limit
                      ? `${selectedPlan.frequency_limit}x por semana`
                      : 'Ilimitado'
                  }
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItem>
            <FormLabel>Desconto</FormLabel>
            <div className="flex gap-2">
              <ToggleGroup
                type="single"
                variant="outline"
                defaultValue="PERCENT"
                value={discountType}
                onValueChange={(value) => form.setValue('plan.discount.type', value as 'PERCENT' | 'ABSOLUTE')}
              >
                <ToggleGroupItem value="PERCENT" aria-label="Toggle percent">
                  <Percent className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="ABSOLUTE" aria-label="Toggle absolute">
                  R$
                </ToggleGroupItem>
              </ToggleGroup>
              <FormField
                control={control}
                name="plan.discount.value"
                render={({ field }) => (
                  <FormControl>
                    <Input type="number" placeholder="Valor do desconto" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                  </FormControl>
                )}
              />
            </div>
            <FormMessage>{form.formState.errors.plan?.discount?.value?.message}</FormMessage>
          </FormItem>

          <FormItem>
            <FormLabel>Valor Final</FormLabel>
            <div className="p-3 rounded-lg border bg-muted flex justify-between items-center">
              <span className="font-bold text-lg">R$ {finalPrice.toFixed(2)}</span>
              {discountValue > 0 && <Badge>Desconto aplicado</Badge>}
            </div>
          </FormItem>
        </div>

        <FormField
          control={control}
          name="plan.dueDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data de Vencimento da Fatura *</FormLabel>
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
                    disabled={(date) => date < new Date()}
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
