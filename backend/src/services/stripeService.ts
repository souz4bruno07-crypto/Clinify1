import Stripe from 'stripe';
import prisma from '../config/database.js';
import { logger } from '../config/logger.js';

// #region agent log
fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'stripeService.ts:6',message:'Checking STRIPE_SECRET_KEY',data:{hasKey:!!process.env.STRIPE_SECRET_KEY,keyLength:process.env.STRIPE_SECRET_KEY?.length||0,keyPrefix:process.env.STRIPE_SECRET_KEY?.substring(0,10)||'undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
// #endregion agent log

// Inicializar cliente Stripe apenas se a chave estiver configurada
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.length > 0) {
  try {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
    });
    logger.info('Stripe inicializado com sucesso');
  } catch (error: any) {
    logger.error('Erro ao inicializar Stripe:', error);
    stripe = null;
  }
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'stripeService.ts:14',message:'Stripe initialized successfully',data:{initialized:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
  // #endregion agent log
} else {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'stripeService.ts:18',message:'Stripe NOT initialized - key missing',data:{initialized:false},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
  // #endregion agent log
}

// Função helper para obter a instância do Stripe
function getStripe(): Stripe {
  if (!stripe) {
    throw new Error('Stripe não está configurado. Configure STRIPE_SECRET_KEY no .env');
  }
  return stripe;
}

// Mapeamento de planos para price IDs no Stripe
// IMPORTANTE: Configure esses valores no .env ou no banco de dados
const PLAN_PRICE_IDS: Record<string, string> = {
  basic: process.env.STRIPE_PRICE_ID_BASIC || '',
  professional: process.env.STRIPE_PRICE_ID_PROFESSIONAL || '',
  enterprise: process.env.STRIPE_PRICE_ID_ENTERPRISE || '',
};

/**
 * Cria ou retorna um cliente Stripe existente
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name: string
): Promise<Stripe.Customer> {
  try {
    // Verificar se já existe um customer ID salvo
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      select: { stripeCustomerId: true }
    });

    if (subscription?.stripeCustomerId) {
      // Recuperar cliente existente
      const customer = await getStripe().customers.retrieve(subscription.stripeCustomerId);
      if (!customer.deleted) {
        return customer as Stripe.Customer;
      }
    }

    // Criar novo cliente
    const customer = await getStripe().customers.create({
      email,
      name,
      metadata: {
        userId,
      },
    });

    // Salvar o customerId na subscription
    await prisma.subscription.upsert({
      where: { userId },
      update: { stripeCustomerId: customer.id },
      create: {
        userId,
        plan: 'free',
        status: 'incomplete',
        startDate: new Date(),
        stripeCustomerId: customer.id,
      },
    });

    logger.info(`Cliente Stripe criado: ${customer.id} para usuário ${userId}`);
    return customer;
  } catch (error) {
    logger.error('Erro ao criar/recuperar cliente Stripe:', error);
    throw error;
  }
}

/**
 * Cria uma sessão de checkout do Stripe
 */
export async function createCheckoutSession(
  userId: string,
  planId: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  try {
    logger.info(`[createCheckoutSession] Iniciando criação de checkout para plano: ${planId}, userId: ${userId}`);
    
    // Verificar se o Stripe está configurado
    if (!isStripeConfigured()) {
      throw new Error('Stripe não está configurado. Configure STRIPE_SECRET_KEY no arquivo .env');
    }

    // Verificar se o plano tem price ID configurado
    const priceId = PLAN_PRICE_IDS[planId];
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'stripeService.ts:117',message:'Verificando priceId',data:{planId,priceId,hasPriceId:!!priceId,priceIdLength:priceId?.length||0,allPlanPriceIds:PLAN_PRICE_IDS},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion agent log
    logger.info(`[createCheckoutSession] Price ID para plano ${planId}: ${priceId ? 'configurado' : 'não configurado'}`);
    
    if (!priceId || priceId.trim() === '') {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'stripeService.ts:121',message:'PriceId não configurado',data:{planId,priceId,allPlanPriceIds:PLAN_PRICE_IDS},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion agent log
      throw new Error(`Plano ${planId} não está disponível no Stripe. Configure o STRIPE_PRICE_ID_${planId.toUpperCase()} no arquivo .env ou crie o produto no Stripe Dashboard.`);
    }

    // Buscar dados do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    logger.info(`[createCheckoutSession] Usuário encontrado: ${user.email}`);

    // Criar ou recuperar cliente Stripe
    logger.info(`[createCheckoutSession] Criando/recuperando cliente Stripe...`);
    const customer = await getOrCreateStripeCustomer(userId, user.email, user.name || '');
    logger.info(`[createCheckoutSession] Cliente Stripe: ${customer.id}`);

    // Criar sessão de checkout
    logger.info(`[createCheckoutSession] Criando sessão de checkout com priceId: ${priceId}`);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'stripeService.ts:142',message:'Criando sessão checkout Stripe',data:{planId,priceId,customerId:customer.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion agent log
    const session = await getStripe().checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        planId,
      },
      subscription_data: {
        metadata: {
          userId,
          planId,
        },
      },
      allow_promotion_codes: true,
    });

    logger.info(`[createCheckoutSession] Sessão de checkout criada com sucesso: ${session.id} para usuário ${userId}`);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'stripeService.ts:168',message:'Sessão checkout criada com sucesso',data:{planId,priceId,sessionId:session.id,hasUrl:!!session.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion agent log
    return session;
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'stripeService.ts:170',message:'Erro ao criar sessão checkout',data:{planId,priceId:PLAN_PRICE_IDS[planId],errorMessage:error?.message,errorType:error?.type,errorCode:error?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion agent log
    logger.error(`[createCheckoutSession] Erro ao criar sessão de checkout:`, {
      error: error.message,
      stack: error.stack,
      type: error.type,
      code: error.code,
      planId,
      userId
    });
    
    // Melhorar mensagem de erro baseada no tipo de erro do Stripe
    if (error.type === 'StripeInvalidRequestError') {
      if (error.code === 'resource_missing') {
        throw new Error(`Price ID "${PLAN_PRICE_IDS[planId]}" não encontrado no Stripe. Verifique se o produto foi criado corretamente no Stripe Dashboard.`);
      }
      throw new Error(`Erro na requisição ao Stripe: ${error.message}`);
    }
    
    throw error;
  }
}

