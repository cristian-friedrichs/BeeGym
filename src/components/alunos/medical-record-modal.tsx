'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ClipboardList, Loader2, Save, X, Check, Info, FileText, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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
        if (loading) return;
        
        setLoading(true);
        try {
            const payload = {
                ...formData,
                student_id: studentId,
                updated_at: new Date().toISOString()
            };

            const { error } = await (supabase.from('student_medical_records' as any) as any)
                .upsert(payload, { 
                    onConflict: 'student_id',
                    ignoreDuplicates: false 
                });

            if (error) throw error;

            toast({ 
                title: "Sucesso!",
                description: "Ficha médica atualizada com sucesso."
            });
            
            if (onSuccess) onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error('Error saving medical record:', error);
            
            let errorMessage = "Ocorreu um erro ao tentar salvar as informações.";
            
            if (error.code === '42P01') {
                errorMessage = "A tabela de prontuários não foi encontrada no banco de dados.";
            } else if (error.code === '42501') {
                errorMessage = "Você não tem permissão para realizar esta alteração.";
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast({ 
                title: "Erro ao salvar", 
                description: errorMessage,
                variant: "destructive" 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="p-0 border-none bg-white sm:max-w-[600px] flex flex-col h-full overflow-hidden text-left">
                <SheetHeader className="relative p-8 bg-gradient-to-br from-bee-midnight via-bee-midnight to-slate-900 border-none shrink-0 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full -mr-16 -mt-16" />

                    <div className="relative flex items-center gap-5">
                        <div className="h-16 w-16 rounded-[22px] bg-blue-500/10 flex items-center justify-center ring-1 ring-blue-500/20">
                            <ClipboardList className="h-8 w-8 text-blue-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <SheetTitle className="text-2xl font-black text-white tracking-tight text-left">Ficha Médica</SheetTitle>
                                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 font-black uppercase text-[10px] tracking-tighter h-5 px-2">Anamnese</Badge>
                            </div>
                            <SheetDescription className="text-slate-400 font-medium text-sm text-left">
                                Histórico, restrições e cuidados especiais
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10 scrollbar-hide text-left">
                    {/* Características Físicas */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <FileText className="h-4 w-4 text-blue-400" />
                            </div>
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 text-left">Perfil & Biotipo</h3>
                        </div>

                        <div className="space-y-2.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Características Físicas</Label>
                            <Textarea
                                placeholder="Descreva o biotipo, postura, histórico esportivo e outros dados relevantes..."
                                className="min-h-[100px] p-4 bg-slate-50/50 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all font-medium text-bee-midnight resize-none leading-relaxed"
                                value={formData.characteristics}
                                onChange={(e) => setFormData(prev => ({ ...prev, characteristics: e.target.value }))}
                            />
                        </div>
                    </div>

                    <Separator className="bg-slate-50" />

                    {/* Restrições Médicas */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                                <AlertCircle className="h-4 w-4 text-red-400" />
                            </div>
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 text-left">Restrições & Cuidados</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-red-500/70 ml-1">Deficiências ou Patologias</Label>
                                <Textarea
                                    placeholder="Problemas cardíacos, diabetes, asma, deficiências físicas, etc..."
                                    className="min-h-[100px] p-4 bg-red-50/20 border-red-100/50 rounded-2xl focus:ring-4 focus:ring-red-500/5 focus:border-red-500/20 transition-all font-medium text-bee-midnight resize-none leading-relaxed"
                                    value={formData.disabilities}
                                    onChange={(e) => setFormData(prev => ({ ...prev, disabilities: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Dificuldades ou Lesões</Label>
                                <Textarea
                                    placeholder="Dores crônicas, lesões anteriores, hérnia de disco, falta de mobilidade..."
                                    className="min-h-[100px] p-4 bg-slate-50/50 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all font-medium text-bee-midnight resize-none leading-relaxed"
                                    value={formData.difficulties}
                                    onChange={(e) => setFormData(prev => ({ ...prev, difficulties: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-slate-50" />

                    {/* Notas Finais */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                <Info className="h-4 w-4 text-slate-400" />
                            </div>
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 text-left">Informações Adicionais</h3>
                        </div>

                        <div className="space-y-2.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Outras Observações</Label>
                            <Textarea
                                placeholder="Medicamentos em uso, recomendações externas, objetivos específicos..."
                                className="min-h-[100px] p-4 bg-slate-50/50 border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-500/20 transition-all font-medium text-bee-midnight resize-none leading-relaxed"
                                value={formData.other_notes}
                                onChange={(e) => setFormData(prev => ({ ...prev, other_notes: e.target.value }))}
                            />
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
                        Fechar
                    </Button>
                    <Button
                        disabled={loading}
                        onClick={handleSubmit}
                        className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white font-black h-10 rounded-full shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 active:scale-95 uppercase text-[10px] tracking-widest px-10"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Check className="mr-2 h-4 w-4" />
                                Atualizar Ficha
                            </>
                        )}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
