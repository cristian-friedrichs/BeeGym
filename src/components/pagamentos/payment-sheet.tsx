'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Calendar, DollarSign, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PaymentSheetProps {
    isOpen: boolean;
    onClose: () => void;
    payment: any;
    onSuccess: () => void;
}

export function PaymentSheet({ isOpen, onClose, payment, onSuccess }: PaymentSheetProps) {
    const supabase = createClient();
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'view' | 'pay' | 'edit_date'>('view');

    const [payDate, setPayDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [interest, setInterest] = useState(0);
    const [penalty, setPenalty] = useState(0);
    const [payMethod, setPayMethod] = useState('Pix');
    const [newDueDate, setNewDueDate] = useState('');

    useEffect(() => {
        if (payment) {
            setMode('view');
            setNewDueDate(payment.due_date);
            setInterest(payment.interest_amount || 0);
            setPenalty(payment.penalty_amount || 0);
            setPayDate(format(new Date(), 'yyyy-MM-dd'));
        }
    }, [payment]);

    if (!payment) return null;

    const totalCalculated = Number(payment.amount) + Number(interest) + Number(penalty);

    const handleReopen = async () => {
        setLoading(true);
        const { error } = await (supabase as any).from('invoices').update({ status: 'PENDENTE' } as any).eq('id', payment.id);
        setLoading(false);
        if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
        else { toast({ title: "Fatura Reaberta!" }); onSuccess(); onClose(); }
    };

    const handleUpdateDueDate = async () => {
        setLoading(true);
        const { error } = await (supabase as any).from('invoices').update({ due_date: newDueDate } as any).eq('id', payment.id);
        setLoading(false);
        if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
        else { toast({ title: "Vencimento atualizado!" }); onSuccess(); setMode('view'); }
    };

    const handleProcessPayment = async () => {
        setLoading(true);
        const { error } = await (supabase as any).from('invoices').update({
            status: 'PAGO', paid_at: payDate, payment_method: payMethod,
            interest_amount: interest, penalty_amount: penalty, total_paid: totalCalculated
        } as any).eq('id', payment.id);

        setLoading(false);
        if (error) toast({ title: "Erro ao baixar fatura", description: error.message, variant: "destructive" });
        else { toast({ title: "Pagamento confirmado!" }); onSuccess(); onClose(); }
    };

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="overflow-y-auto w-full sm:max-w-md p-0 flex flex-col h-full bg-white border-l border-slate-100">
                <SheetHeader className="relative p-8 bg-gradient-to-br from-bee-midnight via-bee-midnight to-slate-900 border-none shrink-0 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-bee-amber/10 blur-3xl rounded-full -mr-16 -mt-16" />

                    <div className="relative flex items-center gap-5">
                        <div className="h-16 w-16 rounded-[22px] bg-bee-amber/10 flex items-center justify-center ring-1 ring-bee-amber/20">
                            <DollarSign className="h-8 w-8 text-bee-amber" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <SheetTitle className="text-2xl font-black text-white tracking-tight text-left uppercase">Detalhes da Fatura</SheetTitle>
                                <Badge className="bg-bee-amber text-bee-midnight border-none font-black uppercase text-[10px] tracking-widest h-5 px-2">Pagamentos</Badge>
                            </div>
                            <SheetDescription className="text-slate-400 font-medium text-sm text-left">
                                {payment.student_name || 'Aluno Excluído'} • {payment.description}
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex justify-between items-center shadow-sm">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Valor Original</p>
                            <p className="text-3xl font-black text-bee-midnight">R$ {Number(payment.amount).toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status</p>
                            <span className={`inline-block px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl ${payment.dynamic_status === 'PAGO' ? 'bg-green-100 text-green-700' :
                                payment.dynamic_status === 'ATRASADO' ? 'bg-red-100 text-red-700' :
                                    payment.dynamic_status === 'CANCELADO' ? 'bg-slate-800 text-white' : 'bg-orange-100 text-orange-700'
                                }`}>{payment.dynamic_status}</span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {mode === 'view' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vencimento</span>
                                    <span className="text-sm font-bold text-bee-midnight">{format(new Date(payment.due_date + 'T00:00:00'), "dd/MM/yyyy")}</span>
                                </div>

                                {payment.dynamic_status === 'PAGO' ? (
                                    <div className="bg-green-50/50 p-6 rounded-3xl border border-green-100 space-y-4">
                                        <div className="flex items-center gap-2 text-green-700 font-black uppercase text-[11px] tracking-wider mb-2"><CheckCircle2 className="w-5 h-5" /> Pagamento Confirmado</div>
                                        <div className="flex justify-between text-sm"><span className="text-green-600/70 font-medium">Data</span><span className="font-bold text-green-800">{payment.paid_at ? format(new Date(payment.paid_at + 'T00:00:00'), "dd/MM/yyyy") : '-'}</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-green-600/70 font-medium">Método</span><span className="font-bold text-green-800">{payment.payment_method || '-'}</span></div>
                                        {(Number(payment.interest_amount) > 0 || Number(payment.penalty_amount) > 0) && (
                                            <div className="flex justify-between text-sm pt-4 border-t border-green-200/50"><span className="text-green-600/70 font-medium">Acréscimos</span><span className="font-bold text-red-500">+ R$ {(Number(payment.interest_amount) + Number(payment.penalty_amount)).toFixed(2)}</span></div>
                                        )}
                                        <div className="flex justify-between text-sm pt-4 border-t border-green-200/50"><span className="text-green-600/70 font-black uppercase text-[10px]">Total Pago</span><span className="font-black text-green-800 text-lg">R$ {Number(payment.total_paid || payment.amount).toFixed(2)}</span></div>
                                    </div>
                                ) : payment.dynamic_status === 'CANCELADO' ? (
                                    <Button onClick={handleReopen} disabled={loading} className="w-full h-10 bg-bee-midnight text-white font-black rounded-full hover:bg-slate-800 transition shadow-lg uppercase text-[10px] tracking-widest">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reabrir Fatura'}</Button>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3">
                                        <Button onClick={() => setMode('pay')} className="w-full h-10 bg-bee-amber text-bee-midnight font-black rounded-full hover:bg-amber-500 transition shadow-lg shadow-bee-amber/10 uppercase text-[10px] tracking-widest">Confirmar Pagamento</Button>
                                        <Button variant="ghost" onClick={() => setMode('edit_date')} className="w-full h-10 text-slate-400 font-black hover:text-slate-600 hover:bg-slate-50 transition uppercase text-[10px] tracking-widest items-center gap-2"><Calendar className="w-4 h-4" /> Alterar Vencimento</Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {mode === 'edit_date' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Novo Vencimento</label>
                                    <input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-bee-amber/5 focus:border-bee-amber/20 transition-all font-bold text-bee-midnight" />
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="ghost" onClick={() => setMode('view')} className="flex-1 h-10 text-slate-400 font-bold hover:bg-slate-50 rounded-full transition uppercase text-[10px] tracking-widest">Cancelar</Button>
                                    <Button onClick={handleUpdateDueDate} disabled={loading} className="flex-[1.5] h-10 bg-bee-amber text-bee-midnight font-black rounded-full hover:bg-amber-500 transition shadow-lg shadow-bee-amber/20 uppercase text-[10px] tracking-widest flex justify-center items-center">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Data'}</Button>
                                </div>
                            </div>
                        )}

                        {mode === 'pay' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                <div className="flex items-center gap-2 text-bee-midnight font-black uppercase text-[11px] tracking-wider mb-2"><CheckCircle2 className="w-5 h-5 text-bee-amber" /> Registrar Recebimento</div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Data</label>
                                        <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-bee-midnight text-sm outline-none focus:ring-4 focus:ring-bee-amber/5 focus:border-bee-amber/20 transition-all" />
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Forma</label>
                                        <Select value={payMethod} onValueChange={setPayMethod}>
                                            <SelectTrigger className="w-full h-11 bg-slate-50 border-slate-100 rounded-2xl font-bold text-bee-midnight text-sm focus:ring-4 focus:ring-bee-amber/5 focus:border-bee-amber/20">
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
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Multa (R$)</label>
                                        <input type="number" min="0" step="0.01" value={penalty} onChange={(e) => setPenalty(Number(e.target.value))} className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-bee-midnight text-sm outline-none focus:ring-4 focus:ring-bee-amber/5 focus:border-bee-amber/20 transition-all" />
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Juros (R$)</label>
                                        <input type="number" min="0" step="0.01" value={interest} onChange={(e) => setInterest(Number(e.target.value))} className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-bee-midnight text-sm outline-none focus:ring-4 focus:ring-bee-amber/5 focus:border-bee-amber/20 transition-all" />
                                    </div>
                                </div>
                                <div className="p-6 bg-bee-midnight/5 rounded-3xl border border-bee-midnight/5 mt-6 flex justify-between items-center shadow-inner">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total a Receber</span>
                                    <span className="text-3xl font-black text-green-600">R$ {totalCalculated.toFixed(2)}</span>
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="ghost" onClick={() => setMode('view')} className="flex-1 h-10 text-slate-400 font-bold hover:bg-slate-50 rounded-full transition uppercase text-[10px] tracking-widest">Voltar</Button>
                                    <Button onClick={handleProcessPayment} disabled={loading} className="flex-[2] h-10 bg-bee-amber text-bee-midnight font-black rounded-full hover:bg-amber-500 transition shadow-lg shadow-bee-amber/20 uppercase text-[10px] tracking-widest flex justify-center items-center">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}</Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
