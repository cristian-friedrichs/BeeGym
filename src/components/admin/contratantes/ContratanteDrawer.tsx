'use client';

import { useEffect, useState, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ContratanteStatusBadge } from './ContratanteStatusBadge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CreditCard, QrCode, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ContratanteEditDialog } from './ContratanteEditDialog';
import { ContratanteBillingDialog } from './ContratanteBillingDialog';
import { ChangePlanDialog } from './ChangePlanDialog';
import { ContratanteDiscountDialog } from './ContratanteDiscountDialog';
import { ArrowRightLeft, DollarSign, AlertTriangle } from 'lucide-react';

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');
const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface ContratanteDrawerProps {
    id: string | null;
    onClose: () => void;
}

export function ContratanteDrawer({ id, onClose }: ContratanteDrawerProps) {
    const [detail, setDetail] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [changePlanOpen, setChangePlanOpen] = useState(false);
    const [discountOpen, setDiscountOpen] = useState(false);
    const { toast } = useToast();

    const load = useCallback(() => {
        if (!id) return;
        setLoading(true);
        fetch(`/api/admin/contratantes/${id}`)
            .then(r => r.json())
            .then(setDetail)
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => { load(); }, [load]);

    const handleAction = async (action: string) => {
        if (!id) return;
        const res = await fetch(`/api/admin/contratantes/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        toast({ title: data.message });
        load();
    };

    return (
        <Sheet open={!!id} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full sm:max-w-xl flex flex-col h-full p-0 border-none rounded-l-[2rem] shadow-2xl">
                <SheetHeader className="px-8 pt-8 pb-6 border-b border-slate-50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-bee-amber/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                    <div className="flex items-center gap-3 mb-2 relative">
                        <div className="w-1.5 h-6 bg-bee-amber rounded-full" />
                        <SheetTitle className="text-xl font-bold font-display tracking-tight text-bee-midnight">
                            {loading ? 'Carregando...' : detail?.contratante?.nome}
                        </SheetTitle>
                    </div>
                    <div className="relative">
                        {loading ? (
                            <div className="h-6 w-24 bg-slate-100 animate-pulse rounded-full" />
                        ) : (
                            detail && <ContratanteStatusBadge status={detail.assinatura?.status} />
                        )}
                    </div>
                </SheetHeader>

                {detail && (
                    <ScrollArea className="flex-1">
                        <div className="p-6 space-y-6">
                            {/* Seção 1 — Dados */}
                            <section className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-xl bg-slate-50 text-slate-400">
                                            <CheckCircle className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Dados do Cliente</h3>
                                    </div>
                                    <ContratanteEditDialog contratante={detail.contratante} onUpdated={load} />
                                </div>
                                <dl className="grid grid-cols-2 gap-y-5 gap-x-6 text-sm">
                                    <div className="space-y-1">
                                        <dt className="text-slate-400 text-[10px] font-black uppercase tracking-tight">E-mail</dt>
                                        <dd className="font-bold text-bee-midnight truncate">{detail.contratante.email}</dd>
                                    </div>
                                    <div className="space-y-1">
                                        <dt className="text-slate-400 text-[10px] font-black uppercase tracking-tight">Telefone</dt>
                                        <dd className="font-bold text-bee-midnight">{detail.contratante.telefone}</dd>
                                    </div>
                                    <div className="space-y-1">
                                        <dt className="text-slate-400 text-[10px] font-black uppercase tracking-tight">CPF/CNPJ</dt>
                                        <dd className="font-bold text-bee-midnight font-mono">{detail.contratante.cpf_cnpj}</dd>
                                    </div>
                                    <div className="space-y-1">
                                        <dt className="text-slate-400 text-[10px] font-black uppercase tracking-tight">Cliente desde</dt>
                                        <dd className="font-bold text-bee-midnight">{formatDate(detail.contratante.desde)}</dd>
                                    </div>
                                    <div className="col-span-2 space-y-1 pt-2">
                                        <dt className="text-slate-400 text-[10px] font-black uppercase tracking-tight">Endereço</dt>
                                        <dd className="font-medium text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100/50">{detail.contratante.endereco}</dd>
                                    </div>
                                </dl>
                            </section>

                            <Separator />

                            {/* Seção 2 — Assinatura */}
                            <section className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-bee-amber/5 rounded-full -mr-12 -mt-12 blur-2xl" />
                                <div className="flex items-center justify-between mb-6 relative">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-xl bg-amber-50 text-bee-amber">
                                            <CreditCard className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Assinatura Atual</h3>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" className="text-xs h-10 gap-2 font-bold text-emerald-600 hover:bg-emerald-50 rounded-xl px-4" onClick={() => setDiscountOpen(true)}>
                                            <DollarSign className="w-3.5 h-3.5" />Desconto Manual
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-xs h-10 gap-2 font-bold text-bee-midnight hover:bg-slate-100 rounded-xl px-4" onClick={() => setChangePlanOpen(true)}>
                                            <ArrowRightLeft className="w-3.5 h-3.5" />Alterar Plano
                                        </Button>
                                        <ContratanteBillingDialog contratanteId={id as string} assinatura={detail.assinatura} onUpdated={load} />
                                    </div>
                                </div>
                                <dl className="grid grid-cols-2 gap-y-5 gap-x-6 text-sm relative">
                                    <div className="space-y-1">
                                        <dt className="text-slate-400 text-[10px] font-black uppercase tracking-tight">Plano</dt>
                                        <dd className="font-black text-lg text-bee-midnight flex items-center gap-2">
                                            <span className="w-1 h-3 bg-bee-amber rounded-full" />
                                            {detail.assinatura.plano}
                                        </dd>
                                    </div>
                                    <div className="space-y-1">
                                        <dt className="text-slate-400 text-[10px] font-black uppercase tracking-tight">Método de Pagamento</dt>
                                        <dd className="font-bold text-bee-midnight flex items-center gap-1.5 pt-1">
                                            {detail.assinatura.metodo === 'PIX_AUTOMATICO'
                                                ? <><div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center"><QrCode className="w-3.5 h-3.5 text-emerald-600" /></div> Pix Automático</>
                                                : <><div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center"><CreditCard className="w-3.5 h-3.5 text-blue-600" /></div> Cartão Recorrente</>}
                                        </dd>
                                    </div>
                                    <div className="space-y-1">
                                        <dt className="text-slate-400 text-[10px] font-black uppercase tracking-tight">Valor Mensal</dt>
                                        <dd className="font-bold text-bee-midnight text-base tracking-tight flex items-center gap-2">
                                            {(() => {
                                                const original = detail.assinatura.valor_mensal || 0;
                                                const hasFixedDiscount = !!detail.assinatura.manual_discount_amount;
                                                const hasPercentDiscount = !!detail.assinatura.manual_discount_percentage;
                                                let discounted = original;

                                                if (hasFixedDiscount) {
                                                    discounted = Math.max(0, original - detail.assinatura.manual_discount_amount);
                                                } else if (hasPercentDiscount) {
                                                    discounted = Math.max(0, original * (1 - (detail.assinatura.manual_discount_percentage / 100)));
                                                }

                                                if (hasFixedDiscount || hasPercentDiscount) {
                                                    return (
                                                        <>
                                                            <span className="line-through text-slate-300 text-sm">{formatCurrency(original)}</span>
                                                            <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-black">{formatCurrency(discounted)}</span>
                                                        </>
                                                    );
                                                }
                                                return <span>{formatCurrency(original)}</span>;
                                            })()}
                                        </dd>
                                    </div>
                                    <div className="space-y-1">
                                        <dt className="text-slate-400 text-[10px] font-black uppercase tracking-tight">Próx. Vencimento</dt>
                                        <dd className="font-bold text-bee-midnight">{detail.assinatura.proximo_vencimento ? formatDate(detail.assinatura.proximo_vencimento) : '-'}</dd>
                                    </div>
                                </dl>
                            </section>

                            <Separator />

                            {/* Seção 3 — Histórico */}
                            <section>
                                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Histórico de Cobranças</h3>
                                <div className="space-y-1.5">
                                    {detail.cobrancas && detail.cobrancas.length > 0 ? (
                                        detail.cobrancas.map((c: any) => (
                                            <div key={c.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 text-sm">
                                                <span className="text-slate-500">{formatDate(c.data)}</span>
                                                <span className="font-bold text-[#0B0F1A]">{formatCurrency(c.valor)}</span>
                                                <span className={`flex items-center gap-1 text-xs font-bold ${c.status === 'PAGO' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {c.status === 'PAGO'
                                                        ? <><CheckCircle className="w-3 h-3" />Pago</>
                                                        : <><XCircle className="w-3 h-3" />Falha</>}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-lg text-slate-400 border border-slate-100 border-dashed">
                                            <CreditCard className="w-6 h-6 mb-2 opacity-50" />
                                            <p className="text-xs text-center">Nenhum histórico de cobrança encontrado.</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    </ScrollArea>
                )}

                {/* Footer Actions */}
                {detail && (
                    <div className="p-4 border-t flex flex-wrap gap-2">
                        {detail.assinatura.status === 'ATIVA' && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-10 px-4 rounded-xl border-amber-200 text-amber-600 hover:bg-amber-50 font-bold gap-2 transition-all">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        Suspender Acesso
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-[1.5rem] border-slate-100 shadow-2xl p-0 overflow-hidden max-w-[420px]">
                                    <div className="p-6 border-b flex items-center gap-4 bg-white relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -mr-16 -mt-16 blur-2xl opacity-50" />
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 shrink-0 relative">
                                            <AlertTriangle className="h-6 w-6 text-amber-600" />
                                        </div>
                                        <div className="space-y-0.5 text-left relative">
                                            <AlertDialogTitle className="text-xl font-bold font-display text-slate-900 tracking-tight leading-none">
                                                Suspender Acesso
                                            </AlertDialogTitle>
                                            <p className="text-slate-500 font-medium text-xs font-sans">
                                                Ação administrativa
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-8">
                                        <AlertDialogDescription className="text-slate-600 font-sans text-base leading-relaxed mb-8">
                                            O cliente perderá acesso ao BeeGym imediatamente. Esta ação pode ser revertida a qualquer momento nas configurações do sistema.
                                        </AlertDialogDescription>

                                        <div className="flex gap-3 pt-2">
                                            <AlertDialogCancel className="flex-1 h-10 rounded-full border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all">
                                                Cancelar
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => handleAction('suspender')}
                                                className="flex-1 h-10 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md shadow-amber-100 transition-all active:scale-95"
                                            >
                                                Sim, Suspender
                                            </AlertDialogAction>
                                        </div>
                                    </div>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                        {detail.assinatura.status === 'SUSPENSA' && (
                            <Button
                                size="sm"
                                className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                                onClick={() => handleAction('restaurar')}
                            >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Restaurar Acesso
                            </Button>
                        )}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="h-10 px-4 rounded-xl border-red-200 text-red-600 hover:bg-red-50 font-bold gap-2 transition-all">
                                    <XCircle className="w-3.5 h-3.5" />
                                    Cancelar Assinatura
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-[1.5rem] border-slate-100 shadow-2xl p-0 overflow-hidden max-w-[420px]">
                                <div className="p-6 border-b flex items-center gap-4 bg-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -mr-16 -mt-16 blur-2xl opacity-50" />
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 shrink-0 relative">
                                        <XCircle className="h-6 w-6 text-red-600" />
                                    </div>
                                    <div className="space-y-0.5 text-left relative">
                                        <AlertDialogTitle className="text-xl font-bold font-display text-slate-900 tracking-tight leading-none">
                                            Cancelar Assinatura
                                        </AlertDialogTitle>
                                        <p className="text-slate-500 font-medium text-xs font-sans">
                                            Ação irreversível
                                        </p>
                                    </div>
                                </div>

                                <div className="p-8">
                                    <AlertDialogDescription className="text-slate-600 font-sans text-base leading-relaxed mb-8">
                                        A assinatura será cancelada e o acesso <span className="font-bold text-red-600">removido permanentemente</span>. Tem certeza que deseja prosseguir?
                                    </AlertDialogDescription>

                                    <div className="flex gap-3 pt-2">
                                        <AlertDialogCancel className="flex-1 h-10 rounded-full border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all">
                                            Voltar
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => handleAction('cancelar')}
                                            className="flex-1 h-10 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold shadow-md shadow-red-100 transition-all active:scale-95"
                                        >
                                            Sim, Cancelar
                                        </AlertDialogAction>
                                    </div>
                                </div>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}

                {detail && (
                    <ChangePlanDialog
                        open={changePlanOpen}
                        onOpenChange={setChangePlanOpen}
                        contratanteId={id as string}
                        currentPlanTier={detail.assinatura?.plano_tier || ''}
                        currentPlanName={detail.assinatura?.plano || 'Sem Plano'}
                        currentPrice={detail.assinatura?.valor_mensal || 0}
                        subscriptionStatus={detail.assinatura?.status || ''}
                        alunosAtivos={detail.alunos_ativos || 0}
                        onChanged={load}
                    />
                )}
                {detail && (
                    <ContratanteDiscountDialog
                        open={discountOpen}
                        onOpenChange={setDiscountOpen}
                        contratanteId={id as string}
                        currentPrice={detail.assinatura?.valor_mensal || 0}
                        currentDiscountAmount={detail.assinatura?.manual_discount_amount}
                        currentDiscountPercentage={detail.assinatura?.manual_discount_percentage}
                        onChanged={load}
                    />
                )}
            </SheetContent>
        </Sheet>
    );
}
