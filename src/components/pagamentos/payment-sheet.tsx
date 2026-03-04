'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Calendar, DollarSign, CheckCircle2 } from 'lucide-react';

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
            <SheetContent className="overflow-y-auto w-full sm:max-w-md p-0">
                <div className="bg-slate-50 p-6 border-b border-slate-200">
                    <SheetHeader>
                        <SheetTitle className="text-xl flex items-center gap-2"><DollarSign className="w-6 h-6 text-orange-500" /> Detalhes da Fatura</SheetTitle>
                        <SheetDescription>{payment.student_name || 'Aluno Excluído'} • {payment.description}</SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 p-4 bg-white rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase">Valor Original</p>
                            <p className="text-2xl font-black text-slate-800">R$ {Number(payment.amount).toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400 font-bold uppercase">Status</p>
                            <span className={`inline-block mt-1 px-3 py-1 text-xs font-bold uppercase rounded-lg ${payment.dynamic_status === 'PAGO' ? 'bg-green-100 text-green-700' :
                                payment.dynamic_status === 'ATRASADO' ? 'bg-red-100 text-red-700 animate-pulse' :
                                    payment.dynamic_status === 'CANCELADO' ? 'bg-slate-800 text-white' : 'bg-orange-100 text-orange-700'
                                }`}>{payment.dynamic_status}</span>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {mode === 'view' && (
                        <div className="space-y-4">
                            <div className="flex justify-between p-3 border-b border-slate-100">
                                <span className="text-sm text-slate-500">Vencimento</span>
                                <span className="text-sm font-bold text-slate-800">{format(new Date(payment.due_date + 'T00:00:00'), "dd/MM/yyyy")}</span>
                            </div>

                            {payment.dynamic_status === 'PAGO' ? (
                                <div className="bg-green-50 p-4 rounded-xl border border-green-100 space-y-3">
                                    <div className="flex items-center gap-2 text-green-700 font-bold mb-2"><CheckCircle2 className="w-5 h-5" /> Pagamento Confirmado</div>
                                    <div className="flex justify-between text-sm"><span className="text-green-600/70">Data</span><span className="font-bold text-green-800">{payment.paid_at ? format(new Date(payment.paid_at + 'T00:00:00'), "dd/MM/yyyy") : '-'}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-green-600/70">Método</span><span className="font-bold text-green-800">{payment.payment_method || '-'}</span></div>
                                    {(Number(payment.interest_amount) > 0 || Number(payment.penalty_amount) > 0) && (
                                        <div className="flex justify-between text-sm pt-2 border-t border-green-200"><span className="text-green-600/70">Acréscimos</span><span className="font-bold text-red-500">+ R$ {(Number(payment.interest_amount) + Number(payment.penalty_amount)).toFixed(2)}</span></div>
                                    )}
                                    <div className="flex justify-between text-sm pt-2 border-t border-green-200"><span className="text-green-600/70 font-bold">Total Pago</span><span className="font-black text-green-800">R$ {Number(payment.total_paid || payment.amount).toFixed(2)}</span></div>
                                </div>
                            ) : payment.dynamic_status === 'CANCELADO' ? (
                                <button onClick={handleReopen} disabled={loading} className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition flex justify-center items-center gap-2">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reabrir Fatura'}</button>
                            ) : (
                                <div className="space-y-3 pt-4">
                                    <button onClick={() => setMode('pay')} className="w-full py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition shadow-sm flex justify-center items-center gap-2">Confirmar Pagamento</button>
                                    <button onClick={() => setMode('edit_date')} className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition flex justify-center items-center gap-2"><Calendar className="w-4 h-4" /> Alterar Vencimento</button>
                                </div>
                            )}
                        </div>
                    )}

                    {mode === 'edit_date' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <h4 className="font-bold text-slate-800">Novo Vencimento</h4>
                            <input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" />
                            <div className="flex gap-2 pt-4">
                                <button onClick={() => setMode('view')} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition">Cancelar</button>
                                <button onClick={handleUpdateDueDate} disabled={loading} className="flex-1 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition flex justify-center items-center">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar Data'}</button>
                            </div>
                        </div>
                    )}

                    {mode === 'pay' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex items-center gap-2 text-orange-500 font-bold mb-4"><CheckCircle2 className="w-5 h-5" /> Registrar Recebimento</div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-slate-500">Data do Pagamento</label><input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className="w-full mt-1 p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500" /></div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500">Forma</label>
                                    <Select value={payMethod} onValueChange={setPayMethod}>
                                        <SelectTrigger className="w-full mt-1 h-11 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-xl focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
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
                                <div><label className="text-xs font-bold text-slate-500">Multa (R$)</label><input type="number" min="0" step="0.01" value={penalty} onChange={(e) => setPenalty(Number(e.target.value))} className="w-full mt-1 p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-400" /></div>
                                <div><label className="text-xs font-bold text-slate-500">Juros (R$)</label><input type="number" min="0" step="0.01" value={interest} onChange={(e) => setInterest(Number(e.target.value))} className="w-full mt-1 p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-400" /></div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-6 flex justify-between items-center">
                                <span className="font-bold text-slate-600">Total a Receber</span><span className="text-2xl font-black text-green-600">R$ {totalCalculated.toFixed(2)}</span>
                            </div>
                            <div className="flex gap-2 pt-4">
                                <button onClick={() => setMode('view')} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition">Voltar</button>
                                <button onClick={handleProcessPayment} disabled={loading} className="flex-[2] py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition flex justify-center items-center shadow-md">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar'}</button>
                            </div>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
