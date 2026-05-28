#!/usr/bin/env node

import { execFileSync } from 'node:child_process';

const DEFAULT_REPOSITORY = 'cristian-friedrichs/BeeGym';
const REPOSITORY = process.env.GITHUB_REPOSITORY || DEFAULT_REPOSITORY;
const [OWNER, REPO] = REPOSITORY.split('/');
const API_BASE = 'https://api.github.com';
const USER_AGENT = 'BeeGym-Agent-Task-Dispatcher';
const ELIGIBLE_LABELS = ['agent:ready', 'autonomy:level-3-candidate', 'risk:low'];
const CEO_LABELS = ['autonomy:requires-ceo', 'agent:needs-review', 'risk:medium', 'risk:high', 'risk:critical'];

main().catch((error) => {
  console.error('Dispatcher failed before completing read-only summary.');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

async function main() {
  assertRepository();

  const token = getGitHubToken();
  const issues = await listOpenIssues(token);
  const agentIssues = issues.filter((issue) => hasAnyAgentLabel(issue));
  const eligibleIssues = agentIssues.filter(isEligibleAgentTask);
  const ceoIssues = agentIssues.filter(requiresCeo);
  const blockedIssues = agentIssues.filter(hasLabel('agent:blocked'));
  const byDepartment = groupByDepartment(agentIssues);

  console.log('BeeGym Agent Task Dispatcher');
  console.log(`Repository: ${REPOSITORY}`);
  console.log('Mode: read-only');
  console.log(`Open agent issues: ${agentIssues.length}`);
  console.log(`Eligible Level 3 tasks: ${eligibleIssues.length}`);
  console.log(`CEO-required issues: ${ceoIssues.length}`);
  console.log(`Blocked issues: ${blockedIssues.length}`);
  console.log('');

  printGroupedDepartments(byDepartment);
  printSection('Eligible Level 3 tasks', eligibleIssues, formatEligibleIssue);
  printSection('CEO-required issues', ceoIssues, formatIssue);
  printSection('Blocked issues', blockedIssues, formatIssue);
  printRecommendations({ eligibleIssues, ceoIssues, blockedIssues });
}

async function listOpenIssues(token) {
  const results = [];

  for (let page = 1; page <= 5; page += 1) {
    const response = await fetch(`${API_BASE}/repos/${OWNER}/${REPO}/issues?state=open&per_page=100&page=${page}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': USER_AGENT,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API request failed: GET issues -> ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) break;
    results.push(...data.filter((issue) => !issue.pull_request));
  }

  return results;
}

function printGroupedDepartments(grouped) {
  console.log('By department');

  if (grouped.size === 0) {
    console.log('- No open agent issues found.');
    console.log('');
    return;
  }

  for (const [department, issues] of [...grouped.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    const eligible = issues.filter(isEligibleAgentTask).length;
    const ceo = issues.filter(requiresCeo).length;
    const blocked = issues.filter(hasLabel('agent:blocked')).length;
    console.log(`- ${department}: ${issues.length} total, ${eligible} eligible, ${ceo} CEO-required, ${blocked} blocked`);
  }

  console.log('');
}

function printSection(title, issues, formatter) {
  console.log(title);

  if (issues.length === 0) {
    console.log('- none');
    console.log('');
    return;
  }

  for (const issue of issues.slice(0, 10)) {
    console.log(formatter(issue));
  }

  if (issues.length > 10) {
    console.log(`- ...and ${issues.length - 10} more`);
  }

  console.log('');
}

function printRecommendations({ eligibleIssues, ceoIssues, blockedIssues }) {
  console.log('Recommended next action');

  if (eligibleIssues.length > 0) {
    const top = eligibleIssues[0];
    console.log(`- Execute next low-risk task: #${top.number} ${top.title}`);
    console.log('- Confirm allowed files, create a dedicated branch, validate locally, then open PR.');
    return;
  }

  if (blockedIssues.length > 0) {
    const top = blockedIssues[0];
    console.log(`- Resolve blocked task first: #${top.number} ${top.title}`);
    console.log('- CEO should decide whether to unblock, split, rescope, or close it.');
    return;
  }

  if (ceoIssues.length > 0) {
    const top = ceoIssues[0];
    console.log(`- Review CEO-required issue: #${top.number} ${top.title}`);
    console.log('- Do not execute until risk and scope are explicitly approved.');
    return;
  }

  console.log('- No agent backlog is ready. Create small low-risk issues with clear allowed files and validations.');
}

function formatEligibleIssue(issue) {
  const labels = getLabelNames(issue);
  const department = findLabel(labels, 'dept:');
  const type = findLabel(labels, 'type:');
  return `- #${issue.number} ${issue.title} | ${department} | ${type} | ${issue.html_url}`;
}

function formatIssue(issue) {
  const labels = getLabelNames(issue);
  const department = findLabel(labels, 'dept:');
  const risk = findLabel(labels, 'risk:');
  return `- #${issue.number} ${issue.title} | ${department} | ${risk} | ${issue.html_url}`;
}

function groupByDepartment(issues) {
  const grouped = new Map();

  for (const issue of issues) {
    const department = findLabel(getLabelNames(issue), 'dept:');
    if (!grouped.has(department)) grouped.set(department, []);
    grouped.get(department).push(issue);
  }

  return grouped;
}

function isEligibleAgentTask(issue) {
  const labels = getLabelNames(issue);
  return ELIGIBLE_LABELS.every((label) => labels.includes(label));
}

function requiresCeo(issue) {
  const labels = getLabelNames(issue);
  return CEO_LABELS.some((label) => labels.includes(label));
}

function hasAnyAgentLabel(issue) {
  const labels = getLabelNames(issue);
  return labels.some((label) => label.startsWith('agent:') || label.startsWith('autonomy:'));
}

function hasLabel(labelName) {
  return (issue) => getLabelNames(issue).includes(labelName);
}

function findLabel(labels, prefix) {
  return labels.find((label) => label.startsWith(prefix)) || `${prefix}not-set`;
}

function getLabelNames(issue) {
  return Array.isArray(issue?.labels)
    ? issue.labels.map((label) => String(label.name || '')).filter(Boolean)
    : [];
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

function assertRepository() {
  if (!OWNER || !REPO) {
    throw new Error('GITHUB_REPOSITORY must use owner/repo format.');
  }
}
