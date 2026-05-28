# Agent Execution Flow

Este e o fluxo padrao para execucao agent-first no BeeGym Operating System. Ele separa decisao, diagnostico, aprovacao, execucao e validacao.

## Fluxo padrao

```text
CEO solicita
-> agente diagnostica
-> agente propoe plano
-> CEO aprova
-> agente executa em branch
-> agente valida
-> agente prepara commit
-> agente faz push
-> agente abre PR
-> checks rodam
-> revisao e merge
```

Commit, push, PR e merge exigem autorizacao quando nao tiverem sido explicitamente pedidos pelo CEO.

## 1. CEO solicita

O CEO define o problema, objetivo ou resultado esperado.

Entrada ideal:

- Contexto.
- Resultado desejado.
- Escopo permitido.
- Riscos conhecidos.
- Prazo ou prioridade.

Quando o pedido for incompleto, o agente deve levantar contexto antes de executar.

## 2. Agente diagnostica

O agente coleta informacoes suficientes para entender o problema.

Pode incluir:

- Leitura de documentacao operacional.
- Leitura de arquivos relevantes.
- Revisao de PRs, issues ou status local quando solicitado.
- Identificacao de riscos.
- Separacao entre fato, hipotese e incerteza.

Limite:

- Nao ler secrets.
- Nao tocar em Supabase, Vercel, producao, billing ou dependencias sem aprovacao explicita.

## 3. Agente propoe plano

O plano deve ser pequeno, revisavel e proporcional ao risco.

Plano recomendado:

```text
Objetivo:
Arquivos ou areas envolvidas:
Passos:
Validacoes:
Riscos:
O que exige aprovacao:
```

Para tarefas simples e de baixo risco, o agente pode executar diretamente dentro das regras do repositorio. Para tarefas sensiveis, deve aguardar aprovacao.

## 4. CEO aprova

O CEO aprova o escopo, o risco e a proxima acao.

A aprovacao deve deixar claro:

- O que pode ser alterado.
- O que nao pode ser alterado.
- Se pode executar.
- Se pode validar.
- Se pode commitar.
- Se pode fazer push.
- Se pode abrir PR.

## 5. Agente executa em branch

Toda alteracao deve ocorrer fora da `main`.

Regras:

- Usar branch dedicada.
- Manter escopo pequeno.
- Nao alterar codigo, runtime, banco, deploy, secrets, dependencias ou migrations fora do pedido aprovado.
- Preservar alteracoes existentes do usuario.
- Documentar arquivos alterados e motivo.

## 6. Agente valida

Validacoes devem ser proporcionais ao tipo de mudanca.

Exemplos:

- Documentacao: revisao de arquivos criados e `git status`.
- Codigo: lint, typecheck, testes ou build quando aplicavel.
- Frontend: verificacao visual quando houver mudanca de UI.
- Incidente: evidencias de causa, mitigacao e proxima verificacao.

Se uma validacao falhar por configuracao existente, o agente deve reportar e nao corrigir sem autorizacao.

## 7. Commit

Commit so deve ser feito com autorizacao.

Antes do commit:

- Revisar `git status`.
- Confirmar arquivos alterados.
- Garantir que nada sensivel foi incluido.
- Usar mensagem clara e especifica.

## 8. Push

Push so deve ser feito com autorizacao.

Antes do push:

- Confirmar branch atual.
- Confirmar que o commit pertence ao escopo.
- Confirmar que nao ha alteracao sensivel nao aprovada.

No Codex, `git fetch`, `git pull`, `git push` e comandos `gh` que acessam GitHub devem usar permissao escalada quando a rede estiver bloqueada pela sandbox. Essa permissao deve ser limitada ao comando necessario e nao permite ler secrets, mudar configuracoes remotas sensiveis ou ampliar a tarefa.

## 9. PR

PR so deve ser aberto com autorizacao.

PR deve conter:

- Objetivo.
- Arquivos alterados.
- Validacoes feitas.
- Riscos e limites.
- O que nao foi alterado.

## 10. Checks

Checks devem ser revisados antes de merge.

Se checks falharem:

- Identificar falha.
- Diferenciar erro novo de falha existente.
- Propor correcao.
- Aguardar aprovacao quando a correcao sair do escopo.

## 11. Merge

Merge e decisao final de integracao.

Antes do merge:

- Revisao aprovada.
- Checks relevantes passando ou falha aceita conscientemente.
- Riscos sensiveis aprovados.
- Plano de rollback ou reversao quando aplicavel.

## Regra central

Agentes aceleram execucao. O CEO mantem decisao, risco e prioridade.
