import {
    agents,
    departments,
    type AgentEvent,
    type AgentRiskLevel,
    type AgentRunStatus,
} from './agent-command-center-data';

export type GitHubIntegrationState = 'available' | 'degraded' | 'unavailable';

export interface GitHubPullRequestSummary {
    number: number;
    title: string;
    state: string;
    merged: boolean;
    draft: boolean;
    author: string;
    headRef: string;
    baseRef: string;
    createdAt: string;
    updatedAt: string;
    mergedAt: string;
    url: string;
    labels: string[];
}

export interface GitHubIssueSummary {
    number: number;
    title: string;
    state: string;
    author: string;
    labels: string[];
    createdAt: string;
    updatedAt: string;
    url: string;
}

export interface GitHubWorkflowRunSummary {
    id: number;
    name: string;
    status: string;
    conclusion: string | null;
    event: string;
    branch: string;
    commitSha: string;
    createdAt: string;
    updatedAt: string;
    url: string;
}

export interface GitHubCommitSummary {
    sha: string;
    title: string;
    author: string;
    committedAt: string;
    url: string;
}

export interface GitHubIntegrationStatus {
    state: GitHubIntegrationState;
    label: string;
    message: string;
    fetchedAt: string;
    source: 'github_public_api';
    readOnly: true;
    rateLimited: boolean;
}

export interface GitHubRepositoryActivitySummary {
    repository: 'cristian-friedrichs/BeeGym';
    status: GitHubIntegrationStatus;
    openPullRequests: number;
    openIssues: number;
    recentPullRequests: GitHubPullRequestSummary[];
    issues: GitHubIssueSummary[];
    workflowRuns: GitHubWorkflowRunSummary[];
    recentCommits: GitHubCommitSummary[];
    latestWorkflowRun: GitHubWorkflowRunSummary | null;
    latestMergedPullRequest: GitHubPullRequestSummary | null;
}

export type AgentOperationalTimelineSource = 'agent_mock' | 'github';
export type AgentOperationalTimelineType =
    | 'agent_task'
    | 'pull_request'
    | 'workflow_run'
    | 'issue'
    | 'merge'
    | 'alert'
    | 'approval_request';

export interface AgentOperationalTimelineEvent {
    id: string;
    source: AgentOperationalTimelineSource;
    type: AgentOperationalTimelineType;
    title: string;
    description: string;
    status: string;
    risk: AgentRiskLevel;
    department: string;
    agentName: string;
    timestamp: string;
    url?: string;
    metadata?: Record<string, string | number | boolean | null>;
    isRealData: boolean;
}

export interface BuildOperationalTimelineParams {
    agentEvents?: AgentEvent[];
    githubData?: GitHubRepositoryActivitySummary | null;
    limit?: number;
}

type GitHubResource = 'pulls' | 'issues' | 'workflowRuns' | 'commits';
type GitHubResult<T> = { ok: true; data: T } | { ok: false; status: number; rateLimited: boolean };

const GITHUB_REPOSITORY = 'cristian-friedrichs/BeeGym' as const;
const GITHUB_API_BASE = `https://api.github.com/repos/${GITHUB_REPOSITORY}`;
const GITHUB_HEADERS = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'BeeGym-Admin-ReadOnly',
};

const GITHUB_ENDPOINTS: Record<GitHubResource, string> = {
    pulls: `${GITHUB_API_BASE}/pulls?state=all&per_page=10`,
    issues: `${GITHUB_API_BASE}/issues?state=open&per_page=10`,
    workflowRuns: `${GITHUB_API_BASE}/actions/runs?per_page=10`,
    commits: `${GITHUB_API_BASE}/commits?per_page=5`,
};

export function createEmptyGitHubRepositoryActivity(message = 'Nao foi possivel carregar dados do GitHub agora.'): GitHubRepositoryActivitySummary {
    return {
        repository: GITHUB_REPOSITORY,
        status: {
            state: 'unavailable',
            label: 'GitHub indisponivel',
            message,
            fetchedAt: new Date().toISOString(),
            source: 'github_public_api',
            readOnly: true,
            rateLimited: false,
        },
        openPullRequests: 0,
        openIssues: 0,
        recentPullRequests: [],
        issues: [],
        workflowRuns: [],
        recentCommits: [],
        latestWorkflowRun: null,
        latestMergedPullRequest: null,
    };
}

