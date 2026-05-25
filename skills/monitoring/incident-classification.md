# Classificacao de Incidente

## Objetivo

Classificar incidentes do BeeGym por severidade, impacto, escopo e necessidade de escalonamento.

## Quando usar

Use quando houver erro, degradacao, indisponibilidade, falha de fluxo critico, suspeita de seguranca, problema de billing ou aumento de tickets.

## Entradas necessárias

- Sintoma observado.
- Fluxo ou area afetada.
- Evidencias disponiveis.
- Usuarios ou segmentos impactados.
- Horario de inicio conhecido ou estimado.
- Acoes ja tomadas.

## Processo passo a passo

1. Descreva o sintoma sem inferir causa.
2. Identifique impacto em cliente, receita, dados e operacao.
3. Classifique severidade de forma qualitativa.
4. Liste evidencias e lacunas.
5. Defina responsavel de triagem.
6. Marque necessidade de CEO quando houver producao, dados, billing ou comunicacao sensivel.

## Critérios de qualidade A+

- Severidade e justificada por impacto.
- Causa nao confirmada nao vira fato.
- Evidencias sao seguras e rastreaveis.
- Proximo passo reduz incerteza.
- Escalonamento e claro.

## O que não pode fazer

- Alterar producao, banco, Vercel ou billing durante classificacao.
- Expor logs sensiveis ou dados reais.
- Prometer prazo de resolucao.
- Comunicar clientes sem aprovacao.

## Output esperado

Registro de incidente com sintoma, impacto, severidade, evidencias, lacunas, dono, proximo passo e aprovacao necessaria.

## Checklist final

- [ ] Sintoma foi descrito.
- [ ] Impacto foi avaliado.
- [ ] Severidade foi justificada.
- [ ] Lacunas foram listadas.
- [ ] Escalonamento foi definido.
