# Planejamento Tecnico

## Objetivo

Transformar objetivos do BeeGym em planos tecnicos pequenos, revisaveis, seguros e alinhados com a stack atual.

## Quando usar

Use antes de implementar funcionalidades, corrigir problemas complexos, organizar epicos, preparar tarefas para agentes ou avaliar impacto tecnico.

## Entradas necessárias

- Objetivo de negocio ou produto.
- Contexto do departamento solicitante.
- Stack e limites do `AGENTS.md`.
- Arquivos, fluxos ou modulos potencialmente afetados.
- Riscos e aprovacoes necessarias.

## Processo passo a passo

1. Reescreva o objetivo em termos tecnicos claros.
2. Identifique usuarios, fluxos e sistemas afetados.
3. Separe descoberta, implementacao, validacao e documentacao.
4. Quebre o trabalho em tarefas pequenas.
5. Marque dependencias e pontos que exigem aprovacao.
6. Defina validacoes esperadas sem alterar escopo.

## Critérios de qualidade A+

- Plano e sequencial, pequeno e revisavel.
- Riscos de Supabase, Vercel, billing, secrets e dependencias sao explicitados.
- Criterios de aceite e validacao aparecem antes da execucao.
- Nao mistura decisao de produto com execucao tecnica sem aprovacao.
- Recomenda proximo passo operacional.

## O que não pode fazer

- Planejar alteracao em producao como se estivesse aprovada.
- Incluir mudanca de dependencia, migration ou deploy sem sinalizar aprovacao.
- Criar tarefas grandes demais para revisar.
- Ignorar impacto em clientes ou suporte.

## Output esperado

Plano tecnico com objetivo, escopo, fora de escopo, tarefas, riscos, validacoes, aprovacoes e proximo passo.

## Checklist final

- [ ] Objetivo tecnico esta claro.
- [ ] Tarefas sao pequenas.
- [ ] Riscos foram mapeados.
- [ ] Validacoes foram definidas.
- [ ] Aprovacoes necessarias foram destacadas.
