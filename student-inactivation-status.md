# Plano de Trabalho: Inativação de Alunos e Alinhamento de Status

Este plano detalha a implementação do fluxo de inativação manual de alunos com justificativa (motivo) via dropdown e o alinhamento automático de status ("Ativo", "Pagamento Pendente" e "Inativo" por inadimplência > 30 dias).

**Tipo de Projeto:** WEB (Next.js / React / Supabase)

---

## Overview

### 1. Inativação Manual com Justificativa
Adição de um fluxo visual de confirmação ao clicar no botão/ícone de inativação de um aluno. O usuário deve selecionar um motivo obrigatório a partir de um dropdown e, se selecionar "Outros", detalhar o motivo em uma caixa de texto.

### 2. Alinhamento de Status
- **Ativo:** Aluno ativo com pagamentos em dia.
- **Pagamento Pendente:** Aluno com faturas vencidas há até 30 dias.
- **Inativo:** Aluno inativado manualmente ou automaticamente (inadimplente com alguma fatura com mais de 30 dias de atraso).

---

## Success Criteria

1. **Inativação Manual:**
   - Botão de inativação visível e funcional na listagem de alunos (desktop e mobile) e no perfil detalhado do aluno.
   - Modal/dialog de confirmação solicitando o motivo obrigatório.
   - Dropdown com as principais justificativas comerciais/financeiras.
   - Textarea opcional que se torna obrigatório ou visível quando a opção "Outros" é selecionada.
   - Persistência do motivo no campo `inactive_reason` da tabela `students`.
   - Suporte para reativação do aluno (limpando o status e justificativa).

2. **Regras de Status Automáticas:**
   - Faturas atualizadas ou transcurso de tempo recalcula o status do aluno.
   - Se o aluno possuir faturas pendentes há mais de 30 dias de atraso, o status torna-se `INACTIVE` com o motivo `"Inadimplência (mais de 30 dias de atraso)"`.
   - Se possuir faturas pendentes há menos de 30 dias, o status torna-se `OVERDUE` (exibido como `"Pagamento Pendente"`).
   - Se regularizar e não tiver pendências, retorna a `ACTIVE` (Ativo).
   - Alunos inativados manualmente (com outros motivos) permanecem inativos.

---

## Tech Stack

- **Framework:** Next.js (React / TypeScript)
- **Banco de Dados:** PostgreSQL (Supabase)
- **Biblioteca UI:** Radix UI / shadcn (Componentes `Select`, `Dialog`, `ResponsiveDialog`)
- **Ícones:** Lucide React (`Power`, `UserX`, `AlertTriangle`)

---

## File Structure

Os seguintes arquivos serão modificados ou criados:

```
├── supabase/
│   └── migrations/ (Para histórico, se aplicável, ou via SQL Editor)
└── src/
    ├── app/
    │   └── app/
    │       └── (authenticated)/
    │           └── alunos/
    │               ├── page.tsx (Listagem: adicionar ícone de inativação e badge de pagamento pendente)
    │               └── [id]/
    │                   └── page.tsx (Detalhes: conectar ao modal/dialog de status reutilizável)
    ├── components/
    │   ├── painel/
    │   │   └── dialogs/
    │   │       └── student-status-dialog.tsx (Refatorar para Dialog, dropdown de motivos, e confirmação)
    │   └── alunos/
    │       └── student-profile-main-section.tsx (Perfil: ajustar botões de inativação/ativação)
```

---

## Task Breakdown

### Task 1: Banco de Dados - Schema e Lógica
- **Agente:** `backend-specialist`
- **Skill:** `database-design`
- **Prioridade:** P0
- **Dependencies:** Nenhuma
- **Descrição:** Adicionar a coluna `inactive_reason` à tabela `students` e atualizar a procedure SQL `update_finished_classes_status` (chamada periodicamente na listagem de alunos) para reavaliar automaticamente os status com base nas faturas (`invoices`).
- **INPUT:** Acesso ao Supabase SQL Editor.
- **OUTPUT:**
  - Tabela `students` contendo a coluna `inactive_reason`.
  - RPC SQL atualizada contendo o cálculo automático dos status de inadimplência (> 30 dias) e pagamento pendente (< 30 dias).
- **VERIFY:**
  - Rodar consultas SQL para validar a coluna e a chamada da função.

### Task 2: Refatoração do StudentStatusDialog
- **Agente:** `frontend-specialist`
- **Skill:** `frontend-design`
- **Prioridade:** P1
- **Dependencies:** Task 1
- **Descrição:** Refatorar o componente `StudentStatusDialog` para usar um `Dialog` / `ResponsiveDialog` centrado. Substituir a caixa de texto livre por um Dropdown (`Select`) de motivos de inativação pré-definidos (e exibir campo de observações se "Outros" for selecionado).
- **INPUT:** `src/components/painel/dialogs/student-status-dialog.tsx`
- **OUTPUT:** Componente atualizado com formulário estruturado e fluxo de reativação limpo.
- **VERIFY:** Visualizar localmente a abertura e a validação de obrigatoriedade do motivo.

### Task 3: Integração na Listagem de Alunos (Alunos Page)
- **Agente:** `frontend-specialist`
- **Skill:** `frontend-design`
- **Prioridade:** P2
- **Dependencies:** Task 2
- **Descrição:** Inserir o ícone de ação rápida para inativação de alunos na tabela (desktop) e nos cartões (mobile) na listagem principal. Renomear o rótulo do badge de `OVERDUE` de "Inadimplente" para "Pagamento Pendente".
- **INPUT:** `src/app/app/(authenticated)/alunos/page.tsx`
- **OUTPUT:** Listagem com ícones e badges ajustados.
- **VERIFY:** Verificar se o clique abre o modal correspondente para o aluno correto.

### Task 4: Integração no Perfil do Aluno (Detalhes)
- **Agente:** `frontend-specialist`
- **Skill:** `frontend-design`
- **Prioridade:** P2
- **Dependencies:** Task 2
- **Descrição:** Integrar o `StudentStatusDialog` no perfil detalhado do aluno para substituir o `confirm` nativo do navegador do botão "Inativar" e atualizar o rótulo de inadimplência.
- **INPUT:** `src/app/app/(authenticated)/alunos/[id]/page.tsx` e `src/components/alunos/student-profile-main-section.tsx`
- **OUTPUT:** Tela de perfil integrada com o novo modal e labels atualizados.
- **VERIFY:** Testar fluxo de inativação e ativação a partir do perfil do aluno.

---

## Phase X: Verification

- [ ] Executar build do projeto: `npm run build`
- [ ] Executar lint e testes de tipos: `npm run lint` e `npx tsc --noEmit`
- [ ] Validar conformidade de Design (sem cores roxas genéricas, consistência visual).
- [ ] Realizar teste manual completo:
  - Inativar aluno manualmente com motivo A -> Verificar banco.
  - Reativar o mesmo aluno -> Verificar banco.
  - Atualizar faturas de um aluno para criar atraso de 15 dias -> Confirmar status "Pagamento Pendente" após recarregar.
  - Atualizar faturas de um aluno para criar atraso de 35 dias -> Confirmar status "Inativo" automático com motivo específico após recarregar.
