import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Crown,
  Star,
  Gift,
  Users,
  Trophy,
  Sparkles,
  Gem,
  Medal,
  Target,
  TrendingUp,
  Copy,
  Check,
  ChevronRight,
  Heart,
  Zap,
  Award,
  Share2,
  Clock,
  Ticket,
  ShoppingBag,
  Percent,
  AlertCircle,
  X,
  PartyPopper,
  Flame
} from 'lucide-react';
import {
  LoyaltyTier,
  LoyaltyLevel,
  PatientLoyalty,
  LoyaltyReward,
  LoyaltyRedemption,
  LoyaltyReferral,
  Patient
} from '../../types';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Modal, { ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '../ui/Modal';
import Button from '../ui/Button';

// ============================================
// CONFIGURAÇÃO DOS NÍVEIS
// ============================================

const LOYALTY_LEVELS: LoyaltyLevel[] = [
  {
    tier: 'bronze',
    name: 'Bronze',
    minPoints: 0,
    maxPoints: 999,
    icon: '🥉',
    color: 'from-amber-600 to-amber-700',
    benefits: ['5% de desconto em procedimentos', 'Acesso a promoções exclusivas'],
    discountPercent: 5
  },
  {
    tier: 'silver',
    name: 'Prata',
    minPoints: 1000,
    maxPoints: 4999,
    icon: '🥈',
    color: 'from-slate-400 to-slate-500',
    benefits: ['10% de desconto em procedimentos', 'Brindes em consultas', 'Prioridade no agendamento'],
    discountPercent: 10
  },
  {
    tier: 'gold',
    name: 'Ouro',
    minPoints: 5000,
    maxPoints: 14999,
    icon: '🥇',
    color: 'from-yellow-400 to-amber-500',
    benefits: ['15% de desconto em procedimentos', 'Procedimento grátis anual', 'Atendimento VIP', 'Brindes premium'],
    discountPercent: 15
  },
  {
    tier: 'diamond',
    name: 'Diamante',
    minPoints: 15000,
    maxPoints: Infinity,
    icon: '💎',
    color: 'from-cyan-400 to-blue-500',
    benefits: ['20% de desconto em procedimentos', '2 procedimentos grátis/ano', 'Concierge exclusivo', 'Eventos VIP', 'Parceiro premium'],
    discountPercent: 20
  }
];

// ============================================
// RECOMPENSAS DISPONÍVEIS
// ============================================

const AVAILABLE_REWARDS: LoyaltyReward[] = [
  {
    id: '1',
    name: 'Desconto 10%',
    description: 'Cupom de 10% em qualquer procedimento',
    pointsCost: 500,
    type: 'discount',
    value: 10,
    isActive: true,
    validDays: 30,
    category: 'beauty'
  },
  {
    id: '2',
    name: 'Kit Skincare',
    description: 'Kit completo de cuidados com a pele',
    pointsCost: 1500,
    type: 'product',
    value: 150,
    isActive: true,
    stock: 20,
    validDays: 60,
    category: 'beauty'
  },
  {
    id: '3',
    name: 'Limpeza de Pele',
    description: 'Uma sessão completa de limpeza de pele',
    pointsCost: 2500,
    type: 'procedure',
    value: 250,
    isActive: true,
    tier: 'silver',
    validDays: 90,
    category: 'beauty'
  },
  {
    id: '4',
    name: 'Voucher R$100',
    description: 'Voucher de R$100 para usar em qualquer serviço',
    pointsCost: 3000,
    type: 'voucher',
    value: 100,
    isActive: true,
    tier: 'silver',
    validDays: 60,
    category: 'special'
  },
  {
    id: '5',
    name: 'Desconto 25%',
    description: 'Cupom de 25% em procedimentos estéticos',
    pointsCost: 4000,
    type: 'discount',
    value: 25,
    isActive: true,
    tier: 'gold',
    validDays: 45,
    category: 'beauty'
  },
  {
    id: '6',
    name: 'Botox Completo',
    description: 'Aplicação completa de toxina botulínica',
    pointsCost: 8000,
    type: 'procedure',
    value: 1500,
    isActive: true,
    tier: 'gold',
    validDays: 120,
    category: 'beauty'
  },
  {
    id: '7',
    name: 'Day Spa VIP',
    description: 'Dia completo de spa com todos os tratamentos',
    pointsCost: 12000,
    type: 'procedure',
    value: 2000,
    isActive: true,
    tier: 'diamond',
    validDays: 180,
    category: 'wellness'
  },
  {
    id: '8',
    name: 'Voucher R$500',
    description: 'Voucher premium de R$500',
    pointsCost: 15000,
    type: 'voucher',
    value: 500,
    isActive: true,
    tier: 'diamond',
    validDays: 90,
    category: 'special'
  }
];

// ============================================
// HOOK PARA ANIMAÇÃO DE NÚMEROS
// ============================================

const useCountUp = (end: number, duration: number = 1500) => {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * end));
      
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    
    startTimeRef.current = null;
    rafRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [end, duration]);

  return count;
};

