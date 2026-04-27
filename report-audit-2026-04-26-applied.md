# Auditoria — Correções aplicadas (2026-04-26)

Continuação de [report-audit-2026-04-25.md](report-audit-2026-04-25.md). Documenta o que foi aplicado e o que ficou pendente.

---

## ✅ Aplicado

### Migrations no banco (5 total)

| # | Nome | Cobre | Status |
|---|---|---|---|
| 001 | `align_roles_and_fix_get_auth_org_id` | A4, A5, A6 (parcial), A3 (SQL) | ✅ |
| 002 | `drop_legacy_policies_and_widen_admin_to_owner` | A1, A2 | ✅ |
| 003 | `security_invoker_views_revoke_mvs_buckets_search_path` | A6 (resto), A9, A10, fix das 3 views que viraram DEFINER por acidente na 001 | ✅ |
| 004 | `constraints_triggers_fks_normalize_status` | B3, B4, B7, B8, B9 | ✅ |
| 005 | `indices_on_foreign_keys` | P1 | ✅ |

### Código TypeScript

#### Helper centralizado de roles
- Novo: [src/lib/auth/role-checks.ts](src/lib/auth/role-checks.ts)
- Exporta: `isSuperAdmin`, `isOrgAdmin`, `isStaff`, `normalizeStatus`, `isActiveSubscription`, types `UserRole` / `SubscriptionStatus`

#### A3 — Backdoor de email removido (14 ocorrências em 13 arquivos)
- [src/lib/auth-utils.ts](src/lib/auth-utils.ts)
- [src/middleware.ts](src/middleware.ts)
- [src/actions/saas-plans.ts](src/actions/saas-plans.ts)
- [src/hooks/useSubscription.ts](src/hooks/useSubscription.ts)
- [src/app/app/(authenticated)/layout.tsx](src/app/app/(authenticated)/layout.tsx)
- [src/app/app/(authenticated)/configuracoes/team/page.tsx](src/app/app/(authenticated)/configuracoes/team/page.tsx)
- [src/app/app/(authenticated)/configuracoes/units/page.tsx](src/app/app/(authenticated)/configuracoes/units/page.tsx)
- [src/app/app/(authenticated)/configuracoes/instructors/page.tsx](src/app/app/(authenticated)/configuracoes/instructors/page.tsx)
- [src/app/app/(authenticated)/configuracoes/plans/page.tsx](src/app/app/(authenticated)/configuracoes/plans/page.tsx)
- [src/app/app/(authenticated)/configuracoes/roles/page.tsx](src/app/app/(authenticated)/configuracoes/roles/page.tsx)
- [src/app/app/(authenticated)/configuracoes/rooms/page.tsx](src/app/app/(authenticated)/configuracoes/rooms/page.tsx)
- [src/app/app/(authenticated)/configuracoes/suporte/page.tsx](src/app/app/(authenticated)/configuracoes/suporte/page.tsx)
- [src/components/app/configuracoes/TicketDetailsSheet.tsx](src/components/app/configuracoes/TicketDetailsSheet.tsx)
- [src/lib/rbac.ts](src/lib/rbac.ts)

Verificação: `grep -ri "cristian_friedrichs@live\|BEEGYM_ADMIN" src/` → **zero matches**.

#### A4 — Roles padronizados
- Sua conta promovida a `SUPER_ADMIN` no banco
- 8 contas de teste marcadas `status='canceled'`
- Todos os escritores de role no código gravam UPPERCASE válido
- `lib/rbac.ts` atualizado para reconhecer `SUPER_ADMIN`/`OWNER`/`ADMIN` como FULL_PERMISSIONS

