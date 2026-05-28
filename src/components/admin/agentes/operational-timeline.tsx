'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
    AlertTriangle,
    Bot,
    CheckCircle2,
    CircleDot,
    Clock,
    ExternalLink,
    GitMerge,
    GitPullRequest,
    Loader2,
    ShieldCheck,
    Workflow,
} from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AgentEvent, AgentRiskLevel } from '@/lib/admin/agent-command-center-data';
import {
    buildOperationalTimeline,
    type AgentOperationalTimelineEvent,
    type GitHubRepositoryActivitySummary,
} from '@/lib/admin/agent-command-center-github';
import { RiskBadge } from './agent-status-badge';

interface OperationalTimelineProps {
    agentEvents: AgentEvent[];
    limit?: number;
    compact?: boolean;
}

export function OperationalTimeline({ agentEvents, limit = 10, compact = false }: OperationalTimelineProps) {
    const [githubData, setGithubData] = useState<GitHubRepositoryActivitySummary | null>(null);
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

                if (!response.ok) throw new Error('GitHub timeline endpoint failed');

                const payload = await response.json() as GitHubRepositoryActivitySummary;
                if (!controller.signal.aborted) {
                    setGithubData(payload);
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

    const timelineEvents = useMemo(
        () => buildOperationalTimeline({ agentEvents, githubData, limit }),
        [agentEvents, githubData, limit],
    );
    const githubEventCount = getGitHubEventCount(githubData);
    const showGitHubUnavailable = hasError || (!isLoading && githubData?.status.state === 'unavailable');
    const showGitHubEmpty = !isLoading && !showGitHubUnavailable && githubData !== null && githubEventCount === 0;

    return (
        <section className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <SectionHeader
                    title="Timeline operacional"
                    subtitle="Eventos simulados dos agentes combinados com dados reais read-only do GitHub."
                />
                <div className="flex flex-wrap gap-2">
                    <TimelinePill label="Sem ações reais nesta fase" tone="slate" />
                    {isLoading ? (
                        <TimelinePill label="Atualizando GitHub real" tone="amber" icon={<Loader2 className="h-3 w-3 animate-spin" />} />
                    ) : (
                        <TimelinePill label="Read-only" tone="green" icon={<ShieldCheck className="h-3 w-3" />} />
                    )}
                </div>
            </div>

            {showGitHubUnavailable && (
                <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-xs font-bold text-amber-800 shadow-sm">
                    Dados GitHub indisponíveis no momento. Exibindo eventos simulados.
                </div>
            )}

            {showGitHubEmpty && (
                <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-xs font-bold text-slate-500 shadow-sm">
                    Nenhum PR, issue ou workflow público encontrado agora.
                </div>
            )}

            <div className={cn('rounded-[2rem] border border-slate-100 bg-white shadow-sm', compact ? 'p-4' : 'p-5')}>
                {timelineEvents.length > 0 ? (
                    <div className="relative space-y-4">
                        <div className="absolute bottom-4 left-5 top-4 hidden w-px bg-slate-100 sm:block" />
                        {timelineEvents.map((event) => (
                            <TimelineEventCard key={event.id} event={event} compact={compact} />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
                        <p className="text-sm font-black text-bee-midnight">Nenhum evento operacional encontrado.</p>
                        <p className="mt-1 text-xs font-bold text-slate-400">A timeline será preenchida quando houver eventos simulados ou dados GitHub disponíveis.</p>
                    </div>
                )}
            </div>
        </section>
    );
}

function TimelineEventCard({ event, compact }: { event: AgentOperationalTimelineEvent; compact: boolean }) {
    const Icon = getTimelineIcon(event);

    return (
        <div className="relative flex gap-4">
            <div className="z-10 hidden h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-white text-slate-500 shadow-sm sm:flex">
                <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1 rounded-2xl border border-slate-100 bg-white px-4 py-4 transition-all hover:border-slate-200 hover:bg-amber-50/20">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <TimelinePill
                                label={event.source === 'github' ? 'GitHub real' : 'Agente simulado'}
                                tone={event.source === 'github' ? 'blue' : 'amber'}
                            />
                            <TimelinePill label={event.status} tone={getStatusTone(event.status)} />
                        </div>
                        <p className={cn('mt-3 font-black text-bee-midnight', compact ? 'text-sm' : 'text-base')}>{event.title}</p>
                        <p className="mt-1 line-clamp-2 text-sm font-medium leading-relaxed text-slate-600">{event.description}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <RiskBadge risk={event.risk as AgentRiskLevel} />
                        {event.url && event.url !== '#' && (
                            <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-300 hover:bg-amber-50 hover:text-bee-amber">
                                <a href={event.url} target="_blank" rel="noreferrer" aria-label={`Abrir ${event.title} no GitHub`}>
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </Button>
                        )}
                    </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-50 pt-3 text-[11px] font-bold text-slate-400">
                    <span>{formatTimelineDate(event.timestamp)}</span>
                    <span>•</span>
                    <span>{event.department}</span>
                    <span>•</span>
                    <span>{event.agentName}</span>
                    {event.metadata?.branch && (
                        <>
                            <span>•</span>
                            <code className="rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-500">{event.metadata.branch}</code>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function TimelinePill({
    label,
    tone,
    icon,
}: {
    label: string;
    tone: 'green' | 'amber' | 'blue' | 'red' | 'slate';
    icon?: ReactNode;
}) {
    const tones = {
        green: 'border-green-100 bg-green-50 text-green-700',
        amber: 'border-amber-100 bg-amber-50 text-amber-700',
        blue: 'border-blue-100 bg-blue-50 text-blue-700',
        red: 'border-red-100 bg-red-50 text-red-700',
        slate: 'border-slate-100 bg-slate-50 text-slate-500',
    };

    return (
        <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider', tones[tone])}>
            {icon}
            {label}
        </span>
    );
}

function getTimelineIcon(event: AgentOperationalTimelineEvent) {
    if (event.source === 'agent_mock') {
        if (event.type === 'approval_request') return Clock;
        if (event.type === 'alert') return AlertTriangle;
        return Bot;
    }

    const icons = {
        pull_request: GitPullRequest,
        workflow_run: Workflow,
        issue: CircleDot,
        merge: GitMerge,
        agent_task: Bot,
        alert: AlertTriangle,
        approval_request: Clock,
    };

    return icons[event.type] ?? CheckCircle2;
}

function getStatusTone(status: string): 'green' | 'amber' | 'blue' | 'red' | 'slate' {
    const normalizedStatus = status.toLowerCase();
    if (['success', 'concluído', 'merged', 'completed'].includes(normalizedStatus)) return 'green';
    if (['running', 'em andamento', 'in_progress', 'queued', 'draft'].includes(normalizedStatus)) return 'blue';
    if (['failure', 'falha', 'failed', 'cancelled', 'timed_out'].includes(normalizedStatus)) return 'red';
    if (['open', 'aguardando ceo'].includes(normalizedStatus)) return 'amber';
    return 'slate';
}

function getGitHubEventCount(githubData: GitHubRepositoryActivitySummary | null) {
    if (!githubData || githubData.status.state === 'unavailable') return 0;
    return githubData.recentPullRequests.length + githubData.issues.length + githubData.workflowRuns.length;
}

function formatTimelineDate(value: string) {
    if (!value) return '-';

    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}
