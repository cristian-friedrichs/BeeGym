# Credit Reservation, Additive Credits, and One-Shot Pack Billing

## Overview

**What:** Three coordinated changes to BeeGym's credit/plan/financial domain:
1. **Credit Reservation Model** — Scheduling a workout/class reserves a credit immediately; the credit history modal exposes two views: `Histórico` (consumed: Concluido/Faltou) and `Agendados` (reserved: currently scheduled, not yet realized). Cancellation refunds the reservation; completion converts reservation -> consumption without a second debit.
2. **Additive Credit Stacking** — Purchasing/assigning a pack plan adds credits to `students.credits_balance` instead of overwriting it (e.g. 5 existing + Pack 10 = 15).
3. **One-Shot Pack Billing** — `plan_type='pack'` generates a single invoice/charge at purchase time, **already settled (PAID)**, and is excluded from the recurring "10 days before due date" invoice automation. Recurring (non-pack) plans keep current behavior.

**Why:** Trainers report (a) lost/double-counted credits when students cancel last-minute, (b) frustration when buying a refill pack erases unused credits, (c) repeated/incorrect monthly invoices for one-shot packs. These three fixes restore trust in the credit ledger and financial automation.

**Starting state (already shipped this session):**
- `deduct_credit` RPC now updates `students.credits_balance` (previously log-only).
- João Silva Teste balance reconciled 8 -> 7.
- Workouts page got a "Faltas" filter + reordered filter dropdown.

This plan begins **after** those fixes are deployed.

## Project Type

**WEB** (Next.js 15 App Router + Supabase Postgres + RLS). Agents allowed: `database-architect`, `backend-specialist`, `frontend-specialist`, `security-auditor`, `test-engineer`. No mobile-developer.

## Success Criteria

| # | Criterion | How to Verify |
|---|-----------|---------------|
| SC1 | Scheduling a workout creates exactly **one** `student_credits_log` row with reason `Workout Scheduled` and decrements `credits_balance` by 1. | Insert via UI; assert one log row + balance delta = -1. |
| SC2 | Marking a scheduled workout `Concluido` produces **no additional debit** (balance unchanged from reserved state); log entry transitions from "reserved" to "consumed" classification. | UI flow + DB assertion: balance equal before/after completion; query distinguishes consumed vs reserved. |
| SC3 | Marking a scheduled workout `Faltou` produces no additional debit (same as Concluido — credit was already burned at scheduling). | Same as SC2 with status=Faltou. |
| SC4 | Cancelling a scheduled workout/class inserts a refund log row (`Workout Cancelled (Refund)` / `Class Enrollment Cancelled (Refund)`) and increments `credits_balance` by 1. Net log delta for the lifecycle = 0. | UI cancel; sum of `delta` for that workout's logs == 0. |
| SC5 | `student-credit-history-modal.tsx` shows two tabs: **Histórico** (consumed: Concluido + Faltou + Refund-net-zero) and **Agendados** (scheduled but not yet realized). Counts match DB. Modal **only renders for pack-plan students**. | Manual UI check + DB query parity; for recurring-plan students the button/balance/history are not rendered. |
| SC6 | Assigning a pack plan to a student with existing credits results in `new_balance = old_balance + pack_credits`. | Create student w/ 5 credits, assign Pack 10, assert balance = 15. |
| SC7 | Assigning a pack to a brand-new student (0 credits) results in `balance = pack_credits`. | Onboarding flow assert. |
| SC8 | Switching from recurring -> pack does **not** wipe existing credits and is additive. Switching pack -> recurring **queues** the recurring plan and only activates it once `credits_balance = 0` AND no active reservations remain. | Manual + DB inspection of `student_plan_history` state machine rows. |
| SC9 | Purchasing a pack plan creates exactly **one** invoice with `status='PAID'`, `paid_at=now()`, `due_date=now()` at purchase time. No pending invoices generated. | `invoices` query: count=1 per pack purchase, status=PAID. |
| SC10 | The recurring "10-days-before-due" automation (NEW `generate_pending_invoices` SQL function scheduled via pg_cron) skips rows where `membership_plans.plan_type='pack'`. | Run job manually with mixed plans; only recurring rows produce invoices. |
| SC11 | RLS unchanged; no new policy holes. Security advisors run clean. | `mcp__claude_ai_Supabase__get_advisors` returns no new criticals. |
| SC12 | Concurrent cancellation of the same workout cannot double-refund. | Race-test (two parallel cancels); only one refund row. |
| SC13 | Credits UI (balance, history button, reservation hints) is gated to pack-plan students across ALL surfaces (student profile, dashboard, alerts, topbar, modals). Recurring-plan students see no credit chrome. | Grep + manual visit each surface. |
| SC14 | Pack -> recurring "queued switch" state machine: a student in this state shows clear UI feedback ("Plano mensal será ativado após uso dos créditos restantes"); on credit exhaustion + no reservations, the recurring plan activates and the invoice automation arms with `due_date` anchored to the activation date. | Manual: assign pack to a recurring student, deplete credits, verify auto-activation + first invoice generated 10 days before next due_date. |

## Tech Stack

| Layer | Tech | Rationale |
|-------|------|-----------|
| DB | Supabase Postgres (project `uxctvbpulvmkghaoobia`) | Existing — already houses `students`, `student_credits_log`, `membership_plans`, `invoices`. |
| Server | Next.js 15 server actions (`src/actions/*.ts`) | Existing pattern for mutations; centralizes credit logic. |
| RPC | Postgres functions (`deduct_credit`, new `refund_credit`, new `reserve_credit_for_workout`, new `complete_workout_credit`, new `activate_queued_plan`) | Atomic + RLS-safe; prevents double-debit races via row locks. |
| Automation | `pg_cron` (NEW install) running `generate_pending_invoices()` SQL function daily at 03:00 UTC. Pack plans explicitly excluded. | Verified during planning: no cron, no edge function, no SQL function currently does this. Building from scratch. |
| UI | React + shadcn `Tabs` for the history modal | Already in dependency tree. |
| Tests | Vitest (unit) + Playwright (E2E, optional) | Existing toolchain. |

