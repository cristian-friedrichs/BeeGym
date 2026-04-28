
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** BeeGym
- **Date:** 2026-04-28
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 Log in and reach the dashboard
- **Test Code:** [TC001_Log_in_and_reach_the_dashboard.py](./TC001_Log_in_and_reach_the_dashboard.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/04877158-1c1d-4750-a2c8-532496627a5f/3dd6360b-8909-4eaf-98df-00672f5e5c12
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 Auth-gated route redirects to login and returns after authentication
- **Test Code:** [TC002_Auth_gated_route_redirects_to_login_and_returns_after_authentication.py](./TC002_Auth_gated_route_redirects_to_login_and_returns_after_authentication.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/04877158-1c1d-4750-a2c8-532496627a5f/61c8dca0-bfdc-458a-ab71-613d65062d0e
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 Access payments requires login and returns to requested page
- **Test Code:** [TC003_Access_payments_requires_login_and_returns_to_requested_page.py](./TC003_Access_payments_requires_login_and_returns_to_requested_page.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/04877158-1c1d-4750-a2c8-532496627a5f/c1df5df6-0746-442a-8fa9-f3d01977dd00
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 Create a new student with full details and plan dates
- **Test Code:** [TC004_Create_a_new_student_with_full_details_and_plan_dates.py](./TC004_Create_a_new_student_with_full_details_and_plan_dates.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/04877158-1c1d-4750-a2c8-532496627a5f/bd68b61d-73a1-4710-959f-6ea0caa1963d
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 Generate PIX QR code and copy payload for an outstanding invoice
- **Test Code:** [TC005_Generate_PIX_QR_code_and_copy_payload_for_an_outstanding_invoice.py](./TC005_Generate_PIX_QR_code_and_copy_payload_for_an_outstanding_invoice.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/04877158-1c1d-4750-a2c8-532496627a5f/bcbf5633-1255-409f-8358-c4b4b14fa10a
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 Register a new user then see onboarding after first login
- **Test Code:** [TC006_Register_a_new_user_then_see_onboarding_after_first_login.py](./TC006_Register_a_new_user_then_see_onboarding_after_first_login.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/04877158-1c1d-4750-a2c8-532496627a5f/288df94e-f1d7-4061-a5e4-ef9ef0e1573b
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 Create and assign a workout with exercises and parameters
- **Test Code:** [TC007_Create_and_assign_a_workout_with_exercises_and_parameters.py](./TC007_Create_and_assign_a_workout_with_exercises_and_parameters.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/04877158-1c1d-4750-a2c8-532496627a5f/fac1ea5f-0e23-4ae0-9c98-9d0ad9c840b2
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 Session persists across page reload on authenticated area
- **Test Code:** [TC008_Session_persists_across_page_reload_on_authenticated_area.py](./TC008_Session_persists_across_page_reload_on_authenticated_area.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/04877158-1c1d-4750-a2c8-532496627a5f/1ac29c8a-b339-40c8-889a-fece4a389a74
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 View invoices list with payment statuses
- **Test Code:** [TC009_View_invoices_list_with_payment_statuses.py](./TC009_View_invoices_list_with_payment_statuses.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/04877158-1c1d-4750-a2c8-532496627a5f/54a0b52c-8247-4ff4-bf2c-fb254c62c09a
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 Edit an existing student and persist updates
- **Test Code:** [TC010_Edit_an_existing_student_and_persist_updates.py](./TC010_Edit_an_existing_student_and_persist_updates.py)
- **Test Error:** TEST FAILURE

Creating the student showed a success message, but the student cannot be found in the student list so the test cannot complete.

Observations:
- The UI displayed the confirmation toast 'Aluno cadastrado com sucesso!'.
- The students table still shows 'Nenhum aluno encontrado.' and multiple searches returned no results.
- Status filter and clearing searches were tried but the created student did not appear.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/04877158-1c1d-4750-a2c8-532496627a5f/f0db2702-64f4-41b4-b530-9d64dc6cec5f
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011 Cancel invoice selection returns to invoice list without PIX details
- **Test Code:** [TC011_Cancel_invoice_selection_returns_to_invoice_list_without_PIX_details.py](./TC011_Cancel_invoice_selection_returns_to_invoice_list_without_PIX_details.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/04877158-1c1d-4750-a2c8-532496627a5f/158e1243-ac4e-4e17-8557-855c890ab607
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012 Invoice list handles empty state
- **Test Code:** [TC012_Invoice_list_handles_empty_state.py](./TC012_Invoice_list_handles_empty_state.py)
- **Test Error:** TEST BLOCKED

The application dashboard did not finish loading, so I cannot navigate to the Payments page to verify the empty-state.

Observations:
- The page shows a centered loading spinner and minimal elements (notifications region) instead of the dashboard UI.
- No navigation/menu items are available to open the Payments/Invoices page.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/04877158-1c1d-4750-a2c8-532496627a5f/e1ee071c-ab8c-4402-a29d-b1f08749f10c
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013 Workout requires at least one exercise before saving
- **Test Code:** [TC013_Workout_requires_at_least_one_exercise_before_saving.py](./TC013_Workout_requires_at_least_one_exercise_before_saving.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/04877158-1c1d-4750-a2c8-532496627a5f/454e2d89-431f-4cbc-9296-f26bd5c93559
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014 Student CPF length validation prevents save
- **Test Code:** [TC014_Student_CPF_length_validation_prevents_save.py](./TC014_Student_CPF_length_validation_prevents_save.py)
- **Test Error:** TEST BLOCKED

The Students page (/alunos) could not be reached — the application returned a 404 and the student creation UI is not available, so the CPF length validation cannot be tested.

Observations:
- Navigating to http://127.0.0.1:9002/alunos shows a 404 page with the message 'This page could not be found.'
- The page has no student form or related interactive elements (only a notifications region is present).

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/04877158-1c1d-4750-a2c8-532496627a5f/991085c6-36ef-4880-aef0-42f1cef6e116
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015 Prevent PIX generation when invoice amount is invalid or missing
- **Test Code:** [TC015_Prevent_PIX_generation_when_invoice_amount_is_invalid_or_missing.py](./TC015_Prevent_PIX_generation_when_invoice_amount_is_invalid_or_missing.py)
- **Test Error:** TEST BLOCKED

The Payments page did not finish loading so the test could not be executed. The invoice list and PIX generation controls are not available, preventing validation of PIX generation for an invoice with missing/invalid amount.

Observations:
- The /app/pagamentos page shows only a centered loading spinner and no invoices list or PIX controls.
- After multiple wait attempts the SPA content did not render and there are only minimal interactive elements (SVG and notifications region).
- Unable to select an invoice or attempt PIX generation because the required UI is not present.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/04877158-1c1d-4750-a2c8-532496627a5f/3d64be69-7b6e-4394-94a5-fd4aabf1bc3b
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC016 Registration blocks invalid email or mismatched passwords
- **Test Code:** [TC016_Registration_blocks_invalid_email_or_mismatched_passwords.py](./TC016_Registration_blocks_invalid_email_or_mismatched_passwords.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/04877158-1c1d-4750-a2c8-532496627a5f/65cf1730-cc0f-4fb8-9182-a4a49c7a7772
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **75.00** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---