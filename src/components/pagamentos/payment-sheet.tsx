'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, DollarSign, CheckCircle2, QrCode, Copy, Check as CheckIcon, RotateCcw, ChevronRight } from 'lucide-react';
import QRCode from 'qrcode';
import { cn } from '@/lib/utils';

interface PaymentSheetProps {
    isOpen: boolean;
    onClose: () => void;
    payment: any;
    onSuccess: () => void;
}

const STATUS_INFO: Record<string, { label: string; cls: string }> = {
    PAGO:      { label: 'Pago',      cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    PENDENTE:  { label: 'Pendente',  cls: 'bg-amber-50 text-amber-600 border-amber-100' },
    ATRASADO:  { label: 'Atrasado',  cls: 'bg-red-50 text-red-600 border-red-100' },
    CANCELADO: { label: 'Cancelado', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
};

const fieldCls = 'h-9 rounded-xl border-slate-200 bg-white text-sm focus:border-bee-amber focus:ring-2 focus:ring-bee-amber/20';
const labelCls = 'text-[11px] font-bold uppercase tracking-wider text-slate-400';

export function PaymentSheet({ isOpen, onClose, payment, onSuccess }: PaymentSheetProps) {
    const supabase = createClient();
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'view' | 'pay' | 'edit_date' | 'pix'>('view');
    const [payDate, setPayDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [interest, setInterest] = useState(0);
    const [penalty, setPenalty] = useState(0);
    const [payMethod, setPayMethod] = useState('Pix');
    const [newDueDate, setNewDueDate] = useState('');
    const [pixCode, setPixCode] = useState('');
    const [pixQrDataUrl, setPixQrDataUrl] = useState('');
    const [pixCopied, setPixCopied] = useState(false);

    useEffect(() => {
        if (payment) {
            setMode('view');
            setNewDueDate(payment.due_date);
            setInterest(payment.interest_amount || 0);
            setPenalty(payment.penalty_amount || 0);
            setPayDate(format(new Date(), 'yyyy-MM-dd'));
            setPixCode(''); setPixQrDataUrl(''); setPixCopied(false);
        }
    }, [payment]);

    const totalCalculated = Number(payment?.amount || 0) + Number(interest) + Number(penalty);

    const generatePixCode = async () => {
        const amount = Number(payment.amount).toFixed(2).replace('.', '');
        const mockKey = `00020126330014br.gov.bcb.pix0111${payment.id?.slice(0, 11) || '00000000000'}5204000053039865406${amount}5802BR5913BeeGym${payment.student_name?.slice(0, 10).replace(/\s/g, '') || 'Aluno'}6009SAO PAULO62070503***6304`;
        const checksum = Math.abs(mockKey.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 65536).toString(16).toUpperCase().padStart(4, '0');
        const full = mockKey + checksum;
        setPixCode(full);
        try { setPixQrDataUrl(await QRCode.toDataURL(full, { width: 180, margin: 1 })); } catch {}
        setMode('pix');
    };

    const handleCopyPix = () => {
        navigator.clipboard.writeText(pixCode).then(() => { setPixCopied(true); setTimeout(() => setPixCopied(false), 2000); });
    };

    const handleReopen = async () => {
        setLoading(true);
        const { error } = await (supabase as any).from('invoices').update({ status: 'PENDENTE' }).eq('id', payment.id);
        setLoading(false);
        if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        else { toast({ title: 'Fatura reaberta!' }); onSuccess(); onClose(); }
    };

    const handleUpdateDueDate = async () => {
        setLoading(true);
        const { error } = await (supabase as any).from('invoices').update({ due_date: newDueDate }).eq('id', payment.id);
        setLoading(false);
        if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        else { toast({ title: 'Vencimento atualizado!' }); onSuccess(); setMode('view'); }
    };

    const handleProcessPayment = async () => {
        setLoading(true);
        const { error } = await (supabase as any).from('invoices').update({
            status: 'PAGO', paid_at: payDate, payment_method: payMethod,
            interest_amount: interest, penalty_amount: penalty, total_paid: totalCalculated,
        }).eq('id', payment.id);
        setLoading(false);
        if (error) toast({ title: 'Erro ao confirmar pagamento', description: error.message, variant: 'destructive' });
        else { toast({ title: 'Pagamento confirmado!' }); onSuccess(); onClose(); }
    };

    if (!payment) return null;

    const statusInfo = STATUS_INFO[payment.dynamic_status] || STATUS_INFO.PENDENTE;
    const isPago = payment.dynamic_status === 'PAGO';
    const isCancelado = payment.dynamic_status === 'CANCELADO';
    const isPendente = !isPago && !isCancelado;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[480px] p-0 gap-0 rounded-2xl overflow-hidden bg-white border border-slate-100">

                {/* Header */}
                <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                            <DollarSign className="h-4.5 w-4.5 text-emerald-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <DialogTitle className="text-[17px] font-bold text-slate-900 leading-tight">Detalhes da Fatura</DialogTitle>
                                <Badge className={cn('text-[10px] font-bold border rounded-full px-2 py-0.5 shadow-none', statusInfo.cls)}>
                                    {statusInfo.label}
                                </Badge>
                            </div>
                            <DialogDescription className="text-xs text-slate-400 mt-0.5 truncate">
                                {payment.student_name || 'Aluno'} · {payment.description || 'Mensalidade'}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Body */}
                <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

                    {/* Main value + due date */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 rounded-xl px-4 py-3">
                            <p className={labelCls}>Valor</p>
                            <p className="text-xl font-black text-slate-800 mt-0.5">
                                {Number(payment.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                        </div>
                        <div className="bg-slate-50 rounded-xl px-4 py-3">
                            <p className={labelCls}>Vencimento</p>
                            <p className="text-sm font-bold text-slate-700 mt-1">
                                {format(new Date(payment.due_date + 'T12:00:00'), 'dd/MM/yyyy')}
                            </p>
                        </div>
                    </div>

                    {/* VIEW mode content */}
                    {mode === 'view' && (
                        <>
                            {/* PAGO: show payment details */}
                            {isPago && (
                                <div className="bg-emerald-50/60 rounded-xl border border-emerald-100 px-4 py-4 space-y-3">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                                        <CheckCircle2 className="h-3.5 w-3.5" /> Pagamento confirmado
                                    </p>
                                    <Separator className="bg-emerald-100" />
                                    <InfoRow label="Data" value={payment.paid_at ? format(new Date(payment.paid_at + 'T12:00:00'), 'dd/MM/yyyy') : '—'} />
                                    <InfoRow label="Método" value={payment.payment_method || '—'} />
                                    {(Number(payment.interest_amount) > 0 || Number(payment.penalty_amount) > 0) && (
                                        <InfoRow
                                            label="Acréscimos"
                                            value={`+ ${(Number(payment.interest_amount) + Number(payment.penalty_amount)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                                            valueClass="text-red-500"
                                        />
                                    )}
                                    <Separator className="bg-emerald-100" />
                                    <InfoRow
                                        label="Total pago"
                                        value={Number(payment.total_paid || payment.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        valueClass="text-emerald-600 font-black text-base"
                                    />
                                </div>
                            )}

                            {/* CANCELADO */}
                            {isCancelado && (
                                <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-500 text-center">
                                    Esta fatura foi cancelada.
                                </div>
                            )}

                            {/* Actions */}
                            <div className="space-y-2 pt-1">
                                {isPendente && (
                                    <>
                                        <Button onClick={() => setMode('pay')} size="sm"
                                            className="w-full h-9 rounded-xl bg-bee-amber hover:bg-bee-amber/90 text-bee-midnight font-bold text-xs gap-1.5 shadow-none">
                                            <CheckCircle2 className="h-3.5 w-3.5" /> Confirmar recebimento
                                        </Button>
                                        <Button onClick={generatePixCode} variant="outline" size="sm"
                                            className="w-full h-9 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs gap-1.5">
                                            <QrCode className="h-3.5 w-3.5" /> Gerar PIX
                                        </Button>
                                        <Button onClick={() => setMode('edit_date')} variant="ghost" size="sm"
                                            className="w-full h-9 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 font-bold text-xs gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" /> Alterar vencimento
                                        </Button>
                                    </>
                                )}
                                {isCancelado && (
                                    <Button onClick={handleReopen} disabled={loading} size="sm"
                                        className="w-full h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs gap-1.5 shadow-none">
                                        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                                        Reabrir fatura
                                    </Button>
                                )}
                            </div>
                        </>
                    )}

                    {/* PIX mode */}
                    {mode === 'pix' && (
                        <div className="space-y-4">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                <QrCode className="h-3.5 w-3.5 text-bee-amber" /> PIX · QR Code
                            </p>
                            {pixQrDataUrl && (
                                <div className="flex justify-center">
                                    <img src={pixQrDataUrl} alt="PIX QR Code" className="w-44 h-44 rounded-xl border border-slate-100 shadow-sm" />
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Copia e cola</Label>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 break-all text-[11px] font-mono text-slate-500 select-all">
                                    {pixCode}
                                </div>
                            </div>
                            <div className="flex gap-2 pt-1">
                                <Button variant="outline" size="sm" onClick={() => setMode('view')} className="flex-1 h-9 rounded-xl border-slate-200 text-slate-600 text-xs font-bold">Voltar</Button>
                                <Button size="sm" onClick={handleCopyPix} className="flex-[2] h-9 rounded-xl bg-bee-amber hover:bg-bee-amber/90 text-bee-midnight font-bold text-xs gap-1.5 shadow-none">
                                    {pixCopied ? <><CheckIcon className="h-3.5 w-3.5" /> Copiado!</> : <><Copy className="h-3.5 w-3.5" /> Copiar código</>}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Edit date mode */}
                    {mode === 'edit_date' && (
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Novo vencimento</Label>
                                <Input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} className={fieldCls} />
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setMode('view')} className="flex-1 h-9 rounded-xl border-slate-200 text-slate-600 text-xs font-bold">Cancelar</Button>
                                <Button size="sm" onClick={handleUpdateDueDate} disabled={loading} className="flex-[2] h-9 rounded-xl bg-bee-amber hover:bg-bee-amber/90 text-bee-midnight font-bold text-xs gap-1.5 shadow-none">
                                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                                    Salvar data
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Pay mode */}
                    {mode === 'pay' && (
                        <div className="space-y-4">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Registrar recebimento
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className={labelCls}>Data</Label>
                                    <Input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} className={fieldCls} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className={labelCls}>Forma</Label>
                                    <Select value={payMethod} onValueChange={setPayMethod}>
                                        <SelectTrigger className={cn(fieldCls, 'w-full')}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                            {['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Transferência'].map(m => (
                                                <SelectItem key={m} value={m}>{m}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className={labelCls}>Multa (R$)</Label>
                                    <Input type="number" min="0" step="0.01" value={penalty} onChange={e => setPenalty(Number(e.target.value))} className={fieldCls} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className={labelCls}>Juros (R$)</Label>
                                    <Input type="number" min="0" step="0.01" value={interest} onChange={e => setInterest(Number(e.target.value))} className={fieldCls} />
                                </div>
                            </div>

                            {/* Total preview */}
                            <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                                <span className={labelCls}>Total a receber</span>
                                <span className="text-lg font-black text-emerald-600">
                                    {totalCalculated.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                            </div>

                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setMode('view')} className="flex-1 h-9 rounded-xl border-slate-200 text-slate-600 text-xs font-bold">Voltar</Button>
                                <Button size="sm" onClick={handleProcessPayment} disabled={loading}
                                    className="flex-[2] h-9 rounded-xl bg-bee-amber hover:bg-bee-amber/90 text-bee-midnight font-bold text-xs gap-1.5 shadow-none">
                                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                    Confirmar pagamento
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function InfoRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">{label}</span>
            <span className={cn('text-sm font-semibold text-slate-700', valueClass)}>{value}</span>
        </div>
    );
}
