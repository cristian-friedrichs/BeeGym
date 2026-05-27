# Automation Layer

## Objetivo

A camada de automacao operacional do BeeGym define como agentes, GitHub Actions e revisao humana trabalham juntos para reduzir trabalho manual do CEO sem perder controle sobre risco, qualidade e producao.

Esta camada nao substitui decisao humana em pontos sensiveis. Ela transforma tarefas repetitivas e de baixo risco em execucoes rastreaveis, pequenas, auditaveis e reversiveis.

## Modelo operacional

O fluxo esperado para tarefas futuras e:

```text
CEO define objetivo e nivel de autonomia
-> Codex confirma escopo, risco e branch
-> Codex le contexto necessario
-> Codex altera apenas arquivos aprovados
-> Codex roda validacoes proporcionais
-> Codex commita quando autorizado
-> Codex faz push quando autorizado
-> GitHub Actions roda checks e smoke
-> Codex entrega relatorio final
-> CEO aprova PR, merge, producao e riscos altos
```

## Current Automation State

O BeeGym opera atualmente com autonomia Nivel 3 parcial para tarefas de baixo risco, seguras, pequenas e bem delimitadas.

Neste estado, Codex pode criar branch dedicada, alterar arquivos dentro do escopo aprovado, validar, fazer commit, fazer push da branch, abrir PR via GitHub CLI, acompanhar checks, fazer merge via GitHub CLI quando as condicoes de seguranca forem satisfeitas, sincronizar a `main` local e gerar relatorio final.

O CEO nao precisa abrir PR ou fazer merge manualmente quando a tarefa for de baixo risco, o escopo estiver restrito, os checks estiverem verdes e nenhuma area sensivel estiver envolvida.

A branch `main` esta protegida por ruleset. O fluxo exige PR antes de merge, bloqueia force push, bloqueia deletion e exige o check `build (18.x)` como obrigatorio antes de merge.

O Daily Synthetic Health Check roda automaticamente. Falhas do health check podem abrir issue automatica para rastrear investigacao.

Mudancas sensiveis continuam exigindo parada obrigatoria e aprovacao explicita do CEO antes de PR, merge, deploy ou qualquer acao operacional.

## Responsabilidades da automacao

GitHub Actions roda checks e smoke test basico quando houver push ou pull request para `main`. O CI e a primeira barreira automatica para lint, build e monitoramento sintetico local.

Codex pode criar branch dedicada, alterar arquivos dentro do escopo aprovado, validar, commitar, fazer push, abrir PR, acompanhar checks, fazer merge e sincronizar `main` quando a autonomia Nivel 3 parcial permitir.

Agentes devem gerar relatorio final claro com branch, objetivo, arquivos alterados, validacoes, resultado, riscos, pendencias e proxima recomendacao.

O CEO aprova producao, Supabase, migrations, auth, billing, dados reais, dependencias, secrets, mudancas estruturais, publicacao externa, pricing, rulesets e qualquer risco alto antes de integracao ou execucao sensivel.

## Principios

- Incremental: automatizar primeiro tarefas pequenas, frequentes e verificaveis.
- Auditavel: cada acao deve deixar trilha em branch, commit, push, PR ou relatorio.
- Reversivel: mudancas devem ser pequenas o suficiente para revert facil.
- Escopado: cada execucao deve declarar arquivos permitidos e proibidos.
- Seguro: secrets, dados reais, Supabase, billing, producao e deploy exigem aprovacao explicita.
- Humano no risco: CEO decide quando houver impacto em clientes, receita, dados, oferta publica ou producao.

## O que esta camada permite

- Documentacao operacional com branch, commit e push.
- Abertura de PR via GitHub CLI para tarefas de baixo risco.
- Acompanhamento de checks via GitHub CLI.
- Merge via GitHub CLI quando o escopo e baixo risco, restrito e com checks verdes.
- Sincronizacao da `main` local apos merge.
- Melhorias em testes e scripts internos de baixo risco.
- Execucoes de validacao local e leitura de resultados.
- Relatorios finais padronizados para reduzir acompanhamento manual.

## O que permanece sob aprovacao do CEO

- Deploy, rollback ou qualquer acao de producao.
- Supabase, migrations, RLS, policies, schema, RPCs, CLI ou dados reais.
- Billing, pagamentos, webhooks e integracoes externas sensiveis.
- Auth, seguranca, secrets e variaveis de ambiente.
- Novas dependencias, alteracoes em `package.json` ou lockfiles.
- Publicacao externa, campanhas, pricing ou oferta publica.
- Workflows criticos, rulesets, protecao da `main` ou bypass de checks.
- Qualquer check falhando, conflito de merge, escopo expandido ou duvida de risco.

## Resultado esperado

A automacao operacional deve fazer o trabalho repetitivo andar sem o CEO precisar copiar prompts, acompanhar checks manualmente ou pedir relatorios avulsos. O CEO deve receber uma sintese final suficiente para decidir PR, merge, risco e proximo passo.

## Main Protection Validation

This repository uses a protected main branch ruleset requiring pull requests and the `build (18.x)` status check before merging.

## GitHub CLI Automation Check

The local environment has GitHub CLI authenticated for repository operations. This section validates PR automation capability.

## Level 3 Partial Autonomy: Operationally Validated

Autonomia Nivel 3 parcial esta ativa para tarefas de baixo risco. O fluxo foi validado com o PR real #23, usando GitHub CLI instalado e autenticado no ambiente local.

Evidencia operacional:

- PR #23 validou abertura de PR, acompanhamento de checks, merge via `gh`, delecao da branch remota e sincronizacao da `main` local.
- Merge commit: `d05889e6503153694b32b372aa01c8c722bc4884`.
- Check obrigatorio `build (18.x)`: success.
- Vercel: success.

O agente pode abrir PR via `gh`, acompanhar checks e fazer merge via `gh` quando todas as condicoes abaixo forem verdadeiras:

- A tarefa e de baixo risco.
- O escopo esta restrito aos arquivos aprovados.
- `build (18.x)` passou.
- Vercel passou, quando aplicavel.
- Nao ha conflito.
- Nao ha mudanca sensivel.

Apos merge, o agente deve sincronizar a `main` local e entregar relatorio final com evidencias, arquivos alterados, checks, merge commit, status da branch remota e riscos.

Merge automatico continua proibido para mudancas sensiveis, qualquer check falhando, conflito de merge, escopo expandido ou duvida de risco.
