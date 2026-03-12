'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
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
    MoreVertical,
    AlertTriangle
} from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
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
import { UnitForm } from './unit-form';
import { createUnitAction, updateUnitAction, deleteUnitAction } from '@/actions/units';
import { useToast } from '@/hooks/use-toast';
import { Save, X, Loader2 } from 'lucide-react';
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
        <div className="space-y-6">
            <SectionHeader
                title="Unidades & Filiais"
                subtitle="Gerencie os diferentes locais de atendimento"
                action={
                    <Button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-bee-amber hover:bg-amber-500 text-deep-midnight font-bold h-9 px-4 rounded-full shadow-lg shadow-bee-amber/10 transition-all hover:scale-[1.02] active:scale-[0.98] text-[11px] uppercase tracking-wider"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Unidade
                    </Button>
                }
            />

            <Card className="rounded-[2rem] shadow-sm border-slate-100 overflow-hidden bg-white">

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
                                                    <Badge className="bg-bee-amber hover:bg-bee-amber text-bee-midnight border-none font-bold uppercase tracking-widest text-[10px]">Matriz</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] border-slate-200">Filial</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-bee-amber shrink-0" />
                                                    <span className="font-bold text-slate-700">{unit.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <MapPin className="h-4 w-4 text-bee-amber/60 shrink-0" />
                                                    <span className="text-slate-600 font-medium font-sans">
                                                        {unit.address_city && unit.address_state
                                                            ? `${unit.address_city} - ${unit.address_state}`
                                                            : '-'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <User className="h-4 w-4 text-bee-amber/60 shrink-0" />
                                                    <span className="text-slate-600 font-medium font-sans">{unit.manager_name || '-'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    {unit.phone && (
                                                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium font-sans">
                                                            <Phone className="h-3 w-3 text-bee-amber/60 shrink-0" />
                                                            {unit.phone}
                                                        </div>
                                                    )}
                                                    {unit.email && (
                                                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium font-sans">
                                                            <Mail className="h-3 w-3 text-bee-amber/60 shrink-0" />
                                                            {unit.email}
                                                        </div>
                                                    )}
                                                    {!unit.phone && !unit.email && '-'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1 px-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 text-bee-midnight hover:bg-bee-amber/10 hover:text-bee-amber rounded-xl transition-all border border-transparent hover:border-bee-amber/20 shadow-none"
                                                        onClick={() => setEditingUnit(unit)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    {!unit.is_main && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 text-slate-400 hover:text-destructive rounded-xl hover:bg-red-50 transition-all border border-transparent hover:border-red-100 shadow-none"
                                                            onClick={() => setDeletingUnitId(unit.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
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
                {/* Add Sidebar */}
                <Sheet open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                    <SheetContent side="right" className="sm:max-w-xl p-0 overflow-hidden border-l border-slate-100 shadow-2xl flex flex-col h-full">
                        <SheetHeader className="relative p-8 bg-gradient-to-br from-bee-midnight via-bee-midnight to-slate-900 border-none shrink-0 overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-bee-amber/10 blur-3xl rounded-full -mr-16 -mt-16" />

                            <div className="relative flex items-center gap-5">
                                <div className="h-16 w-16 rounded-[22px] bg-bee-amber/10 flex items-center justify-center ring-1 ring-bee-amber/20">
                                    <Building2 className="h-8 w-8 text-bee-amber" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <SheetTitle className="text-2xl font-black text-white tracking-tight">Nova Unidade</SheetTitle>
                                        <Badge className="bg-bee-amber text-bee-midnight border-none font-black uppercase text-[10px] tracking-tighter h-5 px-2">Gestão</Badge>
                                    </div>
                                    <SheetDescription className="text-slate-400 font-medium">
                                        Filial ou Unidade de Negócio
                                    </SheetDescription>
                                </div>
                            </div>
                        </SheetHeader>
                        <div className="flex-1 overflow-y-auto p-8 pt-6">
                            <UnitForm
                                formId="add-unit-form"
                                onSubmit={handleAddUnit}
                                isLoading={isLoading}
                                showButtons={false}
                            />
                        </div>
                        <SheetFooter className="p-8 border-t bg-white flex items-center gap-3 shrink-0 sm:justify-end sticky bottom-0 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
                            <Button
                                variant="ghost"
                                onClick={() => setIsAddModalOpen(false)}
                                className="flex-1 sm:flex-none text-slate-400 hover:text-slate-600 hover:bg-slate-100 font-black h-12 rounded-full uppercase text-[10px] tracking-widest transition-all"
                            >
                                <X className="mr-2 h-4 w-4" />
                                Descartar
                            </Button>
                            <Button
                                type="submit"
                                form="add-unit-form"
                                disabled={isLoading}
                                className="flex-1 sm:flex-none bg-bee-amber hover:bg-amber-500 text-bee-midnight font-black h-12 rounded-full shadow-lg shadow-bee-amber/20 transition-all hover:-translate-y-0.5 active:scale-95 uppercase text-[10px] tracking-widest px-10"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Salvar Unidade
                                    </>
                                )}
                            </Button>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>

                {/* Edit Modal */}
                {/* Edit Sidebar */}
                <Sheet open={!!editingUnit} onOpenChange={(open) => !open && setEditingUnit(null)}>
                    <SheetContent side="right" className="sm:max-w-xl p-0 overflow-hidden border-l border-slate-100 shadow-2xl flex flex-col h-full">
                        <SheetHeader className="relative p-8 bg-gradient-to-br from-bee-midnight via-bee-midnight to-slate-900 border-none shrink-0 overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-bee-amber/10 blur-3xl rounded-full -mr-16 -mt-16" />

                            <div className="relative flex items-center gap-5">
                                <div className="h-16 w-16 rounded-[22px] bg-bee-amber/10 flex items-center justify-center ring-1 ring-bee-amber/20">
                                    <Building2 className="h-8 w-8 text-bee-amber" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <SheetTitle className="text-2xl font-black text-white tracking-tight">
                                            {editingUnit?.name || 'Editar Unidade'}
                                        </SheetTitle>
                                        <Badge className="bg-bee-amber text-bee-midnight border-none font-black uppercase text-[10px] tracking-tighter h-5 px-2">Atualizar</Badge>
                                    </div>
                                    <SheetDescription className="text-slate-400 font-medium">
                                        Gerencie as informações da unidade
                                    </SheetDescription>
                                </div>
                            </div>
                        </SheetHeader>
                        <div className="flex-1 overflow-y-auto p-8 pt-6">
                            {editingUnit && (
                                <UnitForm
                                    formId="edit-unit-form"
                                    initialData={editingUnit}
                                    onSubmit={handleUpdateUnit}
                                    isLoading={isLoading}
                                    showButtons={false}
                                />
                            )}
                        </div>
                        <SheetFooter className="p-8 border-t bg-white flex items-center gap-3 shrink-0 sm:justify-end sticky bottom-0 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
                            <Button
                                variant="ghost"
                                onClick={() => setEditingUnit(null)}
                                className="flex-1 sm:flex-none text-slate-400 hover:text-slate-600 hover:bg-slate-100 font-black h-12 rounded-full uppercase text-[10px] tracking-widest transition-all"
                            >
                                <X className="mr-2 h-4 w-4" />
                                Descartar
                            </Button>
                            <Button
                                type="submit"
                                form="edit-unit-form"
                                disabled={isLoading}
                                className="flex-1 sm:flex-none bg-bee-amber hover:bg-amber-500 text-bee-midnight font-black h-12 rounded-full shadow-lg shadow-bee-amber/20 transition-all hover:-translate-y-0.5 active:scale-95 uppercase text-[10px] tracking-widest px-10"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Salvar Unidade
                                    </>
                                )}
                            </Button>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>

                {/* Delete Alert */}
                {/* Delete Sidebar */}
                <Sheet open={!!deletingUnitId} onOpenChange={(open) => !open && setDeletingUnitId(null)}>
                    <SheetContent side="right" className="sm:max-w-md p-0 overflow-hidden border-l border-slate-100 shadow-2xl flex flex-col h-full">
                        <SheetHeader className="relative p-8 bg-gradient-to-br from-red-900 via-red-950 to-black border-none shrink-0 overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl rounded-full -mr-16 -mt-16" />

                            <div className="relative flex items-center gap-5">
                                <div className="h-16 w-16 rounded-[22px] bg-red-500/10 flex items-center justify-center ring-1 ring-red-500/20">
                                    <AlertTriangle className="h-8 w-8 text-red-500" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <SheetTitle className="text-2xl font-black text-white tracking-tight">Excluir Unidade</SheetTitle>
                                        <Badge className="bg-red-500 text-white border-none font-black uppercase text-[10px] tracking-tighter h-5 px-2">Atenção</Badge>
                                    </div>
                                    <SheetDescription className="text-red-200 font-medium">
                                        Esta ação é permanente e irreversível
                                    </SheetDescription>
                                </div>
                            </div>
                        </SheetHeader>
                        <div className="flex-1 overflow-y-auto p-8 pt-6">
                            <p className="text-slate-600 font-sans text-base leading-relaxed">
                                Tem certeza que deseja excluir esta unidade? Esta ação não pode ser desfeita e removerá permanentemente os dados associados.
                            </p>
                        </div>
                        <SheetFooter className="p-8 border-t bg-white flex items-center gap-3 shrink-0 sm:justify-end sticky bottom-0 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
                            <Button
                                variant="ghost"
                                onClick={() => setDeletingUnitId(null)}
                                className="flex-1 sm:flex-none text-slate-400 hover:text-slate-600 hover:bg-slate-100 font-black h-12 rounded-full uppercase text-[10px] tracking-widest transition-all"
                            >
                                <X className="mr-2 h-4 w-4" />
                                Manter Unidade
                            </Button>
                            <Button
                                onClick={handleDeleteUnit}
                                disabled={isLoading}
                                className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white font-black h-12 rounded-full shadow-lg shadow-red-200 transition-all hover:-translate-y-0.5 active:scale-95 uppercase text-[10px] tracking-widest px-10"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Excluindo...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Sim, Excluir
                                    </>
                                )}
                            </Button>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            </Card>
        </div>
    );
}
