'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
    AlertCircle,
    CalendarClock,
    CheckCircle2,
    Clock3,
    ExternalLink,
    ListChecks,
    Loader2,
    PlayCircle,
    ShieldCheck,
    type LucideIcon,
} from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { AgentCommandCenterNav } from '@/components/admin/agentes/agent-command-center-nav';
import type {
    GitHubIssueSummary,
    GitHubPullRequestSummary,
    GitHubRepositoryActivitySummary,
    GitHubWorkflowRunSummary,
} from '@/lib/admin/agent-command-center-github';

type WorkStatus = 'doing' | 'pending' | 'approval' | 'done';
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface WorkRow {
    id: string;
    status: WorkStatus;
    agent: string;
    department: string;
    task: string;
    risk: RiskLevel;
    nextAction: string;
    when: string;
    needsMe: 'Sim' | 'Não';
    url: string;
    detailLabel: string;
}

interface ApprovalRow {
    id: string;
    decision: string;
    reason: string;
    risk: RiskLevel;
    department: string;
    recommendation: string;
    url: string;
}

interface ScheduleRow {
    id: string;
    agent: string;
    department: string;
    monitors: string;
    frequency: string;
    nextRun: string;
    lastRun: string;
    status: string;
}

interface DeliveryRow {
    id: string;
    date: string;
    task: string;
    owner: string;
    result: string;
    record: string;
    status: string;
    url: string;
}

const emptyActivity: GitHubRepositoryActivitySummary = {
    repository: 'cristian-friedrichs/BeeGym',
    status: {
        state: 'unavailable',
        label: 'Dados indisponíveis',
        message: 'Não foi possível carregar dados reais agora. Tente novamente mais tarde.',
        fetchedAt: new Date().toISOString(),
        source: 'github_public_api',
        readOnly: true,
        rateLimited: false,
    },
    openPullRequests: 0,
    openIssues: 0,
    recentPullRequests: [],
    issues: [],
    recentClosedIssues: [],
    workflowRuns: [],
    recentCommits: [],
    latestWorkflowRun: null,
    latestMergedPullRequest: null,
};

const statusConfig: Record<WorkStatus, { label: string; className: string; Icon: LucideIcon }> = {
    doing: {
        label: 'Fazendo agora',
        className: 'border-blue-100 bg-blue-50 text-blue-700',
        Icon: PlayCircle,
    },
    pending: {
        label: 'Pendente',
        className: 'border-slate-100 bg-slate-50 text-slate-600',
        Icon: Clock3,
    },
    approval: {
        label: 'Aguardando aprovação',
        className: 'border-amber-100 bg-amber-50 text-amber-700',
        Icon: AlertCircle,
    },
    done: {
        label: 'Concluído',
        className: 'border-green-100 bg-green-50 text-green-700',
        Icon: CheckCircle2,
    },
};

const riskConfig: Record<RiskLevel, { label: string; className: string }> = {
    low: { label: 'Baixo', className: 'border-green-100 bg-green-50 text-green-700' },
    medium: { label: 'Médio', className: 'border-amber-100 bg-amber-50 text-amber-700' },
    high: { label: 'Alto', className: 'border-orange-100 bg-orange-50 text-orange-700' },
    critical: { label: 'Crítico', className: 'border-red-100 bg-red-50 text-red-700' },
};

