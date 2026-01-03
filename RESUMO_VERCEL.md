# 🚀 Resumo: Preparação para Deploy no Vercel

## ✅ Checklist Rápido

### 1. Banco de Dados (PostgreSQL)
- [ ] Obter connection string com **connection pooling**
  - Neon: usar connection string com `?sslmode=require` (tem pooling automático)
  - Supabase: usar connection pooler na porta 6543
  - Outros: adicionar `?connection_limit=20&pool_timeout=10`
- [ ] Testar conexão antes do deploy
- [ ] Executar migrations: `cd backend && npx prisma migrate deploy`

### 2. Stripe (Opcional)
- [ ] Criar produtos no Stripe Dashboard
- [ ] Copiar Price IDs para variáveis de ambiente
- [ ] Configurar webhook no Stripe (URL: `https://seu-dominio.vercel.app/api/billing/webhook/stripe`)
- [ ] Copiar Webhook Secret

### 3. Variáveis de Ambiente no Vercel

**Backend** (Settings → Environment Variables):
```
DATABASE_URL=postgresql://... (com pooling)
JWT_SECRET=<gerar: openssl rand -base64 32>
FRONTEND_URL=https://seu-frontend.vercel.app
STRIPE_SECRET_KEY=sk_live_... ou sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_BASIC=price_...
STRIPE_PRICE_ID_PROFESSIONAL=price_...
STRIPE_PRICE_ID_ENTERPRISE=price_...
NODE_ENV=production
```

**Frontend**:
```
VITE_API_URL=https://seu-backend.vercel.app/api
```

### 4. Build Settings no Vercel

**Backend**:
- Root Directory: `backend`
- Build Command: `npm run build` (já inclui `prisma generate`)
- Output Directory: `dist`
- Install Command: `npm install`

**Frontend**:
- Root Directory: `.` (raiz)
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### 5. Testar Após Deploy

```bash
# Health check
curl https://seu-backend.vercel.app/health

# Testar Stripe (se configurado)
curl https://seu-backend.vercel.app/api/billing/stripe/test
```

## 📝 Scripts Úteis

```bash
# Verificar conexões localmente
cd backend
node verificar-conexoes.js

# Gerar JWT_SECRET
openssl rand -base64 32

# Executar migrations
cd backend
npx prisma migrate deploy
```

## ⚠️ Pontos Críticos

1. **Connection Pooling é OBRIGATÓRIO** para Vercel serverless
2. **Prisma Client** será gerado automaticamente no build (postinstall configurado)
3. **Migrations** devem ser executadas ANTES do primeiro deploy
4. **Webhooks do Stripe** precisam de URL pública (não funciona em localhost)

## 📚 Documentação Completa

Veja `CHECKLIST_VERCEL.md` para documentação detalhada.




