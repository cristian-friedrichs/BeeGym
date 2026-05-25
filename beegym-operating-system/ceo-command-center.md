# CEO Command Center

O CEO Command Center e a camada de comando do BeeGym Operating System. Ele transforma os departamentos, agentes e skills em uma rotina pratica de decisao, execucao, revisao e aprendizado.

O objetivo nao e criar mais burocracia. O objetivo e garantir que o CEO tenha clareza sobre prioridades, riscos, andamento e proximas decisoes sem precisar operar cada detalhe manualmente.

## Papel do CEO

O CEO decide prioridades, aprova riscos e protege o foco do negocio.

Responsabilidades principais:

- Definir os objetivos mais importantes do BeeGym.
- Escolher quais problemas entram no ciclo de execucao.
- Priorizar demandas entre Produto, CTO/TI, Suporte, Marketing e Growth.
- Aprovar decisoes sensiveis antes de qualquer acao real.
- Revisar resultados, aprendizados e trade-offs.
- Encerrar iniciativas que nao estejam gerando aprendizado ou resultado.

O CEO nao precisa executar cada tarefa. O CEO precisa manter direcao, criterio e responsabilidade final.

## Papel dos agentes

Agentes executam tarefas dentro do escopo aprovado pelo CEO e pelas regras do repositorio.

Agentes podem:

- Diagnosticar problemas.
- Levantar contexto.
- Propor planos.
- Criar documentacao operacional.
- Executar tarefas de baixo risco em branch dedicada.
- Validar mudancas com checks apropriados.
- Preparar commits, pushes e PRs quando autorizado.
- Documentar riscos, evidencias e proximos passos.

Agentes nao podem usar autonomia como autorizacao para acao sensivel.

## Aprovacao de riscos

Toda decisao sensivel exige aprovacao explicita do CEO antes da execucao.

Exemplos de risco que exigem aprovacao:

- Alteracao em producao.
- Deploy.
- Supabase, RLS, policies, migrations, schema, RPCs, CLI ou dados reais.
- Secrets e variaveis de ambiente.
- Billing, pagamentos, webhooks e integracoes externas.
- Dependencias, `package.json` e lockfiles.
- Mudancas com impacto direto em clientes.
- Publicacao de conteudo, campanhas ou comunicacoes externas.
- Criacao de automacoes reais.

O CEO aprova o risco. O agente executa somente dentro dos limites aprovados.

## Fluxo Codex

Quando houver alteracao em arquivos do repositorio, Codex deve operar com rastreabilidade:

1. Confirmar escopo e risco.
2. Garantir que nao esta trabalhando diretamente na `main`.
3. Criar ou usar branch dedicada.
4. Ler o contexto necessario.
5. Propor plano quando a tarefa tiver risco ou ambiguidade relevante.
6. Executar a alteracao no menor escopo possivel.
7. Rodar validacoes aplicaveis.
8. Preparar commit somente com autorizacao.
9. Fazer push somente com autorizacao.
10. Abrir PR somente com autorizacao.
11. Reportar arquivos alterados, motivo e status.

PRs devem ser pequenos, revisaveis e com escopo claro.

## Regras de producao

Nada sensivel deve ir para producao sem aprovacao explicita.

Antes de qualquer acao com impacto operacional real, o agente deve informar:

- O que sera alterado.
- Por que a alteracao e necessaria.
- Qual e o risco.
- Qual e o impacto esperado.
- Como validar.
- Como reverter ou interromper se algo der errado.

Sem aprovacao, a acao deve permanecer como diagnostico, plano, documentacao ou recomendacao.

## Rotina de comando

O CEO opera o BeeGym OS por ciclos:

- Diario: remover bloqueios, decidir ate 3 prioridades e checar sinais criticos.
- Semanal: revisar departamentos, PRs, aprendizados e prioridades da semana.
- Mensal: revisar roadmap, metricas, custos, seguranca, funil e posicionamento.

Cada ciclo deve produzir decisoes claras, donos definidos e proximas acoes rastreaveis.
