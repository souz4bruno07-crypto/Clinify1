# Configuração de Assinaturas - Clinify

Este guia explica como configurar o módulo de assinaturas no Clinify.

## Pré-requisitos

- Banco de dados PostgreSQL configurado
- Node.js e npm instalados
- Prisma CLI instalado globalmente ou como dependência

## Passo 1: Aplicar Migration do Banco de Dados

Após adicionar o modelo `Subscription` ao schema do Prisma, você precisa aplicar as migrations:

```bash
cd backend
npx prisma migrate dev --name add_subscriptions
```

Isso criará uma nova tabela `subscriptions` no banco de dados com todos os campos necessários.

## Passo 2: Gerar Cliente Prisma

Após a migration, gere o cliente Prisma atualizado:

```bash
npx prisma generate
```

## Passo 3: Verificar Estrutura

A tabela `subscriptions` será criada com:

- `id`: UUID único
- `user_id`: Referência ao usuário (único, um por usuário)
- `plan`: Plano atual (free, basic, professional, enterprise)
- `status`: Status da assinatura (active, canceled, past_due, trialing, incomplete)
- `start_date`: Data de início
- `end_date`: Data de término (opcional)
- `stripe_customer_id`: ID do cliente no Stripe (opcional)
- `mercado_pago_customer_id`: ID do cliente no Mercado Pago (opcional)
- `cancel_at_period_end`: Se o cancelamento está agendado
- `canceled_at`: Data do cancelamento
- `created_at`: Data de criação
- `updated_at`: Data de última atualização

## Passo 4: Criar Assinatura Inicial (Opcional)

Se você quiser criar uma assinatura padrão para um usuário, pode usar o Prisma Studio:

```bash
npx prisma studio
```

Ou criar programaticamente:

```typescript
await prisma.subscription.create({
  data: {
    userId: 'user-id-aqui',
    plan: 'free',
    status: 'active',
    startDate: new Date(),
  }
});
```

## Passo 5: Testar Rotas da API

As seguintes rotas estarão disponíveis:

- `GET /api/billing/subscription` - Obter assinatura atual
- `POST /api/billing/subscription` - Criar/atualizar assinatura
- `PUT /api/billing/subscription/plan` - Atualizar plano
- `PUT /api/billing/subscription/cancel` - Cancelar assinatura
- `POST /api/billing/subscription/reactivate` - Reativar assinatura
- `GET /api/billing/plans` - Listar planos disponíveis
- `POST /api/billing/webhook/stripe` - Webhook do Stripe
- `POST /api/billing/webhook/mercado-pago` - Webhook do Mercado Pago

## Passo 6: Acessar Página de Assinatura

No frontend, acesse:

```
/dashboard/configuracoes
```

E clique na seção "Assinatura" no menu lateral.

## Troubleshooting

### Erro: "Subscription not found"

Isso significa que o usuário não tem uma assinatura criada. Crie uma assinatura inicial usando a rota `POST /api/billing/subscription` ou diretamente no banco.

### Erro de Migration

Se encontrar erros na migration, verifique:

1. Se o banco de dados está acessível
2. Se o DATABASE_URL está correto no `.env`
3. Se não há conflitos com migrations anteriores

Para resetar (apenas em desenvolvimento):

```bash
npx prisma migrate reset
```

## Próximos Passos

1. Configure a integração com Stripe ou Mercado Pago (veja `PAYMENT_INTEGRATION.md`)
2. Implemente proteção de rotas usando os middlewares de subscription
3. Configure limites baseados no plano do usuário
4. Teste o fluxo completo de upgrade/downgrade




