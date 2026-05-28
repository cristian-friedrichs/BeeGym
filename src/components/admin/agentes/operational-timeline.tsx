'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
    AlertTriangle,
    Bot,
    CheckCircle2,
    CircleDot,
    Clock,
    Copy,
    ExternalLink,
    FilterX,
    GitMerge,
    GitPullRequest,
    Info,
    Loader2,
    Search,
    ShieldCheck,
    Workflow,
} from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { departments, type AgentEvent, type AgentRiskLevel } from '@/lib/admin/agent-command-center-data';
import {
    type AgentOperationalApprovalRequirement,
    buildOperationalTimeline,
    type AgentOperationalTimelineEvent,
    type AgentOperationalTimelineSource,
    type AgentOperationalTimelineType,
    type GitHubRepositoryActivitySummary,
} from '@/lib/admin/agent-command-center-github';
import { RiskBadge } from './agent-status-badge';

interface OperationalTimelineProps {
    agentEvents: AgentEvent[];
    limit?: number;
    compact?: boolean;
}

type TimelineSourceFilter = 'all' | AgentOperationalTimelineSource;
type TimelineTypeFilter = 'all' | AgentOperationalTimelineType;
type TimelineStatusFilter = 'all' | 'completed' | 'running' | 'pending' | 'failed' | 'blocked';
type EventAnalysisMode = 'summary' | 'risk' | 'engineering' | 'approval' | 'github';
type ClipboardCopyState = 'idle' | 'copied' | 'failed';

interface TimelineFilters {
    source: TimelineSourceFilter;
    type: TimelineTypeFilter;
    status: TimelineStatusFilter;
    departmentId: string;
    query: string;
}

interface TimelineSummary {
    visible: number;
    total: number;
    github: number;
    simulated: number;
    attention: number;
    recentEngineering: number;
}

interface TimelineGroup {
    id: string;
    label: string;
    events: AgentOperationalTimelineEvent[];
}

interface TimelineDetailField {
    label: string;
    value: string | number;
    mono?: boolean;
}

const DEFAULT_FILTERS: TimelineFilters = {
    source: 'all',
    type: 'all',
    status: 'all',
    departmentId: 'all',
    query: '',
};

const TYPE_FILTER_OPTIONS: Array<{ value: TimelineTypeFilter; label: string }> = [
    { value: 'all', label: 'Todos os tipos' },
    { value: 'pull_request', label: 'PR' },
    { value: 'workflow_run', label: 'Workflow' },
    { value: 'issue', label: 'Issue' },
    { value: 'agent_task', label: 'Tarefa' },
    { value: 'approval_request', label: 'Aprovação' },
    { value: 'alert', label: 'Alerta' },
    { value: 'merge', label: 'Merge' },
];

const STATUS_FILTER_OPTIONS: Array<{ value: TimelineStatusFilter; label: string }> = [
    { value: 'all', label: 'Todos os status' },
    { value: 'completed', label: 'Concluído' },
    { value: 'running', label: 'Em andamento' },
    { value: 'pending', label: 'Pendente' },
    { value: 'failed', label: 'Falhou' },
    { value: 'blocked', label: 'Bloqueado' },
];

const EVENT_ANALYSIS_MODES: Array<{ value: EventAnalysisMode; label: string }> = [
    { value: 'summary', label: 'Resumo' },
    { value: 'risk', label: 'Risco' },
    { value: 'engineering', label: 'Engenharia' },
    { value: 'approval', label: 'Aprovação' },
    { value: 'github', label: 'GitHub' },
];

