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

O BeeGym opera atualmente com autonomia Nivel 2 para tarefas seguras, pequenas e bem delimitadas.

Neste estado, Codex pode criar branch dedicada, alterar arquivos dentro do escopo aprovado, validar, fazer commit, fazer push da branch, gerar relatorio final e preparar titulo e descricao de PR.

O PR ainda e aberto manualmente pelo CEO. O merge ainda e aprovado e executado manualmente pelo CEO.

A branch `main` esta protegida por ruleset. O fluxo exige PR antes de merge, bloqueia force push, bloqueia deletion e exige o check `build (18.x)` como obrigatorio antes de merge.

O Daily Synthetic Health Check roda automaticamente. Falhas do health check podem abrir issue automatica para rastrear investigacao.

O proximo nivel planejado e abertura automatica de PR pelo Codex, ainda sem merge automatico.

## Responsabilidades da automacao

GitHub Actions roda checks e smoke test basico quando houver push ou pull request para `main`. O CI e a primeira barreira automatica para lint, build e monitoramento sintetico local.

Codex pode criar branch dedicada, alterar arquivos dentro do escopo aprovado, validar, commitar e fazer push quando a autonomia autorizada permitir.

Agentes devem gerar relatorio final claro com branch, objetivo, arquivos alterados, validacoes, resultado, riscos, pendencias e proxima recomendacao.

O CEO aprova PR, merge, producao e qualquer risco alto antes de integracao ou execucao sensivel.

## Principios

- Incremental: automatizar primeiro tarefas pequenas, frequentes e verificaveis.
- Auditavel: cada acao deve deixar trilha em branch, commit, push, PR ou relatorio.
- Reversivel: mudancas devem ser pequenas o suficiente para revert facil.
- Escopado: cada execucao deve declarar arquivos permitidos e proibidos.
- Seguro: secrets, dados reais, Supabase, billing, producao e deploy exigem aprovacao explicita.
- Humano no risco: CEO decide quando houver impacto em clientes, receita, dados, oferta publica ou producao.

## O que esta camada permite

- Documentacao operacional com branch, commit e push.
- Melhorias em testes e scripts internos de baixo risco.
- Execucoes de validacao local e leitura de resultados.
- Preparacao de PR com titulo e descricao, sem abrir automaticamente quando isso nao foi autorizado.
- Relatorios finais padronizados para reduzir acompanhamento manual.

## O que permanece sob aprovacao do CEO

- Merge em `main`.
- Deploy, rollback ou qualquer acao de producao.
- Supabase, migrations, RLS, policies, schema, RPCs, CLI ou dados reais.
- Billing, pagamentos, webhooks e integracoes externas sensiveis.
- Auth, seguranca, secrets e variaveis de ambiente.
- Novas dependencias, alteracoes em `package.json` ou lockfiles.
- Publicacao externa, campanhas, pricing ou oferta publica.

## Resultado esperado

A automacao operacional deve fazer o trabalho repetitivo andar sem o CEO precisar copiar prompts, acompanhar checks manualmente ou pedir relatorios avulsos. O CEO deve receber uma sintese final suficiente para decidir PR, merge, risco e proximo passo.

## Main Protection Validation

This repository uses a protected main branch ruleset requiring pull requests and the `build (18.x)` status check before merging.

## GitHub CLI Automation Check

The local environment has GitHub CLI authenticated for repository operations. This section validates PR automation capability.
