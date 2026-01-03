# Integração de Pagamento - Clinify

Este documento descreve como integrar gateways de pagamento (Stripe ou Mercado Pago) ao sistema de assinaturas do Clinify.

## Estrutura de Assinaturas

O Clinify possui uma estrutura completa de gerenciamento de assinaturas com suporte a múltiplos planos e status.

### Modelo de Dados

O modelo `Subscription` no Prisma contém:

- `plan`: Plano atual (free, basic, professional, enterprise)
- `status`: Status da assinatura (active, canceled, past_due, trialing, incomplete)
- `startDate`: Data de início
- `endDate`: Data de término (opcional)
- `stripeCustomerId`: ID do cliente no Stripe (opcional)
- `mercadoPagoCustomerId`: ID do cliente no Mercado Pago (opcional)
- `cancelAtPeriodEnd`: Indica se o cancelamento está agendado

### Planos Disponíveis

1. **Free**: Grátis, funcionalidades básicas, até 50 pacientes
2. **Basic**: R$ 99/mês, módulos completos, até 200 pacientes, 3 usuários
3. **Professional**: R$ 299/mês, todos os módulos, pacientes ilimitados, 10 usuários
4. **Enterprise**: R$ 799/mês, recursos premium, usuários ilimitados, suporte dedicado

## Integração com Stripe

### 1. Configuração Inicial

1. Instale o SDK do Stripe:

```bash
cd backend
npm install stripe
```

2. Configure as variáveis de ambiente no `.env`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 2. Criar Cliente no Stripe

Quando um usuário cria uma assinatura, você precisa criar um cliente no Stripe:

```typescript
// backend/src/services/stripeService.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function createStripeCustomer(userId: string, email: string, name: string) {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      userId,
    },
  });
  
  // Salvar o customerId na subscription
  await prisma.subscription.update({
    where: { userId },
    data: { stripeCustomerId: customer.id }
  });
  
  return customer;
}
```

### 3. Criar Assinatura no Stripe

```typescript
export async function createStripeSubscription(
  customerId: string,
  priceId: string, // ID do preço no Stripe
  userId: string
) {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    metadata: {
      userId,
    },
  });
  
  // Atualizar a subscription no banco
  await prisma.subscription.update({
    where: { userId },
    data: {
      status: subscription.status === 'active' ? 'active' : 'trialing',
      startDate: new Date(subscription.current_period_start * 1000),
      endDate: new Date(subscription.current_period_end * 1000),
    }
  });
  
  return subscription;
}
```

### 4. Webhook do Stripe

Configure o webhook no Stripe Dashboard para receber eventos:

**Endpoint**: `POST /api/billing/webhook/stripe`

**Eventos importantes**:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`
- `invoice.paid`

Implementação do webhook:

```typescript
// backend/src/routes/billing.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

router.post('/webhook/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  const subscription = event.data.object as Stripe.Subscription;
  const userId = subscription.metadata?.userId;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID not found' });
  }
  
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await prisma.subscription.update({
        where: { userId },
        data: {
          status: mapStripeStatus(subscription.status),
          startDate: new Date(subscription.current_period_start * 1000),
          endDate: new Date(subscription.current_period_end * 1000),
        }
      });
      break;
      
    case 'customer.subscription.deleted':
      await prisma.subscription.update({
        where: { userId },
        data: {
          status: 'canceled',
          canceledAt: new Date(),
        }
      });
      break;
      
    case 'invoice.payment_failed':
      await prisma.subscription.update({
        where: { userId },
        data: { status: 'past_due' }
      });
      break;
      
    case 'invoice.paid':
      await prisma.subscription.update({
        where: { userId },
        data: { status: 'active' }
      });
      break;
  }
  
  res.json({ received: true });
});

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  const mapping: Record<string, SubscriptionStatus> = {
    'active': 'active',
    'canceled': 'canceled',
    'past_due': 'past_due',
    'trialing': 'trialing',
    'incomplete': 'incomplete',
  };
  return mapping[status] || 'incomplete';
}
```

### 5. Preços no Stripe

Crie os produtos e preços no Stripe Dashboard:

1. **Basic**: R$ 99,00/mês
2. **Professional**: R$ 299,00/mês
3. **Enterprise**: R$ 799,00/mês

Anote os `price_id` de cada plano e armazene no código ou banco de dados.

### 6. Frontend - Checkout do Stripe

Para criar uma página de checkout, você pode usar Stripe Checkout ou Stripe Elements.

Exemplo com Stripe Checkout:

```typescript
// No frontend, ao clicar em "Assinar"
const handleSubscribe = async (planId: string) => {
  const response = await fetch('/api/billing/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId }),
  });
  
  const { sessionId } = await response.json();
  
  // Redirecionar para o checkout
  const stripe = await loadStripe(process.env.VITE_STRIPE_PUBLISHABLE_KEY!);
  await stripe?.redirectToCheckout({ sessionId });
};
```

## Integração com Mercado Pago

### 1. Configuração Inicial

1. Instale o SDK do Mercado Pago:

```bash
cd backend
npm install mercadopago
```

2. Configure as variáveis de ambiente:

```env
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
MERCADOPAGO_WEBHOOK_SECRET=seu_webhook_secret
```

### 2. Criar Cliente no Mercado Pago

```typescript
// backend/src/services/mercadoPagoService.ts
import MercadoPagoConfig, { Customer, PreApproval } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  options: { timeout: 5000 },
});

