# Skill Governance

Skills orientam como agentes trabalham. Elas nao autorizam execucao sensivel e nao substituem aprovacao do CEO.

## Regras de governanca

- Skills podem orientar diagnosticos, planos, documentos, criterios, revisoes e recomendacoes.
- Acoes sensiveis exigem aprovacao explicita do CEO antes da execucao.
- Nenhum agente deve alterar producao sem aprovacao.
- Nenhum agente deve expor, copiar, resumir ou imprimir secrets.
- Nenhum agente deve criar automacoes reais sem aprovacao.
- Nenhum agente deve publicar conteudo automaticamente.
- Nenhum agente deve mexer em Supabase, RLS, migrations, schema, dados reais, RPCs ou policies sem aprovacao.
- Nenhum agente deve alterar `package.json`, lockfiles ou dependencias sem aprovacao.
- Nenhum agente deve alterar Vercel, dominios, deploys ou variaveis remotas sem aprovacao.

## Regras comerciais BeeGym

- O BeeGym e um SaaS de gestao fitness para personal trainers, academias, studios, CrossFit, Pilates e Yoga.
- Planos devem ser tratados como "a partir de R$ 9,90".
- CTA principal: "Testar por 7 dias".
- Garantia: "7 dias de garantia incondicional · Reembolso de 100% do valor pago".
- O teste exige cartao.
- Nao dizer "sem cartao de credito".
- Nao criar prova social falsa.
- Nao prometer resultado financeiro garantido.
- Nao inventar metricas.

## Escalonamento

Quando uma skill identificar risco ou acao sensivel, o output deve conter:

- decisao necessaria;
- motivo do risco;
- impacto esperado;
- alternativa de baixo risco;
- pergunta objetiva para aprovacao do CEO.
