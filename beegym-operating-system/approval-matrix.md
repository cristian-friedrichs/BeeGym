# Approval Matrix

## Objetivo

A matriz de aprovacao define o que agentes podem executar automaticamente e o que exige decisao explicita do CEO.

Quando houver duvida, o agente deve parar e pedir aprovacao. Silencio nunca e aprovacao.

## Pode ser automatico em Nivel 2

Estas acoes podem ser executadas por Codex quando o prompt autorizar autonomia Nivel 2 e o escopo estiver claro:

- Criar branch dedicada.
- Alterar documentacao operacional.
- Alterar testes dentro do escopo.
- Melhorar scripts internos de baixo risco.
- Rodar validacoes locais proporcionais.
- Confirmar arquivos alterados.
- Fazer commit.
- Fazer push da branch.
- Gerar relatorio final.
- Gerar titulo e descricao recomendados para PR.

Condições:

- A branch nao pode ser `main`.
- O diff deve conter apenas arquivos aprovados.
- Nenhum secret, dado real ou artefato sensivel pode ser lido, impresso ou versionado.
- Falhas de validacao devem ser reportadas antes de qualquer correcao fora do escopo.

## Exige aprovacao do CEO

Estas acoes exigem aprovacao explicita antes da execucao:

- Merge em `main`.
- Deploy em producao.
- Rollback de producao.
- Supabase, migrations, RLS, policies, schema, RPCs, CLI ou dados reais.
- Alteracoes de autenticacao.
- Billing, cobranca, pagamento, webhooks financeiros ou integrações sensiveis.
- Uso, leitura, migracao ou alteracao de dados reais.
- Publicacao externa.
- Alteracao estrutural ampla.
- Novas dependencias.
- Alteracoes em `package.json` ou lockfiles.
- Mudancas de pricing, oferta publica, posicionamento ou promessas comerciais.
- Criacao de automacoes recorrentes reais.
- Alteracoes em secrets, `.env`, variaveis remotas ou configuracoes de producao.

## Nunca automatico

Estas acoes nao devem ser executadas automaticamente:

- Expor secrets.
- Ler, imprimir, copiar ou resumir secrets.
- Mexer em dados reais sem autorizacao explicita e contexto seguro.
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

Pode seguir em Nivel 2 quando autorizado.

Media sensibilidade:

- Codigo de aplicacao.
- Fluxos de usuario.
- UX autenticada.
- Logs, relatorios ou automacoes internas.

Exige escopo claro, validacao proporcional e pode exigir parada antes de commit conforme o risco.

Alta sensibilidade:

- Auth.
- Billing.
- Dados reais.
- Supabase.
- Producao.
- Deploy.
- Secrets.
- Oferta publica.

Exige aprovacao do CEO antes de qualquer alteracao.

## Regra central

Autonomia acelera tarefas pequenas. Aprovacao humana protege clientes, dados, receita e producao.
