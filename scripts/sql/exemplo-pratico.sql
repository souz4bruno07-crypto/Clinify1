-- =====================================================
-- EXEMPLO PRÁTICO: COMO ATUALIZAR PLANO DE UM USUÁRIO
-- =====================================================

-- PASSO 1: Encontrar o usuário pelo email
SELECT id, name, email FROM users WHERE email = 'cliente@exemplo.com';

-- Resultado esperado:
-- id: 123e4567-e89b-12d3-a456-426614174000
-- name: João Silva
-- email: cliente@exemplo.com

-- PASSO 2: Verificar se já tem assinatura
SELECT * FROM subscriptions WHERE user_id = '123e4567-e89b-12d3-a456-426614174000';

-- PASSO 3: Criar ou atualizar assinatura Professional
-- Opção A: Se NÃO tem assinatura (criar nova)
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
  '123e4567-e89b-12d3-a456-426614174000',
  'professional',
  'active',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '1 year',
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Opção B: Se JÁ tem assinatura (atualizar)
UPDATE subscriptions
SET 
  plan = 'professional',
  status = 'active',
  end_date = CURRENT_TIMESTAMP + INTERVAL '1 year',
  updated_at = CURRENT_TIMESTAMP
WHERE user_id = '123e4567-e89b-12d3-a456-426614174000';

-- Opção C: Criar ou atualizar (recomendado - funciona sempre)
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
  '123e4567-e89b-12d3-a456-426614174000',
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

-- PASSO 4: Verificar se funcionou
SELECT 
  u.name,
  u.email,
  s.plan,
  s.status,
  s.end_date
FROM users u
INNER JOIN subscriptions s ON u.id = s.user_id
WHERE u.id = '123e4567-e89b-12d3-a456-426614174000';

-- =====================================================
-- EXEMPLO: CRIAR TRIAL DE 30 DIAS
-- =====================================================

-- 1. Encontrar usuário
SELECT id FROM users WHERE email = 'novo@cliente.com';

-- 2. Criar trial
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
  'ID_DO_USUARIO',
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
  plan = EXCLUDED.plan,
  status = 'trialing',
  end_date = CURRENT_TIMESTAMP + INTERVAL '30 days',
  updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- EXEMPLO: CANCELAR ASSINATURA
-- =====================================================

-- Cancelar mantendo acesso até o final
UPDATE subscriptions
SET 
  cancel_at_period_end = true,
  status = 'active',
  updated_at = CURRENT_TIMESTAMP
WHERE user_id = 'ID_DO_USUARIO';

-- Cancelar imediatamente
UPDATE subscriptions
SET 
  status = 'canceled',
  canceled_at = CURRENT_TIMESTAMP,
  cancel_at_period_end = false,
  updated_at = CURRENT_TIMESTAMP
WHERE user_id = 'ID_DO_USUARIO';
