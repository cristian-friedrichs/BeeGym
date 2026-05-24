# Security Rules

## Secrets

- Nao expor arquivos `.env`, `.env.local`, `.env.*` ou qualquer arquivo que possa conter secrets.
- Nao ler, imprimir, copiar, resumir ou colar valores sensiveis.
- Se for necessario verificar existencia de arquivo sensivel, informe apenas que ele existe.

## Dados reais

- Nao alterar dados reais sem autorizacao explicita.
- Nao executar comandos destrutivos ou mutacoes em banco sem aprovacao.
- Nao usar dados de clientes em exemplos, logs ou documentacao publica.

## Supabase

- Nao mexer em RLS, policies, migrations, RPCs, roles ou schema sem autorizacao explicita.
- Nao executar comandos da Supabase CLI que possam tocar projeto remoto sem autorizacao.
- Nao regenerar tipos de Supabase sem aprovacao quando isso alterar arquivos rastreados.

## Deploy e producao

- Nao fazer deploy sem autorizacao explicita.
- Nao alterar configuracoes de Vercel, dominios, ambientes ou variaveis remotas sem autorizacao.
- Nao promover build ou release sem confirmacao do CEO.

## Arquivos temporarios e outputs de teste

Arquivos temporarios, relatorios de teste e configuracoes geradas podem conter dados sensiveis, tokens, usuarios de teste ou URLs internas. Trate esses arquivos como risco ate prova em contrario.

## Risco conhecido pendente

Existe um risco conhecido em `testsprite_tests/tmp/config.json`. O conteudo nao deve ser exposto. Este item deve ser tratado em uma etapa futura dedicada a higiene de secrets e artefatos de teste.
