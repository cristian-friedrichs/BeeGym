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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MoreVertical, Edit, Power, PowerOff, Plus, Clock, CreditCard, Loader2 } from 'lucide-react';
import { ConfirmDiscardDialog } from "@/components/ui/confirm-discard-dialog";
import { PlanForm, PlanFormValues } from './plan-form';
import { createPlanAction, updatePlanAction, togglePlanStatusAction } from '@/actions/plans';
import { useToast } from '@/hooks/use-toast';
import { SectionHeader } from '@/components/ui/section-header';
import { useSetupStatus } from '@/context/SetupStatusContext';

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
    const { refresh: refreshSetupStatus } = useSetupStatus();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFormDirty, setIsFormDirty] = useState(false);
    const [showDiscardDialog, setShowDiscardDialog] = useState(false);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(price);
    };

    const handleCloseAttempt = () => {
        if (isFormDirty) {
            setShowDiscardDialog(true);
        } else {
            closeAllModals();
        }
    };

    const closeAllModals = () => {
        setIsAddModalOpen(false);
        setEditingPlan(null);
        setIsFormDirty(false);
        setShowDiscardDialog(false);
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
            setIsFormDirty(false);
            refreshSetupStatus();

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
            setIsFormDirty(false);

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
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-slate-500 px-6 py-4">Nome</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-slate-500">Preço</TableHead>
                                    <TableHead className="w-[200px] font-semibold text-xs uppercase tracking-wider text-slate-500">Regra de Acesso</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-slate-500">Status</TableHead>
                                    <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-slate-500 px-6 py-4">Ações</TableHead>
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
                                            <TableCell className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-900">{plan.name}</span>
                                                    {plan.description && (
                                                        <span className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                                                            {plan.description}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-bold text-slate-700">{formatPrice(plan.price)}</TableCell>
                                            <TableCell>
                                                {renderAccessRule(plan)}
                                            </TableCell>
                                            <TableCell>
                                                {plan.active ? (
                                                    <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-100 shadow-none px-3 py-1 rounded-full uppercase text-[10px] tracking-wider font-bold">
                                                        Ativo
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-slate-200 shadow-none px-3 py-1 rounded-full uppercase text-[10px] tracking-wider font-bold">
                                                        Arquivado
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right px-6 py-4">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 text-slate-400 hover:text-bee-amber hover:bg-bee-amber/5 rounded-xl transition-all"
                                                        onClick={() => setEditingPlan(plan)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={`h-9 w-9 rounded-xl transition-all ${plan.active ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
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

                {/* Add Dialog */}
                <Dialog open={isAddModalOpen} onOpenChange={handleCloseAttempt}>
                    <DialogContent className="max-w-[576px] p-0 gap-0 rounded-2xl overflow-hidden border-none shadow-2xl bg-white flex flex-col max-h-[90vh]">
                        <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100 bg-white shrink-0">
                            <DialogTitle className="text-[17px] font-semibold text-slate-900 leading-tight">Novo Plano</DialogTitle>
                            <p className="text-sm text-slate-500 mt-0.5">Configure as regras de acesso e cobrança.</p>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto px-6 py-5">
                            <PlanForm 
                                formId="add-plan-form" 
                                onSubmit={handleAddPlan} 
                                isLoading={isLoading} 
                                showButtons={false} 
                                onDirtyChange={setIsFormDirty}
                            />
                        </div>
                        <div className="px-6 pb-5 pt-4 border-t border-slate-100 flex items-center justify-between bg-white shrink-0">
                            <Button variant="ghost" onClick={handleCloseAttempt} className="h-9 rounded-full px-5 text-slate-500 hover:bg-slate-50 text-sm font-medium">Cancelar</Button>
                            <Button type="submit" form="add-plan-form" disabled={isLoading} className="h-9 rounded-full px-6 bg-bee-amber hover:bg-amber-500 text-bee-midnight font-bold text-sm shadow-sm transition-all active:scale-[0.98]">
                                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando…</> : 'Criar plano'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={!!editingPlan} onOpenChange={handleCloseAttempt}>
                    <DialogContent className="max-w-[576px] p-0 gap-0 rounded-2xl overflow-hidden border-none shadow-2xl bg-white flex flex-col max-h-[90vh]">
                        <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100 bg-white shrink-0">
                            <DialogTitle className="text-[17px] font-semibold text-slate-900 leading-tight">{editingPlan?.name || 'Editar Plano'}</DialogTitle>
                            <p className="text-sm text-slate-500 mt-0.5">Atualize as informações de venda.</p>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto px-6 py-5">
                            {editingPlan && (
                                <PlanForm 
                                    formId="edit-plan-form" 
                                    initialData={editingPlan} 
                                    onSubmit={handleEditPlan} 
                                    isLoading={isLoading} 
                                    showButtons={false} 
                                    onDirtyChange={setIsFormDirty}
                                />
                            )}
                        </div>
                        <div className="px-6 pb-5 pt-4 border-t border-slate-100 flex items-center justify-between bg-white shrink-0">
                            <Button variant="ghost" onClick={handleCloseAttempt} className="h-9 rounded-full px-5 text-slate-500 hover:bg-slate-50 text-sm font-medium">Cancelar</Button>
                            <Button type="submit" form="edit-plan-form" disabled={isLoading} className="h-9 rounded-full px-6 bg-bee-amber hover:bg-amber-500 text-bee-midnight font-bold text-sm shadow-sm transition-all active:scale-[0.98]">
                                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando…</> : 'Salvar alterações'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <ConfirmDiscardDialog 
                    open={showDiscardDialog}
                    onOpenChange={setShowDiscardDialog}
                    onConfirm={closeAllModals}
                />
            </Card>
        </div>
    );
}
