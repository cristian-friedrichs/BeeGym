# Daily Routine

A rotina diaria do CEO deve ser curta, objetiva e orientada a decisao. O foco e identificar riscos, remover bloqueios e escolher poucas prioridades reais para o dia.

## Objetivo

Garantir que o BeeGym avance todos os dias sem perder controle sobre incidentes, clientes, qualidade tecnica e foco comercial.

## Checklist diario

1. Checar bugs e incidentes.
2. Checar tickets criticos de clientes.
3. Checar status de CI e deploy.
4. Checar tarefas em andamento.
5. Revisar uma metrica principal.
6. Definir ate 3 prioridades do dia.

## 1. Bugs e incidentes

Perguntas do CEO:

- Existe algum bug bloqueando cliente?
- Existe incidente tecnico aberto?
- Algum fluxo critico esta degradado?
- Ha risco de dados, billing, login, agenda, treino ou pagamento?

Saida esperada:

- Sem incidente.
- Incidente em triagem.
- Incidente exige CTO/TI.
- Incidente exige aprovacao do CEO.

## 2. Tickets criticos

Perguntas do CEO:

- Algum ticket tem impacto em cliente pagante ou trial ativo?
- Algum ticket indica bug recorrente?
- Algum cliente esta em risco de cancelamento?
- Existe resposta pendente que precisa de aprovacao humana?

Saida esperada:

- Tickets criticos priorizados.
- Escalonamentos definidos.
- Respostas sensiveis aguardando aprovacao.

## 3. CI e deploy

Perguntas do CEO:

- Existem checks falhando em PRs importantes?
- Algum deploy falhou ou ficou pendente?
- Alguma alteracao recente aumentou risco operacional?

Limite:

- Nao acionar deploy, Vercel ou producao sem aprovacao explicita.
- Se houver risco tecnico, encaminhar para CTO/TI.

## 4. Tarefas em andamento

Perguntas do CEO:

- Quais tarefas estao em execucao?
- Alguma tarefa esta bloqueada?
- Alguma tarefa cresceu alem do escopo?
- Alguma tarefa deve ser pausada?

Saida esperada:

- Continuar.
- Repriorizar.
- Pausar.
- Escalonar.

## 5. Metrica principal

Escolha uma metrica principal por dia. Evite revisar muitas metricas sem decisao.

Exemplos:

- Novos trials.
- Ativacao do trial de 7 dias.
- Tickets criticos abertos.
- Conversao de trial para cliente.
- Retencao ou risco de churn.
- Bugs bloqueadores.

A metrica deve gerar uma pergunta: o que precisa mudar hoje?

## 6. Prioridades do dia

Defina no maximo 3 prioridades.

Formato recomendado:

```text
Prioridade 1:
Por que importa:
Departamento responsavel:
Agente ou dono:
Resultado esperado hoje:
Risco:
Precisa de aprovacao do CEO:
```

## Saida diaria

Ao final da rotina, o CEO deve ter:

- Ate 3 prioridades claras.
- Bloqueios identificados.
- Riscos sensiveis separados.
- Donos definidos.
- Proxima revisao marcada para o dia seguinte.
