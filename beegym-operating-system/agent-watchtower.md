# Agent Watchtower

## Objetivo

O Agent Watchtower e o monitor agendado do BeeGym Operating System. Ele observa sinais operacionais no GitHub e cria backlog seguro para os agentes sem executar correcoes, deploys ou mudancas de produto.

## O que monitora

O Watchtower consulta somente dados do repositorio:

- workflow runs recentes.
- PRs abertos.
- issues com `agent:blocked`.
- issues com `agent:ready`.
- issues que exigem CEO.
- ausencia de backlog elegivel para Nivel 3 parcial.
- issues abertas que representem falha do synthetic health check.

## Quando cria issues

O Watchtower cria issues apenas quando encontra um sinal seguro e ainda nao existe issue aberta com o mesmo titulo.

### Workflow falhou

Labels:

- `dept:cto`
- `type:monitoring`
- `risk:medium`
- `autonomy:requires-ceo`
- `agent:needs-review`

Uso: registrar falha de GitHub Actions para triagem humana antes de qualquer correcao.

### PR aberto ha muito tempo

Labels:

- `dept:cto`
- `type:technical-debt`
- `risk:low`
- `autonomy:level-3-candidate`
- `agent:ready`

Uso: criar tarefa segura para revisar status, checks e proximo passo do PR.

### Issue bloqueada ha muito tempo

Labels:

- `dept:ceo`
- `type:automation`
- `risk:medium`
- `autonomy:requires-ceo`
- `agent:needs-review`

Uso: pedir decisao do CEO para desbloquear, dividir, reescopar ou fechar.

### Sem backlog elegivel

Labels:

- `dept:ceo`
- `type:automation`
- `risk:low`
- `autonomy:level-3-candidate`
- `agent:ready`

Uso: solicitar criacao de novas tarefas pequenas, seguras e claramente delimitadas.

## Como evita duplicatas

Antes de criar qualquer issue, o script lista issues abertas e compara o titulo exato. Se ja existir uma issue aberta com o mesmo titulo, o sinal e reportado como duplicado e nenhuma nova issue e criada.

## O que e automatico

Automatico:

- consultar dados publicos/permitidos do GitHub.
- classificar sinais operacionais.
- criar issues com contexto seguro e labels predefinidas.
- rodar a cada 6 horas pelo GitHub Actions.
- rodar manualmente via workflow dispatch.

Nao automatico:

- corrigir codigo.
- aprovar PR.
- fazer merge.
- fechar issue.
- editar labels existentes.
- executar deploy.
- tocar Supabase, migrations, auth, billing, dependencias, secrets, dados reais ou Vercel sensivel.

## O que exige CEO

Exige CEO quando a issue criada ou monitorada tiver:

- `autonomy:requires-ceo`.
- `agent:needs-review`.
- `risk:medium`, `risk:high` ou `risk:critical`.
- qualquer indicio de area sensivel, escopo ambiguo, falha de workflow, dado real ou configuracao de producao.

## Como rodar manualmente

Dry-run local:

```bash
node scripts/agent-watchtower.mjs --dry-run
```

Execucao real:

```bash
node scripts/agent-watchtower.mjs
```

Dispatcher read-only:

```bash
node scripts/agent-task-dispatcher.mjs
```

Workflow manual no GitHub:

```bash
gh workflow run agent-watchtower.yml
```

## Workflow agendado

O workflow `.github/workflows/agent-watchtower.yml` roda:

- manualmente por `workflow_dispatch`.
- automaticamente a cada 6 horas.

Permissoes:

- `contents: read`.
- `issues: write`.
- `actions: read`.
- `pull-requests: read`.

O job executa somente:

```bash
node scripts/agent-watchtower.mjs
```

## Como investigar falhas

Se o workflow falhar:

1. Abrir o run do GitHub Actions.
2. Verificar se a falha foi rede, permissao, API rate limit ou erro de script.
3. Confirmar que `GITHUB_TOKEN` esta disponivel no Actions.
4. Rodar `node scripts/agent-watchtower.mjs --dry-run` localmente com permissao de rede.
5. Nao copiar tokens, headers, cookies, payload bruto, secrets ou dados reais para issues.

## Limites de seguranca

O Watchtower cria apenas issues com contexto sanitizado. Ele nao le arquivos `.env`, nao usa secrets do repositorio fora do token padrao do GitHub Actions, nao altera codigo, nao executa PRs, nao toca banco e nao toma decisao por CEO.

Nivel 3 continua restrito a tarefas `risk:low`, `agent:ready` e `autonomy:level-3-candidate`, com escopo claro, arquivos permitidos e validacoes locais.