export function buildOperationalTimeline({
    agentEvents = [],
    githubData,
    limit = 14,
}: BuildOperationalTimelineParams): AgentOperationalTimelineEvent[] {
    const timelineEvents = [
        ...agentEvents.map(toAgentTimelineEvent),
        ...toGitHubTimelineEvents(githubData),
    ];

    return timelineEvents
        .filter((event) => Boolean(event.timestamp))
        .sort((left, right) => getTimestamp(right.timestamp) - getTimestamp(left.timestamp))
        .slice(0, limit);
}

export async function fetchGitHubRepositoryActivity(): Promise<GitHubRepositoryActivitySummary> {
    const fetchedAt = new Date().toISOString();

    const [pulls, issues, workflowRuns, commits] = await Promise.all([
        fetchGitHubJson<unknown[]>(GITHUB_ENDPOINTS.pulls),
        fetchGitHubJson<unknown[]>(GITHUB_ENDPOINTS.issues),
        fetchGitHubJson<{ workflow_runs?: unknown[] }>(GITHUB_ENDPOINTS.workflowRuns),
        fetchGitHubJson<unknown[]>(GITHUB_ENDPOINTS.commits),
    ]);

    const rateLimited = [pulls, issues, workflowRuns, commits].some((result) => !result.ok && result.rateLimited);
    const successfulRequests = [pulls, issues, workflowRuns, commits].filter((result) => result.ok).length;

    if (successfulRequests === 0) {
        return {
            ...createEmptyGitHubRepositoryActivity(rateLimited ? 'Limite publico do GitHub atingido temporariamente.' : 'Nao foi possivel carregar dados do GitHub agora.'),
            status: {
                state: 'unavailable',
                label: rateLimited ? 'Limite temporario' : 'GitHub indisponivel',
                message: rateLimited ? 'Limite publico do GitHub atingido temporariamente.' : 'Nao foi possivel carregar dados do GitHub agora.',
                fetchedAt,
                source: 'github_public_api',
                readOnly: true,
                rateLimited,
            },
        };
    }

    const recentPullRequests = pulls.ok ? pulls.data.map(toPullRequestSummary).filter(isDefined) : [];
    const issuesOnly = issues.ok ? issues.data.filter((item) => !hasPullRequestMarker(item)).map(toIssueSummary).filter(isDefined) : [];
    const runs = workflowRuns.ok ? (workflowRuns.data.workflow_runs ?? []).map(toWorkflowRunSummary).filter(isDefined) : [];
    const recentCommits = commits.ok ? commits.data.map(toCommitSummary).filter(isDefined) : [];
    const latestMergedPullRequest = recentPullRequests.find((pullRequest) => pullRequest.merged) ?? null;

    return {
        repository: GITHUB_REPOSITORY,
        status: {
            state: successfulRequests === 4 ? 'available' : 'degraded',
            label: successfulRequests === 4 ? 'Sincronizacao read-only' : 'Sincronizacao parcial',
            message: successfulRequests === 4
                ? 'Dados reais de leitura publica carregados do GitHub.'
                : 'Alguns dados publicos do GitHub nao puderam ser carregados agora.',
            fetchedAt,
            source: 'github_public_api',
            readOnly: true,
            rateLimited,
        },
        openPullRequests: recentPullRequests.filter((pullRequest) => pullRequest.state === 'open').length,
        openIssues: issuesOnly.length,
        recentPullRequests,
        issues: issuesOnly,
        workflowRuns: runs,
        recentCommits,
        latestWorkflowRun: runs[0] ?? null,
        latestMergedPullRequest,
    };
}

async function fetchGitHubJson<T>(url: string): Promise<GitHubResult<T>> {
    try {
        const response = await fetch(url, {
            headers: GITHUB_HEADERS,
            next: { revalidate: 60 },
        });

        if (!response.ok) {
            return {
                ok: false,
                status: response.status,
                rateLimited: response.status === 403 || response.status === 429,
            };
        }

        return { ok: true, data: await response.json() as T };
    } catch {
        return { ok: false, status: 0, rateLimited: false };
    }
}

