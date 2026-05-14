'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Camera, Check } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/lib/auth/AuthContext';
import { UpgradePromptModal } from '@/components/ui/upgrade-prompt-modal';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';
import { ConfirmDiscardDialog } from '@/components/ui/confirm-discard-dialog';

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

const fieldCls = 'h-9 rounded-xl border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:border-bee-amber focus:ring-2 focus:ring-bee-amber/20 focus:ring-offset-0';
const labelCls = 'text-sm font-medium text-slate-700';

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
    const { organizationId, user: authUser } = useAuth();

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        cpf: '',
        gender: 'not_informed',
        birth_date: '',
        plan_id: '',
        observations: '',
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
            observations: studentToEdit?.observations || '',
            avatar_url: studentToEdit?.avatar_url || null,
            address_zip: studentToEdit?.address_zip || '',
            address_street: studentToEdit?.address_street || '',
            address_number: studentToEdit?.address_number || '',
            address_neighborhood: studentToEdit?.address_neighborhood || '',
            active: studentToEdit ? !!studentToEdit.active : true
        };
        return JSON.stringify(formData) !== JSON.stringify(initial);
    }, [open, formData, studentToEdit]);

    useEffect(() => {
        if (open) {
            fetchPlans();
            if (studentToEdit) {
                setFormData({
                    full_name: studentToEdit.full_name || '',
                    email: studentToEdit.email || '',
                    phone: studentToEdit.phone || '',
                    cpf: studentToEdit.cpf || '',
                    gender: studentToEdit.gender || 'not_informed',
                    birth_date: studentToEdit.birth_date?.split('T')[0] || '',
                    plan_id: studentToEdit.plan_id || '',
                    observations: studentToEdit.observations || '',
                    avatar_url: studentToEdit.avatar_url || null,
                    address_zip: studentToEdit.address_zip || '',
                    address_street: studentToEdit.address_street || '',
                    address_number: studentToEdit.address_number || '',
                    address_neighborhood: studentToEdit.address_neighborhood || '',
                    active: !!studentToEdit.active
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
                    observations: '',
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
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('student-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('student-assets')
                .getPublicUrl(filePath);

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

        setLoading(true);
        try {
            if (!authUser) throw new Error('Não autenticado');
            if (!organizationId) throw new Error('Organização não encontrada');

            const payload = {
                ...formData,
                organization_id: organizationId,
                status: formData.active ? 'ACTIVE' : 'INACTIVE'
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
            toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={handleCloseAttempt}>
                <DialogContent className="max-w-[576px] p-0 gap-0 rounded-2xl overflow-hidden">
                    <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100">
                        <DialogTitle className="text-[17px] font-semibold text-slate-900 leading-tight">
                            {studentToEdit ? 'Editar Aluno' : 'Novo Aluno'}
                        </DialogTitle>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {studentToEdit ? 'Atualize as informações do aluno.' : 'Cadastre um novo aluno no sistema.'}
                        </p>
                    </DialogHeader>

                    <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div className="flex items-start gap-5">
                            <div className="flex flex-col items-center gap-2">
                                <div
                                    className="relative h-20 w-20 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 group cursor-pointer"
                                    onClick={() => document.getElementById('avatar-upload')?.click()}
                                >
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center">
                                            <User className="h-8 w-8 text-slate-300" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="h-5 w-5 text-white" />
                                    </div>
                                    {uploading && (
                                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                            <Loader2 className="h-5 w-5 animate-spin text-bee-amber" />
                                        </div>
                                    )}
                                </div>
                                <input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Foto</span>
                            </div>

                            <div className="flex-1 space-y-3">
                                <div className="space-y-1.5">
                                    <Label className={labelCls}>Nome Completo *</Label>
                                    <Input
                                        placeholder="Ex: João Silva"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className={fieldCls}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className={labelCls}>CPF</Label>
                                        <Input
                                            placeholder="000.000.000-00"
                                            value={formData.cpf}
                                            onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                                            className={fieldCls}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className={labelCls}>Gênero</Label>
                                        <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                                            <SelectTrigger className={fieldCls}>
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
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className={labelCls}>E-mail</Label>
                                <Input
                                    type="email"
                                    placeholder="email@exemplo.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className={fieldCls}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Telefone *</Label>
                                <Input
                                    placeholder="(00) 00000-0000"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className={fieldCls}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Data de Nascimento</Label>
                                <Input
                                    type="date"
                                    value={formData.birth_date}
                                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                                    className={fieldCls}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Plano</Label>
                                <Select value={formData.plan_id} onValueChange={(v) => setFormData({ ...formData, plan_id: v })}>
                                    <SelectTrigger className={fieldCls}>
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
                        </div>

                        <hr className="border-slate-100" />

                        <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-1 space-y-1.5">
                                    <Label className={labelCls}>CEP</Label>
                                    <Input
                                        placeholder="00000-000"
                                        value={formData.address_zip}
                                        onChange={(e) => setFormData({ ...formData, address_zip: e.target.value })}
                                        className={fieldCls}
                                    />
                                </div>
                                <div className="col-span-2 space-y-1.5">
                                    <Label className={labelCls}>Rua</Label>
                                    <Input
                                        placeholder="Nome da rua"
                                        value={formData.address_street}
                                        onChange={(e) => setFormData({ ...formData, address_street: e.target.value })}
                                        className={fieldCls}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className={labelCls}>Número</Label>
                                    <Input
                                        placeholder="Ex: 123"
                                        value={formData.address_number}
                                        onChange={(e) => setFormData({ ...formData, address_number: e.target.value })}
                                        className={fieldCls}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className={labelCls}>Bairro</Label>
                                    <Input
                                        placeholder="Ex: Centro"
                                        value={formData.address_neighborhood}
                                        onChange={(e) => setFormData({ ...formData, address_neighborhood: e.target.value })}
                                        className={fieldCls}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className={labelCls}>Observações</Label>
                            <Input
                                placeholder="Notas internas sobre o aluno..."
                                value={formData.observations}
                                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                                className={fieldCls}
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-semibold text-slate-900">Aluno Ativo</Label>
                                <p className="text-xs text-slate-500">Alunos inativos não podem fazer check-in.</p>
                            </div>
                            <Switch
                                checked={formData.active}
                                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                                className="data-[state=checked]:bg-bee-amber"
                            />
                        </div>
                    </div>

                    <div className="px-6 pb-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <Button
                            variant="outline"
                            onClick={handleCloseAttempt}
                            disabled={loading}
                            className="h-9 rounded-full px-5 border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="h-9 rounded-full px-6 bg-bee-amber hover:bg-amber-500 text-bee-midnight font-semibold text-sm shadow-sm"
                        >
                            {loading ? (
                                <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Salvando…</>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Check className="h-4 w-4" />
                                    <span>{studentToEdit ? 'Salvar alterações' : 'Concluir matrícula'}</span>
                                </div>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

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
