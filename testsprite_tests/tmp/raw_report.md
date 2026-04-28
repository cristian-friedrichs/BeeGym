
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
- **Test Error:** TEST FAILURE

Signing in did not take the user to the authenticated dashboard.

Observations:
- The login page still shows 'Entrando...' and remained on the login screen.
- No dashboard-specific headings like 'Painel', 'Alunos', or 'Treinos' were present on the page.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/42a5c698-cde6-4977-90d1-832f5d726df6/d5f76e6a-d0e0-46ce-9f34-d695f6e5ad76
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 Auth-gated route redirects to login and returns after authentication
- **Test Code:** [TC002_Auth_gated_route_redirects_to_login_and_returns_after_authentication.py](./TC002_Auth_gated_route_redirects_to_login_and_returns_after_authentication.py)
- **Test Error:** TEST FAILURE

Signing in did not work — the provided credentials were not accepted, so the app did not return the user to the originally requested page.

Observations:
- After submitting the credentials the app stayed on the login page and did not redirect to /app/alunos.
- The UI showed an authentication error: 'E-mail ou senha incorretos. Tente novamente.'
- Two login attempts were made with teste10@teste.com / 123456 and both failed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/42a5c698-cde6-4977-90d1-832f5d726df6/16f0cf6e-c40c-47e1-b963-778fbf1bb7e3
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 Access payments requires login and returns to requested page
- **Test Code:** [TC003_Access_payments_requires_login_and_returns_to_requested_page.py](./TC003_Access_payments_requires_login_and_returns_to_requested_page.py)
- **Test Error:** TEST BLOCKED

The feature could not be reached because signing in with the provided credentials failed.

Observations:
- Unauthenticated access to /app/pagamentos correctly redirected to /login?redirect=%2Fapp%2Fpagamentos
- After submitting the provided credentials (teste10@teste.com / 123456) the page displayed 'E-mail ou senha incorretos. Tente novamente.' and did not proceed to the payments page

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/42a5c698-cde6-4977-90d1-832f5d726df6/85db32a6-d423-4d6d-958e-c5a55449fe78
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 Create a new student with full details and plan dates
- **Test Code:** [TC004_Create_a_new_student_with_full_details_and_plan_dates.py](./TC004_Create_a_new_student_with_full_details_and_plan_dates.py)
- **Test Error:** TEST BLOCKED

The test cannot continue because the staff login failed with the provided credentials.

Observations:
- The page shows the error message: "E-mail ou senha incorretos. Tente novamente."
- The login form remained visible and populated with the submitted email.
- The provided credentials (teste10@teste.com / 123456) were rejected, preventing access to the dashboard and the Students area.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/42a5c698-cde6-4977-90d1-832f5d726df6/cf4d1e9c-5995-4fcb-9cca-92c67b9faff5
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 Generate PIX QR code and copy payload for an outstanding invoice
- **Test Code:** [TC005_Generate_PIX_QR_code_and_copy_payload_for_an_outstanding_invoice.py](./TC005_Generate_PIX_QR_code_and_copy_payload_for_an_outstanding_invoice.py)
- **Test Error:** TEST BLOCKED

The test cannot proceed because login to the application failed with the provided credentials.

Observations:
- After submitting the login form the page displayed the error: 'E-mail ou senha incorretos. Tente novamente.'
- The dashboard and payments/invoices UI did not load, so selecting an invoice and generating a PIX cannot be performed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/42a5c698-cde6-4977-90d1-832f5d726df6/f3715401-024b-4078-a1a1-20381733076a
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 Register a new user then see onboarding after first login
- **Test Code:** [TC006_Register_a_new_user_then_see_onboarding_after_first_login.py](./TC006_Register_a_new_user_then_see_onboarding_after_first_login.py)
- **Test Error:** TEST FAILURE

User registration did not complete because the server returned an error when saving the new user.

Observations:
- The form submission returned the error message: 'Database error saving new user'.
- The page stayed on /register with the registration form still visible and filled.
- No success message, redirect to login, or created-account indication appeared.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/42a5c698-cde6-4977-90d1-832f5d726df6/f5b9f1e2-2e1c-443d-82e5-ec7a25bd7d31
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 Create and assign a workout with exercises and parameters
- **Test Code:** [TC007_Create_and_assign_a_workout_with_exercises_and_parameters.py](./TC007_Create_and_assign_a_workout_with_exercises_and_parameters.py)
- **Test Error:** TEST BLOCKED

The test cannot continue because login failed with the provided credentials.

Observations:
- The login page displayed the error: 'E-mail ou senha incorretos. Tente novamente.'
- Submitted credentials used: teste10@teste.com / 123456
- The dashboard and student/workout areas were not accessible after the submit
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/42a5c698-cde6-4977-90d1-832f5d726df6/976c5fdb-1f7f-4b1e-becc-265d52221205
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 Session persists across page reload on authenticated area
- **Test Code:** [TC008_Session_persists_across_page_reload_on_authenticated_area.py](./TC008_Session_persists_across_page_reload_on_authenticated_area.py)
- **Test Error:** TEST FAILURE

Logging in did not work — the app did not authenticate or show the authenticated UI.

