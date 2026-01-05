# 🎯 Como Usar a Coluna PLAN na Tabela USERS

## ✅ Implementação Completa!

Agora você pode gerenciar planos **diretamente na tabela `users`** - muito mais simples!

## 🚀 Como Funciona

### 1. Estrutura

A tabela `users` agora tem uma coluna `plan` que pode ser:
- `'free'`
- `'basic'`
- `'professional'`
- `'enterprise'`

### 2. SQL para Adicionar a Coluna

Execute este SQL no seu banco de dados:

```sql
-- Adicionar coluna plan
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free' 
CHECK (plan IN ('free', 'basic', 'professional', 'enterprise'));

-- Sincronizar dados existentes
UPDATE users u
SET plan = COALESCE(s.plan, 'free')
FROM subscriptions s
WHERE u.id = s.user_id;

-- Garantir que todos tenham um plano
UPDATE users
SET plan = 'free'
WHERE plan IS NULL;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);
```

**OU** use o arquivo pronto:
```bash
psql $DATABASE_URL -f backend/prisma/migrations/add_plan_to_users.sql
```

### 3. Como Atualizar Planos (SUPER SIMPLES!)

#### Por Email:
```sql
UPDATE users 
SET plan = 'professional' 
WHERE email = 'usuario@email.com';
```

#### Por ID:
```sql
UPDATE users 
SET plan = 'enterprise' 
WHERE id = 'ID_DO_USUARIO';
```

#### Ver Todos os Planos:
```sql
SELECT id, name, email, plan FROM users ORDER BY name;
```

#### Ver Usuários de um Plano:
```sql
SELECT name, email, plan FROM users WHERE plan = 'professional';
```

## 🎨 Interface Visual

Na interface do sistema (Configurações → Equipe e Acessos):

1. A coluna **"Plano"** aparece automaticamente na tabela
2. Clique no ícone 💳 ao lado do usuário
3. Selecione o novo plano
4. Clique em "Atualizar Plano"

**Pronto!** O plano é atualizado diretamente na tabela `users`.

## 🔄 Sincronização Automática

Um **trigger** foi criado para sincronizar automaticamente com a tabela `subscriptions`:

- Quando você atualiza `users.plan`, a tabela `subscriptions` é atualizada automaticamente
- Isso mantém compatibilidade com o sistema existente

## 📊 Exemplos Práticos

### Exemplo 1: Upgrade para Professional
```sql
UPDATE users 
SET plan = 'professional' 
WHERE email = 'cliente@exemplo.com';
```

### Exemplo 2: Downgrade para Basic
```sql
UPDATE users 
SET plan = 'basic' 
WHERE id = 'abc123-def456-...';
```

### Exemplo 3: Ver Contagem por Plano
```sql
SELECT plan, COUNT(*) as total 
FROM users 
GROUP BY plan 
ORDER BY 
  CASE plan
    WHEN 'free' THEN 1
    WHEN 'basic' THEN 2
    WHEN 'professional' THEN 3
    WHEN 'enterprise' THEN 4
  END;
```

## ⚡ Vantagens

✅ **Muito mais simples** - Uma coluna, um UPDATE  
✅ **Mais rápido** - Não precisa fazer JOIN  
✅ **Mais direto** - Tudo na mesma tabela  
✅ **Interface visual** - Funciona na UI também  
✅ **Sincronização automática** - Mantém subscriptions atualizada  

## 🎯 Próximos Passos

1. Execute o SQL de migração
2. Execute `npx prisma generate` no backend
3. Reinicie o backend
4. Pronto! Agora você pode gerenciar planos diretamente na tabela `users`

## 📝 Notas

- O valor padrão é `'free'` se não especificado
- A coluna tem validação CHECK para garantir valores válidos
- O trigger sincroniza automaticamente com `subscriptions`
- A interface visual também funciona normalmente
