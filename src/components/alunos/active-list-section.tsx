'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ChevronRight, CreditCard, ReceiptText,
    Dumbbell, RefreshCw, CheckCircle2,
    XCircle, Clock, AlertCircle, Calendar,
    ChevronDown, Filter
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface Workout {
    id: string;
    title: string;
    type: string | null;
    created_at: string;
    status: string;
    scheduled_at?: string | null;
}

interface Invoice {
    id: string;
    amount: number;
    due_date: string;
    status: string;
}

interface ActiveListSectionProps {
    workouts: Workout[];
    invoices: Invoice[];
    studentId: string;
    onWorkoutClick: (id: string) => void;
    onInvoiceClick: () => void;
}

export function ActiveListSection({
    workouts,
    invoices,
    studentId,
    onWorkoutClick,
    onInvoiceClick
}: ActiveListSectionProps) {
    const [view, setView] = useState<'workouts' | 'invoices'>('workouts');

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Concluido': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
            case 'Faltou': return <XCircle className="h-4 w-4 text-red-500" />;
            case 'Cancelado': return <AlertCircle className="h-4 w-4 text-slate-400" />;
            case 'Em Execução': return <Clock className="h-4 w-4 text-bee-orange animate-pulse" />;
            default: return <Calendar className="h-4 w-4 text-bee-orange" />;
        }
    };

    const WorkoutItem = ({ workout }: { workout: Workout }) => (
        <div
            onClick={() => onWorkoutClick(workout.id)}
            className="flex items-center justify-between p-3.5 bg-slate-50/50 rounded-[12px] border border-slate-100 hover:border-bee-orange hover:bg-white hover:shadow-sm transition-all cursor-pointer group"
        >
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-white rounded-[10px] flex items-center justify-center border group-hover:bg-orange-50 group-hover:border-orange-100 transition-colors">
                    {getStatusIcon(workout.status)}
                </div>
                <div>
                    <h4 className="font-bold text-sm text-deep-midnight group-hover:text-bee-orange transition-colors">{workout.title}</h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">
                        {workout.type || 'Geral'} • {format(new Date(workout.scheduled_at || workout.created_at), "dd/MM/yyyy 'às' HH:mm")}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${workout.status === 'Concluido' ? 'bg-emerald-50 text-emerald-600' :
                    workout.status === 'Faltou' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                    {workout.status}
                </span>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-bee-orange transition-colors" />
            </div>
        </div>
    );

    const InvoiceItem = ({ invoice }: { invoice: Invoice }) => {
        const isPaid = invoice.status === 'PAID' || invoice.status === 'Pago';
        const isOverdue = invoice.status === 'OVERDUE' || invoice.status === 'Atrasado';

        return (
            <div
                onClick={onInvoiceClick}
                className="flex items-center justify-between p-3.5 bg-slate-50/50 rounded-[12px] border border-slate-100 hover:border-bee-orange hover:bg-white hover:shadow-sm transition-all cursor-pointer group"
            >
                <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-[10px] flex items-center justify-center border group-hover:border-orange-100 transition-colors ${isPaid ? 'bg-emerald-50 text-emerald-600' :
                        isOverdue ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-bee-orange'
                        }`}>
                        <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-deep-midnight group-hover:text-bee-orange transition-colors">
                            {invoice.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </h4>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">
                            Vencimento: {format(new Date(invoice.due_date), "dd/MM/yyyy")}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${isPaid ? 'bg-emerald-50 text-emerald-600' :
                        isOverdue ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-bee-orange'
                        }`}>
                        {invoice.status}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-bee-orange transition-colors" />
                </div>
            </div>
        );
    };

    return (
        <Card className="rounded-[16px] shadow-sm border-slate-100 overflow-hidden flex flex-col h-full bg-white">
            <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-slate-50 shrink-0 bg-slate-50/50">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-deep-midnight tracking-tight font-display">
                    {view === 'workouts' ? (
                        <><RefreshCw className="h-5 w-5 text-bee-orange" /> Últimas Atividades</>
                    ) : (
                        <><ReceiptText className="h-5 w-5 text-bee-orange" /> Últimas Faturas</>
                    )}
                </CardTitle>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-10 text-[11px] font-bold uppercase tracking-wider border border-slate-100 bg-white shadow-sm rounded-lg focus:ring-1 focus:ring-orange-200 transition-all text-slate-700 flex items-center gap-2 px-3 outline-none hover:bg-white hover:text-slate-700 hover:border-slate-100 cursor-pointer">
                            {view === 'workouts' ? 'Treinos' : 'Faturas'}
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl border-slate-100 shadow-xl p-1 bg-white z-[100] min-w-[140px]">
                        <DropdownMenuItem
                            onClick={() => setView('workouts')}
                            className="text-[11px] font-medium rounded-lg p-2.5 flex items-center gap-2 text-slate-600 focus:bg-bee-orange focus:text-white cursor-pointer transition-colors"
                        >
                            <Dumbbell className="h-4 w-4" />
                            Treinos/Aulas
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setView('invoices')}
                            className="text-[11px] font-medium rounded-lg p-2.5 flex items-center gap-2 text-slate-600 focus:bg-bee-orange focus:text-white cursor-pointer transition-colors"
                        >
                            <CreditCard className="h-4 w-4" />
                            Faturas
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="p-4 flex-1 overflow-y-auto no-scrollbar space-y-3 font-sans pb-0">
                {view === 'workouts' ? (
                    workouts.length > 0 ? (
                        workouts.slice(0, 10).map(w => <WorkoutItem key={w.id} workout={w} />)
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center py-12">
                            <Dumbbell className="h-8 w-8 text-slate-200 mb-3" />
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Nenhuma atividade</p>
                        </div>
                    )
                ) : (
                    invoices.length > 0 ? (
                        invoices.slice(0, 10).map(inv => <InvoiceItem key={inv.id} invoice={inv} />)
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center py-12">
                            <ReceiptText className="h-8 w-8 text-slate-200 mb-3" />
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Nenhuma fatura</p>
                        </div>
                    )
                )}
            </CardContent>

            <div className="p-4 border-t border-slate-50 bg-slate-50/20">
                <Button variant="ghost" size="sm" asChild className="w-full justify-center text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-orange-600 transition-colors">
                    <a href={`/alunos/${studentId}/${view}`}>
                        Ver todo o histórico de {view === 'workouts' ? 'atividades' : 'faturas'}
                        <ChevronRight className="h-3.5 w-3.5 ml-1.5" />
                    </a>
                </Button>
            </div>
        </Card>
    );
}
