# Análise: Teste 2 - Timeout de Membership Plans

## Data: 11 de maio de 2026

---

## 🎯 Resumo Executivo

Após corrigir a função trigger `sync_student_credits_on_plan_change()` para suportar planos 'membership', descobrimos que o problema **não foi completamente resolvido**:

- **Test 1 (Pack 10 Aulas)**: ✅ Funciona em ~3 segundos
- **Test 2 (Plano Mensal)**: ❌ Timeout em ~23 segundos

Isto indica que **existe validação adicional específica para membership plans** que está causando o timeout.

---

## 🔍 Análise Técnica

### Cronologia do Teste 2

```
20:39:50 - Clicado "CONCLUIR MATRÍCULA" com João Silva + Plano Mensal
20:39:50 - Botão passou para estado "PROCESSANDO..."
20:39:55 - Ainda processando (5 segundos)
20:40:00 - Ainda processando (10 segundos)
20:40:13 - Ainda processando (23 segundos)
20:40:13 - Pressionado ESC para fechar modal
20:40:13 - Modal fechou
         - João Silva NÃO aparece na lista de alunos
```

### Comparação de Comportamento

| Aspecto | Pack 10 Aulas | Plano Mensal |
|---------|---------------|-------------|
| **Plan Type** | `'pack'` | `'membership'` |
| **Credits (DB)** | `10` | `NULL` |
| **Credits Balance (esperado)** | `10` | `-1` (ilimitado) |
| **Tempo de Resposta** | ~3s | ~23s |
| **Estado do Botão** | Normal + fecha | Travado em PROCESSANDO... |
| **Student Criado** | Sim | Não |

---

## 💡 Hipóteses Principais

### Hipótese 1: Validação de Servidor Adicional
**Localização Provável**: `src/actions/students.ts`

Existe código server-side que valida ou processa membership plans de forma diferente:

```javascript
// Possível código problemático
if (plan.plan_type === 'membership') {
    // Validação adicional que falha ou demora
    const result = await someSlowValidation(planId);
    // Isso poderia causar timeout
}
```

### Hipótese 2: SELECT Query Lento
O servidor pode estar fazendo uma query adicional para membership plans que é lenta:

```sql
-- Possível query lenta
SELECT * FROM membership_plans 
WHERE id = $1 AND plan_type = 'membership'
-- Se não houver índice, pode ser lento
```

### Hipótese 3: Outro Trigger Travando
Pode existir outro trigger que:
- Aguarda sincronização que nunca completa
- Valida de forma diferente para membership
- Faz chamada de API externa para membership plans

### Hipótese 4: RLS Policy Bloqueando
PostgreSQL RLS (Row Level Security) pode estar:
- Bloqueando INSERT de membership plans
- Exigindo permissão adicional para membership
- Causando transação aberta que nunca committa

---

## 🔧 Investigação Necessária

### 1. Revisar Código Frontend

**Arquivo**: `src/actions/students.ts`

```typescript
// Procure por:
export async function createStudent(formData: FormData) {
    // ❓ Existe validação diferente para membership?
    // ❓ Existe await de outra função antes de submitir?
    // ❓ Existe condição IF para plan.plan_type = 'membership'?
}
```

**Checklist de Verificação**:
- [ ] Procurar por `plan_type === 'membership'`
- [ ] Procurar por `credits_balance === -1`
- [ ] Procurar por `await` calls adicionais
- [ ] Procurar por validação de créditos
- [ ] Procurar por SELECT adicional no servidor

### 2. Revisar Banco de Dados

**Verificações SQL**:

```sql
-- 1. Verificar se há outros triggers
SELECT trigger_name, event_manipulation 
FROM information_schema.triggers 
WHERE event_object_table = 'students'
AND trigger_name != 'trg_sync_student_credits';

-- 2. Verificar RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'students';

-- 3. Verificar constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'students';

-- 4. Testar query de membership_plans
EXPLAIN ANALYZE
SELECT plan_type, credits FROM membership_plans
WHERE id = 'ID_DO_PLANO_MENSAL';
```

