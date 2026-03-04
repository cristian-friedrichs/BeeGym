'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowUpRight, CreditCard, AlertCircle, Loader2, Plus, Search, Info } from 'lucide-react';
import { PaymentSheet } from '@/components/pagamentos/payment-sheet';
import { NewPaymentModal } from '@/components/pagamentos/new-payment-modal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function PagamentosPage() {
  const supabase = createClient();
  const { toast } = useToast();

  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Controle do Modal
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isNewPaymentModalOpen, setIsNewPaymentModalOpen] = useState(false);

  const [kpis, setKpis] = useState({
    receitaMes: 0, countReceita: 0,
    pendenteTotal: 0, countPendente: 0,
    atrasadoTotal: 0, countAtrasado: 0,
    ticketMedio: 0
  });

  useEffect(() => { fetchPayments(); }, []);

  const fetchPayments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('vw_payments')
        .select('*')
        .order('due_date', { ascending: false });

      if (error) throw error;
      if (data) { setPayments(data); calculateKpis(data); }
    } catch (error: any) {
      toast({ title: "Erro ao carregar", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const calculateKpis = (data: any[]) => {
    const today = new Date();
    let receita = 0, pendente = 0, atrasado = 0, qtdPagos = 0;
    let countReceita = 0, countPendente = 0, countAtrasado = 0;

    data.forEach(p => {
      const valor = Number(p.amount);
      if (p.dynamic_status === 'PAGO') {
        if (p.payment_date && isSameMonth(new Date(p.payment_date), today)) {
          receita += Number(p.total_paid || p.amount);
          countReceita++;
        }
        qtdPagos++;
      } else if (p.dynamic_status === 'PENDENTE') {
        pendente += valor;
        countPendente++;
      } else if (p.dynamic_status === 'ATRASADO') {
        atrasado += valor;
        countAtrasado++;
      }
    });

    setKpis({
      receitaMes: receita, countReceita,
      pendenteTotal: pendente, countPendente,
      atrasadoTotal: atrasado, countAtrasado,
      ticketMedio: qtdPagos > 0 ? (receita / qtdPagos) : 0
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAGO': return <span className="px-2.5 py-1 text-[11px] font-bold uppercase bg-green-100 text-green-700 rounded-md">Realizado</span>;
      case 'PENDENTE': return <span className="px-2.5 py-1 text-[11px] font-bold uppercase bg-orange-100 text-orange-700 rounded-md">Pendente</span>;
      case 'ATRASADO': return <span className="px-2.5 py-1 text-[11px] font-bold uppercase bg-red-100 text-red-700 rounded-md animate-pulse">Atrasado</span>;
      case 'CANCELADO': return <span className="px-2.5 py-1 text-[11px] font-bold uppercase bg-slate-800 text-slate-100 rounded-md">Cancelado</span>;
      default: return <span className="px-2.5 py-1 text-[11px] font-bold uppercase bg-slate-100 text-slate-600 rounded-md">{status}</span>;
    }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const filteredPayments = payments.filter(p =>
    p.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-deep-midnight font-display">Pagamentos</h1>
          <p className="text-muted-foreground font-sans">Gerencie as finanças do seu negócio.</p>
        </div>
        <Button
          className="font-bold shadow-sm bg-bee-orange hover:bg-orange-600 text-white rounded-[8px] font-display uppercase tracking-wider text-xs"
          onClick={() => setIsNewPaymentModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> Novo Pagamento
        </Button>
      </div>

      {/* KPI CARDS */}
      <TooltipProvider>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Receita Mensal */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-5 cursor-help hover:border-emerald-200 transition-colors">
                <div className="h-16 w-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm text-center">
                  <ArrowUpRight className="h-7 w-7" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-sm font-medium text-slate-500 mb-0.5 tracking-tight uppercase font-sans">Receita Mensal</h3>
                  <h2 className="text-3xl font-bold text-slate-900 tracking-tight font-display">{formatCurrency(kpis.receitaMes)}</h2>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="p-3 bg-white border border-slate-200 shadow-xl">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Detalhes do Mês</p>
              <p className="text-sm font-bold text-emerald-600">{kpis.countReceita} pagamentos recebidos</p>
            </TooltipContent>
          </Tooltip>

          {/* A Receber */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-5 cursor-help hover:border-orange-200 transition-colors">
                <div className="h-16 w-16 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 shadow-sm">
                  <CreditCard className="h-7 w-7" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-sm font-medium text-slate-500 mb-0.5 tracking-tight uppercase font-sans">A Receber</h3>
                  <h2 className="text-3xl font-bold text-slate-900 tracking-tight font-display">{formatCurrency(kpis.pendenteTotal)}</h2>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="p-3 bg-white border border-slate-200 shadow-xl">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Pendente</p>
              <p className="text-sm font-bold text-orange-600">{kpis.countPendente} faturas aguardando pagamento</p>
            </TooltipContent>
          </Tooltip>

          {/* Atrasado */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-5 cursor-help hover:border-red-200 transition-colors">
                <div className="h-16 w-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 shadow-sm">
                  <AlertCircle className="h-7 w-7" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-sm font-medium text-slate-500 mb-0.5 tracking-tight uppercase font-sans">Atrasado</h3>
                  <h2 className="text-3xl font-bold text-red-600 tracking-tight font-display">{formatCurrency(kpis.atrasadoTotal)}</h2>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="p-3 bg-white border border-slate-200 shadow-xl">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total em Atraso</p>
              <p className="text-sm font-bold text-red-600">{kpis.countAtrasado} faturas vencidas</p>
            </TooltipContent>
          </Tooltip>

          {/* Ticket Médio */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-5 cursor-help hover:border-blue-200 transition-colors">
                <div className="h-16 w-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                  <ArrowUpRight className="h-7 w-7" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-sm font-medium text-slate-500 mb-0.5 tracking-tight uppercase font-sans">Ticket Médio</h3>
                  <h2 className="text-3xl font-bold text-slate-900 tracking-tight font-display">{formatCurrency(kpis.ticketMedio)}</h2>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="p-3 bg-white border border-slate-200 shadow-xl">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Cálculo Médio</p>
              <p className="text-sm font-bold text-blue-600">Baseado em {kpis.countReceita} pagamentos este mês</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* TABELA DE TRANSAÇÕES */}
      <div className="bg-white border border-slate-100 rounded-[8px] shadow-sm overflow-hidden">
        {/* Cabeçalho da tabela */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-deep-midnight font-display">Histórico de Transações</h3>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar aluno..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200 rounded-[8px] font-sans h-9"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
              <TableHead className="font-bold text-deep-midnight font-display uppercase text-[11px] tracking-widest">Aluno / Descrição</TableHead>
              <TableHead className="font-bold text-deep-midnight font-display uppercase text-[11px] tracking-widest">Vencimento</TableHead>
              <TableHead className="font-bold text-deep-midnight font-display uppercase text-[11px] tracking-widest">Valor</TableHead>
              <TableHead className="font-bold text-deep-midnight font-display uppercase text-[11px] tracking-widest">Status</TableHead>
              <TableHead className="text-right font-bold text-deep-midnight font-display uppercase text-[11px] tracking-widest">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="p-8 text-center text-muted-foreground">Nenhuma transação.</TableCell>
              </TableRow>
            ) : (
              filteredPayments.map(payment => (
                <TableRow
                  key={payment.id}
                  className="cursor-pointer hover:bg-slate-50/50 group"
                  onClick={() => { setSelectedPayment(payment); setIsSheetOpen(true); }}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-slate-100">
                        <AvatarFallback className="bg-orange-100 text-bee-orange font-bold text-xs">
                          {payment.student_name ? payment.student_name.charAt(0).toUpperCase() : 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-bold text-slate-800 font-sans">{payment.student_name || 'Lançamento Avulso'}</p>
                        <p className="text-xs text-muted-foreground font-sans">{payment.description}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-slate-600 font-sans">
                    {format(new Date(payment.due_date + 'T00:00:00'), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="text-sm font-bold text-slate-800 font-sans">
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell>{getStatusBadge(payment.dynamic_status)}</TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm font-bold text-bee-orange opacity-0 group-hover:opacity-100 transition-opacity">
                      Gerenciar
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaymentSheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} payment={selectedPayment} onSuccess={fetchPayments} />

      <NewPaymentModal
        open={isNewPaymentModalOpen}
        onOpenChange={setIsNewPaymentModalOpen}
        onSuccess={fetchPayments}
      />
    </div>
  );
}
