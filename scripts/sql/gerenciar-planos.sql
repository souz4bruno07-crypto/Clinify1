-- =====================================================
-- SCRIPTS SQL PARA GERENCIAR PLANOS NO BANCO DE DADOS
-- =====================================================

-- =====================================================
-- 1. CONSULTAS ÚTEIS
-- =====================================================

-- Ver todos os usuários e seus planos
SELECT 
  u.id,
  u.name,
  u.email,
  COALESCE(s.plan, 'free') as plano,
  COALESCE(s.status, 'active') as status,
  s.start_date,
  s.end_date,
  CASE 
    WHEN s.end_date IS NULL THEN 'Sem expiração'
    WHEN s.end_date < CURRENT_DATE THEN 'Expirado'
    ELSE (s.end_date - CURRENT_DATE)::TEXT || ' dias restantes'
  END as dias_restantes
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id
ORDER BY u.name;

-- Ver apenas usuários com assinaturas ativas
SELECT 
  u.name,
  u.email,
  s.plan,
  s.end_date
FROM users u
INNER JOIN subscriptions s ON u.id = s.user_id
WHERE s.status = 'active'
ORDER BY s.plan, u.name;

-- Ver usuários sem assinatura (serão tratados como 'free')
SELECT 
  u.id,
  u.name,
  u.email,
  u.created_at
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id
WHERE s.id IS NULL;

-- =====================================================
-- 2. CRIAR ASSINATURA PARA UM USUÁRIO
-- =====================================================

-- IMPORTANTE: Substitua 'USER_ID_AQUI' pelo ID real do usuário
-- Para encontrar o ID: SELECT id, name, email FROM users WHERE email = 'email@exemplo.com';

-- Criar assinatura Professional (1 ano)
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
  'USER_ID_AQUI',  -- ⚠️ SUBSTITUA PELO ID DO USUÁRIO
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

-- =====================================================
-- 3. ATUALIZAR PLANO DE UM USUÁRIO
-- =====================================================

-- Upgrade para Enterprise
UPDATE subscriptions
SET 
  plan = 'enterprise',
  status = 'active',
  end_date = CURRENT_TIMESTAMP + INTERVAL '1 year',
  updated_at = CURRENT_TIMESTAMP
WHERE user_id = 'USER_ID_AQUI';  -- ⚠️ SUBSTITUA PELO ID DO USUÁRIO

-- Downgrade para Basic
UPDATE subscriptions
SET 
  plan = 'basic',
  status = 'active',
  end_date = CURRENT_TIMESTAMP + INTERVAL '1 year',
  updated_at = CURRENT_TIMESTAMP
WHERE user_id = 'USER_ID_AQUI';

-- Mudar para Free
UPDATE subscriptions
SET 
  plan = 'free',
  status = 'active',
  end_date = CURRENT_TIMESTAMP + INTERVAL '1 year',
  updated_at = CURRENT_TIMESTAMP
WHERE user_id = 'USER_ID_AQUI';

-- =====================================================
-- 4. CRIAR TRIAL (PERÍODO DE TESTE)
-- =====================================================

-- Trial de 30 dias no plano Professional
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
-- 5. CANCELAR ASSINATURA
-- =====================================================

-- Cancelar mantendo acesso até o final do período
UPDATE subscriptions
SET 
  cancel_at_period_end = true,
  status = 'active',
  updated_at = CURRENT_TIMESTAMP
WHERE user_id = 'USER_ID_AQUI';

-- Cancelar imediatamente
UPDATE subscriptions
SET 
  status = 'canceled',
  canceled_at = CURRENT_TIMESTAMP,
  cancel_at_period_end = false,
  updated_at = CURRENT_TIMESTAMP
WHERE user_id = 'USER_ID_AQUI';

-- =====================================================
-- 6. REATIVAR ASSINATURA
-- =====================================================

UPDATE subscriptions
SET 
  status = 'active',
  cancel_at_period_end = false,
  canceled_at = NULL,
  end_date = CURRENT_TIMESTAMP + INTERVAL '1 year',
  updated_at = CURRENT_TIMESTAMP
WHERE user_id = 'USER_ID_AQUI';

-- =====================================================
-- 7. OPERAÇÕES EM MASSA
-- =====================================================

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

-- Upgrade em massa: Basic para Professional
UPDATE subscriptions
SET 
  plan = 'professional',
  end_date = CURRENT_TIMESTAMP + INTERVAL '1 year',
  updated_at = CURRENT_TIMESTAMP
WHERE plan = 'basic'
  AND status = 'active';

-- Estender todas as assinaturas ativas por mais 1 ano
UPDATE subscriptions
SET 
  end_date = end_date + INTERVAL '1 year',
  updated_at = CURRENT_TIMESTAMP
WHERE status = 'active'
  AND end_date IS NOT NULL;

-- =====================================================
-- 8. ENCONTRAR ID DE USUÁRIO
-- =====================================================

-- Por email
SELECT id, name, email FROM users WHERE email = 'usuario@email.com';

-- Por nome (busca parcial)
SELECT id, name, email FROM users WHERE name ILIKE '%nome%';

-- Listar todos os usuários
SELECT id, name, email, role FROM users ORDER BY name;

-- =====================================================
-- 9. VERIFICAÇÕES E RELATÓRIOS
-- =====================================================

-- Assinaturas que expiram nos próximos 30 dias
SELECT 
  u.name,
  u.email,
  s.plan,
  s.end_date,
  (s.end_date - CURRENT_DATE)::INTEGER as dias_restantes
FROM users u
INNER JOIN subscriptions s ON u.id = s.user_id
WHERE s.status = 'active'
  AND s.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
ORDER BY s.end_date;

-- Contagem de usuários por plano
SELECT 
  COALESCE(s.plan, 'free') as plano,
  COUNT(*) as total_usuarios
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id
GROUP BY s.plan
ORDER BY total_usuarios DESC;

-- Assinaturas canceladas
SELECT 
  u.name,
  u.email,
  s.plan,
  s.canceled_at,
  s.end_date
FROM users u
INNER JOIN subscriptions s ON u.id = s.user_id
WHERE s.status = 'canceled'
ORDER BY s.canceled_at DESC;

-- =====================================================
-- 10. BACKUP E SEGURANÇA
-- =====================================================

-- Criar backup da tabela antes de fazer alterações
CREATE TABLE subscriptions_backup_YYYYMMDD AS 
SELECT * FROM subscriptions;

-- Restaurar de backup (se necessário)
-- DELETE FROM subscriptions;
-- INSERT INTO subscriptions SELECT * FROM subscriptions_backup_YYYYMMDD;
