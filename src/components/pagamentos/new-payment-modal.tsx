'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import {
    CreditCard,
    Calendar as CalendarIcon,
    User,
    FileText,
    DollarSign,
    X,
    Check,
    Coins,
    Wallet,
    Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface NewPaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

interface Student {
    id: string;
    name: string;
}

export function NewPaymentModal({ open, onOpenChange, onSuccess }: NewPaymentModalProps) {
    const { toast } = useToast();
    const supabase = createClient();

    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);

    // Form State
    const [selectedStudent, setSelectedStudent] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState<Date>();

    // PAID implementation
    const [isPaid, setIsPaid] = useState(false);
    const [payDate, setPayDate] = useState<Date>(new Date());
    const [paymentMethod, setPaymentMethod] = useState('Pix');

    // Extras implementation
    const [isInterestEnabled, setIsInterestEnabled] = useState(false);
    const [interest, setInterest] = useState('');
    const [penalty, setPenalty] = useState('');

    // UI/Interaction states
    const [isDueDateCalendarOpen, setIsDueDateCalendarOpen] = useState(false);
    const [isPayDateCalendarOpen, setIsPayDateCalendarOpen] = useState(false);

    useEffect(() => {
        if (open) {
            fetchStudents();
        }
    }, [open]);

    async function fetchStudents() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await (supabase as any)
                .from('profiles')
                .select('organization_id')
                .eq('id', user.id)
                .single();

            if (!(profile as any)?.organization_id) return;

            const { data, error } = await (supabase as any)
                .from('students' as any)
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

    const parseAmount = (val: string) => {
        return parseFloat(val.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    };

    const totalCalculated = parseAmount(amount) +
        (isInterestEnabled ? parseAmount(interest) : 0) +
        (isInterestEnabled ? parseAmount(penalty) : 0);

    async function handleSubmit() {
        if (!selectedStudent || !description || !amount || !dueDate) {
            toast({
                title: 'Campos obrigatórios',
                description: 'Por favor, preencha todos os campos fundamentais.',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const { data: profile } = await (supabase as any)
                .from('profiles')
                .select('organization_id')
                .eq('id', user.id)
                .single();

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

            const { error } = await supabase
                .from('invoices' as any)
                .insert(payload);

            if (error) throw error;

            toast({
                title: isPaid ? 'Pagamento efetuado!' : 'Fatura gerada!',
                description: 'Os dados foram salvos com sucesso.',
            });

            // Reset
            setSelectedStudent('');
            setDescription('');
            setAmount('');
            setDueDate(undefined);
            setIsPaid(false);
            setIsInterestEnabled(false);
            setInterest('');
            setPenalty('');

            onSuccess?.();
            onOpenChange(false);
        } catch (error: any) {
            toast({
                title: 'Erro ao salvar',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[540px] flex flex-col h-full overflow-y-auto p-0 gap-0">
                <SheetHeader className="p-6 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100/80">
                            <CreditCard className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                            <SheetTitle className="text-xl font-bold text-slate-900">Novo Pagamento</SheetTitle>
                            <SheetDescription>Gere uma nova fatura para um aluno</SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 p-6 pt-0 space-y-6 overflow-y-auto pb-8">
                    {/* Aluno */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wider">
                            <User className="h-3.5 w-3.5 text-orange-500" />
                            Aluno *
                        </Label>
                        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                            <SelectTrigger className="h-11 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-xl focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                                <SelectValue placeholder="Selecione o aluno" />
                            </SelectTrigger>
                            <SelectContent className="z-[1001]">
                                {students.map((student) => (
                                    <SelectItem key={student.id} value={student.id}>
                                        {student.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Descrição */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wider">
                            <FileText className="h-3.5 w-3.5 text-orange-500" />
                            Descrição *
                        </Label>
                        <Input
                            className="h-11 rounded-xl"
                            placeholder="Ex: Mensalidade Março"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Valor */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wider">
                                <DollarSign className="h-3.5 w-3.5 text-orange-500" />
                                Valor Original *
                            </Label>
                            <Input
                                className="h-11 rounded-xl font-bold"
                                placeholder="0,00"
                                value={amount}
                                onChange={e => setAmount(e.target.value.replace(/[^\d.,]/g, ''))}
                            />
                        </div>

                        {/* Vencimento */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wider">
                                <CalendarIcon className="h-3.5 w-3.5 text-orange-500" />
                                Vencimento *
                            </Label>
                            <Popover open={isDueDateCalendarOpen} onOpenChange={setIsDueDateCalendarOpen} modal={true}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            'w-full h-11 rounded-xl justify-start text-left font-normal border-slate-200',
                                            !dueDate && 'text-muted-foreground'
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                                        {dueDate ? format(dueDate, 'dd/MM/yyyy') : 'Selecione'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 z-[1100]" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={dueDate}
                                        onSelect={(date) => {
                                            if (date) {
                                                setDueDate(date);
                                                setIsDueDateCalendarOpen(false);
                                            }
                                        }}
                                        initialFocus
                                        locale={ptBR}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Toggle PAGO */}
                    <div className="flex items-center justify-between p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 bg-orange-100 rounded-xl flex items-center justify-center">
                                <Coins className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800">Já foi pago?</p>
                                <p className="text-xs text-slate-500">Marcar fatura como realizada</p>
                            </div>
                        </div>
                        <Switch
                            checked={isPaid}
                            onCheckedChange={setIsPaid}
                            className="data-[state=checked]:bg-orange-500"
                        />
                    </div>

                    {isPaid && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Data do Pagamento</Label>
                                    <Popover open={isPayDateCalendarOpen} onOpenChange={setIsPayDateCalendarOpen} modal={true}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full h-11 rounded-xl justify-start text-left font-normal border-slate-200">
                                                <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                                                {format(payDate, 'dd/MM/yyyy')}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 z-[1100]" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={payDate}
                                                onSelect={(date) => {
                                                    if (date) {
                                                        setPayDate(date);
                                                        setIsPayDateCalendarOpen(false);
                                                    }
                                                }}
                                                initialFocus
                                                locale={ptBR}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Forma de Pagamento</Label>
                                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                        <SelectTrigger className="h-11 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-xl focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="z-[1100]">
                                            <SelectItem value="Pix">Pix</SelectItem>
                                            <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                                            <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                                            <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                                            <SelectItem value="Transferência">Transferência</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Toggle Extras */}
                            <div className="flex items-center justify-between py-2 border-t border-dashed border-slate-200 pt-5">
                                <div className="flex items-center gap-2">
                                    <Wallet className="h-4 w-4 text-slate-400" />
                                    <span className="text-sm font-bold text-slate-600">Considerar Juros/Multa?</span>
                                </div>
                                <Switch checked={isInterestEnabled} onCheckedChange={setIsInterestEnabled} />
                            </div>

                            {isInterestEnabled && (
                                <div className="grid grid-cols-2 gap-4 animate-in zoom-in-95 duration-200">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-bold text-red-500 uppercase">Juros (R$)</Label>
                                        <Input
                                            className="h-11 rounded-xl"
                                            placeholder="0,00"
                                            value={interest}
                                            onChange={e => setInterest(e.target.value.replace(/[^\d.,]/g, ''))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-bold text-red-500 uppercase">Multa (R$)</Label>
                                        <Input
                                            className="h-11 rounded-xl"
                                            placeholder="0,00"
                                            value={penalty}
                                            onChange={e => setPenalty(e.target.value.replace(/[^\d.,]/g, ''))}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex justify-between items-center">
                                <div className="flex items-center gap-2 text-emerald-700 font-bold">
                                    <Check className="h-5 w-5" />
                                    <span>Total Pago</span>
                                </div>
                                <span className="text-2xl font-black text-emerald-800">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCalculated)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <SheetFooter className="p-6 pt-4 border-t gap-3 bg-slate-50/50">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="h-12 rounded-xl border-slate-200 px-6 font-bold text-slate-600">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black px-8 shadow-lg shadow-orange-500/20"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            isPaid ? 'Confirmar Recebimento' : 'Gerar Fatura'
                        )}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
