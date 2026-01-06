# ⚡ Quick Start - Profissionalização

Guia rápido para começar a usar as melhorias implementadas.

## 🚀 Passos Rápidos

### 1. Instalar Dependências (2 minutos)

```bash
cd backend
npm install
```

### 2. Configurar Variáveis de Ambiente (5 minutos)

```bash
# Gerar secrets
openssl rand -base64 32  # Para JWT_SECRET
openssl rand -base64 32  # Para JWT_REFRESH_SECRET

# Criar .env
cp .env.example .env
# Editar .env e adicionar os valores gerados
```

**Variáveis obrigatórias:**
- `DATABASE_URL` (com `?sslmode=require&connection_limit=20&pool_timeout=20`)
- `JWT_SECRET` (mínimo 32 caracteres)
- `JWT_REFRESH_SECRET` (mínimo 32 caracteres)

**Variáveis opcionais:**
- `REDIS_URL` (recomendado para produção)

### 3. Testar Localmente (1 minuto)

```bash
npm run dev
```

Acesse: `http://localhost:3001/health`

### 4. Executar Testes (1 minuto)

```bash
npm test
```

### 5. Build para Produção (1 minuto)

```bash
npm run build
```

---

## 🐳 Docker (Opcional)

### Executar com Docker Compose

```bash
docker-compose up -d
```

Isso inicia:
- Backend (porta 3001)
- PostgreSQL (porta 5432)
- Redis (porta 6379)

---

## 📋 Checklist Mínimo

- [ ] Dependências instaladas
- [ ] `.env` configurado
- [ ] `JWT_SECRET` e `JWT_REFRESH_SECRET` gerados
- [ ] `DATABASE_URL` com SSL
- [ ] Testes passando
- [ ] Build funcionando

---

## 🔄 Mudanças no Frontend

**IMPORTANTE:** O frontend precisa ser atualizado para usar `accessToken` e `refreshToken` em vez de apenas `token`.

Veja `CHANGELOG_PROFISSIONALIZACAO.md` para detalhes.

---

## 📚 Documentação Completa

Para guia completo, veja: `GUIA_PROFISSIONALIZACAO.md`

---

**Tempo estimado total:** 10-15 minutos
