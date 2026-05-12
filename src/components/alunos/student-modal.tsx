'use client';

import { useState, useEffect } from 'react';
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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Camera, Trash2, AlertCircle, Tag } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useStudentLimit } from '@/hooks/useStudentLimit';
import { UpgradePromptModal } from '@/components/ui/upgrade-prompt-modal';
import { format, addMonths } from 'date-fns';
import { useUnit } from '@/context/UnitContext';
import { cn } from '@/lib/utils';

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
    description: string | null;
    plan_type: 'membership' | 'pack';
    type?: string;
    duration_months: number | null;
    recurrence: 'monthly' | 'quarterly' | 'yearly' | 'one_time' | null;
    frequency?: string;
    days_per_week: number | null;
    credits: number | null;
    checkin_limit?: number | null;
    active: boolean;
}

const recurrenceLabel: Record<string, string> = {
    monthly: 'Mensal',
    quarterly: 'Trimestral',
    yearly: 'Anual',
};

const fieldCls = 'h-9 rounded-xl border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:border-bee-amber focus:ring-2 focus:ring-bee-amber/20 focus:ring-offset-0';
const labelCls = 'text-sm font-medium text-slate-700';

export function StudentModal({ open, onOpenChange, studentToEdit, onSuccess }: StudentModalProps) {
    const supabase = createClient();
    const { toast } = useToast();
    const { maxStudents, organizationId } = useSubscription();
    const { canAddStudent, hasReachedLimit } = useStudentLimit();
    const { currentUnitId } = useUnit();
    const [loading, setLoading] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [cpf, setCpf] = useState('');
    const [planId, setPlanId] = useState('');
    const [objective, setObjective] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [status, setStatus] = useState('ACTIVE');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const [street, setStreet] = useState('');
    const [addressNumber, setAddressNumber] = useState('');
    const [complement, setComplement] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [city, setCity] = useState('');
    const [addressState, setAddressState] = useState('');
    const [zip, setZip] = useState('');

    const [phoneError, setPhoneError] = useState('');
    const [streetError, setStreetError] = useState('');

    const [plans, setPlans] = useState<Plan[]>([]);
    const [plansLoading, setPlansLoading] = useState(false);
    const [selectedPlanDetails, setSelectedPlanDetails] = useState<Plan | null>(null);
    const [canManageDiscounts, setCanManageDiscounts] = useState(false);
    const [discountActive, setDiscountActive] = useState(false);
    const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
    const [discountValue, setDiscountValue] = useState<string>('');
    const [discountDuration, setDiscountDuration] = useState<string>('indefinite');

    useEffect(() => {
        if (!open) return;
        const resolveAndFetch = async () => {
            let targetOrgId = studentToEdit?.organization_id || organizationId;
            if (!targetOrgId) {
                const { data: { user: currentUser } } = await supabase.auth.getUser();
                if (currentUser) {
                    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', currentUser.id).single() as { data: { organization_id: string } | null };
                    if (profile?.organization_id) targetOrgId = profile.organization_id;
                }
            }
            if (targetOrgId) { fetchPlans(targetOrgId); checkPermissions(); }
        };
        resolveAndFetch();
    }, [open, studentToEdit?.organization_id, organizationId]);

    useEffect(() => {
        if (open && studentToEdit) {
            setFullName(studentToEdit.full_name || '');
            setEmail(studentToEdit.email || '');
            setPhone(studentToEdit.phone || '');
            setCpf(studentToEdit.cpf || '');
            setStreet(studentToEdit.address_street || '');
            setAddressNumber(studentToEdit.address_number || '');
            setComplement(studentToEdit.address_complement || '');
            setNeighborhood(studentToEdit.address_neighborhood || '');
            setCity(studentToEdit.address_city || '');
            setAddressState(studentToEdit.address_state || '');
            setZip(studentToEdit.address_zip || '');
            setPlanId(studentToEdit.plan_id || studentToEdit.plan || '');
            setObjective(studentToEdit.objective || '');
            setBirthDate(studentToEdit.birth_date ? studentToEdit.birth_date.split('T')[0] : '');
            setStatus(studentToEdit.status || 'ACTIVE');
            if (studentToEdit.discount_type && studentToEdit.discount_value) {
                setDiscountActive(true);
                setDiscountType(studentToEdit.discount_type);
                setDiscountValue(studentToEdit.discount_value.toString());
                setDiscountDuration(studentToEdit.discount_end_date ? 'custom' : 'indefinite');
            } else {
                setDiscountActive(false); setDiscountType('percent'); setDiscountValue(''); setDiscountDuration('indefinite');
            }
            setAvatarUrl(studentToEdit.avatar_url || null);
            setAvatarPreview(studentToEdit.avatar_url || null);
            setAvatarFile(null);
        } else if (open && !studentToEdit) {
            setFullName(''); setEmail(''); setPhone(''); setCpf('');
            setStreet(''); setAddressNumber(''); setComplement('');
            setNeighborhood(''); setCity(''); setAddressState(''); setZip('');
            setPlanId(''); setObjective(''); setBirthDate(''); setStatus('ACTIVE');
            setPhoneError(''); setStreetError('');
            setDiscountActive(false); setDiscountType('percent'); setDiscountValue(''); setDiscountDuration('indefinite');
            setAvatarUrl(null); setAvatarPreview(null); setAvatarFile(null);
        }
    }, [open, studentToEdit]);

    useEffect(() => {
        if (planId && plans.length > 0) {
            const found = plans.find(p => p.id === planId) || plans.find(p => p.name === planId);
            if (found) { if (found.name === planId && found.id !== planId) setPlanId(found.id); setSelectedPlanDetails(found); }
            else setSelectedPlanDetails(null);
        } else setSelectedPlanDetails(null);
    }, [planId, plans]);

    const fetchPlans = async (orgId?: string) => {
        const targetOrgId = orgId || organizationId;
        if (!targetOrgId) return;
        setPlansLoading(true);
        try {
            const { data, error } = await supabase.from('membership_plans').select('*').eq('organization_id', targetOrgId).order('name');
            if (error) throw error;
            if (data) {
                const fetchedPlans = (data as any[]).map(p => ({ ...p, type: p.plan_type, frequency: p.recurrence, checkin_limit: p.credits })) as Plan[];
                setPlans(fetchedPlans.filter(p => p.active || (studentToEdit && (p.id === studentToEdit.plan_id || p.name === studentToEdit.plan))));
            }
        } catch (error) {
            toast({ title: 'Erro ao carregar planos', variant: 'destructive' });
        } finally { setPlansLoading(false); }
    };

    const checkPermissions = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: profile } = await (supabase as any).from('profiles').select('role_id, app_roles(name)').eq('id', user.id).single();
            if (!profile?.app_roles) { setCanManageDiscounts(true); return; }
            const roleName = (profile?.app_roles as any)?.name?.toLowerCase();
            setCanManageDiscounts(roleName === 'admin' || roleName === 'manager');
        } catch { setCanManageDiscounts(true); }
    };

    const calculateDiscountEndDate = (): string | null => {
        const today = new Date();
        switch (discountDuration) {
            case '1_month': return addMonths(today, 1).toISOString();
            case '3_months': return addMonths(today, 3).toISOString();
            case '6_months': return addMonths(today, 6).toISOString();
            case '12_months': return addMonths(today, 12).toISOString();
            default: return null;
        }
    };

    const calculateFinalPrice = () => {
        if (!selectedPlanDetails || !discountActive || !discountValue) return selectedPlanDetails?.price;
        const val = parseFloat(discountValue);
        if (isNaN(val)) return selectedPlanDetails.price;
        const final = discountType === 'percent'
            ? selectedPlanDetails.price - (selectedPlanDetails.price * (val / 100))
            : selectedPlanDetails.price - val;
        return Math.max(0, final);
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
            toast({ title: 'Formato inválido', description: 'Use PNG, JPG ou WebP.', variant: 'destructive' });
            e.target.value = ''; return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast({ title: 'Arquivo muito grande', description: 'Máximo 5MB.', variant: 'destructive' });
            e.target.value = ''; return;
        }
        setAvatarFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setAvatarPreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const uploadAvatar = async (studentId: string) => {
        if (!avatarFile) return avatarUrl;
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `avatars/${studentId}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await (supabase.storage as any).from('students').upload(filePath, avatarFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = (supabase.storage as any).from('students').getPublicUrl(filePath);
        return publicUrl;
    };

    const formatCPF = (value: string) => {
        const clean = value.replace(/\D/g, '').slice(0, 11);
        if (clean.length <= 3) return clean;
        if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
        if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
        return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
    };

    const formatZip = (value: string) => {
        const clean = value.replace(/\D/g, '').slice(0, 8);
        if (clean.length <= 5) return clean;
        return `${clean.slice(0, 5)}-${clean.slice(5)}`;
    };

    const formatPhoneNumber = (value: string) => {
        const clean = value.replace(/\D/g, '').slice(0, 11);
        if (clean.length <= 2) return clean;
        if (clean.length <= 6) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
        if (clean.length <= 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
        return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    };

    const handleSubmit = async () => {
        if (!fullName.trim()) { toast({ title: 'Nome é obrigatório', variant: 'destructive' }); return; }
        const cpfDigits = cpf.replace(/\D/g, '');
        if (cpf && cpfDigits.length < 11) { toast({ title: 'CPF inválido', description: 'O CPF deve ter 11 dígitos.', variant: 'destructive' }); return; }
        if (!email.trim()) { toast({ title: 'Email é obrigatório', variant: 'destructive' }); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { toast({ title: 'Email inválido', variant: 'destructive' }); return; }
        const phoneDigits = phone.replace(/\D/g, '');
        if (phone && phoneDigits.length < 10) { setPhoneError('Telefone inválido. Mínimo de 10 dígitos.'); return; }
        setPhoneError('');
        if (zip && zip.replace(/\D/g, '').length < 8) { toast({ title: 'CEP inválido', variant: 'destructive' }); return; }
        if (!street.trim() && (city.trim() || neighborhood.trim() || zip.trim())) {
            setStreetError('Endereço (Rua) é obrigatório.');
            toast({ title: 'Endereço incompleto', description: 'Preencha o campo Rua.', variant: 'destructive' }); return;
        }
        setStreetError('');
        if (discountActive && discountValue) {
            const dv = parseFloat(discountValue);
            if (isNaN(dv) || dv <= 0) { toast({ title: 'Desconto inválido', variant: 'destructive' }); return; }
            if (discountType === 'percent' && dv >= 100) { toast({ title: 'Desconto deve ser menor que 100%', variant: 'destructive' }); return; }
            if (discountType === 'fixed' && selectedPlanDetails && dv >= selectedPlanDetails.price) { toast({ title: 'Desconto não pode ser maior que o valor do plano', variant: 'destructive' }); return; }
        }
        if (!studentToEdit && !canAddStudent) { setShowUpgradeModal(true); return; }
        if (studentToEdit && status === 'ACTIVE' && studentToEdit.status !== 'ACTIVE' && hasReachedLimit) { setShowUpgradeModal(true); return; }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');
            const { data: profile } = await (supabase as any).from('profiles').select('organization_id').eq('id', user.id).single() as { data: { organization_id: string } | null };
            const orgId = profile?.organization_id;

            const payload: any = {
                full_name: fullName, email, phone,
                cpf: cpf || null,
                address_street: street || null, address_number: addressNumber || null,
                address_complement: complement || null, address_neighborhood: neighborhood || null,
                address_city: city || null, address_state: addressState || null, address_zip: zip || null,
                plan: selectedPlanDetails?.name || '',
                plan_id: selectedPlanDetails?.id || null,
                ...(selectedPlanDetails?.plan_type === 'pack'
                    ? { credits_balance: selectedPlanDetails.credits || 0 }
                    : selectedPlanDetails?.plan_type === 'membership' ? { credits_balance: -1 } : {}),
                objective, birth_date: birthDate || null, status,
                organization_id: studentToEdit?.organization_id || orgId,
                unit_id: studentToEdit?.unit_id || (currentUnitId === orgId ? null : currentUnitId)
            };

            const studentId = studentToEdit?.id || (typeof window !== 'undefined' ? window.crypto.randomUUID() : 'temp-' + Date.now());
            if (avatarFile) { payload.avatar_url = await uploadAvatar(studentId); }
            else if (avatarUrl === null && studentToEdit) payload.avatar_url = null;

            if (discountActive) {
                payload.discount_type = discountType;
                payload.discount_value = parseFloat(discountValue);
                payload.discount_end_date = calculateDiscountEndDate();
            } else {
                payload.discount_type = null; payload.discount_value = null; payload.discount_end_date = null;
            }

            let error; let studentData: any;
            if (studentToEdit) {
                const { error: e, data: d } = await (supabase as any).from('students').update(payload).eq('id', studentToEdit.id).select().single();
                error = e; studentData = d;
            } else {
                const { error: e, data: d } = await (supabase as any).from('students').insert(payload).select().single();
                error = e; studentData = d;
            }
            if (error) throw error;

            if (!studentToEdit && studentData && selectedPlanDetails && selectedPlanDetails.price > 0 && orgId) {
                const finalPrice = calculateFinalPrice();
                await (supabase as any).from('invoices').insert({
                    organization_id: orgId, student_id: studentData.id, plan_id: selectedPlanDetails.id,
                    amount: finalPrice, status: 'PENDENTE', due_date: new Date().toISOString(),
                    description: `Matrícula: ${selectedPlanDetails.name}`, created_at: new Date().toISOString()
                });
            }

            toast({ title: studentToEdit ? 'Aluno atualizado!' : 'Aluno cadastrado com sucesso!' });
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast({ title: 'Erro ao salvar aluno', description: error.message, variant: 'destructive' });
        } finally { setLoading(false); }
    };

    return (<>
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[680px] p-0 gap-0 rounded-2xl overflow-hidden">

                {/* Header */}
                <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100">
                    <DialogTitle className="text-[17px] font-semibold text-slate-900 leading-tight">
                        {studentToEdit ? 'Editar aluno' : 'Nova matrícula'}
                    </DialogTitle>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {studentToEdit ? 'Atualize as informações e o plano do aluno.' : 'Preencha os dados para realizar uma nova matrícula.'}
                    </p>
                </DialogHeader>

                {/* Body */}
                <div className="px-6 py-5 space-y-5 max-h-[75vh] overflow-y-auto">

                    {/* Avatar */}
                    <div className="flex items-center gap-4">
                        <div className="relative group/avatar shrink-0">
                            <Avatar className="h-16 w-16 border-2 border-slate-100">
                                <AvatarImage src={avatarPreview || ''} className="object-cover" />
                                <AvatarFallback className="bg-bee-amber/10 text-bee-amber font-semibold text-lg">
                                    {fullName ? fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : <User className="h-7 w-7 opacity-40" />}
                                </AvatarFallback>
                            </Avatar>
                            <label className="absolute -bottom-1 -right-1 h-7 w-7 bg-white rounded-lg shadow border border-slate-200 flex items-center justify-center text-slate-400 hover:text-bee-amber cursor-pointer transition-colors">
                                <Camera className="h-3.5 w-3.5" />
                                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                            </label>
                            {(avatarPreview || avatarUrl) && (
                                <button onClick={() => { setAvatarPreview(null); setAvatarFile(null); setAvatarUrl(null); }} className="absolute -top-1 -right-1 h-6 w-6 bg-red-500 rounded-full text-white flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover/avatar:opacity-100">
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-700">Foto do aluno</p>
                            <p className="text-xs text-slate-400 mt-0.5">PNG, JPG ou WebP · máx. 5MB</p>
                        </div>
                    </div>

                    <hr className="border-slate-100" />
                    <p className="text-sm font-semibold text-slate-700">Dados pessoais</p>

                    <div className="space-y-1.5">
                        <Label className={labelCls}>Nome completo *</Label>
                        <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nome completo do aluno" className={fieldCls} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className={labelCls}>Email *</Label>
                            <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" className={fieldCls} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className={labelCls}>Celular / WhatsApp</Label>
                            <Input
                                value={phone}
                                onChange={e => setPhone(formatPhoneNumber(e.target.value))}
                                onBlur={() => { const d = phone.replace(/\D/g, ''); if (phone && d.length < 10) setPhoneError('Mínimo de 10 dígitos.'); else setPhoneError(''); }}
                                placeholder="(00) 00000-0000"
                                maxLength={15}
                                className={cn(fieldCls, phoneError && 'border-red-300')}
                            />
                            {phoneError && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{phoneError}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className={labelCls}>Data de nascimento</Label>
                            <Input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className={fieldCls} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className={labelCls}>CPF</Label>
                            <Input value={cpf} onChange={e => setCpf(formatCPF(e.target.value))} placeholder="000.000.000-00" maxLength={14} className={fieldCls} />
                        </div>
                    </div>

                    <hr className="border-slate-100" />
                    <p className="text-sm font-semibold text-slate-700">Endereço</p>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2 space-y-1.5">
                            <Label className={labelCls}>Rua</Label>
                            <Input
                                value={street}
                                onChange={e => { setStreet(e.target.value); if (e.target.value.trim()) setStreetError(''); }}
                                placeholder="Nome da rua"
                                className={cn(fieldCls, streetError && 'border-red-300')}
                            />
                            {streetError && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{streetError}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label className={labelCls}>Número</Label>
                            <Input value={addressNumber} onChange={e => setAddressNumber(e.target.value)} placeholder="123" className={fieldCls} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className={labelCls}>Complemento</Label>
                            <Input value={complement} onChange={e => setComplement(e.target.value)} placeholder="Apto, Bloco…" className={fieldCls} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className={labelCls}>Bairro</Label>
                            <Input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} placeholder="Nome do bairro" className={fieldCls} />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                            <Label className={labelCls}>CEP</Label>
                            <Input value={zip} onChange={e => setZip(formatZip(e.target.value))} placeholder="00000-000" maxLength={9} className={fieldCls} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className={labelCls}>Cidade</Label>
                            <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Cidade" className={fieldCls} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className={labelCls}>Estado</Label>
                            <Input value={addressState} onChange={e => setAddressState(e.target.value.toUpperCase().slice(0, 2))} placeholder="UF" maxLength={2} className={fieldCls} />
                        </div>
                    </div>

                    <hr className="border-slate-100" />
                    <p className="text-sm font-semibold text-slate-700">Plano e matrícula</p>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className={labelCls}>Plano</Label>
                            <Select value={plans.some(p => p.id === planId) ? planId : undefined} onValueChange={setPlanId}>
                                <SelectTrigger className={fieldCls}>
                                    <SelectValue placeholder="Selecione o plano…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {plansLoading ? (
                                        <div className="py-4 flex items-center justify-center gap-2 text-sm text-slate-400">
                                            <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
                                        </div>
                                    ) : plans.length === 0 ? (
                                        <div className="py-4 text-sm text-slate-400 text-center">Nenhum plano disponível</div>
                                    ) : plans.map(p => (
                                        <SelectItem key={p.id} value={p.id}>
                                            <div className="flex flex-col">
                                                <span>{p.name}</span>
                                                <span className="text-xs text-slate-400">
                                                    {p.plan_type === 'pack' ? `${p.credits ?? '∞'} créditos` : (p.days_per_week ? `${p.days_per_week}x/semana` : 'Ilimitado')}
                                                    {p.price > 0 && ` · R$ ${p.price}`}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className={labelCls}>Status da matrícula</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className={fieldCls}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ACTIVE">
                                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" />Matrícula Ativa</div>
                                    </SelectItem>
                                    <SelectItem value="INACTIVE">
                                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-300" />Matrícula Inativa</div>
                                    </SelectItem>
                                    <SelectItem value="OVERDUE">
                                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500" />Inadimplente</div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Plan summary */}
                    {selectedPlanDetails && (
                        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <div>
                                <p className="text-sm font-semibold text-slate-800">{selectedPlanDetails.name}</p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {selectedPlanDetails.plan_type === 'pack' ? `${selectedPlanDetails.credits ?? '∞'} créditos` : (selectedPlanDetails.days_per_week ? `${selectedPlanDetails.days_per_week}x/semana` : 'Uso ilimitado')}
                                    {selectedPlanDetails.recurrence && ` · ${recurrenceLabel[selectedPlanDetails.recurrence] || selectedPlanDetails.recurrence}`}
                                </p>
                            </div>
                            <span className="text-base font-bold text-bee-amber">
                                {(selectedPlanDetails.price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </div>
                    )}

                    {/* Discount section (permission-gated) */}
                    {canManageDiscounts && (
                        <div className={cn('rounded-xl border transition-colors', discountActive ? 'border-bee-amber/20 bg-bee-amber/5' : 'border-slate-200')}>
                            <div className="px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-slate-400" />
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">Desconto promocional</p>
                                        <p className="text-xs text-slate-400">Condição especial de pagamento</p>
                                    </div>
                                </div>
                                <Switch checked={discountActive} onCheckedChange={setDiscountActive} className="data-[state=checked]:bg-bee-amber" />
                            </div>

                            {discountActive && (
                                <div className="px-4 pb-4 space-y-3 border-t border-bee-amber/10 pt-3 animate-in fade-in duration-200">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className={labelCls}>Valor do desconto</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    type="number"
                                                    value={discountValue}
                                                    onChange={e => setDiscountValue(e.target.value)}
                                                    placeholder={discountType === 'percent' ? '10' : '50,00'}
                                                    className={cn(fieldCls, 'flex-1')}
                                                />
                                                <div className="flex rounded-xl border border-slate-200 bg-white overflow-hidden shrink-0">
                                                    <button onClick={() => setDiscountType('percent')} className={cn('px-3 text-sm transition-colors', discountType === 'percent' ? 'bg-bee-amber text-bee-midnight font-semibold' : 'text-slate-400 hover:text-slate-600')}>%</button>
                                                    <button onClick={() => setDiscountType('fixed')} className={cn('px-3 text-sm transition-colors', discountType === 'fixed' ? 'bg-bee-amber text-bee-midnight font-semibold' : 'text-slate-400 hover:text-slate-600')}>R$</button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className={labelCls}>Duração do benefício</Label>
                                            <Select value={discountDuration} onValueChange={setDiscountDuration}>
                                                <SelectTrigger className={fieldCls}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1_month">Apenas no 1º mês</SelectItem>
                                                    <SelectItem value="3_months">3 meses</SelectItem>
                                                    <SelectItem value="6_months">6 meses</SelectItem>
                                                    <SelectItem value="12_months">12 meses</SelectItem>
                                                    <SelectItem value="indefinite">Vitalício</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    {selectedPlanDetails && (
                                        <div className="flex items-center justify-between rounded-xl bg-white border border-bee-amber/20 px-4 py-3">
                                            <span className="text-sm text-slate-600">Mensalidade após desconto</span>
                                            <span className="text-base font-bold text-bee-amber">
                                                {calculateFinalPrice()?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <hr className="border-slate-100" />
                    <p className="text-sm font-semibold text-slate-700">Objetivo</p>

                    <div className="space-y-1.5">
                        <Label className={labelCls}>Objetivo principal</Label>
                        <Select value={objective} onValueChange={setObjective}>
                            <SelectTrigger className={fieldCls}>
                                <SelectValue placeholder="Selecione o objetivo…" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Hipertrofia">Hipertrofia (Ganho de Massa)</SelectItem>
                                <SelectItem value="Emagrecimento">Emagrecimento (Perda de Peso)</SelectItem>
                                <SelectItem value="Condicionamento">Condicionamento Físico</SelectItem>
                                <SelectItem value="Saúde/Bem-estar">Saúde &amp; Bem-estar</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                </div>

                {/* Footer */}
                <div className="px-6 pb-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="h-9 rounded-full px-5 border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium"
                    >
                        Cancelar
                    </Button>
                    <Button
                        disabled={loading}
                        onClick={handleSubmit}
                        className="h-9 rounded-full px-6 bg-bee-amber hover:bg-amber-500 text-bee-midnight font-semibold text-sm shadow-sm"
                    >
                        {loading
                            ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Processando…</>
                            : studentToEdit ? 'Salvar alterações' : 'Concluir matrícula'
                        }
                    </Button>
                </div>

            </DialogContent>
        </Dialog>

        <UpgradePromptModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} featureName={`Limite de ${maxStudents} alunos ativos`} />
    </>);
}