export function OperationalTimeline({ agentEvents, limit = 10, compact = false }: OperationalTimelineProps) {
    const [githubData, setGithubData] = useState<GitHubRepositoryActivitySummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [filters, setFilters] = useState<TimelineFilters>(DEFAULT_FILTERS);
    const [selectedEvent, setSelectedEvent] = useState<AgentOperationalTimelineEvent | null>(null);

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
        () => buildOperationalTimeline({ agentEvents, githubData, limit: Math.max(limit, 40) }),
        [agentEvents, githubData, limit],
    );
    const filteredEvents = useMemo(
        () => filterTimelineEvents(timelineEvents, filters).slice(0, limit),
        [filters, limit, timelineEvents],
    );
    const groupedEvents = useMemo(
        () => groupTimelineEvents(filteredEvents),
        [filteredEvents],
    );
    const summary = useMemo(
        () => getTimelineSummary(timelineEvents, filteredEvents),
        [filteredEvents, timelineEvents],
    );
    const githubEventCount = getGitHubEventCount(githubData);
    const showGitHubUnavailable = hasError || (!isLoading && githubData?.status.state === 'unavailable');
    const showGitHubEmpty = !isLoading && !showGitHubUnavailable && githubData !== null && githubEventCount === 0;
    const hasActiveFilters = hasTimelineFilters(filters);

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

            <TimelineSummaryCards summary={summary} />

            <TimelineFiltersBar
                filters={filters}
                hasActiveFilters={hasActiveFilters}
                onChange={setFilters}
                onClear={() => setFilters(DEFAULT_FILTERS)}
            />

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
                {groupedEvents.length > 0 ? (
                    <div className="space-y-6">
                        {groupedEvents.map((group) => (
                            <TimelineEventGroup key={group.id} group={group} compact={compact} onSelectEvent={setSelectedEvent} />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
                        <p className="text-sm font-black text-bee-midnight">
                            {timelineEvents.length === 0 ? 'Nenhum evento operacional encontrado.' : 'Nenhum evento encontrado para os filtros selecionados.'}
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-400">
                            {timelineEvents.length === 0
                                ? 'A timeline será preenchida quando houver eventos simulados ou dados GitHub disponíveis.'
                                : 'Ajuste a busca ou limpe os filtros para voltar à visão completa.'}
                        </p>
                        {timelineEvents.length > 0 && hasActiveFilters && (
                            <Button type="button" variant="outline" size="sm" onClick={() => setFilters(DEFAULT_FILTERS)} className="mt-4 h-9 rounded-xl border-slate-100 bg-white text-xs font-bold text-slate-500 hover:bg-amber-50 hover:text-bee-amber">
                                Limpar filtros
                            </Button>
                        )}
                    </div>
                )}
            </div>

            <TimelineEventDetailDrawer
                event={selectedEvent}
                open={Boolean(selectedEvent)}
                onOpenChange={(open) => {
                    if (!open) setSelectedEvent(null);
                }}
            />
        </section>
    );
}

function TimelineSummaryCards({ summary }: { summary: TimelineSummary }) {
    const cards = [
        { label: 'Eventos exibidos', value: `${summary.visible}/${summary.total}`, helper: 'filtrado / geral' },
        { label: 'GitHub real', value: String(summary.github), helper: 'eventos filtrados' },
        { label: 'Agente simulado', value: String(summary.simulated), helper: 'eventos filtrados' },
        { label: 'Atenção ou falha', value: String(summary.attention), helper: 'risco médio/alto' },
        { label: 'PRs/workflows', value: String(summary.recentEngineering), helper: 'GitHub recente' },
    ];

    return (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            {cards.map((card) => (
                <div key={card.label} className="rounded-[1.5rem] border border-slate-100 bg-white px-4 py-3 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{card.label}</p>
                    <p className="mt-1 text-2xl font-black text-bee-midnight">{card.value}</p>
                    <p className="mt-1 text-[11px] font-bold text-slate-400">{card.helper}</p>
                </div>
            ))}
        </div>
    );
}

function TimelineFiltersBar({
    filters,
    hasActiveFilters,
    onChange,
    onClear,
}: {
    filters: TimelineFilters;
    hasActiveFilters: boolean;
    onChange: (filters: TimelineFilters) => void;
    onClear: () => void;
}) {
    function updateFilter<Key extends keyof TimelineFilters>(key: Key, value: TimelineFilters[Key]) {
        onChange({ ...filters, [key]: value });
    }

    return (
        <div className="rounded-[2rem] border border-white/60 bg-white/40 p-2 shadow-sm backdrop-blur-sm">
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(260px,1.4fr)_repeat(4,minmax(150px,1fr))_auto]">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        value={filters.query}
                        onChange={(event) => updateFilter('query', event.target.value)}
                        placeholder="Buscar título, descrição, agente, PR, issue ou branch..."
                        className="h-11 rounded-2xl border-slate-100 bg-white pl-10 text-sm font-medium shadow-sm"
                    />
                </div>

                <Select value={filters.source} onValueChange={(value) => updateFilter('source', value as TimelineSourceFilter)}>
                    <SelectTrigger className="h-11 rounded-2xl border-slate-100 bg-white font-bold text-slate-600 shadow-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                        <SelectItem value="all" className="rounded-xl font-bold">Todas origens</SelectItem>
                        <SelectItem value="github" className="rounded-xl font-bold">GitHub real</SelectItem>
                        <SelectItem value="agent_mock" className="rounded-xl font-bold">Agente simulado</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={filters.type} onValueChange={(value) => updateFilter('type', value as TimelineTypeFilter)}>
                    <SelectTrigger className="h-11 rounded-2xl border-slate-100 bg-white font-bold text-slate-600 shadow-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                        {TYPE_FILTER_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="rounded-xl font-bold">{option.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={filters.status} onValueChange={(value) => updateFilter('status', value as TimelineStatusFilter)}>
                    <SelectTrigger className="h-11 rounded-2xl border-slate-100 bg-white font-bold text-slate-600 shadow-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                        {STATUS_FILTER_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="rounded-xl font-bold">{option.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={filters.departmentId} onValueChange={(value) => updateFilter('departmentId', value)}>
                    <SelectTrigger className="h-11 rounded-2xl border-slate-100 bg-white font-bold text-slate-600 shadow-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                        <SelectItem value="all" className="rounded-xl font-bold">Todos departamentos</SelectItem>
                        {departments.map((department) => (
                            <SelectItem key={department.id} value={department.id} className="rounded-xl font-bold">{department.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button
                    type="button"
                    variant="outline"
                    onClick={onClear}
                    disabled={!hasActiveFilters}
                    className="h-11 rounded-2xl border-slate-100 bg-white px-4 text-xs font-bold text-slate-500 shadow-sm hover:bg-amber-50 hover:text-bee-amber disabled:opacity-50"
                >
                    <FilterX className="mr-2 h-4 w-4" />
                    Limpar
                </Button>
            </div>
        </div>
    );
}

function TimelineEventGroup({
    group,
    compact,
    onSelectEvent,
}: {
    group: TimelineGroup;
    compact: boolean;
    onSelectEvent: (event: AgentOperationalTimelineEvent) => void;
}) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">{group.label}</p>
                <div className="h-px flex-1 bg-slate-100" />
                <span className="rounded-full border border-slate-100 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    {group.events.length} eventos
                </span>
            </div>
            <div className="relative space-y-4">
                <div className="absolute bottom-4 left-5 top-4 hidden w-px bg-slate-100 sm:block" />
                {group.events.map((event) => (
                    <TimelineEventCard key={event.id} event={event} compact={compact} onSelect={() => onSelectEvent(event)} />
                ))}
            </div>
        </div>
    );
}

function TimelineEventCard({
    event,
    compact,
    onSelect,
}: {
    event: AgentOperationalTimelineEvent;
    compact: boolean;
    onSelect: () => void;
}) {
    const Icon = getTimelineIcon(event);

    return (
        <div className="relative flex gap-4">
            <div className="z-10 hidden h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-white text-slate-500 shadow-sm sm:flex">
                <Icon className="h-4 w-4" />
            </div>
            <div
                role="button"
                tabIndex={0}
                onClick={onSelect}
                onKeyDown={(keyEvent) => {
                    if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
                        keyEvent.preventDefault();
                        onSelect();
                    }
                }}
                className="min-w-0 flex-1 rounded-2xl border border-slate-100 bg-white px-4 py-4 text-left transition-all hover:border-slate-200 hover:bg-amber-50/20 focus:outline-none focus:ring-2 focus:ring-bee-amber/30"
            >
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
                                <a href={event.url} target="_blank" rel="noreferrer" aria-label={`Abrir ${event.title} no GitHub`} onClick={(clickEvent) => clickEvent.stopPropagation()}>
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </Button>
                        )}
                    </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-50 pt-3 text-[11px] font-bold text-slate-400">
                    <span>{formatTimelineDate(event.timestamp)}</span>
                    <span>-</span>
                    <span>{event.department}</span>
                    <span>-</span>
                    <span>{event.agentName}</span>
                    {event.metadata?.branch && (
                        <>
                            <span>-</span>
                            <code className="rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-500">{event.metadata.branch}</code>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function TimelineEventDetailDrawer({
    event,
    open,
    onOpenChange,
}: {
    event: AgentOperationalTimelineEvent | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [activeMode, setActiveMode] = useState<EventAnalysisMode>('summary');
    const [copyState, setCopyState] = useState<ClipboardCopyState>('idle');
    const detailFields = event ? getEventDetailFields(event) : [];
    const governance = event ? getEventGovernance(event) : null;
    const nextSteps = event ? getEventNextSteps(event) : [];

    useEffect(() => {
        if (event?.id) {
            setActiveMode('summary');
            setCopyState('idle');
        }
    }, [event?.id]);

    useEffect(() => {
        if (copyState === 'idle') return undefined;

        const timeoutId = window.setTimeout(() => setCopyState('idle'), 2500);
        return () => window.clearTimeout(timeoutId);
    }, [copyState]);

    async function handleCopySummary() {
        if (!event || typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
            setCopyState('failed');
            return;
        }

        try {
            await navigator.clipboard.writeText(buildTimelineEventShareSummary(event));
            setCopyState('copied');
        } catch {
            setCopyState('failed');
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full border-l border-slate-100 bg-white p-0 shadow-2xl sm:max-w-2xl">
                {event && (
                    <div className="flex h-full flex-col">
                        <SheetHeader className="shrink-0 border-b border-slate-100 bg-white px-8 py-7 text-left">
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-500">
                                    {(() => {
                                        const Icon = getTimelineIcon(event);
                                        return <Icon className="h-5 w-5" />;
                                    })()}
                                </div>
                                <div className="min-w-0 flex-1 space-y-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <TimelinePill label={event.source === 'github' ? 'GitHub real' : 'Agente simulado'} tone={event.source === 'github' ? 'blue' : 'amber'} />
                                        <TimelinePill label={event.status} tone={getStatusTone(event.status)} />
                                        <RiskBadge risk={event.risk as AgentRiskLevel} />
                                    </div>
                                    <div>
                                        <SheetTitle className="text-2xl font-black tracking-tight text-bee-midnight">{event.title}</SheetTitle>
                                        <SheetDescription className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
                                            {event.description}
                                        </SheetDescription>
                                    </div>
                                </div>
                            </div>
                        </SheetHeader>

                        <Tabs value={activeMode} onValueChange={(value) => setActiveMode(value as EventAnalysisMode)} className="flex min-h-0 flex-1 flex-col">
                            <div className="shrink-0 border-b border-slate-100 bg-slate-50/50 px-6 py-3">
                                <TabsList className="grid h-auto w-full grid-cols-2 rounded-2xl border border-slate-100 bg-white p-1 shadow-sm sm:grid-cols-5">
                                    {EVENT_ANALYSIS_MODES.map((mode) => (
                                        <TabsTrigger
                                            key={mode.value}
                                            value={mode.value}
                                            className="rounded-xl px-3 py-2 text-xs font-black text-slate-500 data-[state=active]:bg-bee-amber data-[state=active]:text-bee-midnight data-[state=active]:shadow-none"
                                        >
                                            {mode.label}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </div>

                            <ScrollArea className="flex-1">
                                <div className="p-6">
                                    {EVENT_ANALYSIS_MODES.map((mode) => (
                                        <TabsContent key={mode.value} value={mode.value} className="m-0 space-y-5">
                                            <TimelineEventAnalysisContent
                                                event={event}
                                                mode={mode.value}
                                                detailFields={detailFields}
                                                governance={governance}
                                                nextSteps={nextSteps}
                                            />
                                        </TabsContent>
                                    ))}
                                </div>
                            </ScrollArea>
                        </Tabs>

                        <SheetFooter className="shrink-0 border-t border-slate-100 bg-slate-50/50 p-6">
                            <div className="flex w-full flex-col gap-3">
                                {copyState === 'failed' && (
                                    <p className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                                        Não foi possível copiar automaticamente.
                                    </p>
                                )}
                                <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleCopySummary}
                                        className={cn(
                                            'h-10 rounded-xl border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-amber-50 hover:text-bee-amber',
                                            copyState === 'copied' && 'border-green-100 bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700',
                                            copyState === 'failed' && 'border-amber-100 bg-amber-50 text-amber-800 hover:bg-amber-50 hover:text-amber-800',
                                        )}
                                    >
                                        {copyState === 'copied' ? (
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                        ) : (
                                            <Copy className="mr-2 h-4 w-4" />
                                        )}
                                        {copyState === 'copied' ? 'Resumo copiado' : 'Copiar resumo'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => onOpenChange(false)}
                                        className="h-10 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                                    >
                                        Fechar
                                    </Button>
                                    {event.url && event.url !== '#' && (
                                        <Button asChild variant="outline" className="h-10 rounded-xl border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-amber-50 hover:text-bee-amber">
                                            <a href={event.url} target="_blank" rel="noreferrer">
                                                <ExternalLink className="mr-2 h-4 w-4" />
                                                {event.externalUrlLabel ?? 'Abrir no GitHub'}
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </SheetFooter>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}

function TimelineEventAnalysisContent({
    event,
    mode,
    detailFields,
    governance,
    nextSteps,
}: {
    event: AgentOperationalTimelineEvent;
    mode: EventAnalysisMode;
    detailFields: TimelineDetailField[];
    governance: ReturnType<typeof getEventGovernance> | null;
    nextSteps: string[];
}) {
    if (mode === 'risk') {
        const riskSummary = getEventRiskSummary(event);

        return (
            <>
                <DetailSection title="Leitura de risco" icon={<AlertTriangle className="h-4 w-4" />}>
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                            <p className="text-sm font-black text-bee-midnight">{riskSummary.title}</p>
                            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">{riskSummary.operationalImpact}</p>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <DetailField label="Risco" value={getRiskLabel(event.risk)} />
                            <DetailField label="Status" value={event.status} />
                            <DetailField label="Aprovação CEO" value={governance?.approvalLabel ?? 'Não'} />
                            <DetailField label="Classificação" value={riskSummary.attentionLabel} />
                        </div>
                    </div>
                </DetailSection>

                <DetailSection title="Governança de risco" icon={<ShieldCheck className="h-4 w-4" />}>
                    <p className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 text-sm font-bold leading-relaxed text-amber-800">
                        {governance?.reason ?? riskSummary.recommendation}
                    </p>
                    <p className="mt-4 rounded-2xl border border-slate-100 bg-white p-4 text-sm font-medium leading-relaxed text-slate-600">
                        {riskSummary.recommendation}
                    </p>
                </DetailSection>
            </>
        );
    }

    if (mode === 'engineering') {
        return (
            <>
                <DetailSection title="Engenharia" icon={<Workflow className="h-4 w-4" />}>
                    {detailFields.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {detailFields.map((field) => (
                                <DetailField key={field.label} label={field.label} value={field.value} mono={field.mono} />
                            ))}
                        </div>
                    ) : (
                        <DetailEmptyState message="Este evento não possui evidência técnica associada." />
                    )}
                </DetailSection>

                {detailFields.length > 0 && (
                    <DetailSection title="Evidência técnica" icon={<CircleDot className="h-4 w-4" />}>
                        <p className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-medium leading-relaxed text-slate-600">
                            {getEventEngineeringSummary(event)}
                        </p>
                    </DetailSection>
                )}
            </>
        );
    }

    if (mode === 'approval') {
        return (
            <>
                <DetailSection title="Aprovação" icon={<ShieldCheck className="h-4 w-4" />}>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <DetailField label="Aprovação CEO" value={governance?.approvalLabel ?? 'Não'} />
                        <DetailField label="Autonomia" value={governance?.level ?? 'Leitura operacional'} />
                    </div>
                    <p className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/70 p-4 text-sm font-bold leading-relaxed text-amber-800">
                        {getEventApprovalSummary(event, governance)}
                    </p>
                    <p className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-black leading-relaxed text-slate-600">
                        Nenhuma aprovação real é executada por este painel nesta fase.
                    </p>
                </DetailSection>

                <DetailSection title="Próximos passos de decisão" icon={<CheckCircle2 className="h-4 w-4" />}>
                    <NextStepsList steps={nextSteps} />
                    <p className="mt-4 text-[11px] font-bold text-slate-400">
                        Itens apenas visuais. Não há aprovação, rejeição, merge, deploy ou automação real.
                    </p>
                </DetailSection>
            </>
        );
    }

    if (mode === 'github') {
        const githubSummary = getEventGithubSummary(event);

        return (
            <>
                <DetailSection title="GitHub" icon={<GitPullRequest className="h-4 w-4" />}>
                    {githubSummary.isGitHub ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {githubSummary.fields.map((field) => (
                                    <DetailField key={field.label} label={field.label} value={field.value} mono={field.mono} />
                                ))}
                            </div>
                            <p className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm font-bold leading-relaxed text-blue-800">
                                Origem read-only: leitura real pública e sanitizada do GitHub. Nenhum payload bruto é exposto.
                            </p>
                            {event.url && event.url !== '#' && (
                                <Button asChild variant="outline" className="h-10 rounded-xl border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-amber-50 hover:text-bee-amber">
                                    <a href={event.url} target="_blank" rel="noreferrer">
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        {event.externalUrlLabel ?? 'Abrir no GitHub'}
                                    </a>
                                </Button>
                            )}
                        </div>
                    ) : (
                        <DetailEmptyState message="Este evento é simulado e não possui origem GitHub real." />
                    )}
                </DetailSection>
            </>
        );
    }

    return (
        <>
            <DetailSection title="Resumo" icon={<Info className="h-4 w-4" />}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <DetailField label="Tipo" value={getTypeLabel(event.type)} />
                    <DetailField label="Departamento" value={event.department} />
                    <DetailField label="Agente" value={event.agentName} />
                    <DetailField label="Data e hora" value={formatFullDateTime(event.timestamp)} />
                    <DetailField label="Origem dos dados" value={event.isRealData ? 'Leitura real pública' : 'Simulação local'} />
                    <DetailField label="Natureza" value={event.isRealData ? 'Dado real sanitizado' : 'Dado simulado'} />
                </div>
            </DetailSection>

            <DetailSection title="Contexto" icon={<CircleDot className="h-4 w-4" />}>
                <p className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-medium leading-relaxed text-slate-600">
                    {event.evidence ?? event.description}
                </p>
            </DetailSection>

            <DetailSection title="Próximos passos principais" icon={<CheckCircle2 className="h-4 w-4" />}>
                <NextStepsList steps={nextSteps} />
                <p className="mt-4 text-[11px] font-bold text-slate-400">
                    Sugestões apenas visuais. Nenhuma aprovação, merge, deploy ou automação é executada por este painel.
                </p>
            </DetailSection>
        </>
    );
}

function NextStepsList({ steps }: { steps: string[] }) {
    return (
        <div className="space-y-2">
            {steps.map((step) => (
                <div key={step} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-bold text-slate-600">
                    <span className="h-2 w-2 rounded-full bg-bee-amber" />
                    {step}
                </div>
            ))}
        </div>
    );
}

function DetailEmptyState({ message }: { message: string }) {
    return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
            <p className="text-sm font-black text-bee-midnight">{message}</p>
            <p className="mt-1 text-xs font-bold text-slate-400">A leitura permanece disponível em modo observável e read-only.</p>
        </div>
    );
}

function DetailSection({
    title,
    icon,
    children,
}: {
    title: string;
    icon: ReactNode;
    children: ReactNode;
}) {
    return (
        <section className="rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                    {icon}
                </div>
                <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-400">{title}</h3>
            </div>
            {children}
        </section>
    );
}

function DetailField({ label, value, mono = false }: { label: string; value: string | number; mono?: boolean }) {
    return (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
            <p className={cn('mt-1 break-words text-sm font-black text-bee-midnight', mono && 'font-mono text-xs')}>{value}</p>
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

function getTypeLabel(type: AgentOperationalTimelineType) {
    const labels: Record<AgentOperationalTimelineType, string> = {
        agent_task: 'Tarefa',
        pull_request: 'PR',
        workflow_run: 'Workflow',
        issue: 'Issue',
        merge: 'Merge',
        alert: 'Alerta',
        approval_request: 'Aprovação',
    };

    return labels[type];
}

function getEventDetailFields(event: AgentOperationalTimelineEvent): TimelineDetailField[] {
    const fields: TimelineDetailField[] = [];
    const workflowName = getMetadataValue(event, 'workflowName');
    const runId = getMetadataValue(event, 'runId');
    const base = getMetadataValue(event, 'base');
    const labels = getMetadataValue(event, 'labels');
    const eventName = getMetadataValue(event, 'event');
    const eventType = getMetadataValue(event, 'eventType');

    if (event.relatedEntityNumber) fields.push({ label: event.type === 'issue' ? 'Issue' : 'PR', value: `#${event.relatedEntityNumber}` });
    if (workflowName) fields.push({ label: 'Workflow', value: workflowName });
    if (runId) fields.push({ label: 'Run ID', value: runId, mono: true });
    if (event.relatedBranch) fields.push({ label: 'Branch', value: event.relatedBranch, mono: true });
    if (base) fields.push({ label: 'Base', value: base, mono: true });
    if (event.relatedCommitSha) fields.push({ label: 'Commit', value: event.relatedCommitSha, mono: true });
    if (eventName) fields.push({ label: 'Evento GitHub', value: eventName });
    if (eventType) fields.push({ label: 'Evento agente', value: eventType });
    if (labels) fields.push({ label: 'Labels', value: labels });

    return fields;
}

function getEventRiskSummary(event: AgentOperationalTimelineEvent) {
    const statusCategory = getStatusCategory(event);
    const isWorkflowFailure = event.type === 'workflow_run' && statusCategory === 'failed';
    const hasAttention = event.risk !== 'low' || statusCategory === 'failed' || statusCategory === 'blocked';

    if (isWorkflowFailure) {
        return {
            title: 'Atenção necessária · workflow falhou',
            attentionLabel: 'Falha operacional',
            operationalImpact: 'O evento indica falha em um check ou workflow observado. A análise deve focar em logs e impacto antes de qualquer ação real.',
            recommendation: 'Abrir logs no GitHub, classificar a falha e manter qualquer decisão como próximo passo visual nesta fase.',
        };
    }

    if (statusCategory === 'blocked' || event.risk === 'high') {
        return {
            title: 'Atenção necessária · risco alto',
            attentionLabel: 'Bloqueio ou risco alto',
            operationalImpact: 'O evento pede leitura humana antes de evoluir para uma decisão operacional.',
            recommendation: 'Validar contexto, risco e governança antes de transformar este evento em ação real.',
        };
    }

    if (hasAttention) {
        return {
            title: 'Aprovação exigida apenas se virar ação real',
            attentionLabel: 'Atenção moderada',
            operationalImpact: 'O evento pode exigir acompanhamento, mas o painel permanece apenas observável.',
            recommendation: 'Acompanhar evolução do status e pedir aprovação humana somente se a leitura virar execução real.',
        };
    }

    return {
        title: 'Baixo risco · leitura operacional',
        attentionLabel: 'Sem bloqueio',
        operationalImpact: 'O evento tem risco baixo e pode ser acompanhado como parte da rotina operacional.',
        recommendation: 'Sem aprovação CEO nesta fase. Manter acompanhamento read-only.',
    };
}

function getEventEngineeringSummary(event: AgentOperationalTimelineEvent) {
    if (event.type === 'pull_request') return 'Evidência técnica de PR com número, branch, base e commit quando disponíveis.';
    if (event.type === 'workflow_run') return 'Evidência técnica de workflow/check com nome, run id, branch, evento e commit quando disponíveis.';
    if (event.type === 'issue') return 'Evidência técnica de issue com número, labels e origem GitHub quando disponíveis.';
    return 'Evidência técnica derivada dos metadados seguros do evento.';
}

function getEventApprovalSummary(
    event: AgentOperationalTimelineEvent,
    governance: ReturnType<typeof getEventGovernance> | null,
) {
    const approvalRequired = governance?.approvalRequired ?? getFallbackApprovalRequirement(event);

    if (approvalRequired === 'yes') {
        return governance?.reason ?? 'Aprovação CEO indicada para qualquer transformação deste evento em ação real.';
    }

    if (approvalRequired === 'conditional') {
        return governance?.reason ?? 'Aprovação exigida apenas se virar ação real ou se houver falha/risco.';
    }

    return governance?.reason ?? 'Sem aprovação CEO nesta fase. O painel apresenta apenas leitura operacional.';
}

function getEventGithubSummary(event: AgentOperationalTimelineEvent) {
    const fields: TimelineDetailField[] = [
        { label: 'Origem', value: event.source === 'github' ? 'GitHub real' : 'Agente simulado' },
        { label: 'Modo', value: event.isRealData ? 'Read-only público' : 'Simulação local' },
        { label: 'Status', value: event.status },
        { label: 'Tipo', value: getTypeLabel(event.type) },
    ];

    if (event.relatedEntityNumber) fields.push({ label: event.type === 'issue' ? 'Issue' : 'PR', value: `#${event.relatedEntityNumber}` });

    const workflowName = getMetadataValue(event, 'workflowName');
    const runId = getMetadataValue(event, 'runId');
    const labels = getMetadataValue(event, 'labels');
    const conclusion = getMetadataValue(event, 'conclusion');

    if (workflowName) fields.push({ label: 'Workflow', value: workflowName });
    if (runId) fields.push({ label: 'Run ID', value: runId, mono: true });
    if (event.relatedBranch) fields.push({ label: 'Branch', value: event.relatedBranch, mono: true });
    if (event.relatedCommitSha) fields.push({ label: 'Commit', value: event.relatedCommitSha, mono: true });
    if (labels) fields.push({ label: 'Labels', value: labels });
    if (conclusion) fields.push({ label: 'Conclusion', value: conclusion });

    return {
        isGitHub: event.source === 'github',
        fields,
    };
}

function buildTimelineEventShareSummary(event: AgentOperationalTimelineEvent) {
    const governance = getEventGovernance(event);
    const nextSteps = getEventNextSteps(event).slice(0, 4);
    const lines = [
        'BeeGym Agent Command Center · Resumo do Evento',
        '',
        `Título: ${sanitizeShareValue(event.title, 160)}`,
        `Origem: ${event.source === 'github' ? 'GitHub real' : 'Agente simulado'}`,
        `Tipo: ${getTypeLabel(event.type)}`,
        `Status: ${sanitizeShareValue(event.status, 80)}`,
        `Risco: ${getRiskLabel(event.risk)}`,
        `Departamento: ${sanitizeShareValue(event.department, 120)}`,
        `Agente: ${sanitizeShareValue(event.agentName, 120)}`,
        `Data/hora: ${formatFullDateTime(event.timestamp)}`,
        `Aprovação CEO: ${getShareApprovalLabel(governance.approvalRequired)}`,
        `Motivo: ${sanitizeShareValue(governance.reason, 260)}`,
        `Evidência: ${sanitizeShareValue(event.evidence ?? event.description, 260)}`,
        event.url && event.url !== '#' ? `Link: ${sanitizeShareValue(event.url, 220)}` : null,
        '',
        'Próximos passos:',
        ...nextSteps.map((step) => `- ${sanitizeShareValue(step, 140)}`),
        '',
        'Observações:',
        '- Dados GitHub são leitura pública/read-only.',
        '- Nenhuma ação real foi executada pelo painel.',
    ];

    return lines.filter((line): line is string => line !== null).join('\n');
}

function getEventGovernance(event: AgentOperationalTimelineEvent) {
    const approvalRequired = event.approvalRequired ?? getFallbackApprovalRequirement(event);

    return {
        level: event.governanceLevel ?? (event.isRealData ? 'Leitura pública' : 'Simulação local'),
        approvalLabel: getApprovalRequiredLabel(approvalRequired),
        approvalRequired,
        reason: event.approvalReason ?? getFallbackApprovalReason(approvalRequired, event),
    };
}

function getRiskLabel(risk: string) {
    if (risk === 'high') return 'Alto';
    if (risk === 'medium') return 'Médio';
    return 'Baixo';
}

function getShareApprovalLabel(approvalRequired: AgentOperationalApprovalRequirement) {
    if (approvalRequired === 'yes') return 'Sim';
    if (approvalRequired === 'conditional') return 'Apenas se virar ação real';
    return 'Não';
}

function sanitizeShareValue(value: string | number | null | undefined, maxLength: number) {
    const normalized = String(value ?? '-')
        .replace(/\s+/g, ' ')
        .trim();
    const safeValue = normalized || '-';

    return safeValue.length > maxLength ? `${safeValue.slice(0, Math.max(0, maxLength - 3))}...` : safeValue;
}

function getEventNextSteps(event: AgentOperationalTimelineEvent) {
    if (event.nextSteps && event.nextSteps.length > 0) return event.nextSteps;

    if (event.type === 'pull_request') return ['Acompanhar checks', 'Revisar escopo'];
    if (event.type === 'workflow_run' && getStatusCategory(event) === 'failed') return ['Abrir logs no GitHub', 'Classificar falha'];
    if (event.type === 'workflow_run') return ['Acompanhar conclusão', 'Registrar resultado'];
    if (event.type === 'issue') return ['Triar prioridade', 'Encaminhar departamento'];
    return ['Validar se deve virar tarefa real', 'Vincular a uma aprovação futura'];
}

function getApprovalRequiredLabel(approvalRequired: AgentOperationalApprovalRequirement) {
    const labels: Record<AgentOperationalApprovalRequirement, string> = {
        yes: 'Sim',
        no: 'Não',
        conditional: 'Apenas em caso de falha/risco',
    };

    return labels[approvalRequired];
}

function getFallbackApprovalRequirement(event: AgentOperationalTimelineEvent): AgentOperationalApprovalRequirement {
    if (event.type === 'approval_request' || event.risk === 'high') return 'yes';
    if (event.risk === 'medium' || getStatusCategory(event) === 'failed') return 'conditional';
    return 'no';
}

function getFallbackApprovalReason(approvalRequired: AgentOperationalApprovalRequirement, event: AgentOperationalTimelineEvent) {
    if (approvalRequired === 'yes') return 'Evento classificado com risco ou aprovação explícita para decisão humana.';
    if (approvalRequired === 'conditional') return 'Aprovação humana pode ser necessária se o risco aumentar ou houver falha operacional.';
    return event.isRealData
        ? 'Evento real observado em modo read-only, sem ação operacional no painel.'
        : 'Evento simulado sem execução real nesta fase.';
}

function getMetadataValue(event: AgentOperationalTimelineEvent, key: string) {
    const value = event.metadata?.[key];
    if (value === null || value === undefined || value === '') return '';
    return String(value);
}

function filterTimelineEvents(events: AgentOperationalTimelineEvent[], filters: TimelineFilters) {
    const normalizedQuery = normalizeText(filters.query);

    return events.filter((event) => {
        if (filters.source !== 'all' && event.source !== filters.source) return false;
        if (filters.type !== 'all' && event.type !== filters.type) return false;
        if (filters.status !== 'all' && getStatusCategory(event) !== filters.status) return false;
        if (filters.departmentId !== 'all' && getEventDepartmentId(event) !== filters.departmentId) return false;
        if (normalizedQuery && !getSearchText(event).includes(normalizedQuery)) return false;
        return true;
    });
}

function getTimelineSummary(allEvents: AgentOperationalTimelineEvent[], visibleEvents: AgentOperationalTimelineEvent[]): TimelineSummary {
    return {
        visible: visibleEvents.length,
        total: allEvents.length,
        github: visibleEvents.filter((event) => event.source === 'github').length,
        simulated: visibleEvents.filter((event) => event.source === 'agent_mock').length,
        attention: visibleEvents.filter((event) => event.risk !== 'low' || getStatusCategory(event) === 'failed' || getStatusCategory(event) === 'blocked').length,
        recentEngineering: visibleEvents.filter((event) => event.type === 'pull_request' || event.type === 'workflow_run').length,
    };
}

function groupTimelineEvents(events: AgentOperationalTimelineEvent[]): TimelineGroup[] {
    const groups = new Map<string, TimelineGroup>();

    events.forEach((event) => {
        const group = getTemporalGroup(event.timestamp);
        const currentGroup = groups.get(group.id);

        if (currentGroup) {
            currentGroup.events.push(event);
            return;
        }

        groups.set(group.id, { ...group, events: [event] });
    });

    return Array.from(groups.values());
}

function getTemporalGroup(timestamp: string) {
    const eventDate = new Date(timestamp);
    if (!Number.isFinite(eventDate.getTime())) {
        return { id: 'unknown', label: 'Sem data' };
    }

    const today = startOfDay(new Date());
    const eventDay = startOfDay(eventDate);
    const diffDays = Math.floor((today.getTime() - eventDay.getTime()) / 86_400_000);

    if (diffDays === 0) return { id: 'today', label: 'Hoje' };
    if (diffDays === 1) return { id: 'yesterday', label: 'Ontem' };
    if (diffDays >= 2 && diffDays <= 6) return { id: 'last-7-days', label: 'Últimos 7 dias' };

    return { id: eventDay.toISOString().slice(0, 10), label: formatGroupDate(eventDate) };
}

function getStatusCategory(event: AgentOperationalTimelineEvent): TimelineStatusFilter {
    const normalizedStatus = event.status.toLowerCase();

    if (event.risk === 'high' && event.type === 'alert') return 'blocked';
    if (['failure', 'falha', 'failed', 'cancelled', 'timed_out'].includes(normalizedStatus)) return 'failed';
    if (['success', 'concluído', 'merged', 'completed'].includes(normalizedStatus)) return 'completed';
    if (['running', 'em andamento', 'in_progress', 'queued'].includes(normalizedStatus)) return 'running';
    if (['open', 'draft', 'aguardando ceo'].includes(normalizedStatus)) return 'pending';

    return 'pending';
}

function getEventDepartmentId(event: AgentOperationalTimelineEvent) {
    const metadataDepartmentId = event.metadata?.departmentId;
    if (typeof metadataDepartmentId === 'string' && metadataDepartmentId) return metadataDepartmentId;

    return departments.find((department) => department.shortName === event.department || department.name === event.department)?.id ?? '';
}

function getSearchText(event: AgentOperationalTimelineEvent) {
    const metadataValues = Object.values(event.metadata ?? {})
        .filter((value) => value !== null && value !== undefined)
        .join(' ');

    return normalizeText([
        event.title,
        event.description,
        event.agentName,
        event.department,
        event.status,
        event.type,
        metadataValues,
    ].join(' '));
}

function hasTimelineFilters(filters: TimelineFilters) {
    return filters.source !== DEFAULT_FILTERS.source
        || filters.type !== DEFAULT_FILTERS.type
        || filters.status !== DEFAULT_FILTERS.status
        || filters.departmentId !== DEFAULT_FILTERS.departmentId
        || filters.query.trim() !== DEFAULT_FILTERS.query;
}

function normalizeText(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function startOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
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

function formatFullDateTime(value: string) {
    if (!value) return '-';

    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

function formatGroupDate(value: Date) {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(value);
}