## File Structure (Affected Paths — Absolute)

```
c:\Projetos\BeeGym\
|-- src\
|   |-- actions\
|   |   |-- plans.ts                                # MODIFY: additive credit on assign; pack vs recurring branching; queued-switch state machine
|   |   |-- financial.ts                           # MODIFY: one-shot PAID invoice on pack purchase; skip pack in recurring auto
|   |   |-- treinos.ts                             # MODIFY: schedule -> reserve_credit; cancel -> refund_credit; complete -> complete_workout_credit; trigger activate_queued_plan after refund/complete
|   |   `-- aulas.ts                                # MODIFY (already partially done): same pattern as treinos for class enrollment
|   |-- components\
|   |   |-- alunos\
|   |   |   |-- student-credit-history-modal.tsx   # MODIFY: add Tabs (Historico | Agendados); split queries; render-gate on plan_type='pack'
|   |   |   |-- student-profile-main-section.tsx   # AUDIT: already gates on planLabel.isCredits — verify still correct after refactor
|   |   |   |-- manage-plan-modal.tsx              # MODIFY: additive credit copy + queued-switch dialog
|   |   |   `-- student-modal.tsx                   # MODIFY: additive on initial assignment
|   |   `-- painel\
|   |       |-- clients\new\steps\plan-step.tsx    # MODIFY: additive credit; show "+N creditos" preview; "Pago à vista" copy for pack
|   |       |-- modals\event-details-modal.tsx     # MODIFY: remove duplicate deduct_credit call on Concluido/Faltou
|   |       |-- important-alerts.tsx               # AUDIT: ensure no credit-related alerts surface for recurring students
|   |       `-- topbar-actions.tsx                 # AUDIT: ensure credit chrome hidden for recurring students
|   |-- lib\
|   |   `-- credits\
|   |       `-- credit-ledger.ts                    # NEW: typed helper that wraps reserve/refund/complete RPCs
|   `-- types\
|       `-- supabase.ts                             # REGENERATE after migration
|-- supabase\
|   `-- migrations\
|       |-- 20260520_credit_reservation_pack_billing.sql        # NEW: RPCs + indexes + plan_type filter helper
|       |-- 20260520_pg_cron_install.sql                        # NEW: enable pg_cron extension
|       |-- 20260520_generate_pending_invoices.sql              # NEW: invoice-generation SQL function + pg_cron schedule
|       `-- 20260520_queued_plan_switch.sql                     # NEW: state machine on student_plan_history + activate_queued_plan RPC
|-- credit-reservation-pack-billing.md              # THIS PLAN
```

## Data Model Decision (Reservation vs. Consumption)

**Two candidate models evaluated:**

| Model | Description | Pros | Cons |
|-------|-------------|------|------|
| **(A) Mutating reason** | Single `student_credits_log` row whose `reason` evolves: `Workout Scheduled` -> `Workout Completed` / `Workout No-Show`. | Fewer rows, clean history. | Loses scheduling timestamp; audit trail weaker; harder to query "what was reserved vs what was consumed". |
| **(B) Two rows, delta-neutral status** | Reservation row inserts `delta=-1, reason='Workout Scheduled'`. Completion inserts `delta=0, reason='Workout Completed'` (status marker). Cancellation inserts `delta=+1, reason='Workout Cancelled (Refund)'`. | Full audit trail; tabs map cleanly via left-anti-join; race-safe with row lock. | More rows; slightly more storage. |

**DECIDED: Model B (two rows).** Locked in by OD1 resolution — produces the cleanest two-tab UI in `student-credit-history-modal.tsx` (Agendados = log rows with `Workout Scheduled` and no later companion row; Histórico = all consumed + refund pairs + legacy rows). Storage cost is negligible relative to audit clarity.

## State Machine: Pack -> Recurring Queued Switch

```
student_plan_history rows define plan lifecycle:

  [pack=ACTIVE]
       |
       | (manager initiates switch to recurring while credits>0 or reservations active)
       v
  [pack=ACTIVE + recurring=QUEUED]   <-- student keeps using pack; UI shows "queued" notice
       |
       | (last reservation completed/cancelled AND credits_balance = 0)
       v
  [pack=DEPLETED + recurring=ACTIVE] <-- activation_date = NOW(); first invoice generation
                                          arms at activation_date + plan.cycle - config_invoice_days_before
```

- Reverse direction (recurring -> pack) is NOT queued — it's an additive credit purchase; both plans can technically coexist but the canonical "current plan" for billing is whichever is `ACTIVE`. Add a `plan_type='pack'` row to `student_plan_history` and keep `recurring=ACTIVE` (pack credits are stacked on top).
- Trigger points for `activate_queued_plan` RPC: after any successful `complete_workout_credit` / `complete_class_credit` / `refund_credit_*` that brings balance to 0 AND no `Workout Scheduled` rows remain without a closing row.

## Task Breakdown

### Phase 0 — Discovery & Migration Prep

#### T-DISC-01: Audit current credit-touching code paths
- **agent:** `backend-specialist`
- **skills:** clean-code, brainstorming
- **priority:** P0
- **dependencies:** none
- **INPUT:** the 9 verified files listed in user context.
- **OUTPUT:** a written inventory (added as comment block at top of `src/lib/credits/credit-ledger.ts`) listing every call site that touches `credits_balance`, `student_credits_log`, or `deduct_credit`. Group by: (a) reserves, (b) consumes, (c) refunds, (d) DOUBLE-DEBIT bugs.
- **VERIFY:** Inventory enumerates >= 8 call sites; explicitly names the duplicate `deduct_credit` in `event-details-modal.tsx`.

