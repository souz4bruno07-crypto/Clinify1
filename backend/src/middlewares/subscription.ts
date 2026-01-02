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
 * Middleware para verificar se o usuário tem uma assinatura ativa
 */
export const requireActiveSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.userId }
    });

    if (!subscription) {
      res.status(403).json({
        error: 'Assinatura não encontrada',
        code: 'SUBSCRIPTION_NOT_FOUND'
      });
      return;
    }

    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      res.status(403).json({
        error: 'Assinatura inativa ou cancelada',
        code: 'SUBSCRIPTION_INACTIVE',
        status: subscription.status
      });
      return;
    }

    if (subscription.endDate && new Date(subscription.endDate) < new Date()) {
      res.status(403).json({
        error: 'Assinatura expirada',
        code: 'SUBSCRIPTION_EXPIRED'
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
      const subscription = await prisma.subscription.findUnique({
        where: { userId: req.userId }
      });

      if (!subscription) {
        res.status(403).json({
          error: 'Assinatura não encontrada',
          code: 'SUBSCRIPTION_NOT_FOUND'
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
      const subscription = await prisma.subscription.findUnique({
        where: { userId: req.userId }
      });

      if (!subscription) {
        res.status(403).json({
          error: 'Assinatura não encontrada',
          code: 'SUBSCRIPTION_NOT_FOUND'
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

