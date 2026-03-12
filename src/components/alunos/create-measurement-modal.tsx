'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Ruler, Loader2, Save, X, CalendarDays, Scale, Activity, ArrowRight, Info, Check } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

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
                bmiVal = Math.round(bmiVal * 100) / 100;
            }

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
                    recorded_at: date,
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
            <SheetContent className="p-0 border-none bg-white sm:max-w-[600px] flex flex-col h-full overflow-hidden">
                <SheetHeader className="relative p-8 bg-gradient-to-br from-bee-midnight via-bee-midnight to-slate-900 border-none shrink-0 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-bee-amber/10 blur-3xl rounded-full -mr-16 -mt-16" />

                    <div className="relative flex items-center gap-5">
                        <div className="h-16 w-16 rounded-[22px] bg-bee-amber/10 flex items-center justify-center ring-1 ring-bee-amber/20">
                            <Scale className="h-8 w-8 text-bee-amber" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <SheetTitle className="text-2xl font-black text-white tracking-tight">Avaliação Física</SheetTitle>
                                <Badge className="bg-bee-amber text-bee-midnight border-none font-black uppercase text-[10px] tracking-tighter h-5 px-2">Antropometria</Badge>
                            </div>
                            <SheetDescription className="text-slate-400 font-medium text-sm">
                                Registre as medidas e índices corporais
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10 scrollbar-hide">
                    {/* Data e Peso */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-bee-amber/10 flex items-center justify-center">
                                <Activity className="h-4 w-4 text-bee-amber" />
                            </div>
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Medidas Principais</h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Data da Coleta</Label>
                                <div className="group/input relative transition-all">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within/input:text-bee-amber transition-colors duration-300">
                                        <CalendarDays className="h-full w-full" />
                                    </div>
                                    <Input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="h-11 pl-14 bg-slate-50/50 border-slate-100 rounded-2xl focus:ring-4 focus:ring-bee-amber/5 focus:border-bee-amber/20 transition-all font-semibold text-bee-midnight"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Peso Atual (kg)</Label>
                                <div className="group/input relative transition-all">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within/input:text-bee-amber transition-colors duration-300">
                                        <Scale className="h-full w-full" />
                                    </div>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        placeholder="00.0"
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value)}
                                        className="h-11 pl-14 bg-slate-50/50 border-slate-100 rounded-2xl focus:ring-4 focus:ring-bee-amber/5 focus:border-bee-amber/20 transition-all font-semibold text-bee-midnight"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-slate-50" />

                    {/* Altura e Gordura */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-bee-amber/10 flex items-center justify-center">
                                <Ruler className="h-4 w-4 text-bee-amber" />
                            </div>
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Composição Corporal</h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Altura (m)</Label>
                                <div className="group/input relative transition-all">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within/input:text-bee-amber transition-colors duration-300">
                                        <Ruler className="h-full w-full" />
                                    </div>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={height}
                                        onChange={(e) => setHeight(e.target.value)}
                                        className="h-11 pl-14 bg-slate-50/50 border-slate-100 rounded-2xl focus:ring-4 focus:ring-bee-amber/5 focus:border-bee-amber/20 transition-all font-semibold text-bee-midnight"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">% de Gordura (BF)</Label>
                                <div className="group/input relative transition-all">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within/input:text-bee-amber transition-colors duration-300">
                                        <Activity className="h-full w-full" />
                                    </div>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        placeholder="0.0"
                                        value={bodyFat}
                                        onChange={(e) => setBodyFat(e.target.value)}
                                        className="h-11 pl-14 bg-slate-50/50 border-slate-100 rounded-2xl focus:ring-4 focus:ring-bee-amber/5 focus:border-bee-amber/20 transition-all font-semibold text-bee-midnight"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Info Tip */}
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex gap-3">
                                <Info className="h-5 w-5 text-bee-amber shrink-0 mt-0.5" />
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    O <strong>IMC (Índice de Massa Corporal)</strong> será calculado automaticamente com base no peso e altura fornecidos.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <SheetFooter className="p-8 border-t bg-white flex items-center gap-3 shrink-0 sm:justify-end sticky bottom-0 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="flex-1 sm:flex-none text-slate-400 hover:text-slate-600 hover:bg-slate-100 font-black h-10 rounded-full uppercase text-[10px] tracking-widest transition-all"
                    >
                        <X className="mr-2 h-4 w-4" />
                        Descartar
                    </Button>
                    <Button
                        disabled={loading}
                        onClick={handleSubmit}
                        className="flex-1 sm:flex-none bg-bee-amber hover:bg-amber-500 text-bee-midnight font-black h-10 rounded-full shadow-lg shadow-bee-amber/20 transition-all hover:-translate-y-0.5 active:scale-95 uppercase text-[10px] tracking-widest px-10"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processando...
                            </>
                        ) : (
                            <>
                                <Check className="mr-2 h-4 w-4" />
                                Registrar Avaliação
                            </>
                        )}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
