# Codex Final Report Template

Use este template no final de tarefas agent-first.

```markdown
## Resumo executivo

Status:
Branch:
Objetivo:
Resultado:

## Alteracoes realizadas

- Descreva a mudanca 1.
- Descreva a mudanca 2.

## Arquivos alterados

- `arquivo`: motivo da alteracao.

## Validacoes

- `validacao`: resultado.

Validacoes nao executadas:

- `validacao`: motivo.

## Riscos

Riscos evitados:

- Item.

Riscos residuais:

- Item.

Areas sensiveis nao tocadas:

- `src`
- `supabase`
- `supabase/migrations`
- Vercel sensivel
- `.env`
- `package.json`
- `package-lock.json`
- `.github/workflows`
- Dados reais
- Billing/pagamentos
- Producao

## Decisoes pendentes do CEO

- Decisao 1.
- Decisao 2.

## Proximos passos

- Passo recomendado 1.
- Passo recomendado 2.

## Pronto para PR?

Resposta: Sim/Nao.

Motivo:

## Links

- Commit:
- Push:
- PR:
```

## Modelo final para tarefas Nivel 3 parcial

Use este modelo quando a tarefa tiver autonomia Nivel 3 parcial e puder seguir ate PR, checks, merge e sincronizacao de `main`.

```markdown
## Summary

Status:
Result:

## Scope

Allowed scope:
Sensitive areas not touched:

## Branch

Branch:
Remote branch deleted:

## Commit

Commit:

## PR URL

PR:

## Checks

- `build (18.x)`:
- Other checks:

## Vercel

Status:
Applicable: Yes/No

## Merge status

Merge performed: Yes/No
Reason if not merged:

## Merge commit

Merge commit:

## Main sync

Main synchronized: Yes/No
Git status:

## Files changed

- `file`: reason.

## Validation

- `validation`: result.

## Safety limits confirmed

- No app code changed unless explicitly in low-risk scope.
- No Supabase, migrations, auth, billing, real data, secrets, `.env`, package files, workflows, departments, skills, production deploy, pricing or external publication changed.
- No merge was performed with failing checks, conflict or risk uncertainty.

## CEO action required

Required: Yes/No
Reason:

## Notes

- Additional factual notes.
```

## Criterios do relatorio

- Ser objetivo e baseado em evidencias.
- Nao incluir secrets, tokens, cookies, headers sensiveis ou dados reais.
- Separar o que foi feito do que ainda exige aprovacao.
- Informar claramente se esta pronto para PR ou se Nivel 3 parcial concluiu o fluxo completo.
