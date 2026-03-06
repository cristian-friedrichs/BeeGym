# 🐝 BeeGym - Documentação Completa do APP

Bem-vindo à documentação detalhada do **BeeGym SaaS**. Este documento centraliza o conhecimento sobre arquitetura, módulos, fluxos e integrações do projeto, servindo como o mapa definitivo para desenvolvimento e manutenção.

---

## 🏗 1. Stack Tecnológico

O BeeGym é construído sobre uma arquitetura moderna e escalável:

- **Frontend:** Next.js 15 (App Router), React 19.
- **Linguagem:** TypeScript.
- **Estilização:** Tailwind CSS, componentes Shadcn/ui, ícones Lucide React.
- **Backend/Database:** Supabase (PostgreSQL, Supabase Auth, Storage).
- **Integração de Pagamento:** API e SDK Efí (Gerenciamento de Assinaturas Pix e Cartão).
- **Design Pattern:** Clean Architecture no Backend (Repositórios, Casos de Uso) e Modularização no Frontend.

---

## 🧩 2. Módulos e Roteamento Principal

O sistema divide-se em duas grandes áreas de acesso restrito e protegido:

### 2.1 Módulo Admin (`/admin`)
Painel de superadministração utilizado exclusivamente pelos donos/gestores do BeeGym (Acesso restrito via Google Login para e-mail master).
- **Dashboard:** Visão macro de MRR, LTV, total de assinaturas, status dos clientes e inadimplências.
- **Planos (`/admin/planos`):** Criação/Edição de planos SaaS que sincronizam nativamente com a **Efí (Produção/Homologação)**. O cadastro aqui alimenta dinamicamente a vitrine de venda do App.
- **Contratantes (`/admin/contratantes`):** Gestão dos clientes (academias/studios). Permite cancelamento, auditoria e **aplicação de Descontos Avulsos/Manuais** no valor contínuo da assinatura.
- **Ofertas (`/admin/cupons`):** Gestão de descontos e promoções globais aplicáveis no checkout (Porcentagem, Fixo, ou Meses Grátis).
- **Relatórios:** Exportações analíticas detalhadas do sistema.

### 2.2 Módulo App (`/app`)
Portal do cliente (SaaS). Área onde a academia/estúdio gerencia o próprio negócio.
- **Auth:** Login e Register (`/app/login`, `/app/register`).
- **Onboarding (`/app/onboarding`):** Fluxo unificado para cadastro inicial da academia. Inclui a escolha de Planos dinâmicos e etapa de Pagamento conectada diretamente ao Gateway Efí.
- **Painel / Dashboard:** KPIs do locatário (alunos novos, pagamentos).
- **Alunos:** Cadastros dos clientes finais daquela academia.
- **Treinos e Exercícios:** Prescrição e acompanhamento.
- **Agenda / Aulas:** Marcações e check-ins.
- **Produtos:** Venda de balcão e gestão de estoque.

---

## 💸 3. Motor de Pagamentos e Planos (EFI)

A integração de cobrança do BeeGym utiliza um design robusto "Database-First", lidando de forma nativa com planos, cupons e customizações de descontos utilizando a interface Efí.

### Fluxo de Assinatura via Cartão de Crédito
1. O backend inicia o caso de uso (`CreateSubscriptionUseCase`).
2. Verifica-se o preço dinâmico do banco de dados (considerando um possível `promo_price` original configurado pelo admin).
3. Avalia-se se um `couponId` válido foi enviado no checkout. Se sim, calcula-se o **Novo Valor Final**.
4. O servidor utiliza o **fluxo de 3 passos Efí Cartão**:
   - A) Cria a assinatura base baseada no `efi_plan_id`.
   - B) Atualiza e atrela um *Desconto absoluto (discount)* na própria estrutura raiz do Efí caso o valor final seja menor que o preço cheio do ERP.
   - C) Adiciona a forma de pagamento (Token) ativando a recorrência.

### Fluxo de Assinatura via PIX Automático
O PIX automático da Efí trabalha baseado em uma tabela de acordos.
- O Acordo PIX gerado no servidor do Supabase já possui as regras de substituição do `valorPromo` baseando-se no desconto validado, para que a virada financeira ocorra corretamente sem interferir nos planos.

### Descontos Administrativos ("Override")
Aplicados manualmente no painel Admin > Contratantes > Gerenciar.
- Pode-se embutir $\%$ ou R$ Fixo sobrecarregando a fatura daquele cliente. Caso seja PIX, ele salvará um override no DB. Caso seja cartão, chamará a API da Efí atrelando ou modificando a propensão de desconto da *Subscription* nativa dele.

---

## 🛡 4. Segurança de Multitenancy (RLS)

- A segregação de inquilinos **(Tenant Isolation)** ocorre na camada do Database (Supabase PostgreSQL).
- Todas as tabelas que guardam dados das academias (Ex: alunos, pagamentos, atividades) possuem a coluna `organization_id`.
- Utiliza-se **Row Level Security (RLS)** que intercepta e proíbe transações onde `auth.uid()` ou a organização vinculada pelo profile não seja condizente ao tenant ativo, garantindo **zero cruzamento de dados** entre Academias A e B.

---

## 🧑‍💻 5. Padrões de Código e UI

- **"Clean Code":**
  - Casos de Uso (`src/application/use-cases/`) encapsulam as abstrações da regra de negócios em vez de jogá-las nos Hooks do React.
  - Repositórios (`src/application/repositories/`) isolam o front e as regras de negócio das consultas massivas de abstração ao Supabase.
- **Server API e Server Actions:** Usados principalmente em rotas sensíveis e seguras (`src/app/api/...`), ocultando chaves e regras complexas de gateway (Sempre utilizando `supabaseAdmin` em processos críticos isolados).
- **Design System:** `Shadcn/ui` customizado sobre as cores nativas BeeGym (`bee-midnight`, `bee-amber`). Padronização de botões, tooltips, toast notifications, drawers e caixas de diálogo modais fluídas.

---

## 🧪 6. Como prosseguir no Desenvolvimento?

1. Certifique-se de preencher o arquivo `.env.local` não comitando em `.env`.
2. Após criar/alterar tabelas no banco de dados (`supabase`), sempre garanta a integridade utilizando o `.sql` via painel Supabase.
3. Não use chaves e funções Admin (`supabaseAdmin`) expostas na ponta de Client-Components (`'use client'`).
4. Execute audições frequentes após criar novos blocos críticos de API (`npm run dev`).
