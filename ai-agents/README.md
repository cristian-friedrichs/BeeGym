# AI Agents

Esta pasta sera o catalogo operacional de agentes BeeGym.

Ela nao substitui automaticamente a pasta `.agent` existente. A pasta `.agent` deve ser tratada como estrutura previa/ferramental, enquanto `ai-agents` define os agentes operacionais oficiais do BeeGym Operating System.

## Padrao para novos agentes

Cada agente novo deve documentar:

- objetivo;
- responsabilidades;
- limites;
- entradas esperadas;
- saida esperada;
- ferramentas permitidas;
- arquivos ou sistemas que pode tocar;
- aprovacoes necessarias;
- criterios de sucesso;
- exemplos de uso.

## Aprovacao necessaria

Agentes que possam afetar producao, dados reais, billing, Supabase, deploy, secrets, dependencias ou experiencia de clientes precisam de aprovacao explicita antes da execucao.
