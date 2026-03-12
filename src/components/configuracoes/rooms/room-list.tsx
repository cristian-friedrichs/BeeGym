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
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);
    const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const getUnitName = (unitId: string) => {
        const unit = units.find(u => u.id === unitId);
        return unit?.name || 'Unidade não encontrada';
    };

    const handleAddRoom = async (values: RoomFormValues) => {
        setIsLoading(true);
        const result = await createRoomAction(values);
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
                subtitle="Gerencie os locais de treinamento da sua academia"
                action={
                    <Button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-bee-amber hover:bg-amber-500 text-deep-midnight font-bold h-9 px-4 rounded-full shadow-lg shadow-bee-amber/10 transition-all hover:scale-[1.02] active:scale-[0.98] text-[11px] uppercase tracking-wider"
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
                <SheetContent side="right" className="sm:max-w-xl p-0 overflow-hidden border-l border-slate-100 shadow-2xl flex flex-col h-full">
                    <SheetHeader className="relative p-8 bg-gradient-to-br from-bee-midnight via-bee-midnight to-slate-900 border-none shrink-0 overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-bee-amber/10 blur-3xl rounded-full -mr-16 -mt-16" />

                        <div className="relative flex items-center gap-5">
                            <div className="h-16 w-16 rounded-[22px] bg-bee-amber/10 flex items-center justify-center ring-1 ring-bee-amber/20">
                                <Layout className="h-8 w-8 text-bee-amber" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <SheetTitle className="text-2xl font-black text-white tracking-tight">Nova Sala</SheetTitle>
                                    <Badge className="bg-bee-amber text-bee-midnight border-none font-black uppercase text-[10px] tracking-tighter h-5 px-2">Espaço</Badge>
                                </div>
                                <SheetDescription className="text-slate-400 font-medium">
                                    Defina o espaço para aulas e treinos
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto p-8 pt-6">
                        <RoomForm
                            formId="add-room-form"
                            units={units}
                            onSubmit={handleAddRoom}
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
                            form="add-room-form"
                            disabled={isLoading || units.length === 0}
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
                                    Salvar Sala
                                </>
                            )}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Edit Sidebar */}
            <Sheet open={!!editingRoom} onOpenChange={(open) => !open && setEditingRoom(null)}>
                <SheetContent side="right" className="sm:max-w-xl p-0 overflow-hidden border-l border-slate-100 shadow-2xl flex flex-col h-full">
                    <SheetHeader className="relative p-8 bg-gradient-to-br from-bee-midnight via-bee-midnight to-slate-900 border-none shrink-0 overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-bee-amber/10 blur-3xl rounded-full -mr-16 -mt-16" />

                        <div className="relative flex items-center gap-5">
                            <div className="h-16 w-16 rounded-[22px] bg-bee-amber/10 flex items-center justify-center ring-1 ring-bee-amber/20">
                                <Layout className="h-8 w-8 text-bee-amber" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <SheetTitle className="text-2xl font-black text-white tracking-tight">
                                        {editingRoom?.name || 'Editar Sala'}
                                    </SheetTitle>
                                    <Badge className="bg-bee-amber text-bee-midnight border-none font-black uppercase text-[10px] tracking-tighter h-5 px-2">Atualizar</Badge>
                                </div>
                                <SheetDescription className="text-slate-400 font-medium">
                                    Atualize as informações deste espaço
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto p-8 pt-6">
                        {editingRoom && (
                            <RoomForm
                                formId="edit-room-form"
                                initialData={editingRoom}
                                units={units}
                                onSubmit={handleUpdateRoom}
                                isLoading={isLoading}
                                showButtons={false}
                            />
                        )}
                    </div>
                    <SheetFooter className="p-8 border-t bg-white flex items-center gap-3 shrink-0 sm:justify-end sticky bottom-0 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
                        <Button
                            variant="ghost"
                            onClick={() => setEditingRoom(null)}
                            className="flex-1 sm:flex-none text-slate-400 hover:text-slate-600 hover:bg-slate-100 font-black h-12 rounded-full uppercase text-[10px] tracking-widest transition-all"
                        >
                            <X className="mr-2 h-4 w-4" />
                            Descartar
                        </Button>
                        <Button
                            type="submit"
                            form="edit-room-form"
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
                                    Salvar Sala
                                </>
                            )}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Delete Sidebar */}
            <Sheet open={!!deletingRoomId} onOpenChange={(open) => !open && setDeletingRoomId(null)}>
                <SheetContent side="right" className="sm:max-w-md p-0 overflow-hidden border-l border-slate-100 shadow-2xl flex flex-col h-full">
                    <SheetHeader className="relative p-8 bg-gradient-to-br from-red-900 via-red-950 to-black border-none shrink-0 overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl rounded-full -mr-16 -mt-16" />

                        <div className="relative flex items-center gap-5">
                            <div className="h-16 w-16 rounded-[22px] bg-red-500/10 flex items-center justify-center ring-1 ring-red-500/20">
                                <AlertTriangle className="h-8 w-8 text-red-500" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <SheetTitle className="text-2xl font-black text-white tracking-tight">Excluir Sala</SheetTitle>
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
                            Tem certeza que deseja excluir esta sala? Esta ação não pode ser desfeita e removerá permanentemente os agendamentos vinculados.
                        </p>
                    </div>
                    <SheetFooter className="p-8 border-t bg-white flex items-center gap-3 shrink-0 sm:justify-end sticky bottom-0 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
                        <Button
                            variant="ghost"
                            onClick={() => setDeletingRoomId(null)}
                            className="flex-1 sm:flex-none text-slate-400 hover:text-slate-600 hover:bg-slate-100 font-black h-12 rounded-full uppercase text-[10px] tracking-widest transition-all"
                        >
                            <X className="mr-2 h-4 w-4" />
                            Manter Sala
                        </Button>
                        <Button
                            onClick={handleDeleteRoom}
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
        </div>
    );
}
