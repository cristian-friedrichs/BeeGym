'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ExerciseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    exerciseToEdit?: any;
}

const fieldCls = 'h-9 rounded-xl border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:border-bee-amber focus:ring-2 focus:ring-bee-amber/20 focus:ring-offset-0';
const labelCls = 'text-sm font-medium text-slate-700';

export function ExerciseModal({ isOpen, onClose, onSuccess, exerciseToEdit }: ExerciseModalProps) {
    const supabase = createClient();
    const { organizationId } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        category: 'Musculação',
        target_muscle: '',
        tags: '',
        difficulty: 'Iniciante'
    });

    useEffect(() => {
        if (exerciseToEdit) {
            setFormData({
                name: exerciseToEdit.name || '',
                category: exerciseToEdit.category || 'Musculação',
                target_muscle: exerciseToEdit.target_muscle || '',
                tags: exerciseToEdit.tags ? exerciseToEdit.tags.join(', ') : '',
                difficulty: exerciseToEdit.difficulty || 'Iniciante'
            });
        } else {
            setFormData({ name: '', category: 'Musculação', target_muscle: '', tags: '', difficulty: 'Iniciante' });
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
        if (!organizationId) {
            toast({ title: 'Aguarde', description: 'Organização ainda carregando. Tente novamente.', variant: 'destructive' });
            return;
        }

        setLoading(true);

        // Timeout protection — prevents the UI from getting stuck if the request hangs
        const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('A operação demorou demais. Verifique sua conexão.')), 12000)
        );

        try {
            const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);

            const payload = {
                organization_id: organizationId,
                name: formData.name.trim(),
                category: formData.category,
                target_muscle: formData.target_muscle.trim(),
                tags: tagsArray,
                difficulty: formData.difficulty,
            };

            if (exerciseToEdit) {
                const { error } = await Promise.race([
                    (supabase as any).from('exercises').update(payload).eq('id', exerciseToEdit.id),
                    timeout,
                ]);
                if (error) throw error;
                toast({ title: 'Exercício atualizado!' });
            } else {
                const { error } = await Promise.race([
                    (supabase as any).from('exercises').insert(payload),
                    timeout,
                ]);
                if (error) throw error;
                toast({ title: 'Exercício criado!' });
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('[ExerciseModal] Erro ao salvar:', error);
            toast({ title: 'Erro ao salvar', description: error.message || 'Tente novamente.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[520px] p-0 gap-0 rounded-2xl overflow-hidden">

                {/* Header */}
                <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100">
                    <DialogTitle className="text-[17px] font-semibold text-slate-900 leading-tight">
                        {exerciseToEdit ? 'Editar Exercício' : 'Novo Exercício'}
                    </DialogTitle>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {exerciseToEdit ? 'Atualize as informações do exercício.' : 'Cadastre um novo exercício na biblioteca.'}
                    </p>
                </DialogHeader>

                {/* Body */}
                <form id="exercise-form" onSubmit={handleSubmit}>
                    <div className="px-6 py-5 space-y-4">

                        <div className="space-y-1.5">
                            <Label className={labelCls}>Nome do exercício *</Label>
                            <Input
                                required
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className={fieldCls}
                                placeholder="Ex: Supino Reto"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Categoria</Label>
                                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                                    <SelectTrigger className={fieldCls}>
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
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Grupo muscular *</Label>
                                <Input
                                    required
                                    type="text"
                                    value={formData.target_muscle}
                                    onChange={e => setFormData({ ...formData, target_muscle: e.target.value })}
                                    className={fieldCls}
                                    placeholder="Ex: Peito, Costas…"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Dificuldade</Label>
                                <Select value={formData.difficulty} onValueChange={(v) => setFormData({ ...formData, difficulty: v })}>
                                    <SelectTrigger className={fieldCls}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Iniciante">Iniciante</SelectItem>
                                        <SelectItem value="Intermediário">Intermediário</SelectItem>
                                        <SelectItem value="Avançado">Avançado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Etiquetas</Label>
                                <Input
                                    type="text"
                                    value={formData.tags}
                                    onChange={e => setFormData({ ...formData, tags: e.target.value })}
                                    className={fieldCls}
                                    placeholder="Ex: solo, barra…"
                                />
                            </div>
                        </div>

                    </div>
                </form>

                {/* Footer */}
                <div className="px-6 pb-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="h-9 rounded-full px-5 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-700 text-sm font-medium"
                    >
                        Cancelar
                    </Button>
                    <Button
                        form="exercise-form"
                        type="submit"
                        disabled={loading}
                        className="h-9 rounded-full px-6 bg-bee-amber hover:bg-amber-500 text-bee-midnight font-semibold text-sm shadow-sm"
                    >
                        {loading ? (
                            <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Salvando…</>
                        ) : (
                            exerciseToEdit ? 'Salvar alterações' : 'Criar exercício'
                        )}
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
}
