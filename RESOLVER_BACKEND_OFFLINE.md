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

#### 📍 Como Acessar a Tela de Environment Variables:

1. Acesse [vercel.com](https://vercel.com) e faça login
2. No dashboard, clique no **projeto do backend** (ex: `clinify-backend`)
3. No menu lateral esquerdo, clique em **Settings**
4. Na barra superior de Settings, clique em **Environment Variables**
5. Você verá uma tela com duas abas: **"Create new"** e **"Link Shared Environment Variables"**
6. Certifique-se de estar na aba **"Create new"**

#### 🔧 Como Adicionar Cada Variável:

Para cada variável abaixo, siga estes passos:
1. Clique no botão **"Add Another"** (ou preencha os campos Key e Value)
2. Preencha o campo **Key** com o nome da variável
3. Preencha o campo **Value** com o valor
4. Selecione os **Environments** (Production, Preview, Development) - marque pelo menos **Production**
5. Se a variável contém senha/token sensível, marque o toggle **"Sensitive"**
6. Clique em **Save** (canto inferior direito)

#### 📝 Variáveis Obrigatórias para Adicionar:

```bash
# 1. Banco de Dados (OBRIGATÓRIO)
Key: DATABASE_URL
Value: postgresql://user:password@host:5432/database?sslmode=require
Sensitive: ✅ SIM (marque o toggle)
Environments: Production, Preview, Development

# 2. Autenticação (OBRIGATÓRIO)
Key: JWT_SECRET
Value: <gerar com o comando abaixo>
Sensitive: ✅ SIM (marque o toggle)
Environments: Production, Preview, Development

# Para gerar o JWT_SECRET, execute no terminal:
openssl rand -base64 32

# 3. URL do Frontend (OBRIGATÓRIO)
Key: FRONTEND_URL
Value: https://seu-frontend.vercel.app
Sensitive: ❌ NÃO
Environments: Production, Preview, Development
⚠️ IMPORTANTE: Substitua "seu-frontend.vercel.app" pela URL real do seu frontend!

# 4. Ambiente (OBRIGATÓRIO)
Key: NODE_ENV
Value: production
Sensitive: ❌ NÃO
Environments: Production, Preview, Development
```

#### 🔐 Variáveis Opcionais (Stripe - apenas se usar):

```bash
# Stripe (se usar pagamentos)
Key: STRIPE_SECRET_KEY
Value: sk_live_... ou sk_test_...
Sensitive: ✅ SIM

Key: STRIPE_WEBHOOK_SECRET
Value: whsec_...
Sensitive: ✅ SIM

Key: STRIPE_PRICE_ID_BASIC
Value: price_...
Sensitive: ❌ NÃO

Key: STRIPE_PRICE_ID_PROFESSIONAL
Value: price_...
Sensitive: ❌ NÃO

Key: STRIPE_PRICE_ID_ENTERPRISE
Value: price_...
Sensitive: ❌ NÃO
```

#### ⚠️ Observações Importantes:

- **PORT**: Não precisa configurar no Vercel (o Vercel define automaticamente)
- **Sensitive**: Marque como sensível todas as variáveis que contêm senhas, tokens ou chaves secretas
- **Environments**: Selecione pelo menos **Production** para todas as variáveis obrigatórias
- Após adicionar todas as variáveis, você precisa fazer um **Redeploy** do backend para que as mudanças tenham efeito

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

### Passo 4: Obter URL do Backend

1. No Vercel, acesse o **projeto do backend**
2. Vá em **Deployments** (menu lateral)
3. Você verá uma lista de deploys
4. **Copie a URL** do deploy mais recente (ex: `https://clinify-backend-xxxxx.vercel.app`)
   - A URL aparece ao lado do nome do deploy ou quando você clica nele

### Passo 5: Testar o Health Check do Backend

Antes de configurar o frontend, vamos verificar se o backend está funcionando:

1. Abra uma nova aba no navegador
2. Acesse: `https://sua-url-backend.vercel.app/health`
   - ⚠️ Substitua `sua-url-backend.vercel.app` pela URL real que você copiou
3. Você deve ver uma resposta JSON como:
   ```json
   {
     "status": "ok",
     "timestamp": "2024-..."
   }
   ```
4. Se aparecer erro 404 ou 500, verifique os logs do backend no Vercel

### Passo 6: Configurar VITE_API_URL no Frontend

Agora vamos conectar o frontend ao backend:

1. No Vercel, acesse o **projeto do frontend** (não o backend!)
2. Vá em **Settings** → **Environment Variables**
3. Clique em **"Add Another"** ou preencha os campos:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://sua-url-backend.vercel.app/api`
     - ⚠️ **IMPORTANTE**: Substitua `sua-url-backend.vercel.app` pela URL real do seu backend
     - ⚠️ **IMPORTANTE**: A URL deve terminar com `/api`
   - **Environments**: Marque pelo menos **Production** (e Preview/Development se quiser)
   - **Sensitive**: ❌ NÃO precisa marcar
4. Clique em **Save**

### Passo 7: Fazer Redeploy do Frontend

Após adicionar a variável `VITE_API_URL`, você precisa fazer um novo deploy do frontend:

1. No projeto do **frontend** no Vercel
2. Vá em **Deployments**
3. Encontre o último deploy
4. Clique nos **3 pontos** (⋯) ao lado do deploy
5. Clique em **Redeploy**
6. Aguarde o deploy terminar (pode levar alguns minutos)

### Passo 8: Verificar se Funcionou ✅

Após o redeploy do frontend terminar:

1. **Acesse a URL do frontend** no navegador
2. A mensagem **"Backend Offline"** deve ter desaparecido
3. Você deve conseguir ver a tela de login/cadastro normalmente
4. **Teste fazer login ou cadastro** para confirmar que está tudo funcionando

#### 🔍 Se ainda aparecer "Backend Offline":

1. **Limpe o cache do navegador**: 
   - Chrome/Edge: `Ctrl+Shift+R` (Windows) ou `Cmd+Shift+R` (Mac)
   - Firefox: `Ctrl+F5` (Windows) ou `Cmd+Shift+R` (Mac)
2. **Verifique se a variável `VITE_API_URL` está correta**:
   - Deve terminar com `/api`
   - Deve usar `https://` (não `http://`)
   - Deve ser a URL real do backend
3. **Verifique os logs do frontend** no Vercel para ver se há erros
4. **Aguarde alguns minutos** - às vezes leva um tempo para propagar

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

### Erro: 404 no health check ou "404: NOT_FOUND" no backend

#### 🔍 **Análise do Problema (Root Cause)**

**O que estava acontecendo:**
- O Vercel é uma plataforma **serverless** que não executa servidores HTTP tradicionais
- Seu código estava usando `app.listen(PORT, ...)`, que tenta iniciar um servidor HTTP tradicional
- O Vercel precisa de um **handler serverless** que exporta o app Express, não inicia um servidor

**Por que o erro 404 ocorreu:**
- O Vercel não conseguia encontrar um handler válido para processar as requisições
- O arquivo `dist/index.js` não estava exportando o app corretamente
- A configuração do `vercel.json` não estava apontando para o handler correto

**O que o código deveria fazer:**
- Exportar o app Express como handler serverless: `export default app;`
- Iniciar o servidor apenas em desenvolvimento local (não em produção no Vercel)

#### ✅ **Solução Completa**

**1. Estrutura de Arquivos Necessária:**

O Vercel espera uma estrutura específica. Você precisa ter:

```
backend/
├── api/
│   └── index.js          ← Handler para o Vercel
├── src/
│   └── index.ts          ← Código fonte (deve exportar o app)
├── dist/
│   └── index.js          ← Arquivo compilado (deve ter export default)
├── vercel.json           ← Configuração do Vercel
└── package.json
```

**2. Arquivo `backend/src/index.ts` deve ter:**

```typescript
// ... todo o código do Express ...

// Exportar o app para o Vercel (serverless)
export default app;

// Iniciar servidor apenas em desenvolvimento local
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    logger.info(`🚀 Servidor rodando em http://localhost:${PORT}`);
  });
}
```

**3. Criar arquivo `backend/api/index.js`:**

Este arquivo é necessário para o Vercel encontrar o handler:

```javascript
// Handler para o Vercel - reexporta o app do dist
import app from '../dist/index.js';

