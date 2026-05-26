# Autonomy Levels

## Objetivo

Os niveis de autonomia definem ate onde Codex e agentes podem ir em uma tarefa antes de parar para aprovacao humana.

O nivel deve ser informado no prompt da tarefa. Quando nao houver nivel claro, o agente deve assumir o menor nivel necessario para diagnosticar e pedir confirmacao antes de executar mudancas.

## Estado atual permitido

O nivel atual permitido para tarefas seguras e bem delimitadas e Nivel 2 - Execucao com commit e push.

Nivel 3 ainda nao esta ativo. Em um estado futuro, Nivel 3 permitira abertura automatica de PR, mas ainda sem merge automatico.

Merge automatico continua proibido em todos os niveis atualmente definidos.

## Nivel 0 - Diagnostico apenas

Uso recomendado: investigacao inicial, revisao de risco, leitura de arquivos, explicacao de problema ou planejamento.

Permitido:

- Ler arquivos nao sensiveis do escopo.
- Inspecionar status local e contexto tecnico.
- Rodar comandos de leitura.
- Produzir diagnostico, plano e recomendacao.

Nao permitido:

- Alterar arquivos.
- Criar branch.
- Staging, commit ou push.
- Tocar em sistemas externos.

Saida esperada:

- Diagnostico.
- Riscos.
- Plano sugerido.
- Aprovacoes necessarias.

## Nivel 1 - Execucao supervisionada

Uso recomendado: mudancas pequenas em docs, testes ou codigo de baixo risco quando o CEO quer revisar antes do commit.

Permitido:

- Criar branch dedicada.
- Alterar arquivos dentro do escopo aprovado.
- Rodar validacoes proporcionais.
- Mostrar diff, status e resultado.

Nao permitido:

- Fazer commit.
- Fazer push.
- Abrir PR.
- Executar acoes sensiveis sem aprovacao.

Saida esperada:

- Arquivos alterados.
- Validacoes.
- Riscos.
- Pedido de autorizacao para commit ou proxima etapa.

## Nivel 2 - Execucao com commit e push

Status atual: permitido para tarefas seguras, pequenas e bem delimitadas quando o prompt autorizar.

Uso recomendado: tarefas de baixo risco e bem delimitadas, como documentacao operacional, melhorias em testes, scripts internos e ajustes pequenos aprovados.

Permitido:

- Criar branch dedicada.
- Alterar arquivos dentro do escopo aprovado.
- Rodar validacoes proporcionais.
- Fazer commit com mensagem aprovada ou coerente com o escopo.
- Fazer push da branch.
- Gerar relatorio final.
- Gerar titulo e descricao de PR.

Nao permitido:

- Abrir PR automaticamente, salvo aprovacao explicita.
- Fazer merge.
- Fazer deploy.
- Alterar producao, dados reais, Supabase, billing, auth sensivel, secrets ou dependencias sem aprovacao explicita.

Saida esperada:

- Branch.
- Commit.
- Push.
- Arquivos alterados.
- Validacoes.
- Riscos e pendencias.
- Titulo e descricao recomendados para PR.

## Nivel 3 - PR automatizado

Status atual: planejado, mas ainda nao ativo.

Uso recomendado: fluxo futuro para tarefas recorrentes e bem compreendidas, com checks automaticos e correcao simples de falhas.

Permitido:

- Executar tudo do Nivel 2.
- Abrir PR automaticamente quando este nivel for ativado e autorizado.
- Acompanhar checks.
- Corrigir falhas simples dentro do escopo original.
- Atualizar PR com evidencias de validacao.

Nao permitido:

- Fazer merge automaticamente.
- Fazer merge sem aprovacao.
- Expandir escopo para corrigir falhas estruturais.
- Ignorar checks falhando.
- Tocar em areas sensiveis sem aprovacao.

Saida esperada:

- Link do PR.
- Status dos checks.
- Correcoes feitas.
- Pedido de aprovacao para merge quando estiver pronto.

## Nivel 4 - Operacao recorrente

Uso recomendado: rotina futura de health check, acompanhamento de falhas e relatorios periodicos.

Permitido:

- Rodar health check diario quando aprovado.
- Criar issue automatica em falha, quando aprovado.
- Gerar relatorio semanal.
- Propor correcoes pequenas automaticamente.
- Encaminhar incidentes para o agente responsavel.

Nao permitido:

- Criar automacao recorrente sem aprovacao explicita do CEO.
- Corrigir producao sem aprovacao.
- Usar dados reais, credenciais reais ou ambientes sensiveis sem autorizacao.
- Publicar conteudo externo automaticamente.

Saida esperada:

- Relatorio periodico.
- Issues ou tarefas rastreaveis.
- Lista de sinais normais, alertas e incidentes.
- Aprovacoes pendentes.

## Nivel 5 - Alta autonomia

Uso recomendado: reservado para futuro.

Este nivel nunca deve ser usado sem aprovacao explicita do CEO. Ele representa autonomia ampla para operar ciclos completos com menos intervencao humana.

Mesmo no Nivel 5, continuam proibidos sem aprovacao especifica:

- Expor secrets.
- Mexer em dados reais.
- Fazer merge ou deploy de alto risco.
- Alterar billing, auth sensivel, Supabase ou producao.
- Publicar conteudo externo.

Saida esperada:

- A definir em uma politica futura antes de qualquer uso real.
