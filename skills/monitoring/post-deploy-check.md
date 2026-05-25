# Verificacao Pos-Deploy

## Objetivo

Definir verificacoes a serem feitas apos deploy aprovado do BeeGym, sem executar deploy ou alterar producao por conta propria.

## Quando usar

Use ao preparar checklists de release, validar deploy ja aprovado ou documentar criterios de saude apos mudancas.

## Entradas necessárias

- Escopo do deploy aprovado.
- Fluxos afetados.
- Criterios de sucesso.
- Plano de rollback aprovado quando existir.
- Canais de escalonamento.

## Processo passo a passo

1. Confirme que o deploy foi aprovado por quem pode aprovar.
2. Liste fluxos criticos afetados.
3. Defina verificacoes funcionais, tecnicas e de suporte.
4. Registre sinais de alerta.
5. Defina janela de observacao.
6. Documente resultado e proximas acoes.

## Critérios de qualidade A+

- Checklist e proporcional ao risco do deploy.
- Inclui fluxos de usuario, erros e sinais de suporte.
- Nao executa rollback sem aprovacao.
- Evidencias sao registradas sem secrets.
- Risco residual e declarado.

## O que não pode fazer

- Fazer deploy, promover build ou alterar Vercel.
- Executar rollback sem aprovacao.
- Alterar dados reais.
- Comunicar clientes sem aprovacao.

## Output esperado

Checklist pos-deploy com verificacoes, resultado, evidencias, alertas, risco residual e decisoes pendentes.

## Checklist final

- [ ] Deploy aprovado foi confirmado.
- [ ] Fluxos afetados foram listados.
- [ ] Verificacoes foram definidas.
- [ ] Alertas foram registrados.
- [ ] Risco residual foi informado.
