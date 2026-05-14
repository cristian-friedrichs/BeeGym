'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, GraduationCap, Mail, ShieldCheck, ShieldOff, AlertTriangle, Loader2, X } from 'lucide-react';
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { SectionHeader } from '@/components/ui/section-header';
import { InstructorModal } from './instructor-modal';
import { deleteInstructorAction } from '@/actions/instructors';

interface Instructor {
    id: string;
    name: string | null;
    bio: string | null;
    user_id: string | null;
    allowed_unit_ids: string[] | null;
    has_system_access: boolean;
    email: string | null;
    account_status: string | null;
    access_role: string | null;
}

interface Unit {
    id: string;
    name: string;
}

interface AppRole {
    id: string;
    name: string;
}

interface Props {
    instructors: Instructor[];
    units: Unit[];
    roles: AppRole[];
}

export function InstructorList({ instructors, units, roles }: Props) {
    const router = useRouter();
    const { toast } = useToast();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!deletingId) return;
        setIsDeleting(true);
        const result = await deleteInstructorAction(deletingId);
        setIsDeleting(false);

        if (result.success) {
            toast({ title: 'Instrutor excluído com sucesso' });
            setDeletingId(null);
            router.refresh();
        } else {
            toast({ title: 'Erro', description: result.error, variant: 'destructive' });
        }
    };

    const getUnitsLabel = (allowedIds: string[] | null) => {
        if (!allowedIds || allowedIds.length === 0) return 'Todas as unidades';
        const names = allowedIds.map(id => units.find(u => u.id === id)?.name).filter(Boolean);
        if (names.length === 0) return '—';
        if (names.length <= 2) return names.join(', ');
        return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
    };

    return (
        <div className="flex-1 space-y-6">
            <SectionHeader
                title="Instrutores"
                subtitle="Gerencie os instrutores da sua academia, com ou sem acesso ao sistema"
                action={
                    <Button
                        onClick={() => setIsAddOpen(true)}
                        className="bg-bee-amber hover:bg-amber-500 text-deep-midnight font-bold h-9 px-4 rounded-full shadow-lg shadow-bee-amber/10 transition-all hover:scale-[1.02] active:scale-[0.98] text-[11px] uppercase tracking-wider"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Instrutor(a)
                    </Button>
                }
            />

            <Card className="rounded-[2rem] shadow-sm border-slate-100 overflow-hidden bg-white">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50">
                            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Instrutor</TableHead>
                            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Acesso</TableHead>
                            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Unidades</TableHead>
                            <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {instructors.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    Nenhum instrutor cadastrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            instructors.map((instr) => (
                                <TableRow key={instr.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                                                <GraduationCap className="h-4 w-4 text-bee-amber" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-bold text-bee-midnight truncate">{instr.name || 'Sem nome'}</span>
                                                {instr.email && (
                                                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                                        <Mail className="h-3 w-3" />
                                                        {instr.email}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {instr.has_system_access ? (
                                            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 gap-1.5 font-bold text-[10px] uppercase tracking-wider">
                                                <ShieldCheck className="h-3 w-3" />
                                                Sistema
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-100 gap-1.5 font-bold text-[10px] uppercase tracking-wider">
                                                <ShieldOff className="h-3 w-3" />
                                                Sem acesso
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-600">{getUnitsLabel(instr.allowed_unit_ids)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1 px-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 text-bee-midnight hover:bg-bee-amber/10 hover:text-bee-amber rounded-xl transition-all border border-transparent hover:border-bee-amber/20 shadow-none"
                                                onClick={() => setEditingInstructor(instr)}
                                                title="Editar"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 text-slate-400 hover:text-destructive rounded-xl hover:bg-red-50 transition-all border border-transparent hover:border-red-100 shadow-none"
                                                onClick={() => setDeletingId(instr.id)}
                                                title="Excluir"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Add modal */}
            <InstructorModal
                open={isAddOpen}
                onOpenChange={setIsAddOpen}
                mode="create"
                units={units}
                roles={roles}
            />

            {/* Edit modal */}
            <InstructorModal
                open={!!editingInstructor}
                onOpenChange={(open) => { if (!open) setEditingInstructor(null); }}
                mode="edit"
                instructor={editingInstructor}
                units={units}
                roles={roles}
            />

            {/* Delete confirmation */}
            <Sheet open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
                <SheetContent side="right" className="sm:max-w-md p-0 overflow-hidden border-l border-slate-100 shadow-2xl flex flex-col h-full">
                    <SheetHeader className="relative p-8 bg-gradient-to-br from-red-900 via-red-950 to-black border-none shrink-0 overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl rounded-full -mr-16 -mt-16" />
                        <div className="relative flex items-center gap-5">
                            <div className="h-16 w-16 rounded-[22px] bg-red-500/10 flex items-center justify-center ring-1 ring-red-500/20">
                                <AlertTriangle className="h-8 w-8 text-red-500" />
                            </div>
                            <div>
                                <SheetTitle className="text-2xl font-black text-white tracking-tight">Excluir Instrutor</SheetTitle>
                                <SheetDescription className="text-red-200 font-medium">
                                    Esta ação é permanente e irreversível
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto p-8 pt-6">
                        <p className="text-slate-600 text-base leading-relaxed">
                            Tem certeza? Se este instrutor tem acesso ao sistema, a conta de login dele também será removida.
                        </p>
                    </div>
                    <SheetFooter className="p-8 border-t bg-white flex items-center gap-3 shrink-0 sm:justify-end sticky bottom-0 z-30">
                        <Button
                            variant="ghost"
                            onClick={() => setDeletingId(null)}
                            className="flex-1 sm:flex-none text-slate-400 hover:text-slate-600 hover:bg-slate-100 font-black h-12 rounded-full uppercase text-[10px] tracking-widest"
                        >
                            <X className="mr-2 h-4 w-4" />
                            Manter
                        </Button>
                        <Button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white font-black h-12 rounded-full shadow-lg shadow-red-200 transition-all uppercase text-[10px] tracking-widest px-10"
                        >
                            {isDeleting ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Excluindo...</>
                            ) : (
                                <><Trash2 className="mr-2 h-4 w-4" /> Sim, Excluir</>
                            )}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}