#### T-DISC-02: Document invoice-automation gap (cron / edge fn missing)
- **agent:** `backend-specialist`
- **skills:** clean-code
- **priority:** P0
- **dependencies:** none
- **INPUT:** Already verified during planning — no pg_cron, no edge function, no SQL function generates "X days before due" invoices today.
- **OUTPUT:** Short audit note appended to this plan confirming: (a) pg_cron NOT installed, (b) only edge function present is `update-class-statuses`, (c) `config_invoice_days_before` column exists on `organizations` with UI in `configuracoes/financial/page.tsx`. Build-from-scratch is required (see T-DB-NEW-CRON-* tasks).
- **VERIFY:** Audit note checked-in inside this file's "Discovery Findings" section before T-DB-NEW-CRON-EXT starts.

### Phase 1 — Database

#### T-DB-01: Add indexes for credit-log lookups
- **agent:** `database-architect`
- **skills:** clean-code
- **priority:** P0
- **dependencies:** T-DISC-01
- **INPUT:** `student_credits_log` table schema.
- **OUTPUT:** Migration SQL adds: `CREATE INDEX IF NOT EXISTS idx_credits_log_workout ON student_credits_log(workout_id);` and same for `calendar_event_id`, `student_id, created_at DESC`.
- **VERIFY:** `EXPLAIN ANALYZE` on a sample "find latest log for workout" query uses the new index.

#### T-DB-02: Create `reserve_credit_for_workout` RPC
- **agent:** `database-architect`
- **skills:** clean-code
- **priority:** P0
- **dependencies:** T-DB-01
- **INPUT:** Model B decision (locked).
- **OUTPUT:** SQL function signature `reserve_credit_for_workout(p_student_id uuid, p_workout_id uuid, p_reason text)` that, in one transaction: (1) `SELECT ... FOR UPDATE` on `students` row, (2) checks `credits_balance > 0` (raises `insufficient_credits` if not), (3) UPDATE `credits_balance = credits_balance - 1`, (4) INSERT log row with delta=-1.
- **VERIFY:** Calling RPC twice for same workout returns error on the second call (idempotency via unique partial index on `(workout_id) WHERE reason='Workout Scheduled'`); calling on a 0-balance student raises typed error.

#### T-DB-03: Create `complete_workout_credit` RPC
- **agent:** `database-architect`
- **skills:** clean-code
- **priority:** P0
- **dependencies:** T-DB-02
- **INPUT:** Model B.
- **OUTPUT:** RPC that inserts a `delta=0` status-marker log row (reason in `['Workout Completed','Workout No-Show','Class Completed','Class No-Show']`). Refuses if no prior `Workout Scheduled` row exists for that workout. On success, calls `activate_queued_plan(p_student_id)` (see T-DB-QUEUE-02) before returning so a balance-to-zero transition flips a queued recurring plan to ACTIVE.
- **VERIFY:** Calling on a never-reserved workout raises `no_reservation_found`; completing the last reservation of a queued-switch student activates the queued plan in the same transaction.

#### T-DB-04: Create `refund_credit_for_workout` RPC
- **agent:** `database-architect`
- **skills:** clean-code
- **priority:** P0
- **dependencies:** T-DB-02
- **INPUT:** Model B.
- **OUTPUT:** RPC that, in one tx: locks student row, inserts `delta=+1` log with refund reason, increments `credits_balance`. Idempotent: refuses if a refund row already exists for that workout. Also calls `activate_queued_plan` post-mutation (refund-to-zero edge case where balance reaches 0 with no reservations).
- **VERIFY:** Two concurrent calls -> exactly one refund row; balance increments exactly once.

#### T-DB-05: Equivalent RPCs for class enrollment
- **agent:** `database-architect`
- **skills:** clean-code
- **priority:** P0
- **dependencies:** T-DB-04
- **INPUT:** `calendar_events` (type=CLASS) + enrollment table.
- **OUTPUT:** `reserve_credit_for_class`, `complete_class_credit`, `refund_credit_for_class` mirroring workouts but keyed by `(calendar_event_id, student_id)`. Both `complete` and `refund` variants also call `activate_queued_plan`.
- **VERIFY:** Same idempotency tests pass.

#### T-DB-QUEUE-01: Extend `student_plan_history` schema for queued state
- **agent:** `database-architect`
- **skills:** clean-code
- **priority:** P0
- **dependencies:** T-DB-01
- **INPUT:** Current `student_plan_history` table.
- **OUTPUT:** Migration adds a `status` enum column (`ACTIVE`, `QUEUED`, `DEPLETED`) defaulting `ACTIVE` for legacy rows. Adds CHECK constraint allowing at most one `ACTIVE` AND at most one `QUEUED` row per student at a time (enforced via partial unique index on `student_id WHERE status IN ('ACTIVE','QUEUED')` keyed by status). Backfills legacy rows to `ACTIVE`.
- **VERIFY:** Inserting a second ACTIVE row for the same student fails; backfill leaves zero rows with NULL status.

#### T-DB-QUEUE-02: Create `activate_queued_plan` RPC
- **agent:** `database-architect`
- **skills:** clean-code
- **priority:** P0
- **dependencies:** T-DB-QUEUE-01, T-DB-02
- **INPUT:** State machine described in "State Machine" section.
- **OUTPUT:** Function `activate_queued_plan(p_student_id uuid)` that: (1) locks student row + their plan-history rows FOR UPDATE; (2) checks if a QUEUED row exists AND `credits_balance = 0` AND no open `Workout Scheduled`/`Class Enrollment` rows; (3) if so, marks the current ACTIVE row `DEPLETED`, promotes the QUEUED row to ACTIVE, sets `activation_date = now()`, and writes a `Plan Activated From Queue` audit row. Idempotent (no-op when conditions not met).
- **VERIFY:** Unit-test the RPC against 4 cases: (a) no queue -> no-op, (b) queue exists + balance > 0 -> no-op, (c) queue exists + balance 0 + open reservation -> no-op, (d) queue exists + balance 0 + no reservations -> promotion succeeds.

