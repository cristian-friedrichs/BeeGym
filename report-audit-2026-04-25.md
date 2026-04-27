# Auditoria Completa — Banco de Dados ↔ Aplicação (APP + ADMIN)

**Data:** 2026-04-25
**Projeto Supabase:** `uxctvbpulvmkghaoobia` (BeeGym)
**Foco:** (A) Segurança e (B) Consistência código ↔ schema
**Método:** Schema vivo via MCP Supabase + leitura de código fonte. Nenhuma alteração foi aplicada.

> **Severidade:** 🔴 CRÍTICO (exploit/quebra fluxo) · 🟠 ALTO (risco real ou bug ativo) · 🟡 MÉDIO (degradação ou inconsistência) · 🔵 BAIXO (melhoria)

---

## Sumário executivo

- 36 tabelas em `public`, todas com RLS ativo. Mas **17 dessas tabelas têm policies legacy permissivas convivendo com policies novas**, anulando restrições por role (admin-only).
- **2 backdoors** com email hardcoded `cristian_friedrichs@live.com` (SQL de support + `lib/auth-utils.ts`).
- **Inconsistência grave de roles**: banco tem `'OWNER'` e `'admin'` (lowercase); policies/SQL esperam `'ADMIN'`/`'INSTRUCTOR'`. **Usuários reais não satisfazem as policies "novas"** — só passam pelas legacy.
- **Função `get_auth_org_id()` quebrada** — referencia tabela inexistente `public.users`.
- **Webhook Kiwify autentica via query-string**, sem HMAC, sem rate-limit.
- **8 tabelas referenciadas no código não existem** no banco — features quebradas (RBAC, treinos, agendamento, presença).
- **35 FKs sem índice** (CASCADEs em cadeia caem em seq-scan).
- **Materialized views `mv_financial_summary` e `mv_workout_stats` expostas via API** — vazam dados entre orgs.

---

## A — SEGURANÇA

### A1. 🔴 Policies legacy + novas convivendo (privilege escalation)

Padrão: dois conjuntos coexistem. Antigas usam `roles {public}` (cobre `anon`+`authenticated`+`service_role`) com filtro só por `organization_id`. Novas usam `roles {authenticated}` com check de role. Em RLS, **policies somam (OR)** — a mais permissiva vence.

**Resultado:** policies "admin-only" e "staff-only" estão **sem efeito**.

| Tabela | Policy legacy permissiva | Policy nova restritiva (anulada) |
|---|---|---|
| `students` | `Manage students of own org` (ALL, public) | `admins_delete_students`, `admins_instructors_create_students`, `admins_instructors_update_students` |
| `instructors` | `Gerenciar instrutores da org` (ALL, public) | `admins_manage_instructors` |
| `membership_plans` | `Gerenciar planos da própria org`, `Allow all access for own organization` | `admins_manage_plans` |
| `plans` | `Usuários gerenciam planos` (ALL, public) | `admins_manage_old_plans` |
| `class_templates` | `Users can only access class templates from their organization` (ALL) | `admins_manage_class_templates` |
| `invoices` | `Users can only access invoices from their organization` (ALL) | `admins_manage_invoices`, `admins_view_invoices` |
| `student_measurements` | `Manage measurements of own org` (ALL) | `restricted_manage_measurements`, `restricted_view_measurements` |
| `student_plan_history` | `Users can update plan history for their org` | `admins_manage_plan_history` |
| `workouts` | `Users can only access workouts from their organization` | `staff_manage_workouts` |
| `workout_exercises` | `Users can only access workout exercises...` | `staff_manage_workout_exercises` |
| `rooms` | `Usuários gerenciam salas da sua org` | `admins_manage_rooms` |
| `event_enrollments` | `Manage enrollments of own org` | `staff_manage_event_enrollments` |
| `system_logs` | `Sistema cria logs` (INSERT, public) | `authenticated_create_system_logs` |
| `app_roles` | `Gerenciar roles da org` (ALL, public) | `admins_manage_roles` |

**Exploits concretos:**
- INSTRUCTOR consegue **deletar alunos** (deveria ser admin-only).
- Qualquer membro consegue **mudar planos/preços, criar invoices, alterar permissões/roles, deletar instrutores**.
- STAFF (supostamente "view-only") consegue CRUD.