function toPullRequestSummary(item: unknown): GitHubPullRequestSummary | null {
    const record = asRecord(item);
    if (!record) return null;

    return {
        number: getNumber(record.number),
        title: getString(record.title, 'PR sem titulo'),
        state: getString(record.state, 'unknown'),
        merged: Boolean(record.merged_at),
        draft: Boolean(record.draft),
        author: getNestedString(record, 'user', 'login', 'github-user'),
        headRef: getNestedString(record, 'head', 'ref', '-'),
        baseRef: getNestedString(record, 'base', 'ref', '-'),
        createdAt: getString(record.created_at),
        updatedAt: getString(record.updated_at),
        mergedAt: getString(record.merged_at),
        url: getString(record.html_url, '#'),
        labels: getLabelNames(record.labels),
    };
}

function toIssueSummary(item: unknown): GitHubIssueSummary | null {
    const record = asRecord(item);
    if (!record) return null;

    return {
        number: getNumber(record.number),
        title: getString(record.title, 'Issue sem titulo'),
        state: getString(record.state, 'unknown'),
        author: getNestedString(record, 'user', 'login', 'github-user'),
        labels: getLabelNames(record.labels),
        createdAt: getString(record.created_at),
        updatedAt: getString(record.updated_at),
        url: getString(record.html_url, '#'),
    };
}

function toWorkflowRunSummary(item: unknown): GitHubWorkflowRunSummary | null {
    const record = asRecord(item);
    if (!record) return null;

    return {
        id: getNumber(record.id),
        name: getString(record.name, 'Workflow'),
        status: getString(record.status, 'unknown'),
        conclusion: typeof record.conclusion === 'string' ? record.conclusion : null,
        event: getString(record.event, '-'),
        branch: getString(record.head_branch, '-'),
        commitSha: getString(record.head_sha).slice(0, 7),
        createdAt: getString(record.created_at),
        updatedAt: getString(record.updated_at),
        url: getString(record.html_url, '#'),
    };
}

function toCommitSummary(item: unknown): GitHubCommitSummary | null {
    const record = asRecord(item);
    if (!record) return null;

    const commit = asRecord(record.commit);
    const author = asRecord(record.author);
    const commitAuthor = commit ? asRecord(commit.author) : null;
    const message = commit ? getString(commit.message, 'Commit sem mensagem') : 'Commit sem mensagem';

    return {
        sha: getString(record.sha).slice(0, 7),
        title: message.split('\n')[0].slice(0, 120),
        author: author ? getString(author.login, 'github-user') : 'github-user',
        committedAt: commitAuthor ? getString(commitAuthor.date) : '',
        url: getString(record.html_url, '#'),
    };
}

function hasPullRequestMarker(item: unknown) {
    const record = asRecord(item);
    return Boolean(record?.pull_request);
}

function asRecord(value: unknown): Record<string, unknown> | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
    return value as Record<string, unknown>;
}

function getString(value: unknown, fallback = '') {
    return typeof value === 'string' ? value : fallback;
}

function getNumber(value: unknown) {
    return typeof value === 'number' ? value : 0;
}

function getNestedString(record: Record<string, unknown>, key: string, nestedKey: string, fallback: string) {
    const nested = asRecord(record[key]);
    return nested ? getString(nested[nestedKey], fallback) : fallback;
}

function getLabelNames(labels: unknown) {
    if (!Array.isArray(labels)) return [];

    return labels
        .map((label) => {
            const record = asRecord(label);
            return record ? getString(record.name) : '';
        })
        .filter(Boolean)
        .slice(0, 4);
}

function isDefined<T>(value: T | null | undefined): value is T {
    return value !== null && value !== undefined;
}

function toAgentTimelineEvent(event: AgentEvent): AgentOperationalTimelineEvent {
    const agent = agents.find((item) => item.id === event.agentId);
    const department = departments.find((item) => item.id === event.departmentId);

    return {
        id: `agent-${event.id}`,
        source: 'agent_mock',
        type: getAgentTimelineType(event),
        title: event.title,
        description: event.evidence,
        status: getAgentStatusLabel(event.status),
        risk: event.severity,
        department: department?.shortName ?? department?.name ?? 'BeeGym OS',
        agentName: agent?.name ?? 'Agente simulado',
        timestamp: event.occurredAt,
        metadata: {
            departmentId: event.departmentId,
            eventType: event.eventType,
            runId: event.runId ?? null,
        },
        isRealData: false,
    };
}

