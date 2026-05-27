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
