'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from '@/components/ui/sheet';
import { MoreVertical, Edit, Power, PowerOff, Plus, Clock, CreditCard, X, Loader2, Save } from 'lucide-react';
import { PlanForm, PlanFormValues } from './plan-form';
import { createPlanAction, updatePlanAction, togglePlanStatusAction } from '@/actions/plans';
import { useToast } from '@/hooks/use-toast';
import { SectionHeader } from '@/components/ui/section-header';

interface Plan {
    id: string;
    organization_id: string;
    name: string;
    description: string | null;
    price: number;
    plan_type: 'membership' | 'pack';
    duration_months: number | null;
    recurrence: 'monthly' | 'quarterly' | 'yearly' | 'one_time' | null;
    days_per_week: number | null;
    credits: number | null;
    active: boolean;
    created_at: string;
}

interface PlanListProps {
    plans: Plan[];
    organizationId: string;
}

export function PlanList({ plans: initialPlans, organizationId }: PlanListProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(price);
    };

    const recurrenceMap: Record<string, string> = {
        monthly: 'Mensal',
        quarterly: 'Trimestral',
        yearly: 'Anual',
        one_time: 'Único',
    };

    const renderAccessRule = (plan: Plan) => {
        if (plan.plan_type === 'pack') {
            return (
                <div>
                    <Badge variant="default" className="bg-blue-500/10 text-blue-600 border-blue-200 hover:bg-blue-500/20 px-3 py-1 rounded-full uppercase text-[10px] tracking-wider font-bold">
                        {plan.credits} Crédito{plan.credits !== 1 ? 's' : ''}
                    </Badge>
                    <p className="text-xs mt-1 text-muted-foreground">
                        Validade: {plan.duration_months ? `${plan.duration_months} ${plan.duration_months === 1 ? 'mês' : 'meses'}` : 'Ilimitada'}
                    </p>
                </div>
            );
        }

        return (
            <div>
                {plan.days_per_week ? (
                    <Badge variant="secondary" className="bg-bee-amber/10 text-bee-amber border-bee-amber/20 px-3 py-1 rounded-full uppercase text-[10px] tracking-wider font-bold">
                        {plan.days_per_week}x por Semana
                    </Badge>
                ) : (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-200 px-3 py-1 rounded-full uppercase text-[10px] tracking-wider font-bold">
                        Acesso Ilimitado
                    </Badge>
                )}
                <p className="text-xs mt-1 text-muted-foreground flex items-center gap-1.5">
                    Cobrança {recurrenceMap[plan.recurrence || 'monthly']}
                    <span className="text-slate-300">•</span>
                    Duração: {plan.duration_months ? `${plan.duration_months} ${plan.duration_months === 1 ? 'mês' : 'meses'}` : 'Ilimitada'}
                </p>
            </div>
        );
    };


    const handleAddPlan = async (values: PlanFormValues) => {
        setIsLoading(true);

        // Remove null values and convert to undefined for optional fields
        const cleanValues = {
            ...values,
            duration_months: values.duration_months ?? undefined,
            recurrence: values.recurrence ?? undefined,
            days_per_week: values.days_per_week ?? undefined,
            credits: values.credits ?? undefined,
            validity_months: values.validity_months ?? undefined,
        };

        const result = await createPlanAction({ ...cleanValues, organization_id: organizationId });
        setIsLoading(false);

        if (result.success) {
            toast({ title: 'Sucesso', description: 'Plano criado com sucesso!' });
            setIsAddModalOpen(false);

            setTimeout(() => {
                router.refresh();
            }, 300);
        } else {
            toast({ title: 'Erro', description: result.error, variant: 'destructive' });
        }
    };

    const handleEditPlan = async (values: PlanFormValues) => {
        if (!editingPlan) return;
        setIsLoading(true);

        // Remove null values and convert to undefined for optional fields
        const cleanValues = {
            ...values,
            duration_months: values.duration_months ?? undefined,
            recurrence: values.recurrence ?? undefined,
            days_per_week: values.days_per_week ?? undefined,
            credits: values.credits ?? undefined,
            validity_months: values.validity_months ?? undefined,
        };

        const result = await updatePlanAction(editingPlan.id, cleanValues);
        setIsLoading(false);

        if (result.success) {
            toast({ title: 'Sucesso', description: 'Plano atualizado com sucesso!' });
            setEditingPlan(null);

            setTimeout(() => {
                router.refresh();
            }, 300);
        } else {
            toast({ title: 'Erro', description: result.error, variant: 'destructive' });
        }
    };

    const handleToggleStatus = async (planId: string, currentStatus: boolean) => {
        setIsLoading(true);
        const result = await togglePlanStatusAction(planId, !currentStatus);
        setIsLoading(false);

        if (result.success) {
            toast({
                title: 'Sucesso',
                description: `Plano ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`
            });
            router.refresh();
        } else {
            toast({ title: 'Erro', description: result.error, variant: 'destructive' });
        }
    };

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Planos de Venda"
                subtitle="Gerencie os planos e pacotes de serviços oferecidos"
                action={
                    <Button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-bee-amber hover:bg-amber-500 text-deep-midnight font-bold h-9 px-4 rounded-full shadow-lg shadow-bee-amber/10 transition-all hover:scale-[1.02] active:scale-[0.98] text-[11px] uppercase tracking-wider"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Plano
                    </Button>
                }
            />

            <Card className="rounded-[2rem] shadow-sm border-slate-100 overflow-hidden bg-white">

                <CardContent className="p-0">
                    <div className="overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="font-semibold">Nome</TableHead>
                                    <TableHead className="font-semibold">Preço</TableHead>
                                    <TableHead className="w-[200px]">Regra de Acesso</TableHead>
                                    <TableHead className="font-semibold">Status</TableHead>
                                    <TableHead className="text-right font-semibold">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {initialPlans.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            Nenhum plano cadastrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    initialPlans.map((plan) => (
                                        <TableRow key={plan.id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-foreground">{plan.name}</span>
                                                    {plan.description && (
                                                        <span className="text-xs text-muted-foreground line-clamp-1">
                                                            {plan.description}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">{formatPrice(plan.price)}</TableCell>
                                            <TableCell>
                                                {renderAccessRule(plan)}
                                            </TableCell>
                                            <TableCell>
                                                {plan.active ? (
                                                    <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200 shadow-none px-3 py-1 rounded-full uppercase text-[10px] tracking-wider font-bold">
                                                        Ativo
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="text-muted-foreground shadow-none">
                                                        Arquivado
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1 px-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 text-bee-midnight hover:bg-bee-amber/10 hover:text-bee-amber rounded-xl transition-all border border-transparent hover:border-bee-amber/20 shadow-none"
                                                        onClick={() => setEditingPlan(plan)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={`h-9 w-9 rounded-xl transition-all border border-transparent shadow-none ${plan.active ? 'text-bee-amber hover:bg-amber-50 hover:border-amber-100' : 'text-emerald-600 hover:bg-emerald-50 hover:border-emerald-100'}`}
                                                        onClick={() => handleToggleStatus(plan.id, plan.active)}
                                                        title={plan.active ? 'Desativar Plano' : 'Ativar Plano'}
                                                    >
                                                        {plan.active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>

                {/* Add Sidebar */}
                <Sheet open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                    <SheetContent side="right" className="sm:max-w-xl p-0 overflow-hidden border-l border-slate-100 shadow-2xl flex flex-col h-full bg-white">
                        <SheetHeader className="relative h-32 flex flex-col justify-end px-8 pb-6 overflow-hidden shrink-0 border-none">
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-deep-midnight to-slate-900" />
                            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 translate-x-4 -translate-y-4">
                                <CreditCard className="h-32 w-32 text-white" />
                            </div>
                            <div className="relative space-y-1">
                                <div className="flex items-center gap-2 text-bee-amber mb-1">
                                    <div className="h-1 w-8 rounded-full bg-bee-amber/30" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Configuração</span>
                                </div>
                                <SheetTitle className="text-2xl font-black text-white leading-none tracking-tight">
                                    Novo Plano
                                </SheetTitle>
                                <SheetDescription className="text-slate-400 font-medium text-sm">
                                    Configure as regras de acesso e cobrança
                                </SheetDescription>
                            </div>
                        </SheetHeader>
                        <div className="flex-1 overflow-y-auto p-8 pt-6">
                            <PlanForm
                                formId="add-plan-form"
                                onSubmit={handleAddPlan}
                                isLoading={isLoading}
                                showButtons={false}
                            />
                        </div>
                        <SheetFooter className="p-6 border-t bg-slate-50/80 backdrop-blur-md shrink-0 flex flex-row items-center gap-3 sm:justify-end sticky bottom-0 z-10">
                            <Button
                                variant="outline"
                                onClick={() => setIsAddModalOpen(false)}
                                className="flex-1 sm:flex-none border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900 font-black h-12 px-8 rounded-2xl uppercase text-[10px] tracking-widest transition-all active:scale-95"
                            >
                                <X className="mr-2 h-4 w-4" />
                                Descartar
                            </Button>
                            <Button
                                type="submit"
                                form="add-plan-form"
                                disabled={isLoading}
                                className="flex-1 sm:flex-none bg-bee-amber hover:bg-amber-500 text-bee-midnight font-black h-12 px-8 rounded-2xl shadow-lg shadow-bee-amber/20 hover:-translate-y-0.5 active:scale-95 transition-all uppercase text-[10px] tracking-widest border-none"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Criando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Criar Plano
                                    </>
                                )}
                            </Button>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>

                {/* Edit Sidebar */}
                <Sheet open={!!editingPlan} onOpenChange={(open) => !open && setEditingPlan(null)}>
                    <SheetContent side="right" className="sm:max-w-xl p-0 overflow-hidden border-l border-slate-100 shadow-2xl flex flex-col h-full bg-white">
                        <SheetHeader className="relative h-32 flex flex-col justify-end px-8 pb-6 overflow-hidden shrink-0 border-none">
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-deep-midnight to-slate-900" />
                            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 translate-x-4 -translate-y-4">
                                <Edit className="h-32 w-32 text-white" />
                            </div>
                            <div className="relative space-y-1">
                                <div className="flex items-center gap-2 text-bee-amber mb-1">
                                    <div className="h-1 w-8 rounded-full bg-bee-amber/30" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Configuração</span>
                                </div>
                                <SheetTitle className="text-2xl font-black text-white leading-none tracking-tight">
                                    {editingPlan?.name || 'Editar Plano'}
                                </SheetTitle>
                                <SheetDescription className="text-slate-400 font-medium text-sm">
                                    Atualize as informações de venda
                                </SheetDescription>
                            </div>
                        </SheetHeader>
                        <div className="flex-1 overflow-y-auto p-8 pt-6">
                            {editingPlan && (
                                <PlanForm
                                    formId="edit-plan-form"
                                    initialData={editingPlan}
                                    onSubmit={handleEditPlan}
                                    isLoading={isLoading}
                                    showButtons={false}
                                />
                            )}
                        </div>
                        <SheetFooter className="p-6 border-t bg-slate-50/80 backdrop-blur-md shrink-0 flex flex-row items-center gap-3 sm:justify-end sticky bottom-0 z-10">
                            <Button
                                variant="outline"
                                onClick={() => setEditingPlan(null)}
                                className="flex-1 sm:flex-none border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900 font-black h-12 px-8 rounded-2xl uppercase text-[10px] tracking-widest transition-all active:scale-95"
                            >
                                <X className="mr-2 h-4 w-4" />
                                Descartar
                            </Button>
                            <Button
                                type="submit"
                                form="edit-plan-form"
                                disabled={isLoading}
                                className="flex-1 sm:flex-none bg-bee-amber hover:bg-amber-500 text-bee-midnight font-black h-12 px-8 rounded-2xl shadow-lg shadow-bee-amber/20 hover:-translate-y-0.5 active:scale-95 transition-all uppercase text-[10px] tracking-widest border-none"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Salvar Alterações
                                    </>
                                )}
                            </Button>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            </Card>
        </div>
    );
}
