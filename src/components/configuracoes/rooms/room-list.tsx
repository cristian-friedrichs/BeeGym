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
import { Button } from '@/components/ui/button';
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
import { MoreVertical, Edit, Trash2, Plus, Users } from 'lucide-react';
import { RoomForm, RoomFormValues } from './room-form';
import { createRoomAction, updateRoomAction, deleteRoomAction } from '@/actions/rooms';
import { useToast } from '@/hooks/use-toast';

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

    const handleDeleteRoom = async (roomId: string) => {
        if (!confirm('Tem certeza que deseja excluir esta sala?')) return;

        setIsLoading(true);
        const result = await deleteRoomAction(roomId);
        setIsLoading(false);

        if (result.success) {
            toast({ title: 'Sucesso', description: 'Sala excluída com sucesso!' });
            router.refresh();
        } else {
            toast({ title: 'Erro', description: result.error, variant: 'destructive' });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center px-1">
                <div>
                    <h3 className="text-lg font-medium">Salas e Espaços</h3>
                    <p className="text-sm text-muted-foreground">Gerencie os espaços físicos de cada unidade.</p>
                </div>
                <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Sala
                </Button>
            </div>

            <div className="border rounded-lg bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold">Nome da Sala</TableHead>
                            <TableHead className="font-semibold">Unidade</TableHead>
                            <TableHead className="font-semibold">Capacidade</TableHead>
                            <TableHead className="text-right font-semibold">Ações</TableHead>
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
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setEditingRoom(room)} className="gap-2 cursor-pointer">
                                                    <Edit className="h-4 w-4" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDeleteRoom(room.id)}
                                                    className="gap-2 cursor-pointer text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" /> Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Add Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Criar Nova Sala</DialogTitle>
                    </DialogHeader>
                    <RoomForm units={units} onSubmit={handleAddRoom} isLoading={isLoading} />
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={!!editingRoom} onOpenChange={(open) => !open && setEditingRoom(null)}>
                <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Sala: {editingRoom?.name}</DialogTitle>
                    </DialogHeader>
                    {editingRoom && (
                        <RoomForm
                            initialData={editingRoom}
                            units={units}
                            onSubmit={handleUpdateRoom}
                            isLoading={isLoading}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