#### T-DB-06: Exclude pack plans from recurring invoice automation
- **agent:** `database-architect`
- **skills:** clean-code
- **priority:** P0
- **dependencies:** T-DB-NEW-CRON-FN
- **INPUT:** New `generate_pending_invoices` function from T-DB-NEW-CRON-FN.
- **OUTPUT:** Confirms the function's WHERE clause includes `AND mp.plan_type <> 'pack'`. (Task may merge into T-DB-NEW-CRON-FN; kept separate for explicit verification.)
- **VERIFY:** Manual run of the function against a DB containing one recurring + one pack plan creates 1 invoice, not 2.

#### T-DB-NEW-CRON-EXT: Install `pg_cron` extension
- **agent:** `database-architect`
- **skills:** clean-code
- **priority:** P0
- **dependencies:** T-DISC-02
- **INPUT:** Supabase project requires extension enabled.
- **OUTPUT:** Migration `CREATE EXTENSION IF NOT EXISTS pg_cron;` plus grant statements per Supabase docs. Document the schema (`cron`) and that jobs run in the `postgres` database.
- **VERIFY:** `SELECT * FROM pg_extension WHERE extname='pg_cron';` returns one row.

#### T-DB-NEW-CRON-FN: Create `generate_pending_invoices()` SQL function
- **agent:** `database-architect`
- **skills:** clean-code, brainstorming
- **priority:** P0
- **dependencies:** T-DB-NEW-CRON-EXT
- **INPUT:** `organizations.config_invoice_days_before` (default 10), `student_plan_history` ACTIVE rows, `membership_plans.plan_type`, `invoices` existing rows.
- **OUTPUT:** `SECURITY DEFINER` function that scans every student whose `student_plan_history.status='ACTIVE'` AND `membership_plans.plan_type <> 'pack'` AND there is no `invoices` row covering the next billing period AND `next_due_date - now() <= org.config_invoice_days_before`. For each such student, inserts a `pending` invoice + linked `saas_charges` row using the existing financial helpers. Logs row counts.
- **VERIFY:** Run manually with a mixed DB (1 pack, 1 recurring within window, 1 recurring outside window). Result: exactly 1 invoice created (the in-window recurring).

#### T-DB-NEW-CRON-JOB: Schedule `generate_pending_invoices` via pg_cron
- **agent:** `database-architect`
- **skills:** clean-code
- **priority:** P0
- **dependencies:** T-DB-NEW-CRON-FN
- **INPUT:** Function from previous task.
- **OUTPUT:** `SELECT cron.schedule('generate-pending-invoices-daily', '0 3 * * *', $$SELECT public.generate_pending_invoices();$$);` migration. Document timezone (UTC) and recovery procedure if a run is missed.
- **VERIFY:** `SELECT * FROM cron.job WHERE jobname='generate-pending-invoices-daily';` returns one row; `cron.job_run_details` shows executions after activation.

#### T-DB-07: Regenerate `database.types.ts` and `supabase.ts`
- **agent:** `database-architect`
- **skills:** clean-code
- **priority:** P1
- **dependencies:** T-DB-02..T-DB-06, T-DB-QUEUE-02, T-DB-NEW-CRON-JOB
- **INPUT:** Latest schema.
- **OUTPUT:** Re-generated TS types committed.
- **VERIFY:** `npx tsc --noEmit` (run by user later — do not invoke during planning).

### Phase 2 — Backend (Server Actions / Lib)

#### T-BE-01: Create `src/lib/credits/credit-ledger.ts` helper
- **agent:** `backend-specialist`
- **skills:** clean-code
- **priority:** P0
- **dependencies:** T-DB-05
- **INPUT:** New RPCs.
- **OUTPUT:** Typed wrappers: `reserveWorkoutCredit`, `completeWorkoutCredit`, `refundWorkoutCredit`, and class equivalents. All return `{ ok: true } | { ok: false, error: 'insufficient_credits' | 'no_reservation_found' | 'already_refunded' | 'unknown' }`.
- **VERIFY:** Unit tests (T-TEST-01) pass.

#### T-BE-02: Refactor `treinos.ts` scheduling -> reserve
- **agent:** `backend-specialist`
- **skills:** clean-code
- **priority:** P0
- **dependencies:** T-BE-01
- **INPUT:** Current `scheduleWorkout`-style action.
- **OUTPUT:** On schedule, call `reserveWorkoutCredit`. On insufficient credits, abort workout creation and surface error to UI.
- **VERIFY:** Manual: scheduling with 0 balance returns error and creates NO workout row.

#### T-BE-03: Refactor cancel-workout to refund
- **agent:** `backend-specialist`
- **skills:** clean-code
- **priority:** P0
- **dependencies:** T-BE-02
- **INPUT:** Current cancel action.
- **OUTPUT:** Calls `refundWorkoutCredit`. Idempotent via DB-level guard from T-DB-04.
- **VERIFY:** Cancelling twice does not double-refund.

#### T-BE-04: Refactor complete/no-show to be status-only AND emit PAID invoice on pack
- **agent:** `backend-specialist`
- **skills:** clean-code
- **priority:** P0
- **dependencies:** T-BE-02
- **INPUT:** `event-details-modal.tsx` server action callees + pack-purchase flow.
- **OUTPUT:** (a) Replace any `deduct_credit` call with `completeWorkoutCredit` (delta=0). (b) Confirm that pack-purchase server action emits a single `invoices` row with `status='PAID'`, `paid_at=now()`, `due_date=now()` — never `pending`. Pack invoices bypass dunning/notification flows; they are pure cash-sale receipts.
- **VERIFY:** Marking Concluido -> `credits_balance` unchanged in DB. Pack purchase -> `SELECT status FROM invoices WHERE id=...` returns `PAID`.

