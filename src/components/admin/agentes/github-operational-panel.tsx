'use client';

import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, GitBranch, GitPullRequest, GitPullRequestClosed, Loader2, ShieldCheck, Workflow } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { KpiCard } from '@/components/ui/kpi-card';
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
import type {
    GitHubIntegrationState,
    GitHubIssueSummary,
    GitHubPullRequestSummary,
    GitHubRepositoryActivitySummary,
    GitHubWorkflowRunSummary,
} from '@/lib/admin/agent-command-center-github';

type GitHubPanelVariant = 'dashboard' | 'activities' | 'approvals';

interface GitHubOperationalPanelProps {
    variant?: GitHubPanelVariant;
}

const emptyStatus = {
    state: 'unavailable' as GitHubIntegrationState,
    label: 'GitHub indisponível',
    message: 'Não foi possível carregar dados do GitHub agora. A timeline simulada continua disponível.',
    fetchedAt: new Date().toISOString(),
    source: 'github_public_api' as const,
    readOnly: true as const,
    rateLimited: false,
};

export function GitHubOperationalPanel({ variant = 'dashboard' }: GitHubOperationalPanelProps) {
    const [data, setData] = useState<GitHubRepositoryActivitySummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        async function loadGitHubData() {
            try {
                const response = await fetch('/api/admin/agent-command-center/github', {
                    signal: controller.signal,
                    headers: { Accept: 'application/json' },
                });

                if (!response.ok) throw new Error('GitHub admin endpoint failed');

                const payload = await response.json() as GitHubRepositoryActivitySummary;
                if (!controller.signal.aborted) {
                    setData(payload);
                    setHasError(payload.status.state === 'unavailable');
                }
            } catch {
                if (!controller.signal.aborted) {
                    setHasError(true);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        }

        loadGitHubData();

        return () => controller.abort();
    }, []);

    const activity = data ?? createEmptyClientActivity();
    const openPullRequests = useMemo(
        () => activity.recentPullRequests.filter((pullRequest) => pullRequest.state === 'open'),
        [activity.recentPullRequests],
    );

    if (variant === 'approvals') {
        return (
            <section className="space-y-4">
                <SectionHeader title="PRs observáveis" subtitle="Dados reais do GitHub · leitura pública · nenhuma ação real nesta fase" />
                <StatusNotice status={activity.status} isLoading={isLoading} hasError={hasError} />
                <OpenPullRequestsList pullRequests={openPullRequests} isLoading={isLoading} />
            </section>
        );
    }

    if (variant === 'activities') {
        return (
            <section className="space-y-4">
                <SectionHeader title="Atividades GitHub" subtitle="Dados reais do GitHub · leitura pública. Eventos dos agentes permanecem simulados." />
                <StatusNotice status={activity.status} isLoading={isLoading} hasError={hasError} />
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <WorkflowRunsList runs={activity.workflowRuns} isLoading={isLoading} />
                    <RecentPullRequestsList pullRequests={activity.recentPullRequests} isLoading={isLoading} compact />
                </div>
            </section>
        );
    }

    return (
        <section className="space-y-4">
            <SectionHeader title="GitHub operacional" subtitle="Dados reais do GitHub · leitura pública read-only" />
            <StatusNotice status={activity.status} isLoading={isLoading} hasError={hasError} />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <KpiCard title="PRs abertos" value={isLoading ? '-' : String(activity.openPullRequests)} color="amber" icon={<GitPullRequest className="h-6 w-6" />} />
                <KpiCard title="Issues abertas" value={isLoading ? '-' : String(activity.openIssues)} color="default" icon={<GitBranch className="h-6 w-6" />} />
                <KpiCard title="Último workflow" value={getWorkflowLabel(activity.latestWorkflowRun, isLoading)} color="black" icon={<Workflow className="h-6 w-6" />} />
                <KpiCard title="Último merge" value={getPullRequestLabel(activity.latestMergedPullRequest, isLoading)} color="default" icon={<GitPullRequestClosed className="h-6 w-6" />} />
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <RecentPullRequestsList pullRequests={activity.recentPullRequests} isLoading={isLoading} />
                <WorkflowRunsList runs={activity.workflowRuns} isLoading={isLoading} />
            </div>
            <OpenIssuesList issues={activity.issues} isLoading={isLoading} />
        </section>
    );
}

