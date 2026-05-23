'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Camera, Check } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useStudentLimit } from '@/hooks/useStudentLimit';
import { useAuth } from '@/lib/auth/AuthContext';
import { UpgradePromptModal } from '@/components/ui/upgrade-prompt-modal';
import { useState, useEffect, useMemo } from 'react';
import { ConfirmDiscardDialog } from '@/components/ui/confirm-discard-dialog';
import {
    ResponsiveDialog,
    ResponsiveDialogHeader,
    ResponsiveDialogBody,
    ResponsiveDialogFooter,
} from '@/components/ui/responsive-dialog';
import {
    fieldInput,
    fieldLabel,
    sectionTitle,
    gridTwoCol,
    ctaPrimary,
    ctaSecondary,
} from '@/lib/modal-styles';

interface StudentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    studentToEdit?: any | null;
    onSuccess: () => void;
}

interface Plan {
    id: string;
    name: string;
    price: number;
    plan_type: 'membership' | 'pack';
    duration_months: number | null;
    recurrence: 'monthly' | 'quarterly' | 'yearly' | 'one_time' | null;
    days_per_week: number | null;
    credits: number | null;
    active: boolean;
}

const recurrenceLabel: Record<string, string> = {
    monthly: 'Mensal',
    quarterly: 'Trimestral',
    yearly: 'Anual',
    one_time: 'Único'
};

const fieldCls = fieldInput;
const labelCls = fieldLabel;

