# Bug Escalation to CTO

Este fluxo conecta o ticket interno de suporte ao departamento CTO/TI sem pular triagem ou criar ruido tecnico.

## Fluxo oficial

ticket interno -> bug triage -> GitHub Issue -> Codex/CTO -> retorno ao cliente

## Etapas

1. Suporte recebe ticket interno.
2. Ticket Triage Agent classifica como bug provavel.
3. Bug Triage Agent coleta passos, impacto e evidencia segura.
4. Suporte prepara resumo tecnico com `bug-escalation-template.md`.
5. CTO/TI decide se vira GitHub Issue.
6. Codex/CTO investiga em branch dedicada quando aprovado.
7. Suporte recebe status confirmado e responde ao cliente.

## Informacoes obrigatorias

- Categoria e modulo.
- Prioridade sugerida.
- Passos para reproduzir.
- Resultado atual.
- Resultado esperado.
- Impacto no cliente.
- Existencia de workaround.
- Evidencia segura permitida.

## Resposta ao cliente durante triagem

Suporte pode informar que o caso foi encaminhado para revisao do time responsavel. Nao deve prometer prazo, causa raiz ou correcao ate haver confirmacao tecnica.

## Quando acionar Security/CEO

- Suspeita de acesso indevido.
- Vazamento ou exposicao de dados.
- Erro de cobranca em escala.
- Incidente critico de disponibilidade.
- Risco legal, reputacional ou financeiro.
