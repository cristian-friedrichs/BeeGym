# Criterios de Aceite

## Objetivo

Definir criterios de aceite verificaveis para tarefas de produto, engenharia, suporte, marketing ou growth.

## Quando usar

Use antes de abrir issue, iniciar implementacao, validar entrega, revisar PRD ou preparar QA.

## Entradas necessárias

- Objetivo da tarefa.
- Usuario ou fluxo afetado.
- Comportamento esperado.
- Estados de erro e excecao.
- Limites de seguranca e negocio.

## Processo passo a passo

1. Identifique o resultado observavel.
2. Escreva criterios no formato dado/quando/entao ou equivalente claro.
3. Inclua casos felizes, erros e limites.
4. Adicione criterios de nao regressao.
5. Marque validacoes manuais ou automatizadas.
6. Indique aprovacoes necessarias.

## Critérios de qualidade A+

- Cada criterio pode ser testado.
- Cobre estados principais e excecoes importantes.
- Nao depende de interpretacao subjetiva.
- Respeita regras comerciais do BeeGym.
- Distingue criterio obrigatorio de melhoria futura.

## O que não pode fazer

- Escrever criterios vagos como "deve funcionar bem".
- Inventar comportamento que nao foi aprovado.
- Incluir alteracao de banco, billing ou deploy sem sinalizar aprovacao.
- Ignorar casos de erro.

## Output esperado

Lista de criterios de aceite com casos principais, erros, nao regressao, validacoes e pendencias.

## Checklist final

- [ ] Criterios sao testaveis.
- [ ] Casos de erro foram considerados.
- [ ] Nao regressao foi incluida.
- [ ] Regras BeeGym foram respeitadas.
- [ ] Pendencias foram listadas.
