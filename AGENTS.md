# BeeGym Agent Guidelines

## Contexto

BeeGym e um SaaS de gestao fitness para personal trainers, academias, studios, CrossFit, Pilates e Yoga. O produto inclui area publica de marketing, app autenticado para operacao das unidades, painel administrativo, billing, webhooks, automacoes, suporte e recursos de IA para treinos.

Este arquivo e o contrato raiz para agentes trabalhando neste repositorio.

## Stack atual

- Next.js App Router
- React
- TypeScript
- Supabase
- Tailwind CSS
- Vitest
- GitHub Actions
- Vercel como alvo operacional esperado
- Testes sinteticos em `testsprite_tests`

## Regras obrigatorias

- Nunca trabalhar diretamente na branch `main`. Crie uma branch dedicada antes de qualquer alteracao.
- Nunca ler, imprimir, copiar, resumir ou expor secrets. Arquivos `.env`, `.env.local` e equivalentes devem ser tratados como sensiveis.
- Nao tocar em Supabase sem solicitacao explicita. Isso inclui schema, dados, configuracao, RLS, policies, RPCs e comandos da CLI.
- Nao tocar em Vercel, deploy, dominios, variaveis de ambiente remotas ou configuracoes de producao sem solicitacao explicita.
- Nao alterar `package.json`, lockfiles ou dependencias sem aprovacao explicita.
- Nao alterar migrations sem aprovacao explicita.
- Manter PRs pequenos, revisaveis e com escopo claro.
- Documentar os arquivos alterados e o motivo da alteracao ao finalizar uma tarefa.
- Diferenciar a estrutura BeeGym Operating System da pasta `.agent` existente. A pasta `.agent` contem artefatos legados/ferramentais; a nova estrutura `beegym-operating-system`, `ai-agents`, `departments` e `skills` define a governanca operacional BeeGym OS.

## Validacoes conhecidas

Quando aplicavel, use estes comandos:

```bash
npm run lint
npm run build
npm run typecheck
npm run test
```

Se algum comando falhar por configuracao existente, reporte a falha e nao tente corrigir sem autorizacao.

## Escopo e seguranca

Antes de qualquer mudanca, identifique se a tarefa altera codigo de aplicacao, runtime, banco, deploy, secrets, dependencias ou fluxo de usuario. Quando houver risco operacional, peca aprovacao antes de executar.
