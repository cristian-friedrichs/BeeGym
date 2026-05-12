'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Save, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreVertical, Edit, Trash2, Plus, Users, Layout, AlertTriangle } from 'lucide-react';
import { RoomForm, RoomFormValues } from './room-form';
import { createRoomAction, updateRoomAction, deleteRoomAction } from '@/actions/rooms';
import { useToast } from '@/hooks/use-toast';
import { SectionHeader } from '@/components/ui/section-header';
import { useUnit } from '@/context/UnitContext';

interface Room {
    id: string;
    name: string;
    unit_id: string;
    capacity: number;
    description: string | null;
    created_at: string;
}

interface Unit {
    id: string;
    name: string;
}

interface RoomListProps {
    rooms: Room[];
    units: Unit[];
}

export function RoomList({ rooms: initialRooms, units }: RoomListProps) {
    const { toast } = useToast();
    const router = useRouter();
    const { currentUnitId } = useUnit();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);
    const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Current unit info for display
    // units prop only contains real units (not master/org). currentUnitId may be the org_id (master unit).
    const currentUnit = units.find(u => u.id === currentUnitId);
    const isMasterUnitSelected = !currentUnit && !!currentUnitId;

    const getUnitName = (unitId: string) => {
        const unit = units.find(u => u.id === unitId);
        return unit?.name || 'Unidade não encontrada';
    };

    const handleAddRoom = async (values: RoomFormValues) => {
        if (!currentUnitId || isMasterUnitSelected) {
            toast({ title: 'Selecione uma unidade', description: 'Selecione uma unidade específica na barra superior antes de criar uma sala.', variant: 'destructive' });
            return;
        }
        setIsLoading(true);
        const result = await createRoomAction({ ...values, unit_id: currentUnitId });
        setIsLoading(false);

        if (result.success) {
            toast({ title: 'Sucesso', description: 'Sala criada com sucesso!' });
            setIsAddModalOpen(false);

            setTimeout(() => {
                router.refresh();
            }, 300);
        } else {
            toast({ title: 'Erro', description: result.error, variant: 'destructive' });
        }
    };

    const handleUpdateRoom = async (values: RoomFormValues) => {
        if (!editingRoom) return;
        setIsLoading(true);
        const result = await updateRoomAction(editingRoom.id, values);
        setIsLoading(false);

        if (result.success) {
            toast({ title: 'Sucesso', description: 'Sala atualizada com sucesso!' });
            setEditingRoom(null);

            setTimeout(() => {
                router.refresh();
            }, 300);
        } else {
            toast({ title: 'Erro', description: result.error, variant: 'destructive' });
        }
    };

    const handleDeleteRoom = async () => {
        if (!deletingRoomId) return;

        setIsLoading(true);
        const result = await deleteRoomAction(deletingRoomId);
        setIsLoading(false);

        if (result.success) {
            toast({ title: 'Sucesso', description: 'Sala excluída com sucesso!' });
            setDeletingRoomId(null);
            router.refresh();
        } else {
            toast({ title: 'Erro', description: result.error, variant: 'destructive' });
        }
    };

    return (
        <div className="flex-1 space-y-6">
            <SectionHeader
                title="Salas & Espaços"
                subtitle={isMasterUnitSelected
                    ? '⚠️ Selecione uma unidade específica na topbar para criar salas'
                    : currentUnit
                        ? `Unidade: ${currentUnit.name}`
                        : 'Gerencie os locais de treinamento da sua academia'
                }
                action={
                    <Button
                        onClick={() => setIsAddModalOpen(true)}
                        disabled={isMasterUnitSelected}
                        title={isMasterUnitSelected ? 'Selecione uma unidade específica na topbar' : undefined}
                        className="bg-bee-amber hover:bg-amber-500 text-deep-midnight font-bold h-9 px-4 rounded-full shadow-lg shadow-bee-amber/10 transition-all hover:scale-[1.02] active:scale-[0.98] text-[11px] uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Sala
                    </Button>
                }
            />
            <Card className="rounded-[2rem] shadow-sm border-slate-100 overflow-hidden bg-white">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50">
                            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Nome da Sala</TableHead>
                            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Unidade</TableHead>
                            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Capacidade</TableHead>
                            <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialRooms.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    Nenhuma sala cadastrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            initialRooms.map((room) => (
                                <TableRow key={room.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-foreground">{room.name}</span>
                                            {room.description && (
                                                <span className="text-xs text-muted-foreground line-clamp-1">
                                                    {room.description}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm">{getUnitName(room.unit_id)}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            {room.capacity === 0 ? 'Ilimitado' : `${room.capacity} alunos`}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1 px-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 text-bee-midnight hover:bg-bee-amber/10 hover:text-bee-amber rounded-xl transition-all border border-transparent hover:border-bee-amber/20 shadow-none"
                                                onClick={() => setEditingRoom(room)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 text-slate-400 hover:text-destructive rounded-xl hover:bg-red-50 transition-all border border-transparent hover:border-red-100 shadow-none"
                                                onClick={() => setDeletingRoomId(room.id)}
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

            {/* Add Sidebar */}
            <Sheet open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <SheetContent side="right" className="sm:max-w-[480px] p-0 flex flex-col gap-0">
                    <SheetHeader className="px-6 pt-5 pb-4 border-b border-slate-100 flex-none">
                        <SheetTitle className="text-[17px] font-semibold text-slate-900 leading-tight">Nova Sala</SheetTitle>
                        <SheetDescription className="text-sm text-slate-500 mt-0.5">
                            {currentUnit ? `Unidade: ${currentUnit.name}` : 'Defina o espaço para aulas e treinos.'}
                        </SheetDescription>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto px-6 py-5">
                        <RoomForm formId="add-room-form" units={units} onSubmit={handleAddRoom} isLoading={isLoading} showButtons={false} />
                    </div>
                    <SheetFooter className="px-6 pb-5 pt-4 border-t border-slate-100 flex-none gap-2 flex-row">
                        <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="h-9 rounded-full px-5 border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium">Cancelar</Button>
                        <Button type="submit" form="add-room-form" disabled={isLoading || units.length === 0} className="flex-1 h-9 rounded-full bg-bee-amber hover:bg-amber-500 text-bee-midnight font-semibold text-sm shadow-sm">
                            {isLoading ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Salvando…</> : 'Salvar sala'}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Edit Sidebar */}
            <Sheet open={!!editingRoom} onOpenChange={(open) => !open && setEditingRoom(null)}>
                <SheetContent side="right" className="sm:max-w-[480px] p-0 flex flex-col gap-0">
                    <SheetHeader className="px-6 pt-5 pb-4 border-b border-slate-100 flex-none">
                        <SheetTitle className="text-[17px] font-semibold text-slate-900 leading-tight">{editingRoom?.name || 'Editar Sala'}</SheetTitle>
                        <SheetDescription className="text-sm text-slate-500 mt-0.5">Atualize as informações deste espaço.</SheetDescription>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto px-6 py-5">
                        {editingRoom && <RoomForm formId="edit-room-form" initialData={editingRoom} units={units} onSubmit={handleUpdateRoom} isLoading={isLoading} showButtons={false} />}
                    </div>
                    <SheetFooter className="px-6 pb-5 pt-4 border-t border-slate-100 flex-none gap-2 flex-row">
                        <Button variant="outline" onClick={() => setEditingRoom(null)} className="h-9 rounded-full px-5 border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium">Cancelar</Button>
                        <Button type="submit" form="edit-room-form" disabled={isLoading} className="flex-1 h-9 rounded-full bg-bee-amber hover:bg-amber-500 text-bee-midnight font-semibold text-sm shadow-sm">
                            {isLoading ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Salvando…</> : 'Salvar alterações'}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Delete Sidebar */}
            <Sheet open={!!deletingRoomId} onOpenChange={(open) => !open && setDeletingRoomId(null)}>
                <SheetContent side="right" className="sm:max-w-[400px] p-0 flex flex-col gap-0">
                    <SheetHeader className="px-6 pt-5 pb-4 border-b border-slate-100 flex-none">
                        <SheetTitle className="text-[17px] font-semibold text-slate-900 leading-tight">Excluir sala</SheetTitle>
                        <SheetDescription className="text-sm text-slate-500 mt-0.5">Esta ação é permanente e irreversível.</SheetDescription>
                    </SheetHeader>
                    <div className="flex-1 px-6 py-5">
                        <p className="text-sm text-slate-600 leading-relaxed">Tem certeza que deseja excluir esta sala? Esta ação não pode ser desfeita e removerá permanentemente os agendamentos vinculados.</p>
                    </div>
                    <SheetFooter className="px-6 pb-5 pt-4 border-t border-slate-100 flex-none gap-2 flex-row">
                        <Button variant="outline" onClick={() => setDeletingRoomId(null)} className="h-9 rounded-full px-5 border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium">Cancelar</Button>
                        <Button onClick={handleDeleteRoom} disabled={isLoading} className="flex-1 h-9 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-sm">
                            {isLoading ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Excluindo…</> : 'Sim, excluir'}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}
