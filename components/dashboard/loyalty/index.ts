// Componentes do Sistema de Fidelidade
export { default as LoyaltyTab } from '../LoyaltyTab';
export { default as LoyaltyAdminTab } from '../LoyaltyAdminTab';

// Tipos específicos de fidelidade (re-export para conveniência)
export type {
  LoyaltyTier,
  LoyaltyLevel,
  LoyaltyPoints,
  LoyaltyReward,
  LoyaltyRedemption,
  LoyaltyReferral,
  PatientLoyalty
} from '../../../types';

// Constantes de níveis
export const LOYALTY_LEVELS = [
  {
    tier: 'bronze' as const,
    name: 'Bronze',
    minPoints: 0,
    maxPoints: 999,
    icon: '🥉',
    color: 'from-amber-600 to-amber-700',
    benefits: ['5% de desconto em procedimentos', 'Acesso a promoções exclusivas'],
    discountPercent: 5
  },
  {
    tier: 'silver' as const,
    name: 'Prata',
    minPoints: 1000,
    maxPoints: 4999,
    icon: '🥈',
    color: 'from-slate-400 to-slate-500',
    benefits: ['10% de desconto em procedimentos', 'Brindes em consultas', 'Prioridade no agendamento'],
    discountPercent: 10
  },
  {
    tier: 'gold' as const,
    name: 'Ouro',
    minPoints: 5000,
    maxPoints: 14999,
    icon: '🥇',
    color: 'from-yellow-400 to-amber-500',
    benefits: ['15% de desconto em procedimentos', 'Procedimento grátis anual', 'Atendimento VIP', 'Brindes premium'],
    discountPercent: 15
  },
  {
    tier: 'diamond' as const,
    name: 'Diamante',
    minPoints: 15000,
    maxPoints: Infinity,
    icon: '💎',
    color: 'from-cyan-400 to-blue-500',
    benefits: ['20% de desconto em procedimentos', '2 procedimentos grátis/ano', 'Concierge exclusivo', 'Eventos VIP', 'Parceiro premium'],
    discountPercent: 20
  }
];

// Função utilitária para obter nível por pontos
export function getTierByPoints(points: number) {
  return LOYALTY_LEVELS.find(l => points >= l.minPoints && points <= l.maxPoints) || LOYALTY_LEVELS[0];
}

// Função utilitária para calcular progresso até próximo nível
export function calculateProgress(points: number) {
  const currentLevel = getTierByPoints(points);
  const currentIndex = LOYALTY_LEVELS.findIndex(l => l.tier === currentLevel.tier);
  const nextLevel = LOYALTY_LEVELS[currentIndex + 1];
  
  if (!nextLevel) {
    return { current: currentLevel, next: null, progress: 100, pointsToNext: 0 };
  }
  
  const pointsInLevel = points - currentLevel.minPoints;
  const levelRange = nextLevel.minPoints - currentLevel.minPoints;
  const progress = (pointsInLevel / levelRange) * 100;
  const pointsToNext = nextLevel.minPoints - points;
  
  return { current: currentLevel, next: nextLevel, progress, pointsToNext };
}

// Pontos padrão por ação
export const POINTS_CONFIG = {
  consultation: 100,
  procedurePerR$100: 50,
  referral: 500,
  review: 50,
  birthday: 100
};

// Gerar código de referência
export function generateReferralCode(name: string): string {
  const cleanName = name.split(' ')[0].toUpperCase().slice(0, 6);
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${cleanName}${year}${random}`;
}

// Gerar código de resgate
export function generateRedemptionCode(rewardType: string): string {
  const prefix = rewardType.toUpperCase().slice(0, 4);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${random}`;
}












