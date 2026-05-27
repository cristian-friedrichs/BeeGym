# Codex Autonomous Task Template

Use este template para pedir tarefas futuras com autonomia Nivel 3 parcial quando a tarefa for de baixo risco.

```markdown
Voce e o Codex Agent do BeeGym.

## Objetivo

Descreva o resultado esperado da tarefa.

## Contexto

Explique o estado atual, arquivos relevantes, decisoes anteriores e qualquer restricao operacional.

## Autonomia permitida

Nivel 3 parcial - PR e merge via GitHub CLI para tarefa de baixo risco.

Autonomia permitida para baixo risco:

- Pode confirmar que esta em `main` atualizada.
- Pode criar branch dedicada.
- Pode ler arquivos de contexto nao sensiveis.
- Pode alterar apenas arquivos dentro do escopo.
- Pode validar.
- Pode fazer commit se a validacao passar.
- Pode fazer push da branch.
- Pode abrir PR via `gh`.
- Pode acompanhar checks via `gh`.
- Pode fazer merge via `gh` se checks passarem, nao houver conflito e nenhuma area sensivel estiver envolvida.
- Pode deletar branch remota, se apropriado.
- Pode sincronizar `main` local apos merge.
- Pode entregar relatorio final.

Comandos esperados:

- `gh pr create`
- `gh pr view`
- `gh pr checks`
- `gh pr merge`
- `git fetch origin`
- `git pull origin main`

Limites:

- Nao fazer deploy sensivel.
- Nao alterar Supabase/migrations.
- Nao alterar auth.
- Nao alterar dados reais.
- Nao alterar billing/pagamentos.
- Nao mexer fora do escopo.
- Nao tocar em Vercel sensivel, secrets, `.env`, producao, dependencias, `package.json`, `package-lock.json` ou workflows criticos.

## Branch

Criar a branch:

`nome-da-branch`

## Arquivos permitidos

- `caminho/do/arquivo-1`
- `caminho/do/arquivo-2`

## Arquivos proibidos

- `src`
- `supabase`
- `supabase/migrations`
- `migrations`
- Vercel e configuracoes de deploy sensivel
- `.github/workflows`
- `.env`
- `.env.local`
- `package.json`
- `package-lock.json`
- `testsprite_tests`
- `departments`
- `skills`
- Qualquer arquivo fora do escopo aprovado

## Validacoes obrigatorias

1. Confirmar que somente os arquivos permitidos foram alterados.
2. Confirmar que nao houve alteracao em:
   - `src`
   - `supabase`
   - `migrations`
   - Vercel sensivel
   - `.env`
   - `package.json`
   - `package-lock.json`
   - `.github/workflows`
   - `testsprite_tests`
   - `departments`
   - `skills`
3. Rodar validacoes proporcionais ao escopo.
4. Para tarefas apenas de documentacao, nao rodar build local.
5. Acompanhar `build (18.x)` no PR quando aplicavel.
6. Acompanhar Vercel no PR quando aplicavel.
7. Mostrar `git status`.

## Quando parar obrigatoriamente

Pare e peca aprovacao se:

- Um check falhar.
- Vercel falhar.
- Houver conflito.
- Arquivo sensivel aparecer no diff.
- O escopo expandir.
- A correcao exigir arquivo fora do escopo.
- A tarefa precisar Supabase, migrations, auth, billing, dados reais, package files ou workflows criticos.
- A tarefa precisar deploy sensivel.
- Houver risco de impacto em producao ou clientes.
- Houver duvida de risco.

## Commit

Se tudo passar, fazer commit com a mensagem:

`tipo: mensagem do commit`

## Push e PR

Depois do commit:

1. Fazer push da branch.
2. Abrir PR via `gh pr create`.
3. Acompanhar checks via `gh pr view` ou `gh pr checks`.
4. Fazer merge via `gh pr merge` somente se todas as condicoes de Nivel 3 parcial forem satisfeitas.
5. Deletar branch remota, se apropriado.
6. Trocar para `main`.
7. Fazer `git fetch origin`.
8. Fazer `git pull origin main`.
9. Confirmar `main` sincronizada e `git status` limpo.

## Formato do relatorio final

Entregar:

1. Branch criada
2. Hash do commit
3. PR URL
4. Checks status
5. Vercel status, quando aplicavel
6. Merge realizado: sim/nao
7. Merge commit
8. Branch remota deletada: sim/nao
9. Main sincronizada: sim/nao
10. Arquivos alterados
11. Validacoes executadas
12. Riscos encontrados
13. Acao do CEO necessaria: sim/nao
14. Se parou, motivo da parada
```
