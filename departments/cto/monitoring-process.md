# Processo de Monitoramento Tecnico

## Objetivo

Detectar rapidamente falhas que impedem clientes de usar o BeeGym, separar alertas acionaveis de ruido e criar trilha clara para resposta a incidentes.

## Escopo monitorado

### App online

- Pagina principal carrega.
- App autenticado responde.
- Erros de carregamento ou indisponibilidade sao classificados.

### Login

- Fluxo de login esta acessivel.
- Falhas de autenticacao sao registradas como sinal tecnico ou de configuracao.
- Nenhum dado real ou segredo deve ser exposto em relatorios.

### Cadastro de aluno

- Fluxo de criacao de aluno deve estar disponivel quando aplicavel.
- Erros de formulario, permissao ou persistencia devem gerar investigacao.

### Criacao de treino

- Fluxo principal de criacao de treino deve ser acompanhado por teste manual, sintetico ou validacao dedicada quando existir.
- Falhas nesse fluxo afetam valor central do produto.

### Agenda

- Visualizacao e criacao de agendamentos devem ser monitoradas quando disponiveis.
- Falhas de data, timezone ou permissao devem ser tratadas como risco funcional.

### Pagamentos

- Mudancas ou falhas em pagamento, billing e webhooks exigem aprovacao e cuidado elevado.
- Monitoramento deve registrar sinal sem expor dados financeiros sensiveis.

### Erros

- Erros de build, runtime, console, API e CI devem ser triados por impacto.
- Logs nao devem ser copiados quando contiverem secrets, tokens ou dados reais.

### Deploy

- Releases devem ser acompanhadas por verificacao pos-deploy.
- Falha de deploy, rollback ou degradacao apos release deve acionar Release Agent e Watchtower Agent.

### Testes sinteticos

- TestSprite e testes sinteticos devem cobrir fluxos criticos com usuarios de teste.
- Artefatos temporarios devem ser tratados como sensiveis ate prova em contrario.
- Falhas sinteticas devem ser classificadas por impacto antes de virar incidente.

## Frequencia sugerida

- Antes de release: checklist de release.
- Depois de deploy: checklist pos-deploy.
- Rotina futura: verificacoes sinteticas recorrentes, somente apos aprovacao.
