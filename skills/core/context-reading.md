# Leitura de Contexto

## Objetivo

Garantir que o agente entenda o contexto operacional, comercial e de seguranca antes de propor, documentar ou executar qualquer tarefa no BeeGym.

## Quando usar

Use no inicio de toda tarefa, especialmente quando houver impacto em produto, cliente, suporte, marketing, growth, engenharia, billing, dados ou governanca.

## Entradas necessárias

- Pedido original do CEO ou solicitante.
- `AGENTS.md`.
- `beegym-operating-system/README.md`.
- `beegym-operating-system/security-rules.md`.
- Documentos do departamento relacionado.
- Arquivos ou evidencias diretamente citados na tarefa.

## Processo passo a passo

1. Identifique o tipo de tarefa: documentacao, diagnostico, codigo, banco, deploy, billing, conteudo, suporte ou automacao.
2. Leia os documentos obrigatorios de governanca.
3. Leia documentos do departamento responsavel pela area.
4. Liste restricoes aplicaveis antes de agir.
5. Separe fatos confirmados, hipoteses e lacunas.
6. Defina se a tarefa pode seguir autonomamente ou exige aprovacao.

## Critérios de qualidade A+

- Contexto minimo consultado e citado no output.
- Limites sensiveis identificados antes de qualquer execucao.
- Fatos, inferencias e lacunas separados.
- Proximo passo coerente com o departamento responsavel.
- Nenhuma suposicao operacional tratada como fato.

## O que não pode fazer

- Ler ou expor secrets.
- Ignorar `AGENTS.md` ou regras de seguranca.
- Comecar alteracoes antes de entender impacto.
- Assumir aprovacao para Supabase, Vercel, migrations, producao, billing, dependencias ou automacoes reais.

## Output esperado

Resumo curto contendo contexto lido, restricoes aplicaveis, riscos, lacunas e decisao de seguir ou pedir aprovacao.

## Checklist final

- [ ] O tipo de tarefa foi identificado.
- [ ] Documentos obrigatorios foram considerados.
- [ ] Riscos e limites foram listados.
- [ ] Lacunas foram declaradas.
- [ ] A necessidade de aprovacao foi avaliada.
