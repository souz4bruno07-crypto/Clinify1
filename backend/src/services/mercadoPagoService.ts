import { MercadoPagoConfig, Customer, PreApproval, Payment } from 'mercadopago';
import prisma from '../config/database.js';
import { logger } from '../config/logger.js';

// Inicializar cliente Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  options: { timeout: 5000 },
});

const customerClient = new Customer(client);
const preApprovalClient = new PreApproval(client);
const paymentClient = new Payment(client);

// Valores dos planos (em reais)
const PLAN_VALUES: Record<string, number> = {
  basic: 99,
  professional: 299,
  enterprise: 799,
};

/**
 * Cria ou retorna um cliente Mercado Pago existente
 */
export async function getOrCreateMercadoPagoCustomer(
  userId: string,
  email: string,
  name: string
): Promise<any> {
  try {
    // Verificar se já existe um customer ID salvo
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      select: { mercadoPagoCustomerId: true }
    });

    if (subscription?.mercadoPagoCustomerId) {
      try {
        // Tentar recuperar cliente existente
        // @ts-ignore - SDK do Mercado Pago tem tipos incompatíveis
        const customer = await customerClient.get({ id: subscription.mercadoPagoCustomerId });
        return customer;
      } catch (error) {
        // Se não existir, criar novo
        logger.warn(`Cliente Mercado Pago ${subscription.mercadoPagoCustomerId} não encontrado, criando novo`);
      }
    }

    // Criar novo cliente
    const nameParts = name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const customer = await customerClient.create({
      body: {
        email,
        first_name: firstName,
        last_name: lastName,
      }
    });

    // Salvar o customerId na subscription
    await prisma.subscription.upsert({
      where: { userId },
      update: { mercadoPagoCustomerId: customer.id?.toString() || null },
      create: {
        userId,
        plan: 'free',
        status: 'incomplete',
        startDate: new Date(),
        mercadoPagoCustomerId: customer.id?.toString() || null,
      },
    });

    logger.info(`Cliente Mercado Pago criado: ${customer.id} para usuário ${userId}`);
    return customer;
  } catch (error) {
    logger.error('Erro ao criar/recuperar cliente Mercado Pago:', error);
    throw error;
  }
}

/**
 * Cria uma assinatura (PreApproval) no Mercado Pago
 */
export async function createMercadoPagoSubscription(
  userId: string,
  planId: string,
  initPointUrl?: string
): Promise<any> {
  try {
    const planValue = PLAN_VALUES[planId];
    if (!planValue) {
      throw new Error(`Valor não configurado para o plano: ${planId}`);
    }

    // Buscar dados do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Criar ou recuperar cliente Mercado Pago
    const customer = await getOrCreateMercadoPagoCustomer(userId, user.email, user.name || '');

    // Calcular data de início (24h a partir de agora)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);

    // Criar PreApproval (assinatura recorrente)
    const preApproval = await preApprovalClient.create({
      body: {
        reason: `Assinatura Clinify - Plano ${planId}`,
        external_reference: userId,
        payer_email: user.email,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: planValue,
          currency_id: 'BRL',
          start_date: startDate.toISOString(),
        },
        status: 'pending',
      }
    });

    // Atualizar subscription no banco
    await prisma.subscription.update({
      where: { userId },
      data: {
        plan: planId as any,
        status: mapMercadoPagoStatus(preApproval.status || 'pending'),
        startDate: startDate,
        mercadoPagoCustomerId: customer.id?.toString() || null,
      },
    });

    logger.info(`PreApproval Mercado Pago criado: ${preApproval.id} para usuário ${userId}`);
    return preApproval;
  } catch (error) {
    logger.error('Erro ao criar assinatura Mercado Pago:', error);
    throw error;
  }
}

/**
 * Cancela uma assinatura no Mercado Pago
 */
export async function cancelMercadoPagoSubscription(
  userId: string
): Promise<void> {
  try {
    // Buscar PreApproval ID (seria necessário salvar no banco)
    // Por enquanto, vamos buscar pelo external_reference
    // NOTA: Na prática, você deve salvar o preApprovalId na subscription
    
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      select: { mercadoPagoCustomerId: true }
    });

    if (!subscription?.mercadoPagoCustomerId) {
      throw new Error('Cliente Mercado Pago não encontrado');
    }

    // Em produção, você precisaria buscar o PreApproval ID salvo
    // Por enquanto, apenas atualizamos o banco local
    await prisma.subscription.update({
      where: { userId },
      data: {
        status: 'canceled',
        canceledAt: new Date(),
        cancelAtPeriodEnd: false,
      },
    });

    logger.info(`Assinatura Mercado Pago cancelada para usuário ${userId}`);
  } catch (error) {
    logger.error('Erro ao cancelar assinatura Mercado Pago:', error);
    throw error;
  }
}

/**
 * Mapeia status do Mercado Pago para status interno
 */
export function mapMercadoPagoStatus(status: string): 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' {
  const mapping: Record<string, 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'> = {
    'authorized': 'active',
    'paused': 'canceled',
    'cancelled': 'canceled',
    'pending': 'incomplete',
  };
  return mapping[status.toLowerCase()] || 'incomplete';
}

/**
 * Verifica se o Mercado Pago está configurado
 */
export function isMercadoPagoConfigured(): boolean {
  return !!process.env.MERCADOPAGO_ACCESS_TOKEN && process.env.MERCADOPAGO_ACCESS_TOKEN.length > 0;
}


