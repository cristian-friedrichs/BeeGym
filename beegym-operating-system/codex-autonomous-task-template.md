# Codex Autonomous Task Template

Use este template para pedir tarefas futuras com autonomia Nivel 2.

```markdown
Voce e o Codex Agent do BeeGym.

## Objetivo

Descreva o resultado esperado da tarefa.

## Contexto

Explique o estado atual, arquivos relevantes, decisoes anteriores e qualquer restricao operacional.

## Autonomia permitida

Nivel 2 - Execucao com commit e push.

Autonomia permitida:

- Pode confirmar que esta em `main` atualizada.
- Pode criar branch dedicada.
- Ler arquivos de contexto nao sensiveis.
- Pode alterar apenas arquivos dentro do escopo.
- Pode validar.
- Pode fazer commit se a validacao passar.
- Pode fazer push da branch.
- Pode gerar relatorio final.
- Pode gerar titulo e descricao do PR.

Limites:

- Nao abrir PR automaticamente ainda.
- Nao fazer merge.
- Nao fazer deploy.
- Nao alterar Supabase/migrations.
- Nao alterar dados reais.
- Nao alterar billing/pagamentos.
- Nao mexer fora do escopo.
- Nao tocar em Vercel, secrets, `.env`, producao, dependencias, `package.json` ou lockfiles.

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
- Vercel e configuracoes de deploy
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
   - Vercel
   - `.env`
   - `package.json`
   - `package-lock.json`
   - `.github/workflows`
   - `testsprite_tests`
   - `departments`
   - `skills`
3. Para tarefas apenas de documentacao, nao rodar build local.
4. Mostrar `git status`.

## Limites

- Nao ler, imprimir, copiar ou resumir secrets.
- Nao usar dados reais.
- Nao criar automacao recorrente real.
- Nao publicar conteudo externo.
- Nao ampliar escopo sem aprovacao.

## Quando parar

Pare e peca aprovacao se:

- Uma validacao falhar.
- A correcao exigir arquivo fora do escopo.
- A tarefa tocar em auth, billing, Supabase, migrations, Vercel, deploy, secrets, dados reais ou dependencias.
- Houver risco de impacto em producao ou clientes.

## Commit

Se tudo passar, fazer commit com a mensagem:

`tipo: mensagem do commit`

## Push

Depois do commit, fazer push da branch.

## Formato do relatorio final

Entregar:

1. Branch
2. Hash do commit
3. Arquivos alterados
4. Validacoes rodadas e resultado
5. Confirmacao do push
6. Riscos e limites
7. Pendencias do CEO
8. Link para abrir PR, se disponivel
9. Titulo recomendado do PR
10. Descricao completa do PR em Markdown
```
