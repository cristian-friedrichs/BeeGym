# Skills

Esta pasta e a biblioteca oficial de skills do BeeGym Operating System.

Skills sao habilidades operacionais reutilizaveis. Elas ajudam agentes a executar tarefas com metodo, criterios de qualidade, limites claros e outputs previsiveis.

Uma skill nao substitui um departamento. Departamentos definem responsabilidades, estrategias, processos e limites operacionais. Skills definem como executar uma capacidade especifica que pode ser reutilizada por varios agentes e departamentos.

Uma skill tambem nao executa tarefas sozinha. Ela orienta o agente sobre contexto necessario, passos, evidencias, riscos, criterios A+ e formato de entrega. A execucao continua limitada pelas regras do repositorio, pelo `AGENTS.md` e por `beegym-operating-system/security-rules.md`.

## Principios

- Trabalhar sempre com contexto antes de recomendar ou executar.
- Respeitar o BeeGym como SaaS de gestao fitness para personal trainers, academias, studios, CrossFit, Pilates e Yoga.
- Separar diagnostico, recomendacao e execucao.
- Documentar evidencia, incertezas, riscos e proximos passos.
- Nunca usar uma skill como autorizacao para acao sensivel.
- Nunca expor secrets, dados reais de clientes ou informacoes internas sensiveis.

## Limites globais

Skills nao autorizam:

- alteracao em producao;
- deploy;
- mudancas em Supabase, RLS, migrations, schema, dados reais ou CLI;
- alteracoes em secrets ou variaveis de ambiente;
- mudancas em billing, pagamentos ou webhooks;
- alteracao de `package.json`, lockfiles ou dependencias;
- publicacao de conteudo;
- criacao de automacoes reais;
- criacao de integracoes externas.

Essas acoes exigem aprovacao explicita do CEO quando forem necessarias.

## Estrutura inicial

- `core/`: skills obrigatorias para todos os agentes.
- `cto/`: skills de planejamento tecnico, arquitetura, diagnostico, risco e orquestracao.
- `development/`: skills de produto, UX, API, RLS conceitual, testes e review.
- `monitoring/`: skills de incidentes, verificacoes sinteticas, pos-deploy, saude e causa raiz.
- `support/`: skills de atendimento, base de conhecimento, issues, billing e escalonamento.
- `marketing/`: skills de posicionamento, conteudo, criativos, performance, concorrencia e tendencias.
- `growth/`: skills de funil, hipoteses, ativacao, CRO, oferta, experimentos e retencao.
