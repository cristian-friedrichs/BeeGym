# Design de Politicas RLS

## Objetivo

Projetar politicas RLS conceituais para Supabase com foco em isolamento de dados, seguranca e revisao antes de qualquer mudanca real.

## Quando usar

Use somente para planejar ou revisar regras de acesso a dados. Qualquer alteracao em Supabase, migrations, schema ou policies exige aprovacao explicita.

## Entradas necessárias

- Modelo conceitual de dados.
- Papeis de usuario.
- Operacoes permitidas.
- Regras de tenancy ou unidade.
- Riscos de acesso indevido.

## Processo passo a passo

1. Identifique entidades e donos dos dados.
2. Liste papeis e operacoes: select, insert, update, delete.
3. Defina condicoes de acesso em linguagem natural.
4. Mapeie cenarios permitidos e negados.
5. Liste testes esperados para cada politica.
6. Marque aprovacao obrigatoria antes de implementar.

## Critérios de qualidade A+

- Politicas sao descritas com casos permitidos e bloqueados.
- Tenancy e isolamento por unidade sao considerados.
- Testes de negacao aparecem junto dos testes de permissao.
- Nenhuma policy real e alterada sem aprovacao.
- Riscos de vazamento sao destacados.

## O que não pode fazer

- Editar migrations, schema, policies, RPCs ou dados.
- Executar Supabase CLI.
- Regenerar tipos sem aprovacao.
- Tratar design conceitual como implementacao aprovada.

## Output esperado

Documento conceitual com entidades, papeis, operacoes, regras, casos negados, testes e aprovacao necessaria.

## Checklist final

- [ ] Entidades foram mapeadas.
- [ ] Papeis foram definidos.
- [ ] Casos permitidos e negados foram listados.
- [ ] Testes foram propostos.
- [ ] Aprovacao foi exigida para execucao.
