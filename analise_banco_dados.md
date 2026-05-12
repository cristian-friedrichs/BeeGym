# Análise do Banco de Dados BeeGym Pro - Supabase

## Data: 09 de maio de 2026

---

## 1. Estrutura da Tabela `students`

### Colunas Críticas:
| Coluna | Tipo | NOT NULL | Default | Observação |
|--------|------|----------|---------|-----------|
| **id** | UUID | SIM | gen_random_uuid() | PK |
| **full_name** | TEXT | SIM | - | Campo obrigatório |
| **plan_id** | UUID | NÃO | NULL | FK para membership_plans |
| **credits_balance** | INTEGER | **SIM** | 0 | ⚠️ CRÍTICO: NOT NULL |
| **organization_id** | UUID | SIM | - | Campo obrigatório |
| **status** | TEXT | NÃO | 'active' | Default ativo |
| **email** | TEXT | NÃO | NULL | Opcional |

### Problema 1: credits_balance NOT NULL
- Coluna `credits_balance` é **NOT NULL** com DEFAULT = 0
- Isso significa que **SEMPRE** terá um valor, nunca NULL
- Para planos tipo 'membership', fica com valor 0 ininterruptamente

---

## 2. Triggers Identificados

### Trigger: `trg_sync_student_credits`
**Ativa em:** INSERT e UPDATE
**Função:** `sync_student_credits_on_plan_change()`

### Código da Função:
```sql
DECLARE
    v_plan_type TEXT;
    v_credits   INT;
BEGIN
    -- Verifica se plan_id foi alterado
    IF NEW.plan_id IS NOT DISTINCT FROM OLD.plan_id THEN
        RETURN NEW;
    END IF;

    IF NEW.plan_id IS NULL THEN
        -- Plano removido: limpar balance
        NEW.credits_balance := 0;
        RETURN NEW;
    END IF;

    SELECT plan_type, credits
    INTO v_plan_type, v_credits
    FROM membership_plans
    WHERE id = NEW.plan_id;

    IF v_plan_type = 'pack' THEN
        -- SÓ SINCRONIZA PARA PLANOS TIPO 'PACK'
        NEW.credits_balance := COALESCE(v_credits, 0);
    END IF;

    RETURN NEW;
END;
```

### ⚠️ PROBLEMA CRÍTICO ENCONTRADO:

A função **SÓ sincroniza credits_balance quando `plan_type = 'pack'`**

```sql
IF v_plan_type = 'pack' THEN
    NEW.credits_balance := COALESCE(v_credits, 0);
END IF;
```

**Para planos tipo 'membership':**
- Seleciona `plan_type` = 'membership'
- A condição `IF v_plan_type = 'pack'` é **FALSE**
- **NÃO modifica credits_balance**
- Deixa com o valor DEFAULT (0)

---

## 3. Tipos de Planos Cadastrados

### Planos 'membership' (Unlimited):
| Nome | plan_type | credits | price |
|------|-----------|---------|-------|
| Plano Mensal | membership | NULL | 150.00 |
| Plano Trimestral | membership | NULL | 400.00 |
| **Plano Automação Teste** | membership | NULL | 0.00 |
| Plano Teste Automático | membership | NULL | 0.00 |
| Plano Onboarding Teste | membership | NULL | 0.00 |
| Plano Onboarding - Mensal | membership | NULL | 0.00 |

### Planos 'pack' (Créditos):
| Nome | plan_type | credits | price |
|------|-----------|---------|-------|
| **Pack 10 Aulas** | pack | 10 | 200.00 |

---

## 4. Análise de Dados Existentes

### Estudantes com Pack 10 Aulas (plan_type = 'pack'):
✅ **Sincronização funcionando corretamente:**
- Test API Action 4: credits_balance = 10 ✓
- Test Pack Student: credits_balance = 10 ✓
- João Silva Teste: credits_balance = 10 ✓

### Estudantes com Plano Mensal (plan_type = 'membership'):
❌ **NÃO sincronizados:**
- Test Student 2: credits_balance = 0 (esperado: valor do plano)
- Auto Test Student 0428-002: credits_balance = 0 ❌
- Aluno Teste 0001: credits_balance = 0 ❌
- Auto Test Student 0428-001: credits_balance = 0 ❌

### Estudantes com Plano Automação Teste (plan_type = 'membership'):
❌ **NÃO sincronizados:**
- Cristian Silva Friedrichs: credits_balance = 0 (esperado: valor do plano)

### Estudantes sem Plano (plan_id = NULL):
✅ **Correto:**
- Diversos: credits_balance = 0 ✓

---

## 5. Problemas Identificados

### P0 - Crítico
1. **Sincronização incompleta de credits_balance**
   - Função trigger **não sincroniza planos tipo 'membership'**
   - Deixa credits_balance = 0 para estudantes com planos unlimited
   - Causa inconsistência de dados