export function StudentModal({ open, onOpenChange, studentToEdit, onSuccess }: StudentModalProps) {
    const { toast } = useToast();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showDiscardDialog, setShowDiscardDialog] = useState(false);
    const { maxStudents } = useSubscription();
    const { hasReachedLimit, canAddStudent } = useStudentLimit();
    const { organizationId, user: authUser } = useAuth();

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        cpf: '',
        gender: 'not_informed',
        birth_date: '',
        plan_id: '',
        objective: '',
        avatar_url: null as string | null,
        address_zip: '',
        address_street: '',
        address_number: '',
        address_neighborhood: '',
        active: true
    });

    const isDirty = useMemo(() => {
        if (!open) return false;
        const initial = {
            full_name: studentToEdit?.full_name || '',
            email: studentToEdit?.email || '',
            phone: studentToEdit?.phone || '',
            cpf: studentToEdit?.cpf || '',
            gender: studentToEdit?.gender || 'not_informed',
            birth_date: studentToEdit?.birth_date?.split('T')[0] || '',
            plan_id: studentToEdit?.plan_id || '',
            objective: studentToEdit?.objective || '',
            avatar_url: studentToEdit?.avatar_url || null,
            address_zip: studentToEdit?.address_zip || '',
            address_street: studentToEdit?.address_street || '',
            address_number: studentToEdit?.address_number || '',
            address_neighborhood: studentToEdit?.address_neighborhood || '',
            active: studentToEdit ? studentToEdit.status !== 'INACTIVE' : true
        };
        return JSON.stringify(formData) !== JSON.stringify(initial);
    }, [open, formData, studentToEdit]);

    useEffect(() => {
        if (open && organizationId) {
            fetchPlans();
        }
    }, [open, organizationId]);

    useEffect(() => {
        if (open) {
            if (studentToEdit) {
                setFormData({
                    full_name: studentToEdit.full_name || '',
                    email: studentToEdit.email || '',
                    phone: studentToEdit.phone || '',
                    cpf: studentToEdit.cpf || '',
                    gender: studentToEdit.gender || 'not_informed',
                    birth_date: studentToEdit.birth_date?.split('T')[0] || '',
                    plan_id: studentToEdit.plan_id || '',
                    objective: studentToEdit.objective || '',
                    avatar_url: studentToEdit.avatar_url || null,
                    address_zip: studentToEdit.address_zip || '',
                    address_street: studentToEdit.address_street || '',
                    address_number: studentToEdit.address_number || '',
                    address_neighborhood: studentToEdit.address_neighborhood || '',
                    active: studentToEdit.status !== 'INACTIVE'
                });
                setPreviewUrl(studentToEdit.avatar_url);
            } else {
                setFormData({
                    full_name: '',
                    email: '',
                    phone: '',
                    cpf: '',
                    gender: 'not_informed',
                    birth_date: '',
                    plan_id: '',
                    objective: '',
                    avatar_url: null,
                    address_zip: '',
                    address_street: '',
                    address_number: '',
                    address_neighborhood: '',
                    active: true
                });
                setPreviewUrl(null);
            }
        }
    }, [open, studentToEdit]);

    const fetchPlans = async () => {
        if (!organizationId) return;
        const { data, error } = await supabase
            .from('membership_plans')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('active', true);
        if (data) setPlans(data as any);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            if (!authUser) return;
            const fileExt = file.name.split('.').pop();
            const fileName = `${authUser.id}/${Math.random()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('students')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('students')
                .getPublicUrl(fileName);

            setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
            setPreviewUrl(publicUrl);
        } catch (error: any) {
            toast({ title: 'Erro ao enviar foto', description: error.message, variant: 'destructive' });
        } finally {
            setUploading(false);
        }
    };

    const handleCloseAttempt = () => {
        if (isDirty) setShowDiscardDialog(true);
        else onOpenChange(false);
    };

    const handleSubmit = async () => {
        if (!formData.full_name || !formData.phone) {
            toast({ title: 'Campos obrigatórios', description: 'Nome e telefone são obrigatórios.', variant: 'destructive' });
            return;
        }
        if (!studentToEdit && !formData.plan_id) {
            toast({ title: 'Selecione um plano', description: 'É obrigatório vincular o aluno a um plano antes de criar.', variant: 'destructive' });
            return;
        }

        // Block creating a new ACTIVE student if limit is reached
        const willBeActive = formData.active !== false;
        if (!studentToEdit && willBeActive && hasReachedLimit) {
            toast({
                title: 'Limite de alunos atingido',
                description: `Seu plano permite até ${maxStudents} alunos ativos. Inative alunos antigos ou faça upgrade do plano.`,
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);
        try {
            if (!authUser) throw new Error('Não autenticado');
            if (!organizationId) throw new Error('Organização não encontrada');

            const payload: Record<string, any> = {
                full_name: formData.full_name,
                email: formData.email || null,
                phone: formData.phone,
                cpf: formData.cpf || null,
                gender: formData.gender,
                birth_date: formData.birth_date || null,
                plan_id: formData.plan_id || null,
                objective: formData.objective || null,
                avatar_url: formData.avatar_url,
                address_zip: formData.address_zip || null,
                address_street: formData.address_street || null,
                address_number: formData.address_number || null,
                address_neighborhood: formData.address_neighborhood || null,
                organization_id: organizationId,
                status: formData.active ? 'ACTIVE' : 'INACTIVE',
            };

            let error;
            if (studentToEdit) {
                const { error: err } = await (supabase as any).from('students').update(payload).eq('id', studentToEdit.id);
                error = err;
            } else {
                const { error: err } = await (supabase as any).from('students').insert([payload]);
                error = err;
            }

            if (error) throw error;

            toast({ title: studentToEdit ? 'Aluno atualizado!' : 'Aluno cadastrado!' });
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            const msg: string = error?.message ?? '';
            if (msg.includes('student_limit_exceeded')) {
                const limit = msg.split('|')[1] ?? maxStudents;
                toast({
                    title: 'Limite de alunos atingido',
                    description: `Seu plano permite até ${limit} alunos ativos. Inative alunos antigos ou faça upgrade.`,
                    variant: 'destructive',
                });
            } else {
                toast({ title: 'Erro ao salvar', description: msg, variant: 'destructive' });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <ResponsiveDialog open={open} onOpenChange={(v) => { if (!v) handleCloseAttempt(); else onOpenChange(true); }} dismissible={!isDirty}>
                <ResponsiveDialogHeader
                    title={studentToEdit ? 'Editar Aluno' : 'Novo Aluno'}
                    description={studentToEdit ? 'Atualize as informações do aluno.' : 'Cadastre um novo aluno no sistema.'}
                    onClose={handleCloseAttempt}
                />

                <ResponsiveDialogBody>
                    {/* Avatar — centered on mobile, prominent */}
                    <div className="flex flex-col items-center gap-3 pb-2">
                        <div
                            className="relative h-24 w-24 sm:h-20 sm:w-20 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 group cursor-pointer active:scale-95 transition-transform"
                            onClick={() => document.getElementById('avatar-upload')?.click()}
                        >
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                    <User className="h-10 w-10 sm:h-8 sm:w-8 text-slate-300" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                                <Camera className="h-6 w-6 sm:h-5 sm:w-5 text-white" />
                            </div>
                            {uploading && (
                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                    <Loader2 className="h-5 w-5 animate-spin text-bee-amber" />
                                </div>
                            )}
                        </div>
                        <input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                        <button
                            type="button"
                            onClick={() => document.getElementById('avatar-upload')?.click()}
                            className="text-xs font-semibold text-bee-amber hover:underline"
                        >
                            {previewUrl ? 'Alterar foto' : 'Adicionar foto'}
                        </button>
                    </div>

                    {/* Section: Pessoal */}
                    <section>
                        <h3 className={sectionTitle}>Dados pessoais</h3>
                        <div className="space-y-4">
                            <div>
                                <Label className={fieldLabel}>Nome Completo *</Label>
                                <Input
                                    placeholder="Ex: João Silva"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className={fieldInput}
                                    autoComplete="name"
                                />
                            </div>

                            <div className={gridTwoCol}>
                                <div>
                                    <Label className={fieldLabel}>CPF</Label>
                                    <Input
                                        placeholder="000.000.000-00"
                                        value={formData.cpf}
                                        onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                                        className={fieldInput}
                                        inputMode="numeric"
                                    />
                                </div>
                                <div>
                                    <Label className={fieldLabel}>Gênero</Label>
                                    <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                                        <SelectTrigger className={fieldInput}>
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="not_informed">Não informado</SelectItem>
                                            <SelectItem value="male">Masculino</SelectItem>
                                            <SelectItem value="female">Feminino</SelectItem>
                                            <SelectItem value="other">Outro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label className={fieldLabel}>Data de Nascimento</Label>
                                <Input
                                    type="date"
                                    value={formData.birth_date}
                                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                                    className={fieldInput}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Section: Contato */}
                    <section>
                        <h3 className={sectionTitle}>Contato</h3>
                        <div className="space-y-4">
                            <div>
                                <Label className={fieldLabel}>Telefone *</Label>
                                <Input
                                    placeholder="(00) 00000-0000"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className={fieldInput}
                                    inputMode="tel"
                                    autoComplete="tel"
                                />
                            </div>
                            <div>
                                <Label className={fieldLabel}>E-mail</Label>
                                <Input
                                    type="email"
                                    placeholder="email@exemplo.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className={fieldInput}
                                    autoComplete="email"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Section: Plano */}
                    <section>
                        <h3 className={sectionTitle}>Matrícula</h3>
                        <div>
                            <Label className={fieldLabel}>Plano</Label>
                            <Select value={formData.plan_id} onValueChange={(v) => setFormData({ ...formData, plan_id: v })}>
                                <SelectTrigger className={fieldInput}>
                                    <SelectValue placeholder="Selecione um plano" />
                                </SelectTrigger>
                                <SelectContent>
                                    {plans.map(plan => (
                                        <SelectItem key={plan.id} value={plan.id}>
                                            {plan.name} ({recurrenceLabel[plan.recurrence || ''] || 'Mensal'})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </section>

                    {/* Section: Endereço */}
                    <section>
                        <h3 className={sectionTitle}>Endereço</h3>
                        <div className="space-y-4">
                            <div>
                                <Label className={fieldLabel}>CEP</Label>
                                <Input
                                    placeholder="00000-000"
                                    value={formData.address_zip}
                                    onChange={(e) => setFormData({ ...formData, address_zip: e.target.value })}
                                    className={fieldInput}
                                    inputMode="numeric"
                                    autoComplete="postal-code"
                                />
                            </div>
                            <div>
                                <Label className={fieldLabel}>Rua</Label>
                                <Input
                                    placeholder="Nome da rua"
                                    value={formData.address_street}
                                    onChange={(e) => setFormData({ ...formData, address_street: e.target.value })}
                                    className={fieldInput}
                                    autoComplete="address-line1"
                                />
                            </div>
                            <div className={gridTwoCol}>
                                <div>
                                    <Label className={fieldLabel}>Número</Label>
                                    <Input
                                        placeholder="Ex: 123"
                                        value={formData.address_number}
                                        onChange={(e) => setFormData({ ...formData, address_number: e.target.value })}
                                        className={fieldInput}
                                        inputMode="numeric"
                                    />
                                </div>
                                <div>
                                    <Label className={fieldLabel}>Bairro</Label>
                                    <Input
                                        placeholder="Ex: Centro"
                                        value={formData.address_neighborhood}
                                        onChange={(e) => setFormData({ ...formData, address_neighborhood: e.target.value })}
                                        className={fieldInput}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section: Extras */}
                    <section>
                        <h3 className={sectionTitle}>Outros</h3>
                        <div className="space-y-4">
                            <div>
                                <Label className={fieldLabel}>Objetivo</Label>
                                <Select
                                    value={formData.objective}
                                    onValueChange={(v) => setFormData({ ...formData, objective: v })}
                                >
                                    <SelectTrigger className={fieldInput}>
                                        <SelectValue placeholder="Selecione o objetivo..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Hipertrofia">Hipertrofia</SelectItem>
                                        <SelectItem value="Emagrecimento">Emagrecimento</SelectItem>
                                        <SelectItem value="Condicionamento Físico">Condicionamento Físico</SelectItem>
                                        <SelectItem value="Força">Força</SelectItem>
                                        <SelectItem value="Saúde e Bem-estar">Saúde e Bem-estar</SelectItem>
                                        <SelectItem value="Reabilitação">Reabilitação</SelectItem>
                                        <SelectItem value="Flexibilidade">Flexibilidade</SelectItem>
                                        <SelectItem value="Outro">Outro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                <div className="flex-1 pr-3">
                                    <Label className="text-sm font-semibold text-slate-900 mb-0.5 block">Aluno Ativo</Label>
                                    <p className="text-xs text-slate-500 leading-snug">Alunos inativos não podem fazer check-in.</p>
                                </div>
                                <Switch
                                    checked={formData.active}
                                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                                    className="data-[state=checked]:bg-bee-amber"
                                />
                            </div>
                        </div>
                    </section>
                </ResponsiveDialogBody>

                <ResponsiveDialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleCloseAttempt}
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
                            <><Loader2 className="h-4 w-4 animate-spin" />Salvando…</>
                        ) : (
                            <>
                                <Check className="h-4 w-4" />
                                <span>{studentToEdit ? 'Salvar alterações' : 'Concluir matrícula'}</span>
                            </>
                        )}
                    </Button>
                </ResponsiveDialogFooter>
            </ResponsiveDialog>

            <ConfirmDiscardDialog
                open={showDiscardDialog}
                onOpenChange={setShowDiscardDialog}
                onConfirm={() => {
                    setShowDiscardDialog(false);
                    onOpenChange(false);
                }}
            />
            <UpgradePromptModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} featureName={`Limite de ${maxStudents} alunos ativos`} />
        </>
    );
}
