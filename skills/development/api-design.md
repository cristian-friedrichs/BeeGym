# Design de API

## Objetivo

Planejar APIs do BeeGym com contratos claros, seguranca, previsibilidade e validacao antes de implementacao.

## Quando usar

Use ao propor endpoints, server actions, integracoes internas, webhooks ou contratos entre frontend e backend.

## Entradas necessárias

- Caso de uso.
- Consumidores da API.
- Dados de entrada e saida.
- Regras de autenticacao e autorizacao.
- Riscos de dados, billing e integracao.

## Processo passo a passo

1. Defina o objetivo da API.
2. Liste consumidores e permissões necessarias.
3. Modele entrada, saida, erros e estados vazios.
4. Defina validacao e limites.
5. Avalie impacto em dados reais, Supabase, billing ou webhooks.
6. Documente contrato e riscos antes de implementar.

## Critérios de qualidade A+

- Contrato e claro e versionavel quando necessario.
- Erros sao previsiveis.
- Autorizacao e considerada desde o inicio.
- Riscos sensiveis sao escalados.
- Nao cria integracao externa sem aprovacao.

## O que não pode fazer

- Implementar endpoint sem escopo aprovado.
- Tocar em Supabase, schema, RLS ou migrations sem aprovacao.
- Expor dados alem do necessario.
- Criar webhook real sem aprovacao.

## Output esperado

Especificacao com objetivo, rota ou contrato conceitual, entradas, saidas, erros, seguranca, riscos e validacoes.

## Checklist final

- [ ] Consumidores foram definidos.
- [ ] Entrada e saida foram descritas.
- [ ] Erros foram cobertos.
- [ ] Autorizacao foi avaliada.
- [ ] Aprovacoes foram indicadas.