function toGitHubTimelineEvents(githubData?: GitHubRepositoryActivitySummary | null): AgentOperationalTimelineEvent[] {
    if (!githubData || githubData.status.state === 'unavailable') return [];

    const pullRequestEvents = githubData.recentPullRequests.flatMap((pullRequest) => {
        const events: AgentOperationalTimelineEvent[] = [
            {
                id: `github-pr-open-${pullRequest.number}`,
                source: 'github',
                type: 'pull_request',
                title: `PR #${pullRequest.number} ${pullRequest.state === 'open' ? 'aberto' : 'atualizado'}`,
                description: pullRequest.title,
                status: pullRequest.draft ? 'draft' : pullRequest.state,
                risk: 'low',
                department: 'CTO',
                agentName: pullRequest.author,
                timestamp: pullRequest.createdAt || pullRequest.updatedAt,
                url: pullRequest.url,
                metadata: {
                    departmentId: 'cto-monitoring',
                    number: pullRequest.number,
                    branch: pullRequest.headRef,
                    base: pullRequest.baseRef,
                    labels: pullRequest.labels.join(', '),
                },
                isRealData: true,
            },
        ];

        if (pullRequest.merged) {
            events.push({
                id: `github-pr-merge-${pullRequest.number}`,
                source: 'github',
                type: 'merge',
                title: `PR #${pullRequest.number} mergeado`,
                description: pullRequest.title,
                status: 'merged',
                risk: 'low',
                department: 'CTO',
                agentName: pullRequest.author,
                timestamp: pullRequest.mergedAt || pullRequest.updatedAt,
                url: pullRequest.url,
                metadata: {
                    departmentId: 'cto-monitoring',
                    number: pullRequest.number,
                    branch: pullRequest.headRef,
                    base: pullRequest.baseRef,
                },
                isRealData: true,
            });
        }

        return events;
    });

    const workflowEvents = githubData.workflowRuns.map((run): AgentOperationalTimelineEvent => ({
        id: `github-workflow-${run.id}`,
        source: 'github',
        type: 'workflow_run',
        title: getWorkflowTimelineTitle(run),
        description: `${run.name} em ${run.branch}`,
        status: run.status === 'completed' ? run.conclusion ?? 'completed' : run.status,
        risk: getWorkflowRisk(run),
        department: 'CTO',
        agentName: 'GitHub Actions',
        timestamp: run.updatedAt || run.createdAt,
        url: run.url,
        metadata: {
            departmentId: 'cto-monitoring',
            event: run.event,
            branch: run.branch,
            commit: run.commitSha,
        },
        isRealData: true,
    }));

    const issueEvents = githubData.issues.map((issue): AgentOperationalTimelineEvent => ({
        id: `github-issue-${issue.number}`,
        source: 'github',
        type: 'issue',
        title: `Issue #${issue.number} aberta`,
        description: issue.title,
        status: issue.state,
        risk: issue.labels.some((label) => label.toLowerCase().includes('bug')) ? 'medium' : 'low',
        department: 'CTO',
        agentName: issue.author,
        timestamp: issue.createdAt || issue.updatedAt,
        url: issue.url,
        metadata: {
            departmentId: 'cto-monitoring',
            number: issue.number,
            labels: issue.labels.join(', '),
        },
        isRealData: true,
    }));

    return [...pullRequestEvents, ...workflowEvents, ...issueEvents];
}

function getAgentTimelineType(event: AgentEvent): AgentOperationalTimelineType {
    if (event.status === 'waiting_approval') return 'approval_request';
    if (event.severity === 'high' || event.severity === 'medium') return 'alert';
    return 'agent_task';
}

function getAgentStatusLabel(status: AgentRunStatus) {
    const labels: Record<AgentRunStatus, string> = {
        completed: 'Concluído',
        running: 'Em andamento',
        waiting_approval: 'Aguardando CEO',
        failed: 'Falha',
    };

    return labels[status];
}

function getWorkflowTimelineTitle(run: GitHubWorkflowRunSummary) {
    if (run.status !== 'completed') return 'Check em andamento';
    if (run.conclusion === 'success') return 'Workflow concluído';
    if (run.conclusion === 'failure') return 'Workflow falhou';
    return 'Workflow concluído';
}

function getWorkflowRisk(run: GitHubWorkflowRunSummary): AgentRiskLevel {
    if (run.status !== 'completed') return 'medium';
    if (run.conclusion === 'failure') return 'high';
    if (run.conclusion === 'cancelled' || run.conclusion === 'timed_out') return 'medium';
    return 'low';
}

function getTimestamp(value: string) {
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? time : 0;
}
