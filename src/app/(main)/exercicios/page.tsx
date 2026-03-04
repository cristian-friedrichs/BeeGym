'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ExerciseModal } from '@/components/exercicios/exercise-modal';
import { exercises as staticExercises } from '@/lib/exercises';
import { Dumbbell, Pencil, Trash2, Loader2, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ExerciciosPage() {
    const supabase = createClient();
    const { toast } = useToast();

    const [activeTab, setActiveTab] = useState<'meus' | 'base'>('meus');
    const [exercises, setExercises] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [exerciseToEdit, setExerciseToEdit] = useState<any>(null);

    const [counts, setCounts] = useState({ meus: 0, base: 0 });

    useEffect(() => {
        fetchExercises();
    }, [activeTab]);

    const fetchExercises = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: profile } = await (supabase.from('profiles') as any).select('organization_id').eq('id', user?.id).single();

            // 1. Busca contagens
            const { count: countMeus } = await (supabase.from('exercises') as any).select('*', { count: 'exact', head: true }).eq('organization_id', profile?.organization_id);
            const baseList = staticExercises.filter(ex => ex.type === 'base');
            setCounts({ base: baseList.length, meus: countMeus || 0 });

            // 2. Busca exercícios da aba ativa
            if (activeTab === 'base') {
                const mappedBase = baseList.map(ex => {
                    const tags = ex.tags;
                    let category = 'Musculação';
                    if (tags.includes('Crossfit')) category = 'Crossfit';
                    else if (tags.includes('Aerobico') || tags.includes('Cardio')) category = 'Cardio';
                    else if (tags.includes('Yoga') || tags.includes('Mobilidade')) category = 'Mobilidade';
                    else if (tags.includes('Livre')) category = 'Livre';

                    let difficulty = 'Iniciante';
                    if (tags.includes('Iniciante') || tags.includes('Intermediário') || tags.includes('Avançado')) {
                        difficulty = tags.find(t => ['Iniciante', 'Intermediário', 'Avançado'].includes(t)) || 'Iniciante';
                    }

                    return {
                        id: `static-${ex.name}`,
                        name: ex.name,
                        category,
                        target_muscle: ex.description,
                        difficulty,
                        tags,
                        organization_id: null,
                        is_static: true
                    };
                });
                setExercises(mappedBase);
            } else {
                const { data, error } = await (supabase.from('exercises') as any).select('*').eq('organization_id', profile?.organization_id).order('name', { ascending: true });
                if (error) throw error;
                if (data) setExercises(data);
            }

        } catch (error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };


    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este exercício?')) return;
        try {
            const { error } = await (supabase.from('exercises') as any).delete().eq('id', id);
            if (error) throw error;
            toast({ title: 'Exercício excluído.' });
            fetchExercises();
        } catch (error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        }
    };

    const filteredExercises = exercises.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-deep-midnight font-display">Biblioteca de Exercícios</h1>
                    <p className="text-muted-foreground font-sans">Gerencie seus exercícios e use a base global.</p>
                </div>
                <Button
                    className="font-bold shadow-sm bg-bee-orange hover:bg-orange-600 text-white rounded-[8px] font-display uppercase tracking-wider text-xs"
                    onClick={() => { setExerciseToEdit(null); setIsModalOpen(true); }}
                >
                    <Plus className="w-4 h-4 mr-2" /> Adicionar Exercício
                </Button>
            </div>

            <div className="bg-white rounded-[8px] border border-slate-100 shadow-sm overflow-hidden">
                {/* Busca + Abas */}
                <div className="p-4 border-b border-slate-100">
                    <div className="relative mb-4">
                        <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Buscar por nome..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-slate-50 border-slate-200 rounded-[8px] font-sans"
                        />
                    </div>

                    {/* Abas */}
                    <div className="flex gap-6 border-b border-slate-100">
                        <button
                            onClick={() => setActiveTab('meus')}
                            className={`pb-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'meus' ? 'border-bee-orange text-bee-orange' : 'border-transparent text-muted-foreground hover:text-slate-600'}`}
                        >
                            Meus Exercícios ({counts.meus})
                        </button>
                        <button
                            onClick={() => setActiveTab('base')}
                            className={`pb-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'base' ? 'border-bee-orange text-bee-orange' : 'border-transparent text-muted-foreground hover:text-slate-600'}`}
                        >
                            Base de Exercícios ({counts.base})
                        </button>
                    </div>
                </div>

                {/* Lista */}
                <div className="p-4">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-8 h-8 animate-spin text-bee-orange" />
                        </div>
                    ) : filteredExercises.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground font-sans">Nenhum exercício encontrado nesta aba.</div>
                    ) : (
                        <div className="space-y-3">
                            {filteredExercises.map(ex => (
                                <div key={ex.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-lg hover:shadow-md hover:border-orange-100 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-orange-50 text-bee-orange rounded-lg flex items-center justify-center shrink-0">
                                            <Dumbbell className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 font-sans">{ex.name}</h4>
                                            <p className="text-sm text-muted-foreground font-sans">{ex.target_muscle} {ex.tags && ex.tags.length > 0 && `• ${ex.tags.join(', ')}`}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="hidden md:flex flex-col items-end gap-1 text-xs font-bold uppercase tracking-wider">
                                            <div className="flex gap-2">
                                                <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md">{ex.category}</span>
                                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{ex.difficulty}</span>
                                            </div>
                                        </div>
                                        {/* Ações (Apenas em Meus Exercícios) */}
                                        {activeTab === 'meus' && (
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-bee-orange hover:bg-orange-50"
                                                    onClick={() => { setExerciseToEdit(ex); setIsModalOpen(true); }}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-destructive hover:bg-red-50"
                                                    onClick={() => handleDelete(ex.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <ExerciseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchExercises} exerciseToEdit={exerciseToEdit} />
        </div>
    );
}
