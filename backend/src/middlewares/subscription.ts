import { Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import { AuthRequest } from './auth.js';

export type SubscriptionPlan = 'free' | 'basic' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';

export interface PlanFeatures {
  patients: number; // -1 para ilimitado
  users: number; // -1 para ilimitado
  storage: string;
  features: string[];
}

// Configuração de features por plano
export const PLAN_FEATURES: Record<SubscriptionPlan, PlanFeatures> = {
  free: {
    patients: 50,
    users: 1,
    storage: '1GB',
    features: [
      'Módulo financeiro básico',
      'Agenda simples',
      'Pacientes básico'
    ]
  },
  basic: {
    patients: 200,
    users: 3,
    storage: '10GB',
    features: [
      'Todos os módulos financeiros',
      'Agenda completa',
      'CRM básico',
      'Relatórios básicos'
    ]
  },
  professional: {
    patients: -1, // ilimitado
    users: 10,
    storage: '100GB',
    features: [
      'Todos os módulos',
      'Prescrições digitais',
      'Controle de estoque avançado',
      'API e integrações',
      'Relatórios avançados',
      'IA e análises'
    ]
  },
  enterprise: {
    patients: -1,
    users: -1,
    storage: '1TB',
    features: [
      'Tudo do Professional',
      'White-label',
      'Integrações personalizadas',
      'Suporte premium',
      'Customizações sob medida'
    ]
  }
};

// Mapeamento de features para planos mínimos necessários
const FEATURE_REQUIREMENTS: Record<string, SubscriptionPlan[]> = {
  'prescriptions': ['professional', 'enterprise'],
  'advanced_inventory': ['professional', 'enterprise'],
  'api_access': ['professional', 'enterprise'],
  'white_label': ['enterprise'],
  'advanced_reports': ['basic', 'professional', 'enterprise'],
  'crm': ['basic', 'professional', 'enterprise'],
  'ai_insights': ['professional', 'enterprise'],
  'unlimited_patients': ['professional', 'enterprise'],
  'multiple_users': ['basic', 'professional', 'enterprise']
};

/**
 * Verifica se a subscription está expirada e atualiza status se necessário
 * Para planos pagos: 30 dias de grace period antes de bloquear
 */
export async function checkAndUpdateExpiredSubscription(userId: string) {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    });

    if (!subscription) return null;

    const now = new Date();
    const endDate = subscription.endDate ? new Date(subscription.endDate) : null;
    const isExpired = endDate && endDate < now;

    // Calcular dias desde a expiração (para planos pagos)
    const daysSinceExpiration = endDate 
      ? Math.floor((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Se o trial expirou e ainda está como "trialing", marcar como cancelado
    if (isExpired && subscription.status === 'trialing' && subscription.plan === 'free') {
      const updated = await prisma.subscription.update({
        where: { userId },
        data: {
          status: 'canceled',
          canceledAt: now
        }
      });
      return updated;
    }

    // Para planos pagos: após 30 dias da expiração, marcar como cancelado
    const paidPlans: SubscriptionPlan[] = ['basic', 'professional', 'enterprise'];
    if (isExpired && paidPlans.includes(subscription.plan)) {
      if (daysSinceExpiration >= 30) {
        // Após 30 dias, marcar como cancelado (dados serão excluídos pelo job de limpeza)
        if (subscription.status !== 'canceled') {
          const updated = await prisma.subscription.update({
            where: { userId },
            data: {
              status: 'canceled',
              canceledAt: now
            }
          });
          return updated;
        }
      } else {
        // Dentro dos 30 dias de grace period, marcar como past_due
        if (subscription.status === 'active') {
          const updated = await prisma.subscription.update({
            where: { userId },
            data: {
              status: 'past_due'
            }
          });
          return updated;
        }
      }
    }

    return subscription;
  } catch (error) {
    console.error('Erro ao verificar subscription expirada:', error);
    return null;
  }
}

/**
 * Verifica se a subscription está no período de grace (30 dias após expiração)
 */
