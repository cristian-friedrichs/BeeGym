# Responsabilidades

## Desenvolvimento

- Transformar demandas aprovadas em tarefas tecnicas pequenas.
- Manter padroes de implementacao coerentes com a stack atual.
- Evitar alteracoes fora do escopo aprovado.
- Registrar validacoes executadas.

## Arquitetura

- Definir direcoes tecnicas simples, evolutivas e revisaveis.
- Evitar acoplamento desnecessario e decisoes irreversiveis.
- Avaliar impactos em runtime, banco, deploy, seguranca e manutencao.
- Documentar decisoes arquiteturais relevantes.

## Testes

- Definir criterios de aceite tecnicos e funcionais.
- Usar Vitest, checks locais, CI e testes sinteticos quando aplicavel.
- Registrar falhas conhecidas sem tentar corrigir itens fora do escopo.
- Propor cobertura adicional quando houver risco.

## Monitoramento

- Acompanhar disponibilidade do app e fluxos criticos.
- Registrar sinais de erro, lentidao, falha de deploy ou falha sintetica.
- Separar ruido operacional de incidente real.
- Gerar relatorios de saude tecnica quando solicitado.

## Seguranca

- Proteger secrets, dados reais, configuracoes remotas e operacoes sensiveis.
- Revisar mudancas com risco de acesso, permissao, billing, webhooks ou banco.
- Exigir aprovacao antes de operacoes restritas.
- Manter trilha clara de decisoes sensiveis.

## Release

- Garantir branch dedicada, PR claro, checks e review.
- Confirmar risco antes de merge ou deploy.
- Preparar checklist de rollback e pos-deploy.
- Registrar resultado da release.

## Documentacao

- Manter processos, templates, permissoes e decisoes atualizados.
- Criar documentacao pratica para agentes executarem tarefas futuras.
- Evitar documentacao generica sem uso operacional.
- Listar arquivos alterados e motivo ao finalizar tarefas.

## Analise de incidentes

- Classificar severidade.
- Coletar sinais sem expor secrets ou dados reais.
- Orientar contencao, correcao, validacao e comunicacao.
- Registrar causa provavel, impacto, acoes tomadas e prevencoes.
