'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
    Building2,
    MapPin,
    Phone,
    Mail,
    User,
    Edit,
    Trash2,
    Plus,
    MoreVertical
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { UnitForm } from './unit-form';
import { createUnitAction, updateUnitAction, deleteUnitAction } from '@/actions/units';
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface Unit {
    id: string;
    name: string;
    manager_name: string | null;
    email: string | null;
    phone: string | null;
    address_zip: string | null;
    address_street: string | null;
    address_number: string | null;
    address_neighborhood: string | null;
    address_city: string | null;
    address_state: string | null;
    is_main: boolean;
    organization_id: string;
}

interface UnitListProps {
    units: Unit[];
    organizationId: string;
}

export function UnitList({ units: initialUnits, organizationId }: UnitListProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
    const [deletingUnitId, setDeletingUnitId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Sorting: Matriz at the top, then alphabetically
    const sortedUnits = [...initialUnits].sort((a, b) => {
        if (a.is_main && !b.is_main) return -1;
        if (!a.is_main && b.is_main) return 1;
        return a.name.localeCompare(b.name);
    });

    const handleAddUnit = async (values: any) => {
        setIsLoading(true);
        const result = await createUnitAction({ ...values, organization_id: organizationId });
        setIsLoading(false);

        if (result.success) {
            toast({ title: 'Sucesso', description: 'Unidade criada com sucesso!' });
            setIsAddModalOpen(false);

            setTimeout(() => {
                router.refresh();
            }, 300);
        } else {
            toast({ title: 'Erro', description: result.error, variant: 'destructive' });
        }
    };

    const handleUpdateUnit = async (values: any) => {
        if (!editingUnit) return;
        setIsLoading(true);
        const result = await updateUnitAction(editingUnit.id, values);
        setIsLoading(false);

        if (result.success) {
            toast({ title: 'Sucesso', description: 'Unidade atualizada com sucesso!' });
            setEditingUnit(null);

            setTimeout(() => {
                router.refresh();
            }, 300);
        } else {
            toast({ title: 'Erro', description: result.error, variant: 'destructive' });
        }
    };

    const handleDeleteUnit = async () => {
        if (!deletingUnitId) return;
        setIsLoading(true);
        const result = await deleteUnitAction(deletingUnitId);
        setIsLoading(false);

        if (result.success) {
            toast({ title: 'Sucesso', description: 'Unidade excluída com sucesso!' });
            setDeletingUnitId(null);

            setTimeout(() => {
                router.refresh();
            }, 300);
        } else {
            toast({ title: 'Erro', description: result.error, variant: 'destructive' });
        }
    };

    return (
        <Card className="rounded-[16px] shadow-sm border-slate-100 overflow-hidden bg-white">
            <CardHeader className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <div className="h-5 w-5 text-orange-500">
                        <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold text-deep-midnight tracking-tight font-display">Unidades & Filiais</CardTitle>
                    </div>
                </div>
                <Button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-9 px-4 rounded-xl shadow-lg shadow-orange-100 transition-all hover:scale-[1.02] active:scale-[0.98] text-[11px] uppercase tracking-wider"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Unidade
                </Button>
            </CardHeader>

            <CardContent className="p-0">
                <div className="overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Status</TableHead>
                                <TableHead>Nome</TableHead>
                                <TableHead>Localização</TableHead>
                                <TableHead>Gerente</TableHead>
                                <TableHead>Contato</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedUnits.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        Nenhuma unidade encontrada.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedUnits.map((unit) => (
                                    <TableRow key={unit.id} className="hover:bg-muted/50 transition-colors">
                                        <TableCell>
                                            {unit.is_main ? (
                                                <Badge className="bg-primary text-primary-foreground">Matriz</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-muted-foreground">Filial</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-primary shrink-0" />
                                                {unit.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm">
                                                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                                                {unit.address_city && unit.address_state
                                                    ? `${unit.address_city} - ${unit.address_state}`
                                                    : '-'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm">
                                                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                                                {unit.manager_name || '-'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                {unit.phone && (
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Phone className="h-3 w-3 shrink-0" />
                                                        {unit.phone}
                                                    </div>
                                                )}
                                                {unit.email && (
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Mail className="h-3 w-3 shrink-0" />
                                                        {unit.email}
                                                    </div>
                                                )}
                                                {!unit.phone && !unit.email && '-'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => setEditingUnit(unit)} className="gap-2">
                                                        <Edit className="h-4 w-4" /> Editar
                                                    </DropdownMenuItem>
                                                    {!unit.is_main && (
                                                        <DropdownMenuItem
                                                            onClick={() => setDeletingUnitId(unit.id)}
                                                            className="gap-2 text-destructive focus:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" /> Excluir
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            {/* Modals outside CardContent but inside Card */}
            {/* Add Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Nova Unidade (Filial)</DialogTitle>
                    </DialogHeader>
                    <UnitForm onSubmit={handleAddUnit} isLoading={isLoading} />
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={!!editingUnit} onOpenChange={(open) => !open && setEditingUnit(null)}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Editar Unidade: {editingUnit?.name}</DialogTitle>
                    </DialogHeader>
                    <UnitForm
                        initialData={editingUnit}
                        onSubmit={handleUpdateUnit}
                        isLoading={isLoading}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Alert */}
            <AlertDialog open={!!deletingUnitId} onOpenChange={(open) => !open && setDeletingUnitId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente a unidade
                            e todos os dados associados a ela.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteUnit}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