export default app;
```

**4. Arquivo `backend/vercel.json` deve estar assim:**

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/index.js"
    }
  ]
}
```

**5. Verificar configurações do projeto no Vercel:**

No painel do Vercel, vá em **Settings** → **General** e verifique:
- **Root Directory**: `backend` (se o projeto está na raiz do repositório)
- **Build Command**: `npm run build`
- **Output Directory**: (deixe vazio ou `dist`)
- **Install Command**: `npm install`

**6. Recompilar e fazer deploy:**

```bash
cd backend
npm run build  # Isso gera o dist/index.js com export default
git add .
git commit -m "fix: configurar backend para Vercel serverless"
git push
```

Ou faça um **Redeploy** manual no Vercel após fazer push.

#### 🎓 **Conceito: Serverless vs Servidor Tradicional**

**Servidor Tradicional (não funciona no Vercel):**
```javascript
app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
```
- Cria um processo que fica "escutando" na porta
- Funciona em servidores dedicados (VPS, servidores físicos)
- Não funciona em ambientes serverless

**Serverless (funciona no Vercel):**
```javascript
export default app;  // Exporta o handler
```
- O Vercel invoca sua função quando há uma requisição
- Não há processo "escutando" continuamente
- Cada requisição pode ser processada em uma instância diferente
- Mais eficiente e escalável

