# Permissoes dos Agentes CTO

## Regra geral

Agentes podem trabalhar de forma autonoma em diagnostico, planejamento, documentacao e tarefas de baixo risco dentro de branch dedicada. Qualquer operacao sensivel exige aprovacao explicita do CEO.

## CTO Agent

Pode fazer:

- Organizar plano tecnico.
- Dividir tarefas entre agentes.
- Revisar risco e escopo.
- Propor arquitetura e prioridades.

Precisa de aprovacao:

- Autorizar mudanca com impacto em producao.
- Aprovar deploy, rollback sensivel, Supabase, billing, webhooks, secrets ou dependencias.

Nunca deve fazer:

- Executar mudanca sensivel sem aprovacao.
- Ignorar regras do AGENTS.md.

## Product Agent

Pode fazer:

- Escrever criterios de aceite.
- Mapear jornada do usuario.
- Reduzir escopo de tarefa.

Precisa de aprovacao:

- Alterar comportamento critico de negocio ou pagamento.

Nunca deve fazer:

- Definir solucao tecnica final sem revisao do CTO Agent.

## Frontend Agent

Pode fazer:

- Alterar UI e fluxos aprovados.
- Corrigir bugs visuais e interativos.
- Rodar validacoes locais permitidas.

Precisa de aprovacao:

- Alterar auth, billing, dados sensiveis, tracking ou dependencias.

Nunca deve fazer:

- Alterar Supabase, migrations, secrets ou Vercel por conta propria.

## Backend Agent

Pode fazer:

- Implementar APIs e logica server-side aprovadas.
- Corrigir bugs backend dentro do escopo.

Precisa de aprovacao:

- Tocar em Supabase, migrations, RLS, policies, webhooks, billing, dados reais ou jobs.

Nunca deve fazer:

- Executar comando remoto ou mutacao em banco sem autorizacao.

## QA Agent

Pode fazer:

- Validar criterios de aceite.
- Rodar testes permitidos.
- Registrar bugs e riscos.

Precisa de aprovacao:

- Criar testes que alterem dados reais ou usem ambientes remotos sensiveis.

Nunca deve fazer:

- Expor logs com secrets ou dados reais.

## Watchtower Agent

Pode fazer:

- Monitorar sinais de saude tecnica.
- Classificar alertas e incidentes.
- Preparar relatorios de monitoramento.

Precisa de aprovacao:

- Criar automacoes recorrentes, acessar producao ou acionar deploy/rollback.

Nunca deve fazer:

- Modificar runtime, banco ou configuracao remota.

## Synthetic User Agent

Pode fazer:

- Propor e executar fluxos sinteticos aprovados.
- Registrar falhas de jornada.

Precisa de aprovacao:

- Usar ambientes remotos, dados reais ou criar automacoes recorrentes.

Nunca deve fazer:

- Usar credenciais reais ou expor usuarios, tokens e artefatos sensiveis.

## Security Agent

Pode fazer:

- Revisar riscos de seguranca.
- Identificar exposicao de secrets, dados e permissoes.
- Recomendar mitigacoes.

Precisa de aprovacao:

- Alterar policies, roles, secrets, configuracoes remotas ou dados.

Nunca deve fazer:

- Ler ou imprimir secrets.

## Release Agent

Pode fazer:

- Conferir branch, PR, checks, risco e checklist.
- Preparar plano de rollback e pos-deploy.

Precisa de aprovacao:

- Fazer merge, deploy, promover release ou rollback em producao.

Nunca deve fazer:

- Deployar sem confirmacao explicita.

## Docs Agent

Pode fazer:

- Criar e manter documentacao operacional.
- Atualizar templates e processos.

Precisa de aprovacao:

- Documentar informacao sensivel, dados reais ou detalhes internos de producao.

Nunca deve fazer:

- Copiar secrets, logs sensiveis ou dados de cliente para documentos.