export function AgentOperationsDashboard() {
    const [activity, setActivity] = useState<GitHubRepositoryActivitySummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        async function loadActivity() {
            try {
                const response = await fetch('/api/admin/agent-command-center/github', {
                    signal: controller.signal,
                    headers: { Accept: 'application/json' },
                });

                if (!response.ok) throw new Error('Agent operations source failed');

                const payload = await response.json() as GitHubRepositoryActivitySummary;
                if (!controller.signal.aborted) {
                    setActivity(payload);
                    setHasError(payload.status.state === 'unavailable');
                }
            } catch {
                if (!controller.signal.aborted) {
                    setActivity(emptyActivity);
                    setHasError(true);
                }
            } finally {
                if (!controller.signal.aborted) setIsLoading(false);
            }
        }

        loadActivity();

        return () => controller.abort();
    }, []);

    const data = activity ?? emptyActivity;
    const workRows = useMemo(() => buildWorkRows(data), [data]);
    const approvalRows = useMemo(() => buildApprovalRows(data.issues), [data.issues]);
    const scheduleRows = useMemo(() => buildScheduleRows(data.workflowRuns), [data.workflowRuns]);
    const deliveryRows = useMemo(() => buildDeliveryRows(data), [data]);
    const metrics = useMemo(() => buildMetrics(workRows, approvalRows, deliveryRows), [workRows, approvalRows, deliveryRows]);

    return (
        <div className="space-y-6 pb-12">
            <SectionHeader
                title="Operação dos Agentes"
                subtitle="Acompanhe o que os agentes estão fazendo, o que já foi concluído e o que precisa da sua aprovação."
                action={
                    <Button asChild className="gap-2 bg-bee-amber font-bold text-bee-midnight shadow-sm hover:bg-amber-500">
                        <Link href="/admin/agentes/aprovacoes">
                            <ShieldCheck className="h-4 w-4" />
                            Ver aprovações
                        </Link>
                    </Button>
                }
            />

            <AgentCommandCenterNav />
            <SourceNotice isLoading={isLoading} hasError={hasError} message={data.status.message} />

            <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                <ExecutiveMetric title="Fazendo agora" value={String(metrics.doing)} detail="Tarefas em andamento" icon={<PlayCircle />} tone="blue" />
                <ExecutiveMetric title="Pendentes" value={String(metrics.pending)} detail="Prontas para agente" icon={<ListChecks />} tone="slate" />
                <ExecutiveMetric title="Preciso aprovar" value={String(metrics.approvals)} detail="Decisões para admin" icon={<AlertCircle />} tone="amber" />
                <ExecutiveMetric title="Concluídos" value={String(metrics.done)} detail="Últimos 7 dias" icon={<CheckCircle2 />} tone="green" />
                <ExecutiveMetric title="Próxima execução" value={metrics.nextRun} detail="Monitoramento ativo" icon={<CalendarClock />} tone="black" />
            </section>

            <WorkTable rows={workRows} isLoading={isLoading} />
            <ApprovalTable rows={approvalRows} isLoading={isLoading} />
            <ScheduleTable rows={scheduleRows} />
            <DeliveriesTable rows={deliveryRows} isLoading={isLoading} />

            <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-black text-bee-midnight">Modo avançado</h3>
                        <p className="mt-1 text-xs font-bold text-slate-400">
                            Timeline, filtros e detalhes técnicos continuam disponíveis fora da visão executiva principal.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="sm" className="rounded-xl border-slate-100 text-xs font-bold text-slate-500">
                            <Link href="/admin/agentes/atividades">Ver timeline operacional avançada</Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm" className="rounded-xl text-xs font-bold text-slate-500 hover:bg-amber-50 hover:text-bee-amber">
                            <Link href="/admin/agentes/departamentos">Ver detalhes por departamento</Link>
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}

function ExecutiveMetric({
    title,
    value,
    detail,
    icon,
    tone,
}: {
    title: string;
    value: string;
    detail: string;
    icon: ReactNode;
    tone: 'blue' | 'slate' | 'amber' | 'green' | 'black';
}) {
    const tones = {
        blue: 'bg-blue-50 text-blue-700 border-blue-100',
        slate: 'bg-slate-50 text-slate-600 border-slate-100',
        amber: 'bg-amber-50 text-amber-700 border-amber-100',
        green: 'bg-green-50 text-green-700 border-green-100',
        black: 'bg-bee-midnight text-white border-bee-midnight',
    };

    return (
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">{title}</p>
                <span className={cn('inline-flex h-9 w-9 items-center justify-center rounded-xl border [&>svg]:h-4 [&>svg]:w-4', tones[tone])}>
                    {icon}
                </span>
            </div>
            <p className="mt-3 text-3xl font-black leading-none text-bee-midnight">{value}</p>
            <p className="mt-2 text-xs font-bold text-slate-400">{detail}</p>
        </div>
    );
}

function SourceNotice({ isLoading, hasError, message }: { isLoading: boolean; hasError: boolean; message: string }) {
    if (isLoading) {
        return (
            <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-xs font-bold text-slate-500 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando dados reais da operação dos agentes...
            </div>
        );
    }

    return (
        <div className={cn(
            'rounded-2xl border px-4 py-3 text-xs font-bold shadow-sm',
            hasError ? 'border-red-100 bg-red-50 text-red-700' : 'border-green-100 bg-green-50 text-green-700',
        )}>
            {hasError ? 'Não foi possível carregar dados reais agora. Tente novamente mais tarde.' : message || 'Dados reais carregados em modo somente leitura.'}
        </div>
    );
}

