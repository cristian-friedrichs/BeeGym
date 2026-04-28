'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
    Loader2, UserPlus, Save, X, User, CreditCard, Tag,
    CalendarIcon, AlertCircle, Check, Camera, Trash2,
    Mail, Phone, Hash, Shield, Info, Lock, ChevronRight
} from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useStudentLimit } from '@/hooks/useStudentLimit';
import { UpgradePromptModal } from '@/components/ui/upgrade-prompt-modal';
import { format, addMonths } from 'date-fns';
import { useUnit } from '@/context/UnitContext';

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
    type?: string; // Aliases for legacy/frontend logic
    duration_months: number | null;
    recurrence: 'monthly' | 'quarterly' | 'yearly' | 'one_time' | null;
    frequency?: string; // Aliases for legacy/frontend logic
    days_per_week: number | null;
    credits: number | null;
    checkin_limit?: number | null; // Aliases for legacy/frontend logic
    active: boolean;
}

const recurrenceLabel: Record<string, string> = {
    monthly: 'Mensal',
    quarterly: 'Trimestral',
    yearly: 'Anual',
};

export function StudentModal({ open, onOpenChange, studentToEdit, onSuccess }: StudentModalProps) {
    const supabase = createClient(); // Instantiate the client locally like other modals
    const { toast } = useToast();
    const { maxStudents, organizationId } = useSubscription();
    const { canAddStudent, hasReachedLimit, activeCount } = useStudentLimit();
    const { currentUnitId } = useUnit();
    const [loading, setLoading] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // Student Basic Info
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

    // Address
    const [street, setStreet] = useState('');
    const [addressNumber, setAddressNumber] = useState('');
    const [complement, setComplement] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [city, setCity] = useState('');
    const [addressState, setAddressState] = useState('');
    const [zip, setZip] = useState('');

    // Validation errors
    const [phoneError, setPhoneError] = useState('');
    const [streetError, setStreetError] = useState('');

    // Plans & Discounts
    const [plans, setPlans] = useState<Plan[]>([]);
    const [plansLoading, setPlansLoading] = useState(false);
    const [selectedPlanDetails, setSelectedPlanDetails] = useState<Plan | null>(null);
    const [canManageDiscounts, setCanManageDiscounts] = useState(false); // Permission check
    const [discountActive, setDiscountActive] = useState(false);
    const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
    const [discountValue, setDiscountValue] = useState<string>('');
    const [discountDuration, setDiscountDuration] = useState<string>('indefinite');

    // Priority 1: Current student's org
    // Priority 2: Current context organizationId
    // Priority 3: Try to find organizationId from profiles if still missing (for SuperAdmins)
    useEffect(() => {
        if (!open) return;

        const resolveAndFetch = async () => {
            console.log('[StudentModal] Resolving organizationId...', { 
                studentToEditOrg: studentToEdit?.organization_id, 
                subscriptionOrg: organizationId 
            });

            let targetOrgId = studentToEdit?.organization_id || organizationId;

            if (!targetOrgId) {
                const { data: { user: currentUser } } = await supabase.auth.getUser();
                if (currentUser) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('organization_id')
                        .eq('id', currentUser.id)
                        .single() as { data: { organization_id: string } | null };

                    if (profile?.organization_id) {
                        console.log('[StudentModal] Resolved org from profile:', profile.organization_id);
                        targetOrgId = profile.organization_id;
                    }
                }
            }

            if (targetOrgId) {
                console.log('[StudentModal] Organization resolved. Fetching plans for:', targetOrgId);
                fetchPlans(targetOrgId);
                checkPermissions();
            } else {
                console.warn('[StudentModal] No organizationId found after resolution attempt.');
            }
        };

        resolveAndFetch();
    }, [open, studentToEdit?.organization_id, organizationId]);

    // Separate useEffect for data initialization to avoid logic conflicts
    useEffect(() => {
        if (open && studentToEdit) {
            console.log('[StudentModal] Initializing with student data:', studentToEdit.full_name);
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

            // Load existing discount if any
            if (studentToEdit.discount_type && studentToEdit.discount_value) {
                setDiscountActive(true);
                setDiscountType(studentToEdit.discount_type);
                setDiscountValue(studentToEdit.discount_value.toString());
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
        } else if (open && !studentToEdit) {
            console.log('[StudentModal] Resetting for new student');
            // New Student Reset
            setFullName(''); setEmail(''); setPhone(''); setCpf('');
            setStreet(''); setAddressNumber(''); setComplement('');
            setNeighborhood(''); setCity(''); setAddressState(''); setZip('');
            setPlanId(''); setObjective(''); setBirthDate(''); setStatus('ACTIVE');
            setPhoneError(''); setStreetError('');
            setDiscountActive(false);
            setDiscountType('percent');
            setDiscountValue('');
            setDiscountDuration('indefinite');
            setAvatarUrl(null);
            setAvatarPreview(null);
            setAvatarFile(null);
        }
    }, [open, studentToEdit]);

    // Update selectedPlanDetails when planId changes or plans loads
    useEffect(() => {
        if (planId && plans.length > 0) {
            // Priority: Match by exact ID, then by name (legacy support)
            const found = plans.find(p => p.id === planId) || plans.find(p => p.name === planId);

            if (found) {
                // If it's a name match (legacy), silently normalize to ID
                if (found.name === planId && found.id !== planId) {
                    setPlanId(found.id);
                }
                setSelectedPlanDetails(found);
            } else {
                setSelectedPlanDetails(null);
            }
        } else {
            setSelectedPlanDetails(null);
        }
    }, [planId, plans]);

    const fetchPlans = async (orgId?: string) => {
        const targetOrgId = orgId || organizationId;
        if (!targetOrgId) return;

        setPlansLoading(true);
        try {
            console.log('[StudentModal] Fetching plans for org:', targetOrgId);
            const { data, error } = await supabase
                .from('membership_plans')
                .select('*')
                .eq('organization_id', targetOrgId)
                .order('name');

            if (error) {
                console.error('[StudentModal] Supabase error fetching plans:', error);
                throw error;
            }

            if (data) {
                console.log('[StudentModal] All Plans fetched:', data.length);
                const fetchedPlans = (data as any[]).map(p => ({
                    ...p,
                    type: p.plan_type, // Alias for frontend usage
                    frequency: p.recurrence, // Alias for frontend usage
                    checkin_limit: p.credits // Alias for frontend usage
                })) as Plan[];
                // Filter to keep active plans OR the currently assigned plan
                const filteredPlans = fetchedPlans.filter(p => 
                    p.active || 
                    (studentToEdit && (p.id === studentToEdit.plan_id || p.name === studentToEdit.plan))
                );
                setPlans(filteredPlans);
            }
        } catch (error) {
            console.error('[StudentModal] Error fetching plans:', error);
            toast({
                title: 'Erro ao carregar planos',
                description: 'Não foi possível carregar os planos de venda.',
                variant: 'destructive'
            });
        } finally {
            setPlansLoading(false);
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
        if (!file) return;
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            toast({ title: "Formato inválido", description: "Use PNG, JPG ou WebP.", variant: "destructive" });
            e.target.value = '';
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast({ title: "Arquivo muito grande", description: "A foto deve ter no máximo 5MB.", variant: "destructive" });
            e.target.value = '';
            return;
        }
        setAvatarFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setAvatarPreview(reader.result as string);
        reader.readAsDataURL(file);
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
        if (!fullName.trim()) {
            toast({ title: "Nome é obrigatório", variant: "destructive" });
            return;
        }
        if (!email.trim()) {
            toast({ title: "Email é obrigatório", variant: "destructive" });
            return;
        }
        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            toast({ title: "Email inválido", description: "Por favor, insira um endereço de e-mail válido.", variant: "destructive" });
            return;
        }

        // Phone validation: require at least 10 digits
        const phoneDigits = phone.replace(/\D/g, '');
        if (phone && phoneDigits.length < 10) {
            setPhoneError('Telefone inválido. Mínimo de 10 dígitos.');
            return;
        }
        setPhoneError('');

        // ZIP validation: require 8 digits when filled
        const zipDigits = zip.replace(/\D/g, '');
        if (zip && zipDigits.length < 8) {
            toast({ title: "CEP inválido", description: "O CEP deve ter 8 dígitos.", variant: "destructive" });
            return;
        }

        // Street validation: required when any address field is filled
        if (!street.trim() && (city.trim() || neighborhood.trim() || zip.trim())) {
            setStreetError('Endereço (Rua) é obrigatório.');
            toast({ title: "Endereço incompleto", description: "Preencha o campo Rua.", variant: "destructive" });
            return;
        }
        setStreetError('');

        // Discount validation
        if (discountActive && discountValue) {
            const dv = parseFloat(discountValue);
            if (isNaN(dv) || dv <= 0) {
                toast({ title: "Desconto inválido", description: "O valor do desconto deve ser maior que zero.", variant: "destructive" });
                return;
            }
            if (discountType === 'percent' && dv >= 100) {
                toast({ title: "Desconto inválido", description: "O desconto percentual deve ser menor que 100%.", variant: "destructive" });
                return;
            }
            if (discountType === 'fixed' && selectedPlanDetails && dv >= selectedPlanDetails.price) {
                toast({ title: "Desconto inválido", description: "O desconto fixo não pode ser igual ou maior que o valor do plano.", variant: "destructive" });
                return;
            }
        }

        // --- STUDENT LIMIT GUARD ---
        // Block new student creation when limit is reached
        if (!studentToEdit && !canAddStudent) {
            setShowUpgradeModal(true);
            return;
        }

        // Block reactivation (INACTIVE → ACTIVE) when limit is reached
        if (studentToEdit && status === 'ACTIVE' && studentToEdit.status !== 'ACTIVE' && hasReachedLimit) {
            setShowUpgradeModal(true);
            return;
        }
        // ----------------------------

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const { data: profile } = await (supabase as any).from('profiles').select('organization_id').eq('id', user.id).single() as { data: { organization_id: string } | null };
            const organizationId = profile?.organization_id;

            const payload: any = {
                full_name: fullName,
                email,
                phone,
                cpf: cpf || null,
                address_street: street || null,
                address_number: addressNumber || null,
                address_complement: complement || null,
                address_neighborhood: neighborhood || null,
                address_city: city || null,
                address_state: addressState || null,
                address_zip: zip || null,
                plan: selectedPlanDetails?.name || '', // Legacy text column
                plan_id: selectedPlanDetails?.id || null, // FK Relation
                // Initialize credits if pack plan
                ...(selectedPlanDetails?.type === 'checkin' ? { credits_balance: selectedPlanDetails.checkin_limit } : {}),
                objective,
                birth_date: birthDate || null,
                status,
                organization_id: studentToEdit?.organization_id || organizationId,
                unit_id: studentToEdit?.unit_id || (currentUnitId === organizationId ? null : currentUnitId)
            };

            // 1. If we have a temporary ID for new student, we need it for the avatar filename
            // For updates, we use studentToEdit.id
            const studentId = studentToEdit?.id || (typeof window !== 'undefined' ? window.crypto.randomUUID() : 'temp-' + Date.now());

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
            let studentData: any;
            if (studentToEdit) {
                const { error: updateError, data: updatedData } = await (supabase as any).from('students').update(payload).eq('id', studentToEdit.id).select().single();
                error = updateError;
                studentData = updatedData;
            } else {
                const { error: insertError, data: insertedData } = await (supabase as any).from('students').insert(payload).select().single();
                error = insertError;
                studentData = insertedData;
            }

            if (error) throw error;

            if (!organizationId) {
                console.error('Organization ID missing during post-save processing');
                return;
            }

            // --- AUTOMATED INVOICE GENERATION ---
            // If it's a new student and they selected a plan with a price > 0, generate the first invoice
            if (!studentToEdit && studentData && selectedPlanDetails && selectedPlanDetails.price > 0) {
                const finalPrice = calculateFinalPrice();
                const firstInvoice = {
                    organization_id: organizationId,
                    student_id: studentData.id,
                    plan_id: selectedPlanDetails.id,
                    amount: finalPrice,
                    status: 'PENDENTE',
                    due_date: new Date().toISOString(), // First payment is due today (enrollment day)
                    description: `Matrícula: ${selectedPlanDetails.name}`,
                    created_at: new Date().toISOString()
                };

                const { error: invoiceError } = await (supabase as any)
                    .from('invoices')
                    .insert(firstInvoice);

                if (invoiceError) {
                    console.error('Error creating first invoice:', invoiceError);
                    // We don't throw here to not block student creation success, 
                    // but we log it.
                }
            }
            // ------------------------------------

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

    return (<>
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-2xl p-0 overflow-hidden border-l border-slate-100 shadow-2xl flex flex-col h-full bg-white">
                <SheetHeader className="p-6 border-b border-slate-50 bg-white shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="h-12 w-12 rounded-xl bg-bee-amber/10 flex items-center justify-center border border-bee-amber/20">
                            <UserPlus className="h-6 w-6 text-bee-amber" />
                        </div>
                        <div className="text-left">
                            <div className="flex items-center gap-2 mb-0.5">
                                <SheetTitle className="text-xl font-bold tracking-tight text-bee-midnight uppercase">
                                    {studentToEdit ? 'Editar Aluno' : 'Nova Matrícula'}
                                </SheetTitle>
                                <Badge className="bg-bee-amber text-bee-midnight border-none font-black uppercase text-[10px] tracking-tight h-5 px-2 rounded-full">
                                    Inscrição
                                </Badge>
                            </div>
                            <SheetDescription className="text-slate-400 font-medium text-xs">
                                {studentToEdit ? 'Atualize as informações e o plano do aluno.' : 'Preencha os dados para realizar uma nova matrícula.'}
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto">
                    <div className="p-8 space-y-8">
                        {/* Avatar Upload Selection */}
                        <div className="flex flex-col items-center justify-center p-10 bg-slate-50/50 rounded-[40px] border border-slate-100 gap-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-bee-amber/[0.03] rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/[0.02] rounded-full -ml-16 -mb-16 blur-3xl opacity-50" />

                            <div className="relative group/avatar">
                                <Avatar className="h-32 w-32 border-4 border-white shadow-2xl ring-1 ring-slate-100 transition-all duration-500 group-hover/avatar:scale-105 group-hover/avatar:rotate-1">
                                    <AvatarImage src={avatarPreview || ''} className="object-cover" />
                                    <AvatarFallback className="bg-gradient-to-br from-bee-amber/10 to-amber-200/20 text-bee-amber font-black text-4xl">
                                        {fullName ? fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : <User className="h-12 w-12 opacity-30" />}
                                    </AvatarFallback>
                                </Avatar>
                                <label className="absolute bottom-1 right-1 h-10 w-10 bg-white rounded-2xl shadow-xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-bee-amber transition-all cursor-pointer hover:scale-110 active:scale-90 z-20 hover:rotate-6">
                                    <Camera className="h-5 w-5" />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                </label>
                                {(avatarPreview || avatarUrl) && (
                                    <button
                                        onClick={() => { setAvatarPreview(null); setAvatarFile(null); setAvatarUrl(null); }}
                                        className="absolute -top-1 -right-1 h-8 w-8 bg-red-500 rounded-xl shadow-lg text-white flex items-center justify-center hover:bg-red-600 transition-all scale-0 group-hover/avatar:scale-100 active:scale-90 z-20 rotate-12"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            <div className="text-center space-y-1.5 relative">
                                <p className="text-sm font-black text-bee-midnight uppercase tracking-tight">Foto de Identificação</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                                    <Info className="h-3 w-3 text-slate-400" />
                                    PNG ou JPG até 5MB
                                </p>
                            </div>
                        </div>

                        {/* Dados Pessoais */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-bee-amber/10 flex items-center justify-center">
                                    <User className="h-4 w-4 text-bee-amber" />
                                </div>
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Dados Pessoais</h3>
                            </div>

                            <div className="grid grid-cols-1 gap-5">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome Completo do Aluno</Label>
                                    <Input
                                        value={fullName}
                                        onChange={e => setFullName(e.target.value)}
                                        placeholder="Nome completo do aluno"
                                        className="h-11 border-slate-100 bg-slate-50/50 rounded-2xl transition-all font-semibold text-bee-midnight px-5 focus:ring-bee-amber/20"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Endereço de Email</Label>
                                        <Input
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            placeholder="email@exemplo.com"
                                            className="h-11 border-slate-100 bg-slate-50/50 rounded-2xl transition-all font-semibold text-bee-midnight px-5 focus:ring-bee-amber/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Celular / WhatsApp</Label>
                                        <Input
                                            value={phone}
                                            onChange={handlePhoneChange}
                                            onBlur={() => {
                                                const digits = phone.replace(/\D/g, '');
                                                if (phone && digits.length < 10) {
                                                    setPhoneError('Telefone inválido. Mínimo de 10 dígitos.');
                                                } else {
                                                    setPhoneError('');
                                                }
                                            }}
                                            placeholder="(00) 00000-0000"
                                            maxLength={15}
                                            className={`h-11 border-slate-100 bg-slate-50/50 rounded-2xl transition-all font-semibold text-bee-midnight px-5 focus:ring-bee-amber/20 ${phoneError ? 'border-red-300 focus:ring-red-200' : ''}`}
                                        />
                                        {phoneError && (
                                            <p className="text-xs font-bold text-red-500 ml-1 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" /> {phoneError}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Data de Nascimento</Label>
                                        <Input
                                            type="date"
                                            value={birthDate}
                                            onChange={e => setBirthDate(e.target.value)}
                                            className="h-11 border-slate-100 bg-slate-50/50 rounded-2xl transition-all font-semibold text-bee-midnight px-5 focus:ring-bee-amber/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">CPF</Label>
                                        <Input
                                            value={cpf}
                                            onChange={e => setCpf(formatCPF(e.target.value))}
                                            placeholder="000.000.000-00"
                                            maxLength={14}
                                            className="h-11 border-slate-100 bg-slate-50/50 rounded-2xl transition-all font-semibold text-bee-midnight px-5 focus:ring-bee-amber/20"
                                        />
                                    </div>
                                </div>


                            </div>
                        </div>

                        <Separator className="bg-slate-100/80" />

                        {/* Endereço */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-bee-amber/10 flex items-center justify-center">
                                    <Hash className="h-4 w-4 text-bee-amber" />
                                </div>
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Endereço</h3>
                            </div>

                            <div className="grid grid-cols-1 gap-5">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className="md:col-span-2 space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Rua *</Label>
                                        <Input
                                            value={street}
                                            onChange={e => { setStreet(e.target.value); if (e.target.value.trim()) setStreetError(''); }}
                                            placeholder="Nome da rua"
                                            className={`h-11 border-slate-100 bg-slate-50/50 rounded-2xl transition-all font-semibold text-bee-midnight px-5 focus:ring-bee-amber/20 ${streetError ? 'border-red-300 focus:ring-red-200' : ''}`}
                                        />
                                        {streetError && (
                                            <p className="text-xs font-bold text-red-500 ml-1 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" /> {streetError}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Número</Label>
                                        <Input
                                            value={addressNumber}
                                            onChange={e => setAddressNumber(e.target.value)}
                                            placeholder="123"
                                            className="h-11 border-slate-100 bg-slate-50/50 rounded-2xl transition-all font-semibold text-bee-midnight px-5 focus:ring-bee-amber/20"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Complemento</Label>
                                        <Input
                                            value={complement}
                                            onChange={e => setComplement(e.target.value)}
                                            placeholder="Apto, Bloco..."
                                            className="h-11 border-slate-100 bg-slate-50/50 rounded-2xl transition-all font-semibold text-bee-midnight px-5 focus:ring-bee-amber/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Bairro</Label>
                                        <Input
                                            value={neighborhood}
                                            onChange={e => setNeighborhood(e.target.value)}
                                            placeholder="Nome do bairro"
                                            className="h-11 border-slate-100 bg-slate-50/50 rounded-2xl transition-all font-semibold text-bee-midnight px-5 focus:ring-bee-amber/20"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className="md:col-span-1 space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">CEP</Label>
                                        <Input
                                            value={zip}
                                            onChange={e => setZip(formatZip(e.target.value))}
                                            placeholder="00000-000"
                                            maxLength={9}
                                            className="h-11 border-slate-100 bg-slate-50/50 rounded-2xl transition-all font-semibold text-bee-midnight px-5 focus:ring-bee-amber/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cidade</Label>
                                        <Input
                                            value={city}
                                            onChange={e => setCity(e.target.value)}
                                            placeholder="Cidade"
                                            className="h-11 border-slate-100 bg-slate-50/50 rounded-2xl transition-all font-semibold text-bee-midnight px-5 focus:ring-bee-amber/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Estado</Label>
                                        <Input
                                            value={addressState}
                                            onChange={e => setAddressState(e.target.value.toUpperCase().slice(0, 2))}
                                            placeholder="UF"
                                            maxLength={2}
                                            className="h-11 border-slate-100 bg-slate-50/50 rounded-2xl transition-all font-semibold text-bee-midnight px-5 focus:ring-bee-amber/20"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-slate-100/80" />

                        {/* Plano e Financeiro */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-bee-amber/10 flex items-center justify-center">
                                    <CreditCard className="h-4 w-4 text-bee-amber" />
                                </div>
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Plano e Financeiro</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Plano Selecionado</Label>
                                    <Select 
                                        value={plans.some(p => p.id === planId) ? planId : undefined} 
                                        onValueChange={setPlanId}
                                    >
                                        <SelectTrigger className="h-11 rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-bee-amber/20 focus:border-bee-amber/30 shadow-sm font-bold text-bee-midnight px-5 text-left">
                                            <SelectValue placeholder="SELECIONE O PLANO" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-2 bg-white max-h-[300px]">
                                            {plansLoading ? (
                                                <div className="py-6 px-4 text-center text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Carregando Planos...
                                                </div>
                                            ) : (
                                                <>
                                                    {plans.map(p => (
                                                        <SelectItem key={p.id} value={p.id} className="rounded-xl focus:bg-bee-amber/10 focus:text-bee-amber font-bold py-3 px-4 transition-colors">
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="font-bold">{p.name}</span>
                                                                <span className="text-[10px] text-slate-400 uppercase font-black tracking-tight">
                                                                    {p.plan_type === 'pack'
                                                                        ? `${p.credits ? `${p.credits} Créditos` : 'Ilimitado'}`
                                                                        : (p.days_per_week ? `${p.days_per_week}x/Semana` : 'Ilimitado')
                                                                    }
                                                                    {p.price > 0 && ` • R$ ${p.price}`}
                                                                </span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                    {plans.length === 0 && (
                                                        <div className="py-6 px-4 text-center text-xs text-slate-400 font-bold uppercase tracking-widest">
                                                            Nenhum plano disponível
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Status da Matrícula</Label>
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger className="h-11 border-slate-100 bg-slate-50/50 rounded-2xl transition-all font-bold text-bee-midnight px-5 focus:ring-bee-amber/20 focus:border-bee-amber/30 shadow-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-2 bg-white">
                                            <SelectItem value="ACTIVE" className="rounded-xl focus:bg-bee-amber/10 focus:text-bee-amber font-bold py-3 px-4 transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                                    Matrícula Ativa
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="INACTIVE" className="rounded-xl focus:bg-bee-amber/10 focus:text-bee-amber font-bold py-3 px-4 transition-colors">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <div className="w-2 h-2 rounded-full bg-slate-300" />
                                                    Matrícula Inativa
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="OVERDUE" className="rounded-xl focus:bg-bee-amber/10 focus:text-bee-amber font-bold py-3 px-4 transition-colors">
                                                <div className="flex items-center gap-2 text-red-500">
                                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                                    Inadimplente
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Resumo do Plano */}
                            {selectedPlanDetails && (
                                <Card className="bg-slate-50/50 border-slate-100 shadow-sm overflow-hidden rounded-[32px] relative group/card transition-all hover:border-bee-amber/20 hover:shadow-md">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-bee-amber/[0.04] rounded-full -mr-16 -mt-16 blur-3xl opacity-50 group-hover/card:scale-110 transition-transform duration-700" />
                                    <CardContent className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative">
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-display font-black text-xl text-bee-midnight tracking-tight uppercase leading-none">{selectedPlanDetails.name}</p>
                                                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-[0.15em] bg-bee-amber/10 text-bee-amber border-bee-amber/20 px-2 py-0.5 rounded-md">
                                                        VIGENTE
                                                    </Badge>
                                                </div>
                                                {selectedPlanDetails.description && (
                                                    <p className="text-sm font-medium text-slate-400 max-w-sm leading-relaxed">{selectedPlanDetails.description}</p>
                                                )}
                                            </div>
                                            <div className="flex gap-2 flex-wrap">
                                                {selectedPlanDetails.type === 'checkin' ? (
                                                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-blue-50/50 text-blue-600 border-blue-100/50 px-3 py-1 rounded-full whitespace-nowrap">
                                                        {selectedPlanDetails.checkin_limit} Créditos inclusos
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-green-50/50 text-green-600 border-green-100/50 px-3 py-1 rounded-full whitespace-nowrap">
                                                        Uso Ilimitado
                                                    </Badge>
                                                )}
                                                {selectedPlanDetails.frequency && selectedPlanDetails.frequency !== 'packet' && (
                                                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white border-slate-100 px-3 py-1 rounded-full whitespace-nowrap">
                                                        Ciclo {recurrenceLabel[selectedPlanDetails.frequency] || selectedPlanDetails.frequency}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                                            <p className="text-3xl font-black text-bee-amber tracking-tighter leading-none">
                                                {(selectedPlanDetails.price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </p>
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mt-2">Valor Base</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Área de Desconto (Restrita) */}
                            {canManageDiscounts && (
                                <div className={`rounded-[32px] overflow-hidden transition-all duration-500 border ${discountActive ? 'border-bee-amber/20 bg-bee-amber/[0.02] shadow-sm' : 'border-dashed border-slate-200 bg-slate-50/30'}`}>
                                    <div className="p-8 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-colors ${discountActive ? 'bg-bee-amber text-bee-midnight' : 'bg-slate-100 text-slate-400'}`}>
                                                    <Tag className="h-5 w-5" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <Label className="text-base font-black text-bee-midnight tracking-tight uppercase leading-none">Desconto Promocional</Label>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Condição especial de pagamento</p>
                                                </div>
                                            </div>
                                            <Switch
                                                id="discount-toggle"
                                                checked={discountActive}
                                                onCheckedChange={setDiscountActive}
                                                className="data-[state=checked]:bg-bee-amber"
                                            />
                                        </div>

                                        {discountActive && (
                                            <div className="space-y-6 animate-in slide-in-from-top-4 fade-in duration-500">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Valor do Desconto</Label>
                                                        <div className="flex gap-3">
                                                            <div className="relative flex-1 group/input">
                                                                <Input
                                                                    type="number"
                                                                    value={discountValue}
                                                                    onChange={e => setDiscountValue(e.target.value)}
                                                                    placeholder={discountType === 'percent' ? "10" : "50.00"}
                                                                    className="h-11 border-slate-100 bg-white rounded-2xl transition-all font-semibold text-bee-midnight px-5 focus:ring-bee-amber/20"
                                                                />
                                                            </div>
                                                            <div className="flex bg-slate-100 rounded-2xl border border-slate-200/50 p-1.5 shrink-0 shadow-inner">
                                                                <button
                                                                    className={`px-5 text-xs font-black rounded-xl transition-all ${discountType === 'percent' ? 'bg-white shadow-md text-bee-amber' : 'text-slate-400 hover:text-slate-600'}`}
                                                                    onClick={() => setDiscountType('percent')}
                                                                >
                                                                    %
                                                                </button>
                                                                <button
                                                                    className={`px-5 text-xs font-black rounded-xl transition-all ${discountType === 'fixed' ? 'bg-white shadow-md text-bee-amber' : 'text-slate-400 hover:text-slate-600'}`}
                                                                    onClick={() => setDiscountType('fixed')}
                                                                >
                                                                    R$
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Duração do Benefício</Label>
                                                        <Select value={discountDuration} onValueChange={setDiscountDuration}>
                                                            <SelectTrigger className="h-11 border-slate-100 bg-white rounded-2xl transition-all font-bold text-bee-midnight px-5 focus:ring-bee-amber/20 focus:border-bee-amber/30 shadow-sm">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-2 bg-white">
                                                                <SelectItem value="1_month" className="rounded-xl focus:bg-bee-amber/10 focus:text-bee-amber font-bold py-3 px-4 transition-colors">Apenas no 1º Mês</SelectItem>
                                                                <SelectItem value="3_months" className="rounded-xl focus:bg-bee-amber/10 focus:text-bee-amber font-bold py-3 px-4 transition-colors">Durante 3 Meses</SelectItem>
                                                                <SelectItem value="6_months" className="rounded-xl focus:bg-bee-amber/10 focus:text-bee-amber font-bold py-3 px-4 transition-colors">Durante 6 Meses</SelectItem>
                                                                <SelectItem value="12_months" className="rounded-xl focus:bg-bee-amber/10 focus:text-bee-amber font-bold py-3 px-4 transition-colors">Durante 12 Meses (Anual)</SelectItem>
                                                                <SelectItem value="indefinite" className="rounded-xl focus:bg-bee-amber/10 focus:text-bee-amber font-bold py-3 px-4 transition-colors">Recorrência Vitalícia</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                {/* Preço Final Calculado */}
                                                {selectedPlanDetails && (
                                                    <div className="bg-white rounded-[24px] p-6 flex flex-col sm:flex-row justify-between items-center gap-4 border border-bee-amber/10 shadow-sm relative overflow-hidden group/summary">
                                                        <div className="absolute top-0 right-0 w-24 h-24 bg-bee-amber/[0.02] rounded-full -mr-12 -mt-12 blur-2xl" />
                                                        <div className="space-y-1 relative">
                                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-bee-amber/60 block">Mensalidade após desconto</span>
                                                            <div className="text-2xl font-black text-bee-amber tracking-tight leading-none">
                                                                {calculateFinalPrice()?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-full border border-slate-100 relative group-hover/summary:border-bee-amber/20 transition-colors">
                                                            <CalendarIcon className="h-4 w-4 text-slate-400 group-hover/summary:text-bee-amber transition-colors" />
                                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                                                                {calculateDiscountEndDate() ? (
                                                                    `Válido até ${format(new Date(calculateDiscountEndDate()!), 'dd/MM/yy')}`
                                                                ) : (
                                                                    'Por Tempo Indeterminado'
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Objetivo */}
                        <div className="space-y-6 pb-8">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-bee-amber/10 flex items-center justify-center">
                                    <Hash className="h-4 w-4 text-bee-amber" />
                                </div>
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Objetivo e Foco</h3>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Objetivo Principal do Aluno</Label>
                                <Select value={objective} onValueChange={setObjective}>
                                    <SelectTrigger className="h-12 border-slate-100 bg-slate-50/50 rounded-2xl transition-all font-semibold text-bee-midnight px-5 focus:ring-bee-amber/20">
                                        <SelectValue placeholder="Selecione o objetivo principal..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                                        <SelectItem value="Hipertrofia" className="py-3 focus:bg-bee-amber/10 rounded-xl mx-1 my-0.5 font-medium transition-colors">Hipertrofia (Ganho de Massa)</SelectItem>
                                        <SelectItem value="Emagrecimento" className="py-3 focus:bg-bee-amber/10 rounded-xl mx-1 my-0.5 font-medium transition-colors">Emagrecimento (Perda de Peso)</SelectItem>
                                        <SelectItem value="Condicionamento" className="py-3 focus:bg-bee-amber/10 rounded-xl mx-1 my-0.5 font-medium transition-colors">Condicionamento Físico</SelectItem>
                                        <SelectItem value="Saúde/Bem-estar" className="py-3 focus:bg-bee-amber/10 rounded-xl mx-1 my-0.5 font-medium transition-colors">Saúde & Bem-estar</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>

                <SheetFooter className="p-8 border-t bg-white flex items-center gap-3 shrink-0 sm:justify-end sticky bottom-0 z-30">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="flex-1 sm:flex-none text-slate-400 hover:text-slate-600 hover:bg-slate-50 font-black h-10 rounded-full uppercase text-[10px] tracking-widest transition-all"
                    >
                        <X className="mr-2 h-4 w-4" />
                        Descartar
                    </Button>
                    <Button
                        disabled={loading}
                        onClick={handleSubmit}
                        className="flex-1 sm:flex-none bg-bee-amber hover:bg-amber-500 text-bee-midnight font-black h-10 rounded-full shadow-lg shadow-bee-amber/10 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-[10px] px-10"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processando...
                            </>
                        ) : (
                            <>
                                <Check className="mr-2 h-4 w-4 stroke-[3px]" />
                                {studentToEdit ? 'Salvar Alterações' : 'Concluir Matrícula'}
                            </>
                        )}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>

        <UpgradePromptModal
            open={showUpgradeModal}
            onOpenChange={setShowUpgradeModal}
            featureName={`Limite de ${maxStudents} alunos ativos`}
        />
    </>);
}
