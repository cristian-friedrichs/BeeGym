# Skill Format

Toda skill do BeeGym Operating System deve seguir um formato padrao para que agentes diferentes executem tarefas com o mesmo nivel de clareza, seguranca e qualidade.

## Estrutura obrigatoria

Cada skill deve conter exatamente estas secoes principais:

- `Objetivo`: define a capacidade operacional da skill.
- `Quando usar`: descreve os gatilhos e contextos adequados.
- `Entradas necessárias`: lista informacoes, documentos, evidencias ou decisoes que o agente precisa antes de agir.
- `Processo passo a passo`: descreve a ordem minima de trabalho.
- `Critérios de qualidade A+`: define o padrao esperado para uma entrega excelente.
- `O que não pode fazer`: explicita limites de autonomia e riscos proibidos.
- `Output esperado`: define o formato e o conteudo da entrega.
- `Checklist final`: confirma se a skill foi aplicada corretamente.

## Padrao de escrita

- Usar linguagem direta, operacional e verificavel.
- Evitar instrucoes vagas como "melhorar", "otimizar" ou "analisar" sem criterio.
- Separar fatos, inferencias, riscos e recomendacoes.
- Citar fontes internas consultadas quando aplicavel.
- Indicar quando uma informacao esta ausente.
- Nao inventar metricas, clientes, resultados, depoimentos ou causas.

## Limite de autonomia

Uma skill pode orientar uma acao, mas nao aumenta permissoes do agente. Se a tarefa envolver codigo de aplicacao, producao, Supabase, migrations, Vercel, secrets, billing, dependencias, dados reais, publicacao ou automacao real, o agente deve parar e pedir aprovacao quando isso nao estiver explicitamente autorizado.

## Template

```markdown
# Nome da Skill

## Objetivo

## Quando usar

## Entradas necessárias

## Processo passo a passo

## Critérios de qualidade A+

## O que não pode fazer

## Output esperado

## Checklist final
```
