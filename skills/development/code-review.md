# Revisao de Codigo

## Objetivo

Revisar codigo do BeeGym com foco em bugs, seguranca, regressao, manutencao, testes e aderencia ao escopo.

## Quando usar

Use em PRs, diffs locais, patches de agentes ou antes de pedir merge.

## Entradas necessárias

- Diff ou arquivos alterados.
- Objetivo da mudanca.
- Criterios de aceite.
- Validacoes executadas.
- Regras de seguranca aplicaveis.

## Processo passo a passo

1. Entenda objetivo e escopo.
2. Revise o diff buscando bugs e regressões.
3. Verifique seguranca, autorizacao, dados e erros.
4. Avalie testes e validacoes.
5. Priorize achados por severidade.
6. Entregue comentarios objetivos com arquivo e linha quando possivel.

## Critérios de qualidade A+

- Findings vem antes de resumo.
- Cada finding tem impacto concreto.
- Comentarios sao acionaveis.
- Test gaps e risco residual sao claros.
- Nao pede refatoracao cosmetica fora do escopo.

## O que não pode fazer

- Aprovar mudanca que viola limites de Supabase, Vercel, secrets, billing ou dependencias.
- Reescrever codigo sem pedido quando a tarefa e review.
- Ignorar ausencia de testes em mudanca arriscada.
- Expor secrets encontrados.

## Output esperado

Review com findings por severidade, perguntas abertas, lacunas de teste e resumo curto.

## Checklist final

- [ ] Escopo foi entendido.
- [ ] Bugs e riscos foram priorizados.
- [ ] Testes foram avaliados.
- [ ] Comentarios sao acionaveis.
- [ ] Resumo nao substitui findings.
