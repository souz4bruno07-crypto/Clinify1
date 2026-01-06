# 🚀 Guia Completo de Profissionalização do Clinify

Este guia contém todas as instruções passo a passo para deixar o Clinify pronto para produção em nível empresarial.

## 📋 Índice

1. [O que foi implementado](#o-que-foi-implementado)
2. [Configuração Inicial](#configuração-inicial)
3. [Onde Hospedar o Código](#onde-hospedar-o-código)
4. [Configuração de Variáveis de Ambiente](#configuração-de-variáveis-de-ambiente)
5. [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
6. [Configuração do Redis](#configuração-do-redis)
7. [Instalação de Dependências](#instalação-de-dependências)
8. [Testes](#testes)
9. [Docker](#docker)
10. [CI/CD](#cicd)
11. [Deploy](#deploy)
12. [Checklist Final](#checklist-final)

---

## ✅ O que foi implementado

### Segurança
- ✅ Headers de segurança com Helmet
- ✅ Validação de entrada com Zod em todas as rotas
- ✅ Sanitização de inputs (prevenção XSS)
- ✅ Sistema de refresh tokens
- ✅ Blacklist de tokens (com Redis)
- ✅ Error handling centralizado
- ✅ Logging estruturado com Winston
- ✅ Rate limiting (já existia, mantido)

### Estrutura de Código
- ✅ Padrão Repository para acesso a dados
- ✅ Controllers separados da lógica de negócio
- ✅ Validators centralizados com Zod
- ✅ Tipos TypeScript compartilhados
- ✅ Classes de erro customizadas

### Infraestrutura
- ✅ Dockerfile otimizado
- ✅ docker-compose.yml completo
- ✅ CI/CD com GitLab CI
- ✅ Configuração de testes com Vitest
- ✅ Configuração de banco com SSL e pooling

---

## 🔧 Configuração Inicial

### 1. Instalar Dependências

```bash
cd backend
npm install
```

Isso instalará todas as novas dependências:
- `helmet` - Headers de segurança
- `winston` - Logging estruturado
- `isomorphic-dompurify` - Sanitização
- `vitest` - Testes
- `@vitest/coverage-v8` - Cobertura de testes

---

## 📦 Onde Hospedar o Código

### Opção 1: GitLab (Recomendado)

1. Acesse [gitlab.com](https://gitlab.com) e crie uma conta
2. Crie um novo projeto (New Project → Create blank project)
3. Escolha um nome profissional (ex: `clinify-backend`)
4. Configure como **privado**
5. Adicione o remote:

```bash
git remote add gitlab https://gitlab.com/seu-usuario/clinify-backend.git
git push -u gitlab main
```

**Vantagens:**
- CI/CD integrado (já configurado)
- Container Registry gratuito
- Repositórios privados ilimitados
- Issue tracking profissional

### Opção 2: Bitbucket

1. Acesse [bitbucket.org](https://bitbucket.org)
2. Crie um novo repositório
3. Configure como privado
4. Adicione o remote:

```bash
git remote add bitbucket https://bitbucket.org/seu-usuario/clinify-backend.git
git push -u bitbucket main
```

### Opção 3: Azure DevOps

1. Acesse [dev.azure.com](https://dev.azure.com)
2. Crie uma organização
3. Crie um novo projeto
4. Configure o repositório Git

---

## 🔐 Configuração de Variáveis de Ambiente

### 1. Gerar Secrets Seguros

```bash
# JWT Secret (mínimo 32 caracteres)
openssl rand -base64 32

# JWT Refresh Secret
openssl rand -base64 32
```

### 2. Criar arquivo `.env` no backend

Copie o arquivo `.env.example` e preencha:

```bash
cd backend
cp .env.example .env
```

### 3. Configurar Variáveis Obrigatórias

```env
# Banco de Dados (veja seção abaixo)
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require&connection_limit=20&pool_timeout=20

# JWT Secrets (cole os valores gerados acima)
JWT_SECRET=cole-aqui-o-primeiro-valor-gerado
JWT_REFRESH_SECRET=cole-aqui-o-segundo-valor-gerado

# Frontend URL
FRONTEND_URL=https://seu-dominio.com

# Porta
PORT=3001

# Ambiente
NODE_ENV=production

# Redis (veja seção abaixo)
REDIS_URL=redis://:senha@host:6379
```

### 4. Variáveis Opcionais (Pagamentos)

Se usar Stripe ou Mercado Pago, adicione:

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_BASIC=price_...
STRIPE_PRICE_ID_PROFESSIONAL=price_...
STRIPE_PRICE_ID_ENTERPRISE=price_...

MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
MERCADOPAGO_WEBHOOK_SECRET=...
```

---

## 🗄️ Configuração do Banco de Dados

### Opção 1: Neon (Recomendado - PostgreSQL gerenciado)

1. Acesse [neon.tech](https://neon.tech)
2. Crie uma conta gratuita
3. Crie um novo projeto
4. Copie a connection string
5. Adicione os parâmetros de SSL e pooling:

```
postgresql://user:password@host/database?sslmode=require&connection_limit=20&pool_timeout=20
```

**Configurações importantes:**
- ✅ SSL obrigatório (`sslmode=require`)
- ✅ Connection pooling (`connection_limit=20`)
- ✅ Timeout (`pool_timeout=20`)

### Opção 2: Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um projeto
3. Vá em Settings → Database
4. Copie a connection string
5. Adicione os parâmetros acima

### Opção 3: AWS RDS / Google Cloud SQL

Para produção empresarial, considere:
- **AWS RDS PostgreSQL**
- **Google Cloud SQL**
- **Azure Database for PostgreSQL**

### Executar Migrations

```bash
cd backend
npm run db:migrate
```

---

## 🔴 Configuração do Redis

Redis é **opcional mas altamente recomendado** para:
- Blacklist de tokens
- Cache
- Rate limiting distribuído

### Opção 1: Redis Cloud (Gratuito)

1. Acesse [redis.com/cloud](https://redis.com/cloud)
2. Crie uma conta gratuita (30MB grátis)
3. Crie um banco
4. Copie a connection string

### Opção 2: Upstash (Recomendado)

1. Acesse [upstash.com](https://upstash.com)
2. Crie uma conta
3. Crie um banco Redis
4. Copie a URL de conexão

### Opção 3: Docker Local (Desenvolvimento)

```bash
docker run -d -p 6379:6379 redis:7-alpine
```

### Configurar no .env

```env
REDIS_URL=redis://:senha@host:6379
```

Ou use variáveis separadas:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=sua-senha
```

**Nota:** Se Redis não estiver disponível, o sistema funcionará normalmente, mas a blacklist de tokens estará desabilitada.

---

## 🧪 Testes

### Executar Testes

```bash
cd backend
npm test
```

### Testes com Cobertura

```bash
npm run test:coverage
```

### Testes em Watch Mode

```bash
npm run test:watch
```

**Meta de Cobertura:** Mínimo 70%, ideal 80%+

---

## 🐳 Docker

### Build da Imagem

```bash
cd backend
docker build -t clinify-backend:latest .
```

### Executar com Docker Compose

```bash
cd backend
docker-compose up -d
```

Isso iniciará:
- Backend na porta 3001
- PostgreSQL na porta 5432
- Redis na porta 6379

### Verificar Logs

```bash
docker-compose logs -f backend
```

### Parar Serviços

```bash
docker-compose down
```

### Parar e Remover Volumes

```bash
docker-compose down -v
```

---

## 🔄 CI/CD

### GitLab CI

O arquivo `.gitlab-ci.yml` já está configurado. Para ativar:

1. **No GitLab:**
   - Vá em Settings → CI/CD → Variables
   - Adicione as variáveis de ambiente necessárias:
     - `DATABASE_URL`
     - `JWT_SECRET`
     - `JWT_REFRESH_SECRET`
     - `REDIS_URL`
     - Etc.

2. **Container Registry:**
   - O GitLab tem registry integrado
   - As imagens serão buildadas automaticamente
   - Acesse: `Settings → CI/CD → Container Registry`

3. **Runners:**
   - GitLab fornece runners compartilhados gratuitos
   - Para produção, configure runners dedicados

### Pipeline Stages

1. **test** - Executa testes e gera cobertura
2. **build** - Compila o código
3. **deploy** - Deploy manual para staging/produção

---

## 🚀 Deploy

### Opção 1: Vercel (Atual)

Se já está usando Vercel:

1. Vá em **Settings → Environment Variables**
2. Adicione todas as variáveis do `.env`
3. **IMPORTANTE:** Adicione `JWT_REFRESH_SECRET`
4. Faça push para o branch `main`

### Opção 2: Railway

1. Acesse [railway.app](https://railway.app)
2. Conecte seu repositório GitLab
3. Configure as variáveis de ambiente
4. Railway detecta automaticamente o Dockerfile

### Opção 3: AWS / Google Cloud / Azure

Para produção empresarial:

**AWS:**
- ECS (Elastic Container Service)
- EKS (Kubernetes)
- Elastic Beanstalk

**Google Cloud:**
- Cloud Run
- GKE (Kubernetes)

**Azure:**
- Container Instances
- AKS (Kubernetes)

### Opção 4: Servidor Próprio

1. Configure um servidor (Ubuntu/Debian)
2. Instale Docker e Docker Compose
3. Clone o repositório
4. Configure `.env`
5. Execute `docker-compose up -d`

---

## ✅ Checklist Final de Lançamento

### 🔐 Segurança e Autenticação

#### Variáveis de Ambiente
- [ ] `JWT_SECRET` gerado com `openssl rand -base64 32` (mínimo 32 caracteres)
- [ ] `JWT_REFRESH_SECRET` gerado e configurado (mínimo 32 caracteres)
- [ ] `DATABASE_URL` configurado com `?sslmode=require&connection_limit=20&pool_timeout=20`
- [ ] `REDIS_URL` configurado (recomendado para produção)
- [ ] Todas as variáveis sensíveis configuradas no ambiente de produção
- [ ] `.env` verificado no `.gitignore` (nunca commitado)
- [ ] Variáveis de ambiente documentadas no `.env.example`

#### Headers e Proteções
- [ ] Helmet configurado e funcionando (verificar headers de segurança)
- [ ] CORS configurado corretamente (apenas domínios permitidos)
- [ ] Rate limiting ativo e testado
- [ ] HTTPS configurado no frontend e backend
- [ ] SSL/TLS obrigatório em todas as conexões

#### Autenticação
- [ ] Sistema de refresh tokens implementado e testado
- [ ] Access tokens expirando em 15 minutos
- [ ] Refresh tokens expirando em 7 dias
- [ ] Endpoint `/api/auth/refresh` funcionando
- [ ] Endpoint `/api/auth/logout` funcionando
- [ ] Blacklist de tokens funcionando (se Redis configurado)
- [ ] Frontend atualizado para usar `accessToken` e `refreshToken`

#### Validação e Sanitização
- [ ] Validators Zod implementados em todas as rotas críticas
- [ ] Sanitização de inputs funcionando
- [ ] Validação de senhas forte (mínimo 8 caracteres, maiúscula, minúscula, número)
- [ ] Validação de emails, CPF, telefones funcionando

---

### 💻 Código e Qualidade

#### Dependências
- [ ] Todas as dependências instaladas (`npm install`)
- [ ] Dependências atualizadas e sem vulnerabilidades conhecidas
- [ ] `package-lock.json` commitado

#### Testes
- [ ] Testes executando sem erros (`npm test`)
- [ ] Cobertura de testes > 70% (`npm run test:coverage`)
- [ ] Testes de integração criados para rotas críticas
- [ ] Testes de autenticação funcionando
- [ ] Mocks configurados corretamente

#### Build e Compilação
- [ ] Build sem erros (`npm run build`)
- [ ] TypeScript compilando sem erros
- [ ] Prisma Client gerado corretamente (`npm run db:generate`)
- [ ] Linting sem erros (`npm run lint` - se configurado)

#### Estrutura de Código
- [ ] Padrão Repository implementado (pelo menos para transações)
- [ ] Controllers separados da lógica de rotas
- [ ] Error handling centralizado funcionando
- [ ] Logging estruturado com Winston funcionando

---

### 🗄️ Banco de Dados

#### Configuração
- [ ] Migrations executadas em produção (`npm run db:migrate`)
- [ ] Schema do banco atualizado e sincronizado
- [ ] Connection pooling configurado na `DATABASE_URL`
- [ ] SSL obrigatório (`sslmode=require`)
- [ ] Timeout de conexão configurado (`pool_timeout=20`)
- [ ] Limite de conexões configurado (`connection_limit=20`)

#### Backup e Recuperação
- [ ] Backup automático configurado (diário recomendado)
- [ ] Estratégia de backup testada e documentada
- [ ] Procedimento de restore documentado
- [ ] Backup testado e validado

#### Performance
- [ ] Índices criados nas colunas mais consultadas
- [ ] Queries otimizadas (verificar logs de queries lentas)
- [ ] Connection pooling testado sob carga

---

### 🔴 Redis (Opcional mas Recomendado)

- [ ] Redis configurado e acessível
- [ ] `REDIS_URL` ou variáveis individuais configuradas
- [ ] Conexão com Redis testada
- [ ] Blacklist de tokens funcionando
- [ ] Redis com senha configurada (produção)

---

### 🐳 Docker e Containerização

#### Dockerfile
- [ ] Docker build funcionando (`docker build -t clinify-backend .`)
- [ ] Imagem Docker otimizada (multi-stage build)
- [ ] Health check configurado e funcionando
- [ ] Usuário não-root configurado

#### Docker Compose
- [ ] `docker-compose up` funcionando localmente
- [ ] Todos os serviços iniciando corretamente
- [ ] Volumes persistentes configurados
- [ ] Network isolada configurada
- [ ] Health checks de todos os serviços funcionando

---

### 🔄 CI/CD

#### GitLab CI (ou equivalente)
- [ ] Pipeline configurado (`.gitlab-ci.yml`)
- [ ] Stage de testes executando
- [ ] Stage de build executando
- [ ] Container Registry configurado
- [ ] Variáveis de ambiente configuradas no CI/CD
- [ ] Deploy manual configurado para staging
- [ ] Deploy manual configurado para produção

#### Testes Automatizados
- [ ] Testes executando no pipeline
- [ ] Cobertura de testes sendo reportada
- [ ] Build falhando se testes falharem

---

### 🚀 Deploy e Infraestrutura

#### Ambiente de Produção
- [ ] Servidor/hosting configurado (Vercel, Railway, AWS, etc.)
- [ ] Variáveis de ambiente configuradas no ambiente de produção
- [ ] Domínio configurado e apontando corretamente
- [ ] SSL/HTTPS configurado no domínio
- [ ] Backend acessível e respondendo (`/health`)

#### Ambiente de Staging (Recomendado)
- [ ] Ambiente de staging configurado
- [ ] Deploy para staging testado
- [ ] Testes em staging realizados
- [ ] Aprovação para produção após testes em staging

#### Monitoramento
- [ ] Logs sendo coletados e acessíveis
- [ ] Erros sendo logados corretamente
- [ ] Health check endpoint funcionando (`/health`)
- [ ] Monitoramento de performance configurado (opcional: Sentry, DataDog)
- [ ] Alertas configurados para erros críticos

---

### 📱 Frontend

#### Integração com Backend
- [ ] Frontend atualizado para usar `accessToken` e `refreshToken`
- [ ] Renovação automática de tokens implementada
- [ ] Logout revogando tokens no backend
- [ ] Tratamento de erros 401 (token expirado) implementado
- [ ] CORS configurado corretamente

#### Segurança Frontend
- [ ] HTTPS configurado
- [ ] Tokens armazenados de forma segura (localStorage ou httpOnly cookies)
- [ ] Validação de formulários no frontend
- [ ] Proteção contra XSS

---

### 📚 Documentação

#### Documentação Técnica
- [ ] README.md atualizado com instruções de setup
- [ ] API documentada (Swagger em `/api/docs`)
- [ ] Variáveis de ambiente documentadas
- [ ] Guia de deploy documentado
- [ ] Arquitetura documentada

#### Documentação de Usuário
- [ ] Manual do usuário (se aplicável)
- [ ] Changelog atualizado
- [ ] Guias de uso documentados

---

### 🧪 Testes Finais

#### Testes Funcionais
- [ ] Login funcionando
- [ ] Signup funcionando
- [ ] Refresh token funcionando
- [ ] Logout funcionando
- [ ] CRUD de transações funcionando
- [ ] CRUD de pacientes funcionando
- [ ] Todas as funcionalidades principais testadas

#### Testes de Segurança
- [ ] Tentativa de acesso sem token retorna 401
- [ ] Token expirado retorna 401 e renova automaticamente
- [ ] Rate limiting funcionando
- [ ] Validação de inputs rejeitando dados inválidos
- [ ] Sanitização prevenindo XSS

#### Testes de Performance
- [ ] API respondendo em < 500ms (p95)
- [ ] Queries do banco otimizadas
- [ ] Connection pooling funcionando
- [ ] Sem memory leaks detectados

#### Testes de Carga (Opcional)
- [ ] Sistema testado com carga simulada
- [ ] Limites de rate limiting adequados
- [ ] Banco de dados suportando carga esperada

---

### ✅ Pré-Lançamento

#### Checklist Final
- [ ] Todos os itens acima marcados como concluídos
- [ ] Backup do banco de dados antes do deploy
- [ ] Rollback plan documentado
- [ ] Equipe notificada sobre o lançamento
- [ ] Horário de menor tráfego escolhido para deploy (se aplicável)

#### Pós-Lançamento
- [ ] Monitorar logs nas primeiras 24 horas
- [ ] Verificar métricas de performance
- [ ] Coletar feedback dos usuários
- [ ] Documentar problemas encontrados
- [ ] Planejar próximas melhorias

---

### 🎯 Prioridades

**Crítico (Não lançar sem):**
- ✅ Segurança básica (JWT, SSL, validação)
- ✅ Banco de dados com backup
- ✅ Testes passando
- ✅ Build funcionando
- ✅ Variáveis de ambiente configuradas

**Importante (Recomendado antes do lançamento):**
- ✅ Redis configurado
- ✅ CI/CD funcionando
- ✅ Monitoramento básico
- ✅ Frontend atualizado

**Desejável (Pode adicionar depois):**
- ⚪ Monitoramento avançado (Sentry, DataDog)
- ⚪ Testes de carga
- ⚪ Documentação completa de usuário
- ⚪ Ambiente de staging

---

**Status do Projeto:** ✅ Pronto para lançamento após completar itens críticos e importantes

---

## 🔍 Monitoramento (Opcional mas Recomendado)

### Sentry (Erros)

1. Acesse [sentry.io](https://sentry.io)
2. Crie um projeto Node.js
3. Instale: `npm install @sentry/node`
4. Configure no `index.ts`

### DataDog / New Relic (APM)

Para monitoramento avançado de performance.

### Logs

Os logs estão sendo salvos em:
- `logs/error.log` - Apenas erros
- `logs/combined.log` - Todos os logs

Configure rotação de logs em produção.

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs: `docker-compose logs backend`
2. Verifique as variáveis de ambiente
3. Teste a conexão com o banco
4. Verifique se Redis está acessível (se configurado)

---

## 🎉 Próximos Passos

Após completar este guia:

1. **Teste tudo localmente** com Docker
2. **Configure CI/CD** no GitLab
3. **Faça deploy** para staging primeiro
4. **Teste em staging** por alguns dias
5. **Deploy para produção**

---

## 📝 Notas Importantes

1. **Nunca commite** o arquivo `.env`
2. **Sempre use** secrets fortes (32+ caracteres)
3. **Sempre use** SSL no banco de dados
4. **Configure backups** automáticos
5. **Monitore** os logs regularmente
6. **Mantenha** as dependências atualizadas

---

**Boa sorte com o lançamento do Clinify! 🚀**
