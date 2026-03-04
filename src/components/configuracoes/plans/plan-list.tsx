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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { MoreVertical, Edit, Power, PowerOff, Plus, Clock, CreditCard } from 'lucide-react';
import { PlanForm, PlanFormValues } from './plan-form';
import { createPlanAction, updatePlanAction, togglePlanStatusAction } from '@/actions/plans';
import { useToast } from '@/hooks/use-toast';

interface Plan {
    id: string;
    organization_id: string;
    name: string;
    description: string | null;
    price: number;
    plan_type: 'membership' | 'pack';

    // Membership fields
    duration_months: number | null;
    recurrence: 'monthly' | 'quarterly' | 'yearly' | null;
    days_per_week: number | null;

    // Pack fields
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

    const recurrenceMap = {
        monthly: 'Mensal',
        quarterly: 'Trimestral',
        yearly: 'Anual',
    };

    const renderAccessRule = (plan: Plan) => {
        if (plan.plan_type === 'pack') {
            return (
                <div>
                    <Badge variant="default" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        {plan.credits} Crédito{plan.credits !== 1 ? 's' : ''}
                    </Badge>
                    <p className="text-xs mt-1 text-muted-foreground">
                        Validade: {plan.duration_months} {plan.duration_months === 1 ? 'mês' : 'meses'}
                    </p>
                </div>
            );
        }

        // Membership
        return (
            <div>
                {plan.days_per_week ? (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                        {plan.days_per_week}x por Semana
                    </Badge>
                ) : (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                        Acesso Ilimitado
                    </Badge>
                )}
                <p className="text-xs mt-1 text-muted-foreground">
                    Cobrança {recurrenceMap[plan.recurrence || 'monthly']}
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
        <Card className="rounded-[16px] shadow-sm border-slate-100 overflow-hidden bg-white">
            <CardHeader className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <div className="h-5 w-5 text-orange-500">
                        <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold text-deep-midnight tracking-tight font-display">Planos de Venda</CardTitle>
                    </div>
                </div>
                <Button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-9 px-4 rounded-xl shadow-lg shadow-orange-100 transition-all hover:scale-[1.02] active:scale-[0.98] text-[11px] uppercase tracking-wider"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Plano
                </Button>
            </CardHeader>

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
                                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 shadow-none">
                                                    Ativo
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-muted-foreground shadow-none">
                                                    Arquivado
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => setEditingPlan(plan)} className="gap-2 cursor-pointer">
                                                        <Edit className="h-4 w-4" /> Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleToggleStatus(plan.id, plan.active)}
                                                        className="gap-2 cursor-pointer"
                                                    >
                                                        {plan.active ? (
                                                            <>
                                                                <PowerOff className="h-4 w-4 text-orange-500" />
                                                                Desativar
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Power className="h-4 w-4 text-green-500" />
                                                                Ativar
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            {/* Add Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Criar Novo Plano</DialogTitle>
                    </DialogHeader>
                    <PlanForm onSubmit={handleAddPlan} isLoading={isLoading} />
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={!!editingPlan} onOpenChange={(open) => !open && setEditingPlan(null)}>
                <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Plano: {editingPlan?.name}</DialogTitle>
                    </DialogHeader>
                    {editingPlan && (
                        <PlanForm
                            initialData={editingPlan}
                            onSubmit={handleEditPlan}
                            isLoading={isLoading}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </Card>
    );
}
