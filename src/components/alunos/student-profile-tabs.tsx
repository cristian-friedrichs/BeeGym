'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Plus, Dumbbell, Ruler, CreditCard, FileText,
    Calendar, Clock, CheckCircle2, XCircle, MoreHorizontal, Trash2, Edit, AlertCircle, TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { WorkoutModal } from "@/components/treinos/workout-modal";
import { WorkoutDetailsSheet } from "@/components/treinos/workout-details-sheet";
import { addMonths } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";



// --- VIEW DE TREINOS COM REGRA MASTER ---
interface WorkoutsViewProps {
    workouts: any[];
    studentId: string;
    studentName: string;
    onRefresh: () => void;
    onNewWorkout?: () => void;
}

export function StudentWorkoutsView({ workouts, studentId, studentName, onRefresh, onNewWorkout }: WorkoutsViewProps) {
    const supabase = createClient();
    const { toast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Detalhes do Treino
    const [selectedDetailsWorkoutId, setSelectedDetailsWorkoutId] = useState<string | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    // Controle de Exclusão Recorrente
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
    const [recurrenceAction, setRecurrenceAction] = useState<'single' | 'future' | null>(null);

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'Concluido': return { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: 'Concluído' };
            case 'Em Execução': return { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock, label: 'Em Execução' };
            case 'Faltou': return { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: 'Faltou' };
            case 'Cancelado': return { color: 'bg-slate-100 text-slate-500 border-slate-200', icon: XCircle, label: 'Cancelado' };
            default: return { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Calendar, label: 'Agendado' };
        }
    };

    // INICIAR EXCLUSÃO
    const initiateDelete = (workout: any) => {
        setSelectedWorkout(workout);
        setDeleteDialogOpen(true);
        setRecurrenceAction(null); // Reset
    };

    // EXECUTAR EXCLUSÃO (Baseada na escolha)
    const confirmDelete = async (scope: 'single' | 'future') => {
        if (!selectedWorkout) return;

        try {
            let query = supabase.from('workouts' as any).delete();

            if (scope === 'single' || !selectedWorkout.recurrence_id) {
                // Deletar APENAS este
                query = query.eq('id', selectedWorkout.id);
            } else if (scope === 'future') {
                // Deletar Este + Futuros da mesma série
                query = query
                    .eq('recurrence_id', selectedWorkout.recurrence_id)
                    .gte('scheduled_at', selectedWorkout.scheduled_at); // >= Data deste
            }

            const { error } = await query;
            if (error) throw error;

            toast({ title: "Treino(s) excluído(s) com sucesso" });
            onRefresh();
        } catch (error) {
            console.error(error);
            toast({ title: "Erro ao excluir", variant: "destructive" });
        } finally {
            setDeleteDialogOpen(false);
            setSelectedWorkout(null);
        }
    };

    return (
        <>
            <Card className="shadow-sm border-none md:border">
                <CardHeader className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <div className="h-5 w-5 text-orange-500">
                            <Dumbbell className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-lg font-bold text-deep-midnight tracking-tight font-display">Gerenciamento de Treinos</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    {workouts.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-[8px] bg-slate-50/50 font-sans">
                            <Dumbbell className="h-10 w-10 mb-2 opacity-20" />
                            <p>Nenhum treino encontrado para este aluno.</p>
                            <Button variant="link" onClick={onNewWorkout} className="text-bee-orange font-bold mt-2">
                                Criar o primeiro treino
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {workouts.map(w => {
                                const status = getStatusConfig(w.status || 'Agendado');
                                const StatusIcon = status.icon;

                                return (
                                    <div
                                        key={w.id}
                                        className="group p-4 border rounded-[8px] flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-slate-50 transition-colors bg-white shadow-sm gap-4 cursor-pointer"
                                        onClick={() => {
                                            setSelectedDetailsWorkoutId(w.id);
                                            setDetailsOpen(true);
                                        }}
                                    >
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-lg text-slate-800 group-hover:text-bee-orange transition-colors font-sans">{w.title}</span>
                                                <Badge variant="outline" className="text-xs font-normal bg-slate-50">{w.type || 'Geral'}</Badge>
                                                {w.recurrence_id && (
                                                    <span className="text-[11px] text-bee-orange bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 font-bold font-sans">Recorrente</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                    {w.scheduled_at
                                                        ? format(new Date(w.scheduled_at), "dd 'de' MMM, yyyy", { locale: ptBR })
                                                        : format(new Date(w.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })
                                                    }
                                                </span>
                                                {w.scheduled_at && (
                                                    <span className="flex items-center gap-1 border-l pl-3 border-slate-200">
                                                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                        {format(new Date(w.scheduled_at), "HH:mm")}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border font-sans ${status.color}`}>
                                                <StatusIcon className="h-3.5 w-3.5" />
                                                {status.label}
                                            </div>

                                            {/* MENU DE AÇÕES */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-bee-orange">
                                                        <MoreHorizontal className="h-5 w-5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => { }} className="cursor-pointer">
                                                        <Edit className="mr-2 h-4 w-4" /> Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => initiateDelete(w)} className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            <WorkoutModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                defaultStudentId={studentId}
                onSuccess={() => onRefresh && onRefresh()}
            />

            {/* MODAL DE CONFIRMAÇÃO DE RECORRÊNCIA */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Treino</AlertDialogTitle>
                        <AlertDialogDescription>
                            {selectedWorkout?.recurrence_id
                                ? "Este é um evento recorrente. Como você deseja aplicar a exclusão?"
                                : "Tem certeza que deseja excluir este treino? Esta ação não pode ser desfeita."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="flex flex-col gap-2 mt-2">
                        {selectedWorkout?.recurrence_id ? (
                            <>
                                <Button variant="secondary" onClick={() => confirmDelete('single')} className="justify-start rounded-[8px]">
                                    Apenas este evento (Dia {selectedWorkout?.scheduled_at && format(new Date(selectedWorkout.scheduled_at), "dd/MM")})
                                </Button>
                                <Button variant="destructive" onClick={() => confirmDelete('future')} className="justify-start rounded-[8px]">
                                    Este e todos os futuros
                                </Button>
                            </>
                        ) : (
                            <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-[8px]">Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => confirmDelete('single')} className="bg-red-600 hover:bg-red-700 rounded-[8px]">
                                    Excluir
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        )}
                    </div>
                    {selectedWorkout?.recurrence_id && (
                        <AlertDialogFooter className="mt-4">
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        </AlertDialogFooter>
                    )}
                </AlertDialogContent>
            </AlertDialog>

            {/* SHEET DE DETALHES */}
            <WorkoutDetailsSheet
                workoutId={selectedDetailsWorkoutId}
                isOpen={detailsOpen}
                onClose={() => {
                    setDetailsOpen(false);
                    setSelectedDetailsWorkoutId(null);
                }}
                onUpdate={onRefresh}
            />
        </>
    );
}


// --- VIEW DE MEDIDAS (Mantida para consistência) ---
export function StudentMeasurementsView({ measurements, onNewMeasurement }: { measurements: any[], onNewMeasurement: () => void }) {
    return (
        <Card className="shadow-sm border-none md:border">
            <CardHeader className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <div className="h-5 w-5 text-orange-500">
                        <Ruler className="h-5 w-5 text-orange-500" />
                    </div>
                    <CardTitle className="text-lg font-bold text-deep-midnight tracking-tight font-display">Avaliações Físicas</CardTitle>
                </div>
                <Button onClick={onNewMeasurement} className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm font-bold rounded-xl h-9 px-4 text-[11px] uppercase tracking-wider transition-all hover:scale-[1.02]">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Medida
                </Button>
            </CardHeader>
            <CardContent>
                {measurements.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-[8px] bg-slate-50/50 font-sans">
                        <Ruler className="h-10 w-10 mb-2 opacity-20" />
                        <p>Nenhuma avaliação registrada.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {measurements.map(m => (
                            <div key={m.recorded_at} className="p-4 border rounded-[8px] flex justify-between items-center bg-white shadow-sm hover:border-orange-200 transition-all font-sans">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-600 font-bold text-xs">
                                        {format(new Date(m.recorded_at), "dd/MM")}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-slate-900">Avaliação Física</span>
                                        <span className="text-xs text-muted-foreground">{format(new Date(m.recorded_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}</span>
                                    </div>
                                </div>
                                <div className="flex gap-6 text-sm">
                                    <div className="text-center">
                                        <p className="text-xs text-muted-foreground font-bold">PESO</p>
                                        <p className="font-medium">{m.weight || '-'} kg</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-muted-foreground font-bold">GORDURA</p>
                                        <p className="font-medium">{m.body_fat || '-'} %</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// --- VIEW DE PLANOS ---
interface PlanHistoryEntry {
    id: string;
    plan_id: string | null;
    plan_name: string | null;
    plan_price: number | null;
    discount_type: string | null;
    discount_value: number | null;
    discount_end_date: string | null;
    final_price: number | null;
    started_at: string;
    ended_at: string | null;
    expiration_date?: string | null;
}

interface StudentPlansViewProps {
    plan: any | null;
    student: any;
    planHistory: PlanHistoryEntry[];
    onManagePlan: () => void;
}

function PlanHistoryRow({ entry, isActive }: { entry: PlanHistoryEntry; isActive: boolean }) {
    const price = entry.plan_price ?? 0;
    const net = entry.final_price ?? price;
    const discountAmount = price - net;
    const hasDiscount = entry.discount_type && entry.discount_value;

    return (
        <div className={`p-4 border rounded-[8px] space-y-3 transition-all ${isActive
            ? 'border-orange-300 bg-orange-50/40 shadow-sm'
            : 'border-slate-100 bg-white hover:border-slate-200'}`}
        >
            {/* Row 1: name + badge */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <span className={`font-bold text-base font-display ${isActive ? 'text-deep-midnight' : 'text-slate-500'}`}>
                        {entry.plan_name ?? '—'}
                    </span>
                    {isActive && (
                        <p className="text-[11px] font-bold text-bee-orange uppercase tracking-wider mt-0.5 font-sans">Plano Vigente</p>
                    )}
                </div>
                <Badge className={isActive
                    ? 'bg-green-100 text-green-700 hover:bg-green-100 border-none shrink-0'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-100 border-none shrink-0'}>
                    {isActive ? 'ATIVO' : 'ENCERRADO'}
                </Badge>
            </div>

            {/* Row 2: financials */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm pt-2 border-t border-slate-100">
                <div>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase mb-0.5">Valor Bruto</p>
                    <p className="font-semibold text-slate-700">
                        {price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                </div>
                <div>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase mb-0.5">Desconto</p>
                    {hasDiscount ? (
                        <p className="font-semibold text-orange-500">
                            {entry.discount_type === 'percent'
                                ? `-${entry.discount_value}%`
                                : `-${discountAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                        </p>
                    ) : (
                        <p className="text-slate-400">—</p>
                    )}
                </div>
                <div>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase mb-0.5">Valor Líquido</p>
                    <p className={`font-bold ${isActive && hasDiscount ? 'text-orange-600' : 'text-slate-700'}`}>
                        {net.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    {entry.discount_end_date && isActive && (
                        <p className="text-[11px] text-slate-400">
                            Desc. até {format(new Date(entry.discount_end_date), 'dd/MM/yyyy')}
                        </p>
                    )}
                </div>
                <div>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase mb-0.5">
                        {isActive ? 'Vigente desde' : 'Período'}
                    </p>
                    <p className="font-medium text-slate-600 text-xs">
                        {format(new Date(entry.started_at), 'dd/MM/yyyy')}
                        {!isActive && entry.ended_at && (
                            <> → {format(new Date(entry.ended_at), 'dd/MM/yyyy')}</>
                        )}
                    </p>
                    {entry.expiration_date && isActive && (
                        <p className="text-[11px] text-orange-600 font-medium mt-1">
                            Validade: {format(new Date(entry.expiration_date), 'dd/MM/yyyy')}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export function StudentPlansView({ plan, student, planHistory, onManagePlan }: StudentPlansViewProps) {
    const hasHistory = planHistory && planHistory.length > 0;

    // Fallback: if no history rows yet, build a synthetic entry from current student data
    const fallbackEntry: PlanHistoryEntry | null = plan ? {
        id: 'current',
        plan_id: student?.plan_id ?? null,
        plan_name: plan?.name ?? null,
        plan_price: plan?.price ?? null,
        discount_type: student?.discount_type ?? null,
        discount_value: student?.discount_value ?? null,
        discount_end_date: student?.discount_end_date ?? null,
        final_price: (() => {
            const p = plan?.price ?? 0;
            if (!student?.discount_type || !student?.discount_value) return p;
            if (student.discount_type === 'percent') return p * (1 - student.discount_value / 100);
            return Math.max(0, p - student.discount_value);
        })(),
        started_at: student?.updated_at ?? student?.created_at ?? new Date().toISOString(),
        ended_at: null,
        expiration_date: plan?.duration_months
            ? addMonths(new Date(student?.updated_at ?? student?.created_at ?? new Date()), plan.duration_months).toISOString()
            : null,
    } : null;

    const entries = hasHistory ? planHistory : (fallbackEntry ? [fallbackEntry] : []);

    return (
        <Card className="shadow-sm border-none md:border">
            <CardHeader className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <div className="h-5 w-5 text-orange-500">
                        <CreditCard className="h-5 w-5 text-orange-500" />
                    </div>
                    <CardTitle className="text-lg font-bold text-deep-midnight tracking-tight font-display">Assinaturas e Planos</CardTitle>
                </div>
                <Button onClick={onManagePlan} className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm font-bold rounded-xl h-9 px-4 text-[11px] uppercase tracking-wider transition-all hover:scale-[1.02]">
                    <Plus className="h-4 w-4 mr-2" />
                    Alterar Plano
                </Button>
            </CardHeader>
            <CardContent className="space-y-3">
                {entries.length === 0 ? (
                    <div className="h-48 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-[8px] bg-slate-50/50 font-sans">
                        <CreditCard className="h-10 w-10 mb-2 opacity-20" />
                        <p className="mb-3">Nenhum plano atribuído.</p>
                        <Button onClick={onManagePlan} size="sm" variant="outline" className="rounded-[8px] font-bold">Atribuir Plano</Button>
                    </div>
                ) : (
                    entries.map((entry, i) => (
                        <PlanHistoryRow key={entry.id} entry={entry} isActive={entry.ended_at === null} />
                    ))
                )}
            </CardContent>
        </Card>
    );
}


// --- VIEW DE FATURAS ---
interface InvoicesViewProps {
    invoices: any[];
    studentId: string;
    onRefresh: () => void;
}

export function StudentInvoicesView({ invoices, studentId, onRefresh }: InvoicesViewProps) {
    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'PAID':
            case 'Pago': return { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: 'Pago' };
            case 'PENDING':
            case 'Pendente': return { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Clock, label: 'Pendente' };
            case 'OVERDUE':
            case 'Atrasado': return { color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle, label: 'Atrasado' };
            case 'CANCELLED':
            case 'Cancelado': return { color: 'bg-slate-100 text-slate-500 border-slate-200', icon: XCircle, label: 'Cancelado' };
            default: return { color: 'bg-slate-100 text-slate-500 border-slate-200', icon: FileText, label: status };
        }
    };

    return (
        <Card className="shadow-sm border-none md:border">
            <CardHeader className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <div className="h-5 w-5 text-orange-500">
                        <FileText className="h-5 w-5 text-orange-500" />
                    </div>
                    <CardTitle className="text-lg font-bold text-deep-midnight tracking-tight font-display">Histórico de Faturas</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                {invoices.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-[8px] bg-slate-50/50 font-sans">
                        <FileText className="h-10 w-10 mb-2 opacity-20" />
                        <p>Nenhuma fatura encontrada.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="text-muted-foreground border-b uppercase text-[11px] font-bold tracking-wider">
                                    <th className="px-4 py-3">Vencimento</th>
                                    <th className="px-4 py-3">Valor</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Data Pagto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {invoices.map(inv => {
                                    const status = getStatusConfig(inv.status);
                                    const StatusIcon = status.icon;
                                    return (
                                        <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-4 py-4 font-medium text-slate-900">
                                                {inv.due_date ? format(new Date(inv.due_date), "dd/MM/yyyy") : '-'}
                                            </td>
                                            <td className="px-4 py-4 font-bold text-slate-900">
                                                {(inv.amount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border ${status.color}`}>
                                                    <StatusIcon className="h-3 w-3" />
                                                    {status.label}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-right text-muted-foreground font-medium">
                                                {inv.paid_at ? format(new Date(inv.paid_at), "dd/MM/yyyy") : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// Add AlertCircle to imports if it's not there
