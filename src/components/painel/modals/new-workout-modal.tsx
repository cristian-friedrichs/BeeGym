import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, Plus, Trash2, Dumbbell, X, Check } from 'lucide-react';
import { saveGeneratedWorkout } from '@/actions/treinos';
import { generateWorkout } from '@/ai/flows/generate-workout';
import { ExerciseSearch } from '@/components/treinos/exercise-search';

interface NewWorkoutModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

interface Student {
    id: string;
    full_name: string;
    avatar_url: string | null;
}

interface Instructor {
    id: string;
    full_name: string;
    avatar_url: string | null;
}

const DURATION_OPTIONS = [
    { value: '30', label: '30 minutos' },
    { value: '60', label: '1 hora' },
    { value: '90', label: '1 hora e 30 minutos' },
    { value: '120', label: '2 horas' },
];

const TIME_SLOTS = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
];

export function NewWorkoutModal({ open, onOpenChange, onSuccess, studentId }: NewWorkoutModalProps & { studentId?: string }) {
    const { toast } = useToast();
    const supabase = createClient();

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

    // Config
    const [organizationId, setOrganizationId] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            fetchInitialData();
        }
    }, [open]);

    async function fetchInitialData() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await (supabase as any)
                .from('profiles')
                .select('organization_id')
                .eq('id', user.id)
                .single();

            if (profile) setOrganizationId((profile as any).organization_id);

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
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user');

            const payload = {
                title,
                goal,
                studentId,
                exercises,
                organizationId,
                userId: user.id
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
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[640px] flex flex-col h-full overflow-y-auto p-0 gap-0">
                <SheetHeader className="p-8 border-b relative overflow-hidden shrink-0 bg-white/50 backdrop-blur-sm">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-bee-amber/[0.03] rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-bee-amber/[0.05] rounded-full -mr-16 -mt-16 blur-2xl opacity-50" />
                    <div className="flex items-center gap-5 relative text-left">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-bee-amber/20 via-bee-amber/10 to-transparent border border-bee-amber/20 shadow-inner group transition-all">
                            <Dumbbell className="h-8 w-8 text-bee-amber drop-shadow-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <SheetTitle className="text-2xl font-black font-display tracking-tight text-bee-midnight">
                                Novo Treino
                            </SheetTitle>
                            <SheetDescription className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-bee-amber animate-pulse" />
                                Crie ou gere um treino com IA
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 p-6 pt-0 overflow-y-auto">
                    <div className="flex gap-2 mb-4">
                        <Button
                            variant={activeTab === 'create' ? 'default' : 'outline'}
                            onClick={() => setActiveTab('create')}
                        >
                            Editor Manual
                        </Button>
                        <Button
                            variant={activeTab === 'ai' ? 'default' : 'outline'}
                            onClick={() => setActiveTab('ai')}
                            className="gap-2"
                        >
                            <Sparkles className="w-4 h-4" />
                            Gerar com IA
                        </Button>
                    </div>

                    {activeTab === 'ai' ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Objetivo do Treino</Label>
                                <Textarea
                                    placeholder="Ex: Treino de pernas com foco em força..."
                                    value={aiObjective}
                                    onChange={e => setAiObjective(e.target.value)}
                                />
                            </div>
                            <Button
                                onClick={handleGenerateAi}
                                disabled={generating}
                                className="w-full"
                            >
                                {generating ? 'Gerando...' : 'Gerar Sugestão'}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nome do Treino</Label>
                                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Treino A" className="h-11" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Meta/Foco</Label>
                                    <Input value={goal} onChange={e => setGoal(e.target.value)} placeholder="Ex: Hipertrofia" className="h-11" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label>Exercícios ({exercises.length})</Label>
                                    <Button size="sm" variant="outline" onClick={addExercise}><Plus className="w-4 h-4 mr-2" /> Adicionar</Button>
                                </div>

                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 border rounded-md p-2">
                                    {exercises.map((ex, i) => (
                                        <div key={i} className="grid grid-cols-12 gap-2 items-end border-b pb-2 last:border-0">
                                            <div className="col-span-4">
                                                <Label className="text-xs">Exercício</Label>
                                                <ExerciseSearch
                                                    value={ex.name || ''}
                                                    onChange={(id, name) => {
                                                        updateExercise(i, 'name', name);
                                                        updateExercise(i, 'exerciseId', id);
                                                    }}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <Label className="text-xs">Séries</Label>
                                                <Input
                                                    type="number"
                                                    value={ex.sets}
                                                    onChange={e => updateExercise(i, 'sets', Number(e.target.value))}
                                                    className="h-11 text-sm"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <Label className="text-xs">Reps</Label>
                                                <Input
                                                    value={ex.reps}
                                                    onChange={e => updateExercise(i, 'reps', e.target.value)}
                                                    className="h-11 text-sm"
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <Label className="text-xs">Notas</Label>
                                                <Input
                                                    value={ex.notes || ''}
                                                    onChange={e => updateExercise(i, 'notes', e.target.value)}
                                                    className="h-11 text-sm"
                                                />
                                            </div>
                                            <div className="col-span-1">
                                                <Button size="icon" variant="ghost" className="h-10 w-10 text-red-500" onClick={() => removeExercise(i)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {exercises.length === 0 && (
                                        <p className="text-center text-sm text-muted-foreground py-4">Nenhum exercício adicionado.</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Observações Gerais</Label>
                                <Textarea value={notes} onChange={e => setNotes(e.target.value)} />
                            </div>
                        </div>
                    )}
                </div>

                <SheetFooter className="p-6 pt-4 border-t gap-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="gap-2 h-10">
                        <X className="h-4 w-4" /> Cancelar
                    </Button>
                    <Button onClick={handleSaveWorkout} disabled={loading} className="gap-2 h-10">
                        <Check className="h-4 w-4" /> {loading ? 'Salvando...' : 'Salvar Treino'}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