#### ⚠️ **Sinais de Alerta (Warning Signs)**

**O que observar para evitar esse problema:**

1. **Uso de `app.listen()` sem condição:**
   ```typescript
   // ❌ ERRADO - sempre inicia servidor
   app.listen(PORT, () => {...});
   
   // ✅ CORRETO - só inicia em dev local
   if (!process.env.VERCEL) {
     app.listen(PORT, () => {...});
   }
   ```

2. **Falta de `export default app`:**
   - Sempre verifique se o arquivo principal exporta o app
   - O Vercel precisa importar algo para funcionar

3. **`vercel.json` apontando para arquivo errado:**
   - Deve apontar para um arquivo que exporta o handler
   - Geralmente é `api/index.js` ou o arquivo principal compilado

4. **Build não gera o export:**
   - Após compilar, verifique se o arquivo `dist/index.js` tem `export default`
   - Se não tiver, o TypeScript pode não estar configurado corretamente

#### 🔄 **Alternativas e Trade-offs**

**Opção 1: Usar pasta `api/` (Recomendado - implementado)**
- ✅ Funciona bem com o Vercel
- ✅ Estrutura clara e organizada
- ✅ Fácil de manter
- ❌ Requer criar arquivo adicional

**Opção 2: Usar apenas `dist/index.js` diretamente**
- ✅ Mais simples (menos arquivos)
- ❌ Pode ter problemas com detecção automática do Vercel
- ❌ Menos flexível

**Opção 3: Usar outras plataformas (Railway, Render, etc.)**
- ✅ Permite usar `app.listen()` normalmente
- ✅ Mais similar a servidor tradicional
- ❌ Não é serverless (pode ser mais caro)
- ❌ Menos escalável automaticamente

### Erro: 500 INTERNAL_SERVER_ERROR ou FUNCTION_INVOCATION_FAILED

#### 🔍 **Análise do Problema (Root Cause)**

**O que está acontecendo:**
- O handler está sendo encontrado (não é mais 404)
- Mas a função está crashando ao executar
- Código de erro: `FUNCTION_INVOCATION_FAILED`

**Possíveis causas:**
1. **Variáveis de ambiente não configuradas** no Vercel
2. **Erro ao carregar módulos** (imports falhando)
3. **Erro de conexão com banco de dados**
4. **Código chamando `process.exit()`** (não funciona no Vercel)

#### ✅ **Solução Passo a Passo**

**1. Verificar os Logs do Vercel (MAIS IMPORTANTE):**

Os logs vão mostrar exatamente qual é o erro:

1. No Vercel, acesse o **projeto do backend**
2. Vá em **Deployments**
3. Clique no **deploy mais recente** (aquele que está com erro)
4. Clique em **"View Function Logs"** ou **"Logs"**
5. Procure por mensagens de erro em vermelho
6. **Copie a mensagem de erro completa**

**2. Verificar Variáveis de Ambiente:**

Certifique-se de que TODAS estas variáveis estão configuradas no Vercel:

1. No Vercel, vá em **Settings** → **Environment Variables**
2. Verifique se estas variáveis existem:
   - ✅ `DATABASE_URL` (OBRIGATÓRIO)
   - ✅ `JWT_SECRET` (OBRIGATÓRIO)
   - ✅ `FRONTEND_URL` (OBRIGATÓRIO)
   - ✅ `NODE_ENV=production` (OBRIGATÓRIO)

3. **Para cada variável:**
   - Verifique se está marcada para **Production** (e Preview/Development se quiser)
   - Verifique se o **valor está correto** (sem espaços extras, sem quebras de linha)

**3. Erros Comuns e Soluções:**

**Erro: "Missing required environment variables"**
- **Causa**: Variáveis não configuradas no Vercel
- **Solução**: Adicione as variáveis faltantes em Settings → Environment Variables

**Erro: "Cannot find module '/var/task/backend/dist/index.js'" ou "ERR_MODULE_NOT_FOUND"**

#### 🔍 **Análise do Problema (Root Cause)**

**O que estava acontecendo:**
- O `vercel.json` estava apontando diretamente para `dist/index.js`
- Mas o Vercel precisa de um arquivo que **existe antes do build** para configurar o handler
- O `dist/` só é gerado **durante o build**, então o Vercel não consegue encontrar o arquivo na configuração inicial

**Por que o erro ocorreu:**
- O Vercel tenta resolver o caminho `dist/index.js` **antes** de executar o build
- Como o `dist/` não existe ainda (só é criado durante o build), o Vercel retorna 404
- O Vercel precisa de um arquivo "ponte" que existe antes do build e importa do `dist/` após o build

**O que o código deveria fazer:**
- Ter um arquivo `api/index.js` que existe antes do build
- Esse arquivo importa do `dist/index.js` que será gerado durante o build
- O `vercel.json` aponta para `api/index.js` (que existe) ao invés de `dist/index.js` (que não existe ainda)

#### ✅ **Solução Completa**

**1. Estrutura de Arquivos Necessária:**

```
backend/
├── api/
│   └── index.js          ← Handler que existe ANTES do build
├── src/
│   └── index.ts          ← Código fonte (exporta o app)
├── dist/
│   └── index.js          ← Gerado DURANTE o build (não precisa estar no git)
├── vercel.json           ← Aponta para api/index.js
└── package.json
```

**2. Arquivo `backend/api/index.js` (deve existir no repositório):**

```javascript
// Handler para o Vercel - importa o app do dist após o build
// Este arquivo é executado pelo Vercel após o build gerar o dist/
import app from '../dist/index.js';

export default app;
```

