# Processo de Desenvolvimento

## Fluxo padrao

1. CEO pede uma demanda com objetivo, contexto e restricoes.
2. CTO Agent transforma a demanda em plano tecnico pequeno, com riscos e arquivos provaveis.
3. Product Agent define criterios de aceite, fluxo do usuario e limites de escopo.
4. Frontend Agent e Backend Agent executam apenas as partes aprovadas e dentro de branch dedicada.
5. QA Agent testa comportamento, regressao provavel e criterios de aceite.
6. Security Agent revisa quando houver risco de auth, dados, Supabase, secrets, billing, webhooks ou permissao.
7. Release Agent valida branch, PR, checks, risco, rollback e pos-deploy.
8. CEO aprova risco quando a mudanca envolver impacto sensivel ou chegada em producao.
9. PR, merge e deploy ocorrem somente conforme aprovacao e processo definido.

## Regras de execucao

- Nunca trabalhar diretamente na `main`.
- Criar uma branch por escopo.
- Nao alterar `src`, Supabase, migrations, Vercel, `.env`, dependencias ou workflows sem demanda explicita e aprovacao quando aplicavel.
- Manter PR pequeno e revisavel.
- Parar e pedir aprovacao se o escopo mudar para risco operacional.
- Registrar validacoes executadas e validacoes pendentes.

## Entrada minima para uma demanda

- Objetivo de negocio.
- Area afetada.
- Resultado esperado.
- Restricoes conhecidas.
- Nivel de urgencia.
- Se pode ou nao tocar em codigo, banco, deploy, secrets, dependencias ou testes.

## Saida esperada

- Plano tecnico curto.
- Arquivos provaveis.
- Riscos identificados.
- Criterios de aceite.
- Validacoes recomendadas.
- Decisoes que exigem aprovacao do CEO.
