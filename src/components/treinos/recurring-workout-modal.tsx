'use client';

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Dumbbell, Calendar as CalendarIcon, Loader2, Check, X, Clock, Trash2 } from "lucide-react";
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

const DAYS_OF_WEEK = [
    { label: "Dom", value: 0 },
    { label: "Seg", value: 1 },
    { label: "Ter", value: 2 },
    { label: "Qua", value: 3 },
    { label: "Qui", value: 4 },
    { label: "Sex", value: 5 },
    { label: "Sáb", value: 6 },
];

export function RecurringWorkoutModal({ 
    open, 
    onOpenChange, 
    studentId, 
    studentName, 
    organizationId,
    onSuccess 
}: RecurringWorkoutModalProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);

    // States
    const [title, setTitle] = useState("Treino");
    const [type, setType] = useState("Hipertrofia");
    const [schedule, setSchedule] = useState<Record<number, string>>({});

    useEffect(() => {
        if (open && studentId) {
            const loadSchedule = async () => {
                setFetching(true);
                try {
                    const data = await getStudentRecurringSchedule(studentId);
                    if (data) {
                        setTitle(data.title || "Treino");
                        setType(data.type || "Hipertrofia");
                        const newSchedule: Record<number, string> = {};
                        data.schedule.forEach(item => {
                            newSchedule[item.day] = item.time;
                        });
                        setSchedule(newSchedule);
                    } else {
                        // Reset defaults if no schedule found
                        setTitle("Treino");
                        setType("Hipertrofia");
                        setSchedule({});
                    }
                } catch (error) {
                    console.error("Error loading recurring schedule:", error);
                } finally {
                    setFetching(false);
                }
            };
            loadSchedule();
        }
    }, [open, studentId]);

    const toggleDay = (day: number) => {
        setSchedule(prev => {
            const next = { ...prev };
            if (day in next) {
                delete next[day];
            } else {
                next[day] = "08:00";
            }
            return next;
        });
    };

    const updateTime = (day: number, time: string) => {
        setSchedule(prev => ({ ...prev, [day]: time }));
    };

    const handleSave = async () => {
        if (!title) {
            toast({ title: "Informe o título do treino", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const formattedSchedule = Object.entries(schedule).map(([day, time]) => ({
                day: parseInt(day),
                time
            }));

            const result = await saveRecurringWorkouts({
                studentId,
                organizationId,
                title,
                type,
                schedule: formattedSchedule,
                studentName
            });

            if (result.success) {
                toast({ title: "Grade de treinos atualizada!", description: result.message });
                onSuccess?.();
                onOpenChange(false);
            } else {
                toast({ title: "Erro ao salvar", description: result.error, variant: "destructive" });
            }
        } catch (error: any) {
            toast({ title: "Erro inesperado", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-xl p-0 overflow-hidden border-l border-slate-100 shadow-2xl flex flex-col h-full bg-white">
                <SheetHeader className="p-6 border-b border-slate-50 bg-white shrink-0">
                    <div className="flex items-center gap-2 text-left">
                        <div className="h-12 w-12 rounded-xl bg-bee-amber/10 flex items-center justify-center border border-bee-amber/20">
                            <CalendarIcon className="h-6 w-6 text-bee-amber" />
                        </div>
                        <div>
                            <SheetTitle className="text-xl font-bold tracking-tight text-bee-midnight uppercase">
                                Grade de Treinos
                            </SheetTitle>
                            <SheetDescription className="text-slate-400 font-medium text-xs">
                                {studentName} • Defina os dias e horários recorrentes
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {fetching ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-bee-amber" />
                            <p className="text-xs font-bold uppercase tracking-widest">Carregando grade atual...</p>
                        </div>
                    ) : (
                        <>
                            {/* CONFIGURAÇÃO GERAL */}
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Título do Treino</Label>
                                    <Input
                                        placeholder="Ex: Musculação / Treino A"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        className="h-11 rounded-2xl border-slate-100 bg-slate-50/50 transition-all font-semibold text-bee-midnight px-5 focus:ring-bee-amber/20"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Modalidade</Label>
                                    <Select value={type} onValueChange={setType}>
                                        <SelectTrigger className="h-11 rounded-2xl border-slate-100 bg-slate-50/50 transition-all font-semibold text-bee-midnight px-5 focus:ring-bee-amber/20">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                                            <SelectItem value="Hipertrofia" className="font-medium">Hipertrofia</SelectItem>
                                            <SelectItem value="Força" className="font-medium">Força</SelectItem>
                                            <SelectItem value="Cardio" className="font-medium">Cardio</SelectItem>
                                            <SelectItem value="Pilates" className="font-medium">Pilates</SelectItem>
                                            <SelectItem value="CrossFit" className="font-medium">CrossFit</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* SELEÇÃO DE DIAS */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Agenda Semanal</Label>
                                    <div className="h-px flex-1 bg-slate-50 mx-4" />
                                </div>

                                <div className="flex justify-between gap-1 overflow-x-auto pb-2">
                                    {DAYS_OF_WEEK.map((day) => {
                                        const isActive = day.value in schedule;
                                        return (
                                            <button
                                                key={day.value}
                                                onClick={() => toggleDay(day.value)}
                                                className={cn(
                                                    "h-12 w-12 rounded-xl flex items-center justify-center text-[10px] font-black uppercase transition-all border",
                                                    isActive 
                                                        ? "bg-bee-amber text-bee-midnight border-bee-amber shadow-lg shadow-bee-amber/10 scale-105" 
                                                        : "bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300"
                                                )}
                                            >
                                                {day.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* LISTA DE HORÁRIOS */}
                                <div className="space-y-4 pt-2">
                                    {Object.keys(schedule).length > 0 ? (
                                        Object.keys(schedule).sort().map((dayStr) => {
                                            const day = parseInt(dayStr);
                                            const dayData = DAYS_OF_WEEK.find(d => d.value === day);
                                            return (
                                                <div 
                                                    key={day} 
                                                    className="flex items-center gap-4 p-4 bg-slate-50/50 border border-slate-100 rounded-2xl animate-in fade-in slide-in-from-left-2 transition-all group hover:bg-white hover:shadow-sm"
                                                >
                                                    <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center border border-slate-100 font-black text-bee-midnight text-xs shadow-sm">
                                                        {dayData?.label}
                                                    </div>
                                                    
                                                    <div className="flex-1 flex items-center gap-3">
                                                        <Clock className="h-4 w-4 text-bee-amber" />
                                                        <Input
                                                            type="time"
                                                            value={schedule[day]}
                                                            onChange={(e) => updateTime(day, e.target.value)}
                                                            className="h-10 border-none bg-transparent font-bold text-bee-midnight text-sm p-0 focus-visible:ring-0"
                                                        />
                                                    </div>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => toggleDay(day)}
                                                        className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/30">
                                            <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-300">
                                                <Clock className="h-6 w-6" />
                                            </div>
                                            <p className="text-sm font-semibold text-slate-400">Nenhum dia selecionado na agenda</p>
                                            <p className="text-[10px] text-slate-300 uppercase font-bold tracking-widest mt-1">Toque em um dia acima para começar</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <SheetFooter className="p-8 border-t bg-white flex items-center gap-3 shrink-0 sm:justify-end">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="flex-1 sm:flex-none text-slate-400 hover:text-slate-600 hover:bg-slate-50 font-black h-10 rounded-full uppercase text-[10px] tracking-widest transition-all"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading || fetching}
                        className="flex-1 sm:flex-none bg-bee-amber hover:bg-amber-500 text-bee-midnight font-black h-10 rounded-full shadow-lg shadow-bee-amber/20 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-[10px] px-10"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Check className="mr-2 h-4 w-4 stroke-[3px]" />
                                Atualizar Grade
                            </>
                        )}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
