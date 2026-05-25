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

Codex pode:

- Confirmar que esta em `main` atualizada.
- Criar branch dedicada.
- Ler arquivos de contexto nao sensiveis.
- Alterar apenas arquivos permitidos.
- Rodar validacoes definidas.
- Fazer commit se a checagem final passar.
- Fazer push da branch.
- Gerar relatorio final.
- Gerar titulo e descricao de PR.

Codex nao pode:

- Abrir PR automaticamente, salvo se este prompt autorizar.
- Fazer merge.
- Fazer deploy.
- Tocar em Supabase, migrations, Vercel, secrets, `.env`, billing, dados reais ou producao.
- Alterar dependencias, `package.json` ou lockfiles.

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
- `.github/workflows`
- `.env`
- `.env.local`
- `package.json`
- `package-lock.json`
- Qualquer arquivo fora do escopo aprovado

## Validacoes obrigatorias

- Confirmar branch atual.
- Confirmar arquivos alterados.
- Rodar `comando-de-validacao`, quando aplicavel.
- Confirmar que nenhum arquivo proibido foi alterado.
- Mostrar `git status`.

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
