# Autonomous Work Cycle

## Objetivo

Este ciclo cria a primeira operacao real dos agentes BeeGym baseada em GitHub Issues, labels operacionais, templates e scripts locais seguros. Ele transforma sinais operacionais em tarefas rastreaveis sem depender de LLM externa, secrets, Supabase, billing, auth ou dados reais.

## Como tarefas entram

Tarefas entram como GitHub Issues usando um dos templates em `.github/ISSUE_TEMPLATE/`:

- `agent-task.yml` para tarefas operacionais dos agentes.
- `agent-bug.yml` para bugs e regressoes.
- `agent-improvement.yml` para melhorias.
- `ceo-approval.yml` para decisoes que exigem CEO.

Cada issue deve declarar departamento, tipo, risco, escopo, arquivos permitidos, arquivos proibidos, validacoes e criterios de aceite quando aplicavel.

## Labels operacionais

As labels ficam definidas em `.github/labels.yml` e sao sincronizadas opcionalmente por `scripts/sync-agent-labels.mjs`.

Departamentos:

- `dept:ceo`
- `dept:cto`
- `dept:support`
- `dept:marketing`
- `dept:growth`
- `dept:product`
- `dept:finance`

Tipos:

- `type:bug`
- `type:task`
- `type:ui`
- `type:docs`
- `type:monitoring`
- `type:automation`
- `type:security-review`
- `type:technical-debt`

Risco:

- `risk:low`
- `risk:medium`
- `risk:high`
- `risk:critical`

Autonomia:

- `autonomy:level-2`
- `autonomy:level-3-candidate`
- `autonomy:requires-ceo`

Status:

- `agent:ready`
- `agent:in-progress`
- `agent:blocked`
- `agent:done`
- `agent:needs-review`

## Como labels determinam autonomia

Uma tarefa so pode ser candidata a Nivel 3 parcial quando tiver todas estas labels:

- `risk:low`
- `agent:ready`
- `autonomy:level-3-candidate`

Essa combinacao nao autoriza execucao cega. Ela apenas permite que o agente liste, avalie e execute a tarefa se todos os gates de seguranca tambem passarem.

## Gates obrigatorios para execucao automatica

Tarefas so podem ser executadas automaticamente se:

- Tiverem `risk:low`.
- Tiverem `agent:ready`.
- Tiverem `autonomy:level-3-candidate`.
- Nao envolverem arquivos proibidos.
- Nao envolverem Supabase, migrations, RLS, policies, schema, RPCs ou comandos da CLI.
- Nao envolverem auth, billing, pagamentos, dados reais ou secrets.
- Nao alterarem `.env`, `.env.local`, dependencias, `package.json`, lockfiles, workflows criticos, Vercel sensivel, deploy, pricing ou oferta publica.
- Tiverem escopo e criterios de aceite claros.
- Puderem ser validadas por comandos locais e checks do PR.

Se qualquer gate falhar, o agente deve parar, marcar o bloqueio no relatorio e pedir decisao do CEO quando necessario.

## Como o agente escolhe tarefas elegiveis

Use:

```bash
node scripts/list-agent-ready-tasks.mjs
```

O script lista issues abertas que tenham `agent:ready`, `autonomy:level-3-candidate` e `risk:low`. Ele imprime numero, titulo, labels, URL, departamento e tipo.

O script e somente leitura:

- Nao altera issues.
- Nao cria branch.
- Nao faz commit.
- Nao faz merge.
- Nao escreve no GitHub.
- Nao usa token manual.

## Watchtower e dispatcher

O Watchtower agendado cria backlog operacional a partir de sinais seguros do GitHub:

- workflow falhou.
- PR aberto ha muito tempo.
- issue `agent:blocked` parada ha muito tempo.
- ausencia de backlog elegivel para Nivel 3 parcial.

Use em modo local sem escrita:

```bash
node scripts/agent-watchtower.mjs --dry-run
```

O workflow `.github/workflows/agent-watchtower.yml` roda a cada 6 horas e tambem pode ser disparado manualmente. Ele executa `node scripts/agent-watchtower.mjs` e pode criar apenas issues com contexto seguro e labels predefinidas.

O dispatcher e somente leitura:

```bash
node scripts/agent-task-dispatcher.mjs
```

Ele lista tarefas elegiveis, tarefas que exigem CEO, bloqueadas, agrupamento por departamento e recomendacao de proxima execucao. Ele nao cria issues, nao cria PRs, nao altera GitHub e nao executa correcoes.

Fluxo operacional:

1. Watchtower cria backlog quando encontra sinais seguros.
2. Dispatcher recomenda a proxima execucao.
3. Agentes executam apenas issues elegiveis de Nivel 3 parcial.
4. CEO aprova ou decide issues com `autonomy:requires-ceo`, `agent:needs-review` ou risco medio/alto/critico.

Nivel 3 continua restrito a baixo risco, escopo claro, arquivos permitidos e validacoes verdes. Watchtower alimenta o backlog; ele nao amplia autonomia de execucao.

## Permissoes GitHub no Codex

No ambiente Codex, operacoes que acessam GitHub ou rede externa devem ser executadas com permissao escalada quando a sandbox bloquear rede.

Exigem permissao escalada nesta rotina:

- `gh auth status`
- `gh issue create`, `gh issue list`, `gh issue view` e `gh issue edit`
- `gh pr create`, `gh pr checks` e `gh pr merge`
- `git fetch`, `git pull` e `git push`

