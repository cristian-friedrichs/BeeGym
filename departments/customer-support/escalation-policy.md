# Escalation Policy

Esta politica define quando um ticket pode ser respondido por IA, quando precisa de revisao humana, quando deve escalar para CTO, quando deve virar GitHub Issue e quando exige aprovacao do CEO.

## Pode ser respondido por IA

- Duvida simples coberta por base de conhecimento.
- Orientacao de uso sem dados sensiveis.
- Pedido de passos para criar aluno, treino ou agenda.
- Explicacao comercial padrao sobre teste de 7 dias com cartao.
- Resposta inicial pedindo detalhes seguros para diagnostico.

## Deve virar sugestao de resposta para humano

- Cancelamento.
- Pedido de reembolso.
- Contestacao de cobranca.
- Cliente irritado, risco de churn ou tom sensivel.
- Caso com informacao pessoal, financeira ou de permissao.
- Qualquer resposta que dependa de decisao comercial.

## Deve escalar para CTO

- Bug provavel em fluxo central.
- Falha de login, permissao, pagamento, agenda ou treino sem workaround.
- Suspeita de regressao.
- Evidencia de erro tecnico reproduzivel.
- Questao de seguranca, privacidade ou dados.

## Deve virar GitHub Issue

- Bug reproduzivel com passos claros.
- Regressao confirmada.
- Problema tecnico com impacto relevante.
- Melhoria de produto aprovada para analise tecnica.

GitHub Issue deve ser aberta pelo fluxo de CTO/TI, nao diretamente por suporte sem handoff aprovado.

## Exige aprovacao do CEO

- Reembolso fora da politica padrao.
- Desconto, compensacao ou excecao comercial.
- Mudanca de plano manual.
- Comunicacao sobre incidente critico.
- Decisao que envolva risco legal, reputacional, financeiro ou dados reais.

## Regra de seguranca

Quando houver duvida entre responder e escalar, escalar para humano.
