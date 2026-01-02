# 📍 Referência Rápida - Sistema de Assinaturas Clinify

## 🗂️ Arquivos Criados/Modificados

### Backend

#### 1. Modelo de Dados
```
📄 backend/prisma/schema.prisma
   → Modelo Subscription adicionado (linhas ~460-495)
   → Relacionamento com User atualizado
```

**Campos principais:**
- `plan`: free | basic | professional | enterprise
- `status`: active | canceled | past_due | trialing | incomplete
- `startDate`, `endDate`
- `stripeCustomerId`, `mercadoPagoCustomerId`

#### 2. Rotas da API
```
📄 backend/src/routes/billing.ts (NOVO)
   → Todas as rotas /api/billing/*
```

**Endpoints:**
- `GET /api/billing/subscription` - Obter assinatura
- `POST /api/billing/subscription` - Criar/atualizar
- `PUT /api/billing/subscription/plan` - Mudar plano
- `PUT /api/billing/subscription/cancel` - Cancelar
- `POST /api/billing/subscription/reactivate` - Reativar
- `GET /api/billing/plans` - Listar planos
- `POST /api/billing/webhook/stripe` - Webhook Stripe
- `POST /api/billing/webhook/mercado-pago` - Webhook Mercado Pago

**Registro no servidor:**
```
📄 backend/src/index.ts
   → Import: import billingRoutes from './routes/billing.js'
   → Uso: app.use('/api/billing', apiLimiter, billingRoutes)
```

#### 3. Middlewares de Verificação
```
📄 backend/src/middlewares/subscription.ts (NOVO)
   → Middlewares para proteger rotas baseadas em plano
```

**Middlewares disponíveis:**
- `requireActiveSubscription` - Verifica assinatura ativa
- `requirePlan(minPlan)` - Requer plano mínimo
- `requireFeature(featureName)` - Requer feature específica
- `checkPlanLimit(userId, limitType)` - Verifica limites

**Como usar:**
```typescript
import { requirePlan, requireFeature } from '../middlewares/subscription';

// Exemplo: proteger rota de prescrições
router.post('/prescriptions', requirePlan('professional'), ...);

// Exemplo: proteger feature específica
router.get('/advanced-reports', requireFeature('advanced_reports'), ...);
```

### Frontend

#### 4. Serviços/API Client
```
📄 services/backendService.ts
   → Funções de billing adicionadas (linhas ~373-430)
```

**Funções disponíveis:**
- `getSubscription()`
- `createOrUpdateSubscription(data)`
- `updateSubscriptionPlan(planId)`
- `cancelSubscription(cancelAtPeriodEnd)`
- `reactivateSubscription()`
- `getAvailablePlans()`

#### 5. Componente de Página
```
📄 components/dashboard/SubscriptionTab.tsx (NOVO)
   → Página completa de gerenciamento de assinatura
```

**Funcionalidades:**
- Visualizar plano atual e status
- Ver todos os planos disponíveis
- Fazer upgrade/downgrade
- Cancelar ou reativar assinatura
- Informações sobre integrações

#### 6. Integração no Settings
```
📄 components/dashboard/SettingsTab.tsx
   → Nova seção 'subscription' adicionada
   → Botão no menu lateral
```

**Acesso:**
```
/dashboard/configuracoes → Seção "Assinatura"
```

### Documentação

#### 7. Guias de Referência
```
📄 docs/PAYMENT_INTEGRATION.md
   → Como integrar Stripe ou Mercado Pago
   → Exemplos de código completos
   → Configuração de webhooks

📄 docs/SUBSCRIPTION_SETUP.md
   → Setup inicial do sistema
   → Como aplicar migrations
   → Troubleshooting

📄 docs/ASSINATURAS_REFERENCIA.md (este arquivo)
   → Referência rápida de todos os caminhos
```

## 🚀 Workflow Típico

### 1. Primeira Configuração
```bash
# 1. Aplicar migration
cd backend
npx prisma migrate dev --name add_subscriptions
npx prisma generate

# 2. Reiniciar servidor backend
npm run dev
```

### 2. Criar Assinatura para Usuário
```typescript
// Backend ou via API
POST /api/billing/subscription
{
  "plan": "free",
  "status": "active",
  "startDate": "2024-01-01"
}
```

### 3. Proteger Rota com Middleware
```typescript
// backend/src/routes/prescriptions.ts
import { requirePlan } from '../middlewares/subscription';

router.post('/', requirePlan('professional'), async (req, res) => {
  // Apenas planos professional e enterprise acessam
});
```