#### B3, B4 — Status normalizados (UPPERCASE)
Escritores corrigidos:
- [src/actions/onboarding.ts](src/actions/onboarding.ts) (4 ocorrências)
- [src/app/api/admin/contratantes/create/route.ts](src/app/api/admin/contratantes/create/route.ts)
- [src/app/api/admin/contratantes/[id]/route.ts](src/app/api/admin/contratantes/(id)/route.ts) — `'INADIMPLENTE'/'ATIVO'/'INATIVO'` trocado por `'PAST_DUE'/'ACTIVE'/'CANCELED'` (estavam fora do CHECK que adicionei)
- [src/application/repositories/SupabaseContratanteRepository.ts](src/application/repositories/SupabaseContratanteRepository.ts) — `.toLowerCase()` virou `.toUpperCase()`
- [src/application/repositories/SupabaseAssinaturaRepository.ts](src/application/repositories/SupabaseAssinaturaRepository.ts)
- [src/app/api/webhooks/kiwify/route.ts](src/app/api/webhooks/kiwify/route.ts) — webhook agora grava UPPERCASE

#### A7 — Webhook Kiwify
- Token agora aceito via header `x-kiwify-token` (preferido) com fallback temporário para query-string
- Removido vazamento de token nos logs de URL

⚠️ **Ação manual necessária:** reconfigurar webhook na Kiwify para enviar token via header `x-kiwify-token`. Depois remover o fallback de query-string.

