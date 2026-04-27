
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** BeeGym
- **Date:** 2026-04-27
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 Create a new student with valid details and see it in the list
- **Test Code:** [TC001_Create_a_new_student_with_valid_details_and_see_it_in_the_list.py](./TC001_Create_a_new_student_with_valid_details_and_see_it_in_the_list.py)
- **Test Error:** TEST FAILURE

The enrollment modal does not include the CPF or address inputs needed to add a student with a valid CPF and full address, so the test cannot be completed.

Observations:
- The 'Nova Matrícula' modal displays name, email and phone fields but there is no CPF input visible in the form.
- Scrolling the enrollment dialog multiple times did not reveal any CPF or address fields.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2549dd2-b566-4eab-89bd-5bf8ac874526/e017f988-c972-4186-8ce7-72b6a909c97b
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 Student list loads and is visible
- **Test Code:** [TC002_Student_list_loads_and_is_visible.py](./TC002_Student_list_loads_and_is_visible.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2549dd2-b566-4eab-89bd-5bf8ac874526/d8c5569f-32a8-41ba-8f6e-78bd95f23bc3
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 Validation errors shown for invalid CPF and missing address fields
- **Test Code:** [TC003_Validation_errors_shown_for_invalid_CPF_and_missing_address_fields.py](./TC003_Validation_errors_shown_for_invalid_CPF_and_missing_address_fields.py)
- **Test Error:** TEST FAILURE

The CPF and Endereço fields required for the validation test are not present in the 'Novo Aluno' / 'Nova Matrícula' form, so it is not possible to verify CPF-length or required-address validations.

Observations:
- The open 'Nova Matrícula' modal contains inputs for Nome Completo, Endereço de Email, Celular/WhatsApp, Data de Nascimento, Objetivo, Plano Selecionado and Status, but there is no CPF or Endereço field visible.
- I scrolled the dialog and inspected the visible input elements (e.g., indexes 2983, 2985, 2987, 3010, 3012) and could not find any CPF or Endereço labels/inputs.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2549dd2-b566-4eab-89bd-5bf8ac874526/060141e6-de74-47ee-b9fd-13bb588bc7fc
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 Authenticated access to Student Management route loads students page
- **Test Code:** [TC008_Authenticated_access_to_Student_Management_route_loads_students_page.py](./TC008_Authenticated_access_to_Student_Management_route_loads_students_page.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2549dd2-b566-4eab-89bd-5bf8ac874526/f724de64-dbd9-4cd7-8e74-e3cd26347cd1
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 Create and save a workout with one exercise (reps as range string)
- **Test Code:** [TC009_Create_and_save_a_workout_with_one_exercise_reps_as_range_string.py](./TC009_Create_and_save_a_workout_with_one_exercise_reps_as_range_string.py)
- **Test Error:** TEST BLOCKED

The feature could not be reached — no student exists to assign the workout, so the create-workout flow cannot be completed.

Observations:
- The 'Novo Treino' modal is open but the Aluno (student) search shows 'Nenhum aluno encontrado' and no student can be selected.
- An exercise has not been selected and the workout cannot be saved without a student assignment.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2549dd2-b566-4eab-89bd-5bf8ac874526/4007b790-5a0f-4b99-9569-cd80870f0d7a
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 Create and save a workout with one exercise (reps as free-text string)
- **Test Code:** [TC010_Create_and_save_a_workout_with_one_exercise_reps_as_free_text_string.py](./TC010_Create_and_save_a_workout_with_one_exercise_reps_as_free_text_string.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2549dd2-b566-4eab-89bd-5bf8ac874526/f0a6f09b-f1a8-4830-a679-233d444dd7f5
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011 Validation: cannot save a workout without exercises
- **Test Code:** [TC011_Validation_cannot_save_a_workout_without_exercises.py](./TC011_Validation_cannot_save_a_workout_without_exercises.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2549dd2-b566-4eab-89bd-5bf8ac874526/2c0d939c-2eee-428c-b983-843d0f7cd942
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014 Auth required: accessing Treinos after login lands on Treinos page successfully
- **Test Code:** [TC014_Auth_required_accessing_Treinos_after_login_lands_on_Treinos_page_successfully.py](./TC014_Auth_required_accessing_Treinos_after_login_lands_on_Treinos_page_successfully.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2549dd2-b566-4eab-89bd-5bf8ac874526/9c7388da-3585-4bc1-96fe-2c136d9596d5
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC016 Generate PIX checkout and verify QR code + copia-e-cola are displayed
- **Test Code:** [TC016_Generate_PIX_checkout_and_verify_QR_code__copia_e_cola_are_displayed.py](./TC016_Generate_PIX_checkout_and_verify_QR_code__copia_e_cola_are_displayed.py)
- **Test Error:** TEST FAILURE

Generating a PIX payment request did not show a QR code or copia-e-cola string.

Observations:
- After clicking to register/confirm the payment, the UI showed 'Pagamento confirmado!' and the invoice status changed to PAGO/Realizado instead of displaying a PIX QR or copia-e-cola.
- The invoice details panel shows Método: Pix and Status: PAGO, but no QR image or copia-e-cola string is visible.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2549dd2-b566-4eab-89bd-5bf8ac874526/8e33789f-7963-46d6-836b-d631ef345f52
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC017 After generating PIX, verify copia-e-cola string is visible and non-empty
- **Test Code:** [TC017_After_generating_PIX_verify_copia_e_cola_string_is_visible_and_non_empty.py](./TC017_After_generating_PIX_verify_copia_e_cola_string_is_visible_and_non_empty.py)
- **Test Error:** TEST BLOCKED

The test cannot proceed because the visible transaction is already paid and there is no way to generate a PIX checkout from this state.

Observations:
- The payment details sidebar shows status 'PAGO' and Método 'Pix'.
- There is no 'Gerar PIX' action or 'copia-e-cola' content visible in the UI.
- An unpaid transaction or a UI control to create/generate a PIX checkout is required to run this verification.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2549dd2-b566-4eab-89bd-5bf8ac874526/444cb35d-2a7a-4249-ae5f-9967858c3a3a
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC018 Payments page shows an organization payment status label
- **Test Code:** [TC018_Payments_page_shows_an_organization_payment_status_label.py](./TC018_Payments_page_shows_an_organization_payment_status_label.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2549dd2-b566-4eab-89bd-5bf8ac874526/da82bac4-62a9-43e9-82cf-f923058114a2
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC019 Paid status reflected in UI and dashboard access is available
- **Test Code:** [TC019_Paid_status_reflected_in_UI_and_dashboard_access_is_available.py](./TC019_Paid_status_reflected_in_UI_and_dashboard_access_is_available.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2549dd2-b566-4eab-89bd-5bf8ac874526/00bf7096-c8af-4c69-a1b6-3017ec9da387
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 Phone validation blocks save when phone has fewer than 10 digits
- **Test Code:** [TC004_Phone_validation_blocks_save_when_phone_has_fewer_than_10_digits.py](./TC004_Phone_validation_blocks_save_when_phone_has_fewer_than_10_digits.py)
- **Test Error:** TEST FAILURE

The student creation modal allowed saving a student with a phone number shorter than the minimum required.

Observations:
- The students list contains 'Aluno Telefone Curto' (shortphone@example.com), showing the record was saved.
- No inline validation message near the phone field and no toast message were visible after submission.
- The UI shows the student in the list, so the modal did not prevent saving.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2549dd2-b566-4eab-89bd-5bf8ac874526/016587a3-e8d3-4311-ac01-a6fb76cfe703
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 ZIP validation blocks save when ZIP has fewer than 8 characters
- **Test Code:** [TC005_ZIP_validation_blocks_save_when_ZIP_has_fewer_than_8_characters.py](./TC005_ZIP_validation_blocks_save_when_ZIP_has_fewer_than_8_characters.py)
- **Test Error:** TEST BLOCKED

The ZIP (CEP) input required to test minimum ZIP length is not reachable in the open 'NOVA MATRÍCULA' dialog, so I cannot perform the validation check.

Observations:
- The student creation modal is open but contains only personal, plan and objective fields; no address/CEP input is visible.
- I scrolled the dialog multiple times (including to the bottom) and the CEP field did not appear.
- Without the CEP input in this modal, I cannot enter a short ZIP and verify that the form prevents saving.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2549dd2-b566-4eab-89bd-5bf8ac874526/f4515117-c916-4b9f-9db7-06d7d5767678
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 Required address fields prevent saving when street is empty
- **Test Code:** [TC007_Required_address_fields_prevent_saving_when_street_is_empty.py](./TC007_Required_address_fields_prevent_saving_when_street_is_empty.py)
- **Test Error:** TEST FAILURE

The student form allowed saving without the required street (Rua) and no address validation message was shown.

Observations:
- The 'Nova Matrícula' modal did not show address inputs or any validation error for a missing street.
- After clicking 'Concluir Matrícula' the student 'Aluno Sem Rua' appears in the Alunos list, indicating the record was saved despite the missing street.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2549dd2-b566-4eab-89bd-5bf8ac874526/12aa6599-dde7-4370-9fb9-76437970f37a
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **46.67** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---