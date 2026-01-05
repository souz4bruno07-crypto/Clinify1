-- =====================================================
-- ADICIONAR COLUNA PLAN NA TABELA USERS
-- =====================================================

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

-- 5. Verificar resultado
SELECT 
  plan,
  COUNT(*) as total_usuarios
FROM users
GROUP BY plan
ORDER BY 
  CASE plan
    WHEN 'free' THEN 1
    WHEN 'basic' THEN 2
    WHEN 'professional' THEN 3
    WHEN 'enterprise' THEN 4
  END;

-- =====================================================
-- COMO USAR AGORA (MUITO MAIS FÁCIL!)
-- =====================================================

-- Ver todos os usuários e seus planos
SELECT id, name, email, plan FROM users ORDER BY name;

-- Atualizar plano de um usuário (SUPER SIMPLES!)
UPDATE users 
SET plan = 'professional' 
WHERE email = 'usuario@email.com';

-- Atualizar por ID
UPDATE users 
SET plan = 'enterprise' 
WHERE id = 'ID_DO_USUARIO';

-- Ver usuários de um plano específico
SELECT name, email, plan FROM users WHERE plan = 'professional';

-- Contar usuários por plano
SELECT plan, COUNT(*) as total FROM users GROUP BY plan;
