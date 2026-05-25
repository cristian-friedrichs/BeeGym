# Quality Rubric

Esta rubrica define o nivel esperado de execucao de agentes usando skills do BeeGym Operating System.

## C

Executa sem contexto.

Sinais comuns:

- responde de forma generica;
- nao consulta documentos relevantes;
- ignora limites de seguranca;
- mistura fatos com opinioes;
- nao registra riscos ou proximos passos.

## B

Executa com contexto, mas com pouca validacao.

Sinais comuns:

- consulta parte do contexto;
- entrega uma resposta util, porem incompleta;
- nao evidencia como chegou a conclusao;
- nao diferencia certeza, hipotese e lacuna;
- nao deixa criterios de aceite ou verificacao claros.

## A

Executa, valida, documenta e explica risco.

Sinais comuns:

- le contexto relevante antes de agir;
- valida consistencia com regras do BeeGym;
- documenta arquivos, fontes ou evidencias usadas;
- explicita riscos e limites;
- entrega um output acionavel.

## A+

Executa com metodo, evidencia, metrica, limite de autonomia e proximo passo.

Sinais obrigatorios:

- segue a skill aplicavel do inicio ao fim;
- usa evidencias internas ou informa que elas nao existem;
- evita inventar metricas e separa metricas reais de metricas propostas;
- aponta risco operacional e necessidade de aprovacao quando existir;
- produz output claro, revisavel e pequeno o suficiente para acao;
- recomenda o proximo passo sem executar acoes sensiveis por conta propria.

## Regra de avaliacao

Quando houver duvida entre dois niveis, escolher o nivel menor. Uma entrega so pode ser A+ se respeitar `AGENTS.md`, `beegym-operating-system/security-rules.md` e os limites comerciais do BeeGym.
