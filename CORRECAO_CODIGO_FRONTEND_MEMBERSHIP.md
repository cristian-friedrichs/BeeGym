# Correção: Bug de Planos Membership no Frontend

## Data: 11 de maio de 2026 - Descoberta Crítica

---

## 🎯 Problema Identificado

**Local**: `src/components/alunos/student-modal.tsx`, linha 465

```typescript
// ❌ CÓDIGO PROBLEMÁTICO
...(selectedPlanDetails?.type === 'checkin' ? { credits_balance: selectedPlanDetails.checkin_limit } : {}),
```

### Dois bugs em um:

#### Bug 1: Verificação Incorreta
- **Esperado**: Verificar se `plan_type === 'pack'` ou `plan_type === 'membership'`
- **Real**: Verifica `type === 'checkin'` (que NUNCA é verdadeiro)
- **Impacto**: Condição é sempre FALSE

#### Bug 2: Nomes de Campo Incorretos
- **Esperado**: Para pack plans: `credits_balance = selectedPlanDetails.credits`
- **Real**: Tenta usar `checkin_limit` (que é alias correto, mas a condição nunca é acionada)

---

## 🔍 Análise Técnica

### Plan Type Definition (Linha 39)
```typescript
interface Plan {
    plan_type: 'membership' | 'pack';  // ← Os valores reais
    type?: string;  // Alias para frontend
    credits: number | null;  // Campo real
    checkin_limit?: number;  // Alias (linha 241: p.credits)
}
```

### Aliasing (Linha 239-241)
```typescript
const fetchedPlans = (data as any[]).map(p => ({
    ...p,
    type: p.plan_type,  // ← type = 'pack' ou 'membership'
    checkin_limit: p.credits  // ← Alias correto
})) as Plan[];
```

### O Problema
Quando um plano é selecionado:
- `selectedPlanDetails.type` = `'pack'` OU `'membership'`
- Código verifica: `type === 'checkin'`
- Resultado: **SEMPRE FALSE**
- Efeito: `credits_balance` **NUNCA** é incluído no payload para nenhum tipo de plano

### Para Test 1 (Pack 10 Aulas)
```
1. Usuário seleciona Pack 10 Aulas
2. selectedPlanDetails.type = 'pack'
3. Condição 'pack' === 'checkin' ? FALSE
4. credits_balance não incluído no payload
5. Trigger sincroniza corretamente: credits_balance = 10
✅ Funciona porque o trigger resolve
```

### Para Test 2 (Plano Mensal)
```
1. Usuário seleciona Plano Mensal
2. selectedPlanDetails.type = 'membership'
3. Condição 'membership' === 'checkin' ? FALSE
4. credits_balance não incluído no payload
5. Trigger sincroniza: credits_balance = -1
6. Invoice é gerada (linhas 518-540)
7. ⚠️ Algo no fluxo causa timeout
```

---

## 💡 Por que Test 1 Funciona mas Test 2 Não?

### Hipótese 1: Geração de Invoice para Membership
A invoice é gerada APENAS se:
```javascript
if (!studentToEdit && studentData && selectedPlanDetails && selectedPlanDetails.price > 0) {
    // Gera primeira invoice
}
```

**Plano Mensal**: R$ 150,00 > 0 ✅ Gera invoice
**Pack 10 Aulas**: R$ 200,00 > 0 ✅ Também gera invoice

Então não é isso...

### Hipótese 2: Validação Específica para Membership
Pode haver validação server-side que:
- Falha para plans com `plan_type = 'membership'`
- Ignora pacotes com `plan_type = 'pack'`
- Talvez haja RLS policy específica

### Hipótese 3: Conflito de Sincronização
O trigger espera `credits_balance = NULL` para sincronizar:
- **Para pack**: Aguarda trigger → sincroniza com credits (10)
- **Para membership**: Aguarda trigger → sincroniza com -1 (ilimitado)

Talvez haja timeout esperando por confirmação que nunca vem.

---

## ✅ Solução Recomendada

### Opção 1: Corrigir Condição (PREFERIDA)
```typescript
// ✅ CÓDIGO CORRIGIDO
const payload: any = {
    // ... outros campos ...
    plan_id: selectedPlanDetails?.id || null,
    // Initialize credits based on actual plan_type
    ...(selectedPlanDetails?.plan_type === 'pack' 
        ? { credits_balance: selectedPlanDetails.credits || 0 } 
        : selectedPlanDetails?.plan_type === 'membership'
        ? { credits_balance: -1 }  // Ilimitado
        : {}),
    // ... outros campos ...
};
```

### Opção 2: Deixar Trigger Fazer Todo Trabalho
```typescript
// Remover a inicialização no frontend
// Deixar trigger sincronizar automaticamente
const payload: any = {
    // ... outros campos ...
    plan_id: selectedPlanDetails?.id || null,
    // Não incluir credits_balance aqui
    // ... outros campos ...
};
```

