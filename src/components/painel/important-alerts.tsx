'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, CalendarCheck, UserX, Bell, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

type AlertItem = {
    id: string;
    title: string;
    description: React.ReactNode;
    type: 'WORKOUT_PENDING' | 'CHURN_RISK' | 'FINANCIAL_OVERDUE';
    severity: 'high' | 'medium' | 'low';
    actionLabel: string;
    actionLink: string;
    count: number;
};

export function ImportantAlerts() {
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const newAlerts: AlertItem[] = [];

                // 1. Pending Workouts
                const { count: pendingWorkoutsCount, error: workoutError } = await supabase
                    .from('workouts' as any)
                    .select('id', { count: 'exact', head: true })
                    .in('status', ['Pendente', 'PENDENTE', 'Pendente de Ação']);

                if (!workoutError && pendingWorkoutsCount && pendingWorkoutsCount > 0) {
                    newAlerts.push({
                        id: 'pending-workouts',
                        title: 'Treino Pendente de Verificação',
                        description: <span className="text-xs text-slate-500 mt-1">Você tem <span className="font-bold text-slate-700">{pendingWorkoutsCount} treino(s)</span> para validar.</span>,
                        type: 'WORKOUT_PENDING',
                        severity: 'medium',
                        actionLabel: 'Verificar Treinos',
                        actionLink: '/treinos',
                        count: pendingWorkoutsCount
                    });
                }

                // 2. Churn Risk (Inactive > 10 days)
                const tenDaysAgo = new Date();
                tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

                const { count: churnRiskCount, error: churnError } = await supabase
                    .from('students' as any)
                    .select('id', { count: 'exact', head: true })
                    .eq('status', 'ACTIVE')
                    .lt('last_activity', tenDaysAgo.toISOString());

                if (!churnError && churnRiskCount && churnRiskCount > 0) {
                    newAlerts.push({
                        id: 'churn-risk',
                        title: 'Aluno Ausente (Risco de Churn)',
                        description: <span className="text-xs text-slate-500 mt-1"><span className="font-bold text-slate-700">{churnRiskCount} alunos</span> não comparecem há mais de 10 dias.</span>,
                        type: 'CHURN_RISK',
                        severity: 'high',
                        actionLabel: 'Ver Lista',
                        actionLink: '/alunos?filter=risk',
                        count: churnRiskCount
                    });
                }

                // 3. Financial Overdue
                const { count: overdueCount, error: financialError } = await supabase
                    .from('invoices' as any)
                    .select('id', { count: 'exact', head: true })
                    .in('status', ['OVERDUE', 'Atrasado', 'Overdue', 'ATRASADO']);

                if (!financialError && overdueCount && overdueCount > 0) {
                    newAlerts.push({
                        id: 'financial-overdue',
                        title: 'Pagamento Vencido',
                        description: <span className="text-xs text-slate-500 mt-1"><span className="font-bold text-slate-700">{overdueCount} faturas</span> vencidas. Ações necessárias.</span>,
                        type: 'FINANCIAL_OVERDUE',
                        severity: 'high',
                        actionLabel: 'Enviar Lembrete',
                        actionLink: '/financial',
                        count: overdueCount
                    });
                }

                setAlerts(newAlerts);
            } catch (error) {
                console.error('Error fetching alerts:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAlerts();
    }, []);

    if (loading) {
        return <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
        </div>;
    }

    if (alerts.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 flex flex-col items-center justify-center text-center">
                <div className="h-12 w-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-3">
                    <Bell className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-900">Tudo em dia!</h4>
                <p className="text-xs text-muted-foreground mt-1">Nenhum alerta importante no momento.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full mt-[-60px]">
            <div className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <div className="h-5 w-5 text-orange-500">
                        <Bell className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-deep-midnight tracking-tight font-display">Alertas Importantes</h3>
                </div>
                <button className="h-9 w-9 flex items-center justify-center text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-all rounded-[10px]">
                    <MoreVertical className="h-5 w-5" />
                </button>
            </div>
            <div className="p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                {alerts.map((alert) => {
                    const isFinancial = alert.type === 'FINANCIAL_OVERDUE';
                    const isChurn = alert.type === 'CHURN_RISK';
                    const isPending = alert.type === 'WORKOUT_PENDING';

                    let borderColor = 'border-l-[#ff8c00]';
                    let iconColor = 'text-[#ff8c00]';
                    let bgColor = 'bg-orange-50/50';
                    let Icon = CalendarCheck;

                    if (isFinancial) {
                        borderColor = 'border-l-[#ff4d4d]';
                        iconColor = 'text-[#ff4d4d]';
                        bgColor = 'bg-red-50/50';
                        Icon = AlertCircle;
                    } else if (isChurn) {
                        borderColor = 'border-l-[#dc2626]';
                        iconColor = 'text-[#dc2626]';
                        bgColor = 'bg-rose-50/50';
                        Icon = UserX;
                    } else if (isPending) {
                        borderColor = 'border-l-[#ff8c00]';
                        iconColor = 'text-[#ff8c00]';
                        bgColor = 'bg-orange-50/50';
                        Icon = CalendarCheck;
                    }

                    return (
                        <div key={alert.id} className={`${bgColor} rounded-2xl shadow-sm border border-slate-100 border-l-[6px] ${borderColor} p-6 flex flex-col gap-4 transition-all duration-300 hover:shadow-md hover:-translate-y-1 group`}>
                            <div className="flex items-start gap-4">
                                <div className={`mt-0.5 ${iconColor} bg-white p-2.5 rounded-xl shadow-sm group-hover:scale-110 transition-transform`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <h4 className="text-base font-bold text-slate-800 leading-tight">{alert.title}</h4>
                                    {alert.description}
                                </div>
                            </div>
                            <div className="pl-14">
                                <Link
                                    href={alert.actionLink}
                                    className={`${iconColor} font-bold text-[11px] uppercase tracking-widest hover:brightness-90 transition-all flex items-center gap-2`}
                                >
                                    {alert.actionLabel}
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all"><path d="m9 18 6-6-6-6" /></svg>
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Helper mainly for the UserX which matches the screenshot for 'Student' alerts roughly
const userXIcon = UserX;
