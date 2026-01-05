# 🗄️ Como Gerenciar Planos Diretamente no Banco de Dados

## 📋 Estrutura da Tabela

A tabela de assinaturas se chama `subscriptions` e tem a seguinte estrutura:

```sql
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL,  -- 'free', 'basic', 'professional', 'enterprise'
  status TEXT NOT NULL, -- 'active', 'canceled', 'past_due', 'trialing', 'incomplete'
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  stripe_customer_id TEXT,
  mercado_pago_customer_id TEXT,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🔍 Consultas Úteis

### 1. Ver Todos os Planos dos Usuários

```sql
SELECT 
  u.id,
  u.name,
  u.email,
  s.plan,
  s.status,
  s.start_date,
  s.end_date,
  s.cancel_at_period_end
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id
ORDER BY u.name;
```

### 2. Ver Usuários com Plano Específico

```sql
-- Ver todos os usuários no plano Professional
SELECT 
  u.name,
  u.email,
  s.plan,
  s.status,
  s.end_date
FROM users u
INNER JOIN subscriptions s ON u.id = s.user_id
WHERE s.plan = 'professional'
ORDER BY u.name;
```

### 3. Ver Usuários sem Assinatura (Plano Free)

```sql
-- Usuários que não têm registro na tabela subscriptions
SELECT 
  u.id,
  u.name,
  u.email
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id
WHERE s.id IS NULL;
```

### 4. Ver Assinaturas que Expirarão em Breve

```sql
-- Assinaturas que expiram nos próximos 30 dias
SELECT 
  u.name,
  u.email,
  s.plan,
  s.end_date,
  s.end_date - CURRENT_DATE as dias_restantes
FROM users u
INNER JOIN subscriptions s ON u.id = s.user_id
WHERE s.status = 'active'
  AND s.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