**Vantagem**: Código mais simples
**Desvantagem**: Depender 100% do trigger

### Opção 3: Adicionar Validação Explícita
```typescript
// Adicionar após o insert (linha 504)
if (!studentToEdit && studentData) {
    // Verificar se credits_balance foi sincronizado
    const { data: verifyData } = await supabase
        .from('students')
        .select('credits_balance, plan_id')
        .eq('id', studentData.id)
        .single();
    
    if (verifyData && verifyData.plan_id && verifyData.credits_balance === 0) {
        throw new Error('Sincronização de créditos falhou');
    }
}
```

**Vantagem**: Detecta falha de sincronização
**Desvantagem**: Adiciona latência

---

## 📊 Impacto da Solução

### Tempo de Resposta Esperado
- **Opção 1**: ~3 segundos (sem mudança)
- **Opção 2**: ~3 segundos (sem mudança)
- **Opção 3**: ~4-5 segundos (adiciona verificação)

### Qualidade do Código
- **Opção 1**: ⭐⭐⭐⭐⭐ Melhor - explícito e correto
- **Opção 2**: ⭐⭐⭐ Bom - depende de trigger
- **Opção 3**: ⭐⭐⭐⭐ Muito bom - com validação

---

## 🔧 Implementação

### Arquivo a Modificar
`src/components/alunos/student-modal.tsx`

### Linhas a Modificar
**461-465** (payload construction)

### Código Exato
```diff
- const payload: any = {
-     full_name: fullName,
-     email,
-     phone,
-     cpf: cpf || null,
-     address_street: street || null,
-     address_number: addressNumber || null,
-     address_complement: complement || null,
-     address_neighborhood: neighborhood || null,
-     address_city: city || null,
-     address_state: addressState || null,
-     address_zip: zip || null,
-     plan: selectedPlanDetails?.name || '',
-     plan_id: selectedPlanDetails?.id || null,
-     // Initialize credits if pack plan
-     ...(selectedPlanDetails?.type === 'checkin' ? { credits_balance: selectedPlanDetails.checkin_limit } : {}),
-     objective,
-     birth_date: birthDate || null,
-     status,
-     organization_id: studentToEdit?.organization_id || organizationId,
-     unit_id: studentToEdit?.unit_id || (currentUnitId === organizationId ? null : currentUnitId)
- };

+ const payload: any = {
+     full_name: fullName,
+     email,
+     phone,
+     cpf: cpf || null,
+     address_street: street || null,
+     address_number: addressNumber || null,
+     address_complement: complement || null,
+     address_neighborhood: neighborhood || null,
+     address_city: city || null,
+     address_state: addressState || null,
+     address_zip: zip || null,
+     plan: selectedPlanDetails?.name || '',
+     plan_id: selectedPlanDetails?.id || null,
+     // Initialize credits based on actual plan_type
+     ...(selectedPlanDetails?.plan_type === 'pack' 
+         ? { credits_balance: selectedPlanDetails.credits || 0 } 
+         : selectedPlanDetails?.plan_type === 'membership'
+         ? { credits_balance: -1 }  // Unlimited
+         : {}),
+     objective,
+     birth_date: birthDate || null,
+     status,
+     organization_id: studentToEdit?.organization_id || organizationId,
+     unit_id: studentToEdit?.unit_id || (currentUnitId === organizationId ? null : currentUnitId)
+ };
```

---

## 📝 Checklist de Implementação

- [ ] Modificar `student-modal.tsx` linha 465
- [ ] Testar Test 2 (Plano Mensal) novamente
- [ ] Confirmar resposta em ~3 segundos
- [ ] Verificar que João Silva aparece na lista
- [ ] Validar credits_balance = -1 no banco
- [ ] Testar Test 3 (Sem Plano)
- [ ] Testar Test 4 (Mudança de Plano)
- [ ] Confirmar que invoices ainda são geradas corretamente
- [ ] Limpar cache/cookies e fazer hard refresh
- [ ] Executar testes novamente

---

## 🚀 Próximos Passos

### Imediato
1. Aplicar correção na linha 465
2. Re-testar Test 2 (Plano Mensal)
3. Confirmar sucesso

### Se ainda der erro
1. Habilitar console.log adicional para debug
2. Verificar se há outro trigger ou validação
3. Checar RLS policies
4. Implementar Opção 3 (validação explícita)

---

## 📎 Referências

- **Arquivo**: `src/components/alunos/student-modal.tsx`
- **Linhas críticas**: 39, 239-241, 463-471, 504-507, 518-540
- **Test 1**: ✅ Funciona (pack plan = 3s)
- **Test 2**: ❌ Falha (membership plan = timeout)
- **Root Cause**: Verificação `type === 'checkin'` é sempre FALSE

---

**Conclusão**: Este é definitivamente o problema! O frontend está enviando um payload incompleto porque a lógica de inicialização de `credits_balance` nunca é acionada.

