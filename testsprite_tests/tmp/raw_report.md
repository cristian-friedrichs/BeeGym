
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
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/49e78229-032f-4a4a-862c-eab382947e93/8c967381-2c6c-459a-99d8-f04aa2c32c94
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 Auth-gated route redirects to login and returns after authentication
- **Test Code:** [TC002_Auth_gated_route_redirects_to_login_and_returns_after_authentication.py](./TC002_Auth_gated_route_redirects_to_login_and_returns_after_authentication.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/49e78229-032f-4a4a-862c-eab382947e93/f2893286-9748-4a58-a893-ec37df39cf00
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 Access payments requires login and returns to requested page
- **Test Code:** [TC003_Access_payments_requires_login_and_returns_to_requested_page.py](./TC003_Access_payments_requires_login_and_returns_to_requested_page.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/49e78229-032f-4a4a-862c-eab382947e93/a24a9c0c-2443-4065-9769-c236d0bd0c67
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 Create a new student with full details and plan dates
- **Test Code:** [TC004_Create_a_new_student_with_full_details_and_plan_dates.py](./TC004_Create_a_new_student_with_full_details_and_plan_dates.py)
- **Test Error:** TEST FAILURE

The student was created but the required plan dates were not set during creation.

Observations:
- The page showed a notification 'Aluno cadastrado com sucesso!'.
- The students list contains 'Aluno Automacao 2026' but its Plano column shows 'Sem Plano'.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/49e78229-032f-4a4a-862c-eab382947e93/f9f48dbc-3648-4718-b5ef-50d118c9891e
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 Generate PIX QR code and copy payload for an outstanding invoice
- **Test Code:** [TC005_Generate_PIX_QR_code_and_copy_payload_for_an_outstanding_invoice.py](./TC005_Generate_PIX_QR_code_and_copy_payload_for_an_outstanding_invoice.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/49e78229-032f-4a4a-862c-eab382947e93/d9de0e68-c922-4222-8708-cb1af4f021b6
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 Register a new user then see onboarding after first login
- **Test Code:** [TC006_Register_a_new_user_then_see_onboarding_after_first_login.py](./TC006_Register_a_new_user_then_see_onboarding_after_first_login.py)
- **Test Error:** TEST FAILURE

Registration/login did not work — the newly created account could not log in.

Observations:
- After submitting the login form the page displayed 'E-mail ou senha incorretos. Tente novamente.'
- The application remained on the login screen and no onboarding plan prompt or dashboard was shown.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/49e78229-032f-4a4a-862c-eab382947e93/f5fff6cc-eaa7-476a-9be3-c845bfde1267
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 Create and assign a workout with exercises and parameters
- **Test Code:** [TC007_Create_and_assign_a_workout_with_exercises_and_parameters.py](./TC007_Create_and_assign_a_workout_with_exercises_and_parameters.py)
- **Test Error:** TEST FAILURE

Selecting a student inside the 'Novo Treino' modal does not work, so the instructor cannot create and assign a workout to the student.

Observations:
- The 'Novo Treino' modal is open but the Aluno combobox shows 'Nenhum aluno encontrado.'
- Multiple search attempts (full name and several substrings) returned no suggestions.
- Because no student can be selected, exercises cannot be added and the workout cannot be saved.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/49e78229-032f-4a4a-862c-eab382947e93/21e36198-5721-4060-af40-8ee6ab35d8ac
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 Session persists across page reload on authenticated area
- **Test Code:** [TC008_Session_persists_across_page_reload_on_authenticated_area.py](./TC008_Session_persists_across_page_reload_on_authenticated_area.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/49e78229-032f-4a4a-862c-eab382947e93/45244f11-ae5c-45d6-a3c0-2c66ad86ac87
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 View invoices list with payment statuses
- **Test Code:** [TC009_View_invoices_list_with_payment_statuses.py](./TC009_View_invoices_list_with_payment_statuses.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/49e78229-032f-4a4a-862c-eab382947e93/0bfc3234-96ef-46c8-be26-8f6d31fc28b1
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 Edit an existing student and persist updates
- **Test Code:** [TC010_Edit_an_existing_student_and_persist_updates.py](./TC010_Edit_an_existing_student_and_persist_updates.py)
- **Test Error:** TEST BLOCKED

The student details view cannot be reached because the application is stuck on a full-page loading spinner, preventing further interactions required by the test.

Observations:
- The page displays a persistent full-page loading spinner and only minimal interactive elements (app logo SVG and notifications).
- Multiple attempts to open the student, click the app logo to recover, re-navigate to /app/alunos, and waiting did not resolve the loading state.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/49e78229-032f-4a4a-862c-eab382947e93/e41780f6-6465-4ab8-8d9a-4879a3ac21e8
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011 Cancel invoice selection returns to invoice list without PIX details
- **Test Code:** [TC011_Cancel_invoice_selection_returns_to_invoice_list_without_PIX_details.py](./TC011_Cancel_invoice_selection_returns_to_invoice_list_without_PIX_details.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/49e78229-032f-4a4a-862c-eab382947e93/da0d9a94-5326-43d6-a864-20564abc170c
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012 Invoice list handles empty state
- **Test Code:** [TC012_Invoice_list_handles_empty_state.py](./TC012_Invoice_list_handles_empty_state.py)
- **Test Error:** TEST FAILURE

The payments page does not show an empty-state when there are no invoices — instead it displays existing transaction rows.

Observations:
- The 'Histórico de Transações' table contains two transaction rows with student names and values (e.g., 'João Silva Teste' — R$ 150,00).
- The page shows dates and statuses (e.g., 27/04/2026, 30/03/2026, Atrasado, Realizado), indicating populated data rather than an empty message.
- No empty-state message or placeholder text indicating "no invoices" is visible on the payments page.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/49e78229-032f-4a4a-862c-eab382947e93/e01b1830-3140-47ff-9af3-d8a8663c126d
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013 Workout requires at least one exercise before saving
- **Test Code:** [TC013_Workout_requires_at_least_one_exercise_before_saving.py](./TC013_Workout_requires_at_least_one_exercise_before_saving.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/49e78229-032f-4a4a-862c-eab382947e93/a50d90fa-b049-4da6-beb8-825b8ec135a3
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014 Student CPF length validation prevents save
- **Test Code:** [TC014_Student_CPF_length_validation_prevents_save.py](./TC014_Student_CPF_length_validation_prevents_save.py)
- **Test Error:** TEST FAILURE

Could not verify CPF-length validation because the form repeatedly blocked submission with 'Email é obrigatório' and the CPF check was not reached.

Observations:
- Clicking 'Concluir Matrícula' showed a red toast 'Email é obrigatório' and prevented the form from submitting.
- The new-student modal was discarded or the submit element became unavailable between attempts, preventing progressing to CPF validation.
- The CPF-length validation message was never displayed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/49e78229-032f-4a4a-862c-eab382947e93/b18b65f3-11d7-4d03-ba0a-8609a0c06df7
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015 Prevent PIX generation when invoice amount is invalid or missing
- **Test Code:** [TC015_Prevent_PIX_generation_when_invoice_amount_is_invalid_or_missing.py](./TC015_Prevent_PIX_generation_when_invoice_amount_is_invalid_or_missing.py)
- **Test Error:** TEST BLOCKED

The Invoices page could not be reached, so the PIX generation flow for an invoice cannot be tested.

Observations:
- Navigating to /app/pagamentos/faturas showed a 404 page with the message 'This page could not be found.'
- No invoice list or controls to attempt PIX generation were present on the page.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/49e78229-032f-4a4a-862c-eab382947e93/34c31067-e089-4979-b1ab-eee71322b59e
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC016 Registration blocks invalid email or mismatched passwords
- **Test Code:** [TC016_Registration_blocks_invalid_email_or_mismatched_passwords.py](./TC016_Registration_blocks_invalid_email_or_mismatched_passwords.py)
- **Test Error:** TEST BLOCKED

The passwords-mismatch validation could not be reached because the registration form does not include a confirm-password field.

Observations:
- The page showed the validation message: 'Unable to validate email address: invalid format'.
- The E-mail input is marked invalid (invalid=true) and submission is prevented for the malformed email.
- The registration form does not contain a confirm-password field, so mismatched-password behavior cannot be tested via the UI.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/49e78229-032f-4a4a-862c-eab382947e93/82970e10-0198-44e3-b2f0-8ae5055ccd73
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **50.00** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---