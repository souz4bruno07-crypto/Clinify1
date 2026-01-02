# ✅ Checklist de Conexões para Deploy no Vercel

Este documento contém todas as verificações e configurações necessárias para fazer deploy do Clinify no Vercel, com foco em conexões com banco de dados e Stripe.

## 📋 Índice
1. [Conexão com Banco de Dados (PostgreSQL)](#1-conexão-com-banco-de-dados-postgresql)
2. [Configuração do Stripe](#2-configuração-do-stripe)
3. [Variáveis de Ambiente](#3-variáveis-de-ambiente)
4. [Configuração do Prisma](#4-configuração-do-prisma)
5. [Configuração do Vercel](#5-configuração-do-vercel)

---

## 1. Conexão com Banco de Dados (PostgreSQL)

### ✅ Verificações Necessárias

#### 1.1. Connection Pooling
**IMPORTANTE**: O Vercel usa serverless functions que abrem e fecham conexões rapidamente. É essencial usar connection pooling.

**Status Atual**: O código já tem um comentário sobre isso em `backend/src/config/database.ts`, mas precisa garantir que a DATABASE_URL está configurada corretamente.

**✅ Ação Requerida**:
- A `DATABASE_URL` deve incluir parâmetros de connection pooling
- Formato recomendado para Neon/PostgreSQL:
  ```
  postgresql://user:password@host:5432/database?connection_limit=20&pool_timeout=10&pgbouncer=true
  ```
- Se usar Neon, use a connection string com pooling (geralmente termina com `?sslmode=require` ou similar)
- Se usar Supabase, use a connection pooler string (porta 6543, não 5432)

#### 1.2. Verificar Provider do Banco
- [ ] Confirmar qual provider está sendo usado (Neon, Supabase, Railway, etc.)
- [ ] Obter a connection string correta com pooling habilitado
- [ ] Testar a conexão antes do deploy

#### 1.3. Prisma Configuration
O Prisma precisa estar configurado corretamente para produção:

- [ ] Executar `npx prisma generate` no build
- [ ] Executar migrations antes do primeiro deploy
- [ ] Verificar se o schema.prisma está correto

**Script recomendado para verificar**:
```bash
cd backend
npx prisma generate
npx prisma db push  # ou npx prisma migrate deploy para produção
```

---

## 2. Configuração do Stripe

### ✅ Verificações Necessárias

#### 2.1. Variáveis do Stripe Obrigatórias
As seguintes variáveis de ambiente devem estar configuradas:

- [ ] `STRIPE_SECRET_KEY` - Chave secreta do Stripe (produção ou teste)
- [ ] `STRIPE_WEBHOOK_SECRET` - Secret do webhook (obrigatório para webhooks funcionarem)
- [ ] `STRIPE_PRICE_ID_BASIC` - Price ID do plano Basic
- [ ] `STRIPE_PRICE_ID_PROFESSIONAL` - Price ID do plano Professional  
- [ ] `STRIPE_PRICE_ID_ENTERPRISE` - Price ID do plano Enterprise

#### 2.2. Verificar Produtos no Stripe Dashboard
- [ ] Criar produtos no Stripe Dashboard (se ainda não criou)
- [ ] Criar preços (prices) para cada produto
- [ ] Copiar os Price IDs e configurar nas variáveis de ambiente

#### 2.3. Configurar Webhook no Stripe
**CRÍTICO**: Para que os webhooks funcionem no Vercel:

1. No Stripe Dashboard → Developers → Webhooks
2. Adicionar endpoint: `https://seu-dominio.vercel.app/api/billing/webhook/stripe`
3. Selecionar eventos:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copiar o "Signing secret" e adicionar como `STRIPE_WEBHOOK_SECRET`

#### 2.4. Testar Conexão Stripe
O código já tem um endpoint de teste: `GET /api/billing/stripe/test`

Após o deploy, testar acessando:
```
https://seu-dominio.vercel.app/api/billing/stripe/test
```

---

## 3. Variáveis de Ambiente

### 📝 Variáveis Obrigatórias

Configure no Vercel Dashboard → Settings → Environment Variables:

#### Backend (API)
```bash
# Banco de Dados (OBRIGATÓRIO)
DATABASE_URL=postgresql://...?connection_limit=20&pool_timeout=10

# Autenticação (OBRIGATÓRIO)
JWT_SECRET=<gerar com: openssl rand -base64 32>

# URL do Frontend (OBRIGATÓRIO)
FRONTEND_URL=https://seu-dominio.vercel.app

# Porta (geralmente não precisa no Vercel, mas pode configurar)
PORT=3001
NODE_ENV=production

# Stripe (OPCIONAL mas recomendado)
STRIPE_SECRET_KEY=sk_live_... ou sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_BASIC=price_...
STRIPE_PRICE_ID_PROFESSIONAL=price_...
STRIPE_PRICE_ID_ENTERPRISE=price_...

# Redis (OPCIONAL)
REDIS_HOST=...
REDIS_PORT=...
REDIS_PASSWORD=...
```

#### Frontend
```bash
# URL da API Backend (OBRIGATÓRIO)
VITE_API_URL=https://seu-backend.vercel.app/api
```

### ✅ Checklist de Variáveis
- [ ] DATABASE_URL configurada com connection pooling
- [ ] JWT_SECRET configurado (pelo menos 32 caracteres)
- [ ] FRONTEND_URL apontando para o domínio do Vercel
- [ ] VITE_API_URL no frontend apontando para a API
- [ ] Stripe configurado (se usar pagamentos)
- [ ] Todas as variáveis configuradas para Production, Preview e Development

---

## 4. Configuração do Prisma

### ✅ Verificações

#### 4.1. Build do Prisma
O Prisma precisa gerar o cliente antes de rodar. No Vercel, isso é feito no build.

**Verificar `backend/package.json`**:
```json
{
  "scripts": {
    "build": "tsc",
    "postinstall": "prisma generate"
  }
}
```

- [ ] Verificar se `postinstall` está configurado para gerar Prisma Client
- [ ] Ou adicionar `prisma generate` no script de build

#### 4.2. Migrations
- [ ] Executar migrations ANTES do primeiro deploy
- [ ] Ou usar `prisma db push` para desenvolvimento
- [ ] Para produção, usar `prisma migrate deploy`

**Comando para executar migrations**:
```bash
cd backend
npx prisma migrate deploy
```

---

## 5. Configuração do Vercel

### ✅ Checklist do Deploy

#### 5.1. Estrutura do Projeto
O Vercel precisa saber como buildar o projeto:

- [ ] Backend deve ter seu próprio `vercel.json` ou ser configurado como função serverless
- [ ] Frontend já tem `vercel.json` na raiz

#### 5.2. Configuração Recomendada

**Para o Backend** (se estiver em pasta separada):
Criar `backend/vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/index.js"
    }
  ]
}
```

**Para o Frontend** (já existe `vercel.json` na raiz):
✅ Já configurado corretamente

#### 5.3. Build Settings no Vercel Dashboard

**Backend**:
- Root Directory: `backend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

**Frontend**:
- Root Directory: `.` (raiz)
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

#### 5.4. Domínios e URLs
- [ ] Configurar domínio personalizado (opcional)
- [ ] Anotar URL do backend: `https://seu-backend.vercel.app`
- [ ] Anotar URL do frontend: `https://seu-frontend.vercel.app`
- [ ] Configurar `FRONTEND_URL` com a URL do frontend
- [ ] Configurar `VITE_API_URL` com a URL do backend + `/api`

---

## 6. Testes Pós-Deploy

### ✅ Verificações Após o Deploy

#### 6.1. Backend
- [ ] Health check: `https://seu-backend.vercel.app/health`
- [ ] Deve retornar: `{"status":"ok","timestamp":"..."}`

#### 6.2. Banco de Dados
- [ ] Testar login/cadastro (cria registros no banco)
- [ ] Verificar se consegue ler dados
- [ ] Verificar logs do Vercel para erros de conexão

#### 6.3. Stripe
- [ ] Endpoint de teste: `https://seu-backend.vercel.app/api/billing/stripe/test`
- [ ] Verificar se retorna `{"configured":true,"stripeTest":{"connected":true}}`
- [ ] Testar criação de checkout (se possível)
- [ ] Verificar webhook (usar Stripe CLI para testar localmente primeiro)

#### 6.4. Frontend
- [ ] Carregar a página inicial
- [ ] Tentar fazer login
- [ ] Verificar se consegue fazer requisições à API
- [ ] Verificar console do navegador para erros

---

## 7. Problemas Comuns e Soluções

### ❌ Erro: "Can't reach database server"
**Causa**: Connection string incorreta ou sem pooling
**Solução**: 
- Verificar se a DATABASE_URL está correta
- Adicionar parâmetros de pooling
- Verificar se o banco aceita conexões externas

### ❌ Erro: "Prisma Client not generated"
**Causa**: Prisma Client não foi gerado no build
**Solução**:
- Adicionar `prisma generate` no script de build ou postinstall
- Verificar se `prisma` está nas devDependencies

### ❌ Erro: "Stripe não está configurado"
**Causa**: STRIPE_SECRET_KEY não configurado ou vazio
**Solução**:
- Verificar se a variável está configurada no Vercel
- Verificar se não tem espaços em branco
- Verificar se está usando a chave correta (live vs test)

### ❌ Erro: "Webhook secret não configurado"
**Causa**: STRIPE_WEBHOOK_SECRET não configurado
**Solução**:
- Configurar webhook no Stripe Dashboard
- Copiar o signing secret
- Adicionar como variável de ambiente

---

## 8. Scripts Úteis

### Gerar JWT_SECRET
```bash
openssl rand -base64 32
```

### Testar Conexão do Banco
```bash
cd backend
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"
```

### Verificar Variáveis de Ambiente
```bash
cd backend
node testar-env.js
```

### Testar Stripe
```bash
cd backend
node testar-stripe.js
```

---

## 📝 Notas Finais

1. **Connection Pooling é ESSENCIAL** para o Vercel serverless
2. **Webhooks do Stripe** precisam de URL pública (não funcionam em localhost)
3. **Variáveis de ambiente** devem ser configuradas para todos os ambientes (Production, Preview, Development)
4. **Migrations** devem ser executadas antes do primeiro deploy
5. **Logs do Vercel** são essenciais para debugar problemas

---

---

## 9. Script de Verificação

Execute o script de verificação antes do deploy:

```bash
cd backend
node verificar-conexoes.js
```

Este script verifica:
- ✅ Conexão com banco de dados
- ✅ Configuração do Stripe
- ✅ Variáveis de ambiente obrigatórias
- ✅ Connection pooling
- ✅ Price IDs do Stripe

---

**Última atualização**: Dezembro 2024

