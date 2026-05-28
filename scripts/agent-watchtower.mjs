#!/usr/bin/env node

import { execFileSync } from 'node:child_process';

const DEFAULT_REPOSITORY = 'cristian-friedrichs/BeeGym';
const REPOSITORY = process.env.GITHUB_REPOSITORY || DEFAULT_REPOSITORY;
const [OWNER, REPO] = REPOSITORY.split('/');
const API_BASE = 'https://api.github.com';
const IS_DRY_RUN = process.argv.includes('--dry-run');
const USER_AGENT = 'BeeGym-Agent-Watchtower';
const WORKFLOW_LOOKBACK_HOURS = getNumberEnv('WATCHTOWER_WORKFLOW_LOOKBACK_HOURS', 24);
const PR_STALE_HOURS = getNumberEnv('WATCHTOWER_PR_STALE_HOURS', 72);
const BLOCKED_ISSUE_STALE_HOURS = getNumberEnv('WATCHTOWER_BLOCKED_ISSUE_STALE_HOURS', 72);
const NOW = new Date();

const LABEL_SETS = {
  workflowFailed: ['dept:cto', 'type:monitoring', 'risk:medium', 'autonomy:requires-ceo', 'agent:needs-review'],
  stalePullRequest: ['dept:cto', 'type:technical-debt', 'risk:low', 'autonomy:level-3-candidate', 'agent:ready'],
  staleBlockedIssue: ['dept:ceo', 'type:automation', 'risk:medium', 'autonomy:requires-ceo', 'agent:needs-review'],
  noEligibleBacklog: ['dept:ceo', 'type:automation', 'risk:low', 'autonomy:level-3-candidate', 'agent:ready'],
};

const SENSITIVE_WORDS = [
  'token',
  'secret',
  'authorization',
  'cookie',
  'set-cookie',
  'apikey',
  'api_key',
  'password',
  'service_role',
  'supabase_service_role',
];

