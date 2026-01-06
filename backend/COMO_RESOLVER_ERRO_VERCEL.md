# 🛠️ Como Resolver Erro 500 no Vercel

Este guia ajuda a resolver o erro `FUNCTION_INVOCATION_FAILED` no Vercel.

## 🔍 Diagnóstico do Erro

O erro 500 no Vercel geralmente acontece por uma destas razões:

1. **Build não executado** - O arquivo `dist/index.js` não existe
2. **Variáveis de ambiente faltando** - DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET
3. **Erro na importação do módulo** - Problema com o código TypeScript compilado
4. **Prisma Client não gerado** - O Prisma precisa gerar o client antes

## ✅ Solução Passo a Passo

### 1. Verificar Configuração do Build no Vercel

No painel do Vercel:
1. Vá em **Settings** → **General**
2. Verifique se está configurado:
   - **Root Directory**: `backend`
   - **Build Command**: `npm run build`
   - **Output Directory**: (deixe vazio ou `dist`)
   - **Install Command**: `npm install`

### 2. Verificar Variáveis de Ambiente Obrigatórias

No painel do Vercel:
1. Vá em **Settings** → **Environment Variables**
2. Configure as seguintes variáveis **OBRIGATÓRIAS**:

```bash
# Banco de Dados (OBRIGATÓRIO)
DATABASE_URL=postgresql://user:password@host:5432/database?connection_limit=20&pool_timeout=10

# Autenticação (OBRIGATÓRIO - ambos devem ter pelo menos 32 caracteres)
JWT_SECRET=<gerar com: openssl rand -base64 32>
JWT_REFRESH_SECRET=<gerar com: openssl rand -base64 32>

# URL do Frontend (OBRIGATÓRIO)
FRONTEND_URL=https://seu-dominio-frontend.vercel.app

# Ambiente
NODE_ENV=production
PORT=3001
```

**Gerar JWT Secrets:**
```bash
openssl rand -base64 32
```

### 3. Verificar se o Build Gera o Dist

O script `build` no `package.json` deve:
1. Gerar o Prisma Client (`prisma generate`)
2. Compilar TypeScript (`tsc`)

Verifique o `backend/package.json`:
```json
{
  "scripts": {
    "build": "prisma generate && npx -p typescript tsc",
    "postinstall": "prisma generate"
  }
}
```

### 4. Verificar Logs do Vercel

1. No painel do Vercel, vá em **Deployments**
2. Clique no deployment que está falhando
3. Veja os **Function Logs** ou **Build Logs**
4. Procure por erros como:
   - "Cannot find module '../dist/index.js'"
   - "Missing required environment variables"
   - "Prisma Client not generated"

### 5. Testar Build Localmente

Execute localmente para ver se há erros:

```bash
cd backend
npm install
npm run build
```

Verifique se o arquivo `dist/index.js` foi criado:
```bash
ls -la dist/index.js
```

Se não existir, o build falhou. Veja os erros e corrija.

### 6. Forçar Novo Deploy

Após corrigir os problemas:

1. **Opção 1**: Fazer commit e push (se usar Git)
2. **Opção 2**: No Vercel Dashboard → **Deployments** → Clique nos 3 pontos → **Redeploy**

## 🐛 Problemas Comuns e Soluções

### ❌ Erro: "Cannot find module '../dist/index.js'"

**Causa**: O build não foi executado ou falhou.

**Solução**:
- Verifique se o Build Command está configurado: `npm run build`
- Verifique se o Root Directory está como `backend`
- Veja os Build Logs no Vercel para erros de compilação

### ❌ Erro: "Missing required environment variables"

**Causa**: Faltam variáveis de ambiente obrigatórias.

**Solução**:
- Configure `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET` no Vercel
- Certifique-se de configurar para todos os ambientes (Production, Preview, Development)

### ❌ Erro: "Prisma Client not generated"

**Causa**: O Prisma Client não foi gerado durante o build.

**Solução**:
- Adicione `prisma generate` no script de build ou postinstall
- Verifique se `@prisma/client` está nas dependencies
- Verifique se `prisma` está nas devDependencies

### ❌ Erro: "Database connection failed"

**Causa**: DATABASE_URL incorreta ou sem connection pooling.

**Solução**:
- Verifique se a connection string está correta
- Adicione parâmetros de pooling: `?connection_limit=20&pool_timeout=10`
- Se usar Neon, use a connection string com pooling
- Se usar Supabase, use a pooler (porta 6543)

## 📝 Checklist Final

Antes de fazer deploy, certifique-se:

- [ ] Root Directory configurado como `backend` no Vercel
- [ ] Build Command configurado: `npm run build`
- [ ] `DATABASE_URL` configurada com pooling
- [ ] `JWT_SECRET` configurado (pelo menos 32 caracteres)
- [ ] `JWT_REFRESH_SECRET` configurado (pelo menos 32 caracteres)
- [ ] `FRONTEND_URL` configurada
- [ ] `NODE_ENV=production` configurado
- [ ] Build local funciona (`npm run build`)
- [ ] Arquivo `dist/index.js` existe após build local
- [ ] Variáveis configuradas para Production, Preview e Development

## 🚀 Após o Deploy

Teste os endpoints:

1. **Health Check**: `https://seu-backend.vercel.app/health`
   - Deve retornar: `{"status":"ok","timestamp":"..."}`

2. **Root**: `https://seu-backend.vercel.app/`
   - Deve retornar informações da API

Se ainda houver erro, verifique os **Function Logs** no Vercel para ver a mensagem de erro completa.

---

**Última atualização**: Janeiro 2025
