# Decision Log

O Decision Log registra decisoes importantes do BeeGym Operating System. Ele deve ser usado para manter memoria operacional, contexto de trade-offs e responsabilidade sobre decisoes que afetam produto, operacao, tecnologia, suporte, marketing ou growth.

## Quando registrar

Registre uma decisao quando houver:

- Mudanca de prioridade.
- Risco operacional relevante.
- Decisao sobre roadmap.
- Decisao tecnica com impacto futuro.
- Decisao sobre posicionamento, oferta ou funil.
- Decisao sobre cliente, suporte, billing ou experiencia.
- Alternativa relevante descartada.
- Aprovacao do CEO para acao sensivel.

## Modelo de decisao

```text
Data:
Decisao:
Contexto:
Risco:
Impacto:
Alternativa descartada:
Responsavel:
Proxima revisao:
```

## Campos

### Data

Data em que a decisao foi tomada.

Formato recomendado:

```text
AAAA-MM-DD
```

### Decisao

Descricao objetiva do que foi decidido.

Exemplo:

```text
Priorizar melhoria do onboarding do trial de 7 dias antes de criar nova campanha paga.
```

### Contexto

Fatos, sinais, aprendizados ou restricoes que explicam a decisao.

Separe fatos de hipoteses quando necessario.

### Risco

Riscos aceitos, mitigados ou ainda abertos.

Exemplos:

- Risco tecnico.
- Risco comercial.
- Risco de suporte.
- Risco de reputacao.
- Risco de atraso.
- Risco de mudanca sensivel.

### Impacto

Resultado esperado ou area afetada.

Exemplos:

- Produto.
- Clientes.
- Suporte.
- Marketing.
- Growth.
- CTO/TI.
- Custos.
- Receita.

### Alternativa descartada

Opcao considerada e nao escolhida.

Explique brevemente por que foi descartada.

### Responsavel

Pessoa, departamento ou agente responsavel por conduzir a proxima acao.

### Proxima revisao

Data ou condicao para revisar a decisao.

Exemplos:

- Proxima rotina semanal.
- Fechamento do mes.
- Apos 10 tickets similares.
- Apos conclusao do PR.
- Apos validacao com clientes.

## Exemplo

```text
Data: 2026-05-25
Decisao: Revisar a rotina operacional do CEO antes de criar automacoes reais.
Contexto: Departamentos e skills ja existem, mas ainda falta uma cadencia pratica de uso.
Risco: Criar automacoes antes de validar o processo pode aumentar complexidade operacional.
Impacto: BeeGym Operating System, CEO, departamentos agent-first.
Alternativa descartada: Criar automacoes recorrentes imediatamente.
Responsavel: CEO Operating System Architect.
Proxima revisao: Apos uma semana usando a rotina diaria e semanal.
```
