'use client';

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowUpRight, ArrowDownRight, Calendar, Clock, RefreshCw, Ticket, CalendarClock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CreditLogViewRow {
    id: string;
    organization_id: string;
    student_id: string;
    change_amount: number;
    reason: string;
    created_at: string;
    reference_id: string | null;
    bucket: 'agendado' | 'historico';
    class_id: string | null;
    class_title: string | null;
    class_start_datetime: string | null;
    class_date: string | null;
    class_start_time: string | null;
    workout_id: string | null;
    workout_title: string | null;
    workout_scheduled_at: string | null;
}

interface StudentCreditHistoryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    studentId: string;
    studentName: string;
}

export function StudentCreditHistoryModal({ open, onOpenChange, studentId, studentName }: StudentCreditHistoryModalProps) {
    const { toast } = useToast();
    const supabase = createClient();
    
    const [logs, setLogs] = useState<CreditLogViewRow[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchLogs = useCallback(async () => {
        if (!studentId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('student_credits_log_view')
                .select('*')
                .eq('student_id', studentId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLogs((data as CreditLogViewRow[]) || []);
        } catch (error: any) {
            console.error("Erro ao buscar histórico de créditos:", error);
            toast({
                title: "Erro ao buscar histórico",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [studentId, supabase, toast]);

    useEffect(() => {
        if (open) {
            fetchLogs();
        }
    }, [open, fetchLogs]);

    const formatDateTime = (dateStr: string | null | undefined): string => {
        if (!dateStr) return "-";
        try {
            const d = parseISO(dateStr);
            return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
        } catch (e) {
            return "-";
        }
    };

    const isClassReason = (r: string) => r.startsWith('Class ');
    const isWorkoutReason = (r: string) => r.startsWith('Workout ');

    const getLogDetails = (log: CreditLogViewRow) => {
        const isDebit = log.change_amount < 0;
        const isRefund = log.change_amount > 0;
        const isMarker = log.change_amount === 0;

        let title = log.reason;
        let scheduleDetails = "";
        let iconColor = isDebit
            ? "text-slate-500 bg-slate-50 border-slate-100"
            : isRefund
                ? "text-emerald-600 bg-emerald-50 border-emerald-100"
                : "text-slate-400 bg-slate-50 border-slate-100";
        let amountColor = isDebit ? "text-slate-600" : isRefund ? "text-emerald-600 font-bold" : "text-slate-400";

        if (isClassReason(log.reason)) {
            title = log.class_title || "Aula";
            if (isDebit) iconColor = "text-bee-amber bg-amber-50 border-amber-100";
            if (log.class_start_datetime) {
                scheduleDetails = `Aula agendada: ${formatDateTime(log.class_start_datetime)}`;
            } else if (log.class_date) {
                scheduleDetails = `Aula agendada: ${log.class_date} às ${log.class_start_time || ''}`;
            }
        } else if (isWorkoutReason(log.reason)) {
            title = log.workout_title || "Treino";
            if (isDebit) iconColor = "text-blue-500 bg-blue-50 border-blue-100";
            if (log.workout_scheduled_at) {
                scheduleDetails = `Treino agendado: ${formatDateTime(log.workout_scheduled_at)}`;
            }
        } else if (log.reason === 'Pack Purchase') {
            title = 'Compra de pack';
            iconColor = "text-emerald-600 bg-emerald-50 border-emerald-100";
        }

        // Friendly status badge
        const statusLabel = (() => {
            switch (log.reason) {
                case 'Workout Completed':
                case 'Class Completed':
                    return 'Realizado';
                case 'Workout No-Show':
                case 'Class No-Show':
                    return 'Falta';
                case 'Workout Cancelled (Refund)':
                case 'Class Enrollment Cancelled (Refund)':
                    return 'Cancelado';
                case 'Workout Scheduled':
                case 'Class Enrollment':
                    return 'Reservado';
                case 'Pack Purchase':
                    return 'Crédito adquirido';
                default:
                    return log.reason;
            }
        })();

        return {
            title,
            scheduleDetails,
            isDebit,
            isMarker,
            iconColor,
            amountColor,
            statusLabel,
            formattedChange: isMarker
                ? '—'
                : log.change_amount > 0 ? `+${log.change_amount}` : `${log.change_amount}`
        };
    };

    const agendados = logs.filter(l => l.bucket === 'agendado');
    const historico = logs.filter(l => l.bucket === 'historico');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[500px] p-0 gap-0 rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-2xl">
                <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100 shrink-0">
                            <Ticket className="h-4.5 w-4.5 text-bee-amber" />
                        </div>
                        <div>
                            <DialogTitle className="text-[17px] font-bold text-slate-900 leading-tight">Controle de Aulas</DialogTitle>
                            <DialogDescription className="text-xs text-slate-400 mt-0.5">Histórico de utilização de créditos de {studentName}</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="px-6 py-5 max-h-[420px] overflow-y-auto scrollbar-thin">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-2">
                            <Loader2 className="h-8 w-8 text-bee-amber animate-spin" />
                            <span className="text-xs font-semibold text-slate-400">Carregando histórico...</span>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                                <Ticket className="h-6 w-6 text-slate-300" />
                            </div>
                            <p className="text-sm font-bold text-slate-700">Nenhum histórico encontrado</p>
                            <p className="text-xs text-slate-400 mt-1 max-w-[280px]">Este aluno ainda não possui movimentações de créditos registradas.</p>
                        </div>
                    ) : (
                        <Tabs defaultValue="historico" className="w-full">
                            <TabsList className="grid grid-cols-2 mb-4 bg-slate-50 rounded-xl p-1 h-auto">
                                <TabsTrigger value="historico" className="rounded-lg text-xs font-bold py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-bee-amber">
                                    <Ticket className="h-3.5 w-3.5 mr-1.5" />
                                    Histórico ({historico.length})
                                </TabsTrigger>
                                <TabsTrigger value="agendado" className="rounded-lg text-xs font-bold py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-bee-amber">
                                    <CalendarClock className="h-3.5 w-3.5 mr-1.5" />
                                    Agendados ({agendados.length})
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="historico" className="m-0">
                                {historico.length === 0 ? (
                                    <p className="text-xs text-slate-400 text-center py-8">Nenhum lançamento no histórico ainda.</p>
                                ) : (
                                    <LogList logs={historico} getLogDetails={getLogDetails} formatDateTime={formatDateTime} />
                                )}
                            </TabsContent>
                            <TabsContent value="agendado" className="m-0">
                                {agendados.length === 0 ? (
                                    <p className="text-xs text-slate-400 text-center py-8">Nenhum crédito reservado em treinos ou aulas futuras.</p>
                                ) : (
                                    <LogList logs={agendados} getLogDetails={getLogDetails} formatDateTime={formatDateTime} />
                                )}
                            </TabsContent>
                        </Tabs>
                    )}
                </div>

                <DialogFooter className="px-6 py-4 border-t border-slate-100 flex flex-row items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={fetchLogs} disabled={loading}
                        className="h-9 px-3 rounded-xl border border-transparent text-slate-500 hover:bg-slate-50 text-xs font-bold gap-1.5">
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                    <Button size="sm" onClick={() => onOpenChange(false)}
                        className="h-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 shadow-none">
                        Fechar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function LogList({
    logs,
    getLogDetails,
    formatDateTime,
}: {
    logs: CreditLogViewRow[];
    getLogDetails: (log: CreditLogViewRow) => {
        title: string;
        scheduleDetails: string;
        isDebit: boolean;
        isMarker: boolean;
        iconColor: string;
        amountColor: string;
        statusLabel: string;
        formattedChange: string;
    };
    formatDateTime: (s: string | null | undefined) => string;
}) {
    return (
        <div className="space-y-4">
            {logs.map((log) => {
                const details = getLogDetails(log);
                return (
                    <div key={log.id} className="flex items-start gap-3.5 pb-4 border-b border-slate-50 last:border-b-0 last:pb-0">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center border shrink-0 ${details.iconColor}`}>
                            {details.isDebit ? (
                                <ArrowDownRight className="h-4 w-4" />
                            ) : (
                                <ArrowUpRight className="h-4 w-4" />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-bold text-slate-800 truncate">{details.title}</p>
                                <span className={`text-sm font-black shrink-0 ${details.amountColor}`}>
                                    {details.isMarker
                                        ? '—'
                                        : `${details.formattedChange} ${Math.abs(log.change_amount) === 1 ? 'crédito' : 'créditos'}`}
                                </span>
                            </div>
                            {details.scheduleDetails && (
                                <p className="text-xs font-medium text-slate-500 mt-0.5 flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                    {details.scheduleDetails}
                                </p>
                            )}
                            <div className="flex items-center gap-3 mt-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 shrink-0" />
                                    Lançamento: {formatDateTime(log.created_at)}
                                </span>
                                <span className="bg-slate-50 border border-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[9px]">
                                    {details.statusLabel}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