2. **Falta de lógica para planos unlimited**
   - Não há definição de como credits_balance deve se comportar para unlimited
   - Planos unlimited não têm campo `credits` (NULL)
   - Necessário definir regra: Unlimited = -1? Ilimitado? 999999?

### P1 - Alta Prioridade
3. **Constraint NOT NULL em credits_balance**
   - Força sempre ter um valor (MIN 0)
   - Impossível distinguir entre "0 créditos restantes" vs "ilimitado"
   - Recomendação: Permitir NULL ou usar valor especial (-1)

4. **Falta de tratamento de erro**
   - Se membership_plans.credits = NULL para pack plans
   - Função usa COALESCE(..., 0) - pode mascarar problemas
   - Sem feedback do que realmente acontece

---

## 6. Recomendações

### Imediatas (P0):
```sql
-- 1. Atualizar função para sincronizar TODOS os tipos de planos
-- 2. Definir lógica para planos 'membership':
--    - Opção A: credits_balance = -1 (representar ilimitado)
--    - Opção B: Novo campo is_unlimited BOOLEAN
--    - Opção C: Manter 0 mas documentar que é ilimitado

-- 3. Implementar validação no servidor:
--    - Verificar se plan_type é válido
--    - Verificar se credits está sincronizado
--    - Fazer fail-safe se dados inconsistentes
```

### SQL para Corrigir Função:
```sql
CREATE OR REPLACE FUNCTION sync_student_credits_on_plan_change()
RETURNS TRIGGER AS $$
DECLARE
    v_plan_type TEXT;
    v_credits   INT;
BEGIN
    -- Verifica se plan_id foi alterado
    IF NEW.plan_id IS NOT DISTINCT FROM OLD.plan_id THEN
        RETURN NEW;
    END IF;

    IF NEW.plan_id IS NULL THEN
        NEW.credits_balance := 0;
        RETURN NEW;
    END IF;

    SELECT plan_type, credits
    INTO v_plan_type, v_credits
    FROM membership_plans
    WHERE id = NEW.plan_id;

    -- CORREÇÃO: Sincronizar TODOS os tipos de plano
    CASE v_plan_type
        WHEN 'pack' THEN
            NEW.credits_balance := COALESCE(v_credits, 0);
        WHEN 'membership' THEN
            -- Para unlimited: usar -1 para representar ilimitado
            NEW.credits_balance := -1;
        ELSE
            NEW.credits_balance := 0;
    END CASE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Pós-Correção (P1):
1. **Auditar todos os estudantes existentes:**
   ```sql
   -- Atualizar estudantes com membership plans
   UPDATE students s
   SET credits_balance = -1
   FROM membership_plans mp
   WHERE s.plan_id = mp.id
   AND mp.plan_type = 'membership'
   AND s.credits_balance != -1;
   ```

2. **Implementar validação no código (src/actions/students.ts):**
   - Validar se credits_balance foi sincronizado corretamente após INSERT
   - Fazer rollback se houver inconsistência
   - Retornar erro explícito ao usuário

3. **Adicionar testes unitários:**
   - Testar sincronização para cada tipo de plano
   - Testar comportamento com plan_id = NULL
   - Testar UPDATE quando plan_id muda

---

## 7. Diagnóstico do Timeout de Submissão

### Hipótese Atual:
O timeout pode estar relacionado a:

1. **Validação no servidor (src/actions/students.ts)**
   - Pode estar aguardando sincronização que não acontece
   - Pode ter um check que falha quando credits_balance = 0 para membership plans
   - Pode estar fazendo SELECT adicional que causa timeout

2. **Transação não commitada**
   - Erro silencioso durante INSERT ou trigger
   - Servidor aguardando por tempo máximo (10-23s)
   - Depois faz timeout/rollback

3. **Falta de índices**
   - Trigger faz SELECT em membership_plans
   - Se não houver índice em id, pode ser lento
   - Com múltiplas transações, pode aumentar timeout

### Próximos Passos:
1. ✅ Revisar src/actions/students.ts para validações
2. ✅ Verificar indices em membership_plans.id
3. ✅ Verificar logs de erro do servidor
4. ✅ Executar teste com correção da função trigger
5. ✅ Validar performance de INSERT com nova função

---

## 8. Resumo Executivo

| Achado | Severidade | Status |
|--------|-----------|--------|
| Sincronização incompleta de credits_balance | P0 | ❌ NÃO SINCRONIZA |
| Lógica faltante para planos 'membership' | P0 | ❌ FALTANDO |
| Constraint NOT NULL em credits_balance | P1 | ⚠️ LIMITANTE |
| Possível timeout no servidor | P0 | ❓ INVESTIGAR |
| Falta de tratamento de erro | P1 | ❌ FALTANDO |

---

**Conclusão:** O banco de dados tem falhas estruturais na sincronização de credits_balance que afetam especialmente planos tipo 'membership'. A correção é trivial (adicionar logic case) mas crítica para funcionalidade.
