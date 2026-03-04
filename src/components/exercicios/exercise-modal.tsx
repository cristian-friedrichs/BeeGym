'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Dumbbell, Check, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ExerciseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    exerciseToEdit?: any;
}

export function ExerciseModal({ isOpen, onClose, onSuccess, exerciseToEdit }: ExerciseModalProps) {
    const supabase = createClient();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        category: 'Musculação',
        target_muscle: 'Peito',
        tags: '',
        difficulty: 'Iniciante'
    });

    useEffect(() => {
        if (exerciseToEdit) {
            setFormData({
                name: exerciseToEdit.name || '',
                category: exerciseToEdit.category || 'Musculação',
                target_muscle: exerciseToEdit.target_muscle || 'Peito',
                tags: exerciseToEdit.tags ? exerciseToEdit.tags.join(', ') : '',
                difficulty: exerciseToEdit.difficulty || 'Iniciante'
            });
        } else {
            setFormData({ name: '', category: 'Musculação', target_muscle: 'Peito', tags: '', difficulty: 'Iniciante' });
        }
    }, [exerciseToEdit, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: profile } = await (supabase.from('profiles') as any).select('organization_id').eq('id', user?.id).single();

            const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

            const payload = {
                organization_id: profile?.organization_id,
                name: formData.name,
                category: formData.category,
                target_muscle: formData.target_muscle,
                tags: tagsArray,
                difficulty: formData.difficulty
            };

            if (exerciseToEdit) {
                const { error } = await (supabase.from('exercises') as any).update(payload).eq('id', exerciseToEdit.id);
                if (error) throw error;
                toast({ title: 'Exercício atualizado!' });
            } else {
                const { error } = await (supabase.from('exercises') as any).insert([payload]);
                if (error) throw error;
                toast({ title: 'Exercício criado com sucesso!' });
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="sm:max-w-md flex flex-col h-full p-0 gap-0">
                <SheetHeader className="p-6 pb-4">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 shadow-sm border border-orange-200">
                            <Dumbbell className="h-6 w-6" />
                        </div>
                        <div>
                            <SheetTitle className="text-xl font-bold">
                                {exerciseToEdit ? 'Editar Exercício' : 'Novo Exercício'}
                            </SheetTitle>
                            <SheetDescription>
                                {exerciseToEdit ? 'Atualize as informações do exercício.' : 'Cadastre um novo exercício na biblioteca.'}
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 p-6 space-y-6 overflow-y-auto pt-4">
                    <form id="exercise-form" onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Nome do Exercício</Label>
                            <Input
                                required
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="h-11 rounded-xl border-slate-200 focus:ring-orange-500"
                                placeholder="Ex: Supino Reto"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tipo / Categoria</Label>
                                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                                    <SelectTrigger className="h-11 rounded-xl border-slate-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Musculação">Musculação</SelectItem>
                                        <SelectItem value="Crossfit">Crossfit</SelectItem>
                                        <SelectItem value="Cardio">Cardio</SelectItem>
                                        <SelectItem value="Mobilidade">Mobilidade</SelectItem>
                                        <SelectItem value="Livre">Livre</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Grupo Muscular</Label>
                                <Input
                                    required
                                    type="text"
                                    value={formData.target_muscle}
                                    onChange={e => setFormData({ ...formData, target_muscle: e.target.value })}
                                    className="h-11 rounded-xl border-slate-200 focus:ring-orange-500"
                                    placeholder="Ex: Peito, Costas..."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Dificuldade</Label>
                                <Select value={formData.difficulty} onValueChange={(v) => setFormData({ ...formData, difficulty: v })}>
                                    <SelectTrigger className="h-11 rounded-xl border-slate-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Iniciante">Iniciante</SelectItem>
                                        <SelectItem value="Intermediário">Intermediário</SelectItem>
                                        <SelectItem value="Avançado">Avançado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Etiquetas</Label>
                                <Input
                                    type="text"
                                    value={formData.tags}
                                    onChange={e => setFormData({ ...formData, tags: e.target.value })}
                                    className="h-11 rounded-xl border-slate-200 focus:ring-orange-500"
                                    placeholder="Ex: solo, barra..."
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <SheetFooter className="p-6 border-t bg-slate-50/50 flex items-center gap-3 sm:justify-between">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1 h-11 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition whitespace-nowrap"
                    >
                        <X className="w-4 h-4 mr-2" /> Cancelar
                    </Button>
                    <Button
                        form="exercise-form"
                        type="submit"
                        disabled={loading}
                        className="flex-[2] h-11 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <span className="flex items-center gap-2">
                                <Check className="w-5 h-5" /> {exerciseToEdit ? 'Atualizar' : 'Criar Exercício'}
                            </span>
                        )}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