### 3. Habilitar Debug/Logging

**Adicionar logging no servidor**:

```typescript
export async function createStudent(formData: FormData) {
    console.log('START: createStudent', { timestamp: new Date() });
    
    const planId = formData.get('plan_id');
    const plan = await getPlanDetails(planId);
    console.log('PLAN DETAILS', { plan });
    
    if (plan.plan_type === 'membership') {
        console.log('MEMBERSHIP PLAN DETECTED', { planId });
    }
    
    const result = await createStudentInDB(formData);
    console.log('END: createStudent', { 
        result, 
        duration: Date.now() - startTime 
    });
    
    return result;
}
```

---

## 📊 Dados de Teste

### Test 1 - Bem Sucedido
- **Aluno**: Lucas Martins
- **Email**: lucas.martins@academy.com
- **Plano**: Pack 10 Aulas (plan_type: 'pack')
- **Créditos**: 10
- **Resultado**: ✅ Criado em ~3s
- **Credits Balance no DB**: 10

### Test 2 - Falhado
- **Aluno**: João Silva
- **Email**: joao.silva@example.com
- **Plano**: Plano Mensal (plan_type: 'membership')
- **Créditos**: NULL (ilimitado)
- **Resultado**: ❌ Timeout em ~23s
- **Credits Balance no DB**: Não foi criado (não há dado)

---

## 🎯 Plano de Ação

### Imediato (Hoje)
1. [ ] Revisar `src/actions/students.ts` completo
2. [ ] Procurar por qualquer lógica específica de membership
3. [ ] Verificar se há outro trigger no BD
4. [ ] Habilitar logging no servidor

### Curto Prazo (Próximas horas)
1. [ ] Corrigir a validação que está causando timeout
2. [ ] Re-testar Test 2 (Plano Mensal)
3. [ ] Confirmar que tempo de resposta volta a ~3s
4. [ ] Completar Teste 3 (Sem Plano)

### Médio Prazo
1. [ ] Refatorar validação para ser mais eficiente
2. [ ] Adicionar índices se necessário
3. [ ] Melhorar logging para facilitar debug futuro

---

## 🚨 Impacto no Negócio

### Severidade: CRÍTICA

**Funcionalidade Afetada**:
- ❌ Usuários com planos tipo 'membership' não conseguem se matricular
- ❌ Tarefas bloqueadas: Plano Mensal, Plano Trimestral, etc.

**Usuários Impactados**:
- Qualquer um tentando criar matrícula com plano tipo 'membership'

**Timeline para Fix**:
- Investigação: ~1-2 horas
- Correção: ~1-2 horas
- Testes: ~30 minutos

---

## 📝 Notas Técnicas

### O que FUNCIONA (Confirmado)
✅ Trigger foi corrigida (Test 1 prova)
✅ Pack plans sincronizam corretamente
✅ Credits balance = 10 para pack plans
✅ Frontend consegue preencher formulário completo
✅ Requisição é enviada para servidor

### O que NÃO FUNCIONA (Confirmado)
❌ Membership plans causam timeout
❌ Servidor não responde em tempo hábil
❌ Validação diferenciada (hipótese)
❌ Student não é criado na base

### Diferença Entre Test 1 e Test 2
A ÚNICA diferença é o plan_type:
- Test 1: plan_type = 'pack' ✅
- Test 2: plan_type = 'membership' ❌

Isso é uma pista forte de que o problema está em lógica que verifica ou processa membership plans especificamente.

---

## 🔗 Arquivos Relacionados

- `RESUMO_EXECUCAO_TESTE_1.txt` - Teste bem-sucedido com Pack plan
- `RESUMO_EXECUCAO_TESTE_2.txt` - Teste falhado com Membership plan
- `RELATORIO_CORRECAO_BANCO_DADOS.md` - Detalhes da correção da trigger
- `analise_banco_dados.md` - Análise original do banco de dados

---

**Conclusão**: A correção da trigger foi bem-sucedida, mas existe um problema adicional específico para planos 'membership' que deve ser investigado no código server-side (`src/actions/students.ts` ou similar).

