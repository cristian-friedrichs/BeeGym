# Repository Map

## `src`

Codigo principal da aplicacao Next.js. Inclui App Router, rotas publicas, app autenticado, admin, APIs, components, actions, hooks, services, lib, contextos e tipos.

## `supabase`

Configuracao local e migrations do Supabase. Area sensivel. Nao alterar sem autorizacao explicita, especialmente migrations, RLS, policies, RPCs e configuracoes.

## `docs`

Documentacao tecnica, blueprint, schema documental e arquivos legados arquivados. Deve ser usado como fonte de contexto antes de criar novas decisoes de produto ou arquitetura.

## `.github`

Workflows de GitHub Actions. Atualmente abriga automacoes de CI. Alteracoes aqui podem afetar validacao de PRs e pushes.

## `scripts`

Scripts auxiliares do projeto. Devem ser tratados como ferramentas locais e revisados antes de execucao.

## `testsprite_tests`

Testes sinteticos e artefatos de TestSprite/Playwright. Area util para validacao de fluxos, mas deve ser tratada com cuidado por conter outputs temporarios e configuracoes de teste.

## `.agent`

Estrutura existente com agentes, skills, workflows e arquivos ferramentais. Nao e substituida automaticamente pelo BeeGym Operating System.

## `beegym-operating-system`

Camada de governanca agent-first do BeeGym. Define principios, mapas, regras, processos e modo de operacao dos agentes.

## `ai-agents`

Catalogo operacional dos agentes BeeGym. Cada agente futuro deve ter objetivo, limites, entradas, saida esperada e aprovacao necessaria.

## `departments`

Espaco para departamentos agent-first como CTO/TI, Monitoramento, Customer Support, Marketing/CMO e Growth.

## `skills`

Biblioteca de skills do BeeGym OS. Deve ser separada conceitualmente de `.agent/skills` e focada em capacidades operacionais padronizadas do BeeGym.