**Correção:** dropar todas as policies legacy. Antes, alinhar role storage (ver A4) — caso contrário quebra tudo.

### A2. 🔴 `saas_coupons` policy `USING (true)` para role `public`

```sql
"Allow service role full access to coupons"
cmd=ALL  roles={public}  qual=true  with_check=null
```

`{public}` ≠ `service_role`. Inclui `anon`. Combinado com `Allow public read of active coupons`, qualquer **anônimo** pode `INSERT/UPDATE/DELETE` em cupons SaaS.

**Correção:** `TO service_role` (ou simplesmente remover — service_role bypassa RLS por padrão).

### A3. 🟠 Backdoor de email hardcoded — 2 lugares

**SQL** (policies de `support_tickets`, `support_messages`):
```sql
profiles.role = 'BEEGYM_ADMIN' OR auth.jwt()->>'email' = 'cristian_friedrichs@live.com'
```

**Código** [src/lib/auth-utils.ts:32-33](src/lib/auth-utils.ts#L32-L33):
```ts
const isMasterEmail = user.email?.toLowerCase() === 'cristian_friedrichs@live.com';
const isAdminUser = userRole === 'BEEGYM_ADMIN' || isMasterEmail;
```

Mesmo padrão em [src/middleware.ts:110-112](src/middleware.ts#L110-L112).

**Risco:** comprometer essa conta = admin total (banco + app). Sem revogação, sem expiração.

**Correção:** flag `is_super_admin` em `profiles` (ou `app_metadata.is_super_admin`); remover OR de email.

### A4. 🔴 Roles inconsistentes — policies novas não funcionam

**Estado em `profiles` (real):**
| role | count |
|---|---|
| `OWNER` | 5 |
| `admin` | 4 |

**Policies do banco verificam:** `auth_user_role() = 'ADMIN'` ou `= ANY(ARRAY['ADMIN', 'INSTRUCTOR'])`.

`'OWNER'` ≠ `'ADMIN'`, `'admin'` ≠ `'ADMIN'`. **Nenhum usuário atual passa nas policies "admins_*"**. Operam só porque as policies legacy (A1) liberam. Se A1 for corrigido sem alinhar isso, **toda função admin morre**.

**Onde `role` é gravado divergente:**
- [src/actions/onboarding.ts:107](src/actions/onboarding.ts#L107) → `'OWNER'` (uppercase)
- [src/app/api/admin/contratantes/create/route.ts:96](src/app/api/admin/contratantes/create/route.ts#L96) → `'owner'` (**lowercase**)
- `requireAdmin` aceita `'BEEGYM_ADMIN'`; outros pontos gravam `'admin'`.
- `types/supabase.ts:2435` declara `UserRole: ['OWNER','ADMIN','MANAGER','INSTRUCTOR','STAFF']` — `BEEGYM_ADMIN` nem aparece.

**Correção:** (a) ENUM Postgres `('SUPER_ADMIN','OWNER','ADMIN','INSTRUCTOR','STAFF')`, (b) migrar dados (`UPDATE profiles SET role = UPPER(role)`), (c) policies aceitando `OWNER` onde só aceitam `ADMIN`, (d) `requireAdmin` checando contra set explícito.

### A5. 🔴 `get_auth_org_id()` referencia tabela inexistente

```sql
CREATE FUNCTION public.get_auth_org_id() RETURNS uuid
LANGUAGE sql SECURITY DEFINER
AS $$ SELECT organization_id FROM public.users WHERE id = auth.uid() $$;
```

Não existe `public.users` — deveria ser `public.profiles`. Chamada via policies de `membership_plans` (`Allow all access for own organization`, `Allow read access for own organization`) retorna `relation "public.users" does not exist` → policy falha → cai no fallback legacy. Quando A1 for aplicado, **bloqueia acesso a `membership_plans`** para todos.

**Correção:** trocar por `FROM public.profiles WHERE id = auth.uid()`, ou consolidar com `auth_user_org_id()` (já existe e funciona).

### A6. 🟠 SECURITY DEFINER sem `SET search_path`

`auth_user_role()`, `check_booking_eligibility(uuid, date)`, `decrement_student_credits`, `get_auth_org_id`, `handle_new_user` — todos DEFINER, todos sem `SET search_path = public, pg_temp`. Único DEFINER blindado: `auth_user_org_id`.

Permite hijack via schema malicioso (CVE-clássico Postgres).

**Correção:** `ALTER FUNCTION ... SET search_path = public, pg_temp;` em cada uma.

Outras 17 funções INVOKER também têm warning, menos exploráveis.

### A7. 🟠 Webhook Kiwify sem HMAC, sem rate-limit, token em query-string

[src/app/api/webhooks/kiwify/route.ts:23-27](src/app/api/webhooks/kiwify/route.ts#L23-L27):
```ts
const token = searchParams.get('token');
if (token !== KIWIFY_TOKEN) { ... return 403 }
```

- Token em URL vai para logs do Vercel/CDN/proxies/browser history.
- Sem `withRateLimit` (todas as outras admin routes têm).
- Sem assinatura HMAC do payload (Kiwify suporta).
- Insert de `auth_failed` em `webhook_logs` pode ser usado para encher a tabela (DoS leve).

**Correção:** mover token para header (`x-kiwify-token`); idealmente HMAC do body com secret.

### A8. 🟠 Middleware usa `getSession()` em vez de `getUser()`

[src/middleware.ts:42-43](src/middleware.ts#L42-L43):
```ts
const { data: { session } } = await supabase.auth.getSession()
```

`getSession()` lê do cookie sem revalidar com Auth server. Vetor de "sessão forjada via cookie roubado". Best practice Next 14+/Supabase SSR: `await supabase.auth.getUser()`.

### A9. 🟠 Materialized views vazam dados entre orgs

Advisor flagou:
- `mv_financial_summary` selectable por `anon`/`authenticated`
- `mv_workout_stats` idem

MVs **não têm RLS**. `SELECT * FROM mv_financial_summary` por qualquer authenticated retorna **finance de todas as orgs**.

**Correção:** `REVOKE SELECT ... FROM anon, authenticated`; expor via `view` com filtro `organization_id = auth_user_org_id()`.

### A10. 🟡 Buckets públicos com `LIST` permitido

Advisor: `avatars`, `images`, `logos`, `students`. Política em `storage.objects` permite enumeração de arquivos. Vaza listagens (nomes de arquivos podem revelar nomes de alunos).

**Correção:** restringir SELECT a path-prefix do user; URL pública continua acessível.

### A11. 🟡 `system_logs` INSERT muito frouxo

Policy: `INSERT roles=public, with_check: organization_id IN (profiles WHERE id = auth.uid())`. Qualquer authenticated forja `action`, `resource`, `metadata`. Útil para "log poisoning" se logs forem usados em compliance.

**Correção:** restringir INSERT a service_role; popular via trigger ou validar `action` em whitelist no `with_check`.

### A12. 🔵 Leaked password protection desativado

Auth advisor: HaveIBeenPwned check off. Custo zero, ligar via dashboard.

### A13. 🟡 `client.ts` instancia browser client no top-level

[src/lib/supabase/client.ts:14](src/lib/supabase/client.ts#L14):
```ts
export const supabase = createClient();  // executa no import
```

Em SSR/SSG, lê `process.env.NEXT_PUBLIC_*` durante import. Não vaza (são `NEXT_PUBLIC_`), mas: (a) cada import re-instancia, (b) quebra tree-shaking, (c) `!` pode lançar em build sem env. Best practice: exportar só a função `createClient`.

---

## B — CONSISTÊNCIA CÓDIGO ↔ SCHEMA

### B1. 🔴 Tabelas referenciadas no código que não existem

Todas usam `(supabase as any).from(...)` para mascarar erro de tipo.

| Arquivo:linha | Tabela inexistente | Provável intenção | Impacto |
|---|---|---|---|
| [src/components/treinos/workout-execution-sheet.tsx:69](src/components/treinos/workout-execution-sheet.tsx#L69) | `workout_executions` | registrar execução | INSERT silencioso falha — execução não persiste |
| [src/components/treinos/workout-details-sheet.tsx:105](src/components/treinos/workout-details-sheet.tsx#L105) | `workout_executions` | idem | idem |
| [src/components/painel/modals/session-manager-modal.tsx:97,144,146](src/components/painel/modals/session-manager-modal.tsx#L97) | `workout_logs` | logs de sessão | SELECT/DELETE/INSERT — gestor de sessão quebrado |
| [src/components/painel/modals/event-details-modal.tsx:456](src/components/painel/modals/event-details-modal.tsx#L456) | `workout_logs` | idem | idem |
| [src/components/painel/live-class-card.tsx:177](src/components/painel/live-class-card.tsx#L177) | `attendance_logs` | check-in aula ao vivo | Presença não grava |
| [src/lib/rbac.ts:27](src/lib/rbac.ts#L27) | `roles` | permissões custom | RBAC custom **nunca aplica** — todos caem no `getDefaultPermissionsForRole`. Era pra ser `app_roles` |
| [src/components/painel/clients/new/steps/scheduling-step.tsx:218](src/components/painel/clients/new/steps/scheduling-step.tsx#L218) | `subscriptions` | criar assinatura de aluno | Wizard "novo aluno" trava ao salvar |

**Correção:** decidir feature a feature: criar a tabela ou refatorar para usar a existente. `roles` → `app_roles`. `subscriptions` (de aluno) → consolidar em `student_plan_history`. Para presença/treino/execução: precisa design.

### B2. 🔴 Colunas inexistentes em `students` referenciadas pelo código

[src/components/painel/clients/new/steps/scheduling-step.tsx:204-209](src/components/painel/clients/new/steps/scheduling-step.tsx#L204-L209) faz INSERT em `students`:

| Campo enviado | Coluna real | Status |
|---|---|---|
| `primary_unit_id` | `unit_id` | ❌ não existe |
| `credits_remaining` | `credits_balance` | ❌ não existe |
| `scheduling_mode` | (nenhuma) | ❌ não existe |

[src/app/app/(authenticated)/alunos/[id]/page.tsx:75-79](src/app/app/(authenticated)/alunos/(id)/page.tsx#L75-L79):
```ts
if (student.primary_unit_id) { /* sempre false → unidade nunca carrega */ }
```

**Impacto:** criação de aluno via wizard falha; perfil não exibe unidade.

### B3. 🟠 `subscription_status` divergente entre escritores

| Escritor | Valores |
|---|---|
| Webhook Kiwify | `active`, `pending`, `past_due`, `canceled` (lowercase) |
| Onboarding action | `pending` |
| Admin create contratante | `active` ou `teste` (lowercase) |
| Admin POST contratante | `INADIMPLENTE`, `ATIVO`, `INATIVO` (**uppercase**) |
| Banco hoje | `pending` (3), `active` (1), `trial` (1) |

Leitor [src/middleware.ts:143-144](src/middleware.ts#L143-L144):
```ts
const activeStatuses = ['active', 'pago', 'ativo', 'trial'];
const currentStatus = (org?.subscription_status || '').toLowerCase().trim();
```

Funciona "por acidente" via `.toLowerCase()`. Mas:
- `'past_due'` (Kiwify) → bloqueia ✅ (intencional)
- `'canceled'` (Kiwify) → bloqueia ✅
- `'INADIMPLENTE'` (admin) → bloqueia ✅
- `'pago'` está na whitelist mas **ninguém grava** isso

Sem CHECK/ENUM, qualquer typo passa silencioso.

**Correção:** ENUM `subscription_status_t AS ENUM ('active','trial','pending','past_due','canceled','suspended')`; padronizar todos os escritores; atualizar middleware.

### B4. 🟠 `saas_subscriptions.status` mistura uppercase/lowercase

- Onboarding: `pending`
- Admin POST: `ATIVO`, `INATIVO`, `INADIMPLENTE`
- Admin create: `TESTE`, `ATIVO`
- Webhook: `active`, `pending`, `past_due`, `canceled`

Leitores como `useSubscription`, `SupabaseAssinaturaRepository.findActiveByOrganization()` comparam de jeitos diferentes. **Risco real de hard-paywall liberar/bloquear errado.**

**Correção:** ENUM + migrate.

### B5. 🟡 Types TS duplicados em 2 arquivos

[src/types/supabase.ts](src/types/supabase.ts) e [src/lib/supabase/database.types.ts](src/lib/supabase/database.types.ts) são **idênticos byte-a-byte** (4876 linhas). Vão divergir.

**Correção:** apagar um, atualizar imports.

### B6. 🟡 ENUMs lógicos no TS que não existem no banco

[src/types/supabase.ts:2417-2438](src/types/supabase.ts#L2417-L2438):
```ts
UserRole: ["OWNER","ADMIN","MANAGER","INSTRUCTOR","STAFF"]
StudentStatus: ["ACTIVE","INACTIVE","CANCELED"]
EventStatus: ["PREVISTA","EM_EXECUCAO","PENDENTE","REALIZADA","FALTA"]
```

Banco usa `text` sem CHECK. **Nada impede valores fora**. `BEEGYM_ADMIN` (usado em `requireAdmin` e policies) **nem está** em `UserRole`. Schema-drift garantido.

**Correção:** criar ENUM Postgres reais, migrar dados, regenerar types.

### B7. 🟠 `updated_at` mente em 6 tabelas

Tabelas com coluna `updated_at` mas sem trigger `BEFORE UPDATE`:
- `profiles`, `organizations`, `chats`, `saas_subscriptions`, `membership_plans`, `student_medical_records`

Algumas rotas atualizam manualmente no payload, outras não. Timestamp é inconfiável.

**Correção:** trigger `BEFORE UPDATE EXECUTE FUNCTION update_updated_at_column()` (função já existe) em cada tabela.

### B8. 🟠 `profiles` sem FK para `auth.users` nem `organizations`

- `profiles.id` é PK mas **sem FK** para `auth.users(id)` — pode ter profile órfão se auth user é deletado.
- `profiles.organization_id` é uuid livre, **sem FK** — pode apontar para org inexistente.
- `profiles.role_id → app_roles.id` existe ✅, mas sem composite check; role-switch cross-org é teoricamente possível.

**Correção:** adicionar FKs com `ON DELETE CASCADE` (auth.users) e `ON DELETE SET NULL` (organizations). Validar inconsistências antes.

### B9. 🟡 `saas_subscriptions.organization_id` é nullable

Schema mostra `organization_id:uuid` (sem NOT NULL). Pode haver assinatura órfã. Quebra unicidade do upsert e JOINs do dashboard admin.

**Correção:** `ALTER TABLE saas_subscriptions ALTER COLUMN organization_id SET NOT NULL;` (após validar zero NULLs).

### B10. 🟡 `users_view_org_profiles` filtra por `show_public_profile`

Policy:
```sql
USING ((organization_id = auth_user_org_id()) AND (show_public_profile = true))
```

Para um membro ver outros perfis, o outro precisa ter `show_public_profile=true`. Mas:
- `handle_new_user` **não seta** essa coluna
- Onboarding **não pede** consentimento

→ Recém-cadastrados são invisíveis na lista de equipe; chat pode quebrar com `vw_chat_contacts` que provavelmente JOINa profiles.

**Correção:** default `true` na coluna ou setar em `handle_new_user`.

### B11. 🟠 Duas versões de `check_booking_eligibility`

- `(uuid, date)` — usa `membership_plans` (correto, novo)
- `(uuid, timestamptz)` — usa `plans` (legacy)

`supabase.rpc('check_booking_eligibility', {...})` resolve por tipo. JS manda string ISO → Postgres pode escolher qualquer um → pode validar contra schema legacy errado.

**Correção:** dropar versão legacy `(uuid, timestamptz)`.

### B12. 🔵 `pending_workouts_view` aparece como tabela

`information_schema.columns` lista views como `pending_workouts_view`, `vw_chat_*`, `vw_payments`. São views. Não bug, só nomenclatura confusa.

---

## PERFORMANCE

### P1. 🟠 35 FKs sem índice

FKs com `ON DELETE CASCADE` sem índice na coluna referenciante. DELETE em `organizations` faz seq-scan em cada tabela dependente.

**Lista:** `calendar_events.{class_template_id, instructor_id, student_id, room_id, unit_id}`, `chat_messages.reply_to_id`, `class_templates.organization_id`, `event_enrollments.{student_id, event_id}`, `financial_summary.organization_id`, `instructors.{organization_id, user_id}`, `membership_plans.organization_id`, `notifications.user_id`, `organizations.plan_id`, `plans.organization_id`, `profiles.role_id`, `rooms.{organization_id, unit_id}`, `saas_subscriptions.{plan_paid_id, coupon_id, saas_plan_id, pending_plan_id}`, `student_credits_log.student_id`, `student_plan_history.plan_id`, `students.{plan_id, unit_id}`, `support_messages.sender_id`, `support_tickets.organization_id`, `units.organization_id`, `workout_exercises.{workout_id, exercise_id}`, `workouts.{room_id, instructor_id}`.

**Correção:** `CREATE INDEX CONCURRENTLY` em cada uma.

### P2. 🟡 `admin/contratantes/route.ts` carrega students full-scan

[src/app/api/admin/contratantes/route.ts:58-68](src/app/api/admin/contratantes/route.ts#L58-L68): `SELECT organization_id FROM students WHERE status IN (...)` sem limite, para contar alunos por org em memória. Em escala, ruim.

**Correção:** `SELECT organization_id, COUNT(*) FROM students WHERE ... GROUP BY organization_id` ou MV.

---

## OUTROS

### O1. `instructors.id = user.id` em onboarding

[src/actions/onboarding.ts:119-125](src/actions/onboarding.ts#L119-L125): força `id: user.id` no upsert. `instructors.id` deveria ser auto-gerado; relação user→instructor é via `user_id`. Mistura semântica de PK e impede multi-org futuro.

### O2. Onboarding sem rollback transacional

[src/actions/onboarding.ts](src/actions/onboarding.ts) faz 4-5 operações em sequência sem transação. Falha no passo 4 deixa org+profile+instructor meio-prontos.

**Correção:** wrap em função SQL DEFINER transacional, ou rollback manual no catch.

### O3. Arquivos soltos na raiz

Ruído / risco de execução acidental:
- `apply_rls.sql`, `seed_profile.sql`, `import_exercises.sql`, `students_schema.txt`
- `report-tables.md`, `report-audit.md`
- `tsc-errors.log`, `tsc_output.txt`, `tsc-errors.txt`, `tsc_errors.txt`, `tsc_errors_2.txt`, `tsc_final.txt`
- `build.log`, `build_output.log`, `build_raw.log`, `full_build_output.txt`, `lint_output.txt`, `errors.txt`, `debug_onboarding.log`
- `schema_backup.sql` (vazio)

Mover para `docs/audits/` ou `.gitignore`.

---

## Plano de correção sugerido (ordem segura)

1. **Snapshot do banco** (Supabase backup) antes de qualquer DDL.
2. **A4** — alinhar roles: ENUM, migrar dados, atualizar `requireAdmin`, atualizar policies.
3. **A5** — fix `get_auth_org_id()`.
4. **A1** — drop policies legacy (uma tabela por vez, testar entre cada).
5. **A2** — fix `saas_coupons`.
6. **A3** — remover backdoor de email (após confirmar `BEEGYM_ADMIN` em conta de fallback).
7. **A6** — `SET search_path` nos DEFINER.
8. **A9** — revogar grants das MVs.
9. **A10** — restringir LIST nos buckets.
10. **B1, B2** — corrigir tabelas/colunas inexistentes (criar tabelas faltantes ou refatorar).
11. **B3, B4** — ENUMs de status, migrar dados.
12. **B7** — triggers `updated_at`.
13. **B8** — FKs em `profiles`.
14. **B5, B6** — consolidar types TS, regenerar via `supabase gen types`.
15. **A7** — refazer auth do webhook Kiwify.
16. **A8** — `getUser()` no middleware.
17. **P1** — índices CONCURRENTLY.
18. **A12** — leaked password protection on.

---

## Não coberto

- Edge functions (não há).
- Policies de schemas `auth`/`storage` além das listadas pelo advisor.
- Jobs/crons em `/api/cron/*` (não lidos em profundidade).
- UI puramente apresentacional.
- Alinhamento UX página-a-página (fase D do plano original) — fazer após correções acima.

Supabase MCP usado em modo leitura. Nenhuma migração aplicada.
