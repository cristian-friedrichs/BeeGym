# BeeGym SaaS (MVP)

Platforma moderna de gestão para academias, estúdios e personal trainers.

## 🛠 Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS, Shadcn/ui, Lucide React
- **Backend (BaaS):** Supabase (Postgres, Auth, Storage, Realtime)
- **AI Integration:** Firebase (Genkit AI)
- **Validation:** Zod
- **Forms:** React Hook Form
- **Charts:** Recharts

## 🚀 Como Rodar Localmente

### Pré-requisitos
- Node.js (LTS v18+)
- NPM

### Instalação

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/CristianFriedrichs/BeeGym.git
   cd BeeGym
   ```

2. **Instale as dependências:**
   ```bash
   npm ci
   ```

3. **Configure as Variáveis de Ambiente:**
   Crie um arquivo `.env` na raiz do projeto e adicione suas credenciais do Supabase:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
   ```

4. **Inicie o Servidor de Desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse a aplicação em: [http://localhost:3000](http://localhost:3000)

## 🛡️ Segurança

Este projeto segue uma arquitetura **Zero Trust** para garantir a proteção dos dados dos inquilinos (Tenants):

- **Row Level Security (RLS):**
  - Todas as tabelas do banco de dados possuem políticas RLS ativas.
  - Estratégia de **Isolamento de Tenant**: Dados são segregados via `organization_id`.
  - Usuários só podem acessar/modificar dados pertencentes à sua organização vinculada.

- **Storage Policies (Buckets):**
  - **`avatars`**: Bucket Público. Leitura liberada para todos. Escrita restrita ao próprio usuário (Owner).
  - **`exercise-media`**: Bucket Privado. Leitura restrita a usuários autenticados. Escrita restrita a Staff/Instructors da organização.

- **Proteção XSS:**
  - Inputs de texto rico e descrições vindas do banco de dados são sanitizados via `DOMPurify` antes da renderização no Frontend.

## 📦 Deploy

Projeto otimizado para deploy na **Vercel**.
O arquivo `.github/workflows/ci.yml` garante que Checks de Lint e Build passem antes de qualquer merge na branch `main`.
