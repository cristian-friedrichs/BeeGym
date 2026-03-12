'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus, Filter, ArrowUpDown, MoreHorizontal, User, Mail, Phone, Calendar as CalendarIcon, Edit2, Eye, ExternalLink } from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import { StudentModal } from '@/components/alunos/student-modal';
import { SectionHeader } from '@/components/ui/section-header';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useStudentLimit } from '@/hooks/useStudentLimit';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { useUnit } from '@/context/UnitContext';

interface Student {
    id: string;
    full_name: string;
    email: string | null;
    avatar_url: string | null;
    status: string;
    objective: string | null;
    plan: string | null;
    membership_plans?: { name: string } | null; // Join Relation
    last_activity: string | null; // Coluna computada restaurada
    birth_date?: string | null;
}

export default function StudentsPage() {
    const supabase = createClient();
    const { toast } = useToast();
    const { hasReachedLimit, maxStudents } = useStudentLimit();
    const { plan, organizationId } = useSubscription();
    const { currentUnitId } = useUnit();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);

    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Modal Control
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);

    const fetchStudents = async () => {
        setLoading(true);

        if (!currentUnitId) {
            setStudents([]);
            setLoading(false);
            return;
        }

        // 1. Opcional: Forçar atualização dos status das aulas passadas
        await (supabase.rpc as any)('update_finished_classes_status');

        let query = supabase
            .from('students')
            .select('*, last_activity, membership_plans(name)') // Join com tabela de planos
            .order('full_name');

        if (currentUnitId === organizationId) {
            // Se é a unidade Master/Principal, queremos os alunos legados (sem unidade, associados apenas à org) 
            // e alunos que (em teoria) possam ter a master como unit_id
            query = query.or(`unit_id.is.null,unit_id.eq.${currentUnitId}`);
            // Garantimos que filtramos apenas pela ORG
            query = query.eq('organization_id', organizationId);
        } else {
            // Se é filial, traz apenas da filial
            query = query.eq('unit_id', currentUnitId);
        }

        const { data, error } = await query;

        if (error) console.error("Erro ao buscar alunos:", error);

        if (data) {
            // Also ensure we map birth_date
            setStudents(data as unknown as Student[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchStudents();
    }, [currentUnitId]);

    const filteredStudents = students.filter(student => {
        const matchesSearch = student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE': return <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50 shadow-none border border-emerald-100 rounded-full font-sans text-[11px] font-bold px-2 py-0.5">ATIVO</Badge>;
            case 'OVERDUE': return <Badge className="bg-red-50 text-red-600 hover:bg-red-50 shadow-none border border-red-100 rounded-full font-sans text-[11px] font-bold px-2 py-0.5">INADIMPLENTE</Badge>;
            case 'INACTIVE': return <Badge variant="secondary" className="rounded-full font-sans text-[11px] font-bold px-2 py-0.5">INATIVO</Badge>;
            default: return <Badge variant="outline" className="rounded-full font-sans text-[11px] font-bold px-2 py-0.5">{status}</Badge>;
        }
    };

    // Função para formatar a última atividade de forma amigável
    const formatLastActivity = (dateString: string | null) => {
        if (!dateString) return <span className="text-slate-400 text-sm">-</span>;

        const date = new Date(dateString);
        return (
            <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-700">
                    {format(date, "dd/MM/yyyy", { locale: ptBR })}
                </span>
                <span className="text-xs text-muted-foreground capitalize">
                    {formatDistanceToNow(date, { addSuffix: true, locale: ptBR })}
                </span>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Alunos"
                subtitle="Gerenciamento de alunos e matrículas"
                action={
                    <Button
                        className="font-bold shadow-sm bg-bee-amber text-bee-midnight rounded-full font-display uppercase tracking-wider text-[11px] h-10 px-6 transition-all hover:-translate-y-0.5 active:scale-95 border-none"
                        onClick={() => {
                            if (hasReachedLimit) {
                                toast({
                                    title: "Limite de alunos atingido",
                                    description: `Seu plano ${plan?.name} permite até ${maxStudents} alunos ativos. Inative antigos ou faça downgrade/upgrade.`,
                                    variant: "destructive"
                                });
                                return;
                            }
                            setStudentToEdit(null);
                            setIsModalOpen(true);
                        }}
                    >
                        <Plus className="mr-2 h-4 w-4 text-[#0B0F1A]" />
                        Novo Aluno
                    </Button>
                }
            />

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar aluno..."
                        className="pl-9 bg-slate-50 border-slate-200 rounded-full font-sans transition-all focus:bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px] h-10 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-full focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-[8px]">
                            <SelectItem value="all">Todos os status</SelectItem>
                            <SelectItem value="ACTIVE">Ativo</SelectItem>
                            <SelectItem value="OVERDUE">Inadimplente</SelectItem>
                            <SelectItem value="INACTIVE">Inativo</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
                            <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Aluno</TableHead>
                            <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Objetivo</TableHead>
                            <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Plano</TableHead>
                            <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Última Atividade</TableHead>
                            <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Status</TableHead>
                            <TableHead className="text-right font-bold text-[11px] uppercase tracking-wider text-slate-500">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6} className="h-48 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
                        ) : filteredStudents.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="h-48 text-center text-muted-foreground">Nenhum aluno encontrado.</TableCell></TableRow>
                        ) : (
                            filteredStudents.map((student) => (
                                <TableRow key={student.id} className="hover:bg-slate-50/50 cursor-pointer group">
                                    <TableCell>
                                        <Link href={`/app/alunos/${student.id}`} className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 border border-slate-100 ring-1 ring-slate-100 ring-offset-2">
                                                <AvatarImage src={student.avatar_url || ''} className="object-cover" />
                                                <AvatarFallback className="bg-orange-100 text-bee-amber font-bold">
                                                    {student.full_name.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 group-hover:text-bee-amber transition-colors font-sans">
                                                    {student.full_name}
                                                </span>
                                                <span className="text-[11px] text-muted-foreground font-sans font-bold uppercase tracking-wider">{student.email}</span>
                                            </div>
                                        </Link>
                                    </TableCell>
                                    <TableCell className="font-bold text-slate-600 font-sans text-xs">{student.objective || 'Não informado'}</TableCell>
                                    <TableCell className="font-bold text-slate-600 font-sans text-xs">
                                        {student.membership_plans?.name || <span className="text-muted-foreground italic font-normal">Sem Plano</span>}
                                    </TableCell>

                                    {/* NOVA COLUNA */}
                                    <TableCell>{formatLastActivity(student.last_activity)}</TableCell>
                                    <TableCell>{getStatusBadge(student.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Link href={`/app/alunos/${student.id}`}>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-9 w-9 text-bee-midnight hover:bg-bee-amber/10 hover:text-bee-amber rounded-xl transition-all border border-transparent hover:border-bee-amber/20 shadow-none"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-9 w-9 text-bee-midnight hover:bg-bee-amber/10 hover:text-bee-amber rounded-xl transition-all border border-transparent hover:border-bee-amber/20 shadow-none"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setStudentToEdit(student);
                                                    setIsModalOpen(true);
                                                }}
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <StudentModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                studentToEdit={studentToEdit}
                onSuccess={fetchStudents}
            />
        </div>
    );
}