export function isInGracePeriod(subscription: { endDate: Date | null; plan: SubscriptionPlan }): boolean {
  if (!subscription.endDate) return false;
  
  const now = new Date();
  const endDate = new Date(subscription.endDate);
  const paidPlans: SubscriptionPlan[] = ['basic', 'professional', 'enterprise'];
  
  if (!paidPlans.includes(subscription.plan)) return false;
  
  const daysSinceExpiration = Math.floor((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
  return daysSinceExpiration >= 0 && daysSinceExpiration < 30;
}

/**
 * Verifica se os dados devem ser excluídos (mais de 30 dias após expiração)
 */
export function shouldDeleteData(subscription: { endDate: Date | null; plan: SubscriptionPlan }): boolean {
  if (!subscription.endDate) return false;
  
  const now = new Date();
  const endDate = new Date(subscription.endDate);
  const paidPlans: SubscriptionPlan[] = ['basic', 'professional', 'enterprise'];
  
  if (!paidPlans.includes(subscription.plan)) return false;
  
  const daysSinceExpiration = Math.floor((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
  return daysSinceExpiration >= 30;
}

/**
 * Middleware para verificar se o usuário tem uma assinatura ativa
 */
export const requireActiveSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Verificar e atualizar subscription expirada antes de verificar
    let subscription = await checkAndUpdateExpiredSubscription(req.userId!);

    if (!subscription) {
      subscription = await prisma.subscription.findUnique({
        where: { userId: req.userId }
      });
    }

    if (!subscription) {
      res.status(403).json({
        error: 'Assinatura não encontrada. Por favor, faça o upgrade do seu plano.',
        code: 'SUBSCRIPTION_NOT_FOUND'
      });
      return;
    }

    const now = new Date();
    const isExpired = subscription.endDate && new Date(subscription.endDate) < now;

    // Se o trial expirou e o plano é free, BLOQUEAR acesso
    if (isExpired && subscription.plan === 'free') {
      res.status(403).json({
        error: 'Seu período de teste de 14 dias expirou. Por favor, escolha um plano para continuar usando o sistema.',
        code: 'TRIAL_EXPIRED',
        expiredAt: subscription.endDate
      });
      return;
    }

    // Verificar status da subscription
    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      res.status(403).json({
        error: 'Assinatura inativa ou cancelada. Por favor, renove sua assinatura.',
        code: 'SUBSCRIPTION_INACTIVE',
        status: subscription.status
      });
      return;
    }

    // Para planos pagos: verificar grace period de 30 dias
    const paidPlans: SubscriptionPlan[] = ['basic', 'professional', 'enterprise'];
    if (isExpired && paidPlans.includes(subscription.plan)) {
      const daysSinceExpiration = subscription.endDate 
        ? Math.floor((now.getTime() - new Date(subscription.endDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // Se passou dos 30 dias, bloquear completamente
      if (daysSinceExpiration >= 30) {
        res.status(403).json({
          error: 'Sua assinatura expirou há mais de 30 dias. Seus dados foram excluídos. Por favor, entre em contato com o suporte.',
          code: 'SUBSCRIPTION_EXPIRED_DELETED',
          daysExpired: daysSinceExpiration
        });
        return;
      }

      // Se está dentro dos 30 dias, permitir acesso mas mostrar aviso de renovação
      // O frontend deve mostrar modal de renovação
      res.status(403).json({
        error: 'Sua assinatura expirou. Você tem 30 dias para renovar antes que seus dados sejam excluídos.',
        code: 'SUBSCRIPTION_EXPIRED_GRACE_PERIOD',
        daysExpired: daysSinceExpiration,
        daysRemaining: 30 - daysSinceExpiration,
        requiresRenewal: true
      });
      return;
    }

    // Adiciona informações da assinatura ao request
    (req as any).subscription = subscription;
    next();
  } catch (error) {
    console.error('Erro ao verificar assinatura:', error);
    res.status(500).json({ error: 'Erro ao verificar assinatura' });
  }
};

/**
 * Middleware para verificar se o usuário tem um plano específico ou superior
 */
export const requirePlan = (minPlan: SubscriptionPlan) => {
  const planHierarchy: SubscriptionPlan[] = ['free', 'basic', 'professional', 'enterprise'];
  const minPlanIndex = planHierarchy.indexOf(minPlan);

  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Verificar e atualizar subscription expirada antes de verificar
      let subscription = await checkAndUpdateExpiredSubscription(req.userId!);

      if (!subscription) {
        subscription = await prisma.subscription.findUnique({
          where: { userId: req.userId }
        });
      }

      if (!subscription) {
        res.status(403).json({
          error: 'Assinatura não encontrada',
          code: 'SUBSCRIPTION_NOT_FOUND'
        });
        return;
      }

      const now = new Date();
      const isExpired = subscription.endDate && new Date(subscription.endDate) < now;

      // Se o trial expirou e o plano é free, BLOQUEAR
      if (isExpired && subscription.plan === 'free') {
        res.status(403).json({
          error: 'Seu período de teste expirou. Por favor, escolha um plano.',
          code: 'TRIAL_EXPIRED'
        });
        return;
      }

      if (subscription.status !== 'active' && subscription.status !== 'trialing') {
        res.status(403).json({
          error: 'Assinatura inativa',
          code: 'SUBSCRIPTION_INACTIVE'
        });
        return;
      }

      const userPlanIndex = planHierarchy.indexOf(subscription.plan);
      
      if (userPlanIndex < minPlanIndex) {
        res.status(403).json({
          error: `Esta funcionalidade requer plano ${minPlan} ou superior`,
          code: 'INSUFFICIENT_PLAN',
          requiredPlan: minPlan,
          currentPlan: subscription.plan
        });
        return;
      }

      (req as any).subscription = subscription;
      next();
    } catch (error) {
      console.error('Erro ao verificar plano:', error);
      res.status(500).json({ error: 'Erro ao verificar plano' });
    }
  };
};

/**
 * Middleware para verificar se o usuário tem acesso a uma feature específica
 */
export const requireFeature = (featureName: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Verificar e atualizar subscription expirada antes de verificar
      let subscription = await checkAndUpdateExpiredSubscription(req.userId!);

      if (!subscription) {
        subscription = await prisma.subscription.findUnique({
          where: { userId: req.userId }
        });
      }

      if (!subscription) {
        res.status(403).json({
          error: 'Assinatura não encontrada',
          code: 'SUBSCRIPTION_NOT_FOUND'
        });
        return;
      }

      const now = new Date();
      const isExpired = subscription.endDate && new Date(subscription.endDate) < now;

      // Se o trial expirou e o plano é free, BLOQUEAR
      if (isExpired && subscription.plan === 'free') {
        res.status(403).json({
          error: 'Seu período de teste expirou. Por favor, escolha um plano.',
          code: 'TRIAL_EXPIRED'
        });
        return;
      }

      if (subscription.status !== 'active' && subscription.status !== 'trialing') {
        res.status(403).json({
          error: 'Assinatura inativa',
          code: 'SUBSCRIPTION_INACTIVE'
        });
        return;
      }

      const requiredPlans = FEATURE_REQUIREMENTS[featureName];
      
      if (!requiredPlans || !requiredPlans.includes(subscription.plan)) {
        const minPlan = requiredPlans?.[0] || 'enterprise';
        res.status(403).json({
          error: `Esta funcionalidade requer plano ${minPlan} ou superior`,
          code: 'FEATURE_NOT_AVAILABLE',
          feature: featureName,
          requiredPlan: minPlan,
          currentPlan: subscription.plan
        });
        return;
      }

      (req as any).subscription = subscription;
      next();
    } catch (error) {
      console.error('Erro ao verificar feature:', error);
      res.status(500).json({ error: 'Erro ao verificar feature' });
    }
  };
};

/**
 * Helper para verificar limites do plano (usuários, pacientes, etc)
 */
export const checkPlanLimit = async (
  userId: string,
  limitType: 'patients' | 'users'
): Promise<{ allowed: boolean; current: number; limit: number }> => {
  const subscription = await prisma.subscription.findUnique({
    where: { userId }
  });

  if (!subscription) {
    return { allowed: false, current: 0, limit: 0 };
  }

  const planFeatures = PLAN_FEATURES[subscription.plan];
  const limit = planFeatures[limitType];

  // Limite -1 significa ilimitado
  if (limit === -1) {
    return { allowed: true, current: 0, limit: -1 };
  }

  let current = 0;
  if (limitType === 'patients') {
    current = await prisma.patient.count({ where: { userId } });
  } else if (limitType === 'users') {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      current = await prisma.user.count({ where: { clinicId: user.clinicId } });
    }
  }

  return {
    allowed: current < limit,
    current,
    limit
  };
};

