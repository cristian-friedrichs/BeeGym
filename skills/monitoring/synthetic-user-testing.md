# Teste Sintetico de Usuario

## Objetivo

Planejar verificacoes sinteticas de fluxos criticos do BeeGym sem criar automacoes reais ou alterar dados sensiveis.

## Quando usar

Use para definir ou revisar cenarios de monitoramento, QA manual, smoke tests ou testes em `testsprite_tests`.

## Entradas necessárias

- Fluxo critico a verificar.
- Ambiente permitido.
- Conta ou dados de teste aprovados.
- Criterios de sucesso.
- Limites de seguranca.

## Processo passo a passo

1. Descreva o fluxo como usuario real.
2. Liste passos observaveis e resultado esperado.
3. Defina dados de teste seguros.
4. Inclua falhas esperadas e sinais de alerta.
5. Documente frequencia conceitual, sem automatizar.
6. Marque aprovacao para qualquer execucao recorrente real.

## Critérios de qualidade A+

- Cenario representa fluxo importante do SaaS.
- Nao usa dados reais de clientes.
- Resultado esperado e verificavel.
- Automatizacao real fica explicitamente fora do escopo.
- Risco de artefatos sensiveis e considerado.

## O que não pode fazer

- Criar workflow, cron, monitor ou integracao real sem aprovacao.
- Usar credenciais reais ou expor configuracoes de teste.
- Alterar `testsprite_tests/tmp/config.json` ou revelar seu conteudo.
- Executar contra producao sem aprovacao.

## Output esperado

Cenario sintetico documentado com objetivo, pre-condicoes, passos, resultado esperado, falhas e limite de execucao.

## Checklist final

- [ ] Fluxo critico foi definido.
- [ ] Dados de teste sao seguros.
- [ ] Resultado esperado e verificavel.
- [ ] Automacao real nao foi criada.
- [ ] Aprovacao foi marcada quando necessaria.
