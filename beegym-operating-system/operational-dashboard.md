# Operational Dashboard

O Operational Dashboard e um painel conceitual para o CEO acompanhar a operacao do BeeGym. Ele nao cria integracoes, automacoes ou tracking real. Ele define quais blocos devem ser observados e quais perguntas devem orientar decisoes.

## Objetivo

Dar ao CEO uma visao simples de saude operacional, prioridades, riscos e pendencias entre departamentos.

## Blocos do painel

1. TI.
2. Suporte.
3. Marketing.
4. Growth.
5. Produto.
6. Riscos.
7. Pendencias.

## TI

Indicadores conceituais:

- Incidentes abertos.
- Bugs bloqueadores.
- PRs em andamento.
- Checks falhando.
- Fluxos criticos com risco.
- Pendencias tecnicas que exigem aprovacao.

Perguntas:

- Existe risco tecnico afetando cliente?
- Algum PR esta travado?
- Alguma mudanca sensivel esta pendente de aprovacao?
- O que precisa ser estabilizado antes de construir mais?

## Suporte

Indicadores conceituais:

- Tickets criticos.
- Tickets recorrentes.
- Tempo de resposta.
- Casos em escalonamento.
- Clientes em risco.
- Temas que precisam virar base de conhecimento.

Perguntas:

- Quais problemas os clientes estao repetindo?
- Algum ticket indica bug provavel?
- Alguma resposta exige aprovacao humana?
- Que atrito deve virar melhoria de produto?

## Marketing

Indicadores conceituais:

- Conteudos planejados.
- Campanhas em preparacao.
- Aprendizados de canal.
- Ajustes de posicionamento.
- Pendencias de aprovacao antes de publicacao.
- Riscos de promessa nao comprovada.

Perguntas:

- A mensagem esta clara para o mercado fitness?
- Existe conteudo pronto para revisao?
- Algum canal gerou aprendizado relevante?
- Alguma comunicacao precisa ser corrigida antes de publicar?

## Growth

Indicadores conceituais:

- Hipoteses ativas.
- Gargalos do funil.
- Ativacao do trial de 7 dias.
- Conversao de trial para cliente.
- Sinais de retencao.
- Experimentos aguardando aprovacao.

Perguntas:

- Onde o usuario trava?
- Qual hipotese pequena pode gerar aprendizado esta semana?
- Existe experimento que depende de produto, suporte ou marketing?
- Alguma acao exige tracking, automacao, oferta ou mudanca sensivel?

## Produto

Indicadores conceituais:

- Itens de roadmap.
- Feedbacks recorrentes.
- Problemas de UX.
- Fluxos prioritarios.
- Demandas de clientes.
- Dependencias tecnicas.

Perguntas:

- Qual problema de usuario mais importa agora?
- O roadmap reflete aprendizados recentes?
- Algum pedido deve ser rejeitado, adiado ou quebrado em partes menores?
- O produto esta ajudando o usuario a chegar ao primeiro valor?

## Riscos

Indicadores conceituais:

- Riscos tecnicos.
- Riscos de seguranca.
- Riscos de cliente.
- Riscos de billing.
- Riscos de comunicacao.
- Riscos de dependencia externa.
- Riscos sem dono definido.

Perguntas:

- Qual risco pode afetar clientes ou receita esta semana?
- Qual risco exige aprovacao do CEO?
- Qual risco esta sendo ignorado porque ainda nao virou incidente?
- Existe plano de mitigacao?

## Pendencias

Indicadores conceituais:

- Decisoes aguardando CEO.
- Tarefas bloqueadas.
- PRs aguardando revisao.
- Documentos pendentes.
- Aprovacoes sensiveis.
- Proximas revisoes.

Perguntas:

- O que esta parado por falta de decisao?
- O que deve ser fechado hoje?
- O que deve ser removido da fila?
- Quem e o dono da proxima acao?

## Formato recomendado

```text
Area:
Status:
Sinal principal:
Risco:
Decisao necessaria:
Dono:
Proxima acao:
Prazo:
```

## Regra de uso

O painel deve ajudar o CEO a decidir, nao apenas acumular informacao. Cada bloco deve terminar com uma decisao, uma pendencia clara ou a confirmacao de que nao ha acao necessaria.