Observations:
- After submitting credentials the page stayed on the login/loading screen and did not redirect to /app/painel.
- Direct navigation to /app/painel showed only a loading spinner and a notifications region, with no authenticated interface.
- Login was attempted twice with the provided credentials but authentication never completed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/42a5c698-cde6-4977-90d1-832f5d726df6/0771ab9d-c261-42b7-8c8b-9c9afc454ccc
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 View invoices list with payment statuses
- **Test Code:** [TC009_View_invoices_list_with_payment_statuses.py](./TC009_View_invoices_list_with_payment_statuses.py)
- **Test Error:** TEST BLOCKED

Login could not be completed because the provided credentials were rejected by the application.

Observations:
- After submitting the login form the page showed: 'E-mail ou senha incorretos. Tente novamente.'
- The app remained on the /login screen and did not redirect to the authenticated dashboard.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/42a5c698-cde6-4977-90d1-832f5d726df6/a77bcb2d-9117-4fde-90bb-21e08a2255c0
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 Edit an existing student and persist updates
- **Test Code:** [TC010_Edit_an_existing_student_and_persist_updates.py](./TC010_Edit_an_existing_student_and_persist_updates.py)
- **Test Error:** TEST BLOCKED

The test cannot continue because authentication failed and the dashboard cannot be reached.

Observations:
- The login page shows the error: "E-mail ou senha incorretos. Tente novamente."
- The page remains on the login screen and the application did not allow access with the provided credentials.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/42a5c698-cde6-4977-90d1-832f5d726df6/95b29add-4a79-4a1c-b049-0e5507d6b403
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011 Cancel invoice selection returns to invoice list without PIX details
- **Test Code:** [TC011_Cancel_invoice_selection_returns_to_invoice_list_without_PIX_details.py](./TC011_Cancel_invoice_selection_returns_to_invoice_list_without_PIX_details.py)
- **Test Error:** TEST BLOCKED

The test cannot proceed because login failed with the provided credentials.

Observations:
- The page displays an error banner: 'E-mail ou senha incorretos. Tente novamente.'
- Email and password fields remain populated and the app did not navigate to the dashboard.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/42a5c698-cde6-4977-90d1-832f5d726df6/11f40b59-368b-4cb5-81a4-681a726a7474
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012 Invoice list handles empty state
- **Test Code:** [TC012_Invoice_list_handles_empty_state.py](./TC012_Invoice_list_handles_empty_state.py)
- **Test Error:** TEST BLOCKED

The test cannot proceed because the account login failed and the dashboard (where Payments would be accessible) could not be reached.

Observations:
- After submitting the credentials, the login page displayed: 'E-mail ou senha incorretos. Tente novamente.'
- The dashboard navigation never appeared, so the Payments page could not be opened.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/42a5c698-cde6-4977-90d1-832f5d726df6/2e9985eb-a821-44f1-95a1-1b80cff4488c
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013 Workout requires at least one exercise before saving
- **Test Code:** [TC013_Workout_requires_at_least_one_exercise_before_saving.py](./TC013_Workout_requires_at_least_one_exercise_before_saving.py)
- **Test Error:** TEST BLOCKED

The feature could not be reached — I could not access the application areas needed to test workout validation because login failed.

Observations:
- The login page displayed the error: 'E-mail ou senha incorretos. Tente novamente.'
- The provided credentials (teste10@teste.com / 123456) were rejected and the app remained on the login screen

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/42a5c698-cde6-4977-90d1-832f5d726df6/bcdf4848-b273-4b67-b74a-e915b9a487ea
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014 Student CPF length validation prevents save
- **Test Code:** [TC014_Student_CPF_length_validation_prevents_save.py](./TC014_Student_CPF_length_validation_prevents_save.py)
- **Test Error:** TEST BLOCKED

The test cannot continue because signing in failed with an authentication error, preventing access to the students area required for the CPF validation check.

Observations:
- After submitting the provided credentials (teste10@teste.com / 123456), the page displays: "E-mail ou senha incorretos. Tente novamente."
- The UI remained on the login page and the dashboard or students navigation did not appear.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/42a5c698-cde6-4977-90d1-832f5d726df6/cd954238-fdc8-4348-8a7b-e4b615c046ae
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015 Prevent PIX generation when invoice amount is invalid or missing
- **Test Code:** [TC015_Prevent_PIX_generation_when_invoice_amount_is_invalid_or_missing.py](./TC015_Prevent_PIX_generation_when_invoice_amount_is_invalid_or_missing.py)
- **Test Error:** TEST BLOCKED

The feature could not be reached — login failed with the provided credentials, so the dashboard and the Payments/Invoices area cannot be accessed.

Observations:
- The login page displayed the message: 'E-mail ou senha incorretos. Tente novamente.'
- Dashboard did not load; cannot navigate to Payments/Invoices to test PIX generation.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/42a5c698-cde6-4977-90d1-832f5d726df6/ed62e914-a392-4285-904b-445c793e1fc2
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC016 Registration blocks invalid email or mismatched passwords
- **Test Code:** [TC016_Registration_blocks_invalid_email_or_mismatched_passwords.py](./TC016_Registration_blocks_invalid_email_or_mismatched_passwords.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/42a5c698-cde6-4977-90d1-832f5d726df6/161667f5-f8cb-4fcd-8b3f-0c09ebe96da7
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **6.25** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---