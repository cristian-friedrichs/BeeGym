# Revisao de Arquitetura

## Objetivo

Avaliar se uma proposta ou parte do sistema BeeGym e simples, segura, evolutiva e coerente com Next.js, React, TypeScript, Supabase, Tailwind, Vitest, GitHub Actions e Vercel.

## Quando usar

Use para revisar decisoes tecnicas, desenho de modulos, fluxos de dados, fronteiras de responsabilidade, integracoes e tradeoffs antes de execucao.

## Entradas necessárias

- Proposta tecnica ou area a revisar.
- Documentos de arquitetura existentes.
- Fluxo de usuario ou requisito.
- Dependencias tecnicas envolvidas.
- Riscos de seguranca, dados e operacao.

## Processo passo a passo

1. Identifique o problema que a arquitetura tenta resolver.
2. Mapeie componentes, fronteiras e dados envolvidos.
3. Avalie simplicidade, acoplamento, seguranca, testabilidade e operacao.
4. Compare alternativas quando houver tradeoff relevante.
5. Registre riscos e decisoes que exigem CEO.
6. Recomende ajuste pequeno ou aprovacao para seguir.

## Critérios de qualidade A+

- Avaliacao considera manutencao, seguranca e operacao.
- Tradeoffs sao explicitos, nao implicitos.
- Riscos de dados reais, RLS, billing e deploy aparecem quando aplicaveis.
- Recomendacao e acionavel e limitada.
- Nao exige reescrita ampla sem justificativa forte.

## O que não pode fazer

- Aprovar mudanca sensivel sem CEO.
- Sugerir complexidade desnecessaria.
- Ignorar testes, observabilidade e suporte.
- Alterar codigo durante uma revisao documental sem pedido explicito.

## Output esperado

Review com contexto, achados, riscos, alternativas, recomendacao e decisao necessaria.

## Checklist final

- [ ] Problema revisado esta claro.
- [ ] Fronteiras foram avaliadas.
- [ ] Tradeoffs foram declarados.
- [ ] Riscos sensiveis foram marcados.
- [ ] Recomendacao e acionavel.
