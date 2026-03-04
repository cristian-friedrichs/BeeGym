🚀 MVP Roadmap: From Prototype to Production
Este documento serve como a Fonte da Verdade para o desenvolvimento deste projeto. O objetivo é transformar um protótipo funcional em uma aplicação limpa, segura, escalável e robusta.

📌 Diretrizes Gerais (Core Principles)
Segurança em Primeiro Lugar: Nenhuma tabela deve ficar sem RLS (Row Level Security).

Arquitetura Clean: Desacoplar lógica de dados da interface (UI).

Código Autodocumentado: Variáveis e funções devem ter nomes claros e tipagem forte (TypeScript).

Zero Hardcoding: Toda configuração sensível deve estar em variáveis de ambiente.

🛠 Fase 1: Saneamento e Infraestrutura (Prioridade Alta)
[ ] Auditoria de .env: Mover todas as chaves do Supabase para .env e garantir que o .env esteja no .gitignore.

[x] Tipagem de Database: Utilizar tipos gerados via Supabase API (src/types/supabase.ts) devido a restrições de firewall no Prisma.

🏗 Fase 2: Refatoração e Arquitetura "Clean"
[ ] Camada de Serviço: Criar pasta src/services/supabase. Mover todas as queries diretas para funções reutilizáveis.

[ ] Padronização de Erros: Implementar um wrapper de tratamento de erro para todas as chamadas assíncronas, garantindo que o front-end saiba como exibir mensagens de erro amigáveis.

[ ] Remoção de Código Morto: Identificar e deletar componentes e funções herdadas do Firebase Studio que não são mais utilizadas.

🛡 Fase 3: Blindagem e Segurança (Zero Trust)
[ ] Implementação de RLS: Criar políticas de segurança para cada tabela. Regra de ouro: auth.uid() == owner_id.

[ ] Validação de Input: Implementar schemas de validação (Zod) para garantir que o front-end não envie dados malformados ao Supabase.

[ ] Sanitização: Garantir que nenhum dado de usuário seja renderizado sem proteção contra XSS.

📈 Fase 4: Escalabilidade e Preparação para Deploy
[ ] GitHub Actions: Criar workflow para rodar lint e build em cada Pull Request.

[ ] Otimização de Assets: Revisar imagens e fontes para garantir o menor tempo de carregamento possível.

[ ] Documentação de API: Documentar brevemente as funções de serviço criadas na Fase 2.

Nota para o Agente IA (Antigravity): Ao realizar qualquer tarefa, consulte este guia. Se uma alteração violar as diretrizes de "Arquitetura Clean" ou "Segurança", interrompa e peça clarificação.