/**
 * Cria uma assinatura diretamente no Stripe (para uso interno)
 */
export async function createStripeSubscription(
  customerId: string,
  priceId: string,
  userId: string,
  planId: string
): Promise<Stripe.Subscription> {
  try {
    const subscription = await getStripe().subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata: {
        userId,
        planId,
      },
    });

    // Atualizar subscription no banco
    await prisma.subscription.update({
      where: { userId },
      data: {
        plan: planId as any,
        status: mapStripeStatus(subscription.status),
        startDate: new Date((subscription as any).current_period_start * 1000),
        endDate: new Date((subscription as any).current_period_end * 1000),
        stripeCustomerId: customerId,
      },
    });

    logger.info(`Assinatura Stripe criada: ${subscription.id} para usuário ${userId}`);
    return subscription;
  } catch (error) {
    logger.error('Erro ao criar assinatura Stripe:', error);
    throw error;
  }
}

/**
 * Cancela uma assinatura no Stripe
 */
export async function cancelStripeSubscription(
  userId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<void> {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      select: { stripeCustomerId: true }
    });

    if (!subscription?.stripeCustomerId) {
      throw new Error('Cliente Stripe não encontrado');
    }

    // Buscar assinatura ativa no Stripe
    const subscriptions = await getStripe().subscriptions.list({
      customer: subscription.stripeCustomerId,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      throw new Error('Nenhuma assinatura ativa encontrada no Stripe');
    }

    const stripeSubscription = subscriptions.data[0];

    if (cancelAtPeriodEnd) {
      // Cancelar no final do período
      await getStripe().subscriptions.update(stripeSubscription.id, {
        cancel_at_period_end: true,
      });
      
      await prisma.subscription.update({
        where: { userId },
        data: { cancelAtPeriodEnd: true },
      });
    } else {
      // Cancelar imediatamente
      await getStripe().subscriptions.cancel(stripeSubscription.id);
      
      await prisma.subscription.update({
        where: { userId },
        data: {
          status: 'canceled',
          canceledAt: new Date(),
          cancelAtPeriodEnd: false,
        },
      });
    }

    logger.info(`Assinatura Stripe cancelada: ${stripeSubscription.id} para usuário ${userId}`);
  } catch (error) {
    logger.error('Erro ao cancelar assinatura Stripe:', error);
    throw error;
  }
}

/**
 * Mapeia status do Stripe para status interno
 */
export function mapStripeStatus(status: Stripe.Subscription.Status): 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' {
  const mapping: Record<string, 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'> = {
    'active': 'active',
    'canceled': 'canceled',
    'past_due': 'past_due',
    'trialing': 'trialing',
    'incomplete': 'incomplete',
    'incomplete_expired': 'canceled',
    'unpaid': 'past_due',
  };
  return mapping[status] || 'incomplete';
}

/**
 * Verifica se o Stripe está configurado
 */
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.length > 0;
}

/**
 * Verifica se um plano específico está disponível no Stripe
 */
export function isPlanAvailableInStripe(planId: string): boolean {
  if (!isStripeConfigured()) {
    return false;
  }
  const priceId = PLAN_PRICE_IDS[planId];
  return !!priceId && priceId.trim() !== '';
}

