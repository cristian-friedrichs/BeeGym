# Diagnostico de Repositorio

## Objetivo

Diagnosticar o estado de uma area do repositorio BeeGym sem alterar codigo, dados, deploy ou dependencias.

## Quando usar

Use para entender falhas, estrutura, padroes existentes, riscos tecnicos, lacunas de teste ou inconsistencias antes de planejar mudancas.

## Entradas necessárias

- Pergunta de diagnostico.
- Arquivos ou areas permitidas.
- Comandos de validacao aprovados quando aplicavel.
- Regras para evitar secrets.
- Criterios de sucesso esperados.

## Processo passo a passo

1. Confirme que esta em branch dedicada quando houver risco de alteracao.
2. Liste arquivos e padroes relevantes sem acessar arquivos sensiveis.
3. Leia apenas o necessario para responder a pergunta.
4. Rode validacoes somente quando forem aplicaveis e seguras.
5. Separe achados confirmados de hipoteses.
6. Sugira proximo passo sem corrigir fora do escopo.

## Critérios de qualidade A+

- Diagnostico e baseado em arquivos e evidencias reais.
- Nao expõe secrets nem dados reais.
- Comandos usados sao seguros e relatados.
- Falhas existentes sao reportadas sem tentativa de correcao nao autorizada.
- Proximo passo e claro e pequeno.

## O que não pode fazer

- Ler `.env` ou arquivos sensiveis.
- Alterar `src`, Supabase, migrations, Vercel ou dependencias em diagnostico puro.
- Executar comandos destrutivos.
- Tratar suspeita como causa confirmada.

## Output esperado

Relatorio curto com pergunta investigada, evidencias, achados, hipoteses, riscos e proximo passo.

## Checklist final

- [ ] Escopo de diagnostico foi respeitado.
- [ ] Arquivos sensiveis foram evitados.
- [ ] Evidencias foram citadas.
- [ ] Hipoteses foram separadas.
- [ ] Nenhuma mudanca indevida foi feita.
