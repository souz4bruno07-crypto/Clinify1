# 🗄️ Guia Completo: Conectando o Clinify ao PostgreSQL Remoto

## 📋 O que você precisa fazer

Este guia vai te ajudar a conectar seu sistema ao PostgreSQL e tirá-lo do localhost. É mais simples do que parece!

---

## 🎯 Passo 1: Escolher um Serviço de Banco de Dados PostgreSQL

Você precisa de um banco PostgreSQL na nuvem. Aqui estão as melhores opções (todas têm planos gratuitos):

### ⭐ Opção 1: **Neon** (RECOMENDADO - Melhor para iniciantes)
- 🌐 Site: https://neon.tech
- ✅ **Interface super simples** - muito fácil de usar
- ✅ **Plano gratuito generoso** - 512 MB de armazenamento
- ✅ **Não expira** - funciona para sempre no plano gratuito
- ✅ **Muito rápido** - servidores modernos
- ✅ **Focado em PostgreSQL** - especializado nisso

### Opção 2: **Railway**
- 🌐 Site: https://railway.app
- ✅ Plano gratuito com $5 de créditos mensais
- ✅ Muito simples de usar
- ✅ Pode hospedar backend também

### Opção 3: **Render**
- 🌐 Site: https://render.com
- ✅ Plano gratuito disponível
- ⚠️ **ATENÇÃO:** Desliga após 90 dias sem uso
- ✅ Fácil de configurar

### Opção 4: **ElephantSQL**
- 🌐 Site: https://www.elephantsql.com
- ✅ Plano gratuito pequeno mas funcional (20 MB)
- ✅ Muito simples
- ⚠️ **Limite:** 20 MB pode ser pouco

**💡 Recomendação:** Comece com **Neon** - é o mais fácil, não expira e tem bastante espaço grátis!

---

## 📝 Passo 2: Criar o Banco de Dados

### Se escolheu Neon (RECOMENDADO):

1. Acesse https://neon.tech e crie uma conta (pode usar GitHub ou email)
2. Clique em "Create Project" (ou "New Project")
3. Preencha:
   - **Name:** Clinify (ou qualquer nome)
   - **Region:** Escolha "South America" (Brasil)
   - **PostgreSQL version:** Deixe o padrão (15 ou 16)
4. Clique em "Create Project"
5. **Pronto!** A URL de conexão aparece na tela imediatamente
6. Copie a URL que aparece (algo como: `postgresql://usuario:senha@ep-xxxxx.region.aws.neon.tech/neondb`)

### Se escolheu Railway:

1. Acesse https://railway.app e crie uma conta (pode usar GitHub)
2. Clique em "New Project"
3. Clique em "Database" → "PostgreSQL"
4. Aguarde alguns segundos
5. A URL de conexão aparece automaticamente na aba "Variables"

### Se escolheu Render:

1. Acesse https://render.com e crie uma conta
2. Clique em "New +" → "PostgreSQL"
3. Preencha:
   - **Name:** clinify-db
   - **Database:** clinify
   - **User:** (deixe o padrão ou escolha um nome)
   - **Region:** Escolha a mais próxima
   - **PostgreSQL Version:** 15 ou 16
   - **Plan:** Free (para começar)
4. Clique em "Create Database"
5. Aguarde alguns minutos

---

## 🔑 Passo 3: Obter a URL de Conexão

### No Neon:

A URL já aparece na tela quando você cria o projeto! Ela está na seção "Connection Details".

Se não viu, clique no seu projeto e procure por "Connection string" ou "Connection Details".

A URL geralmente vem assim:
```
postgresql://usuario:senha@ep-xxxxx.region.aws.neon.tech/neondb
```

**Importante:** Adicione `?sslmode=require` no final para conexão segura.

### No Railway:

1. No dashboard, clique no seu banco de dados
2. Vá na aba "Variables" ou "Data"
3. Procure por "DATABASE_URL" ou "POSTGRES_URL"
4. Copie essa URL

### No Render:

1. No dashboard, clique no seu banco de dados
2. Na seção **Connections**, você verá a **Internal Database URL**
3. Copie essa URL

**⚠️ IMPORTANTE:** A URL geralmente vem assim:
```
postgresql://usuario:senha@host:porta/banco
```

Você pode precisar adicionar parâmetros no final:
```
?connection_limit=20&pool_timeout=10&sslmode=require
```

---

## ⚙️ Passo 4: Configurar o Arquivo .env

