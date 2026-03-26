# 🐝 BeeGym - Product Requirements Document (PRD)

> **Documento de Requisitos e Comportamento de Sistema**
> Foco exclusivo nas regras de negócio, jornadas de usuário e validações do ecossistema BeeGym.

## 1. Visão Geral da Plataforma
O **BeeGym** é uma plataforma SaaS B2B2C premium, desenhada para academias, estúdios (Pilates, Yoga, CrossFit) e personal trainers. O sistema resolve toda a esteira operacional: desde a captação e conversão (Landing Page), passando pelo controle de acesso e frequência, gestão de planos e pagamentos (integração nativa PIX EFI), até a prescrição de treinos e acompanhamento de alunos.

O foco da aplicação é entregar uma experiência *Black Gym Energy* (alta performance, estética moderna e usabilidade sem atrito).

---

## 2. Atores do Sistema e Matriz de Permissões
O acesso aos dados é rigidamente governado por **Row Level Security (RLS)** no banco de dados, isolando por `organization_id`.

| Ator | Descrição e Acessos |
| :--- | :--- |
| **OWNER** | Criador da organização. Tem privilégios irrestritos sobre todas as unidades, relatórios financeiros e faturamento (assinatura da própria academia na EFI). |
| **ADMIN / MANAGER** | Gestores do dia a dia. Acesso total à criação de planos, matrículas e dashboard operacional, podendo ser restritos a unidades específicas (`allowed_unit_ids`). |
| **INSTRUCTOR** | Foco técnico. Acesso a prescrição de treinos (`Workouts`), lista de exercícios, diário de presença (`AttendanceLog`) e registros de medidas. |
| **STAFF** | Foco em recepção. Realizam matrículas, recebem pagamentos presenciais e liberam catraca/check-in. |
| **STUDENT (Aluno)** | Usuário final. Acesso ao consumo via App: visualiza seus treinos em andamento, faz reservas em aulas (`EventParticipant`), paga faturas e acompanha sua evolução. |

---

## 3. Mapas de Funcionalidades e Regras de Validação

### 3.1. Autenticação e Onboarding da Academia
**Objetivo:** Permitir que o gestor conheça a plataforma, crie sua conta e contrate um plano para começar a usar.

* **Rotas e Telas:** `/` (Marketing), `/register`, `/login`, `/app` (Dashboard).
* **Comportamento Esperado:**
  1. O usuário preenche o cadastro.
  2. O sistema cria a `Organization`, vincula o usuário como `OWNER` e cria a primeira `Unit` padrão.
  3. No primeiro login, o sistema intercepta o acesso ao dashboard (`/app`) forçando o fluxo de assinatura (*Onboarding*).
  4. Somente após a confirmação do webhook do PIX (ou aprovação manual) o tenant é ativado.
* **Validações Estritas (`authSchema`):**
  * `name`: Obrigatório, mínimo de 3 caracteres.
  * `email`: Formato de e-mail estritamente válido. Impede contas duplicadas (Unique Key).
  * `password`: Mínimo 6 caracteres.
  * `confirmPassword`: Deve dar *match* exato com a senha digitada.

### 3.2. Motor de Pagamentos e Checkouts (Integração EFI PIX)
**Objetivo:** Transacionar a assinatura da academia com o BeeGym, e gerenciar faturas dos alunos.

* **Arquitetura:** `src/app/api/webhooks/efi/route.ts`
* **Comportamento Esperado:**
  1. Ao selecionar um plano, a API gera uma cobrança via EFI e devolve um QRCode PIX + Copia e Cola.
  2. O frontend implementa um *Long Polling* ou aguarda sinais de WebSocket para aprovar a tela automaticamente quando o PIX for pago.
  3. O Webhook EFI notifica o back-end das liquidações de faturas de forma assíncrona.
* **Validações Estritas:**
  * O Webhook só processa requisições que possuam certificado mTLS/credenciais válidas da EFI.
  * A confirmação de pagamento atualiza ativamente a tabela de permissões, mudando o status da organização/aluno para `ACTIVE`.

### 3.3. Configuração de Planos (Catálogo da Academia)
**Objetivo:** Permitir que a academia crie múltiplas modalidades e preços para venda aos alunos.

* **Estrutura de Dados:** Tabela `Plan`
* **Comportamento Esperado:**
  * Gestor cadastra "Musculação Anual", "Pilates 2x Semana", etc.
  * Planos podem ser `RECURRING` (mensalidades contínuas) ou `PACKAGE` (pacote de créditos/aulas).
* **Validações Estritas:**
  * `price` deve ser um número decimal `>= 0`.
  * `duration_days` deve ser `> 0` (ex: 30 para mensal).
  * Controle de Check-ins iterativo: Planos podem exigir o preenchimento de `checkinLimit` (ex: 2) e `checkinCycle` (ex: "Semanal").

### 3.4. Gestão de Alunos (CRM e Matrículas)
**Objetivo:** Visão 360 do aluno, dados cadastrais e vínculos aos planos.

* **Rotas e Telas:** `/app/students` e Sub-modais (`student-modal.tsx`).
* **Comportamento Esperado:**
  * Cadastro unificado do aluno com vínculo a sua Unidade de preferência.
  * Adição de planos dinâmicos na aba de contratos.
  * Vínculo de modalidades (ex: Dias fixos ou Agendamento Livre).
* **Validações Estritas (`studentSchema`):**
  * `cpf`: Obrigatório string com **exatamente 14 caracteres** (máscara `000.000.000-00`).
  * `phone`: Obrigatório mínimo de 10 caracteres.
  * **Endereço Completo:** `street`, `number`, `neighborhood`, `city`, `state` e `zip` (min: 8) são obrigatórios, garantindo emissão correta de NF/Recibos.
  * **Configuração de Plano (`StudentPlanAssignment`):**
    * Exige um `planId` válido.
    * A data de Início (`startDate`) e Vencimento (`dueDate`) são obrigatórias.
    * Descontos: Devem ser validados como `PERCENT` ou `ABSOLUTE` e valor `>= 0`.
  * **Agendamento (`scheduling`):** Se modo for `fixed`, obriga o preenchimento dos dias da semana e horários (`dayOfWeek` e `time`).

### 3.5. Grade Escolar, Eventos e Reservas (Calendário)
**Objetivo:** Funcionamento do sistema de agendamento de aulas (ex: CrossFit, Yoga).

* **Estrutura de Dados:** `ClassTemplate`, `CalendarEvent` e `EventParticipant`.
* **Comportamento Esperado:**
  * O gestor monta a Grade (Template). O sistema instancia *CalendarEvents* automaticamente.
  * Alunos disputam vagas pelo App.
  * Há fila de espera caso a capacidade seja atingida.
* **Validações Estritas:**
  * **Capacidade de Sala (`maxStudents` e `Room.capacity`):** O sistema não permite overbooking acima da capacidade estipulada.
  * **Políticas de Cancelamento (`CancellationPolicy`):** Regras bloqueiam o botão de cancelamento caso o tempo atual ultrapasse o `cancelLimitMinutes` e aplicam *PenaltyType* (`LOSE_CREDIT` ou `FEE`).
  * **Conflitos de Sala:** Validada a flag `allowParallelBooking` para impedir duplicação de turmas no mesmo local/hora.
  * **Status da Aula:** Flui obrigatoriamente nesta ordem: `PREVISTA` (futuro) → `PENDENTE` (aberta turma) → `EM_EXECUCAO` (agora) → `REALIZADA` (completada) ou `FALTA` (cancelada/prof faltou).

### 3.6. Prescrição Fit e Fichas de Treino (Workouts)
**Objetivo:** Entrega de treinos padronizados (ou personalizados) e coleta de métricas de evolução.

* **Estrutura de Dados:** `Workout`, `WorkoutExercise`, `ExerciseLibrary` e `BodyMeasurement`.
* **Comportamento Esperado:**
  * O Instrutor escolhe exercícios de uma biblioteca base, define séries, repetições, cadência e repouso.
  * Central de registro de Antropometria (Gordura Corporal, Peso, Circunferências).
* **Validações Estritas:**
  * **Repetições Livres:** O campo `reps` no esquema *aceita String* de propósito (permitindo prescrições dinâmicas como "Até a falha" ou "10-12").
  * Um treino (`Workout`) pertence intrinsecamente a um Aluno (`studentId`), impedindo acesso cruzado.

---

## 4. Requisitos Não Funcionais Críticos
- **Segurança e Isolamento:** Autenticação via JWT/Supabase Auth com RLS rigoroso para garantir que usuários de uma `Organization` nunca leiam dados de outra.
- **Fail-fast API:** A API deve retornar `400 Bad Request` imediatamente se os contratos Zod falharem antes de acionar a camada ORM.
- **Cascata de Dados Restrita:** Exclusão de organizações ou alunos propagada via PostgreSQL (`onDelete: Cascade`) para respeitar requisições de esquecimento LGPD, desde que não atinja registros financeiros consolidados.
