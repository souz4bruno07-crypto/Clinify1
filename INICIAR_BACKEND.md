# 🚀 Como Iniciar o Backend Corretamente

## ❌ Problema: "Backend Offline"

O frontend não está conseguindo conectar ao backend. Isso significa que o backend não está rodando ou não está acessível.

---

## ✅ Solução: Iniciar o Backend

### Passo 1: Abrir um Terminal

Abra um **novo terminal** (ou use o terminal que você já tem aberto).

### Passo 2: Ir para a Pasta Backend

```bash
cd backend
```

### Passo 3: Exportar as Variáveis de Ambiente

**IMPORTANTE:** Você precisa exportar as variáveis toda vez que abrir um novo terminal:

```bash
export DATABASE_URL="postgresql://neondb_owner:npg_vqTjo86OfzmU@ep-steep-bar-accrl4m1-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connection_limit=20&pool_timeout=10"

export JWT_SECRET="/OP+ejdvy6G7ch752aHkFYFjEAneDBSpqLHsVipH5JI="

export FRONTEND_URL="http://localhost:5173"

export PORT=3001

export NODE_ENV="development"
```

### Passo 4: Iniciar o Backend

```bash
npm run dev
```

### Passo 5: Verificar se Funcionou

Você deve ver estas mensagens:

```
🚀 Servidor rodando em http://localhost:3001
📊 Health check: http://localhost:3001/health
📚 Documentação Swagger: http://localhost:3001/api/docs
```

**Se aparecer essas mensagens, o backend está funcionando!** ✅

---

## 🧪 Testar se o Backend Está Funcionando

### Opção 1: No Navegador

Abra: http://localhost:3001/health

Deve aparecer: `{"status":"ok","timestamp":"..."}`

### Opção 2: No Terminal

```bash
curl http://localhost:3001/health
```

Deve retornar: `{"status":"ok","timestamp":"..."}`

---

## 🔄 Depois que o Backend Iniciar

1. **Volte para o frontend** no navegador
2. **Clique em "Tentar Novamente"** (botão verde)
3. **O frontend deve conectar** e você verá a tela de login

---

## ⚠️ Problemas Comuns

### Problema 1: "Port 3001 already in use"

**Solução:** Alguém já está usando a porta 3001.

1. **Encontre o processo:**
   ```bash
   lsof -ti:3001
   ```

2. **Mate o processo:**
   ```bash
   kill -9 $(lsof -ti:3001)
   ```

3. **Tente iniciar novamente:**
   ```bash
   npm run dev
   ```

---

### Problema 2: "Variáveis de ambiente não encontradas"

**Solução:** Você esqueceu de exportar as variáveis.

Execute os comandos `export` novamente (veja Passo 3 acima).

---

### Problema 3: "Cannot connect to database"

**Solução:** A URL do banco pode estar errada ou o banco pode estar offline.

1. **Verifique se a URL do Neon está correta**
2. **Acesse o Neon Console** e verifique se o banco está ativo
3. **Copie a URL novamente** do Neon e atualize o `export DATABASE_URL`

---

## 💡 Dica: Criar um Script para Facilitar

Para não precisar exportar as variáveis toda vez, crie um arquivo `start-backend.sh`:

```bash
#!/bin/bash
cd backend
export DATABASE_URL="postgresql://neondb_owner:npg_vqTjo86OfzmU@ep-steep-bar-accrl4m1-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connection_limit=20&pool_timeout=10"
export JWT_SECRET="/OP+ejdvy6G7ch752aHkFYFjEAneDBSpqLHsVipH5JI="
export FRONTEND_URL="http://localhost:5173"
export PORT=3001
export NODE_ENV="development"
npm run dev
```

Depois execute:
```bash
chmod +x start-backend.sh
./start-backend.sh
```

---

## 📋 Checklist Rápido:

- [ ] Terminal aberto
- [ ] Na pasta `backend/` (`cd backend`)
- [ ] Variáveis exportadas (os 5 comandos `export`)
- [ ] Backend iniciado (`npm run dev`)
- [ ] Mensagem "Servidor rodando" apareceu
- [ ] Testou http://localhost:3001/health
- [ ] Frontend consegue conectar

---

## 🆘 Ainda Não Funciona?

Me diga:
1. **O que aparece quando você executa `npm run dev`?**
2. **Aparece alguma mensagem de erro?**
3. **O backend inicia mas o frontend não conecta?**

Com essas informações consigo te ajudar melhor! 🚀