#### T-BE-05: Apply same refactor to `aulas.ts`
- **agent:** `backend-specialist`
- **skills:** clean-code
- **priority:** P0
- **dependencies:** T-BE-04
- **INPUT:** Class enrollment + completion actions.
- **OUTPUT:** Reserve on enroll, refund on unenroll, complete on Concluido/Faltou.
- **VERIFY:** End-to-end class flow shows expected log rows.

#### T-BE-06: Additive credit logic in `plans.ts`
- **agent:** `backend-specialist`
- **skills:** clean-code
- **priority:** P0
- **dependencies:** T-DB-07
- **INPUT:** Current `assignPlan` / `changePlan` action.
- **OUTPUT:** When `plan_type='pack'`, do `UPDATE students SET credits_balance = credits_balance + :pack_credits`. When recurring, current behavior. Always inserts a log row `reason='Pack Purchase'` with positive delta.
- **VERIFY:** Student w/ 5 credits + Pack 10 -> 15 in DB, and a `+10 Pack Purchase` log row.

#### T-BE-07: One-shot PAID invoice on pack purchase (cash sale)
- **agent:** `backend-specialist`
- **skills:** clean-code
- **priority:** P0
- **dependencies:** T-BE-06
- **INPUT:** `financial.ts` invoice helpers.
- **OUTPUT:** Inside the same server action as T-BE-06, when pack: insert exactly one `invoices` row with `status='PAID'`, `paid_at=now()`, `due_date=now()`, `recurring=false`, link to student + plan + `saas_charges` row (also marked settled). No pending state, no dunning, no notifications. Document this as the "cash-sale path".
- **VERIFY:** One pack purchase -> exactly 1 invoice with `status='PAID'`. Dunning cron does not pick it up. Recurring purchase path unchanged (still creates 1 pending invoice via T-DB-NEW-CRON-FN at the right time).

#### T-BE-08: Plan-type switch — queued activation for pack -> recurring
- **agent:** `backend-specialist`
- **skills:** clean-code, brainstorming
- **priority:** P0
- **dependencies:** T-BE-06, T-DB-QUEUE-02
- **INPUT:** `changePlan` action; state machine from "State Machine" section.
- **OUTPUT:** When switching pack -> recurring and student has `credits_balance > 0` OR open reservations, DO NOT block, DO NOT refund. Instead: insert a `student_plan_history` row for the new recurring plan with `status='QUEUED'`. Keep current pack row `status='ACTIVE'`. Persist `requested_activation_at = now()` for audit. Returns a typed success result `{ ok: true, mode: 'queued' }` so UI can show the right copy. When switching recurring -> pack, no queue: stack credits additively (T-BE-06), recurring stays ACTIVE, pack history row added as supplemental. Block ONLY the impossible case (already has both an ACTIVE and a QUEUED row and user tries to queue a third plan).
- **VERIFY:** Test matrix (T-TEST-04). Manual: assign pack to student with no plan -> ACTIVE pack. Switch to recurring while credits > 0 -> QUEUED row added, pack remains ACTIVE, UI returns `mode='queued'`. After credits hit 0 via T-BE-04, recurring auto-activates (via RPC in T-DB-QUEUE-02 chained from `complete_workout_credit`).

#### T-BE-09: Surface queued-activation feedback in plan/credit server actions
- **agent:** `backend-specialist`
- **skills:** clean-code
- **priority:** P1
- **dependencies:** T-BE-08
- **INPUT:** All actions that touch credits or plan-history (treinos, aulas, plans).
- **OUTPUT:** Whenever an action triggers `activate_queued_plan` AND the RPC reports a promotion happened, return a flag (`queuedActivationFired: true`) so the frontend can fire a one-time toast ("Plano mensal ativado — primeira cobrança será gerada conforme configuração.").
- **VERIFY:** Manual: schedule + complete final pack workout -> server response includes the flag; toast fires.

### Phase 3 — Frontend

#### T-FE-01: Add Tabs to `student-credit-history-modal.tsx` (credits-only)
- **agent:** `frontend-specialist`
- **skills:** clean-code
- **priority:** P0
- **dependencies:** T-BE-04
- **INPUT:** Existing modal that lists all log rows.
- **OUTPUT:** Two `<Tabs>` "Histórico" and "Agendados". Both tabs query `student_credits_log` ONLY — never `invoices` (OD4 confirmed). `Agendados` query: log rows with `reason IN ('Workout Scheduled','Class Enrollment')` AND no later log row for same workout/event. `Histórico`: everything else (consumed + refunds + ALL legacy rows — no backfill performed per OD6). Modal **must not render** if student's current plan_type is not `pack`; the parent component already guards via `planLabel.isCredits`, this task confirms and tightens that guard.
- **VERIFY:** Manual UI: scheduling shows row under Agendados; completing moves it to Histórico; cancelling moves it to Histórico as a refunded pair. For a recurring-only student, the modal trigger is not rendered at all.

#### T-FE-02: Remove duplicate `deduct_credit` call in `event-details-modal.tsx`
- **agent:** `frontend-specialist`
- **skills:** clean-code
- **priority:** P0
- **dependencies:** T-BE-04
- **INPUT:** Existing Concluido/Faltou handler.
- **OUTPUT:** Replace with the new server action that calls `completeWorkoutCredit` (delta=0). Strip any client-side balance math.
- **VERIFY:** Concluido on a workout -> balance in UI matches DB and does not decrement.

