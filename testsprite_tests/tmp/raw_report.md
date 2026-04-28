
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
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8fa94146-3b23-4707-89b9-dae44e2b9011/9c06284f-a91f-4065-a1f4-39414a4e30c4
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 Auth-gated route redirects to login and returns after authentication
- **Test Code:** [TC002_Auth_gated_route_redirects_to_login_and_returns_after_authentication.py](./TC002_Auth_gated_route_redirects_to_login_and_returns_after_authentication.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8fa94146-3b23-4707-89b9-dae44e2b9011/d02ad996-cd71-44a7-b47b-c55681016f42
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 Access payments requires login and returns to requested page
- **Test Code:** [TC003_Access_payments_requires_login_and_returns_to_requested_page.py](./TC003_Access_payments_requires_login_and_returns_to_requested_page.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8fa94146-3b23-4707-89b9-dae44e2b9011/5b73a093-0c57-4347-acb4-30b31392c75b
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 Create a new student with full details and plan dates
- **Test Code:** [TC004_Create_a_new_student_with_full_details_and_plan_dates.py](./TC004_Create_a_new_student_with_full_details_and_plan_dates.py)
- **Test Error:** TEST BLOCKED

The student enrollment could not be completed because there are no plans available to select.

Observations:
- The 'Plano Selecionado' combobox was opened and the listbox displayed the message 'Nenhum plano disponível'.
- Without a plan it is not possible to set plan start/end dates or finish the enrollment, so the new student cannot be created as required.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8fa94146-3b23-4707-89b9-dae44e2b9011/d1e2384d-1374-4d90-adaa-0d531c3c0858
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 Generate PIX QR code and copy payload for an outstanding invoice
- **Test Code:** [TC005_Generate_PIX_QR_code_and_copy_payload_for_an_outstanding_invoice.py](./TC005_Generate_PIX_QR_code_and_copy_payload_for_an_outstanding_invoice.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8fa94146-3b23-4707-89b9-dae44e2b9011/41c2a9d8-66a0-4199-836d-5b3a0fd30c28
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 Register a new user then see onboarding after first login
- **Test Code:** [TC006_Register_a_new_user_then_see_onboarding_after_first_login.py](./TC006_Register_a_new_user_then_see_onboarding_after_first_login.py)
- **Test Error:** TEST FAILURE

Registration failed — the application showed a database error and did not create the new user account.

Observations:
- The registration page showed the error banner: "Database error saving new user".
- The registration form remained visible with the inputs filled and no redirect to a dashboard or onboarding.
- No success notification or account confirmation was displayed.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8fa94146-3b23-4707-89b9-dae44e2b9011/1a67de73-ca3f-407b-8ffa-31d99e396338
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 Create and assign a workout with exercises and parameters
- **Test Code:** [TC007_Create_and_assign_a_workout_with_exercises_and_parameters.py](./TC007_Create_and_assign_a_workout_with_exercises_and_parameters.py)
- **Test Error:** TEST BLOCKED

Student creation is blocked because no membership plans are available, so the workflow (select student → create workout → assign to student) cannot be completed.

Observations:
- The students list shows 'Nenhum aluno encontrado.' so no students exist.
- The 'Plano Selecionado' combobox displays 'Nenhum plano disponível'.
- A prior attempt to submit 'Concluir Matrícula' completed processing but no student was created.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8fa94146-3b23-4707-89b9-dae44e2b9011/8645788c-0d2d-44bd-8501-42e08f07c71c
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 Session persists across page reload on authenticated area
- **Test Code:** [TC008_Session_persists_across_page_reload_on_authenticated_area.py](./TC008_Session_persists_across_page_reload_on_authenticated_area.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8fa94146-3b23-4707-89b9-dae44e2b9011/d8a5e6ac-979c-41e0-b958-f32aea92bbb2
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 View invoices list with payment statuses
- **Test Code:** [TC009_View_invoices_list_with_payment_statuses.py](./TC009_View_invoices_list_with_payment_statuses.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8fa94146-3b23-4707-89b9-dae44e2b9011/1cf5dd07-35bf-4bf2-b626-d185b3d33b3c
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 Edit an existing student and persist updates
- **Test Code:** [TC010_Edit_an_existing_student_and_persist_updates.py](./TC010_Edit_an_existing_student_and_persist_updates.py)
- **Test Error:** TEST BLOCKED

Student creation cannot be completed because there are no available plans to select.

Observations:
- The 'Plano Selecionado' combobox shows 'Nenhum plano disponível'
- Attempting to submit the new-student form displayed the validation 'Nome é obrigatório' and prevented saving
- There are no plan options available in the plan list, so a required prerequisite (a selectable plan) is missing
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8fa94146-3b23-4707-89b9-dae44e2b9011/1dd8a85a-0735-4a60-a24a-1493477fc5a2
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011 Cancel invoice selection returns to invoice list without PIX details
- **Test Code:** [TC011_Cancel_invoice_selection_returns_to_invoice_list_without_PIX_details.py](./TC011_Cancel_invoice_selection_returns_to_invoice_list_without_PIX_details.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8fa94146-3b23-4707-89b9-dae44e2b9011/3e35b231-5ab3-404f-bd09-5f934d3fb746
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012 Invoice list handles empty state
- **Test Code:** [TC012_Invoice_list_handles_empty_state.py](./TC012_Invoice_list_handles_empty_state.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8fa94146-3b23-4707-89b9-dae44e2b9011/aa54a959-de17-46a9-b0e7-4f7fce5909d6
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013 Workout requires at least one exercise before saving
- **Test Code:** [TC013_Workout_requires_at_least_one_exercise_before_saving.py](./TC013_Workout_requires_at_least_one_exercise_before_saving.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8fa94146-3b23-4707-89b9-dae44e2b9011/811f89de-a7eb-4b5b-9626-49648f40f8ab
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014 Student CPF length validation prevents save
- **Test Code:** [TC014_Student_CPF_length_validation_prevents_save.py](./TC014_Student_CPF_length_validation_prevents_save.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8fa94146-3b23-4707-89b9-dae44e2b9011/36957889-5140-40ea-81ca-46ff79d6d206
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015 Prevent PIX generation when invoice amount is invalid or missing
- **Test Code:** [TC015_Prevent_PIX_generation_when_invoice_amount_is_invalid_or_missing.py](./TC015_Prevent_PIX_generation_when_invoice_amount_is_invalid_or_missing.py)
- **Test Error:** TEST BLOCKED

The test cannot proceed because an invoice with a missing or invalid amount could not be found or created through the visible UI.

Observations:
- The opened invoice details show a valid amount: R$ 150.00 for 'João Silva Teste'.
- The payments list contains only invoices with valid amounts (no missing/invalid amounts found).
- There is no visible UI control available to create or edit an invoice amount into a missing/invalid state from this page.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8fa94146-3b23-4707-89b9-dae44e2b9011/b2a0e0b3-80f0-4c95-ac99-367bbfd509e5
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC016 Registration blocks invalid email or mismatched passwords
- **Test Code:** [TC016_Registration_blocks_invalid_email_or_mismatched_passwords.py](./TC016_Registration_blocks_invalid_email_or_mismatched_passwords.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8fa94146-3b23-4707-89b9-dae44e2b9011/19c4931d-4a6e-4125-b7a8-37878b5cf64a
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **68.75** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---