function StatusNotice({
    status,
    isLoading,
    hasError,
}: {
    status: GitHubRepositoryActivitySummary['status'];
    isLoading: boolean;
    hasError: boolean;
}) {
    const visibleStatus = isLoading ? { ...status, state: 'degraded' as GitHubIntegrationState, label: 'Carregando GitHub', message: 'Buscando leitura pública do repositório.' } : status;
    const tone = getStateTone(visibleStatus.state);

    return (
        <div className={cn('flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-sm', tone.container)}>
            <div className="flex min-w-0 items-center gap-3">
                {isLoading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <ShieldCheck className="h-4 w-4 shrink-0" />}
                <div className="min-w-0">
                    <p className={cn('text-xs font-black uppercase tracking-wider', tone.title)}>{visibleStatus.label}</p>
                    <p className="truncate text-xs font-bold text-slate-500">
                        {hasError ? 'Não foi possível carregar dados públicos do GitHub. Confira acesso, limite público da API ou tente novamente.' : visibleStatus.message}
                    </p>
                </div>
            </div>
            <span className="rounded-full border border-white/70 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                Dados reais do GitHub · leitura pública
            </span>
        </div>
    );
}

function RecentPullRequestsList({
    pullRequests,
    isLoading,
    compact = false,
}: {
    pullRequests: GitHubPullRequestSummary[];
    isLoading: boolean;
    compact?: boolean;
}) {
    return (
        <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-50 px-6 py-4">
                <div>
                    <p className="text-sm font-black text-bee-midnight">Últimos PRs</p>
                    <p className="text-[11px] font-bold text-slate-400">Origem real: GitHub público</p>
                </div>
                <ReadOnlyPill />
            </div>
            <Table>
                <TableHeader>
                    <TableRow className="border-slate-50 bg-slate-50/50 hover:bg-slate-50/50">
                        <TableHead className="h-12 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">PR</TableHead>
                        {!compact && <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-slate-400">Branch</TableHead>}
                        <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</TableHead>
                        <TableHead className="h-12 w-12" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading && <LoadingRow colSpan={compact ? 3 : 4} label="Carregando PRs recentes..." />}
                    {!isLoading && pullRequests.map((pullRequest) => (
                        <TableRow key={pullRequest.number} className="border-slate-50 hover:bg-amber-50/30">
                            <TableCell className="max-w-[360px] px-6 py-4">
                                <p className="line-clamp-1 text-sm font-black text-bee-midnight">#{pullRequest.number} {pullRequest.title}</p>
                                <p className="text-[11px] font-bold text-slate-400">{pullRequest.author} - atualizado {formatDateTime(pullRequest.updatedAt)}</p>
                            </TableCell>
                            {!compact && (
                                <TableCell className="max-w-[220px]">
                                    <code className="rounded-xl bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-500">{pullRequest.headRef}</code>
                                </TableCell>
                            )}
                            <TableCell>
                                <GitHubStatePill label={pullRequest.merged ? 'Merge feito' : pullRequest.state === 'open' ? 'Aberto' : 'Fechado'} tone={pullRequest.merged ? 'green' : pullRequest.state === 'open' ? 'amber' : 'slate'} />
                            </TableCell>
                            <TableCell className="pr-6">
                                <ExternalGitHubButton url={pullRequest.url} label={`Abrir PR #${pullRequest.number} no GitHub`} />
                            </TableCell>
                        </TableRow>
                    ))}
                    {!isLoading && pullRequests.length === 0 && (
                        <EmptyRow
                            colSpan={compact ? 3 : 4}
                            label="Nenhum PR público encontrado agora."
                            description="Confira se a branch já foi publicada, se o PR foi fechado ou se ainda precisa ser aberto no GitHub."
                        />
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

function WorkflowRunsList({ runs, isLoading }: { runs: GitHubWorkflowRunSummary[]; isLoading: boolean }) {
    return (
        <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-50 px-6 py-4">
                <div>
                    <p className="text-sm font-black text-bee-midnight">Workflows recentes</p>
                    <p className="text-[11px] font-bold text-slate-400">Checks públicos em leitura read-only</p>
                </div>
                <ReadOnlyPill />
            </div>
            <Table>
                <TableHeader>
                    <TableRow className="border-slate-50 bg-slate-50/50 hover:bg-slate-50/50">
                        <TableHead className="h-12 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Workflow</TableHead>
                        <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-slate-400">Branch</TableHead>
                        <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</TableHead>
                        <TableHead className="h-12 w-12" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading && <LoadingRow colSpan={4} label="Carregando workflows recentes..." />}
                    {!isLoading && runs.map((run) => (
                        <TableRow key={run.id} className="border-slate-50 hover:bg-amber-50/30">
                            <TableCell className="max-w-[320px] px-6 py-4">
                                <p className="line-clamp-1 text-sm font-black text-bee-midnight">{run.name}</p>
                                <p className="text-[11px] font-bold text-slate-400">{run.event} - {run.commitSha || 'sem sha'} - {formatDateTime(run.updatedAt)}</p>
                            </TableCell>
                            <TableCell className="max-w-[180px]">
                                <code className="rounded-xl bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-500">{run.branch}</code>
                            </TableCell>
                            <TableCell>
                                <WorkflowStatePill run={run} />
                            </TableCell>
                            <TableCell className="pr-6">
                                <ExternalGitHubButton url={run.url} label={`Abrir workflow ${run.name} no GitHub`} />
                            </TableCell>
                        </TableRow>
                    ))}
                    {!isLoading && runs.length === 0 && (
                        <EmptyRow
                            colSpan={4}
                            label="Nenhum workflow público encontrado agora."
                            description="Confira se existe PR recente, se o GitHub Actions iniciou ou se a leitura pública atingiu limite temporário."
                        />
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

function OpenIssuesList({ issues, isLoading }: { issues: GitHubIssueSummary[]; isLoading: boolean }) {
    return (
        <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-50 px-6 py-4">
                <div>
                    <p className="text-sm font-black text-bee-midnight">Issues abertas</p>
                    <p className="text-[11px] font-bold text-slate-400">Somente issues públicas; PRs ficam fora desta lista</p>
                </div>
                <ReadOnlyPill />
            </div>
            <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-2">
                {isLoading && (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-400">
                        Carregando issues abertas...
                    </div>
                )}
                {!isLoading && issues.slice(0, 4).map((issue) => (
                    <div key={issue.number} className="rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:border-slate-200 hover:bg-amber-50/30">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="line-clamp-1 text-sm font-black text-bee-midnight">#{issue.number} {issue.title}</p>
                                <p className="mt-1 text-[11px] font-bold text-slate-400">{issue.author} - {formatDateTime(issue.updatedAt)}</p>
                            </div>
                            <ExternalGitHubButton url={issue.url} label={`Abrir issue #${issue.number} no GitHub`} />
                        </div>
                    </div>
                ))}
                {!isLoading && issues.length === 0 && (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                        <p className="text-sm font-black text-slate-500">Nenhuma issue pública aberta encontrada agora.</p>
                        <p className="mt-1 text-xs font-bold text-slate-400">Confira se existem issues elegíveis com labels de agente ou se a fila já foi concluída.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function OpenPullRequestsList({ pullRequests, isLoading }: { pullRequests: GitHubPullRequestSummary[]; isLoading: boolean }) {
    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {isLoading && (
                <div className="rounded-[2rem] border border-slate-100 bg-white p-5 text-sm font-bold text-slate-400 shadow-sm">
                    Carregando PRs abertos...
                </div>
            )}
            {!isLoading && pullRequests.map((pullRequest) => (
                <div key={pullRequest.number} className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-slate-200 hover:bg-amber-50/30">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="line-clamp-1 text-sm font-black text-bee-midnight">#{pullRequest.number} {pullRequest.title}</p>
                            <p className="mt-1 text-xs font-bold text-slate-400">{pullRequest.headRef} para {pullRequest.baseRef}</p>
                        </div>
                        <GitHubStatePill label="Observável" tone="amber" />
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-50 pt-4">
                        <span className="text-[11px] font-bold text-slate-400">Sem ação real de merge ou aprovação.</span>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm" disabled className="h-9 rounded-xl border-slate-100 bg-slate-50 text-xs font-bold text-slate-400">
                                Somente observar
                            </Button>
                            <Button asChild variant="ghost" size="sm" className="h-9 rounded-xl text-xs font-bold text-slate-400 hover:bg-amber-50 hover:text-bee-amber">
                                <a href={pullRequest.url} target="_blank" rel="noreferrer">
                                    Abrir GitHub
                                </a>
                            </Button>
                        </div>
                    </div>
                </div>
            ))}
            {!isLoading && pullRequests.length === 0 && (
                <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
                    <p className="text-sm font-black text-slate-500">Nenhum PR aberto encontrado para observação agora.</p>
                    <p className="mt-1 text-xs font-bold text-slate-400">Confira se a rodada ainda precisa abrir PR ou se os trabalhos já foram mergeados ou fechados.</p>
                </div>
            )}
        </div>
    );
}

function ExternalGitHubButton({ url, label }: { url: string; label: string }) {
    return (
        <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-300 hover:bg-amber-50 hover:text-bee-amber">
            <a href={url} target="_blank" rel="noreferrer" aria-label={label}>
                <ExternalLink className="h-4 w-4" />
            </a>
        </Button>
    );
}

function ReadOnlyPill() {
    return (
        <span className="rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-700">
            Leitura
        </span>
    );
}

function GitHubStatePill({ label, tone }: { label: string; tone: 'green' | 'amber' | 'slate' | 'red' }) {
    const tones = {
        green: 'border-green-100 bg-green-50 text-green-700',
        amber: 'border-amber-100 bg-amber-50 text-amber-700',
        slate: 'border-slate-100 bg-slate-50 text-slate-500',
        red: 'border-red-100 bg-red-50 text-red-700',
    };

    return (
        <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider', tones[tone])}>
            {label}
        </span>
    );
}

function WorkflowStatePill({ run }: { run: GitHubWorkflowRunSummary }) {
    if (run.status !== 'completed') {
        return <GitHubStatePill label={run.status} tone="amber" />;
    }

    if (run.conclusion === 'success') {
        return <GitHubStatePill label="Sucesso" tone="green" />;
    }

    return <GitHubStatePill label={run.conclusion ?? 'Concluído'} tone={run.conclusion === 'failure' ? 'red' : 'slate'} />;
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

function EmptyRow({ colSpan, label, description }: { colSpan: number; label: string; description?: string }) {
    return (
        <TableRow>
            <TableCell colSpan={colSpan} className="h-24 text-center text-sm font-bold text-slate-400">
                <div className="mx-auto max-w-lg space-y-1">
                    <p className="font-black text-slate-500">{label}</p>
                    {description && <p className="text-xs font-bold text-slate-400">{description}</p>}
                </div>
            </TableCell>
        </TableRow>
    );
}

function createEmptyClientActivity(): GitHubRepositoryActivitySummary {
    return {
        repository: 'cristian-friedrichs/BeeGym',
        status: emptyStatus,
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
}

function getWorkflowLabel(run: GitHubWorkflowRunSummary | null, isLoading: boolean) {
    if (isLoading) return '-';
    if (!run) return 'Sem workflow';
    if (run.status !== 'completed') return run.status;
    return run.conclusion ?? 'concluído';
}

function getPullRequestLabel(pullRequest: GitHubPullRequestSummary | null, isLoading: boolean) {
    if (isLoading) return '-';
    if (!pullRequest) return 'Sem merge público';
    return `#${pullRequest.number}`;
}

function getStateTone(state: GitHubIntegrationState) {
    const tones = {
        available: {
            container: 'border-green-100 bg-green-50/70',
            title: 'text-green-700',
        },
        degraded: {
            container: 'border-amber-100 bg-amber-50/70',
            title: 'text-amber-700',
        },
        unavailable: {
            container: 'border-red-100 bg-red-50/70',
            title: 'text-red-700',
        },
    };

    return tones[state];
}

function formatDateTime(value: string) {
    if (!value) return '-';

    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}
