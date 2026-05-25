# Resposta a Incidentes

## Niveis

### N0 Informacao

Sinal sem impacto confirmado. Pode ser aviso de CI, alerta isolado, anomalia sem reproducao ou melhoria detectada.

Acao esperada:

- Registrar contexto.
- Acompanhar se volta a ocorrer.
- Nao interromper roadmap.

### N1 Atencao

Problema limitado, degradacao leve ou falha ainda sem impacto relevante em cliente. Exige triagem, mas nao resposta emergencial.

Acao esperada:

- Reproduzir quando possivel.
- Identificar area afetada.
- Criar tarefa tecnica se necessario.
- Comunicar risco se houver tendencia de piora.

### N2 Incidente

Falha com impacto real ou provavel em fluxo importante: login, cadastro de aluno, treino, agenda, pagamento, deploy ou area autenticada.

Acao esperada:

- Acionar CTO Agent, Watchtower Agent, QA Agent e agente tecnico responsavel.
- Avaliar rollback ou mitigacao.
- Registrar impacto, horario, causa provavel e acoes.
- Pedir aprovacao do CEO para operacoes sensiveis.

### N3 Critico

Indisponibilidade relevante, risco de dados, falha de seguranca, billing incorreto, vazamento de segredo, perda de dados ou impacto amplo em clientes.

Acao esperada:

- Pausar mudancas nao essenciais.
- Acionar CEO imediatamente.
- Acionar CTO Agent, Security Agent, Watchtower Agent e Release Agent.
- Priorizar contencao e rollback.
- Nao expor logs, secrets ou dados reais em comunicacoes.
- Produzir relatorio pos-incidente.

## Relatorio minimo

- Nivel.
- Resumo.
- Impacto conhecido.
- Inicio e fim aproximados.
- Sistemas afetados.
- Acoes tomadas.
- Validacoes realizadas.
- Proximas prevencoes.
