'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Ruler, Loader2, Save, X } from 'lucide-react';

interface CreateMeasurementModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    studentId: string;
    onSuccess?: () => void;
}

export function CreateMeasurementModal({ open, onOpenChange, studentId, onSuccess }: CreateMeasurementModalProps) {
    const supabase = createClient();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [bodyFat, setBodyFat] = useState('');

    const handleSubmit = async () => {
        if (!date || !weight) {
            toast({ title: "Campos obrigatórios", description: "Por favor, preencha a data e o peso.", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const weightVal = parseFloat(weight);
            const heightVal = height ? parseFloat(height) : null;
            const bodyFatVal = bodyFat ? parseFloat(bodyFat) : null;

            // Calculate BMI
            let bmiVal = null;
            if (weightVal && heightVal && heightVal > 0) {
                bmiVal = weightVal / (heightVal * heightVal);
                // Limit to 2 decimal places if needed (DB might handle it but it's cleaner)
                bmiVal = Math.round(bmiVal * 100) / 100;
            }

            // Fetch current user and organization_id
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const { data: profile } = await (supabase as any)
                .from('profiles')
                .select('organization_id')
                .eq('id', user.id)
                .single();

            if (!profile?.organization_id) throw new Error("Organização não encontrada para o usuário");

            const { error } = await (supabase as any)
                .from('student_measurements' as any)
                .insert({
                    student_id: studentId,
                    organization_id: (profile as any).organization_id,
                    recorded_at: date, // Using the date string YYYY-MM-DD
                    weight: weightVal,
                    height: heightVal,
                    body_fat: bodyFatVal,
                    bmi: bmiVal,
                } as any);

            if (error) throw error;

            toast({ title: "Avaliação salva com sucesso!" });
            if (onSuccess) onSuccess();
            onOpenChange(false);
            setWeight(''); setHeight(''); setBodyFat('');
        } catch (error: any) {
            console.error(error);
            toast({ title: "Erro ao salvar", description: error.message || "Tente novamente.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[600px] flex flex-col h-full overflow-y-auto">
                <SheetHeader className="space-y-3 pb-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                            <Ruler className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                            <SheetTitle className="text-xl">Nova Avaliação Física</SheetTitle>
                            <SheetDescription>Registre as medidas atuais do aluno.</SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 py-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">Data da Avaliação</Label>
                            <Input id="eff-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">Peso (kg) *</Label>
                            <Input id="weight" type="number" step="0.1" placeholder="ex: 75.5" value={weight} onChange={(e) => setWeight(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">Altura (m)</Label>
                            <Input id="height" type="number" step="0.01" placeholder="ex: 1.75" value={height} onChange={(e) => setHeight(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">% Gordura</Label>
                            <Input id="bodyFat" type="number" step="0.1" placeholder="ex: 18.5" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} />
                        </div>
                    </div>
                </div>

                <SheetFooter className="mt-auto border-t pt-4 flex gap-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 gap-2">
                        <X className="h-4 w-4" />
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold gap-2">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Salvar
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
