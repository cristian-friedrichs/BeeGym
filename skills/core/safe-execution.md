# Execucao Segura

## Objetivo

Orientar agentes a executar tarefas de baixo risco sem ultrapassar limites operacionais, comerciais ou tecnicos do BeeGym.

## Quando usar

Use antes de qualquer acao que crie, altere, mova, publique, rode comandos, gere relatorios ou recomende execucao.

## Entradas necessárias

- Escopo aprovado.
- Resultado da skill de leitura de contexto.
- Lista de arquivos, sistemas ou documentos afetados.
- Regras de seguranca aplicaveis.
- Nivel de risco estimado.

## Processo passo a passo

1. Classifique a acao como baixa, media ou alta sensibilidade.
2. Confirme se a acao altera codigo, runtime, banco, deploy, secrets, billing, dependencias, dados reais ou automacoes.
3. Se houver item sensivel, pare e solicite aprovacao.
4. Trabalhe em branch dedicada quando houver alteracao no repositorio.
5. Mantenha a mudanca pequena e revisavel.
6. Registre o que foi alterado e por que.

## Critérios de qualidade A+

- Escopo mantido exatamente dentro do pedido aprovado.
- Nenhum arquivo sensivel lido ou exposto.
- Nenhuma acao de producao executada sem aprovacao.
- Mudancas pequenas, rastreaveis e reversiveis.
- Validacoes aplicaveis relatadas sem tentar corrigir falhas fora do escopo.

## O que não pode fazer

- Alterar `src` quando a tarefa for apenas operacional ou documental.
- Tocar em Supabase, migrations, Vercel, `.env`, billing ou dependencias sem aprovacao.
- Criar workflows, integracoes externas ou automacoes reais sem aprovacao.
- Fazer commit ou abrir PR sem autorizacao.

## Output esperado

Relato objetivo da execucao, incluindo arquivos afetados, riscos evitados, validacoes realizadas e pendencias.

## Checklist final

- [ ] A acao ficou dentro do escopo.
- [ ] Itens sensiveis foram evitados ou escalados.
- [ ] Nao houve exposicao de secrets.
- [ ] Alteracoes foram documentadas.
- [ ] Proximo passo foi definido.
