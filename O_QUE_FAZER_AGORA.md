# ✅ O QUE FAZER AGORA - Passo a Passo

## 🎯 Você está aqui: Precisa conectar o banco PostgreSQL remoto

---

## 📋 CHECKLIST - Siga nesta ordem:

### ✅ Passo 1: Criar o Banco de Dados no Neon

1. **Acesse:** https://neon.tech
2. **Crie uma conta** (pode usar GitHub ou email)
3. **Clique em "Create Project"** (ou "New Project")
4. **Preencha:**
   - **Name:** `clinify` (ou qualquer nome)
   - **Region:** Escolha **"South America"** (Brasil)
   - **PostgreSQL version:** Deixe o padrão (15 ou 16)
5. **Clique em "Create Project"**
6. **Aguarde alguns segundos** - o banco será criado
7. **COPIE A URL** que aparece na tela (algo como: `postgresql://usuario:senha@ep-xxxxx.region.aws.neon.tech/neondb`)

**💡 Dica:** A URL geralmente aparece na seção "Connection Details" ou "Connection string"

---

### ✅ Passo 2: Gerar a Chave JWT_SECRET

Abra o terminal e execute:

```bash
openssl rand -base64 32
```

**Copie o resultado** (será algo como: `aBc123XyZ456...`)

---

### ✅ Passo 3: Configurar o Arquivo .env

1. **Abra o arquivo `.env`** que está na pasta `backend/`
2. **Localize a linha `DATABASE_URL`** e substitua pela URL que você copiou do Neon
3. **Adicione `&sslmode=require`** no final da URL

**Exemplo:**
```env
DATABASE_URL="postgresql://usuario:senha@ep-xxxxx.region.aws.neon.tech/neondb?connection_limit=20&pool_timeout=10&sslmode=require"
```

4. **Localize a linha `JWT_SECRET`** e substitua pela chave que você gerou

**Exemplo:**
```env
JWT_SECRET="aBc123XyZ456DeF789GhI012JkL345MnO678PqR901StU234VwX567YzA890"
```

5. **Salve o arquivo**

---

### ✅ Passo 4: Testar a Conexão

Abra o terminal na pasta `backend` e execute:

```bash
cd backend
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

**O que esperar:**
- Se tudo estiver correto, você verá:
  ```
  🚀 Servidor rodando em http://localhost:3001
  📊 Health check: http://localhost:3001/health
  📚 Documentação Swagger: http://localhost:3001/api/docs
  ```

- Se der erro, veja a seção "Problemas Comuns" abaixo

---

### ✅ Passo 5: Verificar se Funcionou

1. **Abra no navegador:** http://localhost:3001/health
   - Deve aparecer: `{"status":"ok","timestamp":"..."}`

2. **Abra no navegador:** http://localhost:3001/api/docs
   - Deve aparecer a documentação Swagger

3. **Se ambos funcionarem:** ✅ **SUCESSO!** Seu banco está conectado!

---

## 🆘 Problemas Comuns

### ❌ Erro: "Can't reach database server"

**Causa:** URL incorreta ou falta SSL

**Solução:**
- Verifique se copiou a URL completa do Neon
- Certifique-se de que tem `&sslmode=require` no final
- Exemplo correto:
  ```
  postgresql://usuario:senha@ep-xxxxx.region.aws.neon.tech/neondb?connection_limit=20&pool_timeout=10&sslmode=require
  ```

---

### ❌ Erro: "password authentication failed"

**Causa:** Senha incorreta na URL

**Solução:**
- Volte no Neon e copie a URL novamente
- Certifique-se de que não há espaços extras
- A senha pode ter caracteres especiais - não modifique a URL

---

### ❌ Erro: "JWT_SECRET não pode usar o valor padrão"

**Causa:** Você não gerou uma chave secreta nova

**Solução:**
```bash
openssl rand -base64 32
```
Copie o resultado e cole no `.env` na linha `JWT_SECRET`

---

### ❌ Erro: "relation does not exist"

**Causa:** As migrações não foram executadas

**Solução:**
```bash
cd backend
npm run db:migrate
```

---

## 📝 Resumo Rápido

1. ✅ Criar banco no Neon → Copiar URL
2. ✅ Gerar JWT_SECRET → `openssl rand -base64 32`
3. ✅ Atualizar `.env` → Colar URL e JWT_SECRET
4. ✅ Testar → `npm run db:migrate` e `npm run dev`
5. ✅ Verificar → http://localhost:3001/health

---

## 🎉 Próximos Passos (Depois que funcionar)

- [ ] Testar o frontend conectado ao backend
- [ ] Fazer login no sistema
- [ ] Verificar se os dados estão sendo salvos no banco
- [ ] Configurar backups do banco (no Neon)

---

## 💬 Precisa de Ajuda?

Se tiver qualquer dúvida ou erro, me avise:
- Qual erro apareceu?
- Em qual passo você está?
- O que você já fez?

Vou te ajudar a resolver! 🚀


