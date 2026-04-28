
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** BeeGym
- **Date:** 2026-04-27
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 Log in and reach the dashboard
- **Test Code:** [TC001_Log_in_and_reach_the_dashboard.py](./TC001_Log_in_and_reach_the_dashboard.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/e7331c9f-4de6-46ec-995d-8b9bc9ec0594/82a65135-7ef9-41ee-8404-7eeb0823c6a7
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 Auth-gated route redirects to login and returns after authentication
- **Test Code:** [TC002_Auth_gated_route_redirects_to_login_and_returns_after_authentication.py](./TC002_Auth_gated_route_redirects_to_login_and_returns_after_authentication.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/e7331c9f-4de6-46ec-995d-8b9bc9ec0594/a5b2a681-7405-4ede-a0d3-6dca3b61b836
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 Access payments requires login and returns to requested page
- **Test Code:** [TC003_Access_payments_requires_login_and_returns_to_requested_page.py](./TC003_Access_payments_requires_login_and_returns_to_requested_page.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/e7331c9f-4de6-46ec-995d-8b9bc9ec0594/321e6d56-b9ca-4c48-879a-0e528872b7f0
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 Create a new student with full details and plan dates
- **Test Code:** [TC004_Create_a_new_student_with_full_details_and_plan_dates.py](./TC004_Create_a_new_student_with_full_details_and_plan_dates.py)
- **Test Error:** TEST BLOCKED

The student creation test cannot be completed because there are no plans available to select. Without a plan the form does not expose plan-date fields and the enrollment with plan dates cannot be created.

Observations:
- The 'Plano Selecionado' combobox was opened and displayed 'Nenhum plano disponível'.
- Because no plan can be selected, the dependent plan date fields never appeared.
- Enrollment cannot be completed with plan dates in this environment.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/e7331c9f-4de6-46ec-995d-8b9bc9ec0594/d61a27b2-f518-41e3-a912-6ee979fe59ab
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 Generate PIX QR code and copy payload for an outstanding invoice
- **Test Code:** [TC005_Generate_PIX_QR_code_and_copy_payload_for_an_outstanding_invoice.py](./TC005_Generate_PIX_QR_code_and_copy_payload_for_an_outstanding_invoice.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/e7331c9f-4de6-46ec-995d-8b9bc9ec0594/5ee42218-589f-4afa-8a2a-100b0205db9d
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 Register a new user then see onboarding after first login
- **Test Code:** [TC006_Register_a_new_user_then_see_onboarding_after_first_login.py](./TC006_Register_a_new_user_then_see_onboarding_after_first_login.py)
- **Test Error:** TEST BLOCKED

The new user could not be created because the application returned a database error during registration.

Observations:
- The registration form submission produced an error banner: "Database error saving new user".
- The account creation did not complete and no onboarding prompt or redirect to a logged-in area occurred.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/e7331c9f-4de6-46ec-995d-8b9bc9ec0594/5ccc9504-f7bf-4915-9261-354f6136ccc7
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 Create and assign a workout with exercises and parameters
- **Test Code:** [TC007_Create_and_assign_a_workout_with_exercises_and_parameters.py](./TC007_Create_and_assign_a_workout_with_exercises_and_parameters.py)
- **Test Error:** TEST BLOCKED

The feature to assign a workout to a student could not be completed because the student selector returned no results.

Observations:
- The Aluno search shows 'Nenhum aluno encontrado' after typing multiple identifiers (João Silva Teste, Joao Silva Teste, João, joao.teste).
- The student could not be selected in the Novo Treino modal, so creating and assigning a workout to a student is not possible.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/e7331c9f-4de6-46ec-995d-8b9bc9ec0594/b21029f8-3d5d-48af-aabb-a1fa9443f439
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 Session persists across page reload on authenticated area
- **Test Code:** [TC008_Session_persists_across_page_reload_on_authenticated_area.py](./TC008_Session_persists_across_page_reload_on_authenticated_area.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/e7331c9f-4de6-46ec-995d-8b9bc9ec0594/5eba7558-667e-4fce-ae49-9534d00f469b
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 View invoices list with payment statuses
- **Test Code:** [TC009_View_invoices_list_with_payment_statuses.py](./TC009_View_invoices_list_with_payment_statuses.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/e7331c9f-4de6-46ec-995d-8b9bc9ec0594/2c9a51d9-d451-42bf-9c44-2e9c10a3f2c9
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 Edit an existing student and persist updates
- **Test Code:** [TC010_Edit_an_existing_student_and_persist_updates.py](./TC010_Edit_an_existing_student_and_persist_updates.py)
- **Test Error:** TEST BLOCKED

Creating a new student cannot proceed because there are no plans available in the 'Plano Selecionado' list.

Observations:
- The Plano Selecionado combobox opened and the list shows 'Nenhum plano disponível'.
- Clicking 'Concluir Matrícula' produced a 'Processando...' state but did not create the student or proceed further.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/e7331c9f-4de6-46ec-995d-8b9bc9ec0594/2fb77cab-07a3-4de6-a721-49f894f942d1
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011 Cancel invoice selection returns to invoice list without PIX details
- **Test Code:** [TC011_Cancel_invoice_selection_returns_to_invoice_list_without_PIX_details.py](./TC011_Cancel_invoice_selection_returns_to_invoice_list_without_PIX_details.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/e7331c9f-4de6-46ec-995d-8b9bc9ec0594/67a08152-3957-4663-9af8-150fb791367b
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012 Invoice list handles empty state
- **Test Code:** [TC012_Invoice_list_handles_empty_state.py](./TC012_Invoice_list_handles_empty_state.py)
- **Test Error:** TEST BLOCKED

The test could not verify the empty-state because the payments page currently contains existing transactions.

Observations:
- The Pagamentos page shows existing transactions (rows for 'João Silva Teste'), so no empty-state message like 'Nenhuma fatura' / 'Sem faturas' was present.
- A welcome modal was shown earlier and an attempt to close it returned an unavailable element, but the dashboard and payments page are currently accessible.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/e7331c9f-4de6-46ec-995d-8b9bc9ec0594/47914c56-4970-4b6d-a8cc-824c5af4e02b
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013 Workout requires at least one exercise before saving
- **Test Code:** [TC013_Workout_requires_at_least_one_exercise_before_saving.py](./TC013_Workout_requires_at_least_one_exercise_before_saving.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/e7331c9f-4de6-46ec-995d-8b9bc9ec0594/9ae29a4d-7448-45eb-b249-09dcc88ef84a
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014 Student CPF length validation prevents save
- **Test Code:** [TC014_Student_CPF_length_validation_prevents_save.py](./TC014_Student_CPF_length_validation_prevents_save.py)
- **Test Error:** TEST FAILURE

The student form allowed saving despite the CPF not meeting the required length.

Observations:
- After submitting the form with CPF '123.456.789-0', the app showed 'Aluno cadastrado com sucesso!'.
- The new 'Aluno Teste' entry appears in the students list with email aluno.teste@example.com.
- No CPF-length validation error was displayed and the form saved the record.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/e7331c9f-4de6-46ec-995d-8b9bc9ec0594/736c6fe5-c563-4c98-8e0b-4f1c81059e24
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015 Prevent PIX generation when invoice amount is invalid or missing
- **Test Code:** [TC015_Prevent_PIX_generation_when_invoice_amount_is_invalid_or_missing.py](./TC015_Prevent_PIX_generation_when_invoice_amount_is_invalid_or_missing.py)
- **Test Error:** TEST FAILURE

Generating PIX succeeded — a QR code and payload were produced instead of a validation error for an invoice with missing/invalid amount.

Observations:
- The invoice details panel displayed a PIX QR code and a copy-and-paste payload.
- The invoice value is shown as R$ 150.00 (not missing or invalid).
- Clicking 'Gerar PIX' produced the QR/payload immediately, so the expected validation did not block generation.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/e7331c9f-4de6-46ec-995d-8b9bc9ec0594/e96672e2-d89e-42e3-89f4-b0778464f6e1
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC016 Registration blocks invalid email or mismatched passwords
- **Test Code:** [TC016_Registration_blocks_invalid_email_or_mismatched_passwords.py](./TC016_Registration_blocks_invalid_email_or_mismatched_passwords.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/e7331c9f-4de6-46ec-995d-8b9bc9ec0594/ba548743-8e5a-4775-8e15-1ac730effb48
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **56.25** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---