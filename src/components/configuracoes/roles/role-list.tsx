'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreHorizontal, Pencil, Trash2, ShieldPlus, Shield, Save, X, Loader2, AlertTriangle } from 'lucide-react';
import { RoleForm } from './role-form';
import { createRoleAction, updateRoleAction, deleteRoleAction } from '@/actions/roles';
import type { AppRole, Permissions } from '@/types/permissions';
import { PERMISSION_MODULES } from '@/types/permissions';
import { SectionHeader } from '@/components/ui/section-header';

interface RoleListProps {
    initialRoles: AppRole[];
    organizationId: string;
}

function countPermissions(permissions: Permissions): { enabled: number; total: number } {
    let enabled = 0;
    let total = 0;
    PERMISSION_MODULES.forEach((module) => {
        module.actions.forEach((action) => {
            total++;
            if ((permissions[module.key] as any)?.[action.key] === true) {
                enabled++;
            }
        });
    });
    return { enabled, total };
}

export function RoleList({ initialRoles, organizationId }: RoleListProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [roles, setRoles] = useState<AppRole[]>(initialRoles);

    useEffect(() => {
        setRoles(initialRoles);
    }, [initialRoles]);

    const [formOpen, setFormOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<AppRole | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingRole, setDeletingRole] = useState<AppRole | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    async function handleCreate(data: { name: string; description?: string; permissions: Permissions }) {
        const result = await createRoleAction(data);
        if (result.success) {
            toast({ title: 'Sucesso', description: `Perfil "${data.name}" criado!` });
            setFormOpen(false);
            router.refresh();
        } else {
            toast({ title: 'Erro', description: result.error, variant: 'destructive' });
        }
    }

    async function handleUpdate(data: { name: string; description?: string; permissions: Permissions }) {
        if (!editingRole) return;
        const result = await updateRoleAction(editingRole.id, data);
        if (result.success) {
            toast({ title: 'Sucesso', description: `Perfil "${data.name}" atualizado!` });
            setEditingRole(null);
            setFormOpen(false);
            router.refresh();
        } else {
            toast({ title: 'Erro', description: result.error, variant: 'destructive' });
        }
    }

    async function handleDelete() {
        if (!deletingRole) return;
        setIsDeleting(true);
        const result = await deleteRoleAction(deletingRole.id);
        if (result.success) {
            toast({ title: 'Sucesso', description: `Perfil "${deletingRole.name}" excluído!` });
            setDeleteDialogOpen(false);
            setDeletingRole(null);
            router.refresh();
        } else {
            toast({ title: 'Erro', description: result.error, variant: 'destructive' });
        }
        setIsDeleting(false);
    }

    function openEdit(role: AppRole) {
        setEditingRole(role);
        setFormOpen(true);
    }

    function openDelete(role: AppRole) {
        setDeletingRole(role);
        setDeleteDialogOpen(true);
    }

    function openCreate() {
        setEditingRole(null);
        setFormOpen(true);
    }

    return (
        <div className="flex-1 space-y-6">
            <SectionHeader
                title="Perfis de Acesso"
                subtitle="Defina o que cada tipo de funcionário pode acessar no sistema"
                action={
                    <Button
                        className="bg-bee-amber hover:bg-amber-500 text-deep-midnight font-bold h-9 px-4 rounded-full shadow-lg shadow-bee-amber/10 transition-all hover:scale-[1.02] active:scale-[0.98] text-[11px] uppercase tracking-wider"
                        onClick={openCreate}
                    >
                        <ShieldPlus className="h-4 w-4 mr-2" />
                        Novo Perfil
                    </Button>
                }
            />
            <Card className="rounded-[2rem] shadow-sm border-slate-100 overflow-hidden bg-white">
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Perfil</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Permissões</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {roles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <Shield className="h-8 w-8 text-muted-foreground/50" />
                                            <p>Nenhum perfil criado ainda.</p>
                                            <p className="text-xs">Crie um perfil para começar a controlar o acesso.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                roles.map((role) => {
                                    const { enabled, total } = countPermissions(role.permissions);
                                    return (
                                        <TableRow key={role.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Shield className="h-4 w-4 text-bee-amber" />
                                                    <span className="font-medium text-sm text-[#0B0F1A]">
                                                        {role.name}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-muted-foreground">
                                                    {role.description || '—'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={enabled === total ? 'default' : 'secondary'}
                                                    className={enabled === total
                                                        ? "bg-green-500/10 text-green-600 border-green-200"
                                                        : "bg-slate-100 text-slate-600 border-slate-200"
                                                    }
                                                >
                                                    {enabled}/{total} ativas
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            className="gap-2"
                                                            onClick={() => openEdit(role)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                            Editar Permissões
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="gap-2 text-destructive"
                                                            onClick={() => openDelete(role)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            Excluir Perfil
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Form Sidebar */}
            <Sheet open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) setEditingRole(null); }}>
                <SheetContent side="right" className="sm:max-w-[600px] p-0 flex flex-col gap-0">
                    <SheetHeader className="px-6 pt-5 pb-4 border-b border-slate-100 flex-none">
                        <SheetTitle className="text-[17px] font-semibold text-slate-900 leading-tight">{editingRole ? 'Editar Perfil' : 'Novo Perfil'}</SheetTitle>
                        <SheetDescription className="text-sm text-slate-500 mt-0.5">Defina as permissões de acesso ao sistema.</SheetDescription>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto px-6 py-5">
                        <RoleForm formId="role-form" open={formOpen} onSubmit={editingRole ? handleUpdate : handleCreate} initialData={editingRole} showButtons={false} />
                    </div>
                    <SheetFooter className="px-6 pb-5 pt-4 border-t border-slate-100 flex-none gap-2 flex-row">
                        <Button variant="outline" onClick={() => setFormOpen(false)} className="h-9 rounded-full px-5 border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium">Cancelar</Button>
                        <Button type="submit" form="role-form" className="flex-1 h-9 rounded-full bg-bee-amber hover:bg-amber-500 text-bee-midnight font-semibold text-sm shadow-sm">
                            {editingRole ? 'Salvar perfil' : 'Criar perfil'}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Delete Sidebar */}
            <Sheet open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <SheetContent side="right" className="sm:max-w-[400px] p-0 flex flex-col gap-0">
                    <SheetHeader className="px-6 pt-5 pb-4 border-b border-slate-100 flex-none">
                        <SheetTitle className="text-[17px] font-semibold text-slate-900 leading-tight">Excluir perfil</SheetTitle>
                        <SheetDescription className="text-sm text-slate-500 mt-0.5">Esta ação é permanente e irreversível.</SheetDescription>
                    </SheetHeader>
                    <div className="flex-1 px-6 py-5 space-y-2">
                        <p className="text-sm text-slate-600 leading-relaxed">Tem certeza que deseja excluir o perfil <span className="font-semibold text-slate-900">"{deletingRole?.name}"</span>?</p>
                        <p className="text-sm text-slate-400">Se houver membros vinculados, a exclusão será bloqueada.</p>
                    </div>
                    <SheetFooter className="px-6 pb-5 pt-4 border-t border-slate-100 flex-none gap-2 flex-row">
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="h-9 rounded-full px-5 border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium">Cancelar</Button>
                        <Button onClick={handleDelete} disabled={isDeleting} className="flex-1 h-9 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-sm">
                            {isDeleting ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Excluindo…</> : 'Sim, excluir'}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}