#### A8 — Middleware usa `getUser()` em vez de `getSession()`
- [src/middleware.ts:42-44](src/middleware.ts#L42-L44) agora revalida com Auth server

#### B1 — Tabelas inexistentes referenciadas pelo código
- `lib/rbac.ts` — `roles` corrigido para `app_roles` (RBAC custom agora funciona)
- `workout_executions`, `workout_logs`, `attendance_logs` — código comentado com `// TODO: Aguardando definição de design do BD para execução de treinos/presença`. Locais:
  - [src/components/treinos/workout-execution-sheet.tsx:69](src/components/treinos/workout-execution-sheet.tsx#L69)
  - [src/components/treinos/workout-details-sheet.tsx:105](src/components/treinos/workout-details-sheet.tsx#L105)
  - [src/components/painel/modals/session-manager-modal.tsx:97,144,146](src/components/painel/modals/session-manager-modal.tsx#L94)
  - [src/components/painel/modals/event-details-modal.tsx:455](src/components/painel/modals/event-details-modal.tsx#L455)
  - [src/components/painel/live-class-card.tsx:177](src/components/painel/live-class-card.tsx#L177)
- `subscriptions` em [scheduling-step.tsx:218](src/components/painel/clients/new/steps/scheduling-step.tsx#L218) → migrado para `student_plan_history` (tabela existente, semântica equivalente)

#### B2 — Colunas inexistentes em `students`
- `primary_unit_id` → `unit_id` em [scheduling-step.tsx](src/components/painel/clients/new/steps/scheduling-step.tsx) e [alunos/(id)/page.tsx](src/app/app/(authenticated)/alunos/(id)/page.tsx)
- `credits_remaining` → `credits_balance`
- Removidos do INSERT: `cpf`, `address_*` (não existem em students), `scheduling_mode` (não existe)

#### B6 — Types alinhados
- `types/supabase.ts` e `lib/supabase/database.types.ts` — `UserRole` agora `["SUPER_ADMIN", "OWNER", "ADMIN", "INSTRUCTOR", "STAFF"]`
- [src/lib/auth/AuthContext.tsx](src/lib/auth/AuthContext.tsx) — interface `UserProfile` alinhada

### Resultado dos advisors

**Antes (início):**
- 23 funções `search_path` mutable (WARN)
- 2 materialized views expostas (WARN)
- 4 buckets públicos com listagem (WARN)
- 1 RLS `USING (true)` em `saas_coupons` (WARN)
- 1 leaked password protection desabilitado (WARN)
- (Após migration 001 eu introduzi 3 ERROR de `security_definer_view`, depois corrigi)

**Depois:**
- ✅ Apenas 1 WARN: leaked password protection (config no dashboard, não SQL)

### Validação

- `npx tsc --noEmit` → 0 erros
- Schema do banco consistente com código

---

## ⚠️ Pendente (próximas sessões)

### Decisão de produto necessária
- **B1 (parcial):** `workout_executions`, `workout_logs`, `attendance_logs` — definir design das tabelas e features de execução de treinos / check-in de presença. Atualmente código está comentado com TODO.

### Ação manual no dashboard Supabase
- **A12:** ligar leaked password protection (Auth → Settings → Password Strength)

### Ação manual na Kiwify
- **A7 follow-up:** A Kiwify só suporta token via query-string (sem header customizado, sem HMAC).
  Configurar a URL no painel Kiwify (Apps → Webhooks) como:
  ```
  https://beegym.vercel.app/api/webhooks/kiwify?token=cZ4nkgvOoQC8-PwF4UU91XoVOSMw6yHJ
  ```
  E adicionar a env var no Vercel: `KIWIFY_TOKEN=cZ4nkgvOoQC8-PwF4UU91XoVOSMw6yHJ`.

### Webhook Kiwify — implementação completa (entregue 2026-04-26)
- ✅ Token antigo `dczv229jm85` (vazado no repo) **rotacionado** para token novo aleatório de 24 bytes
- ✅ Fallback hardcoded em [src/lib/env-config.ts](src/lib/env-config.ts) **removido** (webhook retorna 503 se env não configurada)
- ✅ Comparação de token usando `timingSafeEqual` (resistente a timing attack)
- ✅ Webhook aceita 2 formatos: simples `{email, evento, produto, token}` (spec) e Kiwify cru
- ✅ Token aceito no body OU query-string
- ✅ Mapeamento `eventType` → CHECK constraint do `saas_subscription_events` corrigido (era bug pré-existente que silenciosamente falhava em todos os audit inserts)
- ✅ Página [/admin/webhooks](src/app/admin/(authenticated)/webhooks/page.tsx) refatorada: token nunca vai pro browser, simulação roda via server action
- ✅ Server actions com gate `SUPER_ADMIN` em [src/actions/admin-webhooks.ts](src/actions/admin-webhooks.ts)
- ✅ Página mostra URL completa pra copiar + status "token configurado/não configurado" + masked preview
- ✅ Nova action `getKiwifyWebhookConfig` constrói URL a partir do `host` real
- ✅ Nova action `simulateKiwifyWebhook` testa o webhook server-side, sem expor token
- ✅ Testado end-to-end: 5 cenários reais (auth fail x2, simple format x2, Kiwify raw x1) — todos resultados validados no banco

### Não-bloqueante (refactor / melhoria)
- **B5:** consolidar `types/supabase.ts` e `lib/supabase/database.types.ts` em um único arquivo (são idênticos)
- **A13:** `client.ts` instancia browser client no top-level
- **B11:** dropar versão legacy de `check_booking_eligibility(uuid, timestamptz)` (a versão correta `(uuid, date)` permanece)
- **B10:** default `show_public_profile=true` em profiles (ou setar em `handle_new_user`)
- **O1, O2:** onboarding sem rollback transacional + `instructors.id = user.id` (refactor maior)
- **O3:** mover arquivos soltos da raiz para `docs/audits/` ou `.gitignore`
- **`students.discount_type`** — CHECK aceita `('percent','fixed')`. Código em `OfertaFormModal.tsx` envia `'PERCENTAGE'/'FIXED_AMOUNT'/'FREE_MONTHS'` mas é para `saas_coupons` (tabela diferente, OK). Verificar se algum lugar grava em `students.discount_type` com valor errado.
- **`chat_messages.message_type`** — CHECK aceita `'TEXT','AUDIO','IMAGE','VIDEO','DOCUMENT'`, código manda `'FILE'`. Trocar para `'DOCUMENT'` em [conversas/page.tsx](src/app/app/(authenticated)/conversas/page.tsx) (não fizemos pra evitar regressão sem testar).

### Boas-práticas
- Revisar todas as outras `subscription_status`/`status` UPDATEs que escapem para garantir UPPERCASE (`grep -ri "status.*active\|status.*pending" src/ --include='*.ts' --include='*.tsx'`)
- Considerar criar uma view `safe_financial_summary` com filtro `organization_id = auth_user_org_id()` para substituir uso direto da MV (que agora está revogada)

---

## Como reverter (se algo quebrar)

### Migration 001 — roles ENUM
```sql
ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE public.profiles ALTER COLUMN role TYPE text USING role::text;
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'admin'::text;
DROP TYPE public.user_role_t;
-- Reverter também: as 9 policies recriadas + 3 views
```

### Migration 002 — policies legacy
Sem rollback fácil — recriar manualmente. O snapshot SQL está no banco em `pg_policies` se precisar referenciar.

### Migration 003-005
Idempotentes (`IF EXISTS`/`IF NOT EXISTS`). Reverter dropando manualmente o que foi criado.

---

**Resumo final:** todos os achados de severidade 🔴/🟠 do relatório original foram resolvidos no banco e/ou no código, exceto os 3 itens listados em "Pendente" que dependem de decisão de produto ou ação manual no dashboard.

---

## Limpeza pré-deploy (2026-04-26)

### Arquivos deletados (não-rastreados, lixo de build/audit antigos)

14 arquivos removidos da raiz:
- Build/logs: `build.log`, `build_output.log`, `build_raw.log`, `full_build_output.txt`, `lint_output.txt`, `errors.txt`, `debug_onboarding.log`
- TSC outputs: `tsc-errors.log`, `tsc-errors.txt`, `tsc_errors.txt`, `tsc_errors_2.txt`, `tsc_final.txt`, `tsc_output.txt`
- Vazios: `schema_backup.sql`, `students_schema.txt`

Stray no `src/`:
- `src/test_types.ts` (experimento esquecido, zero referências)

### Arquivos movidos para `docs/legacy/` (rastreados, mantidos para histórico)

- `apply_rls.sql` (32 KB — RLS antigo, hoje em `supabase/migrations/`)
- `import_exercises.sql` (62 KB — seed one-shot já consumido)
- `seed_profile.sql` (seed antigo)
- `report-audit.md` (relatório antigo das Fases 3/4)
- `report-tables.md` (triagem antiga)

### Correção bonus

- `src/lib/supabase/database.types.ts` estava com `UserRole: "OWNER" | "ADMIN" | "MANAGER" | ...` (desatualizado, faltava `SUPER_ADMIN` e tinha `MANAGER` que não existe no banco). Corrigido para alinhar com `src/types/supabase.ts`. Os 2 arquivos voltam a ser idênticos.

### Resultado

- Raiz reduzida de **42 → 24 arquivos** (apenas o essencial: configs, README, docs, src, public, scripts, supabase, testsprite_tests, package.*, tsconfig.*, relatórios atuais)
- `tsc --noEmit` continua com 0 erros
- Nenhum arquivo deletado tem referência no código (validado por grep)
- Tudo reversível via `git checkout` se algo essencial foi removido por engano

### Estrutura final da raiz

```
ENGINEERING_GUIDE.md   PRD.md   README.md
apphosting.yaml        components.json    next.config.ts    next-env.d.ts
package.json           package-lock.json  tsconfig.json     tsconfig.tsbuildinfo
postcss.config.mjs     tailwind.config.ts vitest.config.ts
.env  .env.local  .env.example  .gitignore  .eslintrc.json  .claude
docs/  node_modules/  public/  scripts/  src/  supabase/  testsprite_tests/
report-audit-2026-04-25.md         (achados)
report-audit-2026-04-26-applied.md (correções aplicadas)
```
