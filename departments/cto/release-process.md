# Processo de Release

## 1. Branch

- Toda mudanca deve sair de uma branch dedicada.
- A branch deve partir da `main` atualizada.
- O nome deve indicar departamento, area ou objetivo.
- A branch nao deve misturar documentacao, codigo, banco e infra sem necessidade clara.

## 2. PR

- O PR deve explicar objetivo, escopo, arquivos alterados, risco e validacoes.
- PRs devem ser pequenos o suficiente para revisao objetiva.
- Mudancas sensiveis devem declarar explicitamente a aprovacao necessaria.

## 3. Checks

- Executar validacoes aplicaveis: lint, build, typecheck e testes.
- Se um check falhar por configuracao existente, registrar a falha e nao corrigir fora do escopo sem autorizacao.
- Nao ignorar falhas relevantes para a mudanca.

## 4. Review

- Revisar comportamento, seguranca, manutencao e impacto em usuario.
- Security Agent deve revisar mudancas com auth, dados, permissao, billing, webhooks, secrets, Supabase ou migrations.
- QA Agent deve validar criterios de aceite antes de release funcional.

## 5. Deploy

- Deploy exige aprovacao explicita quando houver impacto em producao.
- Nao alterar Vercel, dominios, env remota ou configuracoes de producao sem autorizacao.
- Confirmar que o plano de rollback esta claro antes do deploy.

## 6. Rollback

- Toda release deve ter caminho de reversao conhecido.
- Rollback pode ser revert de PR, redeploy de versao anterior ou mitigacao operacional, conforme o caso.
- Em incidente N2 ou N3, rollback deve ser considerado antes de investigacoes longas.

## 7. Pos-deploy

- Verificar app online.
- Verificar login quando aplicavel.
- Verificar fluxos criticos afetados.
- Conferir erros e sinais de degradacao.
- Registrar resultado do pos-deploy.
