'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
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
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { MoreHorizontal, Mail, UserCog, Ban, CheckCircle2, Crown } from 'lucide-react';
import { AddMemberModal } from '@/components/configuracoes/team/add-member-modal';
import { EditMemberModal } from '@/components/configuracoes/team/edit-member-modal';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { SectionHeader } from '@/components/ui/section-header';

interface TeamListProps {
    initialUsers: any[];
    currentOrgId: string;
}

function isOwner(member: any): boolean {
    return member.role === 'OWNER' || member.role === 'PROPRIETARY';
}

export function TeamList({ initialUsers, currentOrgId }: TeamListProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [users, setUsers] = useState<any[]>(initialUsers);
    const [editingMember, setEditingMember] = useState<any | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        setUsers(initialUsers);
    }, [initialUsers]);

    const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
        const newStatus = currentStatus ? 'PENDING' : 'ACTIVE';

        const { error } = await (supabase
            .from('profiles') as any)
            .update({ status: newStatus })
            .eq('id', userId);

        if (error) {
            console.error('Error updating status:', error);
            toast({
                title: 'Erro',
                description: 'Erro ao atualizar status do usuário',
                variant: 'destructive',
            });
        } else {
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, active: !currentStatus, status: newStatus } : u));
            toast({
                title: 'Sucesso',
                description: 'Status atualizado com sucesso',
            });
            router.refresh();
        }
    };

    const openEdit = (member: any) => {
        setEditingMember(member);
        setEditModalOpen(true);
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'OWNER':
            case 'PROPRIETARY':
                return (
                    <Badge variant="destructive" className="bg-amber-600 hover:bg-amber-700 gap-1">
                        <Crown className="h-3 w-3" />
                        Proprietário
                    </Badge>
                );
            case 'ADMIN':
                return <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-200 hover:bg-red-500/20">Admin</Badge>;
            case 'INSTRUCTOR':
                return <Badge variant="default" className="bg-blue-500/10 text-blue-600 border-blue-200 hover:bg-blue-500/20">Instrutor</Badge>;
            case 'MANAGER':
                return <Badge variant="outline" className="border-bee-amber text-bee-amber">Gerente</Badge>;
            default:
                return <Badge variant="secondary">Equipe</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Equipe & Permissões"
                subtitle="Gerencie os membros da sua equipe e seus níveis de acesso"
                action={currentOrgId && <AddMemberModal organizationId={currentOrgId} />}
            />

            <Card className="rounded-[2rem] shadow-sm border-slate-100 overflow-hidden bg-white">
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Membro</TableHead>
                                <TableHead>Cargo</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        Nenhum membro encontrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((member) => {
                                    const memberIsOwner = isOwner(member);
                                    return (
                                        <TableRow key={member.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarImage src={member.avatar_url || ''} />
                                                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                            {member.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-sm text-[#0B0F1A]">{member.name}</span>
                                                        <span className="text-xs text-muted-foreground">{member.email}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getRoleBadge(member.role)}
                                                    {member.is_instructor && member.role !== 'INSTRUCTOR' && (
                                                        <Badge variant="default" className="bg-blue-500/10 text-blue-600 border-blue-200 hover:bg-blue-500/20">
                                                            Instrutor
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {memberIsOwner ? (
                                                    <span className="text-xs font-medium text-amber-600 flex items-center gap-1">
                                                        <Crown className="h-3 w-3" /> Sempre ativo
                                                    </span>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={member.active}
                                                            onCheckedChange={() => toggleUserStatus(member.id, member.active)}
                                                            className="data-[state=checked]:bg-bee-amber"
                                                        />
                                                        <span className="text-xs font-medium">
                                                            {member.active ? (
                                                                <span className="text-green-600 flex items-center gap-1">
                                                                    <CheckCircle2 className="h-3 w-3" /> Ativo
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted-foreground flex items-center gap-1">
                                                                    <Ban className="h-3 w-3" /> Inativo
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {memberIsOwner ? (
                                                    <span className="text-xs text-muted-foreground italic">Protegido</span>
                                                ) : (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                            <DropdownMenuItem
                                                                className="gap-2"
                                                                onClick={() => openEdit(member)}
                                                            >
                                                                <UserCog className="h-4 w-4" /> Editar Perfil
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="gap-2">
                                                                <Mail className="h-4 w-4" /> Enviar Convite
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            {member.active ? (
                                                                <DropdownMenuItem
                                                                    className="text-destructive gap-2"
                                                                    onClick={() => toggleUserStatus(member.id, member.active)}
                                                                >
                                                                    <Ban className="h-4 w-4" /> Desativar Membro
                                                                </DropdownMenuItem>
                                                            ) : (
                                                                <DropdownMenuItem
                                                                    className="text-green-600 gap-2"
                                                                    onClick={() => toggleUserStatus(member.id, member.active)}
                                                                >
                                                                    <CheckCircle2 className="h-4 w-4" /> Reativar Membro
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>

                {/* Edit Member Modal */}
                <EditMemberModal
                    open={editModalOpen}
                    onOpenChange={(open) => {
                        setEditModalOpen(open);
                        if (!open) setEditingMember(null);
                    }}
                    member={editingMember}
                    organizationId={currentOrgId}
                />
            </Card>
        </div>
    );
}
