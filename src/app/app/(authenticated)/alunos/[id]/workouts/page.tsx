'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Dumbbell, History, Search, ChevronRight, CheckCircle2, XCircle, AlertCircle, Clock, Calendar, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from 'next/link';
import { WorkoutModal } from "@/components/treinos/workout-modal";

export default function StudentWorkoutsPage() {
    const supabase = createClient();
    const params = useParams();
    const id = params.id as string;

    const [student, setStudent] = useState<any>(null);
    const [workouts, setWorkouts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        if (!id) return;
        try {
            const { data: sData } = await (supabase as any).from('students').select('full_name').eq('id', id).single();
            setStudent(sData);

            const { data: wData } = await (supabase as any)
                .from('workouts')
                .select('*')
                .eq('student_id', id)
                .order('scheduled_at', { ascending: false });

            setWorkouts(wData || []);
        } catch (error) {
            console.error('Error fetching workouts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Concluido': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
            case 'Faltou': return <XCircle className="h-4 w-4 text-red-500" />;
            case 'Cancelado': return <AlertCircle className="h-4 w-4 text-slate-400" />;
            case 'Em Execução': return <Clock className="h-4 w-4 text-bee-amber animate-pulse" />;
            default: return <Calendar className="h-4 w-4 text-bee-amber" />;
        }
    };

    const filteredWorkouts = workouts.filter(w =>
        w.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        format(new Date(w.scheduled_at || w.created_at), "dd/MM/yyyy").includes(searchTerm)
    );

    if (loading) return <div className="p-8 flex justify-center"><Dumbbell className="h-6 w-6 animate-spin text-orange-500" /></div>;

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
                        <h1 className="text-2xl font-black text-deep-midnight tracking-tight">Histórico de Atividades</h1>
                        <p className="text-sm text-slate-400 font-medium">{student?.full_name}</p>
                    </div>
                    <Button onClick={() => setIsModalOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white font-bold gap-2">
                        <Plus className="h-4 w-4" /> Registrar Aula
                    </Button>
                </div>
            </div>

            {/* Content Card */}
            <Card className="rounded-[16px] shadow-sm border-slate-100 overflow-hidden bg-white">
                <CardHeader className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <History className="h-5 w-5 text-orange-500" />
                        <CardTitle className="text-lg font-bold text-deep-midnight tracking-tight font-display uppercase tracking-wider">Atividades</CardTitle>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <Input
                                placeholder="Buscar treino ou data..."
                                className="h-9 pl-9 w-[240px] text-xs bg-white border-slate-100 focus-visible:ring-1 focus-visible:ring-orange-200"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {filteredWorkouts.length > 0 ? (
                        <div className="divide-y divide-slate-50">
                            {filteredWorkouts.map((w) => (
                                <div key={w.id} className="p-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between group cursor-pointer" onClick={() => setIsModalOpen(true)}>
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-white rounded-[10px] flex items-center justify-center border group-hover:bg-amber-50 group-hover:border-orange-100 transition-colors">
                                            {getStatusIcon(w.status)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-deep-midnight group-hover:text-bee-amber transition-colors">{w.title}</h4>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">
                                                {w.type || 'Geral'} • {format(new Date(w.scheduled_at || w.created_at), "dd/MM/yyyy 'às' HH:mm")}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${w.status === 'Concluido' ? 'bg-emerald-50 text-emerald-600' :
                                            w.status === 'Faltou' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                            {w.status}
                                        </span>
                                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-bee-amber transition-colors" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 flex flex-col items-center justify-center text-center">
                            <Dumbbell className="h-10 w-10 text-slate-100 mb-3" />
                            <p className="text-sm text-slate-400 font-medium tracking-tight">Nenhuma atividade encontrada.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <WorkoutModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                defaultStudentId={id}
                onSuccess={fetchData}
            />
        </div>
    );
}
