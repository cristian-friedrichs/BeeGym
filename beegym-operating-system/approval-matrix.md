# Approval Matrix

## Objetivo

A matriz de aprovacao define o que agentes podem executar automaticamente e o que exige decisao explicita do CEO.

Quando houver duvida, o agente deve parar e pedir aprovacao. Silencio nunca e aprovacao.

## Pode ser automatico em Nivel 3 parcial

Estas acoes podem ser executadas por Codex quando o prompt autorizar autonomia Nivel 3 parcial, o escopo estiver claro e a tarefa for de baixo risco:

- Criar branch dedicada.
- Alterar arquivos dentro do escopo aprovado.
- Rodar validacoes locais proporcionais.
- Confirmar arquivos alterados.
- Fazer commit.
- Fazer push da branch.
- Abrir PR via GitHub CLI.
- Acompanhar checks.
- Fazer merge via GitHub CLI quando `build (18.x)` passar, Vercel passar quando aplicavel, nao houver conflito e nenhuma mudanca sensivel estiver envolvida.
- Deletar branch remota quando apropriado.
- Sincronizar a `main` local.
- Gerar relatorio final.

Categorias permitidas em Nivel 3 parcial:

- Documentacao.
- Copy.
- UI mockada sem dados reais.
- Ajustes visuais isolados.
- Testes nao destrutivos.
- Scripts internos seguros.
- Relatorios e logs.
- Correcoes pequenas sem impacto sensivel.
- Alteracoes sob `/admin` apenas quando nao envolvem auth, dados reais, Supabase ou acoes reais.

Condicoes:

- A branch nao pode ser `main`.
- O diff deve conter apenas arquivos aprovados.
- Nenhum secret, dado real ou artefato sensivel pode ser lido, impresso ou versionado.
- `build (18.x)` deve passar antes de merge quando for check obrigatorio.
- Vercel deve passar antes de merge quando aplicavel.
- Falhas de validacao devem ser reportadas antes de qualquer correcao fora do escopo.

## Pode ser automatico em Nivel 2

Estas acoes podem ser executadas por Codex quando o prompt autorizar autonomia Nivel 2 e o escopo estiver claro:

- Criar branch dedicada.
- Alterar arquivos dentro do escopo aprovado.
- Alterar documentacao operacional, testes ou scripts internos de baixo risco quando estiverem no escopo.
- Rodar validacoes locais proporcionais.
- Confirmar arquivos alterados.
- Fazer commit.
- Fazer push da branch.
- Gerar relatorio final.
- Gerar titulo e descricao recomendados para PR.

## Deve parar e pedir aprovacao

Estas situacoes exigem parada obrigatoria e aprovacao explicita antes da execucao:

- Qualquer check falhando.
- Conflito de merge.
- Escopo expandiu alem do aprovado.
- Alteracao em `src` com impacto funcional relevante.
- Deploy em producao.
- Rollback de producao.
- Supabase, migrations, RLS, policies, schema, RPCs, CLI ou dados reais.
- Alteracoes de autenticacao.
- Billing, cobranca, pagamento, webhooks financeiros ou integracoes sensiveis.
- Uso, leitura, migracao ou alteracao de dados reais.
- Vercel ou deploy sensivel.
- Workflows criticos.
- Rulesets ou protecao da `main`.
- Publicacao externa.
- Alteracao estrutural ampla.
- Novas dependencias.
- Alteracoes em `package.json` ou lockfiles.
- Mudancas de pricing, oferta publica, posicionamento ou promessas comerciais.
- Criacao de automacoes recorrentes reais.
- Alteracoes em secrets, `.env`, variaveis remotas ou configuracoes de producao.
- Duvida de risco.

## Nunca automatico

Estas acoes nao devem ser executadas automaticamente:

- Bypass de ruleset.
- Merge com check vermelho.
- Deploy de producao sensivel.
- Migrations Supabase.
- Alteracao ou leitura de dados reais.
- Cobranca ou pagamentos.
- Expor secrets.
- Ler, imprimir, copiar ou resumir secrets.
- Force push em `main`.
- Deletar `main`.
- Reduzir protecao da `main`.
- Criar prova social falsa.
- Publicar conteudo externo.
- Apagar dados de producao.
- Simular cliente real ou usar credencial real.
- Criar comunicacao externa como se fosse aprovada pelo CEO.

## Roteamento por sensibilidade

Baixa sensibilidade:

- Docs operacionais.
- Templates internos.
- Ajustes de testes sinteticos locais.
- Scripts internos sem dependencia nova.
- Copy.
- UI mockada sem dados reais.
- Ajustes visuais isolados.

Pode seguir em Nivel 3 parcial quando autorizado e quando os checks passarem.

Media sensibilidade:

- Codigo de aplicacao.
- Fluxos de usuario.
- UX autenticada.
- Logs, relatorios ou automacoes internas.

Exige escopo claro, validacao proporcional e pode exigir parada antes de PR, merge ou commit conforme o risco.

Alta sensibilidade:

- Auth.
- Billing.
- Dados reais.
- Supabase.
- Producao.
- Deploy.
- Secrets.
- Oferta publica.
- Dependencias.
- Workflows criticos.
- Rulesets.

Exige aprovacao do CEO antes de qualquer alteracao.

## Regra central

Autonomia acelera tarefas pequenas. Aprovacao humana protege clientes, dados, receita e producao.
