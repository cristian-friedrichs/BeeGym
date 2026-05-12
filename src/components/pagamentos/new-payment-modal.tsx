'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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
import { CalendarIcon, Loader2, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface NewPaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

interface Student { id: string; name: string; }

const fieldCls = 'h-9 rounded-xl border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:border-bee-amber focus:ring-2 focus:ring-bee-amber/20 focus:ring-offset-0';
const labelCls = 'text-sm font-medium text-slate-700';

export function NewPaymentModal({ open, onOpenChange, onSuccess }: NewPaymentModalProps) {
    const { toast } = useToast();
    const supabase = createClient();

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

    useEffect(() => {
        if (open) fetchStudents();
    }, [open]);

    async function fetchStudents() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: profile } = await (supabase as any).from('profiles').select('organization_id').eq('id', user.id).single();
            if (!(profile as any)?.organization_id) return;
            const { data, error } = await (supabase as any)
                .from('students')
                .select('id, full_name')
                .eq('organization_id', (profile as any).organization_id)
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
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');
            const { data: profile } = await (supabase as any).from('profiles').select('organization_id').eq('id', user.id).single();
            if (!(profile as any)?.organization_id) throw new Error('Organização não encontrada');

            const payload: any = {
                organization_id: (profile as any).organization_id,
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[520px] p-0 gap-0 rounded-2xl overflow-hidden">

                {/* Header */}
                <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100">
                    <DialogTitle className="text-[17px] font-semibold text-slate-900 leading-tight">
                        Novo Pagamento
                    </DialogTitle>
                    <p className="text-sm text-slate-500 mt-0.5">Gere uma nova fatura ou registre um recebimento.</p>
                </DialogHeader>

                {/* Body */}
                <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

                    <div className="space-y-1.5">
                        <Label className={labelCls}>Aluno *</Label>
                        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                            <SelectTrigger className={fieldCls}>
                                <SelectValue placeholder="Selecione o aluno…" />
                            </SelectTrigger>
                            <SelectContent>
                                {students.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
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

                    <div className="grid grid-cols-2 gap-3">
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
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={dueDate} onSelect={d => { if (d) { setDueDate(d); setIsDueDateOpen(false); } }} initialFocus locale={ptBR} />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Toggle Já foi pago */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-700">Já foi pago?</p>
                            <p className="text-xs text-slate-400 mt-0.5">Marcar fatura como recebida</p>
                        </div>
                        <Switch
                            checked={isPaid}
                            onCheckedChange={setIsPaid}
                            className="data-[state=checked]:bg-bee-amber"
                        />
                    </div>

                    {isPaid && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className={labelCls}>Data do pagamento</Label>
                                    <Popover open={isPayDateOpen} onOpenChange={setIsPayDateOpen} modal>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn(fieldCls, 'w-full justify-start font-normal')}>
                                                <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
                                                {format(payDate, 'dd/MM/yyyy')}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
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
                                        <SelectContent>
                                            <SelectItem value="Pix">Pix</SelectItem>
                                            <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                                            <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                                            <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                                            <SelectItem value="Transferência">Transferência</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Wallet className="h-4 w-4 text-slate-400" />
                                    <span className="text-sm font-medium text-slate-700">Incluir juros / multa?</span>
                                </div>
                                <Switch checked={isInterestEnabled} onCheckedChange={setIsInterestEnabled} className="data-[state=checked]:bg-bee-amber" />
                            </div>

                            {isInterestEnabled && (
                                <div className="grid grid-cols-2 gap-3 animate-in fade-in duration-200">
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-medium text-slate-500">Juros (R$)</Label>
                                        <Input className={fieldCls} placeholder="0,00" value={interest} onChange={e => setInterest(e.target.value.replace(/[^\d.,]/g, ''))} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-medium text-slate-500">Multa (R$)</Label>
                                        <Input className={fieldCls} placeholder="0,00" value={penalty} onChange={e => setPenalty(e.target.value.replace(/[^\d.,]/g, ''))} />
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
                                <span className="text-sm font-medium text-emerald-700">Total recebido</span>
                                <span className="text-base font-bold text-emerald-800">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCalculated)}
                                </span>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="px-6 pb-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="h-9 rounded-full px-5 border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="h-9 rounded-full px-6 bg-bee-amber hover:bg-amber-500 text-bee-midnight font-semibold text-sm shadow-sm"
                    >
                        {loading
                            ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Salvando…</>
                            : isPaid ? 'Confirmar recebimento' : 'Gerar fatura'
                        }
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
}
