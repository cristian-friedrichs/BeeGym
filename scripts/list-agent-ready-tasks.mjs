#!/usr/bin/env node

import { execFileSync } from 'node:child_process';

const REPOSITORY = 'cristian-friedrichs/BeeGym';
const REQUIRED_LABELS = ['agent:ready', 'autonomy:level-3-candidate', 'risk:low'];
const DEPARTMENT_PREFIX = 'dept:';
const TYPE_PREFIX = 'type:';

function runGh(args) {
  try {
    return execFileSync('gh', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    const stderr = String(error.stderr ?? '').trim();
    const stdout = String(error.stdout ?? '').trim();
    const message = [stderr, stdout].filter(Boolean).join('\n');

    console.error('Nao foi possivel listar tarefas elegiveis via GitHub CLI.');
    console.error('Confirme que o gh esta instalado, autenticado e com acesso ao repositorio.');
    if (message) {
      console.error('');
      console.error(message);
    }
    process.exit(typeof error.status === 'number' ? error.status : 1);
  }
}

const output = runGh([
  'issue',
  'list',
  '--repo',
  REPOSITORY,
  '--state',
  'open',
  '--json',
  'number,title,labels,url',
  '--limit',
  '100',
]);

let issues;

try {
  issues = JSON.parse(output);
} catch {
  console.error('O GitHub CLI retornou uma resposta inesperada ao listar issues.');
  process.exit(1);
}

if (!Array.isArray(issues)) {
  console.error('O GitHub CLI retornou uma lista de issues invalida.');
  process.exit(1);
}

const eligibleIssues = issues.filter((issue) => {
  const labels = Array.isArray(issue.labels)
    ? issue.labels.map((label) => label.name).filter(Boolean)
    : [];

  return REQUIRED_LABELS.every((requiredLabel) => labels.includes(requiredLabel));
});

if (eligibleIssues.length === 0) {
  console.log('Nenhuma tarefa elegivel para Nivel 3 parcial encontrada.');
  console.log(`Labels exigidas: ${REQUIRED_LABELS.join(', ')}`);
  process.exit(0);
}

console.log('Tarefas elegiveis para Nivel 3 parcial');
console.log(`Repositorio: ${REPOSITORY}`);
console.log(`Labels exigidas: ${REQUIRED_LABELS.join(', ')}`);
console.log('');

for (const issue of eligibleIssues) {
  const labels = Array.isArray(issue.labels)
    ? issue.labels.map((label) => label.name).filter(Boolean)
    : [];
  const department = labels.find((label) => label.startsWith(DEPARTMENT_PREFIX)) ?? 'dept:nao-definido';
  const type = labels.find((label) => label.startsWith(TYPE_PREFIX)) ?? 'type:nao-definido';

  console.log(`#${issue.number} ${issue.title}`);
  console.log(`Departamento: ${department}`);
  console.log(`Tipo: ${type}`);
  console.log(`Labels: ${labels.join(', ') || 'sem labels'}`);
  console.log(`URL: ${issue.url}`);
  console.log('');
}
