'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ClipboardList, Loader2, Save, X } from 'lucide-react';

interface MedicalRecordModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    studentId: string;
    existingData?: any;
    onSuccess?: () => void;
}

export function MedicalRecordModal({ open, onOpenChange, studentId, existingData, onSuccess }: MedicalRecordModalProps) {
    const supabase = createClient();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        characteristics: '',
        disabilities: '',
        difficulties: '',
        other_notes: ''
    });

    useEffect(() => {
        if (existingData) {
            setFormData({
                characteristics: existingData.characteristics || '',
                disabilities: existingData.disabilities || '',
                difficulties: existingData.difficulties || '',
                other_notes: existingData.other_notes || ''
            });
        }
    }, [existingData, open]);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            // Try to find if record exists
            const { data: existing } = await (supabase.from('student_medical_records' as any) as any)
                .select('id')
                .eq('student_id', studentId)
                .maybeSingle();

            const payload = {
                ...formData,
                student_id: studentId,
                updated_at: new Date().toISOString()
            };

            let error;
            if (existing) {
                const { error: updateError } = await (supabase.from('student_medical_records' as any) as any)
                    .update(payload)
                    .eq('id', existing.id);
                error = updateError;
            } else {
                const { error: insertError } = await (supabase.from('student_medical_records' as any) as any)
                    .insert(payload);
                error = insertError;
            }

            if (error) throw error;

            toast({ title: "Ficha médica atualizada!" });
            if (onSuccess) onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
            toast({ title: "Erro ao salvar", description: "Verifique se a tabela foi criada no banco de dados.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[600px] flex flex-col h-full overflow-y-auto">
                <SheetHeader className="space-y-3 pb-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <ClipboardList className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <SheetTitle className="text-xl">Ficha do Aluno</SheetTitle>
                            <SheetDescription>Informações físicas, restrições e cuidados especiais.</SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 py-6 space-y-6">
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700">Características Físicas</Label>
                        <Textarea
                            placeholder="Ex: Biotipo, postura, histórico esportivo..."
                            className="min-h-[80px] resize-none"
                            value={formData.characteristics}
                            onChange={(e) => setFormData(prev => ({ ...prev, characteristics: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700">Deficiências ou Patologias</Label>
                        <Textarea
                            placeholder="Ex: Problemas cardíacos, diabetes, asma, deficiências físicas..."
                            className="min-h-[80px] resize-none"
                            value={formData.disabilities}
                            onChange={(e) => setFormData(prev => ({ ...prev, disabilities: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700">Dificuldades ou Lesões</Label>
                        <Textarea
                            placeholder="Ex: Dor crônica no joelho, hérnia de disco, falta de flexibilidade..."
                            className="min-h-[80px] resize-none"
                            value={formData.difficulties}
                            onChange={(e) => setFormData(prev => ({ ...prev, difficulties: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700">Outras Observações</Label>
                        <Textarea
                            placeholder="Informações adicionais relevantes..."
                            className="min-h-[80px] resize-none"
                            value={formData.other_notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, other_notes: e.target.value }))}
                        />
                    </div>
                </div>

                <SheetFooter className="mt-auto border-t pt-4 flex gap-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 gap-2">
                        <X className="h-4 w-4" />
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Salvar Ficha
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