export async function createMercadoPagoCustomer(
  userId: string,
  email: string,
  name: string
) {
  const customer = new Customer(client);
  
  const customerData = await customer.create({
    body: {
      email,
      first_name: name.split(' ')[0],
      last_name: name.split(' ').slice(1).join(' ') || '',
    }
  });
  
  await prisma.subscription.update({
    where: { userId },
    data: { mercadoPagoCustomerId: customerData.id }
  });
  
  return customerData;
}
```

### 3. Criar Assinatura (PreApproval)

```typescript
export async function createMercadoPagoSubscription(
  customerId: string,
  planId: string,
  userId: string
) {
  const preApproval = new PreApproval(client);
  
  // Mapear planId para valores
  const planValues: Record<string, number> = {
    basic: 99,
    professional: 299,
    enterprise: 799,
  };
  
  const subscription = await preApproval.create({
    body: {
      reason: `Assinatura Clinify - ${planId}`,
      external_reference: userId,
      payer_email: customerId, // email do cliente
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: planValues[planId],
        currency_id: 'BRL',
        start_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      status: 'pending',
    }
  });
  
  await prisma.subscription.update({
    where: { userId },
    data: {
      status: subscription.status === 'authorized' ? 'active' : 'incomplete',
      startDate: new Date(subscription.init_point),
    }
  });
  
  return subscription;
}
```

### 4. Webhook do Mercado Pago

Configure a URL do webhook no Mercado Pago Dashboard:

**Endpoint**: `POST /api/billing/webhook/mercado-pago`

```typescript
router.post('/webhook/mercado-pago', async (req, res) => {
  const { type, action, data } = req.body;
  
  // Validar assinatura do webhook (importante!)
  // Ver documentação do Mercado Pago para validação
  
  if (type === 'subscription') {
    const subscription = await preApproval.get({ id: data.id });
    const userId = subscription.external_reference;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID not found' });
    }
    
    switch (action) {
      case 'created':
      case 'updated':
        await prisma.subscription.update({
          where: { userId },
          data: {
            status: mapMercadoPagoStatus(subscription.status),
            startDate: new Date(subscription.init_point),
            endDate: subscription.auto_recurring?.end_date 
              ? new Date(subscription.auto_recurring.end_date)
              : null,
          }
        });
        break;
        
      case 'deleted':
        await prisma.subscription.update({
          where: { userId },
          data: {
            status: 'canceled',
            canceledAt: new Date(),
          }
        });
        break;
    }
  }
  
  res.json({ received: true });
});

function mapMercadoPagoStatus(status: string): SubscriptionStatus {
  const mapping: Record<string, SubscriptionStatus> = {
    'authorized': 'active',
    'paused': 'canceled',
    'cancelled': 'canceled',
  };
  return mapping[status] || 'incomplete';
}
```

## Middleware de Verificação de Plano

O Clinify inclui middlewares para proteger rotas baseadas no plano do usuário:

### Usando no Backend

```typescript
import { requirePlan, requireFeature, requireActiveSubscription } from '../middlewares/subscription';

// Requer plano específico ou superior
router.post('/prescriptions', requirePlan('professional'), async (req, res) => {
  // Apenas planos professional e enterprise podem acessar
});

// Requer feature específica
router.get('/api/advanced-reports', requireFeature('advanced_reports'), async (req, res) => {
  // Apenas planos que têm essa feature
});

// Requer apenas assinatura ativa
router.get('/api/some-feature', requireActiveSubscription, async (req, res) => {
  // Qualquer plano ativo pode acessar
});
```

### Verificando Limites

```typescript
import { checkPlanLimit } from '../middlewares/subscription';

// Verificar limite de pacientes
const { allowed, current, limit } = await checkPlanLimit(userId, 'patients');

if (!allowed) {
  return res.status(403).json({
    error: 'Limite de pacientes atingido',
    current,
    limit
  });
}
```

## Próximos Passos

1. **Configurar Preços**: Crie os produtos e preços no gateway escolhido
2. **Implementar Checkout**: Crie a página de checkout no frontend
3. **Configurar Webhooks**: Configure os endpoints de webhook
4. **Testar Fluxo Completo**: Teste criação, atualização e cancelamento
5. **Implementar Retry Logic**: Para pagamentos falhos
6. **Adicionar Notificações**: Notificar usuários sobre status da assinatura

## Segurança

- ✅ Sempre valide webhooks usando as assinaturas fornecidas pelos gateways
- ✅ Use HTTPS para todos os endpoints de webhook
- ✅ Nunca exponha chaves secretas no frontend
- ✅ Valide todos os dados recebidos dos webhooks
- ✅ Implemente rate limiting nos endpoints de webhook
- ✅ Mantenha logs de todas as transações importantes

## Recursos Adicionais

- [Documentação Stripe](https://stripe.com/docs/billing/subscriptions/overview)
- [Documentação Mercado Pago - Assinaturas](https://www.mercadopago.com.br/developers/pt/docs/subscriptions/overview)
- [Prisma Documentation](https://www.prisma.io/docs)





