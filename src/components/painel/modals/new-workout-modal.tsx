import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { Sparkles, Plus, Trash2, Dumbbell, X, Check, Loader2 } from 'lucide-react';
import { saveGeneratedWorkout } from '@/actions/treinos';
import { generateWorkout } from '@/ai/flows/generate-workout';
import { ExerciseSearch } from '@/components/treinos/exercise-search';
import { cn } from '@/lib/utils';

interface NewWorkoutModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

const fieldCls = 'h-9 rounded-xl border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:border-bee-amber focus:ring-2 focus:ring-bee-amber/20 focus:ring-offset-0 transition-all';
const labelCls = 'text-sm font-medium text-slate-700';

export function NewWorkoutModal({ open, onOpenChange, onSuccess, studentId }: NewWorkoutModalProps & { studentId?: string }) {
    const { toast } = useToast();
    const supabase = createClient();
    const { organizationId, user: authUser } = useAuth();

    // State
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState<'create' | 'ai'>('create');

    // Workout Data
    const [title, setTitle] = useState('');
    const [goal, setGoal] = useState('');
    const [notes, setNotes] = useState('');
    const [exercises, setExercises] = useState<any[]>([]);

    // AI State
    const [aiObjective, setAiObjective] = useState('');
    const [availableExercises, setAvailableExercises] = useState<any[]>([]);

    useEffect(() => {
        if (open) {
            fetchInitialData();
        }
    }, [open]);

    async function fetchInitialData() {
        try {
            // Fetch exercises for AI
            const { data: exData } = await (supabase as any)
                .from('exercises')
                .select('name, muscle_group');

            if (exData) {
                setAvailableExercises((exData as any[]).map((e: any) => ({
                    name: e.name,
                    description: `${e.muscle_group}`,
                    tags: [e.muscle_group]
                })));
            }

        } catch (error) {
            console.error('Error fetching initial data:', error);
        }
    }

    const handleGenerateAi = async () => {
        if (!aiObjective) {
            toast({ title: 'Defina um objetivo', variant: 'destructive' });
            return;
        }

        setGenerating(true);
        try {
            const workoutInput = {
                objective: aiObjective,
                studentGoals: 'Geral',
                studentRestrictions: 'Nenhuma',
                exerciseLibrary: availableExercises
            };

            const result = await generateWorkout(workoutInput);

            setTitle(result.workoutName);
            setNotes(result.notes);

            const { data: dbExercises } = await (supabase as any).from('exercises').select('id, name');
            const dbExMap = new Map(dbExercises?.map((e: any) => [e.name, e.id]));

            const mappedExercises = result.exercises.map((ex: any) => {
                const exId = dbExMap.get(ex.name);
                return {
                    exerciseId: exId,
                    name: ex.name,
                    sets: Number(ex.sets),
                    reps: ex.reps,
                    notes: '',
                    weight: 0,
                    durationSeconds: 0,
                    restSeconds: 0,
                    intensity: ''
                };
            }).filter((e: any) => e.exerciseId);

            setExercises(mappedExercises);
            setActiveTab('create');
            toast({ title: 'Treino gerado com sucesso!' });

        } catch (error) {
            console.error(error);
            toast({ title: 'Erro na geração', description: 'Tente novamente.', variant: 'destructive' });
        } finally {
            setGenerating(false);
        }
    };

    const handleSaveWorkout = async () => {
        if (!title || exercises.length === 0 || !studentId || !organizationId) {
            toast({ title: 'Dados incompletos', description: 'Verifique título e exercícios.', variant: 'destructive' });
            return;
        }

        setLoading(true);
        try {
            if (!authUser) throw new Error('No user');

            const payload = {
                title,
                goal,
                studentId,
                exercises,
                organizationId,
                userId: authUser.id
            };

            const result = await saveGeneratedWorkout(payload);

            if (result.success) {
                toast({ title: 'Treino salvo!' });
                onSuccess?.();
                onOpenChange(false);
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const addExercise = () => {
        setExercises([...exercises, { exerciseId: '', name: '', sets: 3, reps: '10' }]);
    };

    const updateExercise = (index: number, field: string, value: any) => {
        const newEx = [...exercises];
        newEx[index] = { ...newEx[index], [field]: value };
        setExercises(newEx);
    };

    const removeExercise = (index: number) => {
        const newEx = [...exercises];
        newEx.splice(index, 1);
        setExercises(newEx);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[640px] p-0 overflow-hidden border-none shadow-2xl bg-white rounded-3xl">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-50">
                    <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Dumbbell className="h-5 w-5 text-bee-amber" />
                        Novo Treino
                    </DialogTitle>
                    <DialogDescription className="text-slate-500">
                        Personalize o plano de treinamento para o seu aluno.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-8 rounded-lg px-4 text-xs font-medium transition-all",
                                activeTab === 'create' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
                            )}
                            onClick={() => setActiveTab('create')}
                        >
                            Editor Manual
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-8 rounded-lg px-4 text-xs font-medium transition-all gap-2",
                                activeTab === 'ai' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
                            )}
                            onClick={() => setActiveTab('ai')}
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            Gerar com IA
                        </Button>
                    </div>

                    {activeTab === 'ai' ? (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Objetivo do Treino</Label>
                                <Textarea
                                    placeholder="Ex: Treino de pernas com foco em força..."
                                    value={aiObjective}
                                    onChange={e => setAiObjective(e.target.value)}
                                    className={cn(fieldCls, "min-h-[100px] py-2")}
                                />
                            </div>
                            <Button
                                onClick={handleGenerateAi}
                                disabled={generating}
                                className="w-full h-10 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-sm transition-all"
                            >
                                {generating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Gerando...</> : 'Gerar Sugestão Inteligente'}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className={labelCls}>Nome do Treino</Label>
                                    <Input 
                                        value={title} 
                                        onChange={e => setTitle(e.target.value)} 
                                        placeholder="Ex: Treino A" 
                                        className={fieldCls} 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className={labelCls}>Meta/Foco</Label>
                                    <Input 
                                        value={goal} 
                                        onChange={e => setGoal(e.target.value)} 
                                        placeholder="Ex: Hipertrofia" 
                                        className={fieldCls} 
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <Label className={labelCls}>Exercícios ({exercises.length})</Label>
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={addExercise}
                                        className="h-8 rounded-lg border-slate-200 text-slate-600 font-medium text-xs bg-white hover:bg-slate-50"
                                    >
                                        <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
                                    </Button>
                                </div>

                                <div className="space-y-3 border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                                    {exercises.map((ex, i) => (
                                        <div key={i} className="grid grid-cols-12 gap-2 items-end border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                                            <div className="col-span-5">
                                                <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 block">Exercício</Label>
                                                <ExerciseSearch
                                                    value={ex.name || ''}
                                                    onChange={(id, name) => {
                                                        updateExercise(i, 'name', name);
                                                        updateExercise(i, 'exerciseId', id);
                                                    }}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 block">Sets</Label>
                                                <Input
                                                    type="number"
                                                    value={ex.sets}
                                                    onChange={e => updateExercise(i, 'sets', Number(e.target.value))}
                                                    className={fieldCls}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 block">Reps</Label>
                                                <Input
                                                    value={ex.reps}
                                                    onChange={e => updateExercise(i, 'reps', e.target.value)}
                                                    className={fieldCls}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 block">Notas</Label>
                                                <Input
                                                    value={ex.notes || ''}
                                                    onChange={e => updateExercise(i, 'notes', e.target.value)}
                                                    className={fieldCls}
                                                />
                                            </div>
                                            <div className="col-span-1">
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-9 w-9 text-slate-300 hover:text-red-500 transition-colors" 
                                                    onClick={() => removeExercise(i)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {exercises.length === 0 && (
                                        <p className="text-center text-xs text-slate-400 py-6">Nenhum exercício adicionado.</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className={labelCls}>Observações Gerais</Label>
                                <Textarea 
                                    value={notes} 
                                    onChange={e => setNotes(e.target.value)} 
                                    className={cn(fieldCls, "min-h-[80px] py-2")}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="px-6 pb-6 pt-4 border-t border-slate-50 flex items-center justify-between sm:justify-between">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="rounded-full text-slate-500 hover:text-slate-700 h-9 px-5"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSaveWorkout}
                        disabled={loading}
                        className="bg-bee-amber hover:bg-amber-500 text-bee-midnight rounded-full font-bold h-9 px-8 shadow-sm"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Finalizar Treino'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
