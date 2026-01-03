# 🔧 Como Resolver o Erro 404 no Login

## ❌ Problema: "HTTP error! status: 404"

Isso significa que o frontend não está conseguindo encontrar a rota de login no backend.

---

## ✅ Soluções:

### Solução 1: Verificar se o Backend Está Rodando

1. **Verifique se o backend está rodando:**
   - Abra: http://localhost:3001/health
   - Deve aparecer: `{"status":"ok"}`

2. **Se não estiver rodando:**
   ```bash
   cd backend
   # Exportar variáveis (se ainda não exportou)
   export DATABASE_URL="postgresql://neondb_owner:npg_vqTjo86OfzmU@ep-steep-bar-accrl4m1-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connection_limit=20&pool_timeout=10"
   export JWT_SECRET="/OP+ejdvy6G7ch752aHkFYFjEAneDBSpqLHsVipH5JI="
   export FRONTEND_URL="http://localhost:5173"
   export PORT=3001
   export NODE_ENV="development"
   
   npm run dev
   ```

---

### Solução 2: Verificar a URL da API no Frontend

O frontend precisa estar apontando para `http://localhost:3001/api`

1. **Verifique se existe um arquivo `.env` na raiz do projeto** (não na pasta backend)
2. **Se não existir, crie um arquivo `.env` na raiz** com:
   ```env
   VITE_API_URL=http://localhost:3001/api
   ```

3. **Reinicie o frontend** (pare e inicie novamente)

---

### Solução 3: Criar uma Conta Primeiro

**O erro 404 pode ser porque você está tentando fazer login sem ter uma conta criada.**

#### Opção A: Criar conta pelo Frontend

1. **Na tela de login, clique em:** "Novo no Clinify? Criar conta gratuita"
2. **Preencha os dados:**
   - Nome
   - Email
   - Senha
   - Nome da clínica
3. **Clique em criar conta**
4. **Depois faça login** com o email e senha criados

#### Opção B: Criar conta via Prisma Studio

1. **Abra o Prisma Studio:**
   ```bash
   cd backend
   npm run db:studio
   ```

2. **Acesse:** http://localhost:5555
3. **Clique na tabela `User`**
4. **Clique em "Add record"**
5. **Preencha:**
   - `email`: seu email
   - `password`: **IMPORTANTE** - precisa ser a senha criptografada (hash)
   - `name`: seu nome
   - `clinicName`: nome da clínica
   - `clinicId`: deixe vazio (será preenchido automaticamente)
   - `role`: `admin`
   - `onboardingCompleted`: `false`

**⚠️ PROBLEMA:** A senha precisa estar criptografada (hash bcrypt). É melhor criar pelo frontend ou usar a API.

#### Opção C: Criar conta via API (Terminal)

Execute no terminal:

```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu-email@exemplo.com",
    "password": "sua-senha",
    "name": "Seu Nome",
    "clinicName": "Nome da Clínica"
  }'
```

Substitua:
- `seu-email@exemplo.com` pelo seu email
- `sua-senha` pela senha que você quer usar
- `Seu Nome` pelo seu nome
- `Nome da Clínica` pelo nome da sua clínica

---

### Solução 4: Verificar CORS

Se o backend estiver rodando mas ainda der erro, pode ser problema de CORS.

**Verifique no arquivo `backend/src/index.ts`:**

Procure por:
```typescript
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true
}));
```

Certifique-se de que `FRONTEND_URL` está configurado como `http://localhost:5173` (ou a porta que o frontend está usando).

---

## 🧪 Teste Rápido:

1. **Teste o health check:**
   ```bash
   curl http://localhost:3001/health
   ```
   Deve retornar: `{"status":"ok","timestamp":"..."}`

2. **Teste a rota de login:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/signin \
     -H "Content-Type: application/json" \
     -d '{"email":"teste@teste.com","password":"123456"}'
   ```
   
   Se retornar 401 (credenciais inválidas), a rota está funcionando! Só precisa criar uma conta.
   
   Se retornar 404, o backend não está rodando ou a rota não existe.

---

## ✅ Checklist:

- [ ] Backend está rodando? (http://localhost:3001/health)
- [ ] Frontend está apontando para `http://localhost:3001/api`?
- [ ] Você já criou uma conta? (se não, crie primeiro!)
- [ ] CORS está configurado corretamente?

---

## 🎯 Solução Mais Provável:

**Você precisa criar uma conta primeiro!**

1. Na tela de login, clique em "Novo no Clinify? Criar conta gratuita"
2. Preencha os dados e crie a conta
3. Depois faça login com o email e senha criados

---

## 💬 Ainda não funcionou?

Me diga:
1. O backend está rodando? (teste http://localhost:3001/health)
2. Qual erro exato aparece? (404? 401? Outro?)
3. Você já criou uma conta?

Com essas informações, consigo te ajudar melhor! 🚀




