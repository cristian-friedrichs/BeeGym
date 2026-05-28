#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const REPOSITORY = 'cristian-friedrichs/BeeGym';
const LABELS_FILE = '.github/labels.yml';
const APPLY = process.argv.includes('--apply');

function parseLabelsYaml(content) {
  const labels = [];
  let current = null;

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line === 'labels:') continue;

    const nameMatch = line.match(/^- name: (.+)$/);
    if (nameMatch) {
      if (current) labels.push(current);
      current = { name: unquote(nameMatch[1]), color: '', description: '' };
      continue;
    }

    if (!current) continue;

    const colorMatch = line.match(/^color: (.+)$/);
    if (colorMatch) {
      current.color = unquote(colorMatch[1]);
      continue;
    }

    const descriptionMatch = line.match(/^description: (.+)$/);
    if (descriptionMatch) {
      current.description = unquote(descriptionMatch[1]);
    }
  }

  if (current) labels.push(current);
  return labels;
}

function unquote(value) {
  return value.trim().replace(/^["']|["']$/g, '');
}

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

    console.error('Nao foi possivel sincronizar labels via GitHub CLI.');
    console.error('Confirme que o gh esta instalado, autenticado e com acesso ao repositorio.');
    if (message) {
      console.error('');
      console.error(message);
    }
    process.exit(typeof error.status === 'number' ? error.status : 1);
  }
}

const desiredLabels = parseLabelsYaml(readFileSync(LABELS_FILE, 'utf8'));

if (desiredLabels.length === 0) {
  console.error(`Nenhuma label encontrada em ${LABELS_FILE}.`);
  process.exit(1);
}

const existingOutput = runGh([
  'label',
  'list',
  '--repo',
  REPOSITORY,
  '--limit',
  '200',
  '--json',
  'name,color,description',
]);

let existingLabels;

try {
  existingLabels = JSON.parse(existingOutput);
} catch {
  console.error('O GitHub CLI retornou uma resposta inesperada ao listar labels.');
  process.exit(1);
}

const existingByName = new Map(
  existingLabels.map((label) => [
    label.name,
    {
      color: String(label.color ?? '').toUpperCase(),
      description: String(label.description ?? ''),
    },
  ]),
);

const creates = [];
const updates = [];

for (const label of desiredLabels) {
  const existing = existingByName.get(label.name);
  const desiredColor = label.color.toUpperCase();

  if (!existing) {
    creates.push(label);
    continue;
  }

  if (existing.color !== desiredColor || existing.description !== label.description) {
    updates.push(label);
  }
}

console.log(`${APPLY ? 'Aplicando' : 'Dry-run'} labels operacionais BeeGym`);
console.log(`Repositorio: ${REPOSITORY}`);
console.log(`Arquivo: ${LABELS_FILE}`);
console.log('');
console.log(`Labels novas: ${creates.length}`);
for (const label of creates) {
  console.log(`- criar ${label.name}`);
}
console.log('');
console.log(`Labels para atualizar: ${updates.length}`);
for (const label of updates) {
  console.log(`- atualizar ${label.name}`);
}

if (!APPLY) {
  console.log('');
  console.log('Nenhuma alteracao aplicada. Use --apply para criar ou atualizar labels do escopo BeeGym OS.');
  process.exit(0);
}

for (const label of creates) {
  runGh([
    'label',
    'create',
    label.name,
    '--repo',
    REPOSITORY,
    '--color',
    label.color,
    '--description',
    label.description,
  ]);
}

for (const label of updates) {
  runGh([
    'label',
    'edit',
    label.name,
    '--repo',
    REPOSITORY,
    '--color',
    label.color,
    '--description',
    label.description,
  ]);
}

console.log('');
console.log('Sincronizacao concluida. Nenhuma label fora do escopo foi deletada ou renomeada.');