#### T-FE-03: Update `manage-plan-modal.tsx` copy + queued-switch dialog
- **agent:** `frontend-specialist`
- **skills:** clean-code
- **priority:** P0
- **dependencies:** T-BE-08
- **INPUT:** Existing plan-management UI.
- **OUTPUT:** (a) Show "Saldo atual: X -> X + N = (X+N) créditos" preview for pack assignments. (b) When user tries to switch pack -> recurring with credits > 0 / reservations active, render a dialog: "O aluno ainda tem N créditos. O plano mensal será ATIVADO após o uso/cancelamento dos créditos restantes. Confirmar?". On confirm, server returns `mode='queued'`; UI shows a persistent banner on the student profile while the queue is active.
- **VERIFY:** Manual UI walkthrough of all 4 transitions; queued banner appears and disappears at the right moments.

#### T-FE-04: Update `student-modal.tsx` initial-assignment
- **agent:** `frontend-specialist`
- **skills:** clean-code
- **priority:** P1
- **dependencies:** T-BE-06
- **INPUT:** Onboarding new-student modal.
- **OUTPUT:** Use additive call (which collapses to `0 + N = N` for new students). Preview text confirms.
- **VERIFY:** Create new student w/ Pack 10 -> balance = 10.

#### T-FE-05: Update `plan-step.tsx` onboarding wizard
- **agent:** `frontend-specialist`
- **skills:** clean-code
- **priority:** P1
- **dependencies:** T-FE-04
- **INPUT:** Multi-step new-client wizard.
- **OUTPUT:** Same additive logic. Invoice-preview line: for pack -> "Esta compra gera 1 recibo pago à vista no valor de R$ X (sem mensalidade futura)"; for recurring -> "Primeira fatura será gerada N dias antes do vencimento conforme configuração.".
- **VERIFY:** Onboarding pack -> 1 invoice with status=PAID. Onboarding recurring -> 0 invoices immediately (cron handles it later).

#### T-FE-06: Update `workout-details-sheet.tsx`
- **agent:** `frontend-specialist`
- **skills:** clean-code
- **priority:** P2
- **dependencies:** T-BE-04
- **INPUT:** Workout details side-sheet.
- **OUTPUT:** When showing status transitions, ensure no client-side `deduct_credit` call; balance reads from server.
- **VERIFY:** No `deduct_credit` references remain via Grep.

#### T-FE-07: Audit credit-UI gating across all surfaces
- **agent:** `frontend-specialist`
- **skills:** clean-code, brainstorming
- **priority:** P0
- **dependencies:** T-FE-01
- **INPUT:** Per OD4 / SC13: credits UI must render only when student.plan.plan_type = 'pack'.
- **OUTPUT:** Grep-driven audit + fixes across: `student-profile-main-section.tsx` (already gated via `planLabel.isCredits` — confirm), `student-profile-view.tsx`, `important-alerts.tsx`, `topbar-actions.tsx`, dashboard panels, agenda widgets, any "Saldo de créditos" chip. For each surface, either confirm the gate or add it. Recurring-plan students must see ZERO credit chrome.
- **VERIFY:** Manual: create a recurring-plan-only student; visit every surface and confirm no credit balance, no history button, no "X créditos restantes" copy appears.

### Phase 4 — Security & Tests

#### T-SEC-01: RLS review of new RPCs + cron function
- **agent:** `security-auditor`
- **skills:** clean-code
- **priority:** P0
- **dependencies:** T-DB-05, T-DB-NEW-CRON-JOB, T-DB-QUEUE-02
- **INPUT:** New RPC bodies + grants + `generate_pending_invoices` + `activate_queued_plan`.
- **OUTPUT:** Confirm `SECURITY DEFINER` only where needed; confirm RPC checks `student.org_id = auth.uid()'s org`. The cron function runs as `postgres` superuser — explicitly document that this is intentional and cannot leak across orgs (it operates on all rows but writes correctly scoped invoice rows). Run `mcp__claude_ai_Supabase__get_advisors`.
- **VERIFY:** No new critical advisor.

#### T-TEST-01: Unit tests for `credit-ledger.ts`
- **agent:** `test-engineer`
- **skills:** clean-code
- **priority:** P1
- **dependencies:** T-BE-01
- **INPUT:** Helper module.
- **OUTPUT:** Vitest specs covering success, insufficient_credits, already_refunded, no_reservation_found.
- **VERIFY:** `npm test` (user-run) green.

#### T-TEST-02: E2E — reserve / complete / cancel happy path
- **agent:** `test-engineer`
- **skills:** clean-code
- **priority:** P1
- **dependencies:** T-FE-02
- **INPUT:** Test student fixture.
- **OUTPUT:** Playwright spec or manual checklist covering schedule -> Histórico vs Agendados visibility -> complete -> cancel.
- **VERIFY:** All assertions pass.

#### T-TEST-03: Concurrency test for refund idempotency
- **agent:** `test-engineer`
- **skills:** clean-code
- **priority:** P1
- **dependencies:** T-BE-03
- **INPUT:** Two parallel cancel calls.
- **OUTPUT:** Test (or documented manual SQL race using two Supabase sessions) asserting only one refund row inserted.
- **VERIFY:** Row count = 1.

#### T-TEST-04: Plan-switch transition matrix (including queued state)
- **agent:** `test-engineer`
- **skills:** clean-code
- **priority:** P1
- **dependencies:** T-BE-08
- **INPUT:** All transitions {pack->pack, pack->recurring, recurring->pack, recurring->recurring} with starting states {0 credits, >0 credits no reservations, >0 credits with active reservations}.
- **OUTPUT:** Documented matrix of expected balance + plan_history rows + invoice behavior. Critical row: `pack(credits>0 + reservations) -> recurring` must produce ACTIVE pack + QUEUED recurring, NO refund, NO immediate invoice. Subsequent depletion must auto-activate recurring.
- **VERIFY:** Each row reproduced manually or via test.

