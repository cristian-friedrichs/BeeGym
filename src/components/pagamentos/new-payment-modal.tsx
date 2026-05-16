'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { CalendarIcon, Loader2, Wallet, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMemo } from 'react';
import { ConfirmDiscardDialog } from '@/components/ui/confirm-discard-dialog';
import {
    modalContent,
    modalHeader,
    modalTitle,
    modalDescription,
    modalBody,
    modalFooter,
    fieldInput,
    fieldLabel,
    ctaPrimary,
    ctaSecondary,
} from '@/lib/modal-styles';

interface NewPaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

interface Student { id: string; name: string; }

const fieldCls = fieldInput;
const labelCls = fieldLabel;

export function NewPaymentModal({ open, onOpenChange, onSuccess }: NewPaymentModalProps) {
    const { toast } = useToast();
    const supabase = createClient();
    const { organizationId } = useAuth();

    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);

    const [selectedStudent, setSelectedStudent] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState<Date>();

    const [isPaid, setIsPaid] = useState(false);
    const [payDate, setPayDate] = useState<Date>(new Date());
    const [paymentMethod, setPaymentMethod] = useState('Pix');

    const [isInterestEnabled, setIsInterestEnabled] = useState(false);
    const [interest, setInterest] = useState('');
    const [penalty, setPenalty] = useState('');

    const [isDueDateOpen, setIsDueDateOpen] = useState(false);
    const [isPayDateOpen, setIsPayDateOpen] = useState(false);

    const [showDiscardDialog, setShowDiscardDialog] = useState(false);

    const isDirty = useMemo(() => {
        if (!open) return false;
        return (
            selectedStudent !== '' ||
            description !== '' ||
            amount !== '' ||
            dueDate !== undefined ||
            isPaid !== false ||
            interest !== '' ||
            penalty !== ''
        );
    }, [open, selectedStudent, description, amount, dueDate, isPaid, interest, penalty]);

    const handleCloseAttempt = () => {
        if (isDirty) {
            setShowDiscardDialog(true);
        } else {
            onOpenChange(false);
        }
    };

    useEffect(() => {
        if (open) fetchStudents();
    }, [open]);

    async function fetchStudents() {
        if (!organizationId) return;
        try {
            const { data, error } = await (supabase as any)
                .from('students')
                .select('id, full_name')
                .eq('organization_id', organizationId)
                .eq('status', 'ACTIVE')
                .order('full_name');
            if (error) throw error;
            setStudents(data.map((s: any) => ({ id: s.id, name: s.full_name })));
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    }

    const parseAmount = (val: string) =>
        parseFloat(val.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;

    const totalCalculated = parseAmount(amount) +
        (isInterestEnabled ? parseAmount(interest) : 0) +
        (isInterestEnabled ? parseAmount(penalty) : 0);

    async function handleSubmit() {
        if (!selectedStudent || !description || !amount || !dueDate) {
            toast({ title: 'Campos obrigatórios', description: 'Preencha todos os campos fundamentais.', variant: 'destructive' });
            return;
        }
        const parsedAmount = parseAmount(amount);
        if (parsedAmount <= 0) {
            toast({ title: 'Valor inválido', description: 'O valor deve ser maior que zero.', variant: 'destructive' });
            return;
        }
        if (description.trim().length < 3) {
            toast({ title: 'Descrição muito curta', description: 'A descrição deve ter ao menos 3 caracteres.', variant: 'destructive' });
            return;
        }

        setLoading(true);
        try {
            if (!organizationId) throw new Error('Organização não encontrada');

            const payload: any = {
                organization_id: organizationId,
                student_id: selectedStudent,
                description,
                amount: parseAmount(amount),
                due_date: format(dueDate, 'yyyy-MM-dd'),
                status: isPaid ? 'PAGO' : 'PENDENTE',
            };

            if (isPaid) {
                payload.paid_at = format(payDate, 'yyyy-MM-dd');
                payload.payment_method = paymentMethod;
                payload.total_paid = totalCalculated;
                if (isInterestEnabled) {
                    payload.interest_amount = parseAmount(interest);
                    payload.penalty_amount = parseAmount(penalty);
                }
            }

            const { error } = await supabase.from('invoices' as any).insert(payload);
            if (error) throw error;

            toast({ title: isPaid ? 'Pagamento registrado!' : 'Fatura gerada!', description: 'Dados salvos com sucesso.' });

            setSelectedStudent(''); setDescription(''); setAmount(''); setDueDate(undefined);
            setIsPaid(false); setIsInterestEnabled(false); setInterest(''); setPenalty('');
            onSuccess?.();
            onOpenChange(false);
        } catch (error: any) {
            toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={handleCloseAttempt}>
                <DialogContent className={modalContent}>
                <DialogHeader className={modalHeader}>
                    <DialogTitle className={modalTitle}>
                        Novo Pagamento
                    </DialogTitle>
                    <p className={modalDescription}>
                        Gere uma nova fatura ou registre um recebimento para o aluno.
                    </p>
                </DialogHeader>

                <div className={modalBody}>
                    <div className="grid gap-4">
                        <div className="space-y-1.5">
                            <Label className={labelCls}>Aluno *</Label>
                            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                                <SelectTrigger className={fieldCls}>
                                    <SelectValue placeholder="Selecione o aluno…" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                    {students.map(s => (
                                        <SelectItem key={s.id} value={s.id} className="py-2.5 focus:bg-bee-amber/10 rounded-lg mx-1 my-0.5">
                                            {s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className={labelCls}>Descrição *</Label>
                            <Input
                                className={fieldCls}
                                placeholder="Ex: Mensalidade Março"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Valor (R$) *</Label>
                                <Input
                                    className={fieldCls}
                                    placeholder="0,00"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value.replace(/[^\d.,]/g, ''))}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Vencimento *</Label>
                                <Popover open={isDueDateOpen} onOpenChange={setIsDueDateOpen} modal>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(fieldCls, 'w-full justify-start font-normal', !dueDate && 'text-slate-400')}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
                                            {dueDate ? format(dueDate, 'dd/MM/yyyy') : 'Selecione…'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 rounded-xl shadow-2xl border-slate-100 overflow-hidden" align="start">
                                        <Calendar mode="single" selected={dueDate} onSelect={d => { if (d) { setDueDate(d); setIsDueDateOpen(false); } }} initialFocus locale={ptBR} />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-semibold text-slate-900">Já foi pago?</Label>
                                <p className="text-xs text-slate-500 text-balance">Marcar fatura como recebida e registrar no financeiro.</p>
                            </div>
                            <Switch
                                checked={isPaid}
                                onCheckedChange={setIsPaid}
                                className="data-[state=checked]:bg-bee-amber"
                            />
                        </div>

                        {isPaid && (
                            <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className={labelCls}>Data do pagamento</Label>
                                        <Popover open={isPayDateOpen} onOpenChange={setIsPayDateOpen} modal>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className={cn(fieldCls, 'w-full justify-start font-normal')}>
                                                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
                                                    {format(payDate, 'dd/MM/yyyy')}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 rounded-xl shadow-2xl border-slate-100 overflow-hidden" align="start">
                                                <Calendar mode="single" selected={payDate} onSelect={d => { if (d) { setPayDate(d); setIsPayDateOpen(false); } }} initialFocus locale={ptBR} />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className={labelCls}>Forma de pagamento</Label>
                                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                            <SelectTrigger className={fieldCls}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                                <SelectItem value="Pix" className="py-2.5 focus:bg-bee-amber/10 rounded-lg mx-1 my-0.5">Pix</SelectItem>
                                                <SelectItem value="Cartão de Crédito" className="py-2.5 focus:bg-bee-amber/10 rounded-lg mx-1 my-0.5">Cartão de Crédito</SelectItem>
                                                <SelectItem value="Cartão de Débito" className="py-2.5 focus:bg-bee-amber/10 rounded-lg mx-1 my-0.5">Cartão de Débito</SelectItem>
                                                <SelectItem value="Dinheiro" className="py-2.5 focus:bg-bee-amber/10 rounded-lg mx-1 my-0.5">Dinheiro</SelectItem>
                                                <SelectItem value="Transferência" className="py-2.5 focus:bg-bee-amber/10 rounded-lg mx-1 my-0.5">Transferência</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <Wallet className="h-4 w-4 text-slate-400" />
                                        <span className="text-sm font-semibold text-slate-900">Incluir juros / multa?</span>
                                    </div>
                                    <Switch checked={isInterestEnabled} onCheckedChange={setIsInterestEnabled} className="data-[state=checked]:bg-bee-amber" />
                                </div>

                                {isInterestEnabled && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-200">
                                        <div className="space-y-1.5">
                                            <Label className={labelCls}>Juros (R$)</Label>
                                            <Input className={fieldCls} placeholder="0,00" value={interest} onChange={e => setInterest(e.target.value.replace(/[^\d.,]/g, ''))} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className={labelCls}>Multa (R$)</Label>
                                            <Input className={fieldCls} placeholder="0,00" value={penalty} onChange={e => setPenalty(e.target.value.replace(/[^\d.,]/g, ''))} />
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-100 px-5 py-4 shadow-sm">
                                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-tight">Total recebido</span>
                                    <span className="text-xl font-bold text-emerald-700">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCalculated)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className={modalFooter}>
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
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Processando...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Check className="h-4 w-4" />
                                <span>{isPaid ? 'Confirmar recebimento' : 'Gerar fatura'}</span>
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
        </>
    );
}
