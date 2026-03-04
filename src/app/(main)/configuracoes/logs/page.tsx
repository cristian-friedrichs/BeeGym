'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Eye, Filter, X, FlaskConical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSystemLogsAction, createTestLogAction, getTeamMembersAction } from '@/actions/logs';

const filterSchema = z.object({
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    userId: z.string().optional(),
    action: z.string().optional(),
    resource: z.string().optional(),
});

type FilterFormValues = z.infer<typeof filterSchema>;

interface SystemLog {
    id: string;
    action: string;
    resource: string;
    details: string;
    metadata: any;
    created_at: string;
    user: {
        id: string;
        full_name: string;
        avatar_url?: string;
    } | null;
}

interface TeamMember {
    id: string;
    full_name: string;
    avatar_url?: string;
}

export default function LogsPage() {
    const { toast } = useToast();
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFiltering, setIsFiltering] = useState(false);
    const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

    const form = useForm<FilterFormValues>({
        resolver: zodResolver(filterSchema),
        defaultValues: {
            dateFrom: '',
            dateTo: '',
            userId: 'all',
            action: 'all',
            resource: 'all',
        },
    });

    useEffect(() => {
        loadInitialData();
    }, []);

    async function loadInitialData() {
        setIsLoading(true);

        // Fetch logs
        const logsResult = await getSystemLogsAction();
        if (logsResult.success && logsResult.data) {
            setLogs(logsResult.data as SystemLog[]);
        }

        // Fetch team members for filter
        const teamResult = await getTeamMembersAction();
        if (teamResult.success && teamResult.data) {
            setTeamMembers(teamResult.data as TeamMember[]);
        }

        setIsLoading(false);
    }

    async function onFilter(values: FilterFormValues) {
        setIsFiltering(true);

        // Remove o valor 'all' antes de enviar para a busca
        const filters = {
            ...values,
            userId: values.userId === 'all' ? undefined : values.userId,
            action: values.action === 'all' ? undefined : values.action,
            resource: values.resource === 'all' ? undefined : values.resource,
        };

        const result = await getSystemLogsAction(filters);

        if (result.success && result.data) {
            setLogs(result.data as SystemLog[]);
        } else {
            toast({
                title: 'Erro ao filtrar',
                description: result.error || 'Ocorreu um erro ao filtrar os logs.',
                variant: 'destructive',
            });
        }
        setIsFiltering(false);
    }

    function onClearFilters() {
        form.reset();
        loadInitialData();
    }

    async function onGenerateTestLog() {
        const result = await createTestLogAction();

        if (result.success) {
            toast({
                title: 'Log de teste criado',
                description: 'Um log de teste foi gerado com sucesso.',
            });
            loadInitialData();
        } else {
            toast({
                title: 'Erro ao criar log',
                description: result.error || 'Ocorreu um erro ao criar o log de teste.',
                variant: 'destructive',
            });
        }
    }

    function getActionBadge(action: string) {
        const variants: Record<string, { variant: any; label: string }> = {
            CREATE: { variant: 'default', label: 'Criar' },
            UPDATE: { variant: 'secondary', label: 'Editar' },
            DELETE: { variant: 'destructive', label: 'Excluir' },
            LOGIN: { variant: 'outline', label: 'Login' },
            LOGOUT: { variant: 'outline', label: 'Logout' },
            VIEW: { variant: 'outline', label: 'Visualizar' },
        };

        const config = variants[action] || { variant: 'outline', label: action };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filter Bar */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Filtros</CardTitle>
                            <CardDescription>Refine a busca pelos logs do sistema.</CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onGenerateTestLog}
                        >
                            <FlaskConical className="mr-2 h-4 w-4" />
                            Gerar Log de Teste
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onFilter)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                <FormField
                                    control={form.control}
                                    name="dateFrom"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Data Inicial</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="dateTo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Data Final</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="userId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Usuário</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-10 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-lg focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                                                        <SelectValue placeholder="Todos" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="all">Todos</SelectItem>
                                                    {teamMembers.map((member) => (
                                                        <SelectItem key={member.id} value={member.id}>
                                                            {member.full_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="action"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tipo de Ação</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-10 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-lg focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                                                        <SelectValue placeholder="Todas" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="all">Todas</SelectItem>
                                                    <SelectItem value="CREATE">Criar</SelectItem>
                                                    <SelectItem value="UPDATE">Editar</SelectItem>
                                                    <SelectItem value="DELETE">Excluir</SelectItem>
                                                    <SelectItem value="LOGIN">Login</SelectItem>
                                                    <SelectItem value="LOGOUT">Logout</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="resource"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Módulo</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-10 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-lg focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                                                        <SelectValue placeholder="Todos" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="all">Todos</SelectItem>
                                                    <SelectItem value="plans">Planos</SelectItem>
                                                    <SelectItem value="units">Unidades</SelectItem>
                                                    <SelectItem value="rooms">Salas</SelectItem>
                                                    <SelectItem value="team">Equipe</SelectItem>
                                                    <SelectItem value="students">Alunos</SelectItem>
                                                    <SelectItem value="settings">Configurações</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit" disabled={isFiltering}>
                                    {isFiltering ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Filtrando...
                                        </>
                                    ) : (
                                        <>
                                            <Filter className="mr-2 h-4 w-4" />
                                            Filtrar
                                        </>
                                    )}
                                </Button>
                                <Button type="button" variant="outline" onClick={onClearFilters}>
                                    <X className="mr-2 h-4 w-4" />
                                    Limpar
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {/* Logs Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Histórico de Atividades</CardTitle>
                    <CardDescription>
                        {logs.length} {logs.length === 1 ? 'registro encontrado' : 'registros encontrados'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {logs.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>Nenhum log encontrado.</p>
                            <p className="text-sm mt-2">Tente ajustar os filtros ou gere um log de teste.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data/Hora</TableHead>
                                    <TableHead>Usuário</TableHead>
                                    <TableHead>Ação</TableHead>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead className="text-right">Detalhes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-mono text-sm">
                                            {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={log.user?.avatar_url} />
                                                    <AvatarFallback className="text-xs">
                                                        {log.user?.full_name?.charAt(0) || 'S'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm">
                                                    {log.user?.full_name || 'Sistema'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getActionBadge(log.action)}</TableCell>
                                        <TableCell className="max-w-md truncate">{log.details}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedLog(log);
                                                    setDetailsDialogOpen(true);
                                                }}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Details Dialog */}
            <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Detalhes do Log</DialogTitle>
                        <DialogDescription>Informações técnicas do registro.</DialogDescription>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">ID</p>
                                    <p className="text-sm font-mono">{selectedLog.id}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Recurso</p>
                                    <p className="text-sm">{selectedLog.resource}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Ação</p>
                                    {getActionBadge(selectedLog.action)}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Data</p>
                                    <p className="text-sm">
                                        {format(new Date(selectedLog.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-2">Descrição</p>
                                <p className="text-sm">{selectedLog.details}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-2">Metadata (JSON)</p>
                                <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96">
                                    {JSON.stringify(selectedLog.metadata, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