main().catch((error) => {
  console.error('Watchtower failed before completing safely.');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

async function main() {
  assertRepository();

  const token = getGitHubToken();
  const client = createGitHubClient(token);

  const [workflowRuns, pullRequests, openIssues] = await Promise.all([
    client.paginate(`/repos/${OWNER}/${REPO}/actions/runs?per_page=30`),
    client.paginate(`/repos/${OWNER}/${REPO}/pulls?state=open&per_page=50`),
    client.paginate(`/repos/${OWNER}/${REPO}/issues?state=open&per_page=100`),
  ]);

  const issues = openIssues.filter((issue) => !issue.pull_request);
  const issueTitles = new Set(issues.map((issue) => String(issue.title || '')));
  const signals = buildSignals({ workflowRuns, pullRequests, issues, issueTitles });
  const actionableSignals = signals.filter((signal) => !signal.duplicate);

  printSummary({ workflowRuns, pullRequests, issues, signals, actionableSignals });

  if (IS_DRY_RUN) {
    printDryRun(actionableSignals);
    return;
  }

  if (actionableSignals.length === 0) {
    console.log('No new Watchtower issues needed.');
    return;
  }

  if (!token) {
    throw new Error('GITHUB_TOKEN is required to create Watchtower issues.');
  }

  for (const signal of actionableSignals) {
    const issue = await client.createIssue({
      title: signal.title,
      body: sanitizeBody(signal.body),
      labels: signal.labels,
    });

    console.log(`Created issue #${issue.number}: ${issue.html_url}`);
  }
}

function buildSignals({ workflowRuns, pullRequests, issues, issueTitles }) {
  const signals = [];
  const seenTitles = new Set(issueTitles);
  const addSignal = (signal) => {
    const duplicate = seenTitles.has(signal.title);
    signals.push({ ...signal, duplicate });
    seenTitles.add(signal.title);
  };
  const eligibleIssues = issues.filter(isEligibleAgentTask);
  const blockedIssues = issues.filter(hasLabel('agent:blocked'));
  const ceoIssues = issues.filter(requiresCeo);
  const syntheticFailureIssues = issues.filter((issue) => /synthetic health check failed/i.test(String(issue.title || '')));

  for (const run of workflowRuns) {
    if (!isFailedWorkflowRun(run)) continue;

    const workflowName = safeText(run.name || run.display_title || 'workflow');
    const branch = safeText(run.head_branch || 'unknown-branch');
    const title = `[Watchtower] Workflow failed: ${workflowName} on ${branch}`;

    addSignal({
      kind: 'workflowFailed',
      title,
      labels: LABEL_SETS.workflowFailed,
      body: [
        'The Watchtower detected a failed GitHub workflow run that needs human triage.',
        '',
        'Safe context:',
        `- Repository: ${REPOSITORY}`,
        `- Workflow: ${workflowName}`,
        `- Branch: ${branch}`,
        `- Event: ${safeText(run.event || '-')}`,
        `- Conclusion: ${safeText(run.conclusion || run.status || '-')}`,
        `- Run URL: ${safeUrl(run.html_url)}`,
        `- Updated at: ${safeText(run.updated_at || run.created_at || NOW.toISOString())}`,
        '',
        'Required handling:',
        '- [ ] Open the workflow run and identify whether the failure is build, test, synthetic, or infrastructure.',
        '- [ ] Do not paste secrets, headers, cookies, tokens, env values, or raw payloads into this issue.',
        '- [ ] Classify whether the fix is safe for agent execution or requires CEO approval.',
        '',
        'Automation boundary: Watchtower created this issue only. It did not run fixes, change code, deploy, or touch data.',
      ].join('\n'),
    });
  }

  for (const pullRequest of pullRequests) {
    if (!isStale(pullRequest.created_at, PR_STALE_HOURS)) continue;

    const number = Number(pullRequest.number || 0);
    const title = `[Watchtower] PR open for review: #${number}`;

    addSignal({
      kind: 'stalePullRequest',
      title,
      labels: LABEL_SETS.stalePullRequest,
      body: [
        'The Watchtower detected an open PR that has been waiting long enough to need operational follow-up.',
        '',
        'Safe context:',
        `- Repository: ${REPOSITORY}`,
        `- PR: #${number}`,
        `- Title: ${safeText(pullRequest.title || 'Untitled PR')}`,
        `- Author: ${safeText(pullRequest.user?.login || 'github-user')}`,
        `- Branch: ${safeText(pullRequest.head?.ref || '-')}`,
        `- Base: ${safeText(pullRequest.base?.ref || '-')}`,
        `- Created at: ${safeText(pullRequest.created_at || '-')}`,
        `- Updated at: ${safeText(pullRequest.updated_at || '-')}`,
        `- URL: ${safeUrl(pullRequest.html_url)}`,
        '',
        'Suggested low-risk agent scope:',
        '- [ ] Inspect checks and review status.',
        '- [ ] Summarize whether the PR needs rebase, review, merge, or closure.',
        '- [ ] Do not change application code unless a separate approved issue allows it.',
        '',
        'Automation boundary: Watchtower created this issue only. It did not approve, merge, close, or edit the PR.',
      ].join('\n'),
    });
  }

  for (const issue of blockedIssues) {
    if (!isStale(issue.updated_at || issue.created_at, BLOCKED_ISSUE_STALE_HOURS)) continue;

    const number = Number(issue.number || 0);
    const title = `[Watchtower] Blocked issue needs CEO decision: #${number}`;

    addSignal({
      kind: 'staleBlockedIssue',
      title,
      labels: LABEL_SETS.staleBlockedIssue,
      body: [
        'The Watchtower detected a blocked agent issue that has been waiting long enough to need CEO review.',
        '',
        'Safe context:',
        `- Repository: ${REPOSITORY}`,
        `- Blocked issue: #${number}`,
        `- Title: ${safeText(issue.title || 'Untitled issue')}`,
        `- Author: ${safeText(issue.user?.login || 'github-user')}`,
        `- Updated at: ${safeText(issue.updated_at || '-')}`,
        `- URL: ${safeUrl(issue.html_url)}`,
        '',
        'CEO decision checklist:',
        '- [ ] Decide whether to unblock, rescope, close, or split the issue.',
        '- [ ] Confirm whether any sensitive area is involved before authorizing work.',
        '- [ ] Keep secrets, real customer data, headers, tokens, and env values out of the issue.',
        '',
        'Automation boundary: Watchtower created this issue only. It did not edit the blocked issue.',
      ].join('\n'),
    });
  }

  if (eligibleIssues.length === 0) {
    const title = '[Watchtower] Replenish eligible agent backlog';

    addSignal({
      kind: 'noEligibleBacklog',
      title,
      labels: LABEL_SETS.noEligibleBacklog,
      body: [
        'The Watchtower did not find any open issue with all Level 3 eligibility labels.',
        '',
        'Required labels for eligible backlog:',
        '- `agent:ready`',
        '- `autonomy:level-3-candidate`',
        '- `risk:low`',
        '',
        'Safe backlog creation checklist:',
        '- [ ] Create small documentation, template, monitoring, or UI-copy tasks.',
        '- [ ] Include explicit allowed files and forbidden files.',
        '- [ ] Keep Supabase, migrations, auth, billing, dependencies, workflows, Vercel-sensitive config, secrets, real data, pricing, and client app flows out of scope unless separately approved.',
        '',
        'Automation boundary: Watchtower created this backlog request only. It did not execute agent work.',
      ].join('\n'),
    });
  }

  printOperationalCounts({
    eligibleIssues,
    blockedIssues,
    ceoIssues,
    syntheticFailureIssues,
  });

  return signals;
}

function printOperationalCounts({ eligibleIssues, blockedIssues, ceoIssues, syntheticFailureIssues }) {
  console.log('Operational issue counts');
  console.log(`- Eligible Level 3 backlog: ${eligibleIssues.length}`);
  console.log(`- Blocked agent issues: ${blockedIssues.length}`);
  console.log(`- CEO-required issues: ${ceoIssues.length}`);
  console.log(`- Synthetic failure issues: ${syntheticFailureIssues.length}`);
  console.log('');
}

function printSummary({ workflowRuns, pullRequests, issues, signals, actionableSignals }) {
  console.log('BeeGym Agent Watchtower');
  console.log(`Repository: ${REPOSITORY}`);
  console.log(`Mode: ${IS_DRY_RUN ? 'dry-run' : 'write issues'}`);
  console.log(`Workflow failure lookback: ${WORKFLOW_LOOKBACK_HOURS}h`);
  console.log(`Stale PR threshold: ${PR_STALE_HOURS}h`);
  console.log(`Blocked issue threshold: ${BLOCKED_ISSUE_STALE_HOURS}h`);
  console.log(`Workflow runs inspected: ${workflowRuns.length}`);
  console.log(`Open PRs inspected: ${pullRequests.length}`);
  console.log(`Open issues inspected: ${issues.length}`);
  console.log(`Signals detected: ${signals.length}`);
  console.log(`Duplicate signals skipped: ${signals.length - actionableSignals.length}`);
  console.log(`Issues to create: ${actionableSignals.length}`);
  console.log('');
}

function printDryRun(signals) {
  if (signals.length === 0) {
    console.log('Dry-run result: no new issues would be created.');
    return;
  }

  console.log('Dry-run result: these issues would be created.');
  console.log('');

  for (const signal of signals) {
    console.log(`- ${signal.title}`);
    console.log(`  Kind: ${signal.kind}`);
    console.log(`  Labels: ${signal.labels.join(', ')}`);
  }
}

function createGitHubClient(token) {
  async function request(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': USER_AGENT,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API request failed: ${options.method || 'GET'} ${path} -> ${response.status}`);
    }

    if (response.status === 204) return null;
    return response.json();
  }

  async function paginate(path) {
    const results = [];
    let nextPath = path;

    for (let page = 0; page < 5 && nextPath; page += 1) {
      const separator = nextPath.includes('?') ? '&' : '?';
      const pagePath = `${nextPath}${separator}page=${page + 1}`;
      const data = await request(pagePath);

      if (Array.isArray(data)) {
        results.push(...data);
        if (data.length === 0) break;
      } else if (Array.isArray(data?.workflow_runs)) {
        results.push(...data.workflow_runs);
        if (data.workflow_runs.length === 0) break;
      } else {
        break;
      }
    }

    return results;
  }

  async function createIssue({ title, body, labels }) {
    return request(`/repos/${OWNER}/${REPO}/issues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, labels }),
    });
  }

  return { paginate, createIssue };
}

function getGitHubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;

  try {
    return execFileSync('gh', ['auth', 'token'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

function isFailedWorkflowRun(run) {
  return run?.status === 'completed'
    && ['failure', 'timed_out', 'cancelled'].includes(String(run.conclusion || ''))
    && isRecent(run.updated_at || run.created_at, WORKFLOW_LOOKBACK_HOURS);
}

function isEligibleAgentTask(issue) {
  const labels = getLabelNames(issue);
  return labels.includes('agent:ready') && labels.includes('autonomy:level-3-candidate') && labels.includes('risk:low');
}

function requiresCeo(issue) {
  const labels = getLabelNames(issue);
  return labels.includes('autonomy:requires-ceo')
    || labels.includes('agent:needs-review')
    || labels.includes('risk:medium')
    || labels.includes('risk:high')
    || labels.includes('risk:critical');
}

function hasLabel(labelName) {
  return (issue) => getLabelNames(issue).includes(labelName);
}

function getLabelNames(issue) {
  return Array.isArray(issue?.labels)
    ? issue.labels.map((label) => String(label.name || '')).filter(Boolean)
    : [];
}

function isStale(dateValue, hours) {
  const timestamp = new Date(dateValue || 0).getTime();
  if (!Number.isFinite(timestamp)) return false;
  return NOW.getTime() - timestamp >= hours * 60 * 60 * 1000;
}

function isRecent(dateValue, hours) {
  const timestamp = new Date(dateValue || 0).getTime();
  if (!Number.isFinite(timestamp)) return false;
  return NOW.getTime() - timestamp <= hours * 60 * 60 * 1000;
}

function sanitizeBody(body) {
  return body
    .split('\n')
    .map((line) => {
      const lower = line.toLowerCase();
      return SENSITIVE_WORDS.some((word) => lower.includes(word)) && line.includes(':')
        ? line.replace(/: .+$/, ': [redacted]')
        : line;
    })
    .join('\n');
}

function safeText(value) {
  return String(value ?? '')
    .replace(/[\r\n]/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 180);
}

function safeUrl(value) {
  const url = String(value || '');
  return url.startsWith('https://github.com/') ? url : '-';
}

function assertRepository() {
  if (!OWNER || !REPO) {
    throw new Error('GITHUB_REPOSITORY must use owner/repo format.');
  }
}

function getNumberEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
