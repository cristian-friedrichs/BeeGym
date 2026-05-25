# Teste de Regressao

## Objetivo

Planejar e executar validacoes de regressao permitidas para confirmar que uma mudanca nao quebrou fluxos importantes do BeeGym.

## Quando usar

Use apos alteracoes aprovadas, antes de revisao, ao diagnosticar falhas ou ao preparar release.

## Entradas necessárias

- Mudanca ou area afetada.
- Fluxos criticos relacionados.
- Comandos de validacao conhecidos.
- Criterios de aceite.
- Riscos e limites de ambiente.

## Processo passo a passo

1. Identifique o que poderia quebrar.
2. Selecione validacoes proporcionais ao risco.
3. Execute apenas comandos seguros e aplicaveis.
4. Registre resultados, falhas e ambiente.
5. Nao corrija falhas fora do escopo sem autorizacao.
6. Recomende proximo passo.

## Critérios de qualidade A+

- Testes escolhidos refletem o risco real da mudanca.
- Resultado e reproduzivel.
- Falhas sao reportadas com contexto.
- Nao ha tentativa de mascarar falha existente.
- Fluxos de usuario relevantes sao considerados.

## O que não pode fazer

- Rodar comandos que alterem producao ou dados reais.
- Criar dados reais de cliente para teste.
- Alterar configuracoes, dependencias ou migrations para fazer teste passar sem aprovacao.
- Ignorar falhas de lint, build, typecheck ou test quando aplicaveis.

## Output esperado

Relatorio com validacoes executadas, resultado, falhas, risco residual e recomendacao.

## Checklist final

- [ ] Risco de regressao foi identificado.
- [ ] Validacoes foram proporcionais.
- [ ] Resultados foram registrados.
- [ ] Falhas foram explicadas.
- [ ] Proximo passo foi recomendado.
