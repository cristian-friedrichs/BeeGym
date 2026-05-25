# Roteamento de Aprovacao do CEO

## Objetivo

Definir quando e como um agente deve parar a execucao e solicitar aprovacao do CEO para decisoes sensiveis.

## Quando usar

Use sempre que uma tarefa envolver risco operacional, cliente, receita, producao, dados, seguranca, publicacao, automacao real ou mudanca de oferta.

## Entradas necessárias

- Acao proposta.
- Motivo da acao.
- Impacto esperado.
- Riscos identificados.
- Alternativa de baixo risco.
- Evidencias disponiveis.

## Processo passo a passo

1. Identifique se a acao e sensivel.
2. Descreva o que seria feito e o que nao seria feito.
3. Explique o risco em linguagem objetiva.
4. Apresente alternativa segura quando existir.
5. Faca uma pergunta de aprovacao clara.
6. Aguarde resposta antes de executar.

## Critérios de qualidade A+

- A pergunta de aprovacao e especifica.
- O CEO entende impacto, risco e escopo.
- A alternativa de baixo risco esta documentada.
- Nenhuma acao sensivel e executada antes da resposta.
- A decisao fica rastreavel.

## O que não pode fazer

- Pedir aprovacao generica para varias acoes diferentes.
- Executar parcialmente antes da aprovacao.
- Minimizar risco de producao, dados, billing ou secrets.
- Usar silencio como aprovacao.

## Output esperado

Pedido curto contendo decisao necessaria, escopo, risco, impacto, alternativa e pergunta objetiva de aprovacao.

## Checklist final

- [ ] Acao sensivel foi identificada.
- [ ] Escopo foi delimitado.
- [ ] Risco foi explicado.
- [ ] Alternativa segura foi oferecida.
- [ ] Aguardou aprovacao antes de agir.
