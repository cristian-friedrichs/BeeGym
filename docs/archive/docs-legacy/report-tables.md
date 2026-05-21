# 📊 Relatório de Triagem de Tabelas (Filtro Rigoroso)

> ℹ️ **Nota:** Arquivos de tipagem do Supabase (`database.types.ts`, `supabase.ts`) foram ignorados para revelar o real uso em serviços e componentes.

## 🟢 Tabelas ATIVAS (com referências no código)
- **workout_execution** (2 arquivos)
  - `src\components\treinos\workout-details-sheet.tsx`
  - `src\components\treinos\workout-execution-sheet.tsx`
- **workout_executions** (2 arquivos)
  - `src\components\treinos\workout-details-sheet.tsx`
  - `src\components\treinos\workout-execution-sheet.tsx`
- **workout_exercises** (5 arquivos)
  - `src\actions\treinos.ts`
  - `src\components\painel\modals\event-details-modal.tsx`
  - `src\components\painel\modals\new-training-modal.tsx`
  - `src\components\treinos\workout-modal.tsx`
  - `src\services\supabase\treinos.ts`
- **workout_logs** (2 arquivos)
  - `src\components\painel\modals\event-details-modal.tsx`
  - `src\components\painel\modals\session-manager-modal.tsx`
- **calendar_events** (18 arquivos)
  - `src\actions\aulas.ts`
  - `src\app\(main)\agenda\page.tsx`
  - `src\app\(main)\aulas\page.tsx`
  - `src\app\(main)\treinos\page.tsx`
  - `src\components\painel\active-session-banner.tsx`
  - ...e mais 13 arquivos
- **classes** (18 arquivos)
  - `src\actions\aulas.ts`
  - `src\app\(main)\alunos\page.tsx`
  - `src\app\(main)\aulas\new\page.tsx`
  - `src\app\(main)\aulas\page.tsx`
  - `src\app\(main)\relatorios\page.tsx`
  - ...e mais 13 arquivos
- **class_attendees** (2 arquivos)
  - `src\app\(main)\relatorios\page.tsx`
  - `src\components\painel\modals\event-details-modal.tsx`
- **event_enrollments** (9 arquivos)
  - `src\actions\aulas.ts`
  - `src\app\(main)\agenda\page.tsx`
  - `src\app\(main)\aulas\page.tsx`
  - `src\app\(main)\treinos\page.tsx`
  - `src\components\painel\active-session-banner.tsx`
  - ...e mais 4 arquivos
- **messages** (4 arquivos)
  - `src\app\(main)\conversas\page.tsx`
  - `src\app\api\admin\contratantes\[id]\route.ts`
  - `src\components\alunos\quick-message-modal.tsx`
  - `src\components\painel\dialogs\send-message-dialog.tsx`
- **chats** (2 arquivos)
  - `src\app\(main)\conversas\page.tsx`
  - `src\components\alunos\quick-message-modal.tsx`
- **chat_participants** (3 arquivos)
  - `src\app\(main)\conversas\page.tsx`
  - `src\components\alunos\quick-message-modal.tsx`
  - `src\components\painel\topbar-actions.tsx`
- **chat_messages** (3 arquivos)
  - `src\app\(main)\conversas\page.tsx`
  - `src\components\alunos\quick-message-modal.tsx`
  - `src\components\painel\dialogs\send-message-dialog.tsx`
- **student_measurements** (4 arquivos)
  - `src\app\(main)\alunos\[id]\measurements\page.tsx`
  - `src\app\(main)\alunos\[id]\page.tsx`
  - `src\components\alunos\create-measurement-modal.tsx`
  - `src\services\supabase\student-profile.ts`

## 🏁 Tabelas Deletadas/Inativas (Limpeza Concluída)
As tabelas abaixo foram identificadas como órfãs (sem uso no código principal) e removidas do banco de dados na fase pré-deploy:

- **class_attendance** (Substituída por `class_attendees`)
- **conversations** (Substituída por `chats`)
- **messages** (Substituída por `chat_messages`)
- **physical_assessments** (Substituída por `student_measurements`)
- **workout_execution** (Substituída por `workout_executions`)
