'use client';

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Loader2, Check, X, Clock } from "lucide-react";
import { saveRecurringWorkouts, getStudentRecurringSchedule } from "@/actions/treinos";
import { cn } from "@/lib/utils";

interface RecurringWorkoutModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    studentId: string;
    studentName: string;
    organizationId: string;
    onSuccess?: () => void;
}

const DAYS = [
    { label: "Dom", value: 0 }, { label: "Seg", value: 1 }, { label: "Ter", value: 2 },
    { label: "Qua", value: 3 }, { label: "Qui", value: 4 }, { label: "Sex", value: 5 }, { label: "Sáb", value: 6 },
];

export function RecurringWorkoutModal({ open, onOpenChange, studentId, studentName, organizationId, onSuccess }: RecurringWorkoutModalProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [title, setTitle] = useState("Treino");
    const [type, setType] = useState("Hipertrofia");
    const [schedule, setSchedule] = useState<Record<number, string>>({});

    useEffect(() => {
        if (!open || !studentId) return;
        setFetching(true);
        getStudentRecurringSchedule(studentId).then(data => {
            if (data) {
                setTitle(data.title || "Treino");
                setType(data.type || "Hipertrofia");
                const s: Record<number, string> = {};
                data.schedule.forEach((item: any) => { s[item.day] = item.time; });
                setSchedule(s);
            } else {
                setTitle("Treino"); setType("Hipertrofia"); setSchedule({});
            }
        }).catch(console.error).finally(() => setFetching(false));
    }, [open, studentId]);

    const toggleDay = (day: number) => {
        setSchedule(prev => {
            const next = { ...prev };
            if (day in next) delete next[day]; else next[day] = "08:00";
            return next;
        });
    };

    const updateTime = (day: number, time: string) => setSchedule(prev => ({ ...prev, [day]: time }));

    const handleSave = async () => {
        if (!title) { toast({ title: "Informe o título do treino", variant: "destructive" }); return; }
        setLoading(true);
        try {
            const result = await saveRecurringWorkouts({
                studentId, organizationId, title, type,
                schedule: Object.entries(schedule).map(([day, time]) => ({ day: parseInt(day), time })),
                studentName,
            });
            if (result.success) {
                toast({ title: "Grade atualizada!", description: result.message });
                onSuccess?.(); onOpenChange(false);
            } else {
                toast({ title: "Erro ao salvar", description: result.error, variant: "destructive" });
            }
        } catch (e: any) {
            toast({ title: "Erro inesperado", description: e.message, variant: "destructive" });
        } finally { setLoading(false); }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[500px] p-0 gap-0 rounded-2xl overflow-hidden bg-white border border-slate-100">
                <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-bee-amber/10 flex items-center justify-center">
                            <CalendarDays className="h-4.5 w-4.5 text-bee-amber" />
                        </div>
                        <div>
                            <DialogTitle className="text-[17px] font-bold text-slate-900 leading-tight">Grade de Treinos</DialogTitle>
                            <DialogDescription className="text-xs text-slate-400 mt-0.5">{studentName} · Dias e horários recorrentes</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
                    {fetching ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
                        </div>
                    ) : (
                        <>
                            {/* Title + Type */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Título</Label>
                                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Treino A"
                                        className="h-9 rounded-xl border-slate-200 text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Modalidade</Label>
                                    <Select value={type} onValueChange={setType}>
                                        <SelectTrigger className="h-9 rounded-xl border-slate-200 text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                            {['Hipertrofia', 'Força', 'Cardio', 'Pilates', 'CrossFit', 'Funcional', 'Outro'].map(t => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Day selector */}
                            <div className="space-y-3">
                                <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Agenda semanal</Label>
                                <div className="flex gap-1.5 justify-between">
                                    {DAYS.map(day => {
                                        const active = day.value in schedule;
                                        return (
                                            <button key={day.value} type="button" onClick={() => toggleDay(day.value)}
                                                className={cn(
                                                    'flex-1 h-10 rounded-xl text-[11px] font-bold transition-all border',
                                                    active ? 'bg-bee-amber text-bee-midnight border-bee-amber' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                                )}>
                                                {day.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Time list */}
                                {Object.keys(schedule).length > 0 ? (
                                    <div className="space-y-2">
                                        {Object.keys(schedule).sort((a, b) => parseInt(a) - parseInt(b)).map(dayStr => {
                                            const day = parseInt(dayStr);
                                            const dayLabel = DAYS.find(d => d.value === day)?.label;
                                            return (
                                                <div key={day} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100">
                                                    <span className="text-xs font-bold text-slate-700 w-8">{dayLabel}</span>
                                                    <Clock className="h-3.5 w-3.5 text-bee-amber shrink-0" />
                                                    <Input type="time" value={schedule[day]} onChange={e => updateTime(day, e.target.value)}
                                                        className="h-7 border-none bg-transparent p-0 text-sm font-semibold focus-visible:ring-0 text-slate-700 w-24" />
                                                    <button onClick={() => toggleDay(day)} className="ml-auto text-slate-300 hover:text-red-500 transition-colors">
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-xl text-slate-400">
                                        <Clock className="h-5 w-5 mx-auto mb-2 text-slate-200" />
                                        <p className="text-xs font-medium">Selecione os dias acima</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter className="px-6 py-4 border-t border-slate-100 flex flex-row items-center gap-2 sm:justify-end">
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading}
                        className="h-9 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold">
                        Cancelar
                    </Button>
                    <Button size="sm" disabled={loading || fetching} onClick={handleSave}
                        className="h-9 rounded-xl bg-bee-amber hover:bg-bee-amber/90 text-bee-midnight font-bold text-xs px-5 gap-1.5 shadow-none">
                        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 stroke-[3px]" />}
                        {loading ? 'Salvando...' : 'Salvar grade'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