function WorkTable({ rows, isLoading }: { rows: WorkRow[]; isLoading: boolean }) {
    return (
        <ExecutiveTable
            title="Trabalho dos agentes"
            subtitle="Fila executiva com tarefas, aprovações, entregas e validações recentes."
        >
            <Table>
                <TableHeader>
                    <TableRow className="border-slate-100 bg-slate-50/70 hover:bg-slate-50/70">
                        {['Status', 'Agente', 'Departamento', 'Tarefa', 'Prioridade/Risco', 'Próxima ação', 'Prazo/Quando', 'Precisa de mim?', 'Link/Detalhes'].map((head) => (
                            <TableHead key={head} className="px-4 text-[10px] font-black uppercase tracking-wider text-slate-400">{head}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading && <LoadingRow colSpan={9} label="Carregando trabalho dos agentes..." />}
                    {!isLoading && rows.map((row) => (
                        <TableRow key={row.id} className="border-slate-50 hover:bg-amber-50/20">
                            <TableCell><StatusPill status={row.status} /></TableCell>
                            <TableCell className="font-bold text-slate-600">{row.agent}</TableCell>
                            <TableCell className="font-bold text-slate-500">{row.department}</TableCell>
                            <TableCell className="min-w-[260px] max-w-[360px]">
                                <p className="line-clamp-2 text-sm font-black text-bee-midnight">{row.task}</p>
                            </TableCell>
                            <TableCell><RiskPill risk={row.risk} /></TableCell>
                            <TableCell className="min-w-[200px] text-xs font-bold text-slate-500">{row.nextAction}</TableCell>
                            <TableCell className="whitespace-nowrap text-xs font-bold text-slate-400">{row.when}</TableCell>
                            <TableCell><NeedPill value={row.needsMe} /></TableCell>
                            <TableCell>
                                <ExternalButton href={row.url} label={row.detailLabel} />
                            </TableCell>
                        </TableRow>
                    ))}
                    {!isLoading && rows.length === 0 && <EmptyRow colSpan={9} label="Nenhuma tarefa em andamento agora." />}
                </TableBody>
            </Table>
        </ExecutiveTable>
    );
}

function ApprovalTable({ rows, isLoading }: { rows: ApprovalRow[]; isLoading: boolean }) {
    return (
        <ExecutiveTable
            title="Aguardando sua aprovação"
            subtitle="Decisões que precisam do CEO/admin antes de qualquer ação real."
            notice="Aprovação pelo admin ainda não executa ação automática nesta fase."
        >
            <Table>
                <TableHeader>
                    <TableRow className="border-slate-100 bg-slate-50/70 hover:bg-slate-50/70">
                        {['Decisão necessária', 'Motivo', 'Risco', 'Departamento', 'Recomendação do agente', 'Link para acompanhar'].map((head) => (
                            <TableHead key={head} className="px-4 text-[10px] font-black uppercase tracking-wider text-slate-400">{head}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading && <LoadingRow colSpan={6} label="Carregando aprovações pendentes..." />}
                    {!isLoading && rows.map((row) => (
                        <TableRow key={row.id} className="border-slate-50 hover:bg-amber-50/20">
                            <TableCell className="min-w-[240px] font-black text-bee-midnight">{row.decision}</TableCell>
                            <TableCell className="min-w-[220px] text-xs font-bold text-slate-500">{row.reason}</TableCell>
                            <TableCell><RiskPill risk={row.risk} /></TableCell>
                            <TableCell className="font-bold text-slate-500">{row.department}</TableCell>
                            <TableCell className="min-w-[240px] text-xs font-bold text-slate-500">{row.recommendation}</TableCell>
                            <TableCell><ExternalButton href={row.url} label="Abrir decisão" /></TableCell>
                        </TableRow>
                    ))}
                    {!isLoading && rows.length === 0 && <EmptyRow colSpan={6} label="Nenhuma aprovação pendente." />}
                </TableBody>
            </Table>
        </ExecutiveTable>
    );
}

function ScheduleTable({ rows }: { rows: ScheduleRow[] }) {
    return (
        <ExecutiveTable title="Agendamentos" subtitle="Quando os agentes e monitores rodam para alimentar a operação.">
            <Table>
                <TableHeader>
                    <TableRow className="border-slate-100 bg-slate-50/70 hover:bg-slate-50/70">
                        {['Agente', 'Departamento', 'O que monitora', 'Frequência', 'Próxima execução', 'Última execução', 'Status'].map((head) => (
                            <TableHead key={head} className="px-4 text-[10px] font-black uppercase tracking-wider text-slate-400">{head}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((row) => (
                        <TableRow key={row.id} className="border-slate-50 hover:bg-amber-50/20">
                            <TableCell className="font-black text-bee-midnight">{row.agent}</TableCell>
                            <TableCell className="font-bold text-slate-500">{row.department}</TableCell>
                            <TableCell className="min-w-[260px] text-xs font-bold text-slate-500">{row.monitors}</TableCell>
                            <TableCell className="text-xs font-bold text-slate-500">{row.frequency}</TableCell>
                            <TableCell className="text-xs font-bold text-slate-400">{row.nextRun}</TableCell>
                            <TableCell className="text-xs font-bold text-slate-400">{row.lastRun}</TableCell>
                            <TableCell><SimplePill label={row.status} tone={row.status === 'Ativo' ? 'green' : 'slate'} /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </ExecutiveTable>
    );
}

function DeliveriesTable({ rows, isLoading }: { rows: DeliveryRow[]; isLoading: boolean }) {
    return (
        <ExecutiveTable title="Últimas entregas" subtitle="Entregas recentes já concluídas e validadas.">
            <Table>
                <TableHeader>
                    <TableRow className="border-slate-100 bg-slate-50/70 hover:bg-slate-50/70">
                        {['Data', 'Tarefa', 'Agente/departamento', 'Resultado', 'PR/tarefa', 'Status'].map((head) => (
                            <TableHead key={head} className="px-4 text-[10px] font-black uppercase tracking-wider text-slate-400">{head}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading && <LoadingRow colSpan={6} label="Carregando últimas entregas..." />}
                    {!isLoading && rows.map((row) => (
                        <TableRow key={row.id} className="border-slate-50 hover:bg-amber-50/20">
                            <TableCell className="whitespace-nowrap text-xs font-bold text-slate-400">{row.date}</TableCell>
                            <TableCell className="min-w-[280px] font-black text-bee-midnight">{row.task}</TableCell>
                            <TableCell className="font-bold text-slate-500">{row.owner}</TableCell>
                            <TableCell className="text-xs font-bold text-slate-500">{row.result}</TableCell>
                            <TableCell><ExternalButton href={row.url} label={row.record} /></TableCell>
                            <TableCell><SimplePill label={row.status} tone="green" /></TableCell>
                        </TableRow>
                    ))}
                    {!isLoading && rows.length === 0 && <EmptyRow colSpan={6} label="Nenhuma entrega recente encontrada." />}
                </TableBody>
            </Table>
        </ExecutiveTable>
    );
}

function ExecutiveTable({
    title,
    subtitle,
    notice,
    children,
}: {
    title: string;
    subtitle: string;
    notice?: string;
    children: ReactNode;
}) {
    return (
        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div>
                    <h3 className="text-sm font-black text-bee-midnight">{title}</h3>
                    <p className="mt-1 text-xs font-bold text-slate-400">{subtitle}</p>
                </div>
                {notice && <SimplePill label={notice} tone="amber" />}
            </div>
            {children}
        </section>
    );
}

function StatusPill({ status }: { status: WorkStatus }) {
    const config = statusConfig[status];
    return (
        <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider', config.className)}>
            <config.Icon className="h-3 w-3" />
            {config.label}
        </span>
    );
}

function RiskPill({ risk }: { risk: RiskLevel }) {
    const config = riskConfig[risk];
    return <SimplePill label={config.label} className={config.className} />;
}

function NeedPill({ value }: { value: 'Sim' | 'Não' }) {
    return <SimplePill label={value} tone={value === 'Sim' ? 'amber' : 'slate'} />;
}

function SimplePill({
    label,
    tone = 'slate',
    className,
}: {
    label: string;
    tone?: 'green' | 'amber' | 'slate';
    className?: string;
}) {
    const tones = {
        green: 'border-green-100 bg-green-50 text-green-700',
        amber: 'border-amber-100 bg-amber-50 text-amber-700',
        slate: 'border-slate-100 bg-slate-50 text-slate-500',
    };

    return (
        <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider', className ?? tones[tone])}>
            {label}
        </span>
    );
}

function ExternalButton({ href, label }: { href: string; label: string }) {
    return (
        <Button asChild variant="ghost" size="sm" className="h-9 rounded-xl text-xs font-bold text-slate-500 hover:bg-amber-50 hover:text-bee-amber">
            <a href={href} target="_blank" rel="noreferrer" className="gap-1">
                {label}
                <ExternalLink className="h-3.5 w-3.5" />
            </a>
        </Button>
    );
}

function LoadingRow({ colSpan, label }: { colSpan: number; label: string }) {
    return (
        <TableRow>
            <TableCell colSpan={colSpan} className="h-24 text-center text-sm font-bold text-slate-400">
                {label}
            </TableCell>
        </TableRow>
    );
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
    return (
        <TableRow>
            <TableCell colSpan={colSpan} className="h-24 text-center text-sm font-bold text-slate-400">
                {label}
            </TableCell>
        </TableRow>
    );
}

function buildWorkRows(data: GitHubRepositoryActivitySummary): WorkRow[] {
    const issueRows = data.issues.map(toIssueWorkRow);
    const pullRequestRows = data.recentPullRequests
        .filter((pullRequest) => pullRequest.state === 'open')
        .map(toPullRequestWorkRow);
    const workflowRows = data.workflowRuns
        .filter((run) => run.status !== 'completed' || run.conclusion === 'failure')
        .slice(0, 3)
        .map(toWorkflowWorkRow);
    const doneRows = [
        ...data.recentPullRequests.filter((pullRequest) => pullRequest.merged).slice(0, 3).map(toMergedPullRequestWorkRow),
        ...data.recentClosedIssues.slice(0, 3).map(toClosedIssueWorkRow),
    ];

    return [...issueRows, ...pullRequestRows, ...workflowRows, ...doneRows]
        .sort((left, right) => statusOrder(left.status) - statusOrder(right.status))
        .slice(0, 14);
}

function buildApprovalRows(issues: GitHubIssueSummary[]): ApprovalRow[] {
    return issues
        .filter(issueNeedsApproval)
        .map((issue) => {
            const risk = getIssueRisk(issue);
            return {
                id: `approval-issue-${issue.number}`,
                decision: `Decidir sobre tarefa #${issue.number}`,
                reason: getApprovalReason(issue),
                risk,
                department: getDepartmentLabel(issue.labels),
                recommendation: risk === 'low'
                    ? 'Confirmar escopo e liberar execução quando estiver claro.'
                    : 'Revisar risco antes de qualquer execução automática.',
                url: issue.url,
            };
        });
}

function buildScheduleRows(runs: GitHubWorkflowRunSummary[]): ScheduleRow[] {
    const watchtowerRun = findLatestRun(runs, 'Watchtower');
    const syntheticRun = findLatestRun(runs, 'Synthetic Health Check');

    return [
        {
            id: 'watchtower',
            agent: 'Watchtower',
            department: 'CTO / Monitoramento',
        monitors: 'Validações técnicas, entregas abertas, tarefas bloqueadas e backlog',
            frequency: 'A cada 6 horas',
            nextRun: 'Agendado pelo GitHub Actions',
            lastRun: formatDateTime(watchtowerRun?.updatedAt || watchtowerRun?.createdAt),
            status: 'Ativo',
        },
        {
            id: 'synthetic-health',
            agent: 'Synthetic Health Check',
            department: 'CTO / Monitoramento',
            monitors: 'Disponibilidade de / e /login',
        frequency: 'Diário',
            nextRun: 'Agendado pelo GitHub Actions',
            lastRun: formatDateTime(syntheticRun?.updatedAt || syntheticRun?.createdAt),
            status: 'Ativo',
        },
        {
            id: 'dispatcher',
            agent: 'Backlog Dispatcher',
        department: 'CEO / Operação',
        monitors: 'Tarefas prontas, bloqueadas e aguardando decisão',
        frequency: 'Sob demanda / após Watchtower',
            nextRun: 'Sob demanda',
            lastRun: 'Sob demanda',
            status: 'Sob demanda',
        },
    ];
}

function buildDeliveryRows(data: GitHubRepositoryActivitySummary): DeliveryRow[] {
    const pullRequestDeliveries = data.recentPullRequests
        .filter((pullRequest) => pullRequest.merged && isWithinLastDays(pullRequest.mergedAt || pullRequest.updatedAt, 7))
        .map((pullRequest) => ({
            id: `delivery-pr-${pullRequest.number}`,
            date: formatDateTime(pullRequest.mergedAt || pullRequest.updatedAt),
            task: pullRequest.title,
            owner: 'CTO / Produto',
            result: 'Merge realizado',
            record: `Entrega #${pullRequest.number}`,
            status: 'Validado',
            url: pullRequest.url,
        }));

    const issueDeliveries = data.recentClosedIssues
        .filter((issue) => isWithinLastDays(issue.closedAt || issue.updatedAt, 7))
        .map((issue) => ({
            id: `delivery-issue-${issue.number}`,
            date: formatDateTime(issue.closedAt || issue.updatedAt),
            task: issue.title,
            owner: getDepartmentLabel(issue.labels),
            result: 'Concluído',
            record: `Tarefa #${issue.number}`,
            status: 'Sem ação necessária',
            url: issue.url,
        }));

    return [...pullRequestDeliveries, ...issueDeliveries]
        .sort((left, right) => getDateValue(right.date) - getDateValue(left.date))
        .slice(0, 8);
}

function buildMetrics(workRows: WorkRow[], approvalRows: ApprovalRow[], deliveryRows: DeliveryRow[]) {
    return {
        doing: workRows.filter((row) => row.status === 'doing').length,
        pending: workRows.filter((row) => row.status === 'pending').length,
        approvals: approvalRows.length,
        done: deliveryRows.length,
        nextRun: '6h',
    };
}

function toIssueWorkRow(issue: GitHubIssueSummary): WorkRow {
    const needsApproval = issueNeedsApproval(issue);
    const status = getIssueStatus(issue);

    return {
        id: `issue-${issue.number}`,
        status,
        agent: getAgentLabel(issue.labels),
        department: getDepartmentLabel(issue.labels),
        task: issue.title,
        risk: getIssueRisk(issue),
        nextAction: needsApproval ? 'Abrir decisão e confirmar se pode seguir.' : 'Confirmar escopo e executar quando for a próxima prioridade.',
        when: formatDateTime(issue.updatedAt || issue.createdAt),
        needsMe: needsApproval ? 'Sim' : 'Não',
        url: issue.url,
        detailLabel: 'Ver tarefa',
    };
}

function toPullRequestWorkRow(pullRequest: GitHubPullRequestSummary): WorkRow {
    return {
        id: `open-pr-${pullRequest.number}`,
        status: 'doing',
        agent: 'Agente de entrega',
        department: 'CTO / Produto',
        task: pullRequest.title,
        risk: 'low',
        nextAction: 'Acompanhar validação e revisar entrega.',
        when: formatDateTime(pullRequest.updatedAt || pullRequest.createdAt),
        needsMe: 'Não',
        url: pullRequest.url,
        detailLabel: 'Ver entrega',
    };
}

function toWorkflowWorkRow(run: GitHubWorkflowRunSummary): WorkRow {
    const failed = run.status === 'completed' && run.conclusion === 'failure';

    return {
        id: `workflow-${run.id}`,
        status: failed ? 'approval' : 'doing',
        agent: 'Monitor técnico',
        department: 'CTO / Monitoramento',
        task: getWorkflowHumanName(run.name),
        risk: failed ? 'high' : 'medium',
        nextAction: failed ? 'Abrir validação e decidir correção.' : 'Aguardar conclusão da validação.',
        when: formatDateTime(run.updatedAt || run.createdAt),
        needsMe: failed ? 'Sim' : 'Não',
        url: run.url,
        detailLabel: 'Ver validação',
    };
}

function toMergedPullRequestWorkRow(pullRequest: GitHubPullRequestSummary): WorkRow {
    return {
        id: `done-pr-${pullRequest.number}`,
        status: 'done',
        agent: 'Agente de entrega',
        department: 'CTO / Produto',
        task: pullRequest.title,
        risk: 'low',
        nextAction: 'Sem ação necessária.',
        when: formatDateTime(pullRequest.mergedAt || pullRequest.updatedAt),
        needsMe: 'Não',
        url: pullRequest.url,
        detailLabel: 'Ver entrega',
    };
}

function toClosedIssueWorkRow(issue: GitHubIssueSummary): WorkRow {
    return {
        id: `done-issue-${issue.number}`,
        status: 'done',
        agent: getAgentLabel(issue.labels),
        department: getDepartmentLabel(issue.labels),
        task: issue.title,
        risk: getIssueRisk(issue),
        nextAction: 'Sem ação necessária.',
        when: formatDateTime(issue.closedAt || issue.updatedAt),
        needsMe: 'Não',
        url: issue.url,
        detailLabel: 'Ver tarefa',
    };
}

function getIssueStatus(issue: GitHubIssueSummary): WorkStatus {
    if (issue.labels.includes('agent:in-progress')) return 'doing';
    if (issue.labels.includes('agent:blocked') || issueNeedsApproval(issue)) return 'approval';
    if (issue.labels.includes('agent:ready')) return 'pending';
    return 'pending';
}

function issueNeedsApproval(issue: GitHubIssueSummary) {
    return issue.labels.includes('autonomy:requires-ceo')
        || issue.labels.includes('agent:needs-review')
        || issue.labels.includes('agent:blocked')
        || issue.labels.includes('risk:medium')
        || issue.labels.includes('risk:high')
        || issue.labels.includes('risk:critical');
}

function getIssueRisk(issue: GitHubIssueSummary): RiskLevel {
    if (issue.labels.includes('risk:critical')) return 'critical';
    if (issue.labels.includes('risk:high')) return 'high';
    if (issue.labels.includes('risk:medium')) return 'medium';
    return 'low';
}

function getDepartmentLabel(labels: string[]) {
    const department = labels.find((label) => label.startsWith('dept:'))?.replace('dept:', '');
    const labelsByDepartment: Record<string, string> = {
        ceo: 'CEO / Operação',
        cto: 'CTO / Monitoramento',
        support: 'Suporte',
        marketing: 'Marketing',
        growth: 'Growth',
        product: 'Produto',
        finance: 'Financeiro',
    };

    return department ? labelsByDepartment[department] ?? department : 'BeeGym OS';
}

function getAgentLabel(labels: string[]) {
    if (labels.includes('type:monitoring')) return 'Watchtower';
    if (labels.includes('type:ui')) return 'Agente de Produto';
    if (labels.includes('type:docs')) return 'Agente de Documentação';
    if (labels.includes('type:automation')) return 'Agente de Operação';
    if (labels.includes('type:technical-debt')) return 'Agente técnico';
    return 'Agente BeeGym';
}

function getApprovalReason(issue: GitHubIssueSummary) {
    if (issue.labels.includes('agent:blocked')) return 'Tarefa bloqueada precisa de decisão.';
    if (issue.labels.includes('agent:needs-review')) return 'Marcada para revisão do admin.';
    if (issue.labels.includes('autonomy:requires-ceo')) return 'Exige aprovação do CEO antes de seguir.';
    if (issue.labels.some((label) => ['risk:medium', 'risk:high', 'risk:critical'].includes(label))) return 'Risco acima de baixo.';
    return 'Precisa de confirmação antes de seguir.';
}

function getWorkflowHumanName(name: string) {
    if (/watchtower/i.test(name)) return 'Monitoramento dos agentes';
    if (/synthetic/i.test(name)) return 'Teste de disponibilidade';
    if (/ci/i.test(name)) return 'Validação técnica';
    return 'Validação técnica';
}

function findLatestRun(runs: GitHubWorkflowRunSummary[], pattern: string) {
    return runs.find((run) => run.name.toLowerCase().includes(pattern.toLowerCase()));
}

function statusOrder(status: WorkStatus) {
    const order: Record<WorkStatus, number> = {
        doing: 0,
        pending: 1,
        approval: 2,
        done: 3,
    };

    return order[status];
}

function formatDateTime(value?: string) {
    if (!value) return '-';

    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

function getDateValue(value: string) {
    const [datePart, timePart] = value.split(', ');
    if (!datePart || !timePart) return 0;
    const [day, month] = datePart.split('/').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    return new Date(new Date().getFullYear(), (month || 1) - 1, day || 1, hour || 0, minute || 0).getTime();
}

function isWithinLastDays(value: string, days: number) {
    const time = new Date(value).getTime();
    if (!Number.isFinite(time)) return false;
    return Date.now() - time <= days * 24 * 60 * 60 * 1000;
}
