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
import { Badge } from '@/components/ui/badge';
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

        if (!formData.name.trim() || formData.name.trim().length < 2) {
            toast({ title: 'Nome inválido', description: 'O nome deve ter pelo menos 2 caracteres.', variant: 'destructive' });
            return;
        }
        if (!formData.target_muscle.trim()) {
            toast({ title: 'Grupo muscular obrigatório', description: 'Informe o grupo muscular alvo.', variant: 'destructive' });
            return;
        }

        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');
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
            <SheetContent side="right" className="sm:max-w-xl p-0 overflow-hidden border-l border-slate-100 shadow-2xl flex flex-col h-full bg-white">
                <SheetHeader className="p-6 border-b border-slate-50 bg-white shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="h-12 w-12 rounded-xl bg-bee-amber/10 flex items-center justify-center border border-bee-amber/20">
                            <Dumbbell className="h-6 w-6 text-bee-amber" />
                        </div>
                        <div className="text-left">
                            <div className="flex items-center gap-2 mb-0.5">
                                <SheetTitle className="text-xl font-bold tracking-tight text-bee-midnight uppercase">
                                    {exerciseToEdit ? 'Editar Exercício' : 'Novo Exercício'}
                                </SheetTitle>
                                <Badge className="bg-bee-amber text-bee-midnight border-none font-black uppercase text-[10px] tracking-tight h-5 px-2 rounded-full">
                                    Biblioteca
                                </Badge>
                            </div>
                            <SheetDescription className="text-slate-400 font-medium text-xs">
                                {exerciseToEdit ? 'Atualize as informações do exercício.' : 'Cadastre um novo exercício na biblioteca.'}
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <form id="exercise-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome do Exercício</Label>
                            <Input
                                required
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="h-11 rounded-2xl border-slate-100 bg-slate-50/50 transition-all font-semibold text-bee-midnight px-5 focus:ring-bee-amber/20"
                                placeholder="Ex: Supino Reto"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tipo / Categoria</Label>
                                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                                    <SelectTrigger className="h-11 rounded-2xl border-slate-100 bg-slate-50/50 transition-all font-semibold text-bee-midnight px-5 focus:ring-bee-amber/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                                        <SelectItem value="Musculação" className="py-3 focus:bg-bee-amber/10 rounded-xl mx-1 my-0.5 font-medium">Musculação</SelectItem>
                                        <SelectItem value="Crossfit" className="py-3 focus:bg-bee-amber/10 rounded-xl mx-1 my-0.5 font-medium">Crossfit</SelectItem>
                                        <SelectItem value="Cardio" className="py-3 focus:bg-bee-amber/10 rounded-xl mx-1 my-0.5 font-medium">Cardio</SelectItem>
                                        <SelectItem value="Mobilidade" className="py-3 focus:bg-bee-amber/10 rounded-xl mx-1 my-0.5 font-medium">Mobilidade</SelectItem>
                                        <SelectItem value="Livre" className="py-3 focus:bg-bee-amber/10 rounded-xl mx-1 my-0.5 font-medium">Livre</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Grupo Muscular</Label>
                                <Input
                                    required
                                    type="text"
                                    value={formData.target_muscle}
                                    onChange={e => setFormData({ ...formData, target_muscle: e.target.value })}
                                    className="h-11 rounded-2xl border-slate-100 bg-slate-50/50 transition-all font-semibold text-bee-midnight px-5 focus:ring-bee-amber/20"
                                    placeholder="Ex: Peito, Costas..."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Dificuldade</Label>
                                <Select value={formData.difficulty} onValueChange={(v) => setFormData({ ...formData, difficulty: v })}>
                                    <SelectTrigger className="h-11 rounded-2xl border-slate-100 bg-slate-50/50 transition-all font-semibold text-bee-midnight px-5 focus:ring-bee-amber/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                                        <SelectItem value="Iniciante" className="py-3 focus:bg-bee-amber/10 rounded-xl mx-1 my-0.5 font-medium">Iniciante</SelectItem>
                                        <SelectItem value="Intermediário" className="py-3 focus:bg-bee-amber/10 rounded-xl mx-1 my-0.5 font-medium">Intermediário</SelectItem>
                                        <SelectItem value="Avançado" className="py-3 focus:bg-bee-amber/10 rounded-xl mx-1 my-0.5 font-medium">Avançado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Etiquetas</Label>
                                <Input
                                    type="text"
                                    value={formData.tags}
                                    onChange={e => setFormData({ ...formData, tags: e.target.value })}
                                    className="h-11 rounded-2xl border-slate-100 bg-slate-50/50 transition-all font-semibold text-bee-midnight px-5 focus:ring-bee-amber/20"
                                    placeholder="Ex: solo, barra..."
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <SheetFooter className="p-8 border-t bg-white flex items-center gap-3 shrink-0 sm:justify-end sticky bottom-0 z-30">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1 sm:flex-none text-slate-400 hover:text-slate-600 hover:bg-slate-50 font-black h-10 rounded-full uppercase text-[10px] tracking-widest transition-all"
                    >
                        <X className="w-4 h-4 mr-2" /> Cancelar
                    </Button>
                    <Button
                        form="exercise-form"
                        type="submit"
                        disabled={loading}
                        className="flex-1 sm:flex-none bg-bee-amber hover:bg-amber-500 text-bee-midnight font-black h-10 rounded-full shadow-lg shadow-bee-amber/10 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-[10px] px-10"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processando...
                            </>
                        ) : (
                            <>
                                <Check className="mr-2 h-4 w-4 stroke-[3px]" />
                                {exerciseToEdit ? 'Salvar Alterações' : 'Criar Exercício'}
                            </>
                        )}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
