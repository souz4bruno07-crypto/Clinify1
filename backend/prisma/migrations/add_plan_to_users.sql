-- Migration: Adicionar coluna plan na tabela users
-- Execute: psql $DATABASE_URL -f add_plan_to_users.sql

-- 1. Adicionar coluna plan na tabela users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free' 
CHECK (plan IN ('free', 'basic', 'professional', 'enterprise'));

-- 2. Sincronizar dados existentes da tabela subscriptions
-- Copiar planos da tabela subscriptions para users
UPDATE users u
SET plan = COALESCE(s.plan, 'free')
FROM subscriptions s
WHERE u.id = s.user_id;

-- 3. Para usuários sem assinatura, garantir que tenham 'free'
UPDATE users
SET plan = 'free'
WHERE plan IS NULL;

-- 4. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);

-- 5. Criar trigger para sincronizar com subscriptions quando plan for atualizado
CREATE OR REPLACE FUNCTION sync_user_plan_to_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar ou criar subscription quando plan do user mudar
  INSERT INTO subscriptions (
    id, user_id, plan, status, start_date, end_date,
    cancel_at_period_end, created_at, updated_at
  )
  VALUES (
    gen_random_uuid()::TEXT,
    NEW.id,
    NEW.plan,
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '1 year',
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    plan = NEW.plan,
    status = 'active',
    end_date = CURRENT_TIMESTAMP + INTERVAL '1 year',
    updated_at = CURRENT_TIMESTAMP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_sync_user_plan ON users;
CREATE TRIGGER trigger_sync_user_plan
  AFTER UPDATE OF plan ON users
  FOR EACH ROW
  WHEN (OLD.plan IS DISTINCT FROM NEW.plan)
  EXECUTE FUNCTION sync_user_plan_to_subscription();
