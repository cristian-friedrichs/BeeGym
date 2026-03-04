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
            <SheetContent className="w-full sm:max-w-xl flex flex-col h-full p-0">
                <SheetHeader className="p-6 border-b">
                    <SheetTitle className="font-display text-[#00173F]">
                        {loading ? 'Carregando...' : detail?.contratante?.nome}
                    </SheetTitle>
                    <SheetDescription>
                        {detail && <ContratanteStatusBadge status={detail.assinatura?.status} />}
                    </SheetDescription>
                </SheetHeader>

                {detail && (
                    <ScrollArea className="flex-1">
                        <div className="p-6 space-y-6">
                            {/* Seção 1 — Dados */}
                            <section>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Dados do Cliente</h3>
                                    <ContratanteEditDialog contratante={detail.contratante} onUpdated={load} />
                                </div>
                                <dl className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                                    <div><dt className="text-slate-400 text-xs">E-mail</dt><dd className="font-medium text-[#00173F]">{detail.contratante.email}</dd></div>
                                    <div><dt className="text-slate-400 text-xs">Telefone</dt><dd className="font-medium">{detail.contratante.telefone}</dd></div>
                                    <div><dt className="text-slate-400 text-xs">CPF/CNPJ</dt><dd className="font-medium font-mono">{detail.contratante.cpf_cnpj}</dd></div>
                                    <div><dt className="text-slate-400 text-xs">Cliente desde</dt><dd className="font-medium">{formatDate(detail.contratante.desde)}</dd></div>
                                    <div className="col-span-2"><dt className="text-slate-400 text-xs">Endereço</dt><dd className="font-medium">{detail.contratante.endereco}</dd></div>
                                </dl>
                            </section>

                            <Separator />

                            {/* Seção 2 — Assinatura */}
                            <section>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assinatura Atual</h3>
                                    <ContratanteBillingDialog contratanteId={id} assinatura={detail.assinatura} onUpdated={load} />
                                </div>
                                <dl className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                                    <div><dt className="text-slate-400 text-xs">Plano</dt><dd className="font-bold text-bee-orange">{detail.assinatura.plano}</dd></div>
                                    <div>
                                        <dt className="text-slate-400 text-xs">Método</dt>
                                        <dd className="font-medium flex items-center gap-1.5">
                                            {detail.assinatura.metodo === 'PIX_AUTOMATICO'
                                                ? <><QrCode className="w-3.5 h-3.5 text-green-500" /> Pix Automático</>
                                                : <><CreditCard className="w-3.5 h-3.5 text-blue-500" /> Cartão Recorrente</>}
                                        </dd>
                                    </div>
                                    <div><dt className="text-slate-400 text-xs">Valor Mensal</dt><dd className="font-bold">{formatCurrency(detail.assinatura.valor_mensal)}</dd></div>
                                    <div><dt className="text-slate-400 text-xs">Próx. Vencimento</dt><dd className="font-medium">{detail.assinatura.proximo_vencimento ? formatDate(detail.assinatura.proximo_vencimento) : '-'}</dd></div>
                                    {detail.assinatura.acordo_efi_id && (
                                        <div className="col-span-2"><dt className="text-slate-400 text-xs">ID Acordo EFI</dt><dd className="font-mono text-xs break-all">{detail.assinatura.acordo_efi_id}</dd></div>
                                    )}
                                    {detail.assinatura.subscription_efi_id && (
                                        <div className="col-span-2"><dt className="text-slate-400 text-xs">ID Assinatura EFI</dt><dd className="font-mono text-xs">{detail.assinatura.subscription_efi_id}</dd></div>
                                    )}
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
                                                <span className="font-bold text-[#00173F]">{formatCurrency(c.valor)}</span>
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
                                    <Button variant="outline" size="sm" className="text-amber-600 border-amber-200 hover:bg-amber-50">Suspender Acesso</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Suspender acesso?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            O cliente perderá acesso ao BeeGym imediatamente. Esta ação pode ser revertida.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleAction('suspender')} className="bg-amber-500 hover:bg-amber-600">Suspender</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                        {detail.assinatura.status === 'SUSPENSA' && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleAction('restaurar')}>Restaurar Acesso</Button>
                        )}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">Cancelar Assinatura</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Cancelar assinatura?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        A assinatura será cancelada na EFI e o acesso removido permanentemente. Esta ação não pode ser desfeita facilmente.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Voltar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleAction('cancelar')} className="bg-red-600 hover:bg-red-700">Confirmar Cancelamento</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
