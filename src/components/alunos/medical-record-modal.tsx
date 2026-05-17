'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import {
    ResponsiveDialog,
    ResponsiveDialogHeader,
    ResponsiveDialogBody,
    ResponsiveDialogFooter,
} from '@/components/ui/responsive-dialog';
import {
    fieldLabel,
    sectionTitle,
    ctaPrimary,
    ctaSecondary,
} from '@/lib/modal-styles';
import { cn } from '@/lib/utils';

interface MedicalRecordModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    studentId: string;
    existingData?: any;
    onSuccess?: () => void;
}

const MAX_FIELD_LENGTH = 2000;

export function MedicalRecordModal({ open, onOpenChange, studentId, existingData, onSuccess }: MedicalRecordModalProps) {
    const supabase = createClient();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        characteristics: '',
        disabilities: '',
        difficulties: '',
        other_notes: '',
    });

    useEffect(() => {
        if (existingData) {
            setFormData({
                characteristics: existingData.characteristics || '',
                disabilities: existingData.disabilities || '',
                difficulties: existingData.difficulties || '',
                other_notes: existingData.other_notes || '',
            });
        } else {
            setFormData({ characteristics: '', disabilities: '', difficulties: '', other_notes: '' });
        }
    }, [existingData, open]);

    const handleTextChange = (field: keyof typeof formData, value: string) => {
        if (value.length <= MAX_FIELD_LENGTH) {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleSubmit = async () => {
        if (loading) return;
        setLoading(true);
        try {
            const payload = {
                ...formData,
                student_id: studentId,
                updated_at: new Date().toISOString(),
            };

            const { error } = await (supabase.from('student_medical_records' as any) as any)
                .upsert(payload, { onConflict: 'student_id', ignoreDuplicates: false });

            if (error) throw error;

            toast({ title: 'Ficha atualizada', description: 'Ficha médica salva com sucesso.' });
            onSuccess?.();
            onOpenChange(false);
        } catch (error: any) {
            let msg = 'Ocorreu um erro ao salvar.';
            if (error.code === '42P01') msg = 'Tabela de prontuários não encontrada.';
            else if (error.code === '42501') msg = 'Sem permissão para esta alteração.';
            else if (error.message) msg = error.message;
            toast({ title: 'Erro ao salvar', description: msg, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
            <ResponsiveDialogHeader
                title="Ficha Médica"
                description="Anamnese, restrições e cuidados especiais"
                onClose={() => onOpenChange(false)}
            />

            <ResponsiveDialogBody>
                <section>
                    <h3 className={sectionTitle}>Perfil & Biotipo</h3>
                    <FieldWithCount
                        label="Características físicas"
                        placeholder="Biotipo, postura, histórico esportivo, condicionamento prévio…"
                        value={formData.characteristics}
                        onChange={(v) => handleTextChange('characteristics', v)}
                    />
                </section>

                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                        <h3 className={cn(sectionTitle, 'mb-0 text-red-500')}>Restrições & Cuidados</h3>
                    </div>
                    <div className="space-y-4">
                        <FieldWithCount
                            label="Deficiências ou patologias"
                            placeholder="Problemas cardíacos, diabetes, asma, deficiências físicas…"
                            value={formData.disabilities}
                            onChange={(v) => handleTextChange('disabilities', v)}
                            danger
                        />
                        <FieldWithCount
                            label="Dificuldades ou lesões"
                            placeholder="Dores crônicas, lesões anteriores, hérnia, mobilidade reduzida…"
                            value={formData.difficulties}
                            onChange={(v) => handleTextChange('difficulties', v)}
                        />
                    </div>
                </section>

                <section>
                    <h3 className={sectionTitle}>Informações adicionais</h3>
                    <FieldWithCount
                        label="Outras observações"
                        placeholder="Medicamentos em uso, recomendações externas, objetivos específicos…"
                        value={formData.other_notes}
                        onChange={(v) => handleTextChange('other_notes', v)}
                    />
                </section>
            </ResponsiveDialogBody>

            <ResponsiveDialogFooter>
                <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={loading}
                    className={ctaSecondary}
                >
                    Cancelar
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className={ctaPrimary}
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Salvando…</span>
                        </>
                    ) : (
                        <>
                            <Check className="h-4 w-4" />
                            <span>Salvar ficha</span>
                        </>
                    )}
                </Button>
            </ResponsiveDialogFooter>
        </ResponsiveDialog>
    );
}

function FieldWithCount({
    label,
    placeholder,
    value,
    onChange,
    danger,
}: {
    label: string;
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
    danger?: boolean;
}) {
    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <Label className={fieldLabel}>{label}</Label>
                <span className="text-[10px] font-medium text-slate-400 tabular-nums">
                    {value.length}/{MAX_FIELD_LENGTH}
                </span>
            </div>
            <Textarea
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                maxLength={MAX_FIELD_LENGTH}
                className={cn(
                    'min-h-[110px] rounded-xl text-base sm:text-sm leading-relaxed resize-none',
                    'border-slate-200 bg-white placeholder:text-slate-400',
                    'focus:border-bee-amber focus:ring-2 focus:ring-bee-amber/20 focus:ring-offset-0',
                    danger && 'border-red-100 bg-red-50/30 focus:border-red-400/40 focus:ring-red-500/10',
                )}
            />
        </div>
    );
}
