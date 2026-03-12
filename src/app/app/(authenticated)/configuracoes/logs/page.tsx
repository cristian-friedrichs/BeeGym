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
import { Loader2, Eye, Filter, X, FlaskConical, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSystemLogsAction, createTestLogAction, getTeamMembersAction } from '@/actions/logs';
import { SectionHeader } from '@/components/ui/section-header';

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
        <div className="space-y-8">
            <SectionHeader
                title="Logs do Sistema"
                subtitle="Acompanhe todas as atividades e alterações realizadas na plataforma"
                action={
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onGenerateTestLog}
                        className="rounded-full font-bold h-11 px-8 uppercase tracking-wider hover:bg-slate-50 transition-all active:scale-95 border-bee-amber/20 text-slate-600 shadow-sm"
                    >
                        <FlaskConical className="mr-2 h-4 w-4 text-bee-amber" />
                        Gerar Log de Teste
                    </Button>
                }
            />
            {/* Filter Bar */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Busca Avançada</CardTitle>
                            <CardDescription>Refine a busca pelos logs do sistema.</CardDescription>
                        </div>
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
                                                    <SelectTrigger className="h-10 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-lg focus:ring-1 focus:ring-bee-amber/20 transition-all hover:border-slate-200">
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
                                                    <SelectTrigger className="h-10 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-lg focus:ring-1 focus:ring-bee-amber/20 transition-all hover:border-slate-200">
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
                                                    <SelectTrigger className="h-10 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-lg focus:ring-1 focus:ring-bee-amber/20 transition-all hover:border-slate-200">
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
                                <Button
                                    type="submit"
                                    disabled={isFiltering}
                                    className="bg-bee-amber hover:bg-amber-500 text-bee-midnight font-bold rounded-full px-6 shadow-sm transition-all hover:-translate-y-0.5 active:scale-95 uppercase tracking-wider text-[11px]"
                                >
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
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClearFilters}
                                    className="rounded-full font-bold px-6 hover:bg-slate-50 transition-all active:scale-95 uppercase tracking-wider text-[11px]"
                                >
                                    <X className="mr-2 h-4 w-4" />
                                    Limpar
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {/* Logs Table */}
            <Card className="rounded-[2rem] border-slate-100 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-50 px-6 py-4 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-bee-amber rounded-full" />
                        <div className="flex items-center gap-2">
                            <History className="h-5 w-5 text-bee-amber" />
                            <CardTitle className="text-lg font-bold text-slate-900 font-display">Histórico de Atividades</CardTitle>
                        </div>
                    </div>
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
                <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-[1.5rem] border-slate-100 shadow-2xl">
                    <DialogHeader className="p-6 border-b text-left sm:text-left flex flex-row items-center gap-4 bg-white shrink-0">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bee-amber/10 shrink-0">
                            <Eye className="h-6 w-6 text-bee-amber" />
                        </div>
                        <div className="space-y-1">
                            <DialogTitle className="text-xl font-bold text-slate-900 leading-none font-display">
                                Detalhes do Log
                            </DialogTitle>
                            <DialogDescription className="text-slate-500 font-medium text-sm">
                                Registro completo da atividade no sistema
                            </DialogDescription>
                        </div>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="p-8 space-y-6 bg-white max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1 p-4 rounded-xl bg-slate-50">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">ID do Registro</p>
                                    <p className="text-xs font-mono text-slate-500 truncate">{selectedLog.id}</p>
                                </div>
                                <div className="space-y-1 p-4 rounded-xl bg-slate-50">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Recurso/Módulo</p>
                                    <p className="text-sm font-bold text-slate-700">{selectedLog.resource}</p>
                                </div>
                                <div className="space-y-1 p-4 rounded-xl bg-slate-50">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ação Realizada</p>
                                    <div className="flex scale-90 origin-left">{getActionBadge(selectedLog.action)}</div>
                                </div>
                                <div className="space-y-1 p-4 rounded-xl bg-slate-50">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Data e Hora</p>
                                    <p className="text-sm font-bold text-slate-700">
                                        {format(new Date(selectedLog.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Descrição</p>
                                <div className="p-5 rounded-[1.5rem] bg-slate-50 border border-slate-100/50 text-slate-700 leading-relaxed">
                                    {selectedLog.details}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Metadata (JSON)</p>
                                <div className="relative rounded-[1.5rem] overflow-hidden border border-slate-100 shadow-inner group">
                                    <div className="absolute top-3 right-3 px-2 py-1 rounded bg-slate-900/5 backdrop-blur text-[9px] font-black uppercase tracking-tighter text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        JSON Data
                                    </div>
                                    <pre className="p-6 bg-slate-50 text-[12px] font-mono text-slate-600 overflow-auto max-h-64 custom-scrollbar leading-relaxed">
                                        {JSON.stringify(selectedLog.metadata, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
