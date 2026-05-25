# Automated Reporting

## Objetivo

Todo trabalho agent-first deve terminar com um relatorio final claro. O relatorio reduz acompanhamento manual do CEO e torna branch, commit, validacoes, riscos e proximos passos rastreaveis.

## Quando gerar

Gerar relatorio final sempre que uma tarefa:

- Criar ou alterar arquivos.
- Rodar validacoes.
- Criar branch.
- Fazer commit ou push.
- Preparar PR.
- Diagnosticar falha relevante.

## Campos obrigatorios

### Branch

Informar a branch usada e se ela foi enviada ao remoto.

### Objetivo

Resumir o resultado esperado da tarefa em uma ou duas frases.

### Arquivos alterados

Listar cada arquivo alterado e o motivo da alteracao.

### Validacoes rodadas

Informar comandos ou verificacoes executadas e o resultado.

Quando uma validacao nao for aplicavel, explicar brevemente o motivo.

### Resultado

Informar se a tarefa passou, falhou ou ficou parcialmente concluida.

### Riscos

Registrar riscos evitados, riscos residuais e areas sensiveis nao tocadas.

### Pendencias

Listar decisoes ou acoes que ainda dependem do CEO ou de outro agente.

### Link do push ou PR

Informar link do branch remoto, PR ou instrução para abrir PR quando disponivel.

### Recomendacao proxima

Indicar o proximo passo mais provavel:

- Abrir PR.
- Revisar PR.
- Aguardar checks.
- Corrigir falha especifica.
- Aprovar merge.
- Pausar por risco.

## Formato recomendado

```markdown
## Resumo

Branch:
Objetivo:
Status:

## Arquivos alterados

- `arquivo`: motivo.

## Validacoes

- `comando ou verificacao`: resultado.

## Riscos e limites

- Riscos evitados:
- Riscos residuais:
- Areas nao tocadas:

## Pendencias

- Decisoes do CEO:
- Bloqueios:

## Links

- Push:
- PR:

## Recomendacao

Proximo passo recomendado:
```

## Regras de seguranca

- Nao incluir secrets, tokens, cookies, headers sensiveis ou dados reais.
- Nao copiar logs extensos quando houver risco de informacao sensivel.
- Nao declarar estabilidade sem evidencias.
- Diferenciar validacao executada de validacao nao executada.
- Separar fatos de recomendacoes.
