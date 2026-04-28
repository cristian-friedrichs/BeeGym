
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

Saving a new student failed — the application returned a server-side/schema error and did not create the student.

Observations:
- The app showed the error notification: "Could not find the 'address_city' column of 'students' in the schema cache" (displayed as 'Erro ao salvar aluno').
- The add-student modal remained open and the student 'Aluno Teste E2E' was not added to the students list.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1b0c7b8c-817b-4e5a-aa24-bcf709b5e979/940148d0-bfbd-4c40-9155-ee206abae008
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 Student list loads and is visible
- **Test Code:** [TC002_Student_list_loads_and_is_visible.py](./TC002_Student_list_loads_and_is_visible.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1b0c7b8c-817b-4e5a-aa24-bcf709b5e979/0d00e73b-fa8f-440b-993e-b333f1fd0ab4
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 Validation errors shown for invalid CPF and missing address fields
- **Test Code:** [TC003_Validation_errors_shown_for_invalid_CPF_and_missing_address_fields.py](./TC003_Validation_errors_shown_for_invalid_CPF_and_missing_address_fields.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1b0c7b8c-817b-4e5a-aa24-bcf709b5e979/5adfadd4-282a-4865-9853-0e22db36cd99
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 Authenticated access to Student Management route loads students page
- **Test Code:** [TC008_Authenticated_access_to_Student_Management_route_loads_students_page.py](./TC008_Authenticated_access_to_Student_Management_route_loads_students_page.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1b0c7b8c-817b-4e5a-aa24-bcf709b5e979/5c9ccc9e-dc23-4ca9-bdd3-a1e310a8ef69
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 Create and save a workout with one exercise (reps as range string)
- **Test Code:** [TC009_Create_and_save_a_workout_with_one_exercise_reps_as_range_string.py](./TC009_Create_and_save_a_workout_with_one_exercise_reps_as_range_string.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1b0c7b8c-817b-4e5a-aa24-bcf709b5e979/c177325f-a650-49bb-add5-178548a35d32
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 Create and save a workout with one exercise (reps as free-text string)
- **Test Code:** [TC010_Create_and_save_a_workout_with_one_exercise_reps_as_free_text_string.py](./TC010_Create_and_save_a_workout_with_one_exercise_reps_as_free_text_string.py)
- **Test Error:** TEST FAILURE

The workout did not save — required fields were not filled and the app blocked the save.

Observations:
- The Reps field contains 'Até a falha', showing the field accepts non-numeric text.
- After clicking 'Agendar Treino' a notification appeared: 'Preencha os campos obrigatórios'.
- The Treinos list still shows 'Nenhum treino encontrado', indicating the workout was not created.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1b0c7b8c-817b-4e5a-aa24-bcf709b5e979/3e1a8d6e-2758-41de-a8e4-90d789a9e973
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011 Validation: cannot save a workout without exercises
- **Test Code:** [TC011_Validation_cannot_save_a_workout_without_exercises.py](./TC011_Validation_cannot_save_a_workout_without_exercises.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1b0c7b8c-817b-4e5a-aa24-bcf709b5e979/2157bcba-fc1f-4dc6-82c8-4987aebfe227
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014 Auth required: accessing Treinos after login lands on Treinos page successfully
- **Test Code:** [TC014_Auth_required_accessing_Treinos_after_login_lands_on_Treinos_page_successfully.py](./TC014_Auth_required_accessing_Treinos_after_login_lands_on_Treinos_page_successfully.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1b0c7b8c-817b-4e5a-aa24-bcf709b5e979/4d38a601-0808-4360-a3e3-a3b048dea368
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC016 Generate PIX checkout and verify QR code + copia-e-cola are displayed
- **Test Code:** [TC016_Generate_PIX_checkout_and_verify_QR_code__copia_e_cola_are_displayed.py](./TC016_Generate_PIX_checkout_and_verify_QR_code__copia_e_cola_are_displayed.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1b0c7b8c-817b-4e5a-aa24-bcf709b5e979/94d75468-ad30-4fd1-893d-60abedab2a55
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC017 After generating PIX, verify copia-e-cola string is visible and non-empty
- **Test Code:** [TC017_After_generating_PIX_verify_copia_e_cola_string_is_visible_and_non_empty.py](./TC017_After_generating_PIX_verify_copia_e_cola_string_is_visible_and_non_empty.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1b0c7b8c-817b-4e5a-aa24-bcf709b5e979/2c0c6db0-7339-4290-9ce3-b9def801124d
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC018 Payments page shows an organization payment status label
- **Test Code:** [TC018_Payments_page_shows_an_organization_payment_status_label.py](./TC018_Payments_page_shows_an_organization_payment_status_label.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1b0c7b8c-817b-4e5a-aa24-bcf709b5e979/4347c81c-136a-4132-bd55-11ab97c1958a
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC019 Paid status reflected in UI and dashboard access is available
- **Test Code:** [TC019_Paid_status_reflected_in_UI_and_dashboard_access_is_available.py](./TC019_Paid_status_reflected_in_UI_and_dashboard_access_is_available.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1b0c7b8c-817b-4e5a-aa24-bcf709b5e979/1e166c1c-1083-4fca-b0d7-95212d3f3388
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 Phone validation blocks save when phone has fewer than 10 digits
- **Test Code:** [TC004_Phone_validation_blocks_save_when_phone_has_fewer_than_10_digits.py](./TC004_Phone_validation_blocks_save_when_phone_has_fewer_than_10_digits.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1b0c7b8c-817b-4e5a-aa24-bcf709b5e979/c6eb4142-ef5f-4594-b738-6c64e73809b7
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 ZIP validation blocks save when ZIP has fewer than 8 characters
- **Test Code:** [TC005_ZIP_validation_blocks_save_when_ZIP_has_fewer_than_8_characters.py](./TC005_ZIP_validation_blocks_save_when_ZIP_has_fewer_than_8_characters.py)
- **Test Error:** TEST FAILURE

The student modal did not prevent submission when the CEP (ZIP) was too short, and the save action failed with a server error instead of showing a CEP validation message.

Observations:
- Submitted the form with CEP '1234567' and the UI attempted to save the student.
- A red error toast appeared: "Erro ao salvar aluno - Could not find the 'address_city' column of 'students' in the schema cache'."
- No client-side CEP length validation message was shown; the modal remained open and the save did not succeed due to a backend/schema error.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1b0c7b8c-817b-4e5a-aa24-bcf709b5e979/bb3101b7-976a-4b3e-ba6d-58bb182fa8cd
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 Required address fields prevent saving when street is empty
- **Test Code:** [TC007_Required_address_fields_prevent_saving_when_street_is_empty.py](./TC007_Required_address_fields_prevent_saving_when_street_is_empty.py)
- **Test Error:** TEST FAILURE

Submitting the student form with the street (Rua) left empty did not produce an address-related validation. The form was blocked from saving, but the visible validation referred to a missing email rather than the missing address/street.

Observations:
- After submitting the modal with Rua empty the app showed a notification: 'Email é obrigatório'.
- No validation message mentioning 'Endereço' or 'Rua' appeared and the modal was not saved.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1b0c7b8c-817b-4e5a-aa24-bcf709b5e979/bf1046a4-5b1d-40e9-a8c8-0be1e616c2d9
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **73.33** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---