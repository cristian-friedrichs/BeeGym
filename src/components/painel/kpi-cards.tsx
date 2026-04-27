'use client';

import { useEffect, useState } from 'react';
import { Users, DollarSign, AlertCircle, CalendarCheck, Loader2 } from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import { KpiCard } from '@/components/ui/kpi-card';
import { formatK, formatCurrencyK } from '@/lib/formatters';

export function KpiCards() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);

    const [metrics, setMetrics] = useState({
        activeStudents: 0,
        monthlyRevenue: 0,
        pendingPayments: 0,
        todayActivities: 0
    });

    useEffect(() => {
        const fetchMetrics = async () => {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // 1. Alunos Ativos (Incluindo quem está em atraso)
                const { count: activeCount } = await supabase
                    .from('students' as any)
                    .select('*', { count: 'exact', head: true })
                    .in('status', ['ACTIVE', 'OVERDUE']);

                // 2. Atividades Hoje (Treinos + Aulas)
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const todayEnd = new Date();
                todayEnd.setHours(23, 59, 59, 999);

                // Fetch Workouts count
                const { count: workoutsCount } = await supabase
                    .from('workouts' as any)
                    .select('*', { count: 'exact', head: true })
                    .gte('scheduled_at', todayStart.toISOString())
                    .lte('scheduled_at', todayEnd.toISOString())
                    .neq('status', 'Cancelado');

                // Fetch Classes count
                const { count: classesCount } = await supabase
                    .from('calendar_events' as any)
                    .select('*', { count: 'exact', head: true })
                    .gte('start_datetime', todayStart.toISOString())
                    .lte('start_datetime', todayEnd.toISOString())
                    .neq('status', 'CANCELLED');


                // 3 & 4. Financeiro (Using 'invoices' table)
                let revenue = 0;
                let pending = 0;

                const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

                // Fetch invoices from the start of the month for Revenue
                const { data: invoicesData } = await supabase
                    .from('invoices' as any)
                    .select('amount, status, due_date')
                    .gte('due_date', firstDayOfMonth);

                const invoices = invoicesData as any[] | null;

                if (invoices) {
                    revenue = invoices
                        .filter((inv: any) => ['PAID', 'PAGO', 'Pago', 'Paid'].includes(inv.status.toUpperCase() || inv.status))
                        .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
                }

                // Fetch ALL Overdue/Pending invoices for Pending Payments (Historical)
                const { data: overdueInvoicesData } = await supabase
                    .from('invoices' as any)
                    .select('amount')
                    .in('status', ['OVERDUE', 'Atrasado', 'Overdue', 'PENDENTE', 'Pendente', 'Pending']);

                const overdueInvoices = overdueInvoicesData as any[] | null;

                if (overdueInvoices) {
                    pending = overdueInvoices.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
                }

                setMetrics({
                    activeStudents: activeCount || 0,
                    todayActivities: (workoutsCount || 0) + (classesCount || 0),
                    monthlyRevenue: revenue,
                    pendingPayments: pending
                });

            } catch (error) {
                console.error("Erro ao buscar métricas:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();

        // 5. Inscrição em Tempo Real (Realtime)
        const channel = supabase.channel('dashboard_metrics_sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, fetchMetrics)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, fetchMetrics)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'workouts' }, fetchMetrics)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' }, fetchMetrics)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    if (loading) {
        return <div className="flex justify-center items-center h-24 w-full"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard
                title="Alunos Ativos"
                value={formatK(metrics.activeStudents)}
                icon={<Users className="h-6 w-6" />}
                color="yellow"
            />

            <KpiCard
                title="Receita Mensal"
                value={formatCurrencyK(metrics.monthlyRevenue)}
                tooltip={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.monthlyRevenue)}
                icon={<DollarSign className="h-6 w-6" />}
                color="yellow"
            />

            <KpiCard
                title="Pendentes"
                value={formatCurrencyK(metrics.pendingPayments)}
                tooltip={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.pendingPayments)}
                icon={<AlertCircle className="h-6 w-6" />}
                color="yellow"
            />

            <KpiCard
                title="Atividades Hoje"
                value={formatK(metrics.todayActivities)}
                icon={<CalendarCheck className="h-6 w-6" />}
                color="yellow"
            />
        </div>
    );
}