### 4. Verificar Limite no Frontend
```typescript
// Antes de criar paciente
const limit = await checkPlanLimit(userId, 'patients');
if (!limit.allowed) {
  toast.error('Limite de pacientes atingido');
  return;
}
```

## 📋 Estrutura de Planos

### Planos Disponíveis

| Plano | Preço | Pacientes | Usuários | Features |
|-------|-------|-----------|----------|----------|
| **Free** | R$ 0 | 50 | 1 | Módulo financeiro básico |
| **Basic** | R$ 99 | 200 | 3 | Todos módulos + CRM básico |
| **Professional** | R$ 299 | Ilimitado | 10 | Tudo + Prescrições + Estoque avançado |
| **Enterprise** | R$ 799 | Ilimitado | Ilimitado | Tudo + White-label + Customizações |

### Features por Plano

```typescript
// Ver: backend/src/middlewares/subscription.ts
// Linha ~40: PLAN_FEATURES
// Linha ~70: FEATURE_REQUIREMENTS
```

**Features protegidas:**
- `prescriptions` → professional+
- `advanced_inventory` → professional+
- `api_access` → professional+
- `white_label` → enterprise
- `advanced_reports` → basic+
- `crm` → basic+
- `ai_insights` → professional+

## 🔧 Comandos Úteis

### Aplicar Migration
```bash
cd backend
npx prisma migrate dev --name add_subscriptions
```

### Ver Schema no Prisma Studio
```bash
cd backend
npx prisma studio
```

### Resetar Banco (apenas dev)
```bash
cd backend
npx prisma migrate reset
```

### Gerar Cliente Prisma
```bash
cd backend
npx prisma generate
```

## 🗺️ Mapa de Navegação

```
📁 backend/
  📁 prisma/
    📄 schema.prisma ← Modelo Subscription
  📁 src/
    📁 routes/
      📄 billing.ts ← Rotas /api/billing/*
    📁 middlewares/
      📄 subscription.ts ← Middlewares de verificação
    📄 index.ts ← Registro das rotas

📁 components/
  📁 dashboard/
    📄 SubscriptionTab.tsx ← Página de assinatura
    📄 SettingsTab.tsx ← Integração da página

📁 services/
  📄 backendService.ts ← Funções de API

📁 docs/
  📄 PAYMENT_INTEGRATION.md ← Como integrar pagamento
  📄 SUBSCRIPTION_SETUP.md ← Setup inicial
  📄 ASSINATURAS_REFERENCIA.md ← Este arquivo
```

## 🎯 Onde Fazer Quê

### Para adicionar novo plano:
1. `backend/prisma/schema.prisma` → Enum `SubscriptionPlan`
2. `backend/src/middlewares/subscription.ts` → `PLAN_FEATURES`
3. `backend/src/routes/billing.ts` → `GET /api/billing/plans`

### Para adicionar nova feature protegida:
1. `backend/src/middlewares/subscription.ts` → `FEATURE_REQUIREMENTS`

### Para proteger nova rota:
```typescript
import { requirePlan, requireFeature } from '../middlewares/subscription';

router.post('/nova-rota', requirePlan('professional'), handler);
```

### Para modificar UI de assinatura:
1. `components/dashboard/SubscriptionTab.tsx`

### Para integrar gateway de pagamento:
1. Seguir `docs/PAYMENT_INTEGRATION.md`
2. Atualizar webhooks em `backend/src/routes/billing.ts`

## 📞 URLs Importantes

### Frontend
- Página de assinatura: `/dashboard/configuracoes` → Seção "Assinatura"

### Backend API
- Base: `/api/billing`
- Assinatura: `/api/billing/subscription`
- Planos: `/api/billing/plans`
- Webhook Stripe: `/api/billing/webhook/stripe`
- Webhook Mercado Pago: `/api/billing/webhook/mercado-pago`

## ⚠️ Lembretes Importantes

1. **Sempre aplicar migration após mudar schema**
2. **Webhooks precisam ser validados** (veja PAYMENT_INTEGRATION.md)
3. **Limites são verificados no middleware**, não apenas no frontend
4. **Usar `requireActiveSubscription` para features básicas**
5. **Usar `requirePlan` ou `requireFeature` para recursos específicos**

## 🔐 Segurança

- ✅ Webhooks sempre validados
- ✅ Middlewares protegem rotas backend
- ✅ Limites verificados antes de criar recursos
- ✅ Status da assinatura sempre verificado

---

**Última atualização:** Estrutura inicial de assinaturas criada
**Próximos passos:** Integrar gateway de pagamento (Stripe/Mercado Pago)




