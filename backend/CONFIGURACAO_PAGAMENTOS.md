# Configuração de Pagamentos - Clinify

Este guia explica como configurar as integrações de pagamento (Stripe e Mercado Pago) no Clinify.

## 📋 Pré-requisitos

- Backend do Clinify instalado e funcionando
- Conta no Stripe e/ou Mercado Pago
- Acesso ao painel administrativo dos gateways de pagamento

## 🔑 Configuração de Variáveis de Ambiente

Adicione as seguintes variáveis no arquivo `.env` do backend:

### Stripe

```env
# Chave secreta do Stripe (obtida em: https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_...

# Chave pública do Stripe (para frontend, se necessário)
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Secret do Webhook do Stripe (obtido ao configurar webhook)
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs dos planos no Stripe (criados no Stripe Dashboard)
STRIPE_PRICE_ID_BASIC=price_...
STRIPE_PRICE_ID_PROFESSIONAL=price_...
STRIPE_PRICE_ID_ENTERPRISE=price_...
```

### Mercado Pago

```env
# Access Token do Mercado Pago (obtido em: https://www.mercadopago.com.br/developers/panel)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...

# Webhook Secret do Mercado Pago (opcional, para validação)
MERCADOPAGO_WEBHOOK_SECRET=seu_webhook_secret
```

**Nota:** Você pode configurar apenas um gateway ou ambos. O sistema tentará usar Stripe primeiro, depois Mercado Pago.

## 🚀 Passo a Passo

### 1. Configurar Stripe

#### 1.1. Criar Conta e Obter Chaves

1. Acesse [Stripe Dashboard](https://dashboard.stripe.com)
2. Vá em **Developers > API keys**
3. Copie a **Secret key** (começa com `sk_test_` ou `sk_live_`)
4. Copie a **Publishable key** (começa com `pk_test_` ou `pk_live_`)

#### 1.2. Criar Produtos e Preços

1. No Stripe Dashboard, vá em **Products**
2. Crie três produtos:
   - **Basic Plan** - R$ 99,00/mês
   - **Professional Plan** - R$ 299,00/mês
   - **Enterprise Plan** - R$ 799,00/mês

3. Para cada produto, crie um **Price**:
   - Tipo: **Recurring**
   - Intervalo: **Monthly**
   - Valor: conforme o plano

4. Copie o **Price ID** de cada plano (começa com `price_...`)

#### 1.3. Configurar Webhook

1. No Stripe Dashboard, vá em **Developers > Webhooks**
2. Clique em **Add endpoint**
3. URL do endpoint: `https://seu-dominio.com/api/billing/webhook/stripe`
4. Eventos a escutar:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`

5. Copie o **Signing secret** (começa com `whsec_...`)

### 2. Configurar Mercado Pago

#### 2.1. Criar Conta e Obter Access Token

1. Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Crie uma aplicação
3. Vá em **Credentials**
4. Copie o **Access Token** (começa com `APP_USR-...`)

#### 2.2. Configurar Webhook (Opcional)

1. No painel do Mercado Pago, vá em **Webhooks**
2. Adicione a URL: `https://seu-dominio.com/api/billing/webhook/mercado-pago`
3. Eventos:
   - `subscription`
   - `preapproval`

**Nota:** Os valores dos planos (R$ 99, R$ 299, R$ 799) estão hardcoded no código. Se precisar alterar, edite `backend/src/services/mercadoPagoService.ts`.

## 🧪 Testar em Ambiente de Desenvolvimento

### Stripe

1. Use as chaves de **teste** (que começam com `sk_test_` e `pk_test_`)
2. Use cartões de teste:
   - Sucesso: `4242 4242 4242 4242`
   - Falha: `4000 0000 0000 0002`
   - Expiração: qualquer data futura
   - CVC: qualquer 3 dígitos

3. Para testar webhooks localmente, use [Stripe CLI](https://stripe.com/docs/stripe-cli):
```bash
stripe listen --forward-to localhost:3001/api/billing/webhook/stripe
```

### Mercado Pago

1. Use o Access Token de **teste**
2. Use dados de teste conforme documentação do Mercado Pago

## 🔒 Segurança

- **Nunca** commite as chaves secretas no Git
- Use variáveis de ambiente ou um gerenciador de segredos
- Em produção, use as chaves **live** (não test)
- Sempre valide webhooks usando os secrets fornecidos
- Use HTTPS para todos os endpoints de webhook

## 📝 Verificação

Após configurar, você pode verificar se está funcionando:

1. Acesse a página de Assinatura no dashboard
2. Tente fazer upgrade para um plano pago
3. Deve redirecionar para o checkout do gateway escolhido

## ❓ Troubleshooting

### Erro: "Stripe não está configurado"

- Verifique se `STRIPE_SECRET_KEY` está no `.env`
- Reinicie o servidor backend após adicionar variáveis

### Erro: "Price ID não configurado"

- Verifique se os `STRIPE_PRICE_ID_*` estão configurados
- Confirme que os Price IDs existem no Stripe Dashboard

### Webhook não está funcionando

- Verifique a URL do webhook no dashboard do gateway
- Confirme que o `WEBHOOK_SECRET` está correto
- Use o Stripe CLI para testar localmente
- Verifique os logs do backend para erros

### Checkout não redireciona

- Verifique se o `FRONTEND_URL` está configurado corretamente
- Verifique os logs do backend para erros
- Confirme que as chaves estão corretas

## 📚 Recursos Adicionais

- [Documentação Stripe](https://stripe.com/docs/billing/subscriptions/overview)
- [Documentação Mercado Pago - Assinaturas](https://www.mercadopago.com.br/developers/pt/docs/subscriptions/overview)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Guia de Testes Stripe](https://stripe.com/docs/testing)