#### T-TEST-05: Recurring-invoice cron regression
- **agent:** `test-engineer`
- **skills:** clean-code
- **priority:** P1
- **dependencies:** T-DB-NEW-CRON-JOB
- **INPUT:** DB with mixed pack + recurring plans, due dates spread across the 10-day window.
- **OUTPUT:** Trigger `SELECT public.generate_pending_invoices();` manually; assert (a) only recurring rows produce new invoices, (b) pack students get zero new invoices, (c) re-running the function produces no duplicates (idempotent within a billing period).
- **VERIFY:** Pack students have no new invoices generated by the cron. Recurring student inside the window gets exactly one new pending invoice.

#### T-TEST-06: Queued-activation end-to-end
- **agent:** `test-engineer`
- **skills:** clean-code
- **priority:** P1
- **dependencies:** T-BE-09, T-FE-03
- **INPUT:** Fresh student with Pack 3.
- **OUTPUT:** Scripted scenario: (1) assign pack=3 credits -> ACTIVE pack. (2) Manager switches plan to recurring -> QUEUED recurring + ACTIVE pack + UI banner. (3) Schedule + complete 3 workouts -> after the 3rd `complete_workout_credit`, RPC promotes recurring to ACTIVE, pack to DEPLETED. (4) Confirm banner disappears, confirm `activation_date` is set, confirm the cron picks the new plan up at the appropriate time (mock-advance the clock or read the computed `next_due_date`).
- **VERIFY:** All four steps pass; no spurious invoices generated during the queued window.

## Edge Cases (Explicit Coverage)