1. Na pasta do projeto, vá até a pasta `backend`:
   ```bash
   cd backend
   ```

2. Crie um arquivo chamado `.env` (sem extensão, só `.env`)

3. Abra o arquivo `.env.example` que já existe e copie o conteúdo

4. Cole no arquivo `.env` e preencha com suas informações:

```env
# Cole a URL do banco que você copiou, adicionando os parâmetros:
DATABASE_URL="postgresql://usuario:senha@seu-host.com:5432/clinify?connection_limit=20&pool_timeout=10&sslmode=require"

# Gere uma chave secreta JWT (execute no terminal):
# openssl rand -base64 32
# Cole o resultado aqui:
JWT_SECRET="cole-aqui-a-chave-gerada"

# URL do frontend
FRONTEND_URL="http://localhost:5173"

# Porta do backend
PORT=3001

# Ambiente
NODE_ENV="development"
```

### 🔐 Como gerar o JWT_SECRET:

Abra o terminal e execute:
```bash
openssl rand -base64 32
```

Copie o resultado e cole no lugar de `JWT_SECRET` no arquivo `.env`.

---

## 🚀 Passo 5: Testar a Conexão

1. Certifique-se de estar na pasta `backend`:
   ```bash
   cd backend
   ```

2. Instale as dependências (se ainda não fez):
   ```bash
   npm install
   ```

3. Gere o cliente Prisma:
   ```bash
   npm run db:generate
   ```

4. Execute as migrações (cria as tabelas no banco):
   ```bash
   npm run db:migrate
   ```

5. Inicie o servidor:
   ```bash
   npm run dev
   ```

Se tudo estiver correto, você verá mensagens como:
```
🚀 Servidor rodando em http://localhost:3001
📊 Health check: http://localhost:3001/health
```

---

## ✅ Checklist de Verificação

Antes de considerar tudo pronto, verifique:

- [ ] Banco PostgreSQL criado no serviço escolhido
- [ ] URL de conexão copiada
- [ ] Arquivo `.env` criado na pasta `backend/`
- [ ] `DATABASE_URL` configurada no `.env`
- [ ] `JWT_SECRET` gerado e configurado (mínimo 32 caracteres)
- [ ] `npm run db:generate` executado com sucesso
- [ ] `npm run db:migrate` executado com sucesso
- [ ] Servidor iniciado sem erros (`npm run dev`)
- [ ] Health check funcionando: http://localhost:3001/health
- [ ] Documentação Swagger acessível: http://localhost:3001/api/docs

---

## 🆘 Problemas Comuns e Soluções

### Erro: "Can't reach database server"

**Causa:** A URL está incorreta ou o banco não está acessível.

**Solução:**
- Verifique se copiou a URL completa
- Se estiver usando Supabase, use a URL com `pooler` (porta 6543) ou a direta (porta 5432)
- Adicione `?sslmode=require` no final da URL se necessário

### Erro: "password authentication failed"

**Causa:** Senha incorreta.

**Solução:**
- Verifique a senha no serviço (Supabase, Render, etc)
- Certifique-se de que não há espaços extras na URL
- A senha pode ter caracteres especiais - verifique se está escapada corretamente

### Erro: "database does not exist"

**Causa:** O nome do banco está errado.

**Solução:**
- No Supabase, o banco geralmente se chama `postgres`
- No Render, você escolheu o nome ao criar
- Verifique a URL e o nome do banco

### Erro: "relation does not exist"

**Causa:** As migrações não foram executadas.

**Solução:**
```bash
cd backend
npm run db:migrate
```

---

## 📚 Próximos Passos

Depois que tudo estiver funcionando:

1. **Teste o sistema:** Acesse o frontend e faça login
2. **Verifique os dados:** Use `npm run db:studio` para ver o banco visualmente
3. **Backup:** Configure backups automáticos no serviço escolhido
4. **Deploy:** Quando estiver pronto, faça o deploy do backend também

---

## 💡 Dicas Importantes

1. **Nunca compartilhe seu arquivo `.env`** - ele contém senhas!
2. **Mantenha backups** do banco de dados
3. **Use senhas fortes** para o banco e JWT_SECRET
4. **Monitore o uso** do plano gratuito para não exceder limites

---

## 🎉 Pronto!

Se você seguiu todos os passos e o servidor está rodando sem erros, seu sistema está conectado ao PostgreSQL remoto! 🚀

Se tiver dúvidas, verifique os logs do servidor ou consulte a documentação do serviço escolhido.

