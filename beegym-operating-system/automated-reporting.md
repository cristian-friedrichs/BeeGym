# Automated Reporting

## Objetivo

Todo trabalho agent-first deve terminar com um relatorio final claro. O relatorio reduz acompanhamento manual do CEO e torna branch, commit, validacoes, PR, checks, merge, riscos e proximos passos rastreaveis.

## Quando gerar

Gerar relatorio final sempre que uma tarefa:

- Criar ou alterar arquivos.
- Rodar validacoes.
- Criar branch.
- Fazer commit ou push.
- Abrir ou acompanhar PR.
- Fazer merge.
- Sincronizar `main`.
- Diagnosticar falha relevante.
- Parar por risco, conflito ou check falhando.

## Campos obrigatorios

### Branch criada

Informar a branch usada e se ela foi enviada ao remoto.

### Commit hash

Informar o hash do commit criado, quando houver commit.

### PR URL

Informar o link do PR aberto ou acompanhado, quando houver PR.

### Checks status

Informar o status dos checks relevantes, incluindo `build (18.x)` quando aplicavel.

### Vercel status

Informar o status da Vercel quando aplicavel. Se nao for aplicavel, declarar isso.

### Merge realizado

Informar `sim` ou `nao`. Se sim, informar metodo usado e se foi via GitHub CLI.

### Merge commit

Informar o merge commit quando o merge tiver sido realizado.

### Branch remota deletada

Informar `sim` ou `nao`.

### Main sincronizada

Informar `sim` ou `nao`, incluindo se `main` local esta alinhada com `origin/main`.

### Arquivos alterados

Listar cada arquivo alterado e o motivo da alteracao.

### Validacoes executadas

Informar comandos ou verificacoes executadas e o resultado.

Quando uma validacao nao for aplicavel, explicar brevemente o motivo.

### Riscos encontrados

Registrar riscos evitados, riscos residuais e areas sensiveis nao tocadas.

### Acao do CEO necessaria

Informar `sim` ou `nao`. Se sim, explicar a decisao necessaria.

### Motivo da parada

Se a tarefa parou antes de concluir, informar o motivo da parada.

## Formato recomendado

```markdown
## Resumo

Branch:
Commit:
PR:
Status:

## Checks

- `build (18.x)`:
- Vercel:
- Outros:

## Merge

Merge realizado:
Merge commit:
Branch remota deletada:
Main sincronizada:

## Arquivos alterados

- `arquivo`: motivo.

## Validacoes

- `comando ou verificacao`: resultado.

## Riscos e limites

- Riscos encontrados:
- Riscos residuais:
- Areas sensiveis nao tocadas:

## CEO

Acao do CEO necessaria:
Motivo da parada, se houver:
```

## Regras de seguranca

- Nao incluir secrets, tokens, cookies, headers sensiveis ou dados reais.
- Nao copiar logs extensos quando houver risco de informacao sensivel.
- Nao declarar estabilidade sem evidencias.
- Diferenciar validacao executada de validacao nao executada.
- Separar fatos de recomendacoes.
- Em Nivel 3 parcial, declarar explicitamente se o merge foi permitido pelas condicoes de baixo risco e checks verdes.
