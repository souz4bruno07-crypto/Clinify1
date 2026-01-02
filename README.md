# Clinify - Sistema de Gestão para Clínicas

Sistema completo de gestão financeira e operacional para clínicas de estética e saúde.

## 🏗️ Arquitetura

```
clinify/
├── backend/          # API Node.js + Express + Prisma
│   ├── prisma/       # Schema do banco de dados
│   └── src/          # Código fonte da API
└── (frontend)        # React + Vite + TailwindCSS
```

## 🚀 Configuração Rápida

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+ instalado e rodando
- Redis (opcional, mas recomendado para melhor performance)

---

## 📦 1. Configurar o Banco de Dados PostgreSQL

### Opção A: PostgreSQL Local (Mac)

```bash
# Instalar via Homebrew
brew install postgresql@15
brew services start postgresql@15

# Criar banco de dados
createdb clinify
```

### Opção B: PostgreSQL Local (Windows)

1. Baixe e instale: https://www.postgresql.org/download/windows/
2. Durante instalação, anote a senha do usuário `postgres`
3. Abra o pgAdmin e crie um database chamado `clinify`

### Opção C: PostgreSQL Local (Linux)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Criar banco
sudo -u postgres createdb clinify
```

### Opção D: Docker

```bash
docker run --name clinify-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=clinify \
  -p 5432:5432 \
  -d postgres:15
```

---

## 🔧 2. Configurar o Backend

```bash
# Entrar na pasta do backend
cd backend

# Instalar dependências
npm install

# Criar arquivo de configuração
# Crie um arquivo .env na pasta backend com:
```

**backend/.env**
```env
# OBRIGATÓRIO: Banco de Dados PostgreSQL
DATABASE_URL="postgresql://postgres:sua_senha@localhost:5432/clinify"

# OBRIGATÓRIO: Chave secreta para JWT (gere uma chave forte!)
# Use: openssl rand -base64 32
JWT_SECRET="sua-chave-secreta-forte-aqui"

# OPCIONAL: URL do Frontend (para CORS)
FRONTEND_URL="http://localhost:5173"

# OPCIONAL: Porta do servidor
PORT=3001

# OPCIONAL: Redis (melhora performance, mas não é obrigatório)
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""

# OPCIONAL: Ambiente
NODE_ENV="development"
```

> 💡 **Dica**: Copie o arquivo `backend/.env.example` para `backend/.env` e preencha com seus valores.

```bash
# Gerar cliente Prisma
npm run db:generate

# Criar tabelas no banco (migration)
npm run db:migrate

# (Opcional) Criar dados de exemplo
npm run db:seed

# Iniciar o servidor
npm run dev
```

O servidor estará rodando em: http://localhost:3001

---

## 🎨 3. Configurar o Frontend

```bash
# Na pasta raiz do projeto
npm install

# Criar arquivo .env (opcional - usa localhost:3001 por padrão)
# Crie um arquivo .env na raiz:
```

**.env** (na raiz)
```env
# OPCIONAL: URL da API Backend
VITE_API_URL="http://localhost:3001/api"

# OPCIONAL: API Key do Google Gemini (para recursos de IA)
VITE_GEMINI_API_KEY="sua-api-key-gemini"
```

> 💡 **Dica**: Copie o arquivo `.env.example` para `.env` e preencha com seus valores.

```bash
# Iniciar o frontend
npm run dev
```

Acesse: http://localhost:5173

---

## 📋 Comandos Úteis

### Backend
```bash
cd backend
npm run dev          # Desenvolvimento com hot-reload
npm run build        # Build para produção
npm run start        # Iniciar servidor em produção
npm run db:migrate   # Rodar migrations
npm run db:studio    # Interface visual do banco (Prisma Studio)
npm run db:seed      # Criar categorias padrão
```

### Frontend
```bash
# Na raiz do projeto
npm run dev          # Desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build
```

### Build Completo (Backend + Frontend)
```bash
# Na raiz do projeto
npm run build:all    # Build completo de ambos os projetos
npm run build:backend   # Build apenas do backend
npm run build:frontend  # Build apenas do frontend
```

---

## 🔴 4. Configurar Redis (Opcional)

Redis é **opcional** mas **recomendado** para melhor performance. A aplicação funciona sem ele, mas com cache você terá respostas mais rápidas.

### Opção A: Redis Local

```bash
# Mac (Homebrew)
brew install redis
brew services start redis

# Linux
sudo apt install redis-server
sudo systemctl start redis

# Windows
# Baixe e instale: https://github.com/microsoftarchive/redis/releases
```

### Opção B: Docker

```bash
docker run --name clinify-redis \
  -p 6379:6379 \
  -d redis:7-alpine
