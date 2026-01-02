# 🔧 Resolver Erro "Backend Offline" no Vercel

## 📋 Problema

O frontend está deployado no Vercel, mas está mostrando "Backend Offline" porque não consegue se conectar ao backend.

## ✅ Solução: Configurar Variável de Ambiente

O frontend precisa saber onde está o backend. Você tem duas opções:

---

## 🎯 Opção 1: Backend também no Vercel (Recomendado)

### Passo 1: Deploy do Backend no Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em **"Add New..."** → **"Project"**
3. Selecione o mesmo repositório do frontend
4. Configure:
   - **Project Name**: `clinify-backend` (ou outro nome)
   - **Root Directory**: `backend`
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Passo 2: Configurar Variáveis de Ambiente do Backend

No projeto do backend no Vercel, vá em **Settings** → **Environment Variables** e adicione:

```bash
# Banco de Dados (OBRIGATÓRIO)
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# Autenticação (OBRIGATÓRIO)
JWT_SECRET=<gerar com: openssl rand -base64 32>

# URL do Frontend (OBRIGATÓRIO)
FRONTEND_URL=https://seu-frontend.vercel.app

# Porta (não precisa no Vercel, mas pode configurar)
PORT=3001
NODE_ENV=production

# Stripe (se usar)
STRIPE_SECRET_KEY=sk_live_... ou sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_BASIC=price_...
STRIPE_PRICE_ID_PROFESSIONAL=price_...
STRIPE_PRICE_ID_ENTERPRISE=price_...
```

### Passo 3: Criar vercel.json para o Backend

Crie o arquivo `backend/vercel.json`:

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

### Passo 4: Configurar VITE_API_URL no Frontend

No projeto do **frontend** no Vercel, vá em **Settings** → **Environment Variables** e adicione:

```bash
VITE_API_URL=https://seu-backend.vercel.app/api
```

**Substitua `seu-backend.vercel.app` pela URL real do seu backend no Vercel!**

### Passo 5: Fazer Redeploy

Após adicionar a variável `VITE_API_URL`, faça um novo deploy do frontend:
- Vá em **Deployments** → Clique nos **3 pontos** → **Redeploy**

---

## 🎯 Opção 2: Backend em Outro Serviço

Se o backend está em outro serviço (Railway, Render, Heroku, etc.):

### Passo 1: Obter URL do Backend

Anote a URL do seu backend (ex: `https://clinify-backend.railway.app`)

### Passo 2: Configurar VITE_API_URL no Frontend

No projeto do **frontend** no Vercel:
1. Vá em **Settings** → **Environment Variables**
2. Adicione:
   ```bash
   VITE_API_URL=https://sua-url-backend.com/api
   ```
3. **Importante**: Substitua pela URL real do seu backend!

### Passo 3: Fazer Redeploy

Após adicionar a variável, faça um novo deploy do frontend.

---

## 🔍 Verificar se Funcionou

1. Acesse a URL do frontend no Vercel
2. A mensagem "Backend Offline" deve desaparecer
3. Você deve conseguir fazer login/cadastro

### Testar Health Check Manualmente

Abra no navegador:
```
https://seu-backend.vercel.app/health
```

Deve retornar:
```json
{
  "status": "ok",
  "timestamp": "2024-..."
}
```

---

## ⚠️ Problemas Comuns

### Erro: "Backend Offline" continua aparecendo

**Causa**: A variável `VITE_API_URL` não foi configurada ou o redeploy não foi feito.

**Solução**:
1. Verifique se `VITE_API_URL` está configurada no Vercel
2. Verifique se o valor está correto (deve terminar com `/api`)
3. Faça um novo deploy do frontend
4. Limpe o cache do navegador (Ctrl+Shift+R ou Cmd+Shift+R)

### Erro: CORS no navegador

**Causa**: O backend não está permitindo requisições do frontend.

**Solução**: No backend, verifique se `FRONTEND_URL` está configurada corretamente com a URL do frontend no Vercel.

### Erro: 404 no health check

**Causa**: O backend não está rodando ou a URL está errada.

**Solução**:
1. Verifique se o backend está deployado
2. Teste o endpoint `/health` diretamente no navegador
3. Verifique os logs do backend no Vercel

---

## 📝 Checklist Rápido

- [ ] Backend deployado no Vercel (ou outro serviço)
- [ ] Variável `VITE_API_URL` configurada no frontend no Vercel
- [ ] Variável `FRONTEND_URL` configurada no backend no Vercel
- [ ] Variável `DATABASE_URL` configurada no backend
- [ ] Variável `JWT_SECRET` configurada no backend
- [ ] Redeploy do frontend feito após configurar `VITE_API_URL`
- [ ] Health check funcionando: `https://seu-backend.vercel.app/health`

---

## 🚀 Próximos Passos

Após resolver o "Backend Offline":
1. Teste o login/cadastro
2. Teste as funcionalidades principais
3. Configure domínio personalizado (opcional)
4. Configure Stripe/Mercado Pago (se usar pagamentos)

---

**Última atualização**: Dezembro 2024


