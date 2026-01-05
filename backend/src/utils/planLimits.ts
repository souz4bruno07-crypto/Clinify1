import prisma from '../config/database.js';
import { logger } from '../config/logger.js';

export interface PlanLimits {
  patients: number;
  users: number;
  storage: string;
  appointmentsPerMonth: number;
  transactionsPerMonth: number;
}

export interface PlanModules {
  finance: boolean;
  patients: boolean;
  appointments: boolean;
  reports: 'basic' | 'advanced' | false;
  crm: 'basic' | 'advanced' | false;
  inventory: boolean;
  prescriptions: boolean;
  loyalty: boolean;
  commissions: boolean;
  pep: boolean;
  ai: boolean;
  whiteLabel?: boolean;
  multiBranch?: boolean;
  customIntegrations?: boolean;
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    patients: 50,
    users: 1,
    storage: '1GB',
    appointmentsPerMonth: 200,
    transactionsPerMonth: 500
  },
  basic: {
    patients: 200,
    users: 3,
    storage: '10GB',
    appointmentsPerMonth: 1000,
    transactionsPerMonth: 2000
  },
  professional: {
    patients: -1, // ilimitado
    users: 10,
    storage: '100GB',
    appointmentsPerMonth: -1,
    transactionsPerMonth: -1
  },
  enterprise: {
    patients: -1,
    users: -1,
    storage: '1TB',
    appointmentsPerMonth: -1,
    transactionsPerMonth: -1
  }
};

const PLAN_MODULES: Record<string, PlanModules> = {
  free: {
    finance: true,
    patients: true,
    appointments: true,
    reports: 'basic',
    crm: false,
    inventory: false,
    prescriptions: false,
    loyalty: false,
    commissions: false,
    pep: false,
    ai: false
  },
  basic: {
    finance: true,
    patients: true,
    appointments: true,
    reports: 'advanced',
    crm: 'basic',
    inventory: false,
    prescriptions: false,
    loyalty: false,
    commissions: false,
    pep: false,
    ai: false
  },
  professional: {
    finance: true,
    patients: true,
    appointments: true,
    reports: 'advanced',
    crm: 'advanced',
    inventory: true,
    prescriptions: true,
    loyalty: true,
    commissions: true,
    pep: true,
    ai: true
  },
  enterprise: {
    finance: true,
    patients: true,
    appointments: true,
    reports: 'advanced',
    crm: 'advanced',
    inventory: true,
    prescriptions: true,
    loyalty: true,
    commissions: true,
    pep: true,
    ai: true,
    whiteLabel: true,
    multiBranch: true,
    customIntegrations: true
  }
};

/**
 * Obtém o plano do usuário
 */
export async function getUserPlan(userId: string): Promise<string> {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      select: { plan: true, status: true }
    });

    if (!subscription || subscription.status !== 'active') {
      return 'free'; // Plano padrão se não tiver assinatura ativa
    }

    return subscription.plan;
  } catch (error) {
    logger.error('Erro ao obter plano do usuário:', error);
    return 'free'; // Em caso de erro, retorna plano free
  }
}

/**
 * Obtém os limites do plano do usuário
 */
export async function getUserPlanLimits(userId: string): Promise<PlanLimits> {
  const plan = await getUserPlan(userId);
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

/**
 * Obtém os módulos disponíveis do plano do usuário
 */
export async function getUserPlanModules(userId: string): Promise<PlanModules> {
  const plan = await getUserPlan(userId);
  return PLAN_MODULES[plan] || PLAN_MODULES.free;
}

/**
 * Verifica se o usuário pode criar mais pacientes
 */
export async function canCreatePatient(userId: string): Promise<{ allowed: boolean; current: number; limit: number }> {
  const limits = await getUserPlanLimits(userId);
  
  if (limits.patients === -1) {
    return { allowed: true, current: 0, limit: -1 };
  }

  const currentCount = await prisma.patient.count({
    where: { userId }
  });

  return {
    allowed: currentCount < limits.patients,
    current: currentCount,
    limit: limits.patients
  };
}

/**
 * Verifica se o usuário pode criar mais transações neste mês
 */
export async function canCreateTransaction(userId: string): Promise<{ allowed: boolean; current: number; limit: number }> {
  const limits = await getUserPlanLimits(userId);
  
  if (limits.transactionsPerMonth === -1) {
    return { allowed: true, current: 0, limit: -1 };
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const currentCount = await prisma.transaction.count({
    where: {
      userId,
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    }
  });

  return {
    allowed: currentCount < limits.transactionsPerMonth,
    current: currentCount,
    limit: limits.transactionsPerMonth
  };
}

/**
 * Verifica se o usuário pode criar mais agendamentos neste mês
 */
export async function canCreateAppointment(userId: string): Promise<{ allowed: boolean; current: number; limit: number }> {
  const limits = await getUserPlanLimits(userId);
  
  if (limits.appointmentsPerMonth === -1) {
    return { allowed: true, current: 0, limit: -1 };
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();

  const currentCount = await prisma.appointment.count({
    where: {
      userId,
      startTime: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    }
  });

  return {
    allowed: currentCount < limits.appointmentsPerMonth,
    current: currentCount,
    limit: limits.appointmentsPerMonth
  };
}

/**
 * Verifica se um módulo está disponível no plano do usuário
 */
export async function hasModuleAccess(userId: string, module: keyof PlanModules): Promise<boolean> {
  const modules = await getUserPlanModules(userId);
  const access = modules[module];
  
  if (typeof access === 'boolean') {
    return access;
  }
  
  // Se for 'basic' ou 'advanced', considera como acesso permitido
  return access !== false;
}

/**
 * Verifica se o módulo está disponível em modo avançado
 */
export async function hasAdvancedModuleAccess(userId: string, module: keyof PlanModules): Promise<boolean> {
  const modules = await getUserPlanModules(userId);
  const access = modules[module];
  return access === 'advanced' || access === true;
}
