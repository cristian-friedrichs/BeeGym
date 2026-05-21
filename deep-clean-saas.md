# Plan: Deep Workspace Cleanup (Deep Clean)

This plan outlines the steps to perform a thorough clean-up of the BeeGym SaaS codebase, removing obsolete diagnostics, empty folders, and redundant components/routes.

## Overview
Over multiple cycles of testing, diagnostics, and Refactoring, several files and empty folders have accumulated in the project root and `src/` directories. This plan organizes a systematic removal of these files to reduce codebase clutter, decrease build overhead, and eliminate potential security/architectural risks.

## Project Type
- **Type**: WEB (Next.js / TypeScript App Router)

## Success Criteria
- Delete 16+ clutter files from the project root.
- Delete 7 empty directories inside `src/`.
- Decide on retention or deletion of the `signup` route, `debug-auth` route, and legacy scripts/docs.
- Ensure `npx tsc --noEmit` and `npm run build` pass successfully after the cleanup.

## Tech Stack
- **Languages**: TypeScript, SQL
- **Framework**: Next.js 15 (App Router)

## Proposed File Changes / Deletions

### Root Workspace Clutter
The following files will be deleted:
- `ANALISE_TESTE_2_MEMBERSHIP_TIMEOUT.md`
- `BeeGym_Pro_Comprehensive_Test_Report_May_2026.docx`
- `BeeGym_Pro_Test_Report_Final.docx`
- `BeeGym_Pro_Test_Report_Updated.docx`
- `COMPREHENSIVE_TEST_REPORT.md`
- `CORRECAO_CODIGO_FRONTEND_MEMBERSHIP.md`
- `RELATORIO_CORRECAO_BANCO_DADOS.md`
- `RELATORIO_FINAL_TESTE_COMPLETO_USUARIO_REAL.md`
- `RESUMO_EXECUCAO_TESTE_1.txt`
- `RESUMO_EXECUCAO_TESTE_2.txt`
- `TESTE_PRATICO_USUARIO_REAL.md`
- `analise_banco_dados.md`
- `changed_files.txt`
- `report-audit-2026-04-25.md`
- `report-audit-2026-04-26-applied.md`
- `.modified`

### Empty Foldres inside `src/`
The following empty folders will be deleted:
- `src/jobs`
- `src/payments`
- `src/app/api/onboarding`
- `src/app/api/admin/efi-create-plans`
- `src/app/api/admin/migrate/payment-token`
- `src/application/use-cases/webhook`
- `src/application/use-cases/__tests__`

### Pending Decisions
- `src/app/signup/page.tsx`
- `src/app/app/debug-auth/page.tsx`
- `docs/legacy/`
- `scripts/legacy/`

---

## Task Breakdown

### Task 1: Root Clutter Deletion
- **Agent**: `project-planner`
- **Skills**: `clean-code`
- **Priority**: High
- **Dependencies**: None
- **INPUT**: List of 16 root files.
- **OUTPUT**: Root directory free of temporary/diagnostic files.
- **VERIFY**: Check that files are deleted and not present in root directory listings.

### Task 2: Empty Directory Removal
- **Agent**: `project-planner`
- **Skills**: `clean-code`
- **Priority**: High
- **Dependencies**: None
- **INPUT**: List of 7 empty directories in `src/`.
- **OUTPUT**: Empty folders deleted.
- **VERIFY**: Check that folders no longer exist using shell commands.

### Task 3: Redundant & Legacy Resolution
- **Agent**: `project-planner`
- **Skills**: `clean-code`
- **Priority**: Medium
- **Dependencies**: Tasks 1 & 2
- **INPUT**: Decisions on `signup` page, `debug-auth` page, and legacy directories.
- **OUTPUT**: Files deleted or archived in accordance with user preferences.
- **VERIFY**: Confirm directory clean state.

### Task 4: Compilation & Build Validation
- **Agent**: `project-planner`
- **Skills**: `clean-code`
- **Priority**: High
- **Dependencies**: Tasks 1, 2 & 3
- **INPUT**: Cleaned codebase.
- **OUTPUT**: Valid build output.
- **VERIFY**: Run `npx tsc --noEmit` and `npm run build`.

---

## Phase X: Verification Checklist
- [ ] No compilation errors (`npx tsc --noEmit` is green).
- [ ] Clean build passes (`npm run build` is successful).
- [ ] Checked for any remaining empty directories inside `src/`.
- [ ] Dev server restarts cleanly without errors.
