import React, { useState, useMemo, useEffect } from 'react';
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
  Settings,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  ChevronDown,
  Award,
  Zap,
  BarChart3,
  PieChart,
  Download,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  ShoppingBag,
  Ticket,
  Heart
} from 'lucide-react';
import {
  LoyaltyTier,
  LoyaltyLevel,
  PatientLoyalty,
  LoyaltyReward,
  Patient
} from '../../types';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Modal, { ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { formatCurrency } from '../../utils/formatters';
import * as XLSX from 'xlsx';
import { useToast } from '../../contexts/ToastContext';
import { getLoyaltyMembers, getLoyaltyRewards } from '../../services/backendService';
import { useAuth } from '../../contexts/AuthContextAPI';

// ============================================
// CONFIGURAÇÃO DOS NÍVEIS (mesma do LoyaltyTab)
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
// MOCK DATA PARA DEMONSTRAÇÃO (removido - usar dados reais do backend)
// ============================================

const mockRewards: LoyaltyReward[] = [
  { id: '1', name: 'Desconto 10%', description: 'Cupom de 10%', pointsCost: 500, type: 'discount', value: 10, isActive: true, validDays: 30, category: 'beauty' },
  { id: '2', name: 'Kit Skincare', description: 'Kit completo', pointsCost: 1500, type: 'product', value: 150, isActive: true, stock: 15, validDays: 60, category: 'beauty' },
  { id: '3', name: 'Limpeza de Pele', description: 'Uma sessão', pointsCost: 2500, type: 'procedure', value: 250, isActive: true, tier: 'silver', validDays: 90, category: 'beauty' },
  { id: '4', name: 'Voucher R$100', description: 'Qualquer serviço', pointsCost: 3000, type: 'voucher', value: 100, isActive: true, tier: 'silver', validDays: 60, category: 'special' },
  { id: '5', name: 'Botox Completo', description: 'Aplicação completa', pointsCost: 8000, type: 'procedure', value: 1500, isActive: false, tier: 'gold', validDays: 120, category: 'beauty' },
];

// ============================================
// COMPONENTE DE KPI CARD
// ============================================

const KPICard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  gradient: string;
}> = ({ title, value, subtitle, icon, trend, gradient }) => (
  <div className={`bg-gradient-to-br ${gradient} rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden group`}>
    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
      {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-24 h-24' })}
    </div>
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
          {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold ${trend.isPositive ? 'text-emerald-300' : 'text-rose-300'}`}>
            {trend.isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <p className="text-4xl font-black tracking-tight">{value}</p>
      <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mt-1">{title}</p>
      {subtitle && <p className="text-xs text-white/60 mt-2">{subtitle}</p>}
    </div>
  </div>
);

// ============================================
// COMPONENTE DE TIER BADGE
// ============================================

const TierBadge: React.FC<{ tier: LoyaltyTier; size?: 'sm' | 'md' }> = ({ tier, size = 'md' }) => {
  const level = LOYALTY_LEVELS.find(l => l.tier === tier)!;
  const sizeClasses = size === 'sm' ? 'w-8 h-8 text-lg' : 'w-10 h-10 text-xl';
  
  return (
    <div className={`${sizeClasses} rounded-xl bg-gradient-to-br ${level.color} flex items-center justify-center shadow-lg`}>
      <span>{level.icon}</span>
    </div>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

interface LoyaltyAdminTabProps {
  clinicId: string;
  patients: Patient[];
}

const LoyaltyAdminTab: React.FC<LoyaltyAdminTabProps> = ({ clinicId, patients }) => {
  const toast = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<LoyaltyTier | 'all'>('all');
  const [showAddPointsModal, setShowAddPointsModal] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientLoyalty | null>(null);
  const [activeTab, setActiveTab] = useState<'members' | 'rewards' | 'settings'>('members');
  const [patientLoyalties, setPatientLoyalties] = useState<PatientLoyalty[]>([]);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Estatísticas
  const stats = useMemo(() => {
    const totalMembers = patientLoyalties.length;
    const totalPoints = patientLoyalties.reduce((sum, p) => sum + p.totalPoints, 0);
    const totalRedemptions = patientLoyalties.reduce((sum, p) => sum + (p.redemptions?.length || 0), 0);
    const activeRewards = rewards.filter(r => r.isActive).length;
    
    const tierDistribution = {
      bronze: patientLoyalties.filter(p => p.tier === 'bronze').length,
      silver: patientLoyalties.filter(p => p.tier === 'silver').length,
      gold: patientLoyalties.filter(p => p.tier === 'gold').length,
      diamond: patientLoyalties.filter(p => p.tier === 'diamond').length,
    };

    return { totalMembers, totalPoints, totalRedemptions, activeRewards, tierDistribution };
  }, [patientLoyalties]);

  // Filtrar membros
  const filteredMembers = useMemo(() => {
    return patientLoyalties.filter(p => {
      const matchesSearch = p.patientName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTier = tierFilter === 'all' || p.tier === tierFilter;
      return matchesSearch && matchesTier;
    });
  }, [patientLoyalties, searchTerm, tierFilter]);

  // Função de exportação
  const handleExport = () => {
    if (patientLoyalties.length === 0) {
      toast.error('Não há dados de fidelidade para exportar');
      return;
    }

    const dataToExport = patientLoyalties.map(p => ({
      'Nome': p.patientName,
      'Código de Indicação': p.referralCode,
      'Nível': LOYALTY_LEVELS.find(l => l.tier === p.tier)?.name || p.tier,
      'Pontos Totais': p.totalPoints,
      'Pontos Disponíveis': p.availablePoints,
      'Consultas': p.totalConsultations,
      'Procedimentos': p.totalProcedures,
      'Indicações': p.totalReferrals,
      'Data de Entrada': new Date(p.joinedAt).toLocaleDateString('pt-BR'),
      'Última Atividade': new Date(p.lastActivityAt).toLocaleDateString('pt-BR')
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Membros Fidelidade');
    XLSX.writeFile(wb, `fidelidade-clinify-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Carregar dados de fidelidade
  useEffect(() => {
    const loadLoyaltyData = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        const [members, rewardsData] = await Promise.all([
          getLoyaltyMembers(user.id),
          getLoyaltyRewards(user.id)
        ]);
        setPatientLoyalties(members);
        setRewards(rewardsData);
      } catch (error) {
        console.error('Erro ao carregar dados de fidelidade:', error);
        toast.error('Erro ao carregar dados de fidelidade');
      } finally {
        setIsLoading(false);
      }
    };

    loadLoyaltyData();
  }, [user?.id, clinicId]);

  const openAddPoints = (patient: PatientLoyalty) => {
    setSelectedPatient(patient);
    setShowAddPointsModal(true);
  };

  const tabs = [
    { id: 'members', label: 'Membros', icon: <Users className="w-4 h-4" /> },
    { id: 'rewards', label: 'Recompensas', icon: <Gift className="w-4 h-4" /> },
    { id: 'settings', label: 'Configurações', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl text-white shadow-lg">
              <Crown className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Programa de Fidelidade</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400">Gerencie pontos, recompensas e níveis dos seus pacientes</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" leftIcon={<Download className="w-4 h-4" />} onClick={handleExport}>
            Exportar
          </Button>
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowRewardModal(true)}>
            Nova Recompensa
          </Button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Membros Ativos"
          value={stats.totalMembers}
          subtitle="Participando do programa"
          icon={<Users />}
          gradient="from-indigo-500 to-indigo-600"
          trend={{ value: 12, isPositive: true }}
        />
        <KPICard
          title="Pontos Distribuídos"
          value={stats.totalPoints.toLocaleString()}
          subtitle="Total acumulado"
          icon={<Star />}
          gradient="from-amber-500 to-orange-500"
          trend={{ value: 23, isPositive: true }}
        />
        <KPICard
          title="Resgates"
          value={stats.totalRedemptions}
          subtitle="Recompensas utilizadas"
          icon={<Gift />}
          gradient="from-emerald-500 to-emerald-600"
          trend={{ value: 8, isPositive: true }}
        />
        <KPICard
          title="Recompensas"
          value={stats.activeRewards}
          subtitle="Disponíveis"
          icon={<Trophy />}
          gradient="from-purple-500 to-purple-600"
        />
      </div>

      {/* DISTRIBUIÇÃO POR TIER */}
      <Card variant="default">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-xl">
              <BarChart3 className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Distribuição</p>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Membros por Nível</h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {LOYALTY_LEVELS.map((level) => {
            const count = stats.tierDistribution[level.tier];
            const percentage = stats.totalMembers > 0 ? (count / stats.totalMembers * 100).toFixed(0) : 0;
            
            return (
              <div key={level.tier} className="relative">
                <div className={`bg-gradient-to-br ${level.color} rounded-2xl p-5 text-white text-center relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-white/10"></div>
                  <span className="text-4xl mb-2 block relative z-10">{level.icon}</span>
                  <p className="text-3xl font-black relative z-10">{count}</p>
                  <p className="text-xs font-bold text-white/80 relative z-10">{level.name}</p>
                </div>
                <div className="text-center mt-2">
                  <span className="text-xs font-bold text-slate-400">{percentage}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* NAVEGAÇÃO DE TABS */}
      <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`
              flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all
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
      {activeTab === 'members' && (
        <Card variant="default" padding="none">
          {/* Barra de busca e filtros */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar membro..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                {['all', 'bronze', 'silver', 'gold', 'diamond'].map(tier => {
                  const level = tier === 'all' ? null : LOYALTY_LEVELS.find(l => l.tier === tier);
                  return (
                    <button
                      key={tier}
                      onClick={() => setTierFilter(tier as typeof tierFilter)}
                      className={`
                        px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2
                        ${tierFilter === tier 
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}
                      `}
                    >
                      {level ? <span>{level.icon}</span> : <Filter className="w-4 h-4" />}
                      {tier === 'all' ? 'Todos' : level?.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Lista de membros */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredMembers.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium text-lg">Nenhum membro encontrado</p>
                <p className="text-sm text-slate-400 mt-2">
                  {searchTerm || tierFilter !== 'all' 
                    ? 'Tente ajustar os filtros de busca' 
                    : 'Não há dados de fidelidade cadastrados'}
                </p>
              </div>
            ) : (
              filteredMembers.map((member, index) => (
              <div 
                key={member.id}
                className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors animate-in slide-in-from-bottom duration-300"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-6">
                  {/* Avatar e Badge */}
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-2xl flex items-center justify-center text-xl font-black text-slate-500 dark:text-slate-300">
                      {member.patientName.charAt(0)}
                    </div>
                    <div className="absolute -bottom-1 -right-1">
                      <TierBadge tier={member.tier} size="sm" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">{member.patientName}</h3>
                      <Badge variant={member.tier === 'diamond' ? 'purple' : member.tier === 'gold' ? 'warning' : 'default'} size="sm">
                        {LOYALTY_LEVELS.find(l => l.tier === member.tier)?.name}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400">
                      Código: <span className="font-mono font-bold">{member.referralCode}</span> • 
                      Última atividade: {new Date(member.lastActivityAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="hidden lg:flex items-center gap-8 text-center">
                    <div>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">{member.availablePoints.toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Pontos</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">{member.totalConsultations}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Consultas</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">{member.totalReferrals}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Indicações</p>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => openAddPoints(member)}
                      className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                      title="Adicionar pontos"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <button 
                      className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title="Ver detalhes"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )))}
          </div>
        </Card>
      )}

      {activeTab === 'rewards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rewards.length === 0 ? (
            <div className="col-span-full p-12 text-center">
              <Gift className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium text-lg">Nenhuma recompensa cadastrada</p>
              <p className="text-sm text-slate-400 mt-2">Crie sua primeira recompensa para começar</p>
            </div>
          ) : (
            rewards.map((reward, index) => {
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

            return (
              <div 
                key={reward.id}
                className={`
                  bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 
                  ${reward.isActive ? 'border-slate-200 dark:border-slate-800' : 'border-rose-200 dark:border-rose-800 opacity-60'}
                  shadow-lg hover:shadow-xl transition-all duration-300 animate-in fade-in duration-300
                  relative overflow-hidden
                `}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  {reward.isActive ? (
                    <Badge variant="success" dot>Ativo</Badge>
                  ) : (
                    <Badge variant="danger" dot>Inativo</Badge>
                  )}
                </div>

                {/* Icon */}
                <div className={`${typeColors[reward.type]} p-3 rounded-xl text-white w-fit mb-4`}>
                  {typeIcons[reward.type]}
                </div>

                <h3 className="font-black text-lg text-slate-900 dark:text-white mb-1">{reward.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{reward.description}</p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    <span className="font-black text-lg text-slate-900 dark:text-white">{reward.pointsCost.toLocaleString()}</span>
                    <span className="text-xs text-slate-400">pts</span>
                  </div>

                  {reward.tier && (
                    <TierBadge tier={reward.tier} size="sm" />
                  )}
                </div>

                {reward.stock !== undefined && (
                  <div className="mt-3 text-xs text-slate-400">
                    Estoque: <span className="font-bold text-slate-600 dark:text-slate-300">{reward.stock} unidades</span>
                  </div>
                )}

                {/* Ações */}
                <div className="flex gap-2 mt-4">
                  <button className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  <button className="p-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
            })
          )}

          {/* Card de adicionar nova recompensa */}
          <button 
            onClick={() => setShowRewardModal(true)}
            className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all min-h-[280px] flex flex-col items-center justify-center gap-4 group"
          >
            <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-2xl group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 transition-colors">
              <Plus className="w-8 h-8 text-slate-400 group-hover:text-emerald-500" />
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-600 dark:text-slate-300">Nova Recompensa</p>
              <p className="text-sm text-slate-400">Clique para adicionar</p>
            </div>
          </button>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configurações de Pontos */}
          <Card variant="default">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-amber-500 text-white">
                <Star className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Regras</p>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Pontuação</h3>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <Heart className="w-5 h-5 text-blue-500" />
                  <span className="font-medium text-slate-700 dark:text-slate-300">Por consulta</span>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    defaultValue={100}
                    className="w-20 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-right font-bold"
                  />
                  <span className="text-sm text-slate-400">pts</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-emerald-500" />
                  <span className="font-medium text-slate-700 dark:text-slate-300">Por R$100 gastos</span>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    defaultValue={50}
                    className="w-20 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-right font-bold"
                  />
                  <span className="text-sm text-slate-400">pts</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-500" />
                  <span className="font-medium text-slate-700 dark:text-slate-300">Por indicação</span>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    defaultValue={500}
                    className="w-20 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-right font-bold"
                  />
                  <span className="text-sm text-slate-400">pts</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-amber-500" />
                  <span className="font-medium text-slate-700 dark:text-slate-300">Por avaliação</span>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    defaultValue={50}
                    className="w-20 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-right font-bold"
                  />
                  <span className="text-sm text-slate-400">pts</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <Button fullWidth>Salvar Alterações</Button>
            </div>
          </Card>

          {/* Configurações de Níveis */}
          <Card variant="default">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Níveis</p>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Configuração de Tiers</h3>
              </div>
            </div>

            <div className="space-y-4">
              {LOYALTY_LEVELS.map(level => (
                <div key={level.tier} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{level.icon}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{level.name}</span>
                    </div>
                    <Badge variant="success">{level.discountPercent}% desc.</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Mínimo:</span>
                      <input 
                        type="number" 
                        defaultValue={level.minPoints}
                        className="w-24 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-right font-bold text-sm"
                      />
                    </div>
                    {level.maxPoints !== Infinity && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Máximo:</span>
                        <input 
                          type="number" 
                          defaultValue={level.maxPoints}
                          className="w-24 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-right font-bold text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <Button fullWidth>Salvar Configurações</Button>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL ADICIONAR PONTOS */}
      <Modal isOpen={showAddPointsModal} onClose={() => setShowAddPointsModal(false)} size="md">
        <ModalHeader icon={<Plus className="w-6 h-6" />}>
          <ModalTitle>Adicionar Pontos</ModalTitle>
          <ModalDescription>
            {selectedPatient ? `Adicionando pontos para ${selectedPatient.patientName}` : 'Selecione um paciente'}
          </ModalDescription>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Quantidade de Pontos
              </label>
              <input
                type="number"
                placeholder="Ex: 500"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-2xl text-center"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Motivo
              </label>
              <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="consultation">Consulta realizada</option>
                <option value="procedure">Procedimento realizado</option>
                <option value="referral">Indicação de amigo</option>
                <option value="birthday">Bônus de aniversário</option>
                <option value="review">Avaliação realizada</option>
                <option value="bonus">Bônus especial</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Descrição (opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Consulta de retorno - Dr. Silva"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="justify-end">
          <Button variant="ghost" onClick={() => setShowAddPointsModal(false)}>Cancelar</Button>
          <Button onClick={() => setShowAddPointsModal(false)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Pontos
          </Button>
        </ModalFooter>
      </Modal>

      {/* MODAL NOVA RECOMPENSA */}
      <Modal isOpen={showRewardModal} onClose={() => setShowRewardModal(false)} size="lg">
        <ModalHeader icon={<Gift className="w-6 h-6" />}>
          <ModalTitle>Nova Recompensa</ModalTitle>
          <ModalDescription>Configure uma nova recompensa para o programa de fidelidade</ModalDescription>
        </ModalHeader>
        <ModalBody>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Nome da Recompensa
              </label>
              <input
                type="text"
                placeholder="Ex: Desconto 20%"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Tipo
              </label>
              <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="discount">Desconto</option>
                <option value="product">Produto/Brinde</option>
                <option value="procedure">Procedimento</option>
                <option value="voucher">Voucher</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Descrição
              </label>
              <textarea
                placeholder="Descreva a recompensa..."
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Custo em Pontos
              </label>
              <input
                type="number"
                placeholder="Ex: 1000"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Valor (R$ ou %)
              </label>
              <input
                type="number"
                placeholder="Ex: 100"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Nível Mínimo
              </label>
              <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">Todos os níveis</option>
                <option value="bronze">🥉 Bronze</option>
                <option value="silver">🥈 Prata</option>
                <option value="gold">🥇 Ouro</option>
                <option value="diamond">💎 Diamante</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Validade (dias)
              </label>
              <input
                type="number"
                placeholder="Ex: 30"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Estoque (opcional)
              </label>
              <input
                type="number"
                placeholder="Ilimitado"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Categoria
              </label>
              <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="beauty">Beleza</option>
                <option value="health">Saúde</option>
                <option value="wellness">Bem-estar</option>
                <option value="special">Especial</option>
              </select>
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="justify-end">
          <Button variant="ghost" onClick={() => setShowRewardModal(false)}>Cancelar</Button>
          <Button onClick={() => setShowRewardModal(false)}>
            <Gift className="w-4 h-4 mr-2" />
            Criar Recompensa
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default LoyaltyAdminTab;








