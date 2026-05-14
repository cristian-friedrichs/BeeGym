'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Ruler, Loader2, Check } from 'lucide-react';
import { format } from 'date-fns';

interface CreateMeasurementModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    studentId: string;
    onSuccess?: () => void;
}

export function CreateMeasurementModal({ open, onOpenChange, studentId, onSuccess }: CreateMeasurementModalProps) {
    const supabase = createClient();
    const { organizationId } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [bodyFat, setBodyFat] = useState('');

    const reset = () => { setWeight(''); setHeight(''); setBodyFat(''); setDate(format(new Date(), 'yyyy-MM-dd')); };

    const handleSubmit = async () => {
        if (!date || !weight) {
            toast({ title: "Preencha a data e o peso.", variant: "destructive" }); return;
        }
        const weightVal = parseFloat(weight);
        if (isNaN(weightVal) || weightVal <= 0 || weightVal > 500) {
            toast({ title: "Peso inválido", description: "Entre 1 e 500 kg.", variant: "destructive" }); return;
        }
        const heightVal = height ? parseFloat(height) : null;
        if (heightVal !== null && (isNaN(heightVal) || heightVal < 0.3 || heightVal > 3.0)) {
            toast({ title: "Altura inválida", description: "Entre 0,30 m e 3,00 m.", variant: "destructive" }); return;
        }
        const bodyFatVal = bodyFat ? parseFloat(bodyFat) : null;

        setLoading(true);
        try {
            if (!organizationId) throw new Error("Organização não encontrada");
            let bmi = null;
            if (weightVal && heightVal) bmi = Math.round((weightVal / (heightVal * heightVal)) * 100) / 100;

            const { error } = await (supabase as any).from('student_measurements').insert({
                student_id: studentId, organization_id: organizationId,
                recorded_at: date, weight: weightVal, height: heightVal, body_fat: bodyFatVal, bmi,
            });
            if (error) throw error;

            toast({ title: "Avaliação salva!" });
            reset();
            onSuccess?.();
            onOpenChange(false);
        } catch (e: any) {
            toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
        } finally { setLoading(false); }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[440px] p-0 gap-0 rounded-2xl overflow-hidden bg-white border border-slate-100">
                <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <Ruler className="h-4.5 w-4.5 text-emerald-500" />
                        </div>
                        <div>
                            <DialogTitle className="text-[17px] font-bold text-slate-900 leading-tight">Avaliação Física</DialogTitle>
                            <DialogDescription className="text-xs text-slate-400 mt-0.5">Registre as medidas corporais do aluno</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="px-6 py-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        {/* Date */}
                        <div className="col-span-2 space-y-1.5">
                            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Data da coleta</Label>
                            <Input type="date" value={date} onChange={e => setDate(e.target.value)}
                                className="h-9 rounded-xl border-slate-200 text-sm" />
                        </div>

                        {/* Weight */}
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Peso (kg) <span className="text-red-400">*</span></Label>
                            <Input type="number" step="0.1" placeholder="85.0" value={weight} onChange={e => setWeight(e.target.value)}
                                className="h-9 rounded-xl border-slate-200 text-sm" />
                        </div>

                        {/* Height */}
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Altura (m)</Label>
                            <Input type="number" step="0.01" placeholder="1.75" value={height} onChange={e => setHeight(e.target.value)}
                                className="h-9 rounded-xl border-slate-200 text-sm" />
                        </div>

                        {/* Body fat */}
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Gordura (%)</Label>
                            <Input type="number" step="0.1" placeholder="15.0" value={bodyFat} onChange={e => setBodyFat(e.target.value)}
                                className="h-9 rounded-xl border-slate-200 text-sm" />
                        </div>

                        {/* BMI preview */}
                        {weight && height && (
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">IMC calculado</Label>
                                <div className="h-9 rounded-xl border border-slate-100 bg-slate-50 px-3 flex items-center">
                                    <span className="text-sm font-semibold text-slate-700">
                                        {(parseFloat(weight) / (parseFloat(height) ** 2)).toFixed(1)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 border-t border-slate-100 flex flex-row items-center gap-2 sm:justify-end">
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading}
                        className="h-9 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold">
                        Cancelar
                    </Button>
                    <Button size="sm" disabled={loading || !weight || !date} onClick={handleSubmit}
                        className="h-9 rounded-xl bg-bee-amber hover:bg-bee-amber/90 text-bee-midnight font-bold text-xs px-5 gap-1.5 shadow-none">
                        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 stroke-[3px]" />}
                        {loading ? 'Salvando...' : 'Salvar medidas'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