**3. Arquivo `backend/vercel.json`:**

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/index.js"
    }
  ]
}
```

**4. Verificar configurações no Vercel:**

No painel do Vercel, vá em **Settings** → **General**:
- **Root Directory**: `backend` (se o projeto está na pasta backend)
- **Build Command**: `npm run build` (gera o `dist/`)
- **Output Directory**: (deixe vazio)
- **Install Command**: `npm install`

**5. Ordem de Execução no Vercel:**

1. Vercel clona o repositório
2. Vercel executa `npm install`
3. Vercel executa `npm run build` (gera o `dist/`)
4. Vercel configura o handler usando `api/index.js`
5. Quando uma requisição chega, o Vercel executa `api/index.js`
6. `api/index.js` importa de `../dist/index.js` (que já foi gerado no passo 3)

#### 🎓 **Conceito: Build Time vs Runtime no Vercel**

**Build Time (durante o deploy):**
- O Vercel precisa saber **quais arquivos** usar como handlers
- Esses arquivos devem **existir no repositório** ou ser gerados durante o build
- O `vercel.json` é lido **antes** do build ser executado

**Runtime (quando uma requisição chega):**
- O código já foi compilado e o `dist/` já existe
- O handler (`api/index.js`) importa do `dist/` que foi gerado no build
- Tudo funciona porque o `dist/` já existe neste momento

**Por que não funciona apontar diretamente para `dist/index.js`:**
- O `vercel.json` é processado **antes** do build
- Neste momento, `dist/index.js` não existe ainda
- O Vercel retorna 404 porque não encontra o arquivo

**Por que funciona usar `api/index.js`:**
- `api/index.js` **existe no repositório** (não precisa ser gerado)
- O Vercel consegue configurar o handler usando este arquivo
- Quando uma requisição chega, o `dist/` já foi gerado no build
- `api/index.js` importa do `dist/` que já existe

#### ⚠️ **Sinais de Alerta**

**O que observar para evitar esse problema:**

1. **`vercel.json` apontando para arquivo que não existe no repo:**
   ```json
   // ❌ ERRADO - dist/ não existe no repositório
   { "src": "dist/index.js" }
   
   // ✅ CORRETO - api/ existe no repositório
   { "src": "api/index.js" }
   ```

2. **Falta do arquivo `api/index.js`:**
   - Sempre crie `api/index.js` que importa do `dist/`
   - Este arquivo deve estar commitado no git

3. **Caminho relativo incorreto:**
   ```javascript
   // Se Root Directory = "backend", use:
   import app from '../dist/index.js';  // ✅ CORRETO
   
   // Não use caminho absoluto ou incorreto:
   import app from '/dist/index.js';    // ❌ ERRADO
   import app from './dist/index.js';   // ❌ ERRADO (se api/ está em backend/)
   ```

4. **Build não está gerando o `dist/`:**
   - Verifique os Build Logs no Vercel
   - Procure por "Compiled successfully" ou erros de TypeScript
   - O `dist/` deve ser gerado durante o build

#### 🔄 **Alternativas e Trade-offs**

**Opção 1: Usar `api/index.js` (Recomendado - implementado)**
- ✅ Funciona com a estrutura esperada pelo Vercel
- ✅ Arquivo existe antes do build
- ✅ Importa do `dist/` após o build
- ✅ Compatível com TypeScript
- ❌ Requer criar arquivo adicional

**Opção 2: Usar detecção automática do Vercel**
- ✅ Mais simples (menos configuração)
- ❌ Pode não funcionar com TypeScript compilado
- ❌ Menos controle sobre a estrutura

**Opção 3: Usar outras plataformas (Railway, Render)**
- ✅ Permite usar `app.listen()` normalmente
- ✅ Não precisa de estrutura `api/`
- ❌ Não é serverless
- ❌ Pode ser mais caro

**Erro: "Connection refused" ou erro de banco de dados**
- **Causa**: `DATABASE_URL` incorreta ou banco não acessível
- **Solução**: 
  1. Verifique se a `DATABASE_URL` está correta
  2. Verifique se o banco permite conexões do Vercel (IP whitelist)
  3. Teste a conexão localmente primeiro

**Erro: "process.exit is not a function" ou similar**
- **Causa**: Código tentando fazer `process.exit()` (já corrigido)
- **Solução**: O código já foi atualizado para não fazer exit no Vercel

**4. Recompilar e Fazer Deploy:**

Após verificar os logs e corrigir os problemas:

```bash
# Recompilar o backend
cd backend
npm run build

# Fazer commit e push
git add .
git commit -m "fix: corrigir tratamento de erros para Vercel"
git push
```

Ou faça um **Redeploy** manual no Vercel.

**5. Testar Novamente:**

Após o deploy:
1. Aguarde o deploy terminar (pode levar 2-5 minutos)
2. Teste: `https://clinify-backend.vercel.app/health`
3. Se ainda der erro, verifique os logs novamente

#### 🎓 **Conceito: Debugging em Serverless**

**Diferença entre desenvolvimento local e produção:**

**Desenvolvimento Local:**
- Você vê os erros diretamente no terminal
- `console.log()` aparece imediatamente
- `process.exit()` funciona normalmente

**Produção (Vercel Serverless):**
- Erros aparecem apenas nos **logs do Vercel**
- `console.log()` vai para os logs (não aparece no navegador)
- `process.exit()` faz a função crashar (não use!)
- Use `throw new Error()` ao invés de `process.exit()`

**Como debugar no Vercel:**
1. **Sempre verifique os logs primeiro** - eles mostram o erro real
2. Use `console.error()` para mensagens importantes
3. Não use `process.exit()` - use `throw new Error()`
4. Teste localmente primeiro quando possível

#### ⚠️ **Sinais de Alerta**

**O que observar:**
- ✅ Sempre verificar logs do Vercel quando há erro 500
- ✅ Verificar se todas as variáveis de ambiente estão configuradas
- ✅ Não usar `process.exit()` em código que roda no Vercel
- ✅ Testar conexão com banco de dados antes de fazer deploy
- ✅ Verificar se o build está gerando os arquivos corretos

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


