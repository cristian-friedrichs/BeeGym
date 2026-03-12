'use client';

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Loader2, Plus, Trash2, Dumbbell } from "lucide-react";
import { format } from "date-fns";

import { ExerciseSearch } from "./exercise-search";

interface WorkoutExecutionSheetProps {
    workout: any;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function WorkoutExecutionSheet({ workout, isOpen, onClose, onSuccess }: WorkoutExecutionSheetProps) {
    const supabase = createClient();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const [executionList, setExecutionList] = useState([{ name: '', exercise_id: null as string | null, sets: 3, reps: 10, weight: 0, time: 0 }]);
    const [notes, setNotes] = useState("");

    useEffect(() => {
        if (isOpen) {
            setExecutionList([{ name: '', exercise_id: null, sets: 3, reps: 10, weight: 0, time: 0 }]);
            setNotes(workout?.notes || "");
        }
    }, [isOpen, workout]);

    const addExerciseRow = () => {
        setExecutionList([...executionList, { name: '', exercise_id: null, sets: 3, reps: 10, weight: 0, time: 0 }]);
    };

    const removeExerciseRow = (index: number) => {
        const newList = [...executionList];
        newList.splice(index, 1);
        setExecutionList(newList);
    };

    const handleUpdateExercise = (index: number, field: string, value: any) => {
        const newList = [...executionList];
        newList[index] = { ...newList[index], [field]: value };
        setExecutionList(newList);
    };

    const handleFinish = async () => {
        setLoading(true);
        try {
            // 1. Salvar os Exercícios
            const validExercises = executionList.filter(e => e.name.trim() !== '');
            if (validExercises.length > 0) {
                const payloads = validExercises.map(e => ({
                    workout_id: workout.id,
                    exercise_id: e.exercise_id, // Store ID if available
                    exercise_name: e.name,
                    sets: e.sets,
                    reps: e.reps,
                    weight: e.weight,
                    time_minutes: e.time
                }));
                const { error: exError } = await (supabase as any).from('workout_executions').insert(payloads);
                if (exError) throw exError;
            }

            // 2. Atualizar o Treino (Status e Notas)
            const { error: wkError } = await (supabase as any).from('workouts').update({
                status: 'Concluido',
                notes: notes
            }).eq('id', workout.id);

            if (wkError) throw wkError;

            toast({ title: "Treino Finalizado com sucesso!" });
            onSuccess();
            onClose();
        } catch (error: any) {
            toast({ title: "Erro ao finalizar", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    if (!workout) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="sm:max-w-[600px] w-full h-full flex flex-col bg-slate-50 overflow-y-auto">
                <SheetHeader className="mb-6 bg-white p-4 rounded-xl shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center text-green-600"><Dumbbell className="h-4 w-4" /></div>
                            <div>
                                <SheetTitle className="text-lg">Registrar Exercícios</SheetTitle>
                                <p className="text-xs text-muted-foreground">{workout.title} • {workout.scheduled_at && format(new Date(workout.scheduled_at), 'dd/MM/yyyy')}</p>
                            </div>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 space-y-4">
                    {executionList.map((ex, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-xl border shadow-sm relative group">
                            <button
                                onClick={() => removeExerciseRow(idx)}
                                className="absolute right-3 top-3 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                                title="Remover exercício"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>

                            <div className="space-y-4">
                                <div className="pr-8">
                                    <Label className="text-xs text-slate-500 font-bold mb-1 block">Exercício</Label>
                                    <ExerciseSearch
                                        value={ex.name}
                                        onChange={(id, name) => {
                                            const newList = [...executionList];
                                            newList[idx].name = name;
                                            newList[idx].exercise_id = id;
                                            setExecutionList(newList);
                                        }}
                                    />
                                </div>

                                <div className="grid grid-cols-4 gap-3">
                                    <div>
                                        <Label className="text-[11px] text-slate-500 uppercase font-bold">Séries</Label>
                                        <Input type="number" value={ex.sets} onChange={(e) => handleUpdateExercise(idx, 'sets', parseInt(e.target.value))} className="h-11 text-center" />
                                    </div>
                                    <div>
                                        <Label className="text-[11px] text-slate-500 uppercase font-bold">Reps</Label>
                                        <Input type="number" value={ex.reps} onChange={(e) => handleUpdateExercise(idx, 'reps', parseInt(e.target.value))} className="h-11 text-center" />
                                    </div>
                                    <div>
                                        <Label className="text-[11px] text-slate-500 uppercase font-bold">Carga(kg)</Label>
                                        <Input type="number" value={ex.weight} onChange={(e) => handleUpdateExercise(idx, 'weight', parseFloat(e.target.value))} className="h-11 text-center" />
                                    </div>
                                    <div>
                                        <Label className="text-[11px] text-slate-500 uppercase font-bold">Tempo(m)</Label>
                                        <Input type="number" value={ex.time} onChange={(e) => handleUpdateExercise(idx, 'time', parseInt(e.target.value))} className="h-11 text-center" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    <Button variant="outline" onClick={addExerciseRow} className="w-full h-10 border-dashed bg-white text-slate-600 hover:text-orange-600 hover:border-orange-200">
                        <Plus className="mr-2 h-4 w-4" /> Adicionar Exercício
                    </Button>

                    <div className="pt-4 space-y-2">
                        <Label className="font-bold text-slate-700">Observações do Treino</Label>
                        <Textarea placeholder="Como foi o desempenho do aluno?" value={notes} onChange={e => setNotes(e.target.value)} className="bg-white min-h-[100px]" />
                    </div>
                </div>

                <SheetFooter className="pt-6 mt-auto">
                    <Button onClick={handleFinish} disabled={loading} className="w-full h-10 bg-green-600 hover:bg-green-700 text-white font-bold text-lg shadow-md">
                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                        Salvar e Finalizar
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
