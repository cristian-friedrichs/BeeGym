'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Ruler, Plus, History, Filter, ChevronRight, TrendingUp, Search } from 'lucide-react';
import { formatDate, formatNumber } from '@/lib/formatters';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from 'next/link';
import { CreateMeasurementModal } from "@/components/alunos/create-measurement-modal";

export default function StudentMeasurementsPage() {
    const supabase = createClient();
    const params = useParams();
    const id = params.id as string;

    const [student, setStudent] = useState<any>(null);
    const [measurements, setMeasurements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        if (!id) return;
        try {
            const { data: sData } = await supabase.from('students').select('full_name').eq('id', id).single();
            setStudent(sData);

            const { data: mData } = await supabase
                .from('student_measurements' as any)
                .select('*')
                .eq('student_id', id)
                .order('recorded_at', { ascending: false });

            setMeasurements(mData || []);
        } catch (error) {
            console.error('Error fetching measurements:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const filteredMeasurements = measurements.filter(m =>
        format(new Date(m.recorded_at), "dd/MM/yyyy").includes(searchTerm)
    );

    if (loading) return <div className="p-8 flex justify-center"><Plus className="h-6 w-6 animate-spin text-orange-500" /></div>;

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
                        <h1 className="text-2xl font-black text-deep-midnight tracking-tight">Histórico de Medidas</h1>
                        <p className="text-sm text-slate-400 font-medium">{student?.full_name}</p>
                    </div>
                    <Button onClick={() => setIsModalOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white font-bold gap-2">
                        <Plus className="h-4 w-4" /> Nova Medida
                    </Button>
                </div>
            </div>

            {/* Content Card */}
            <Card className="rounded-[16px] shadow-sm border-slate-100 overflow-hidden bg-white">
                <CardHeader className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-orange-500" />
                        <CardTitle className="text-lg font-bold text-deep-midnight tracking-tight font-display uppercase tracking-wider">Histórico de Medidas</CardTitle>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <Input
                                placeholder="Filtrar por data..."
                                className="h-9 pl-9 w-[200px] text-xs bg-white border-slate-100 focus-visible:ring-1 focus-visible:ring-orange-200"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {filteredMeasurements.length > 0 ? (
                        <div className="divide-y divide-slate-50">
                            {filteredMeasurements.map((m) => (
                                <div key={m.id} className="p-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between group">
                                    <div className="flex items-center gap-6">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data</span>
                                            <span className="text-sm font-bold text-deep-midnight">{formatDate(m.recorded_at)}</span>
                                        </div>
                                        <div className="h-8 w-px bg-slate-100" />
                                        <div className="flex items-center gap-8">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Peso</span>
                                                <span className="text-sm font-black text-blue-600">{formatNumber(m.weight, 1)} kg</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Altura</span>
                                                <span className="text-sm font-black text-slate-600">{m.height ? `${formatNumber(m.height, 2)} m` : '--'}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gordura</span>
                                                <span className="text-sm font-black text-red-500">{m.body_fat ? `${formatNumber(m.body_fat, 1)}%` : '--'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ChevronRight className="h-4 w-4 text-slate-300" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 flex flex-col items-center justify-center text-center">
                            <Ruler className="h-10 w-10 text-slate-100 mb-3" />
                            <p className="text-sm text-slate-400 font-medium tracking-tight">Nenhum registro encontrado.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <CreateMeasurementModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                studentId={id}
                onSuccess={fetchData}
            />
        </div>
    );
}
