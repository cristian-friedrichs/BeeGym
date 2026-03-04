'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, CreditCard, History, Search, ChevronRight, ReceiptText, Filter, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from 'next/link';

export default function StudentInvoicesPage() {
    const supabase = createClient();
    const params = useParams();
    const id = params.id as string;

    const [student, setStudent] = useState<any>(null);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        if (!id) return;
        try {
            const { data: sData } = await supabase.from('students').select('full_name').eq('id', id).single();
            setStudent(sData);

            const { data: invData } = await supabase
                .from('invoices')
                .select('*')
                .eq('student_id', id)
                .order('due_date', { ascending: false });

            setInvoices(invData || []);
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const filteredInvoices = invoices.filter(inv =>
        format(new Date(inv.due_date), "dd/MM/yyyy").includes(searchTerm) ||
        inv.amount.toString().includes(searchTerm)
    );

    if (loading) return <div className="p-8 flex justify-center"><CreditCard className="h-6 w-6 animate-spin text-orange-500" /></div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Link href={`/alunos/${id}`} className="w-fit">
                    <Button variant="ghost" size="sm" className="gap-2 text-slate-400 hover:text-orange-600 hover:bg-transparent transition-all font-bold uppercase tracking-widest text-[11px] p-0 group">
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Voltar para Perfil
                    </Button>
                </Link>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-deep-midnight tracking-tight">Histórico Financeiro</h1>
                        <p className="text-sm text-slate-400 font-medium">{student?.full_name}</p>
                    </div>
                </div>
            </div>

            {/* Content Card */}
            <Card className="rounded-[16px] shadow-sm border-slate-100 overflow-hidden bg-white">
                <CardHeader className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <ReceiptText className="h-5 w-5 text-orange-500" />
                        <CardTitle className="text-lg font-bold text-deep-midnight tracking-tight font-display uppercase tracking-wider">Faturas</CardTitle>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <Input
                                placeholder="Buscar por valor ou data..."
                                className="h-9 pl-9 w-[240px] text-xs bg-white border-slate-100 focus-visible:ring-1 focus-visible:ring-orange-200"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {filteredInvoices.length > 0 ? (
                        <div className="divide-y divide-slate-50">
                            {filteredInvoices.map((inv) => {
                                const isPaid = inv.status === 'PAID' || inv.status === 'Pago';
                                const isOverdue = inv.status === 'OVERDUE' || inv.status === 'Atrasado';

                                return (
                                    <div key={inv.id} className="p-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-10 w-10 rounded-[10px] flex items-center justify-center border group-hover:border-orange-100 transition-colors ${isPaid ? 'bg-emerald-50 text-emerald-600' :
                                                isOverdue ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-bee-orange'
                                                }`}>
                                                <CreditCard className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-deep-midnight group-hover:text-bee-orange transition-colors">
                                                    {inv.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </h4>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">
                                                    Vencimento: {format(new Date(inv.due_date), "dd/MM/yyyy")}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${isPaid ? 'bg-emerald-50 text-emerald-600' :
                                                isOverdue ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-bee-orange'
                                                }`}>
                                                {inv.status}
                                            </span>
                                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-bee-orange transition-colors" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-20 flex flex-col items-center justify-center text-center">
                            <ReceiptText className="h-10 w-10 text-slate-100 mb-3" />
                            <p className="text-sm text-slate-400 font-medium tracking-tight">Nenhuma fatura encontrada.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
