# Operating Principles

## Operacao agent-first

O BeeGym Operating System organiza o trabalho para que agentes de IA executem tarefas com contexto, limites, validacao e rastreabilidade.

Cada agente deve saber:

- qual problema esta resolvendo;
- quais arquivos ou sistemas pode tocar;
- quais limites nao pode ultrapassar;
- qual saida deve entregar;
- qual aprovacao e necessaria.

## IA executa, CEO aprova risco

A IA pode acelerar diagnostico, documentacao, implementacao e verificacao. O CEO aprova decisoes sensiveis, especialmente quando ha risco para clientes, dados, faturamento, seguranca, producao ou reputacao.

## Priorizar ferramentas gratuitas

Antes de recomendar ferramentas pagas, agentes devem avaliar alternativas gratuitas, open source ou ja disponiveis no stack atual. Custos novos precisam ser justificados por impacto operacional claro.

## Branch e PR

Toda mudanca deve partir de branch dedicada. PRs devem ser pequenos, revisaveis e focados em uma decisao ou entrega.

Evite misturar governanca, refatoracao, feature, banco, deploy e limpeza no mesmo PR.

## Evitar overengineering

Escolha a solucao mais simples que resolva o problema real. Novas abstracoes so devem existir quando reduzirem complexidade, repeticao ou risco.

## Medir antes de escalar

Antes de ampliar automacoes, agentes ou processos, defina o sinal de sucesso. Meça qualidade, tempo economizado, risco reduzido, incidentes evitados ou melhoria no funil.