A permissao escalada nao autoriza expor tokens, ler secrets, alterar configuracao remota sensivel ou ampliar escopo. Ela apenas permite que comandos GitHub previamente aprovados acessem a rede. Se um comando mostrar token mascarado, o valor deve permanecer mascarado e nao deve ser copiado para docs, issues ou PRs.

## O que pode ser executado automaticamente

Com autorizacao de Nivel 3 parcial e gates satisfeitos, o agente pode:

- Sincronizar `main`.
- Criar branch dedicada.
- Alterar apenas arquivos permitidos na issue.
- Rodar validacoes proporcionais.
- Fazer commit e push.
- Abrir PR via GitHub CLI.
- Acompanhar checks.
- Fazer merge se `build (18.x)` e Vercel passarem, nao houver conflito e nenhuma area sensivel tiver sido tocada.
- Deletar branch remota quando apropriado.
- Sincronizar `main` apos merge.
- Reportar resultado completo.

## Aprendizados do primeiro ciclo real

O primeiro ciclo real confirmou que o modelo deve permanecer granular:

- Uma issue por tarefa, com branch dedicada e PR proprio.
- Nenhuma execucao direta na `main`, mesmo para documentacao.
- Validacoes locais antes de push quando a issue exigir.
- Merge apenas depois de `build (18.x)` e Vercel passarem no PR.
- Sincronizacao da `main` apos cada merge antes da proxima tarefa.
- Relatorio final com branch, commit, PR, merge commit, validacoes e confirmacao de seguranca.

O ciclo tambem confirmou que permissao escalada para GitHub e rede nao muda o escopo aprovado. Ela serve somente para consultar issues, abrir PRs, acompanhar checks, fazer push ou merge quando a sandbox bloquear acesso externo.

Quando varias tarefas estiverem elegiveis, prefira executar primeiro as de menor risco operacional, como documentacao, templates e copy de UI sem mudanca de comportamento. Tarefas que toquem runtime, dados, integracoes, Supabase, Vercel sensivel, auth, billing, dependencias ou workflows criticos continuam exigindo aprovacao explicita antes de qualquer mudanca.

## O que exige CEO

Exige CEO antes da execucao:

- `risk:medium`, `risk:high` ou `risk:critical`.
- `autonomy:requires-ceo`.
- Qualquer mudanca em Supabase, migrations, auth, billing, dados reais, secrets, dependencias, workflows criticos, Vercel sensivel, deploy, pricing ou oferta publica.
- Conflito de merge.
- Check falhando.
- Escopo ambiguo.
- Criterios de aceite ausentes.
- Qualquer duvida de risco.

## Como reportar resultado

O relatorio final deve incluir:

- Branch.
- Commit.
- PR URL.
- Status de `build (18.x)`.
- Status Vercel quando aplicavel.
- Merge realizado ou motivo da parada.
- Merge commit quando houver.
- Main sincronizada.
- Arquivos alterados.
- Validacoes executadas.
- Labels usadas.
- Issues relacionadas.
- Confirmacao de seguranca.
- Proxima recomendacao.

## Como parar em caso de falha

Pare imediatamente quando:

- `gh` falhar tambem com permissao adequada.
- Uma validacao local falhar.
- `build (18.x)` falhar.
- Vercel falhar.
- Houver conflito.
- Aparecer arquivo proibido no diff.
- A tarefa pedir secret, dado real, Supabase, auth, billing, dependencia ou workflow critico.

Ao parar, reporte o comando, a falha e o proximo passo recomendado. Nao corrija fora do escopo aprovado.

## PR, checks e Vercel

Todo trabalho de Nivel 3 parcial deve entrar por PR. Antes de merge:

- Confirmar que o diff contem apenas arquivos permitidos.
- Confirmar que `build (18.x)` passou.
- Confirmar que Vercel passou quando houver check de preview/deploy no PR.
- Confirmar que nao ha conflito.
- Confirmar que a branch nao toca areas sensiveis.

Se algum check ficar pendente por tempo excessivo, o agente deve reportar status e aguardar nova instrucao.

## Como sincronizar main

Antes de iniciar:

```bash
git fetch origin
git pull origin main
git status
```

Depois de mergear:

```bash
git switch main
git fetch origin
git pull origin main
git status
```

Nunca trabalhar diretamente na `main`.

## Labels

Para ver o plano de sincronizacao de labels:

```bash
node scripts/sync-agent-labels.mjs
```

Para aplicar labels faltantes ou atualizar descricao/cor das labels BeeGym OS:

```bash
node scripts/sync-agent-labels.mjs --apply
```

O script nao deleta labels, nao renomeia labels e nao mexe fora do escopo definido em `.github/labels.yml`.

## Areas sensiveis

O ciclo deve evitar:

- Supabase.
- Migrations.
- `.env` e secrets.
- Auth.
- Billing e pagamentos.
- Dados reais.
- Vercel sensivel e deploy.
- Dependencias.
- `package.json` e lockfiles.
- Workflows criticos.
- Produto cliente `/app`, salvo bug claro, baixo risco e aprovado.
- Pricing e oferta publica.

## Regra central

GitHub Issues organizam o trabalho. Labels classificam risco e autonomia. Scripts locais apenas descobrem tarefas ou sincronizam labels com confirmacao explicita. Execucao automatica continua limitada a baixo risco, escopo claro e checks verdes.
