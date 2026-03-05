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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreHorizontal, Pencil, Trash2, ShieldPlus, Shield } from 'lucide-react';
import { RoleForm } from './role-form';
import { createRoleAction, updateRoleAction, deleteRoleAction } from '@/actions/roles';
import type { AppRole, Permissions } from '@/types/permissions';
import { PERMISSION_MODULES } from '@/types/permissions';

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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-[#0B0F1A]">Perfis de Acesso</h2>
                    <p className="text-muted-foreground">
                        Defina o que cada tipo de funcionário pode acessar no sistema.
                    </p>
                </div>
                <Button className="gap-2" onClick={openCreate}>
                    <ShieldPlus className="h-4 w-4" />
                    Novo Perfil
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle>Perfis da Organização</CardTitle>
                    <CardDescription>
                        Cada perfil define um conjunto de permissões. Vincule aos membros da equipe para controlar o acesso.
                    </CardDescription>
                </CardHeader>
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
                                                    <Shield className="h-4 w-4 text-primary" />
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
                                                <Badge variant={enabled === total ? 'default' : 'secondary'}>
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

            {/* Create/Edit Form */}
            <RoleForm
                open={formOpen}
                onOpenChange={(open) => {
                    setFormOpen(open);
                    if (!open) setEditingRole(null);
                }}
                onSubmit={editingRole ? handleUpdate : handleCreate}
                initialData={editingRole}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir perfil "{deletingRole?.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Se houver membros vinculados a este perfil,
                            a exclusão será bloqueada.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? 'Excluindo...' : 'Excluir'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
