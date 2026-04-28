# TestSprite AI Testing Report (MCP) - BeeGym - Run #3

---

## 1️⃣ Document Metadata
- **Project Name:** BeeGym
- **Date:** 2026-04-28
- **Prepared by:** Antigravity (Google DeepMind)
- **Environment:** Local Production (Port 9002)
- **Authentication:** teste10@teste.com / 123456

---

## 2️⃣ Requirement Validation Summary

### 🔐 Authentication & Security
| Test ID | Title | Status | Findings |
|---------|-------|--------|----------|
| [TC001](./TC001_Log_in_and_reach_the_dashboard.py) | Log in and reach the dashboard | ✅ Passed | Stable. |
| [TC002](./TC002_Auth_gated_route_redirects_to_login_and_returns_after_authentication.py) | Auth-gated route redirects to login | ✅ Passed | Stable. |
| [TC003](./TC003_Access_payments_requires_login_and_returns_to_requested_page.py) | Access payments requires login | ✅ Passed | Stable. |
| [TC008](./TC008_Session_persists_across_page_reload_on_authenticated_area.py) | Session persists across page reload | ✅ Passed | Stable. |

### 👥 Student Management
| Test ID | Title | Status | Findings |
|---------|-------|--------|----------|
| [TC004](./TC004_Create_a_new_student_with_full_details_and_plan_dates.py) | Create a new student | ✅ Passed | **FIXED:** Plans are now appearing and student creation works. |
| [TC010](./TC010_Edit_an_existing_student_and_persist_updates.py) | Edit an existing student | ❌ Failed | **BUG:** Student created with success message but does not appear in the list. |
| [TC014](./TC014_Student_CPF_length_validation_prevents_save.py) | Student CPF length validation | ⚠️ BLOCKED | **REGRESSION:** Route `/alunos` returned 404 in this run. |

### 🏋️ Workout Management
| Test ID | Title | Status | Findings |
|---------|-------|--------|----------|
| [TC007](./TC007_Create_and_assign_a_workout_with_exercises_and_parameters.py) | Create and assign a workout | ✅ Passed | Stable. |
| [TC013](./TC013_Workout_requires_at_least_one_exercise_before_saving.py) | Workout requires at least one exercise | ✅ Passed | Stable. |

### 💰 Payments & Invoices
| Test ID | Title | Status | Findings |
|---------|-------|--------|----------|
| [TC005](./TC005_Generate_PIX_QR_code_and_copy_payload_for_an_outstanding_invoice.py) | Generate PIX QR code | ✅ Passed | Stable. |
| [TC009](./TC009_View_invoices_list_with_payment_statuses.py) | View invoices list | ✅ Passed | Stable. |
| [TC011](./TC011_Cancel_invoice_selection_returns_to_invoice_list) | Cancel invoice selection | ✅ Passed | Stable. |
| [TC012](./TC012_Invoice_list_handles_empty_state) | Invoice list empty state | ⚠️ BLOCKED | **UI BUG:** Persistent loading spinner prevents page access. |
| [TC015](./TC015_Prevent_PIX_generation_when_invoice_amount_is_invalid) | Invalid amount PIX block | ⚠️ BLOCKED | **UI BUG:** Persistent loading spinner on `/app/pagamentos`. |

### 📝 Registration
| Test ID | Title | Status | Findings |
|---------|-------|--------|----------|
| [TC006](./TC006_Register_a_new_user_then_see_onboarding) | User registration | ✅ Passed | **FIXED:** Registration worked correctly in this run. |
| [TC016](./TC016_Registration_blocks_invalid_email_or_mismatched_passwords) | Registration validation | ✅ Passed | Stable. |

---

## 3️⃣ Coverage & Matching Metrics

- **Success Rate:** 75.00% (12/16 Passed)
- **Failure Rate:** 6.25% (1/16 Failed)
- **Blocked Rate:** 18.75% (3/16 Blocked)

| Module | Passed | Failed | Blocked |
|--------|--------|--------|---------|
| Auth | 4 | 0 | 0 |
| Students | 1 | 1 | 1 |
| Workouts | 2 | 0 | 0 |
| Payments | 3 | 0 | 2 |
| Registration | 2 | 0 | 0 |

---

## 4️⃣ Key Gaps / Risks

1.  **🚨 Persistent Loading Spinners:** Routes like `/app/pagamentos` and `/dashboard` occasionally get stuck in a loading state. This is likely due to an unhandled promise rejection or a race condition in data fetching.
2.  **🚨 Ghost Students:** TC010 shows that students are "created" (success toast) but not immediately visible in the table. This could be a cache synchronization issue (TanStack Query) or a failure in the Supabase real-time/refetch logic.
3.  **⚠️ Route Stability:** The 404 on `/alunos` (TC014) is highly suspicious given that the feature was working. Needs investigation into Next.js routing or middleware.

---
