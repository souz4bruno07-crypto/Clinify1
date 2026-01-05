# ⚡ Guia Rápido: Gerenciar Planos no Banco de Dados

## 🎯 Comandos Mais Usados

### 1️⃣ Ver Plano de um Usuário

```sql
-- Por email
SELECT 
  u.name,
  u.email,
  COALESCE(s.plan, 'free') as plano,
  s.status,
  s.end_date
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id
WHERE u.email = 'usuario@email.com';
```

### 2️⃣ Atualizar Plano (Método Mais Simples)

```sql
-- Substitua 'ID_DO_USUARIO' e 'professional' conforme necessário
INSERT INTO subscriptions (
  id, user_id, plan, status, start_date, end_date, 
  cancel_at_period_end, created_at, updated_at
) VALUES (
  gen_random_uuid()::TEXT,
  'ID_DO_USUARIO',        -- ⚠️ Cole o ID aqui
  'professional',         -- ⚠️ Escolha: free, basic, professional, enterprise
  'active',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '1 year',
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (user_id) 
DO UPDATE SET
  plan = EXCLUDED.plan,
  status = EXCLUDED.status,
  end_date = EXCLUDED.end_date,
  updated_at = CURRENT_TIMESTAMP;
```

### 3️⃣ Encontrar ID do Usuário

```sql
-- Por email
SELECT id, name, email FROM users WHERE email = 'usuario@email.com';

-- Por nome
SELECT id, name, email FROM users WHERE name ILIKE '%nome%';
```

## 📋 Passo a Passo Completo

### Exemplo: Dar Plano Professional para João Silva

**1. Encontrar o usuário:**
```sql
SELECT id, name, email FROM users WHERE email = 'joao@exemplo.com';
```
Resultado: `id = 'abc123-def456-...'`

**2. Atualizar o plano:**
```sql
INSERT INTO subscriptions (
  id, user_id, plan, status, start_date, end_date, 
  cancel_at_period_end, created_at, updated_at
) VALUES (
  gen_random_uuid()::TEXT,
  'abc123-def456-...',  -- ID encontrado no passo 1
  'professional',
  'active',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '1 year',
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (user_id) 
DO UPDATE SET
  plan = 'professional',
  status = 'active',
  end_date = CURRENT_TIMESTAMP + INTERVAL '1 year',
  updated_at = CURRENT_TIMESTAMP;
```

**3. Verificar se funcionou:**
```sql
SELECT plan, status, end_date 
FROM subscriptions 
WHERE user_id = 'abc123-def456-...';
```

## 🎨 Planos Disponíveis

| Plano | Valor SQL | Descrição |
|-------|-----------|-----------|
| Free | `'free'` | Plano gratuito |
| Basic | `'basic'` | R$ 99/mês |
| Professional | `'professional'` | R$ 299/mês |
| Enterprise | `'enterprise'` | R$ 799/mês |

## 🔄 Status Disponíveis

| Status | Valor SQL | Descrição |
|--------|-----------|-----------|
| Ativo | `'active'` | Assinatura funcionando |
| Trial | `'trialing'` | Período de teste |
| Cancelado | `'canceled'` | Cancelada |
| Atrasado | `'past_due'` | Pagamento em atraso |
| Incompleto | `'incomplete'` | Assinatura incompleta |

## 💡 Dicas Rápidas

### Criar Trial de 30 dias:
```sql
-- Mude apenas o status e end_date
status = 'trialing',
end_date = CURRENT_TIMESTAMP + INTERVAL '30 days',
```

### Cancelar assinatura:
```sql
UPDATE subscriptions
SET status = 'canceled',
    canceled_at = CURRENT_TIMESTAMP
WHERE user_id = 'ID_DO_USUARIO';
```

### Ver todos os planos:
```sql
SELECT u.name, u.email, COALESCE(s.plan, 'free') as plano
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id
ORDER BY u.name;
```

## 🚨 Importante

1. **Sempre substitua `'ID_DO_USUARIO'` pelo ID real**
2. **Use `ON CONFLICT` para evitar erros** (cria se não existe, atualiza se existe)
3. **Faça backup antes de alterações em massa**

## 📁 Arquivos de Referência

- `scripts/sql/gerenciar-planos.sql` - Scripts completos
- `scripts/sql/exemplo-pratico.sql` - Exemplos passo a passo
- `docs/GERENCIAR_PLANOS_BANCO_DADOS.md` - Documentação completa
