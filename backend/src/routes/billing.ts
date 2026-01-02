import { Router, Response, Request } from 'express';
import express from 'express';
import prisma from '../config/database.js';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';
import { 
  createCheckoutSession, 
  mapStripeStatus, 
  isStripeConfigured,
  cancelStripeSubscription,
  isPlanAvailableInStripe
} from '../services/stripeService.js';
import { 
  createMercadoPagoSubscription, 
  mapMercadoPagoStatus, 
  isMercadoPagoConfigured,
  cancelMercadoPagoSubscription 
} from '../services/mercadoPagoService.js';
import Stripe from 'stripe';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

const router = Router();

// Inicializar Stripe apenas se a chave estiver configurada (já inicializado no stripeService)
// Esta instância é usada apenas para webhooks
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  try {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
    });
  } catch (error: any) {
    logger.error('Erro ao inicializar Stripe para webhooks:', error);
    stripe = null;
  }
}

// =====================================================
// ROTAS PÚBLICAS (Webhooks - não requerem autenticação)
// =====================================================

// POST /api/billing/webhook/stripe - Webhook do Stripe
router.post('/webhook/stripe', express.raw({type: 'application/json'}), async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'];

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    logger.warn('Webhook Stripe recebido sem assinatura ou secret não configurado');
    res.status(400).json({ error: 'Webhook secret não configurado' });
    return;
  }

  if (!stripe) {
    logger.warn('Webhook Stripe recebido mas Stripe não está configurado');
    res.status(503).json({ error: 'Stripe não está configurado' });
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    logger.error('Erro ao validar webhook Stripe:', err);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  try {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId || (event.data.object as any).metadata?.userId;

    if (!userId) {
      logger.warn('Webhook Stripe sem userId no metadata');
      res.status(400).json({ error: 'User ID not found in metadata' });
      return;
    }

    logger.info(`Processando webhook Stripe: ${event.type} para usuário ${userId}`);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        await prisma.subscription.update({
          where: { userId },
          data: {
            plan: sub.metadata?.planId as any || 'basic',
            status: mapStripeStatus(sub.status),
            startDate: new Date((sub as any).current_period_start * 1000),
            endDate: new Date((sub as any).current_period_end * 1000),
          }
        });
        break;
      }
      
      case 'customer.subscription.deleted': {
        await prisma.subscription.update({
          where: { userId },
          data: {
            status: 'canceled',
            canceledAt: new Date(),
            cancelAtPeriodEnd: false,
          }
        });
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if ((invoice as any).subscription) {
          await prisma.subscription.update({
            where: { userId },
            data: { status: 'past_due' }
          });
        }
        break;
      }
      
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        if ((invoice as any).subscription) {
          await prisma.subscription.update({
            where: { userId },
            data: { status: 'active' }
          });
        }
        break;
      }
      
      default:
        logger.info(`Evento Stripe não tratado: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Erro ao processar webhook Stripe:', error);
    res.status(500).json({ error: 'Erro ao processar webhook' });
  }
});

// POST /api/billing/webhook/mercado-pago - Webhook do Mercado Pago
router.post('/webhook/mercado-pago', async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, action, data } = req.body;

    logger.info(`Webhook Mercado Pago recebido: ${type} - ${action}`);

    // Validar webhook do Mercado Pago (em produção, validar assinatura)
    // Por enquanto, processamos diretamente
    if (type === 'subscription' || type === 'preapproval') {
      const externalReference = data?.external_reference || data?.preapproval_id;
      if (!externalReference) {
        res.status(400).json({ error: 'external_reference não encontrado' });
        return;
      }

      const userId = externalReference;
      
      switch (action) {
        case 'created':
        case 'updated': {
          const status = data?.status || 'pending';
          await prisma.subscription.update({
            where: { userId },
            data: {
              status: mapMercadoPagoStatus(status),
            }
          });
          break;
        }
        
        case 'deleted': {
          await prisma.subscription.update({
            where: { userId },
            data: {
              status: 'canceled',
              canceledAt: new Date(),
              cancelAtPeriodEnd: false,
            }
          });
          break;
        }
      }
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Erro ao processar webhook Mercado Pago:', error);
    res.status(500).json({ error: 'Erro ao processar webhook' });
  }
});

// =====================================================
// ROTAS PROTEGIDAS (requerem autenticação)
// =====================================================

router.use(authMiddleware);

// GET /api/billing/subscription - Obter assinatura atual do usuário
router.get('/subscription', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.userId },
      include: { user: { select: { email: true, name: true, clinicName: true } } }
    });

    if (!subscription) {
      // Retornar 200 com null - não é erro, apenas não há assinatura ainda
      res.status(200).json(null);
      return;
    }

    res.json({
      id: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      canceledAt: subscription.canceledAt,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
      hasStripeIntegration: !!subscription.stripeCustomerId,
      hasMercadoPagoIntegration: !!subscription.mercadoPagoCustomerId
    });
  } catch (error) {
    logger.error('Erro ao buscar assinatura:', error);
    res.status(500).json({ error: 'Erro ao buscar assinatura' });
  }
});

// POST /api/billing/subscription - Criar ou atualizar assinatura
router.post('/subscription', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { plan, status, startDate, endDate, stripeCustomerId, mercadoPagoCustomerId } = req.body;

    if (!plan) {
      res.status(400).json({ error: 'Plano é obrigatório' });
      return;
    }

    const subscriptionData: any = {
      plan,
      status: status || 'active',
      startDate: startDate ? new Date(startDate) : new Date(),
      userId: req.userId
    };

    if (endDate) {
      subscriptionData.endDate = new Date(endDate);
    }

    if (stripeCustomerId) {
      subscriptionData.stripeCustomerId = stripeCustomerId;
    }

    if (mercadoPagoCustomerId) {
      subscriptionData.mercadoPagoCustomerId = mercadoPagoCustomerId;
    }

    const subscription = await prisma.subscription.upsert({
      where: { userId: req.userId },
      update: subscriptionData,
      create: subscriptionData
    });

    res.json({
      id: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      createdAt: subscription.createdAt
    });
  } catch (error) {
    logger.error('Erro ao criar/atualizar assinatura:', error);
    res.status(500).json({ error: 'Erro ao processar assinatura' });
  }
});

// GET /api/billing/stripe/test - Testar conexão com Stripe
router.get('/stripe/test', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isConfigured = isStripeConfigured();
    const hasBasicPrice = !!process.env.STRIPE_PRICE_ID_BASIC && process.env.STRIPE_PRICE_ID_BASIC.trim() !== '';
    const hasProfessionalPrice = !!process.env.STRIPE_PRICE_ID_PROFESSIONAL && process.env.STRIPE_PRICE_ID_PROFESSIONAL.trim() !== '';
    const hasEnterprisePrice = !!process.env.STRIPE_PRICE_ID_ENTERPRISE && process.env.STRIPE_PRICE_ID_ENTERPRISE.trim() !== '';

    let stripeTestResult = null;
    if (isConfigured && stripe) {
      try {
        // Tentar fazer uma chamada simples ao Stripe para verificar a conexão
        await stripe.customers.list({ limit: 1 });
        stripeTestResult = { connected: true, message: 'Conexão com Stripe OK' };
      } catch (stripeError: any) {
        stripeTestResult = { 
          connected: false, 
          message: `Erro ao conectar com Stripe: ${stripeError.message}`,
          type: stripeError.type,
          code: stripeError.code
        };
      }
    }

    res.json({
      configured: isConfigured,
      stripeTest: stripeTestResult,
      priceIds: {
        basic: hasBasicPrice ? 'configurado' : 'não configurado',
        professional: hasProfessionalPrice ? 'configurado' : 'não configurado',
        enterprise: hasEnterprisePrice ? 'configurado' : 'não configurado',
      },
      env: {
        hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
        secretKeyPrefix: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 7) + '...' : 'não configurado',
        basicPriceId: process.env.STRIPE_PRICE_ID_BASIC || 'não configurado',
        professionalPriceId: process.env.STRIPE_PRICE_ID_PROFESSIONAL || 'não configurado',
        enterprisePriceId: process.env.STRIPE_PRICE_ID_ENTERPRISE || 'não configurado',
      }
    });
  } catch (error: any) {
    logger.error('Erro ao testar Stripe:', error);
    res.status(500).json({ error: error.message || 'Erro ao testar Stripe' });
  }
});

// POST /api/billing/checkout/stripe - Criar sessão de checkout Stripe
router.post('/checkout/stripe', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'billing.ts:332',message:'POST /checkout/stripe recebido',data:{planId:req.body?.planId,userId:req.userId,isStripeConfigured:isStripeConfigured()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion agent log
    logger.info(`[POST /checkout/stripe] Requisição recebida:`, { 
      planId: req.body?.planId, 
      userId: req.userId,
      isStripeConfigured: isStripeConfigured()
    });

    if (!isStripeConfigured()) {
      logger.warn('[POST /checkout/stripe] Stripe não está configurado');
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'billing.ts:340',message:'Stripe não configurado',data:{planId:req.body?.planId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion agent log
      res.status(503).json({ error: 'Stripe não está configurado. Configure STRIPE_SECRET_KEY no arquivo .env' });
      return;
    }

    const { planId } = req.body;

    if (!planId || !['basic', 'professional', 'enterprise'].includes(planId)) {
      logger.warn(`[POST /checkout/stripe] Plano inválido: ${planId}`);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'billing.ts:348',message:'Plano inválido',data:{planId,validPlans:['basic','professional','enterprise']},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
      // #endregion agent log
      res.status(400).json({ error: 'Plano inválido' });
      return;
    }

    const successUrl = `${env.FRONTEND_URL}/dashboard/configuracoes?payment=success`;
    const cancelUrl = `${env.FRONTEND_URL}/dashboard/configuracoes?payment=canceled`;

    logger.info(`[POST /checkout/stripe] Criando sessão de checkout para plano: ${planId}`);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'billing.ts:357',message:'Chamando createCheckoutSession',data:{planId,userId:req.userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion agent log
    const session = await createCheckoutSession(
      req.userId!,
      planId,
      successUrl,
      cancelUrl
    );

    logger.info(`[POST /checkout/stripe] Sessão criada com sucesso: ${session.id}`);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'billing.ts:365',message:'Sessão criada com sucesso',data:{planId,sessionId:session.id,hasUrl:!!session.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion agent log
    res.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'billing.ts:368',message:'Erro ao criar checkout',data:{planId:req.body?.planId,errorMessage:error?.message,errorType:error?.type,errorCode:error?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion agent log
    logger.error('[POST /checkout/stripe] Erro ao criar checkout Stripe:', {
      message: error.message,
      type: error.type,
      code: error.code,
      stack: error.stack
    });
    
    // Retornar mensagem de erro mais detalhada
    const errorMessage = error.message || 'Erro ao criar checkout';
    res.status(500).json({ 
      error: errorMessage,
      details: error.type ? { type: error.type, code: error.code } : undefined
    });
  }
});

// POST /api/billing/checkout/mercado-pago - Criar checkout Mercado Pago
router.post('/checkout/mercado-pago', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isMercadoPagoConfigured()) {
      res.status(503).json({ error: 'Mercado Pago não está configurado' });
      return;
    }

    const { planId } = req.body;

    if (!planId || !['basic', 'professional', 'enterprise'].includes(planId)) {
      res.status(400).json({ error: 'Plano inválido' });
      return;
    }

    const preApproval = await createMercadoPagoSubscription(req.userId!, planId);

    res.json({ 
      initPoint: preApproval.init_point || preApproval.sandbox_init_point,
      preApprovalId: preApproval.id 
    });
  } catch (error: any) {
    logger.error('Erro ao criar checkout Mercado Pago:', error);
    res.status(500).json({ error: error.message || 'Erro ao criar checkout' });
  }
});

// PUT /api/billing/subscription/plan - Atualizar plano
router.put('/subscription/plan', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { plan } = req.body;

    if (!plan) {
      res.status(400).json({ error: 'Plano é obrigatório' });
      return;
    }

    const subscription = await prisma.subscription.update({
      where: { userId: req.userId },
      data: { plan, status: 'active' }
    });

    res.json({
      id: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
      updatedAt: subscription.updatedAt
    });
  } catch (error) {
    logger.error('Erro ao atualizar plano:', error);
    res.status(500).json({ error: 'Erro ao atualizar plano' });
  }
});

// PUT /api/billing/subscription/cancel - Cancelar assinatura
router.put('/subscription/cancel', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { cancelAtPeriodEnd = true, provider } = req.body;

    // Se tiver integração com gateway, cancelar lá também
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.userId },
      select: { stripeCustomerId: true, mercadoPagoCustomerId: true }
    });

    try {
      if (provider === 'stripe' && subscription?.stripeCustomerId && isStripeConfigured()) {
        await cancelStripeSubscription(req.userId!, cancelAtPeriodEnd);
      } else if (provider === 'mercado-pago' && subscription?.mercadoPagoCustomerId && isMercadoPagoConfigured()) {
        await cancelMercadoPagoSubscription(req.userId!);
      }
    } catch (gatewayError) {
      logger.warn('Erro ao cancelar no gateway, continuando cancelamento local:', gatewayError);
      // Continuar com cancelamento local mesmo se falhar no gateway
    }

    const updated = await prisma.subscription.update({
      where: { userId: req.userId },
      data: {
        cancelAtPeriodEnd: cancelAtPeriodEnd,
        canceledAt: cancelAtPeriodEnd ? null : new Date(),
        status: cancelAtPeriodEnd ? 'active' : 'canceled'
      }
    });

    res.json({
      id: updated.id,
      plan: updated.plan,
      status: updated.status,
      cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
      canceledAt: updated.canceledAt
    });
  } catch (error) {
    logger.error('Erro ao cancelar assinatura:', error);
    res.status(500).json({ error: 'Erro ao cancelar assinatura' });
  }
});

// POST /api/billing/subscription/reactivate - Reativar assinatura cancelada
router.post('/subscription/reactivate', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const subscription = await prisma.subscription.update({
      where: { userId: req.userId },
      data: {
        cancelAtPeriodEnd: false,
        canceledAt: null,
        status: 'active'
      }
    });

    res.json({
      id: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd
    });
  } catch (error) {
    logger.error('Erro ao reativar assinatura:', error);
    res.status(500).json({ error: 'Erro ao reativar assinatura' });
  }
});

// GET /api/billing/plans - Listar planos disponíveis
router.get('/plans', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const plans = [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        features: [
          'Até 50 pacientes',
          'Módulo financeiro básico',
          'Agenda simples',
          'Suporte via email'
        ],
        limits: {
          patients: 50,
          users: 1,
          storage: '1GB'
        },
        availableInStripe: true // Plano free sempre disponível
      },
      {
        id: 'basic',
        name: 'Basic',
        price: 99,
        features: [
          'Até 200 pacientes',
          'Todos os módulos financeiros',
          'Agenda completa',
          'CRM básico',
          'Suporte prioritário'
        ],
        limits: {
          patients: 200,
          users: 3,
          storage: '10GB'
        },
        availableInStripe: isPlanAvailableInStripe('basic')
      },
      {
        id: 'professional',
        name: 'Professional',
        price: 299,
        features: [
          'Pacientes ilimitados',
          'Todos os módulos',
          'Prescrições digitais',
          'Controle de estoque avançado',
          'API e integrações',
          'Suporte 24/7'
        ],
        limits: {
          patients: -1, // ilimitado
          users: 10,
          storage: '100GB'
        },
        availableInStripe: isPlanAvailableInStripe('professional')
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 799,
        features: [
          'Tudo do Professional',
          'Usuários ilimitados',
          'White-label',
          'Integrações personalizadas',
          'Gerente de conta dedicado',
          'Suporte premium'
        ],
        limits: {
          patients: -1,
          users: -1,
          storage: '1TB'
        },
        availableInStripe: isPlanAvailableInStripe('enterprise')
      }
    ];

    res.json(plans);
  } catch (error) {
    logger.error('Erro ao listar planos:', error);
    res.status(500).json({ error: 'Erro ao listar planos' });
  }
});

export default router;
