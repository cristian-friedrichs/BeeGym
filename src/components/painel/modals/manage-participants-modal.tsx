'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Trash2, Users, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ManageParticipantsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    eventId?: string;
    eventName?: string;
    eventDate?: string;
    eventTime?: string;
    capacityLimit?: number;
    onSuccess?: () => void;
}

interface Participant {
    id: string;
    student_id: string;
    name: string;
    avatar_url: string | null;
}

interface Student {
    id: string;
    name: string;
    avatar_url: string | null;
}

export function ManageParticipantsModal({
    open,
    onOpenChange,
    eventId,
    eventName,
    eventDate,
    eventTime,
    capacityLimit = 0,
    onSuccess
}: ManageParticipantsModalProps) {
    const { toast } = useToast();
    const supabase = createClient();

    const [loading, setLoading] = useState(false);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState('');

    useEffect(() => {
        if (open && eventId) {
            fetchData();
        }
    }, [open, eventId]);

    async function fetchData() {
        await Promise.all([fetchParticipants(), fetchStudents()]);
    }

    async function fetchParticipants() {
        if (!eventId) return;

        try {
            const { data, error } = await supabase
                .from('event_enrollments' as any)
                .select(`
                    id,
                    student_id,
                    students (
                        id,
                        name:full_name
                    )
                `)
                .eq('event_id', eventId);

            if (error) throw error;

            if (data) {
                setParticipants(data.map((p: any) => ({
                    id: p.id,
                    student_id: p.student_id,
                    name: p.students?.name || 'Desconhecido',
                    avatar_url: null // Removido para segurança
                })));
            }
        } catch (error) {
            console.error('Error fetching participants:', error);
            toast({
                title: 'Erro ao carregar participantes',
                description: 'Não foi possível carregar a lista de inscritos.',
                variant: 'destructive',
            });
        }
    }

    async function fetchStudents() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: userData } = await (supabase as any)
                .from('profiles')
                .select('organization_id')
                .eq('id', user.id)
                .single();

            if (!userData?.organization_id) return;

            const { data, error } = await (supabase as any)
                .from('students')
                .select('id, full_name, avatar_url')
                .eq('organization_id', userData.organization_id)
                .eq('status', 'ACTIVE')
                .order('full_name');

            if (error) throw error;
            if (data) {
                setStudents(data.map((s: any) => ({
                    id: s.id,
                    name: s.full_name,
                    avatar_url: s.avatar_url
                })));
            }
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    }

    async function handleAdd() {
        if (!selectedStudent || !eventId || isFull) return;

        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('add_participant_to_event', {
                p_event_id: eventId,
                p_student_id: selectedStudent
            } as any);

            if (error) throw error;

            const result = typeof data === 'string' ? JSON.parse(data) : data;

            if (!result.success) {
                toast({
                    title: 'Erro',
                    description: result.message || 'Não foi possível adicionar o aluno.',
                    variant: 'destructive',
                });
                return;
            }

            toast({
                title: 'Aluno adicionado!',
                description: 'O aluno foi inscrito no treino com sucesso.',
            });

            setSelectedStudent('');
            await fetchParticipants();
            onSuccess?.();
        } catch (error) {
            console.error('Error adding participant:', error);
            toast({
                title: 'Erro ao adicionar aluno',
                description: 'Não foi possível inscrever o aluno. Tente novamente.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }

    async function handleRemove(studentId: string) {
        if (!eventId) return;

        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('remove_participant_from_event', {
                p_event_id: eventId,
                p_student_id: studentId
            } as any);

            if (error) throw error;

            const result = typeof data === 'string' ? JSON.parse(data) : data;

            if (!result.success) {
                toast({
                    title: 'Erro',
                    description: result.message || 'Não foi possível remover o aluno.',
                    variant: 'destructive',
                });
                return;
            }

            toast({
                title: 'Aluno removido',
                description: 'O aluno foi removido do treino.',
            });

            await fetchParticipants();
            onSuccess?.();
        } catch (error) {
            console.error('Error removing participant:', error);
            toast({
                title: 'Erro ao remover aluno',
                description: 'Não foi possível remover o aluno. Tente novamente.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }

    const isFull = participants.length >= capacityLimit;
    const availableStudents = students.filter(
        student => !participants.some(p => p.student_id === student.id)
    );

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[540px] flex flex-col h-full overflow-y-auto p-0 gap-0">
                <SheetHeader className="relative p-0 mb-8 mt-[-24px] mx-[-24px] overflow-hidden rounded-t-[2rem]">
                    <div className="absolute inset-0 bg-gradient-to-r from-bee-midnight via-slate-900 to-bee-midnight" />
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-bee-amber/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-bee-amber/5 rounded-full blur-3xl" />

                    <div className="relative px-8 pt-10 pb-8 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-bee-amber to-amber-600 p-[1px] shadow-lg shadow-bee-amber/20 group animate-in zoom-in-50 duration-500">
                                    <div className="flex h-full w-full items-center justify-center rounded-[15px] bg-bee-midnight/90 backdrop-blur-xl transition-colors group-hover:bg-bee-midnight/40">
                                        <Users className="h-7 w-7 text-bee-amber animate-pulse" />
                                    </div>
                                </div>
                                <div>
                                    <SheetTitle className="text-3xl font-black text-white tracking-tight leading-none font-display mb-2">
                                        Participantes
                                    </SheetTitle>
                                    <SheetDescription className="flex items-center gap-3">
                                        <Badge variant="outline" className="bg-bee-amber/10 text-bee-amber border-bee-amber/30 font-bold uppercase tracking-wider text-[10px] px-2.5 py-0.5 rounded-full font-sans">
                                            {participants.length}/{capacityLimit} Vagas
                                        </Badge>
                                        <div className="h-1 w-1 rounded-full bg-slate-700" />
                                        <span className="flex items-center gap-1.5 text-slate-400 font-bold text-[11px] uppercase tracking-wider font-sans">
                                            Gerenciar inscrições
                                        </span>
                                    </SheetDescription>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-bee-amber/20 to-transparent" />
                </SheetHeader>

                <div className="flex-1 p-6 pt-0 space-y-6 overflow-y-auto">
                    {/* Lista de Inscritos */}
                    <div className="space-y-3">
                        <Label className="font-sans font-medium text-sm text-deep-midnight">
                            Alunos Inscritos ({participants.length})
                        </Label>
                        {participants.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Nenhum aluno inscrito ainda.</p>
                            </div>
                        ) : (
                            <div className="border rounded-md divide-y max-h-[250px] overflow-y-auto">
                                {participants.map((participant) => (
                                    <div key={participant.id} className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={participant.avatar_url || undefined} />
                                                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                                    {participant.name[0]?.toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-sans">{participant.name}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemove(participant.student_id)}
                                            disabled={loading}
                                            className="hover:bg-destructive/10"
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Adicionar Aluno */}
                    <div className="space-y-3">
                        <Label className="font-sans font-medium text-sm text-deep-midnight">
                            Adicionar Aluno
                        </Label>
                        <div className="flex gap-2">
                            <Select
                                value={selectedStudent}
                                onValueChange={setSelectedStudent}
                                disabled={isFull || loading}
                            >
                                <SelectTrigger className="flex-1 h-11 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-lg focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                                    <SelectValue placeholder="Selecione um aluno" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableStudents.length === 0 ? (
                                        <div className="p-2 text-sm text-muted-foreground text-center">
                                            Todos os alunos já estão inscritos
                                        </div>
                                    ) : (
                                        availableStudents.map((student) => (
                                            <SelectItem key={student.id} value={student.id}>
                                                {student.name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            <Button
                                onClick={handleAdd}
                                disabled={!selectedStudent || isFull || loading}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11"
                            >
                                {loading ? 'Adicionando...' : 'Adicionar'}
                            </Button>
                        </div>
                        {isFull && (
                            <p className="text-sm text-destructive font-medium">
                                ⚠️ Capacidade máxima atingida
                            </p>
                        )}
                    </div>
                </div>

                <div className="p-8 bg-slate-50/50 backdrop-blur-sm border-t flex justify-end">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="h-10 px-8 rounded-xl font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all"
                    >
                        Fechar
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
