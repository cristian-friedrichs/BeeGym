'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Save, X, User, CreditCard, Tag, CalendarIcon, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { addMonths, format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Trash2 } from 'lucide-react';

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
    duration_months: number | null;
    recurrence: 'monthly' | 'quarterly' | 'yearly' | null;
    days_per_week: number | null;
    credits: number | null;
    active: boolean;
}

const recurrenceLabel: Record<string, string> = {
    monthly: 'Mensal',
    quarterly: 'Trimestral',
    yearly: 'Anual',
};

export function StudentModal({ open, onOpenChange, studentToEdit, onSuccess }: StudentModalProps) {
    const supabase = createClient();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    // Student Basic Info
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [planId, setPlanId] = useState('');
    const [objective, setObjective] = useState('');
    const [status, setStatus] = useState('ACTIVE');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    // Plans & Discounts
    const [plans, setPlans] = useState<Plan[]>([]);
    const [selectedPlanDetails, setSelectedPlanDetails] = useState<Plan | null>(null);
    const [canManageDiscounts, setCanManageDiscounts] = useState(false); // Permission check
    const [discountActive, setDiscountActive] = useState(false);
    const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
    const [discountValue, setDiscountValue] = useState<string>('');
    const [discountDuration, setDiscountDuration] = useState<string>('indefinite');

    useEffect(() => {
        if (open) {
            fetchPlans();
            checkPermissions();

            if (studentToEdit) {
                setFullName(studentToEdit.full_name || '');
                setEmail(studentToEdit.email || '');
                setPhone(studentToEdit.phone || '');
                setPlanId(studentToEdit.plan || ''); // Note: 'plan' column might store name or ID depending on legacy. Assuming ID/Value matching select now.
                setObjective(studentToEdit.objective || '');
                setStatus(studentToEdit.status || 'ACTIVE');

                // Load existing discount if any
                if (studentToEdit.discount_type && studentToEdit.discount_value) {
                    setDiscountActive(true);
                    setDiscountType(studentToEdit.discount_type);
                    setDiscountValue(studentToEdit.discount_value.toString());
                    // Rough logic to determine duration key from date would be complex;
                    // For editing, we might just show "Custom" or the date.
                    // For now, let's reset duration select or handle 'indefinite' if null
                    setDiscountDuration(studentToEdit.discount_end_date ? 'custom' : 'indefinite');
                } else {
                    setDiscountActive(false);
                    setDiscountType('percent');
                    setDiscountValue('');
                    setDiscountDuration('indefinite');
                }

                setAvatarUrl(studentToEdit.avatar_url || null);
                setAvatarPreview(studentToEdit.avatar_url || null);
                setAvatarFile(null);

            } else {
                // New Student Reset
                setFullName(''); setEmail(''); setPhone('');
                setPlanId(''); setObjective(''); setStatus('ACTIVE');
                setDiscountActive(false);
                setDiscountType('percent');
                setDiscountValue('');
                setDiscountDuration('indefinite');
                setAvatarUrl(null);
                setAvatarPreview(null);
                setAvatarFile(null);
            }
        }
    }, [open, studentToEdit]);

    // Update selectedPlanDetails when planId changes or plans loads
    useEffect(() => {
        if (planId && plans.length > 0) {
            const found = plans.find(p => p.name === planId) || plans.find(p => p.id === planId);
            // Fallback strategy: if planId is "Plano Gold", try to find name "Plano Gold"
            // If planId matches a fallback ID, use that.
            setSelectedPlanDetails(found || null);
        } else {
            setSelectedPlanDetails(null);
        }
    }, [planId, plans]);

    const fetchPlans = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: profile } = await (supabase as any)
                .from('profiles')
                .select('organization_id')
                .eq('id', user?.id || '')
                .single();

            const { data, error } = await (supabase as any)
                .from('membership_plans')
                .select('id, name, description, price, plan_type, duration_months, recurrence, days_per_week, credits, active')
                .eq('active', true)
                .eq('organization_id', profile?.organization_id || '')
                .order('price');
            if (!error && data) setPlans(data as Plan[]);
        } catch (error) {
            console.error('Error fetching plans:', error);
        }
    };

    const checkPermissions = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get profile to check role
            const { data: profile } = await (supabase as any)
                .from('profiles')
                .select('role_id, app_roles(name)')
                .eq('id', user.id)
                .single();

            // Check if role is admin or manager
            // Since app_roles might be empty in your current DB, we add a temporary BYPASS:
            // If NO role found, or role is null, we DEFAULT TO TRUE for testing purposes
            // TODO: Remove this bypass once roles are properly set up
            if (!profile?.app_roles) {
                setCanManageDiscounts(true); // Temporary bypass for testing
                return;
            }

            const roleName = (profile?.app_roles as any)?.name?.toLowerCase();
            if (roleName === 'admin' || roleName === 'manager') {
                setCanManageDiscounts(true);
            } else {
                setCanManageDiscounts(false);
            }

        } catch (error) {
            console.error('Error checking permissions:', error);
            setCanManageDiscounts(true); // Fallback to true on error for now
        }
    };

    const calculateDiscountEndDate = (): string | null => {
        const today = new Date();
        switch (discountDuration) {
            case '1_month': return addMonths(today, 1).toISOString();
            case '3_months': return addMonths(today, 3).toISOString();
            case '6_months': return addMonths(today, 6).toISOString();
            case '12_months': return addMonths(today, 12).toISOString();
            case 'indefinite': return null;
            case 'custom': return null; // Logic for custom date if needed later
            default: return null;
        }
    };

    const calculateFinalPrice = () => {
        if (!selectedPlanDetails || !discountActive || !discountValue) return selectedPlanDetails?.price;

        const val = parseFloat(discountValue);
        if (isNaN(val)) return selectedPlanDetails.price;

        let final = selectedPlanDetails.price;
        if (discountType === 'percent') {
            final = selectedPlanDetails.price - (selectedPlanDetails.price * (val / 100));
        } else {
            final = selectedPlanDetails.price - val;
        }
        return Math.max(0, final);
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadAvatar = async (studentId: string) => {
        if (!avatarFile) return avatarUrl;

        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${studentId}-${Math.random()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await (supabase.storage as any)
            .from('students')
            .upload(filePath, avatarFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = (supabase.storage as any)
            .from('students')
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const handleSubmit = async () => {
        if (!fullName || !email) {
            toast({ title: "Nome e Email são obrigatórios", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const { data: profile } = await (supabase as any).from('profiles').select('organization_id').eq('id', user.id).single();

            const payload: any = {
                full_name: fullName,
                email,
                phone,
                plan: selectedPlanDetails?.name || planId, // Legacy text column
                plan_id: selectedPlanDetails?.id,          // FK Relation
                // Initialize credits if pack plan
                ...(selectedPlanDetails?.plan_type === 'pack' ? { credits_balance: selectedPlanDetails.credits } : {}),
                objective,
                status,
                organization_id: profile?.organization_id
            };

            // 1. If we have a temporary ID for new student, we need it for the avatar filename
            // For updates, we use studentToEdit.id
            const studentId = studentToEdit?.id || crypto.randomUUID();

            // 2. Upload Avatar if changed
            if (avatarFile) {
                const uploadedUrl = await uploadAvatar(studentId);
                payload.avatar_url = uploadedUrl;
            } else if (avatarUrl === null && studentToEdit) {
                payload.avatar_url = null;
            }

            // Add discount fields if active
            if (discountActive) {
                payload.discount_type = discountType;
                payload.discount_value = parseFloat(discountValue);
                payload.discount_end_date = calculateDiscountEndDate();
            } else {
                // Reset/Clear discount if toggled off
                payload.discount_type = null;
                payload.discount_value = null;
                payload.discount_end_date = null;
            }

            let error;
            if (studentToEdit) {
                const { error: updateError } = await (supabase as any).from('students').update(payload).eq('id', studentToEdit.id);
                error = updateError;
            } else {
                const { error: insertError } = await (supabase as any).from('students').insert(payload);
                error = insertError;
            }

            if (error) throw error;

            toast({ title: studentToEdit ? "Aluno atualizado!" : "Aluno cadastrado com sucesso!" });
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
            toast({ title: "Erro ao salvar aluno", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const formatPhoneNumber = (value: string) => {
        const clean = value.replace(/\D/g, '');
        const limited = clean.slice(0, 11);
        if (limited.length <= 2) return limited;
        if (limited.length <= 6) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
        if (limited.length <= 10) return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
        return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPhone(formatPhoneNumber(e.target.value));
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[650px] flex flex-col h-full overflow-y-auto w-full">
                <SheetHeader className="space-y-3 pb-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                            <UserPlus className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                            <SheetTitle className="text-xl">
                                {studentToEdit ? 'Editar Aluno' : 'Novo Aluno'}
                            </SheetTitle>
                            <SheetDescription>
                                {studentToEdit ? 'Atualize as informações do aluno e do plano.' : 'Preencha os dados básicos e selecione um plano.'}
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 py-6 space-y-6">
                    {/* Avatar Upload Selection */}
                    <div className="flex flex-col items-center justify-center p-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 gap-4">
                        <div className="relative group">
                            <Avatar className="h-24 w-24 border-4 border-white shadow-sm ring-1 ring-slate-100">
                                <AvatarImage src={avatarPreview || ''} className="object-cover" />
                                <AvatarFallback className="bg-orange-100 text-orange-600 font-black text-2xl">
                                    {fullName ? fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : <User className="h-10 w-10 text-orange-300" />}
                                </AvatarFallback>
                            </Avatar>
                            <label className="absolute bottom-0 right-0 h-8 w-8 bg-white rounded-full shadow-lg border border-slate-100 flex items-center justify-center text-slate-400 hover:text-bee-amber transition-all cursor-pointer hover:scale-110">
                                <Camera className="h-4 w-4" />
                                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                            </label>
                            {(avatarPreview || avatarUrl) && (
                                <button
                                    onClick={() => { setAvatarPreview(null); setAvatarFile(null); setAvatarUrl(null); }}
                                    className="absolute -top-1 -right-1 h-6 w-6 bg-red-500 rounded-full shadow-sm text-white flex items-center justify-center hover:bg-red-600 transition-all scale-0 group-hover:scale-100"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-bold text-deep-midnight">Foto do Aluno</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">PNG, JPG até 5MB</p>
                        </div>
                    </div>

                    {/* Dados Pessoais */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                            <User className="h-4 w-4" /> DADOS PESSOAIS
                        </h3>
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">Nome Completo *</Label>
                                <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Ex: João da Silva" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-slate-700">Email *</Label>
                                    <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="joao@email.com" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-slate-700">Telefone</Label>
                                    <Input value={phone} onChange={handlePhoneChange} placeholder="(11) 99999-9999" maxLength={15} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Plano e Financeiro */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                            <CreditCard className="h-4 w-4" /> PLANO E FINANCEIRO
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">Plano Selecionado</Label>
                                <Select value={planId} onValueChange={setPlanId}>
                                    <SelectTrigger className="h-11 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-xl focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                                        <SelectValue placeholder="Selecione um plano..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {plans.map(p => (
                                            <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem> // Value matches DB 'plan' column usage (often name)
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">Status da Matrícula</Label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger className="h-11 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-xl focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ACTIVE">Ativo</SelectItem>
                                        <SelectItem value="INACTIVE">Inativo</SelectItem>
                                        <SelectItem value="OVERDUE">Inadimplente</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Resumo do Plano */}
                        {selectedPlanDetails && (
                            <Card className="bg-slate-50 border-slate-200">
                                <CardContent className="p-4 flex justify-between items-center gap-4">
                                    <div className="flex flex-col gap-1">
                                        <p className="font-semibold text-slate-800">{selectedPlanDetails.name}</p>
                                        {selectedPlanDetails.description && (
                                            <p className="text-xs text-slate-500">{selectedPlanDetails.description}</p>
                                        )}
                                        <div className="flex gap-2 mt-1 flex-wrap">
                                            {selectedPlanDetails.plan_type === 'pack' ? (
                                                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">{selectedPlanDetails.credits} Créditos</Badge>
                                            ) : selectedPlanDetails.days_per_week ? (
                                                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">{selectedPlanDetails.days_per_week}x por semana</Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Acesso Ilimitado</Badge>
                                            )}
                                            {selectedPlanDetails.recurrence && (
                                                <Badge variant="outline" className="text-xs">{recurrenceLabel[selectedPlanDetails.recurrence] || selectedPlanDetails.recurrence}</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-2xl font-bold text-orange-600">
                                            {(selectedPlanDetails.price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Área de Desconto (Restrita) */}
                        {canManageDiscounts && (
                            <div className="space-y-4 border rounded-lg p-4 border-dashed border-slate-300">
                                <div className="flex items-center justify-between">
                                    <Label className="flex items-center gap-2 cursor-pointer" htmlFor="discount-toggle">
                                        <Tag className="h-4 w-4 text-orange-500" />
                                        <span className="font-medium text-slate-700">Aplicar Desconto Promocional</span>
                                    </Label>
                                    <Switch
                                        id="discount-toggle"
                                        checked={discountActive}
                                        onCheckedChange={setDiscountActive}
                                    />
                                </div>

                                {discountActive && (
                                    <div className="space-y-4 pt-2 animate-in slide-in-from-top-2 fade-in duration-300">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-medium text-slate-600">Valor do Desconto</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        type="number"
                                                        value={discountValue}
                                                        onChange={e => setDiscountValue(e.target.value)}
                                                        placeholder={discountType === 'percent' ? "10" : "50.00"}
                                                        className="flex-1"
                                                    />
                                                    <div className="flex bg-slate-100 rounded-md border p-1">
                                                        <button
                                                            className={`px-3 text-sm font-medium rounded-sm transition-colors ${discountType === 'percent' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}
                                                            onClick={() => setDiscountType('percent')}
                                                        >
                                                            %
                                                        </button>
                                                        <button
                                                            className={`px-3 text-sm font-medium rounded-sm transition-colors ${discountType === 'fixed' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}
                                                            onClick={() => setDiscountType('fixed')}
                                                        >
                                                            R$
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-xs font-medium text-slate-600">Duração</Label>
                                                <Select value={discountDuration} onValueChange={setDiscountDuration}>
                                                    <SelectTrigger className="h-11 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-xl focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="1_month">1º Mês apenas</SelectItem>
                                                        <SelectItem value="3_months">3 Meses</SelectItem>
                                                        <SelectItem value="6_months">6 Meses</SelectItem>
                                                        <SelectItem value="12_months">12 Meses</SelectItem>
                                                        <SelectItem value="indefinite">Indeterminado (Sempre)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Preço Final Calculado */}
                                        {selectedPlanDetails && (
                                            <div className="bg-orange-50 rounded-md p-3 flex justify-between items-center text-sm border border-orange-100">
                                                <span className="text-orange-800 font-medium">Preço Final com Desconto:</span>
                                                <div className="text-right">
                                                    <span className="font-bold text-orange-700 text-lg">
                                                        {calculateFinalPrice()?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </span>
                                                    {calculateDiscountEndDate() && (
                                                        <p className="text-xs text-orange-600">
                                                            Válido até: {format(new Date(calculateDiscountEndDate()!), 'dd/MM/yyyy')}
                                                        </p>
                                                    )}
                                                    {discountDuration === 'indefinite' && (
                                                        <p className="text-xs text-orange-600">Válido por tempo indeterminado</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Objetivo Principal</Label>
                        <Select value={objective} onValueChange={setObjective}>
                            <SelectTrigger className="h-11 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-xl focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Hipertrofia">Hipertrofia</SelectItem>
                                <SelectItem value="Emagrecimento">Emagrecimento</SelectItem>
                                <SelectItem value="Condicionamento">Condicionamento</SelectItem>
                                <SelectItem value="Saúde/Bem-estar">Saúde/Bem-estar</SelectItem>
                            </SelectContent>
                        </Select>
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