ORDER BY s.end_date;
```

## ✏️ Atualizar Planos

### 1. Criar Nova Assinatura para um Usuário

```sql
-- Criar assinatura Professional para um usuário específico
INSERT INTO subscriptions (
  id,
  user_id,
  plan,
  status,
  start_date,
  end_date,
  cancel_at_period_end,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid()::TEXT,  -- ou use uuid_generate_v4() se tiver extensão
  'USER_ID_AQUI',           -- Substitua pelo ID do usuário
  'professional',
  'active',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '1 year',
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
```

### 2. Atualizar Plano de um Usuário

```sql
-- Atualizar para plano Enterprise
UPDATE subscriptions
SET 
  plan = 'enterprise',
  status = 'active',
  end_date = CURRENT_TIMESTAMP + INTERVAL '1 year',
  updated_at = CURRENT_TIMESTAMP
WHERE user_id = 'USER_ID_AQUI';
```

### 3. Criar ou Atualizar (UPSERT)

```sql
-- Se não existir, cria; se existir, atualiza
INSERT INTO subscriptions (
  id,
  user_id,
  plan,
  status,
  start_date,
  end_date,
  cancel_at_period_end,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid()::TEXT,
  'USER_ID_AQUI',
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
  plan = EXCLUDED.plan,
  status = EXCLUDED.status,
  end_date = EXCLUDED.end_date,
  updated_at = CURRENT_TIMESTAMP;
```

### 4. Cancelar Assinatura

```sql
-- Cancelar assinatura mantendo acesso até o final do período
UPDATE subscriptions
SET 
  cancel_at_period_end = true,
  status = 'active',
  updated_at = CURRENT_TIMESTAMP
WHERE user_id = 'USER_ID_AQUI';

-- Ou cancelar imediatamente
UPDATE subscriptions
SET 
  status = 'canceled',
  canceled_at = CURRENT_TIMESTAMP,
  cancel_at_period_end = false,
  updated_at = CURRENT_TIMESTAMP
WHERE user_id = 'USER_ID_AQUI';
```

### 5. Reativar Assinatura Cancelada

```sql
UPDATE subscriptions
SET 
  status = 'active',
  cancel_at_period_end = false,
  canceled_at = NULL,
  end_date = CURRENT_TIMESTAMP + INTERVAL '1 year',
  updated_at = CURRENT_TIMESTAMP
WHERE user_id = 'USER_ID_AQUI';
```

## 📊 Operações em Massa

### 1. Atualizar Todos os Usuários sem Assinatura para Free

```sql
-- Criar assinatura Free para todos os usuários sem registro
INSERT INTO subscriptions (
  id,
  user_id,
  plan,
  status,
  start_date,
  end_date,
  cancel_at_period_end,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid()::TEXT,
  u.id,
  'free',
  'active',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '1 year',
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions s WHERE s.user_id = u.id
);
```

### 2. Upgrade em Massa (Exemplo: Basic para Professional)

```sql
-- Atualizar todos os usuários Basic para Professional
UPDATE subscriptions
SET 
  plan = 'professional',
  end_date = CURRENT_TIMESTAMP + INTERVAL '1 year',
  updated_at = CURRENT_TIMESTAMP
WHERE plan = 'basic'
  AND status = 'active';
```

### 3. Estender Todas as Assinaturas Ativas por Mais 1 Ano

```sql
UPDATE subscriptions
SET 
  end_date = end_date + INTERVAL '1 year',
  updated_at = CURRENT_TIMESTAMP
WHERE status = 'active'
  AND end_date IS NOT NULL;
```

## 🔍 Encontrar IDs de Usuários

### Por Email

```sql
SELECT id, name, email FROM users WHERE email = 'usuario@email.com';
```

### Por Nome

```sql
SELECT id, name, email FROM users WHERE name ILIKE '%nome%';
```

### Listar Todos os Usuários

```sql
SELECT id, name, email, role FROM users ORDER BY name;
```

## 📝 Valores Válidos

### Planos (`plan`)
- `'free'`
- `'basic'`
- `'professional'`
- `'enterprise'`

### Status (`status`)
- `'active'` - Assinatura ativa
- `'canceled'` - Cancelada
- `'past_due'` - Pagamento atrasado
- `'trialing'` - Período de teste
- `'incomplete'` - Incompleta

## 🎯 Exemplos Práticos

### Exemplo 1: Dar Plano Professional para um Usuário Específico

```sql
-- 1. Encontrar o ID do usuário
SELECT id, name, email FROM users WHERE email = 'cliente@email.com';

-- 2. Criar/Atualizar assinatura (substitua USER_ID pelo ID encontrado)
INSERT INTO subscriptions (
  id, user_id, plan, status, start_date, end_date, 
  cancel_at_period_end, created_at, updated_at
) VALUES (
  gen_random_uuid()::TEXT,
  'USER_ID',
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

### Exemplo 2: Criar Trial de 30 Dias

```sql
INSERT INTO subscriptions (
  id, user_id, plan, status, start_date, end_date,
  cancel_at_period_end, created_at, updated_at
) VALUES (
  gen_random_uuid()::TEXT,
  'USER_ID',
  'professional',
  'trialing',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '30 days',
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (user_id) 
DO UPDATE SET
  plan = 'professional',
  status = 'trialing',
  end_date = CURRENT_TIMESTAMP + INTERVAL '30 days',
  updated_at = CURRENT_TIMESTAMP;
```

### Exemplo 3: Downgrade para Free

```sql
UPDATE subscriptions
SET 
  plan = 'free',
  status = 'active',
  end_date = CURRENT_TIMESTAMP + INTERVAL '1 year',
  updated_at = CURRENT_TIMESTAMP
WHERE user_id = 'USER_ID';
```

## ⚠️ Cuidados Importantes

1. **Sempre faça backup antes de alterar dados**
   ```sql
   -- Criar backup da tabela
   CREATE TABLE subscriptions_backup AS SELECT * FROM subscriptions;
   ```

2. **Verifique o ID do usuário antes de atualizar**
   ```sql
   SELECT id, name, email FROM users WHERE id = 'USER_ID';
   ```

3. **Use transações para operações críticas**
   ```sql
   BEGIN;
   -- Suas queries aqui
   COMMIT; -- ou ROLLBACK se algo der errado
   ```

4. **Mantenha `updated_at` atualizado**
   - Sempre inclua `updated_at = CURRENT_TIMESTAMP` nas atualizações

5. **Valide os valores**
   - Use apenas valores válidos para `plan` e `status`
   - `end_date` deve ser uma data futura

## 🔧 Usando Prisma Studio (Interface Visual)

Se preferir uma interface visual:

```bash
# No diretório backend
npx prisma studio
```

Isso abrirá uma interface web onde você pode:
- Ver todas as tabelas
- Editar registros visualmente
- Criar novos registros
- Filtrar e buscar

## 📱 Usando psql (Terminal)

```bash
# Conectar ao banco
psql "postgresql://usuario:senha@host:porta/database"

# Ou usando variável de ambiente
psql $DATABASE_URL
```

## 🎓 Comandos Úteis do psql

```sql
-- Listar todas as tabelas
\dt

-- Ver estrutura de uma tabela
\d subscriptions

-- Ver todos os dados de uma tabela
SELECT * FROM subscriptions;

-- Sair do psql
\q
```

## 📚 Referência Rápida

| Operação | SQL |
|----------|-----|
| Ver plano de um usuário | `SELECT * FROM subscriptions WHERE user_id = 'ID';` |
| Criar assinatura | `INSERT INTO subscriptions ...` |
| Atualizar plano | `UPDATE subscriptions SET plan = '...' WHERE user_id = 'ID';` |
| Cancelar | `UPDATE subscriptions SET status = 'canceled' WHERE user_id = 'ID';` |
| Reativar | `UPDATE subscriptions SET status = 'active' WHERE user_id = 'ID';` |

## 🚨 Troubleshooting

### Erro: "duplicate key value violates unique constraint"
- O usuário já tem uma assinatura. Use `UPDATE` ao invés de `INSERT`, ou use `ON CONFLICT`.

### Erro: "foreign key constraint"
- O `user_id` não existe na tabela `users`. Verifique se o ID está correto.

### Assinatura não aparece na interface
- Verifique se o `status` está como `'active'` ou `'trialing'`
- Verifique se a data de expiração (`end_date`) não passou