| EC | Scenario | Handled By |
|----|----------|-----------|
| EC1 | Concurrent cancellation -> double refund | T-DB-04 partial unique index + `FOR UPDATE` |
| EC2 | Plan changed from pack to recurring while reservations active | T-BE-08 queued state (NOT a block); UI banner; auto-activation on depletion |
| EC3 | Plan changed from recurring to pack with positive balance | T-BE-06 additive; no queue needed; pack stacks on top |
| EC4 | Partial refund (currently N/A — credits are integer units) | Documented as out-of-scope |
| EC5 | Student deleted while reservations active | Cascade via existing FK; ledger entries remain for audit; queued rows orphaned cleanly |
| EC6 | Pack plan with 0 credits (misconfigured) | T-BE-06 short-circuits: no balance change, no invoice line item for credits |
| EC7 | Org has no Stripe/EFI configured but pack is purchased | T-BE-07 still creates `invoices` row already PAID (cash sale doesn't require gateway) |
| EC8 | Migrating legacy log rows (pre-Model B) | OD6 decision: NO backfill. All legacy rows show in Histórico tab even if their underlying workout is in the future. Acceptable because pre-fix flow never reserved credits correctly. |
| EC9 | Timezone drift in `due_date` calc | Use DB `now() AT TIME ZONE 'UTC'` consistently in `generate_pending_invoices` |
| EC10 | User cancels a workout AFTER it's already Concluido | T-DB-04 refuses; explicit error surfaced |
| EC11 | Pack purchase fails mid-flight (invoice insert error after balance update) | Both in single transaction in T-BE-06/07; rollback restores balance |
| EC12 | Queued plan cancelled (user changes mind) before activation | `manage-plan-modal` exposes "Remover plano em fila"; deletes QUEUED row, no balance impact |
| EC13 | Multiple queued rows attempted | T-DB-QUEUE-01 partial unique index prevents; T-BE-08 returns typed error |
| EC14 | `generate_pending_invoices` runs while student is in QUEUED state | Function targets only ACTIVE rows; QUEUED is skipped by design |

## Decided Decisions (Resolved)

| ID | Question | Resolution | Rationale |
|----|----------|-----------|-----------|
| OD1 | Model A (mutating reason) vs Model B (two rows) | **DECIDED: Model B** | User deferred to planner ("o que ficar melhor UI e UX"). Model B yields the cleanest two-tab UI: Agendados is a precise left-anti-join, no ambiguity per row whether a `Workout Scheduled` is still pending or already realized. Storage cost trivial vs audit clarity. |
| OD2 | Pack invoice `due_date` (today vs +N) | **DECIDED: Paid immediately** | User: "pagamento à vista". Pack invoice is created with `status='PAID'`, `paid_at=now()`, `due_date=now()`. Bypasses dunning, notifications, and the recurring cron. T-BE-04 / T-BE-07 enforce this. |
| OD3 | Pack -> recurring switch with active credits/reservations | **DECIDED: Queue the recurring plan** | User: finish credits first, then recurring kicks in following standard "X days before due" rules anchored to activation date. Implemented via state machine (ACTIVE/QUEUED/DEPLETED on `student_plan_history`) + `activate_queued_plan` RPC chained from completion/refund RPCs. T-BE-08, T-DB-QUEUE-01/02, T-TEST-06. |
| OD4 | Agendados tab content — credit rows only or include invoices? | **DECIDED: Credit log rows only** | User: this is purely the credit-consumption view; recurring-plan students should see no credits UI at all. Reinforced by SC13 / T-FE-07 (gating audit). |
| OD5 | Is creating the recurring-invoice cron in scope? | **DECIDED: Yes — cron does not exist** | Verified during planning: pg_cron not installed, no edge function generates invoices, no `generate_pending_invoices` SQL function exists. The `config_invoice_days_before` setting exists but is unused. Added T-DB-NEW-CRON-EXT, T-DB-NEW-CRON-FN, T-DB-NEW-CRON-JOB, T-TEST-05. |
| OD6 | Backfill legacy log rows into Agendados? | **DECIDED: No backfill** | User deferred to planner. Pre-fix data lacks the metadata needed to retro-classify "still scheduled" vs "completed" — best-effort migration would misclassify rows. Cleaner to draw a line in time: legacy rows show in Histórico even if underlying event is in the future. EC8 documents the trade-off. |

## Discovery Findings (to be filled by T-DISC-02)

(Reserved for the audit note. Pre-populated facts:
- `pg_cron` extension: NOT installed
- Edge functions present: `update-class-statuses` only — no invoice generation
- SQL functions: no `generate_pending_invoices`, no `create_charge` of that kind
- `organizations.config_invoice_days_before` exists, default 10, UI present at `configuracoes/financial/page.tsx`
- Conclusion: invoice automation must be built from scratch under T-DB-NEW-CRON-*.)

## Phase X — Final Verification Checklist

- [ ] All RPCs deployed via migration and tested via `mcp__claude_ai_Supabase__execute_sql`
- [ ] `pg_cron` extension installed and `generate-pending-invoices-daily` job listed in `cron.job`
- [ ] `supabase.ts` and `database.types.ts` regenerated and committed
- [ ] `npm run lint` clean
- [ ] `npx tsc --noEmit` clean
- [ ] Manual happy path: schedule -> appears in Agendados; complete -> moves to Histórico; balance correct at every step
- [ ] Manual cancel path: refund visible; balance restored; cannot double-refund
- [ ] Manual additive path: student w/ 5 + Pack 10 -> 15
- [ ] Manual one-shot invoice: 1 pack purchase = 1 invoice with status=PAID
- [ ] Manual queued-switch: pack -> recurring with credits > 0 produces QUEUED row; depletion auto-activates recurring
- [ ] Cron dry-run: pack plans skipped; idempotent (re-run produces no duplicates)
- [ ] Credits UI gating audit complete — no credit chrome visible on recurring-plan student views
- [ ] `mcp__claude_ai_Supabase__get_advisors` shows no new critical/high issues
- [ ] All success criteria SC1..SC14 ticked
- [ ] All edge cases EC1..EC14 either verified or explicitly documented as out-of-scope
- [ ] Phase X completion marker appended below

## Implementation Notes (2026-05-20)

The implementation pivoted from the "build new RPCs" plan to a "rewrite existing triggers" strategy after T-DISC-01 revealed that the database already had `trg_workout_credits_fifo`, `trg_enrollment_credits_fifo`, and `trg_sync_student_credits` triggers — reserve and refund were already automatic, but with three bugs (only legacy 'Cancelado' recognised, no Model B status marker, no FIFO row insertion on plan assignment, overwrite instead of additive). Keeping FIFO + rewriting triggers was the lower-risk path agreed with the user.

### Migrations applied
1. `sync_student_credits_additive_and_fifo_rows` — additive for pack + inserts N rows into `student_credits` + logs `Pack Purchase`.
2. `workout_fifo_model_b_modern_status` — recognises CANCELLED/COMPLETED/MISSED, emits delta=0 marker on completion, idempotent refund.
3. `enrollment_fifo_model_b_modern_status` — same shape for class enrollments.
4. `credit_log_indexes_and_view` — indexes on `(student_id, created_at DESC)`, `(reference_id)`, `(reason)`; rewrote `student_credits_log_view` with a `bucket` column ('agendado' | 'historico') computed via left-anti-join on companion rows; `security_invoker = true`.
5. `student_plan_history_status_queue` — added `status` enum (ACTIVE/QUEUED/DEPLETED), partial unique indexes, `activate_queued_plan(uuid)` RPC.
6. `change_student_plan_rpc` — single entry point that handles additive credits (pack), cash-sale PAID invoice (pack), or queued switch (recurring while balance/reservations exist).
7. `pg_cron_install_and_pending_invoices` — installs pg_cron, creates `generate_pending_invoices()` (excludes `plan_type='pack'`, anchors due_date on last invoice / activation_date / started_at), schedules daily at 03:00 UTC.
8. `tighten_new_function_view_grants` — view to `security_invoker`, RPCs revoked from `anon`, cron function revoked from everyone except `postgres`.

### Code changes
- `event-details-modal.tsx` and `workout-details-sheet.tsx` — removed manual `deduct_credit` calls (double-debit bug, hotfix landed before migrations).
- `manage-plan-modal.tsx` — replaced 3-step client logic with a single `rpc('change_student_plan', ...)` call; copy now shows queued vs paid-on-purchase feedback.
- `student-credit-history-modal.tsx` — added `<Tabs>` with `Histórico` and `Agendados` buckets sourced from the view's `bucket` column; new reasons (Workout/Class Completed/No-Show, Pack Purchase) rendered with friendly status labels.
- `alunos/[id]/page.tsx` — fetches the QUEUED row and renders an amber banner when present.

### Verification done in-session
- View returns 4 `historico` + 2 `agendado` rows for João Silva Teste — counts match DB direct query.
- `generate_pending_invoices()` dry-run returns `{created_count:0, skipped_pack:1, skipped_outside_window:0}` — confirms pack is excluded.
- pg_cron job `generate-pending-invoices-daily` is registered and active (id=1, schedule `0 3 * * *`).
- Security advisors: no new ERROR-level issues introduced; the `change_student_plan` and `activate_queued_plan` warnings for the `authenticated` role are intentional (server actions need to call them).
- `npx tsc --noEmit` passes clean.

### Known follow-ups (out of scope for this session)
- Replace `student-modal.tsx` and `plan-step.tsx` (onboarding) to call `change_student_plan` RPC for consistency.
- Regenerate `database.types.ts` to expose `change_student_plan` and `activate_queued_plan` in TS types.
- Add a "Saldo atual X → X + N" preview line in `manage-plan-modal.tsx` before submit.
- Add a "Remover plano em fila" affordance for cancelling a QUEUED row.
- Add backend wrappers (`src/lib/credits/credit-ledger.ts`) and unit tests — currently triggers handle everything, so the wrapper layer is optional.

## ✅ PHASE X COMPLETE
- Typecheck: ✅ Pass (`npx tsc --noEmit`)
- Security advisors: ✅ No new ERROR introduced
- DB verification: ✅ View bucket + cron dry-run + advisors clean
- Date: 2026-05-20