```

### Configuração

O Redis é configurado automaticamente via variáveis de ambiente no `backend/.env`:
- `REDIS_HOST` (padrão: localhost)
- `REDIS_PORT` (padrão: 6379)
- `REDIS_PASSWORD` (opcional)

Se o Redis não estiver disponível, a aplicação continuará funcionando normalmente, apenas sem cache.

---

## 🗃️ Estrutura do Banco de Dados

| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários e autenticação |
| `transactions` | Receitas e despesas |
| `categories` | Categorias de transações |
| `patients` | Pacientes da clínica |
| `staff` | Equipe/profissionais |
| `appointments` | Agendamentos |
| `quotes` | Orçamentos |
| `monthly_targets` | Metas mensais |
| `chat_threads` | Conversas CRM |
| `chat_messages` | Mensagens |

---

## 🔌 Endpoints da API

### Autenticação
- `POST /api/auth/signup` - Criar conta
- `POST /api/auth/signin` - Login
- `GET /api/auth/me` - Dados do usuário atual

### Transações
- `GET /api/transactions` - Listar transações
- `POST /api/transactions` - Criar transação
- `PUT /api/transactions/:id` - Atualizar
- `DELETE /api/transactions/:id` - Deletar

### Pacientes
- `GET /api/patients` - Listar pacientes
- `POST /api/patients` - Criar paciente
- `PUT /api/patients/:id` - Atualizar
- `DELETE /api/patients/:id` - Deletar

*(E mais endpoints para staff, appointments, quotes, targets, chat)*

---

## 🚢 Deploy para Produção

### Variáveis de Ambiente Obrigatórias

#### Backend
- `DATABASE_URL` - URL completa do PostgreSQL de produção
- `JWT_SECRET` - Chave secreta forte (mínimo 32 caracteres)
- `FRONTEND_URL` - URL do frontend em produção (para CORS)

#### Backend (Opcional)
- `PORT` - Porta do servidor (padrão: 3001)
- `NODE_ENV` - Ambiente (production)
- `REDIS_HOST` - Host do Redis (se usar cache)
- `REDIS_PORT` - Porta do Redis
- `REDIS_PASSWORD` - Senha do Redis (se necessário)

#### Frontend
- `VITE_API_URL` - URL completa da API backend
- `VITE_GEMINI_API_KEY` - API Key do Gemini (opcional, para IA)

### Deploy do Backend (Railway, Render, Fly.io)

1. Configure todas as variáveis de ambiente obrigatórias no painel do serviço
2. Build e start:
```bash
cd backend
npm install
npm run build
npm start
```

3. Verifique se o servidor está rodando:
   - Health check: `https://seu-backend.com/health`
   - Documentação: `https://seu-backend.com/api/docs`

### Deploy do Frontend (Vercel, Netlify)

1. Configure a variável de ambiente `VITE_API_URL` apontando para a URL do backend
2. Deploy normalmente:
```bash
npm install
npm run build
```

3. O build será gerado na pasta `dist/`

### Troubleshooting

#### Backend não inicia
- Verifique se `DATABASE_URL` e `JWT_SECRET` estão configurados
- O servidor valida variáveis obrigatórias no startup e exibirá erros claros
- Verifique os logs para mensagens de erro específicas

#### Erro de CORS
- Certifique-se de que `FRONTEND_URL` no backend corresponde à URL do frontend
- Verifique se não há barra (`/`) no final da URL

#### Redis não conecta
- A aplicação funciona sem Redis, mas com menor performance
- Verifique se `REDIS_HOST` e `REDIS_PORT` estão corretos
- Logs mostrarão avisos se Redis não estiver disponível, mas a aplicação continuará funcionando

---

## 📱 Funcionalidades

- ✅ Dashboard financeiro completo
- ✅ Gestão de pacientes
- ✅ Agendamento de consultas
- ✅ Controle de receitas e despesas
- ✅ Relatórios e DRE
- ✅ CRM com chat
- ✅ Metas mensais
- ✅ IA para análise financeira (opcional)
- ✅ Prontuário Eletrônico do Paciente (PEP)
- ✅ Prescrições digitais
- ✅ Controle de estoque
- ✅ Programa de fidelidade
- ✅ Comissões e metas de profissionais

---

## 🔒 Segurança

- ✅ Validação de variáveis de ambiente no startup
- ✅ JWT com chave secreta obrigatória
- ✅ Rate limiting em todas as rotas
- ✅ CORS configurado
- ✅ Validação de dados com Zod
- ✅ Logging estruturado (apenas em desenvolvimento)

### Verificação de Vulnerabilidades

Antes de fazer deploy, execute `npm audit` para verificar vulnerabilidades:

```bash
# Frontend
npm audit

# Backend
cd backend
npm audit
```

Se houver vulnerabilidades, execute `npm audit fix` para tentar corrigir automaticamente.

---

## 📚 Documentação da API

A API possui documentação Swagger completa disponível em:
- **Desenvolvimento**: http://localhost:3001/api/docs
- **Produção**: https://seu-backend.com/api/docs

Todos os endpoints estão documentados com exemplos de requisição e resposta.

---

**Desenvolvido com ❤️ para clínicas de estética**
