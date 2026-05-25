# Estrategia Tecnica

## Principios

### IA executa

Agentes de IA devem assumir trabalho operacional claro: diagnosticar, planejar, editar documentacao, propor implementacoes, revisar riscos, rodar validacoes locais permitidas e preparar entregas pequenas. A IA trabalha dentro de contexto, branch dedicada e limites de seguranca definidos pelo BeeGym Operating System.

### CEO aprova risco

O CEO decide sobre risco de negocio, impacto em cliente e operacoes sensiveis. Agentes podem recomendar caminhos, mas nao devem executar sem aprovacao quando houver impacto em producao, dados reais, Supabase, Vercel, billing, webhooks, secrets, dependencias ou mudancas com risco operacional relevante.

### PRs pequenos

Mudancas devem ser pequenas, revisaveis e com escopo claro. Um PR deve resolver uma intencao principal, ter descricao objetiva, listar arquivos alterados, explicar risco e registrar validacoes realizadas ou nao realizadas.

### Ferramentas gratuitas primeiro

O BeeGym deve priorizar recursos ja disponiveis ou de baixo custo antes de contratar ferramentas novas. GitHub, GitHub Actions, logs existentes, testes locais, Vitest, TestSprite, Vercel e Supabase devem ser aproveitados antes de adicionar plataformas pagas.

### Sem overengineering

Solucoes devem acompanhar o tamanho atual do produto. Evitar abstracoes prematuras, sistemas complexos sem necessidade imediata, automacoes irreversiveis ou arquitetura que aumente custo de manutencao sem ganho claro.

### Seguranca antes de escala

Antes de otimizar escala, o departamento deve garantir limites basicos: secrets protegidos, mudancas em banco controladas, releases revisados, checks verdes, monitoramento dos fluxos criticos e capacidade de rollback. Escala sem seguranca aumenta risco operacional.

## Direcao operacional

- Documentar processos antes de automatizar.
- Automatizar apenas processos repetiveis, compreendidos e aprovados.
- Monitorar primeiro os fluxos que impedem uso real do produto.
- Preferir validacoes locais e CI antes de qualquer deploy.
- Tratar incidentes como fonte de melhoria de processo, nao apenas como correcao pontual.
