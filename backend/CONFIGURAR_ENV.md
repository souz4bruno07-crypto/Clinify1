# 📝 Como Criar o Arquivo .env

## Passo a Passo

1. **Abra a pasta `backend` no seu computador**

2. **Crie um arquivo chamado `.env`** (sem extensão, só `.env`)

3. **Cole o conteúdo abaixo e preencha com suas informações:**

```env
# ============================================
# CONFIGURAÇÃO DO BANCO DE DADOS POSTGRESQL
# ============================================
# Cole aqui a URL do seu banco PostgreSQL remoto
# Formato: postgresql://usuario:senha@host:porta/banco?connection_limit=20&pool_timeout=10&sslmode=require

DATABASE_URL="postgresql://postgres:senha123@localhost:5432/clinify?connection_limit=20&pool_timeout=10"

# ============================================
# SEGURANÇA - JWT SECRET
# ============================================
# IMPORTANTE: Gere uma chave secreta forte (mínimo 32 caracteres)
# No terminal, execute: openssl rand -base64 32
# Cole o resultado abaixo:

JWT_SECRET="cole-aqui-a-chave-gerada-com-openssl"

# ============================================
# CONFIGURAÇÕES OPCIONAIS
# ============================================

# URL do frontend (para CORS)
FRONTEND_URL="http://localhost:5173"

# Porta do servidor backend
PORT=3001

# Ambiente (development, production, test)
NODE_ENV="development"

# ============================================
# REDIS (Opcional - para cache)
# ============================================
# REDIS_HOST="localhost"
# REDIS_PORT=6379
# REDIS_PASSWORD=""
```

## ⚠️ IMPORTANTE

- Substitua `DATABASE_URL` pela URL real do seu banco PostgreSQL remoto
- Gere o `JWT_SECRET` executando no terminal: `openssl rand -base64 32`
- **NUNCA compartilhe este arquivo** - ele contém senhas!




