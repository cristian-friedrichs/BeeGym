'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowUpRight, CreditCard, AlertCircle, Loader2, Plus, Search, Info, TrendingUp, DollarSign, Users, CalendarCheck, MoreHorizontal, Settings2 } from 'lucide-react';
import { PaymentSheet } from '@/components/pagamentos/payment-sheet';
import { NewPaymentModal } from '@/components/pagamentos/new-payment-modal';
import { SectionHeader } from '@/components/ui/section-header';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { KpiCard } from '@/components/ui/kpi-card';
import { useSubscription } from '@/hooks/useSubscription';

export default function PagamentosPage() {
  const supabase = createClient();
  const { toast } = useToast();

  const [payments, setPayments] = useState<any[]>([]);
  const { organizationId } = useSubscription();
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

  useEffect(() => {
    if (organizationId) {
      fetchPayments();
    }
  }, [organizationId]);

  const fetchPayments = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vw_payments')
        .select('*')
        .eq('organization_id', organizationId)
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
      <div className="pb-4">
        <SectionHeader
          title="Pagamentos"
          subtitle="Gerencie as finanças do seu negócio."
          action={
            <Button
              className="font-bold shadow-sm bg-bee-amber hover:bg-amber-500 text-bee-midnight rounded-full font-display uppercase tracking-wider text-[11px] h-9 px-4 transition-all hover:-translate-y-0.5 active:scale-95"
              onClick={() => setIsNewPaymentModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2 text-[#0B0F1A]" /> Novo Pagamento
            </Button>
          }
        />
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Receita Mensal"
          value={formatCurrency(kpis.receitaMes)}
          icon={<DollarSign className="h-6 w-6" />}
          color="yellow"
          tooltip={`${kpis.countReceita} pagamentos recebidos`}
        />

        <KpiCard
          title="A Receber"
          value={formatCurrency(kpis.pendenteTotal)}
          icon={<CreditCard className="h-6 w-6" />}
          color="yellow"
          tooltip={`${kpis.countPendente} faturas aguardando pagamento`}
        />

        <KpiCard
          title="Atrasado"
          value={formatCurrency(kpis.atrasadoTotal)}
          icon={<AlertCircle className="h-6 w-6" />}
          color="red"
          tooltip={`${kpis.countAtrasado} faturas vencidas`}
        />

        <KpiCard
          title="Ticket Médio"
          value={formatCurrency(kpis.ticketMedio)}
          icon={<TrendingUp className="h-6 w-6" />}
          color="yellow"
          tooltip={`Baseado em ${kpis.countReceita} pagamentos este mês`}
        />
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar aluno ou descrição..."
            className="pl-9 bg-slate-50 border-slate-200 rounded-full font-sans transition-all focus:bg-white focus:ring-1 focus:ring-bee-amber"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 text-slate-400">
           <Info className="w-4 h-4" />
           <span className="text-[10px] font-black uppercase tracking-widest">Filtros avançados em breve</span>
        </div>
      </div>

      {/* TABELA DE TRANSAÇÕES */}
      <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden">
        {/* Cabeçalho da tabela */}
        <div className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
             <div className="w-1 h-6 bg-[#FFBF00] rounded-full" />
             <h3 className="text-base font-bold text-[#0B0F1A] font-display">Histórico de Transações</h3>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
              <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Aluno / Descrição</TableHead>
              <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Vencimento</TableHead>
              <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Valor</TableHead>
              <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Forma</TableHead>
              <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Status</TableHead>
              <TableHead className="text-right font-bold text-[11px] uppercase tracking-wider text-slate-500">Ações</TableHead>
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
                        <AvatarFallback className="bg-orange-100 text-bee-amber font-bold text-xs">
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
                  <TableCell>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                      {payment.payment_method || 'Pix'}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(payment.dynamic_status)}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 text-bee-midnight hover:bg-bee-amber/10 hover:text-bee-amber rounded-xl transition-all border border-transparent hover:border-bee-amber/20 shadow-none"
                    >
                      <Settings2 className="w-4 h-4" />
                    </Button>
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