// ============================================
// COMPONENTE DE NÍVEL COM ANIMAÇÃO
// ============================================

const TierBadge: React.FC<{ tier: LoyaltyTier; size?: 'sm' | 'md' | 'lg'; animate?: boolean }> = ({ 
  tier, 
  size = 'md',
  animate = true 
}) => {
  const level = LOYALTY_LEVELS.find(l => l.tier === tier)!;
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-14 h-14 text-2xl',
    lg: 'w-20 h-20 text-4xl'
  };

  return (
    <div className={`
      ${sizeClasses[size]} 
      rounded-2xl bg-gradient-to-br ${level.color} 
      flex items-center justify-center shadow-lg
      ${animate ? 'animate-pulse' : ''}
      transition-transform hover:scale-110
    `}>
      <span className="drop-shadow-lg">{level.icon}</span>
    </div>
  );
};

// ============================================
// BARRA DE PROGRESSO DO NÍVEL
// ============================================

const LevelProgressBar: React.FC<{ 
  currentPoints: number; 
  currentLevel: LoyaltyLevel;
  nextLevel: LoyaltyLevel | null;
}> = ({ currentPoints, currentLevel, nextLevel }) => {
  const progressPercent = nextLevel 
    ? ((currentPoints - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100
    : 100;

  const pointsToNext = nextLevel ? nextLevel.minPoints - currentPoints : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{currentLevel.icon}</span>
          <span className="font-bold text-slate-600 dark:text-slate-300">{currentLevel.name}</span>
        </div>
        {nextLevel && (
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">{nextLevel.name}</span>
            <span className="text-2xl">{nextLevel.icon}</span>
          </div>
        )}
      </div>
      
      <div className="relative">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
          <div 
            className={`h-full bg-gradient-to-r ${currentLevel.color} rounded-full transition-all duration-1000 ease-out relative`}
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg border-2 border-current"></div>
          </div>
        </div>
        
        {/* Marcadores de nível */}
        <div className="absolute top-full mt-2 left-0 right-0 flex justify-between">
          <span className="text-xs font-bold text-slate-400">{currentLevel.minPoints.toLocaleString()} pts</span>
          {nextLevel && (
            <span className="text-xs font-bold text-slate-400">{nextLevel.minPoints.toLocaleString()} pts</span>
          )}
        </div>
      </div>

      {nextLevel && pointsToNext > 0 && (
        <div className="text-center mt-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Faltam <span className="font-black text-lg text-slate-900 dark:text-white">{pointsToNext.toLocaleString()}</span> pontos para {nextLevel.name}
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================
// CARD DE RECOMPENSA
// ============================================

const RewardCard: React.FC<{ 
  reward: LoyaltyReward; 
  currentPoints: number;
  currentTier: LoyaltyTier;
  onRedeem: (reward: LoyaltyReward) => void;
}> = ({ reward, currentPoints, currentTier, onRedeem }) => {
  const canAfford = currentPoints >= reward.pointsCost;
  const tierOrder: LoyaltyTier[] = ['bronze', 'silver', 'gold', 'diamond'];
  const meetsMinTier = !reward.tier || tierOrder.indexOf(currentTier) >= tierOrder.indexOf(reward.tier);
  const canRedeem = canAfford && meetsMinTier && reward.isActive && (reward.stock === undefined || reward.stock > 0);

  const typeIcons = {
    discount: <Percent className="w-5 h-5" />,
    product: <ShoppingBag className="w-5 h-5" />,
    procedure: <Heart className="w-5 h-5" />,
    voucher: <Ticket className="w-5 h-5" />
  };

  const typeColors = {
    discount: 'bg-emerald-500',
    product: 'bg-purple-500',
    procedure: 'bg-rose-500',
    voucher: 'bg-amber-500'
  };

  const categoryColors = {
    beauty: 'border-pink-200 dark:border-pink-800',
    health: 'border-emerald-200 dark:border-emerald-800',
    wellness: 'border-blue-200 dark:border-blue-800',
    special: 'border-amber-200 dark:border-amber-800'
  };

  return (
    <div className={`
      relative bg-white dark:bg-slate-900 rounded-3xl p-6 
      border-2 ${categoryColors[reward.category]}
      shadow-lg hover:shadow-xl transition-all duration-300
      ${!canRedeem ? 'opacity-60' : 'hover:scale-[1.02] hover:-translate-y-1'}
      group
    `}>
      {/* Badge de tipo */}
      <div className={`absolute -top-3 -right-3 ${typeColors[reward.type]} text-white p-2.5 rounded-xl shadow-lg`}>
        {typeIcons[reward.type]}
      </div>

      {/* Badge de nível mínimo */}
      {reward.tier && (
        <div className="absolute top-4 left-4">
          <TierBadge tier={reward.tier} size="sm" animate={false} />
        </div>
      )}

      <div className="mt-8 mb-4">
        <h3 className="font-black text-lg text-slate-900 dark:text-white tracking-tight">{reward.name}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{reward.description}</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          <span className="font-black text-xl text-slate-900 dark:text-white">
            {reward.pointsCost.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400">pts</span>
        </div>

        <button
          onClick={() => canRedeem && onRedeem(reward)}
          disabled={!canRedeem}
          className={`
            px-4 py-2 rounded-xl font-bold text-sm transition-all
            ${canRedeem 
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-emerald-500/30' 
              : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'}
          `}
        >
          {!meetsMinTier ? 'Nível insuficiente' : !canAfford ? 'Pontos insuficientes' : 'Resgatar'}
        </button>
      </div>

      {reward.stock !== undefined && reward.stock <= 5 && (
        <div className="mt-3 flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
          <AlertCircle className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-wide">
            Apenas {reward.stock} restantes
          </span>
        </div>
      )}

      {/* Validade */}
      <div className="mt-3 flex items-center gap-1.5 text-slate-400">
        <Clock className="w-3.5 h-3.5" />
        <span className="text-[10px] font-medium">
          Válido por {reward.validDays} dias após resgate
        </span>
      </div>
    </div>
  );
};

// ============================================
// CARD DE RESGATE ATIVO
// ============================================

const RedemptionCard: React.FC<{ redemption: LoyaltyRedemption }> = ({ redemption }) => {
  const [copied, setCopied] = useState(false);
  const daysLeft = Math.ceil((redemption.expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
  const isExpired = daysLeft <= 0;
  const isUsed = redemption.status === 'used';

  const copyCode = () => {
    navigator.clipboard.writeText(redemption.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`
      relative bg-gradient-to-br rounded-2xl p-5 text-white
      ${isUsed ? 'from-slate-500 to-slate-600 opacity-60' : 
        isExpired ? 'from-rose-500 to-rose-600' : 
        'from-emerald-500 to-emerald-600'}
      shadow-lg
    `}>
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-black text-lg">{redemption.rewardName}</h4>
          <p className="text-white/70 text-xs mt-0.5">
            {isUsed ? 'Utilizado' : isExpired ? 'Expirado' : `${daysLeft} dias restantes`}
          </p>
        </div>
        <div className={`p-2 rounded-lg ${isUsed || isExpired ? 'bg-white/10' : 'bg-white/20'}`}>
          {isUsed ? <Check className="w-5 h-5" /> : isExpired ? <X className="w-5 h-5" /> : <Ticket className="w-5 h-5" />}
        </div>
      </div>

      {!isUsed && !isExpired && (
        <div className="mt-4 flex items-center gap-2">
          <div className="flex-1 bg-white/20 rounded-lg px-3 py-2 font-mono font-bold text-lg tracking-widest">
            {redemption.code}
          </div>
          <button
            onClick={copyCode}
            className="p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================
// CARD DE INDICAÇÃO
// ============================================

const ReferralSection: React.FC<{ 
  referralCode: string;
  referrals: LoyaltyReferral[];
  bonusPoints: number;
}> = ({ referralCode, referrals, bonusPoints }) => {
  const [copied, setCopied] = useState(false);
  const completedReferrals = referrals.filter(r => r.status === 'completed').length;

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = `Olá! Use meu código ${referralCode} para ganhar pontos na Clinify! 🎁`;

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareLink)}`, '_blank');
  };

  return (
    <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
      <div className="absolute top-1/2 right-1/4 opacity-10">
        <Users className="w-32 h-32" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">Indique Amigos</p>
            <h3 className="text-2xl font-black tracking-tight italic">Ganhe Pontos Extras</h3>
          </div>
        </div>

        <p className="text-white/80 text-sm mb-6">
          Indique amigos e ganhe <span className="font-black text-yellow-300">{bonusPoints} pontos</span> quando eles fizerem a primeira consulta!
        </p>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 mb-6 border border-white/10">
          <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-2">Seu Código de Indicação</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white/20 rounded-xl px-4 py-3 font-mono font-black text-2xl tracking-[0.3em] text-center">
              {referralCode}
            </div>
            <button
              onClick={copyCode}
              className={`p-3 rounded-xl transition-all ${copied ? 'bg-emerald-500' : 'bg-white/20 hover:bg-white/30'}`}
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-center">
            <p className="text-4xl font-black">{completedReferrals}</p>
            <p className="text-[10px] font-bold text-white/60 uppercase mt-1">Indicações Concluídas</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-center">
            <p className="text-4xl font-black">{(completedReferrals * bonusPoints).toLocaleString()}</p>
            <p className="text-[10px] font-bold text-white/60 uppercase mt-1">Pontos Ganhos</p>
          </div>
        </div>

        <button
          onClick={shareWhatsApp}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-4 px-6 rounded-2xl transition-all hover:scale-[1.02] shadow-lg hover:shadow-emerald-500/30 flex items-center justify-center gap-3"
        >
          <Share2 className="w-5 h-5" />
          Compartilhar no WhatsApp
        </button>
      </div>
    </div>
  );
};

// ============================================
// HISTÓRICO DE PONTOS
// ============================================

const PointsHistory: React.FC<{ history: PatientLoyalty['pointsHistory'] }> = ({ history }) => {
  const sourceIcons = {
    consultation: <Heart className="w-4 h-4" />,
    procedure: <Zap className="w-4 h-4" />,
    referral: <Users className="w-4 h-4" />,
    birthday: <PartyPopper className="w-4 h-4" />,
    review: <Star className="w-4 h-4" />,
    bonus: <Gift className="w-4 h-4" />
  };

  const sourceColors = {
    consultation: 'bg-blue-500',
    procedure: 'bg-emerald-500',
    referral: 'bg-purple-500',
    birthday: 'bg-pink-500',
    review: 'bg-amber-500',
    bonus: 'bg-indigo-500'
  };

  return (
    <div className="space-y-3">
      {history.slice(0, 10).map((item, index) => (
        <div 
          key={item.id}
          className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors animate-in slide-in-from-right duration-300"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className={`p-2.5 rounded-xl text-white ${sourceColors[item.source]}`}>
            {sourceIcons[item.source]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{item.description}</p>
            <p className="text-xs text-slate-400">
              {new Date(item.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div className="text-right">
            <p className="font-black text-lg text-emerald-500">+{item.points}</p>
            <p className="text-[10px] text-slate-400 font-bold">pontos</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

interface LoyaltyTabProps {
  patient: Patient;
  patientLoyalty?: PatientLoyalty;
  onUpdateLoyalty?: (loyalty: PatientLoyalty) => void;
}

const LoyaltyTab: React.FC<LoyaltyTabProps> = ({ patient, patientLoyalty, onUpdateLoyalty }) => {
  const [selectedReward, setSelectedReward] = useState<LoyaltyReward | null>(null);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'rewards' | 'history' | 'referrals'>('overview');

  // Mock data para demonstração
  const mockLoyalty: PatientLoyalty = patientLoyalty || {
    id: '1',
    patientId: patient.id,
    patientName: patient.name,
    totalPoints: 3750,
    availablePoints: 2250,
    tier: 'silver',
    totalConsultations: 12,
    totalProcedures: 8,
    totalReferrals: 3,
    referralCode: 'CLINIFY2024',
    joinedAt: Date.now() - 180 * 24 * 60 * 60 * 1000,
    lastActivityAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    pointsHistory: [
      { id: '1', patientId: patient.id, points: 150, source: 'procedure', description: 'Limpeza de Pele Premium', createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000 },
      { id: '2', patientId: patient.id, points: 500, source: 'referral', description: 'Indicação: Maria Silva', createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000 },
      { id: '3', patientId: patient.id, points: 100, source: 'consultation', description: 'Consulta de Retorno', createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000 },
      { id: '4', patientId: patient.id, points: 200, source: 'procedure', description: 'Aplicação de Botox', createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000 },
      { id: '5', patientId: patient.id, points: 50, source: 'review', description: 'Avaliação 5 estrelas', createdAt: Date.now() - 35 * 24 * 60 * 60 * 1000 },
      { id: '6', patientId: patient.id, points: 100, source: 'birthday', description: 'Bônus de Aniversário 🎂', createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000 },
      { id: '7', patientId: patient.id, points: 500, source: 'referral', description: 'Indicação: João Santos', createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000 },
      { id: '8', patientId: patient.id, points: 300, source: 'bonus', description: 'Bônus de Boas-Vindas', createdAt: Date.now() - 180 * 24 * 60 * 60 * 1000 },
    ],
    redemptions: [
      { id: '1', patientId: patient.id, rewardId: '1', rewardName: 'Desconto 10%', pointsSpent: 500, status: 'pending', code: 'DESC10-ABC123', createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000, expiresAt: Date.now() + 20 * 24 * 60 * 60 * 1000 },
      { id: '2', patientId: patient.id, rewardId: '2', rewardName: 'Kit Skincare', pointsSpent: 1500, status: 'used', code: 'KIT-XYZ789', createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000, expiresAt: Date.now() - 30 * 24 * 60 * 60 * 1000, usedAt: Date.now() - 45 * 24 * 60 * 60 * 1000 },
    ],
    referrals: [
      { id: '1', referrerId: patient.id, referrerName: patient.name, referredId: '2', referredName: 'Maria Silva', status: 'completed', bonusPoints: 500, code: 'REF001', createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000, completedAt: Date.now() - 10 * 24 * 60 * 60 * 1000 },
      { id: '2', referrerId: patient.id, referrerName: patient.name, referredId: '3', referredName: 'João Santos', status: 'completed', bonusPoints: 500, code: 'REF002', createdAt: Date.now() - 100 * 24 * 60 * 60 * 1000, completedAt: Date.now() - 90 * 24 * 60 * 60 * 1000 },
      { id: '3', referrerId: patient.id, referrerName: patient.name, referredId: '4', referredName: 'Ana Costa', status: 'pending', bonusPoints: 500, code: 'REF003', createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000 },
    ]
  };

  const currentLevel = LOYALTY_LEVELS.find(l => 
    mockLoyalty.totalPoints >= l.minPoints && mockLoyalty.totalPoints <= l.maxPoints
  ) || LOYALTY_LEVELS[0];

  const nextLevel = LOYALTY_LEVELS.find(l => l.minPoints > mockLoyalty.totalPoints) || null;

  const animatedPoints = useCountUp(mockLoyalty.availablePoints, 2000);

  const handleRedeem = (reward: LoyaltyReward) => {
    setSelectedReward(reward);
    setShowRedeemModal(true);
  };

  const confirmRedeem = () => {
    // Aqui implementaria a lógica real de resgate
    setShowRedeemModal(false);
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 3000);
  };

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: <Trophy className="w-4 h-4" /> },
    { id: 'rewards', label: 'Recompensas', icon: <Gift className="w-4 h-4" /> },
    { id: 'history', label: 'Histórico', icon: <Clock className="w-4 h-4" /> },
    { id: 'referrals', label: 'Indicações', icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER COM SALDO DE PONTOS */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
        {/* Decorações de fundo */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5">
            <Crown className="w-96 h-96" />
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-6">
              <TierBadge tier={mockLoyalty.tier} size="lg" />
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-3xl font-black tracking-tight">{patient.name}</h2>
                  <Badge variant="success" dot pulse>Membro {currentLevel.name}</Badge>
                </div>
                <p className="text-slate-400 text-sm">
                  Membro desde {new Date(mockLoyalty.joinedAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Star className="w-6 h-6 text-amber-400 fill-amber-400 animate-pulse" />
                  <span className="text-5xl font-black tracking-tight">{animatedPoints.toLocaleString()}</span>
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pontos Disponíveis</p>
              </div>
              <div className="h-16 w-px bg-slate-700"></div>
              <div className="text-center">
                <p className="text-3xl font-black tracking-tight text-slate-300">{mockLoyalty.totalPoints.toLocaleString()}</p>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pontos Totais</p>
              </div>
            </div>
          </div>

          {/* Barra de progresso do nível */}
          <div className="mt-8 pt-6 border-t border-slate-700/50">
            <LevelProgressBar 
              currentPoints={mockLoyalty.totalPoints}
              currentLevel={currentLevel}
              nextLevel={nextLevel}
            />
          </div>
        </div>
      </div>

      {/* NAVEGAÇÃO DE TABS */}
      <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`
              flex-1 min-w-max flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all
              ${activeTab === tab.id 
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-lg' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTEÚDO DAS TABS */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* BENEFÍCIOS DO NÍVEL */}
          <Card variant="default" className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${currentLevel.color} text-white`}>
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Benefícios</p>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight italic">Nível {currentLevel.name}</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentLevel.benefits.map((benefit, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl animate-in slide-in-from-left duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="p-2 bg-emerald-500 text-white rounded-lg">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Próximos níveis */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Próximos Níveis</p>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {LOYALTY_LEVELS.filter(l => l.minPoints > mockLoyalty.totalPoints).map((level, index) => (
                  <div 
                    key={level.tier}
                    className="flex-shrink-0 flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700"
                  >
                    <span className="text-2xl">{level.icon}</span>
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">{level.name}</p>
                      <p className="text-[10px] text-slate-400">{level.minPoints.toLocaleString()} pts</p>
                    </div>
                    <div className="ml-2 text-right">
                      <p className="text-[10px] text-slate-400">Desconto</p>
                      <p className="font-black text-emerald-500">{level.discountPercent}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* ESTATÍSTICAS */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <Heart className="w-8 h-8 opacity-50" />
                <Flame className="w-5 h-5 animate-pulse" />
              </div>
              <p className="text-5xl font-black">{mockLoyalty.totalConsultations}</p>
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">Consultas Realizadas</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <Zap className="w-8 h-8 opacity-50" />
                <TrendingUp className="w-5 h-5" />
              </div>
              <p className="text-5xl font-black">{mockLoyalty.totalProcedures}</p>
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">Procedimentos</p>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 opacity-50" />
                <Award className="w-5 h-5" />
              </div>
              <p className="text-5xl font-black">{mockLoyalty.totalReferrals}</p>
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">Amigos Indicados</p>
            </div>
          </div>

          {/* RESGATES ATIVOS */}
          <Card variant="default" className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500 text-white">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meus Resgates</p>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight italic">Cupons Ativos</h3>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('rewards')}
                className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Ver recompensas
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {mockLoyalty.redemptions.filter(r => r.status === 'pending').length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockLoyalty.redemptions.filter(r => r.status === 'pending').map(redemption => (
                  <RedemptionCard key={redemption.id} redemption={redemption} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <Gift className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Nenhum cupom ativo</p>
                <p className="text-sm text-slate-400 mt-1">Resgate suas recompensas agora!</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'rewards' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Recompensas Disponíveis</h3>
              <p className="text-sm text-slate-500 mt-1">Use seus pontos para resgatar prêmios incríveis</p>
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl">
              <Star className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-600 dark:fill-emerald-400" />
              <span className="font-black text-emerald-600 dark:text-emerald-400">{mockLoyalty.availablePoints.toLocaleString()} pts</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {AVAILABLE_REWARDS.map(reward => (
              <RewardCard 
                key={reward.id}
                reward={reward}
                currentPoints={mockLoyalty.availablePoints}
                currentTier={mockLoyalty.tier}
                onRedeem={handleRedeem}
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <Card variant="default">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-indigo-500 text-white">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Atividade</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight italic">Histórico de Pontos</h3>
            </div>
          </div>
          <PointsHistory history={mockLoyalty.pointsHistory} />
        </Card>
      )}

      {activeTab === 'referrals' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ReferralSection 
            referralCode={mockLoyalty.referralCode}
            referrals={mockLoyalty.referrals}
            bonusPoints={500}
          />

          <Card variant="default">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-purple-500 text-white">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Histórico</p>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight italic">Minhas Indicações</h3>
              </div>
            </div>

            <div className="space-y-3">
              {mockLoyalty.referrals.map((referral, index) => (
                <div 
                  key={referral.id}
                  className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl animate-in slide-in-from-right duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg
                    ${referral.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'}
                  `}>
                    {referral.referredName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{referral.referredName}</p>
                    <p className="text-xs text-slate-400">
                      {referral.status === 'completed' 
                        ? `Concluída em ${new Date(referral.completedAt!).toLocaleDateString('pt-BR')}`
                        : 'Aguardando primeira consulta'}
                    </p>
                  </div>
                  <div className="text-right">
                    {referral.status === 'completed' ? (
                      <>
                        <p className="font-black text-lg text-emerald-500">+{referral.bonusPoints}</p>
                        <p className="text-[10px] text-slate-400 font-bold">pontos</p>
                      </>
                    ) : (
                      <Badge variant="warning" size="sm">Pendente</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* MODAL DE RESGATE */}
      <Modal isOpen={showRedeemModal} onClose={() => setShowRedeemModal(false)} size="md">
        <ModalHeader icon={<Gift className="w-6 h-6" />}>
          <ModalTitle>Confirmar Resgate</ModalTitle>
          <ModalDescription>Você está prestes a resgatar uma recompensa</ModalDescription>
        </ModalHeader>
        <ModalBody>
          {selectedReward && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white">
                <Gift className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2">{selectedReward.name}</h4>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{selectedReward.description}</p>
              
              <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-6 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-500">Custo:</span>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    <span className="font-black text-xl text-slate-900 dark:text-white">{selectedReward.pointsCost.toLocaleString()}</span>
                    <span className="text-slate-400">pts</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Saldo após resgate:</span>
                  <span className="font-bold text-emerald-500">
                    {(mockLoyalty.availablePoints - selectedReward.pointsCost).toLocaleString()} pts
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Válido por {selectedReward.validDays} dias após resgate
              </p>
            </div>
          )}
        </ModalBody>
        <ModalFooter className="justify-end">
          <Button variant="ghost" onClick={() => setShowRedeemModal(false)}>Cancelar</Button>
          <Button onClick={confirmRedeem}>
            <Gift className="w-4 h-4 mr-2" />
            Confirmar Resgate
          </Button>
        </ModalFooter>
      </Modal>

      {/* MODAL DE SUCESSO */}
      <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} size="sm" showCloseButton={false}>
        <div className="p-10 text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white animate-bounce">
            <Check className="w-12 h-12" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Resgate Realizado!</h3>
          <p className="text-slate-500 dark:text-slate-400">
            Seu cupom foi gerado com sucesso. Confira em "Meus Resgates".
          </p>
          <div className="mt-6">
            <Sparkles className="w-8 h-8 mx-auto text-amber-500 animate-pulse" />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LoyaltyTab;












