'use client';

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, Edit, Trash2, Calendar, Clock, Dumbbell, User, AlertTriangle, Save, Ban } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { WorkoutModal } from "./workout-modal"; // Reutilizar para edição
import { ExerciseSearch } from "./exercise-search";
import { Plus } from "lucide-react";

interface WorkoutDetailsSheetProps {
    workoutId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void; // Refresh na lista pai
}

export function WorkoutDetailsSheet({ workoutId, isOpen, onClose, onUpdate }: WorkoutDetailsSheetProps) {
    const supabase = createClient();
    const { toast } = useToast();

    // Estados de Dados
    const [workout, setWorkout] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'details' | 'execution'>('details');

    // Estados de Execução (Log de Exercícios)
    const [exercises, setExercises] = useState([{ name: '', exercise_id: null as string | null, sets: 3, reps: 10, weight: 0 }]);

    // Estados de Confirmação (Cancelamento/Falta)
    const [confirmDialog, setConfirmDialog] = useState<{ open: boolean, type: 'cancel' | 'absent' | null }>({ open: false, type: null });

    // Estado de Edição
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // FETCH DETAILS
    const fetchDetails = async () => {
        if (!workoutId) return;
        setLoading(true);
        const { data } = await (supabase as any)
            .from('workouts')
            .select('*, student:students(full_name, avatar_url, id)')
            .eq('id', workoutId)
            .single();

        setWorkout(data);
        setLoading(false);

        // Se já estiver concluído, buscar execuções (futuro)
    };

    // Carregar ao abrir
    if (isOpen && !workout && !loading && workoutId) {
        fetchDetails();
    }

    // AÇÕES
    const handleStatusChange = async (newStatus: string, reason?: string) => {
        if (!workout) return;

        try {
            // 1. Atualizar Status
            const { error } = await (supabase as any)
                .from('workouts')
                .update({ status: newStatus })
                .eq('id', workout.id);

            if (error) throw error;

            // 2. Lógica de Créditos (Simplificada)
            if (newStatus === 'Concluido' || newStatus === 'Faltou') {
                await (supabase as any).rpc('deduct_credit', {
                    p_student_id: workout.student_id,
                    p_amount: 1, // Consome 1 crédito
                    p_reason: newStatus === 'Concluido' ? 'Treino Realizado' : 'Falta Registrada',
                    p_ref_id: workout.id
                });
            }

            // 3. Salvar Exercícios (Se for conclusão)
            if (newStatus === 'Concluido' && exercises.length > 0) {
                const executionPayload = exercises
                    .filter(e => e.name) // Só salva se tiver nome
                    .map(e => ({
                        workout_id: workout.id,
                        exercise_id: e.exercise_id,
                        exercise_name: e.name,
                        sets: e.sets,
                        reps: e.reps,
                        weight: e.weight
                    }));
                if (executionPayload.length > 0) {
                    // TODO: Aguardando definição de design do BD para execução de treinos/presença.
                    // Tabela `workout_executions` não existe (audit 2026-04-25).
                    // await (supabase as any).from('workout_executions').insert(executionPayload);
                }
            }

            toast({ title: `Treino atualizado: ${newStatus}` });
            onUpdate();
            onClose();

        } catch (err: any) {
            console.error(err);
            toast({ title: "Erro ao atualizar", description: err.message, variant: "destructive" });
        }
    };

    const addExerciseRow = () => {
        setExercises([...exercises, { name: '', exercise_id: null, sets: 3, reps: 10, weight: 0 }]);
    };

    if (!workout && isOpen && loading) return null; // Or a loading spinner

    return (
        <>
            <Sheet open={isOpen} onOpenChange={(v) => !v && onClose()}>
                <SheetContent className="sm:max-w-[600px] flex flex-col h-full overflow-y-auto">
                    {workout ? (
                        <>
                            <SheetHeader className="relative p-0 mb-8 mt-[-24px] mx-[-24px] overflow-hidden rounded-t-[2rem]">
                                <div className="absolute inset-0 bg-gradient-to-r from-bee-midnight via-slate-900 to-bee-midnight" />
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />
                                <div className="absolute -top-24 -right-24 w-48 h-48 bg-bee-amber/10 rounded-full blur-3xl animate-pulse" />
                                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-bee-amber/5 rounded-full blur-3xl" />

                                <div className="relative px-8 pt-10 pb-8 flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-bee-amber to-amber-600 p-[1px] shadow-lg shadow-bee-amber/20 group animate-in zoom-in-50 duration-500">
                                                <div className="flex h-full w-full items-center justify-center rounded-[15px] bg-bee-midnight/90 backdrop-blur-xl transition-colors group-hover:bg-bee-midnight/40">
                                                    <Dumbbell className="h-7 w-7 text-bee-amber animate-pulse" />
                                                </div>
                                            </div>
                                            <div>
                                                <SheetTitle className="text-3xl font-black text-white tracking-tight leading-none font-display mb-2">
                                                    {workout.title}
                                                </SheetTitle>
                                                <SheetDescription className="flex items-center gap-3">
                                                    <Badge variant="outline" className="bg-bee-amber/10 text-bee-amber border-bee-amber/30 font-bold uppercase tracking-wider text-[10px] px-2.5 py-0.5 rounded-full font-sans">
                                                        {workout.type}
                                                    </Badge>
                                                    <div className="h-1 w-1 rounded-full bg-slate-700" />
                                                    <span className="flex items-center gap-1.5 text-slate-400 font-bold text-[11px] uppercase tracking-wider font-sans">
                                                        <Calendar className="h-3.5 w-3.5 text-bee-amber" />
                                                        {workout.scheduled_at ? format(new Date(workout.scheduled_at), "dd/MM/yyyy") : '-'}
                                                    </span>
                                                    <div className="h-1 w-1 rounded-full bg-slate-700" />
                                                    <span className="flex items-center gap-1.5 text-slate-400 font-bold text-[11px] uppercase tracking-wider font-sans">
                                                        <Clock className="h-3.5 w-3.5 text-bee-amber" />
                                                        {workout.scheduled_at ? format(new Date(workout.scheduled_at), "HH:mm") : '-'}
                                                    </span>
                                                </SheetDescription>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-bee-amber/20 to-transparent" />
                            </SheetHeader>

                            {/* CONTEÚDO */}
                            <div className="flex-1 overflow-y-auto pr-2">

                                {viewMode === 'details' ? (
                                    <div className="space-y-6">
                                        {/* Card Aluno */}
                                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border">
                                            <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center font-bold text-orange-700">
                                                {workout.student?.full_name?.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">Aluno</p>
                                                <p className="font-bold text-slate-800">{workout.student?.full_name}</p>
                                            </div>
                                            <div className="ml-auto">
                                                <Badge className={
                                                    workout.status === 'Agendado' ? "bg-blue-500 text-white hover:bg-blue-600 border-none" :
                                                        workout.status === 'Concluido' ? "bg-emerald-500 text-white hover:bg-emerald-600 border-none" :
                                                            workout.status === 'Pendente' ? "bg-orange-500 text-white hover:bg-orange-600 border-none" :
                                                                workout.status === 'Em Execução' ? "bg-pink-500 text-white hover:bg-pink-600 border-none" :
                                                                    workout.status === 'Faltou' ? "bg-slate-900 text-white hover:bg-slate-900 border-none" :
                                                                        workout.status === 'Cancelado' ? "bg-red-500 text-white hover:bg-red-600 border-none" :
                                                                            "bg-slate-500 text-white border-none"
                                                }>
                                                    {workout.status === 'Pendente' ? 'Pendente de Ação' : workout.status}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Botões de Ação */}
                                        {workout.status !== 'Cancelado' && workout.status !== 'Concluido' && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <Button
                                                    className="bg-green-600 hover:bg-green-700 text-white h-10"
                                                    onClick={() => setViewMode('execution')}
                                                >
                                                    <CheckCircle2 className="mr-2 h-5 w-5" /> Concluir Treino
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="text-red-600 border-red-200 hover:bg-red-50 h-10"
                                                    onClick={() => setConfirmDialog({ open: true, type: 'absent' })}
                                                >
                                                    <User className="mr-2 h-5 w-5" /> Registrar Falta
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="text-slate-600 h-10"
                                                    onClick={() => setIsEditModalOpen(true)}
                                                >
                                                    <Edit className="mr-2 h-4 w-4" /> Editar
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="text-slate-600 h-10"
                                                    onClick={() => setConfirmDialog({ open: true, type: 'cancel' })}
                                                >
                                                    <Ban className="mr-2 h-4 w-4" /> Cancelar
                                                </Button>
                                            </div>
                                        )}

                                        {/* Aviso se já foi finalizado */}
                                        {(workout.status === 'Concluido' || workout.status === 'Faltou') && (
                                            <div className="p-4 bg-slate-50 text-center rounded-lg text-muted-foreground text-sm">
                                                Este treino já foi finalizado como <strong>{workout.status}</strong>.
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* MODO EXECUÇÃO (Concluir) */
                                    <div className="space-y-4 animate-in slide-in-from-right-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold">Registrar Exercícios</h3>
                                            <Button variant="ghost" size="sm" onClick={() => setViewMode('details')}>Voltar</Button>
                                        </div>

                                        <div className="space-y-3">
                                            {exercises.map((ex, idx) => (
                                                <div key={idx} className="p-3 border rounded-xl space-y-3 bg-slate-50/50 relative group">
                                                    <button
                                                        onClick={() => {
                                                            const newEx = [...exercises];
                                                            newEx.splice(idx, 1);
                                                            setExercises(newEx);
                                                        }}
                                                        className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                    <div>
                                                        <Label className="text-[11px] uppercase font-bold text-slate-500 mb-1 block">Exercício</Label>
                                                        <ExerciseSearch
                                                            value={ex.name}
                                                            onChange={(id, name) => {
                                                                const newEx = [...exercises];
                                                                newEx[idx].name = name;
                                                                newEx[idx].exercise_id = id;
                                                                setExercises(newEx);
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div>
                                                            <Label className="text-[11px] uppercase font-bold text-slate-500 mb-1 block">Séries</Label>
                                                            <Input type="number" className="h-11" value={ex.sets} onChange={(e) => {
                                                                const newEx = [...exercises];
                                                                newEx[idx].sets = parseInt(e.target.value);
                                                                setExercises(newEx);
                                                            }} />
                                                        </div>
                                                        <div>
                                                            <Label className="text-[11px] uppercase font-bold text-slate-500 mb-1 block">Reps</Label>
                                                            <Input type="number" className="h-11" value={ex.reps} onChange={(e) => {
                                                                const newEx = [...exercises];
                                                                newEx[idx].reps = parseInt(e.target.value);
                                                                setExercises(newEx);
                                                            }} />
                                                        </div>
                                                        <div>
                                                            <Label className="text-[11px] uppercase font-bold text-slate-500 mb-1 block">Carga (kg)</Label>
                                                            <Input type="number" className="h-11" value={ex.weight} onChange={(e) => {
                                                                const newEx = [...exercises];
                                                                newEx[idx].weight = parseFloat(e.target.value);
                                                                setExercises(newEx);
                                                            }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <Button variant="outline" className="w-full border-dashed h-10 border-slate-300 text-slate-600 hover:bg-slate-100" onClick={addExerciseRow}>
                                            <Plus className="mr-2 h-4 w-4" /> Adicionar Exercício
                                        </Button>

                                        <Button className="w-full h-10 bg-green-600 hover:bg-green-700 text-white mt-4" onClick={() => handleStatusChange('Concluido')}>
                                            <Save className="mr-2 h-4 w-4" /> Salvar e Finalizar
                                        </Button>
                                    </div>
                                )}

                            </div>

                            <SheetFooter className="mt-auto border-t pt-4">
                                <Button variant="ghost" onClick={onClose}>Fechar</Button>
                            </SheetFooter>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-muted-foreground">Carregando detalhes...</p>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* DIALOGOS DE CONFIRMAÇÃO */}
            <AlertDialog open={confirmDialog.open} onOpenChange={(o) => setConfirmDialog({ ...confirmDialog, open: o })}>
                <AlertDialogContent className="rounded-[2rem] border-slate-100 shadow-2xl p-0 overflow-hidden max-w-[400px]">
                    <div className={cn(
                        "p-8 text-center space-y-4",
                        confirmDialog.type === 'cancel' ? "bg-red-50/50" : "bg-amber-50/50"
                    )}>
                        <div className={cn(
                            "mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-2 animate-bounce",
                            confirmDialog.type === 'cancel' ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                        )}>
                            <AlertTriangle className="h-8 w-8" />
                        </div>
                        <div className="space-y-2">
                            <AlertDialogTitle className="text-2xl font-bold font-display text-slate-900">
                                Confirmar Ação
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500 font-sans text-base leading-relaxed">
                                {confirmDialog.type === 'cancel'
                                    ? "Deseja realmente cancelar este treino? O horário será liberado na agenda."
                                    : "Confirmar que o aluno FALTOU? Isso poderá consumir créditos dependendo do plano."}
                            </AlertDialogDescription>
                        </div>
                    </div>
                    <AlertDialogFooter className="p-6 bg-white flex-col sm:flex-row gap-3 sm:gap-0">
                        <AlertDialogCancel className="w-full sm:w-auto rounded-xl border-slate-200 font-bold h-10">
                            Não, voltar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => handleStatusChange(confirmDialog.type === 'cancel' ? 'Cancelado' : 'Faltou')}
                            className={cn(
                                "w-full sm:w-auto rounded-xl font-bold h-10 text-white",
                                confirmDialog.type === 'cancel' ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"
                            )}
                        >
                            Sim, confirmar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* MODAL DE EDIÇÃO */}
            <WorkoutModal
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                workoutToEdit={workout} // Passando o objeto para edição
                onSuccess={() => {
                    onUpdate();
                    fetchDetails();
                }}
            />
        </>
    );
}
