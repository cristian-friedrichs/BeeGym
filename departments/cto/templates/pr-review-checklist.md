# PR Review Checklist

## Identificacao

- PR:
- Branch:
- Reviewer:
- Data:

## Escopo

- [ ] O objetivo do PR esta claro.
- [ ] O PR e pequeno e revisavel.
- [ ] Os arquivos alterados fazem sentido para o escopo.
- [ ] Nao ha refatoracao ou mudanca paralela desnecessaria.

## Qualidade

- [ ] Codigo ou documentacao seguem padroes existentes.
- [ ] Estados de erro e vazio foram considerados quando aplicavel.
- [ ] Tipagem e contratos estao claros quando aplicavel.
- [ ] Nao ha complexidade desnecessaria.

## Seguranca

- [ ] Nao ha secrets, tokens ou dados reais expostos.
- [ ] Nao altera Supabase, migrations, RLS, policies ou dados sem aprovacao.
- [ ] Nao altera Vercel, env remota, dominio ou deploy sem aprovacao.
- [ ] Nao altera dependencias sem aprovacao.
- [ ] Security Agent revisou quando necessario.

## Validacao

- [ ] Lint executado ou justificativa registrada.
- [ ] Build executado ou justificativa registrada.
- [ ] Typecheck executado ou justificativa registrada.
- [ ] Testes executados ou justificativa registrada.
- [ ] QA revisou quando necessario.

## Decisao

- Status: aprovar / solicitar ajustes / bloquear
- Motivo:
- Proximos passos:
