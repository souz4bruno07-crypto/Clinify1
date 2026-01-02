import React, { useState, useEffect, useMemo } from 'react';
import { 
  Target, Trophy, TrendingUp, Users, DollarSign, Award, 
  Flame, Crown, Medal, Star, Zap, Gift, Calendar, 
  ChevronRight, Settings2, Download, CheckCircle2, X,
  Sparkles, BarChart3, ArrowUpRight, Clock, Percent
} from 'lucide-react';
import { Staff, Transaction, StaffPerformance, StaffTarget, CommissionPaymentReport } from '../../../types';
import { getStaff, getTransactions } from '../../../services/backendService';
import { AnimatedNumber, Tooltip } from '../../ui';

// Formatador para números no padrão brasileiro
const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 0 });

// Badges do sistema de gamificação
const BADGES = {
  firstSale: { id: 'first_sale', name: 'Primeira Venda', icon: '🎯', description: 'Realizou a primeira venda', type: 'milestone' },
  streak3: { id: 'streak_3', name: 'Em Chamas', icon: '🔥', description: '3 meses consecutivos na meta', type: 'achievement' },
  streak6: { id: 'streak_6', name: 'Imparável', icon: '⚡', description: '6 meses consecutivos na meta', type: 'achievement' },
  topPerformer: { id: 'top_performer', name: 'Top Performer', icon: '👑', description: 'Líder do ranking', type: 'special' },
  overachiever: { id: 'overachiever', name: 'Superação', icon: '🚀', description: 'Ultrapassou 150% da meta', type: 'achievement' },
  consistency: { id: 'consistency', name: 'Consistência', icon: '💎', description: 'Bateu meta por 12 meses', type: 'milestone' },
};

const RANK_COLORS = ['from-amber-400 to-amber-600', 'from-slate-300 to-slate-500', 'from-amber-600 to-amber-800'];
const RANK_ICONS = [Crown, Medal, Award];

interface CommissionsTabProps {
  user: any;
}

const CommissionsTab: React.FC<CommissionsTabProps> = ({ user }) => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  });
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [staffTargets, setStaffTargets] = useState<Record<string, StaffTarget>>({});

  // Carregar dados
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CommissionsTab.tsx:49',message:'Iniciando carregamento de dados',data:{userId:user.id,selectedMonth},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        // Usar user.id ao invés de user.clinicId (as rotas usam req.userId do token)
        const [staffData, txData] = await Promise.all([
          getStaff(user.id),
          getTransactions(user.id)
        ]);
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CommissionsTab.tsx:56',message:'Dados carregados do backend',data:{staffCount:staffData.length,transactionsCount:txData?.data?.length||0,staffIds:staffData.map(s=>s.id),staffNames:staffData.map(s=>s.name)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        console.log('🔍 [CommissionsTab] DEBUG INICIADO');
        console.log('👥 Staff carregado:', staffData.length, staffData.map(s => ({ id: s.id, name: s.name })));
        console.log('💰 Transações carregadas:', txData?.data?.length || 0);
        
        // Log das primeiras transações para debug
        if (txData?.data && txData.data.length > 0) {
          const revenueTxs = txData.data.filter(t => t.type === 'revenue');
          const withTags = revenueTxs.filter(t => t.tags);
          const withoutTags = revenueTxs.filter(t => !t.tags);
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CommissionsTab.tsx:64',message:'Análise de transações de receita',data:{total:txData.data.length,receitas:revenueTxs.length,comTags:withTags.length,semTags:withoutTags.length,exemploTag:withTags[0]?.tags||null,exemploSemTag:withoutTags[0]?.description||null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          
          console.log('📊 RESUMO:', {
            total: txData.data.length,
            receitas: revenueTxs.length,
            comTags: withTags.length,
            semTags: withoutTags.length
          });
          
          if (withTags.length > 0) {
            console.log('✅ Exemplo de transação COM tag:', {
              description: withTags[0].description,
              tags: withTags[0].tags,
              date: new Date(withTags[0].date).toLocaleDateString('pt-BR')
            });
            console.log('🏷️ Primeiras 5 tags únicas:', [...new Set(withTags.slice(0, 5).map(t => t.tags))]);
          } else {
            console.log('❌ PROBLEMA: Nenhuma transação de receita tem tags!');
            if (revenueTxs.length > 0) {
              console.log('📝 Exemplo de transação SEM tag:', {
                description: revenueTxs[0].description,
                tags: revenueTxs[0].tags,
                hasTags: !!revenueTxs[0].tags
              });
            }
          }
          
          // Comparar com staff
          if (staffData.length > 0 && withTags.length > 0) {
            const firstStaff = staffData[0];
            const firstTag = withTags[0].tags;
            const tagParts = firstTag?.split(',') || [];
            
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CommissionsTab.tsx:97',message:'Comparação tag vs staff',data:{staffId:firstStaff.id,staffName:firstStaff.name,tagCompleta:firstTag,tagPart1:tagParts[0],tagPart2:tagParts[1],matchId:tagParts[0]===firstStaff.id,matchName:tagParts[1]===firstStaff.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            
            console.log('🔗 COMPARAÇÃO:', {
              staffId: firstStaff.id,
              staffName: firstStaff.name,
              tagCompleta: firstTag,
              tagPart1: tagParts[0],
              tagPart2: tagParts[1],
              matchId: tagParts[0] === firstStaff.id,
              matchName: tagParts[1] === firstStaff.name
            });
          }
        }
        
        setStaff(staffData);
        setTransactions(txData?.data || []);
        
        // Carregar metas salvas do localStorage (em produção seria do backend)
        const savedTargets = localStorage.getItem(`staffTargets_${selectedMonth}`);
        if (savedTargets) {
          setStaffTargets(JSON.parse(savedTargets));
        }
      } catch (error) {
        console.error('[CommissionsTab] Erro ao carregar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user, selectedMonth]);

  // Calcular performance de cada profissional
  const performanceData = useMemo((): StaffPerformance[] => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const startOfMonth = new Date(year, month - 1, 1).getTime();
    const endOfMonth = new Date(year, month, 0, 23, 59, 59).getTime();
    const now = Date.now();
    const daysInMonth = new Date(year, month, 0).getDate();
    const daysPassed = Math.min(new Date().getDate(), daysInMonth);

    // OTIMIZAÇÃO: Criar um Map de transações agrupadas por staffId ANTES do loop
    // Isso reduz a complexidade de O(n*m) para O(n+m) onde n=transações, m=staff
    const transactionsByStaff = new Map<string, typeof transactions>();
    
    // Primeiro, filtrar apenas transações de receita no período (uma vez só)
    const revenueInPeriod = transactions.filter(tx => {
      return tx.type === 'revenue' && 
             tx.date >= startOfMonth && 
             tx.date <= endOfMonth &&
             tx.tags; // Apenas transações com tags
    });

    // Agrupar transações por staffId usando o Map
    for (const tx of revenueInPeriod) {
      const tagsStr = String(tx.tags || '').trim();
      if (!tagsStr) continue;
      
      const tagParts = tagsStr.split(',');
      const tagStaffId = tagParts[0]?.toLowerCase().trim();
      
      if (!tagStaffId) continue;
      
      // Usar o staffId da tag como chave
      if (!transactionsByStaff.has(tagStaffId)) {
        transactionsByStaff.set(tagStaffId, []);
      }
      transactionsByStaff.get(tagStaffId)!.push(tx);
    }

    // Também criar um Map por nome para fallback
    const transactionsByStaffName = new Map<string, typeof transactions>();
    for (const tx of revenueInPeriod) {
      const tagsStr = String(tx.tags || '').trim();
      if (!tagsStr) continue;
      
      const tagParts = tagsStr.split(',');
      const tagStaffName = tagParts[1]?.toLowerCase().trim();
      
      if (!tagStaffName) continue;
      
      if (!transactionsByStaffName.has(tagStaffName)) {
        transactionsByStaffName.set(tagStaffName, []);
      }
      transactionsByStaffName.get(tagStaffName)!.push(tx);
    }

    return staff.map((s, idx) => {
      // Buscar transações do Map ao invés de filtrar todas as transações
      const staffIdLower = String(s.id || '').toLowerCase();
      const staffNameLower = String(s.name || '').toLowerCase();
      
      // Buscar por ID primeiro (mais preciso)
      let staffTx = transactionsByStaff.get(staffIdLower) || [];
      
      // Se não encontrou por ID, tentar por nome (fallback)
      if (staffTx.length === 0) {
        staffTx = transactionsByStaffName.get(staffNameLower) || [];
      }
      
      // #region agent log
      if (idx === 0) {
        fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CommissionsTab.tsx:202',message:'Resultado do filtro otimizado para primeiro staff',data:{staffId:s.id,staffName:s.name,staffTxCount:staffTx.length,selectedMonth,startOfMonth:new Date(startOfMonth).toISOString(),endOfMonth:new Date(endOfMonth).toISOString(),totalRevenueInPeriod:revenueInPeriod.length},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
      }
      // #endregion
      
      // Debug apenas para o primeiro staff e se não encontrou transações
      if (idx === 0 && staffTx.length === 0) {
        const revenueInMonth = transactions.filter(tx => 
          tx.type === 'revenue' && 
          tx.date >= startOfMonth && 
          tx.date <= endOfMonth
        );
        const withTags = revenueInMonth.filter(tx => tx.tags);
        
        // Verificar todas as tags únicas para ver o formato
        const uniqueTags = [...new Set(withTags.map(tx => tx.tags).filter(Boolean))];
        
        console.log('[CommissionsTab] Debug - Primeiro staff sem transações:', {
          staffId: s.id,
          staffName: s.name,
          totalRevenueInMonth: revenueInMonth.length,
          revenueWithTags: withTags.length,
          uniqueTags: uniqueTags.slice(0, 5), // Primeiras 5 tags únicas
          sampleTag: withTags[0]?.tags,
          sampleStaffId: s.id,
          sampleStaffName: s.name,
          // Testar match manualmente
          testMatchById: withTags[0]?.tags?.toLowerCase().includes(s.id.toLowerCase()),
          testMatchByName: withTags[0]?.tags?.toLowerCase().includes(s.name.toLowerCase()),
          // Mostrar todas as tags das primeiras 3 transações
          firstThreeTags: withTags.slice(0, 3).map(tx => ({
            description: tx.description,
            tags: tx.tags,
            date: new Date(tx.date).toLocaleDateString('pt-BR')
          }))
        });
      }

      const achievedRevenue = staffTx.reduce((sum, tx) => sum + tx.amount, 0);
      const proceduresCount = staffTx.length;
      const avgTicket = proceduresCount > 0 ? achievedRevenue / proceduresCount : 0;
      
      // Meta do profissional (do estado ou padrão)
      const target = staffTargets[s.id];
      const targetRevenue = target?.targetRevenue || 15000;
      const commissionRate = target?.commissionRate || s.commissionRate || 30;
      const bonusThreshold = target?.bonusThreshold || 100;
      const bonusRate = target?.bonusRate || 10;
      
      const progressPercent = targetRevenue > 0 ? (achievedRevenue / targetRevenue) * 100 : 0;
      const totalCommission = (achievedRevenue * commissionRate) / 100;
      
      // Bônus se atingiu threshold
      const bonusEarned = progressPercent >= bonusThreshold 
        ? (achievedRevenue * bonusRate) / 100 
        : 0;

      // Projeção baseada na média diária
      const dailyAverage = daysPassed > 0 ? achievedRevenue / daysPassed : 0;
      const projectedRevenue = dailyAverage * daysInMonth;
      const projectedCommission = (projectedRevenue * commissionRate) / 100;

      // Streak simulado (em produção viria do backend)
      const streak = Math.floor(Math.random() * 6);

      // Badges baseados em performance
      const badges = [];
      if (proceduresCount > 0) badges.push(BADGES.firstSale);
      if (streak >= 3) badges.push(BADGES.streak3);
      if (streak >= 6) badges.push(BADGES.streak6);
      if (progressPercent >= 150) badges.push(BADGES.overachiever);

      return {
        staffId: s.id,
        staffName: s.name,
        staffColor: s.color,
        monthYear: selectedMonth,
        targetRevenue,
        achievedRevenue,
        progressPercent,
        proceduresCount,
        avgTicket,
        commissionRate,
        totalCommission,
        bonusEarned,
        projectedRevenue,
        projectedCommission,
        ranking: 0, // Será calculado depois
        streak,
        badges: badges as any[]
      };
    }).sort((a, b) => b.achievedRevenue - a.achievedRevenue)
      .map((p, idx) => ({ ...p, ranking: idx + 1 }));
  }, [staff, transactions, selectedMonth, staffTargets]);

  // Totais
  const totals = useMemo(() => {
    const totalRevenue = performanceData.reduce((sum, p) => sum + p.achievedRevenue, 0);
    const totalCommissions = performanceData.reduce((sum, p) => sum + p.totalCommission + p.bonusEarned, 0);
    const totalTarget = performanceData.reduce((sum, p) => sum + p.targetRevenue, 0);
    const avgProgress = performanceData.length > 0 
      ? performanceData.reduce((sum, p) => sum + p.progressPercent, 0) / performanceData.length 
      : 0;
    const totalProjected = performanceData.reduce((sum, p) => sum + p.projectedRevenue, 0);
    
    return { totalRevenue, totalCommissions, totalTarget, avgProgress, totalProjected };
  }, [performanceData]);

  // Meses disponíveis
  const availableMonths = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`);
    }
    return months;
  }, []);

  const formatMonth = (monthYear: string) => {
    const [year, month] = monthYear.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const handleSaveTarget = (staffId: string, target: Partial<StaffTarget>) => {
    const newTargets = {
      ...staffTargets,
      [staffId]: {
        ...staffTargets[staffId],
        ...target,
        id: staffId,
        staffId,
        updatedAt: Date.now()
      } as StaffTarget
    };
    setStaffTargets(newTargets);
    localStorage.setItem(`staffTargets_${selectedMonth}`, JSON.stringify(newTargets));
    setIsTargetModalOpen(false);
    setSelectedStaff(null);
  };

  const generatePaymentReport = (): CommissionPaymentReport[] => {
    return performanceData.map(p => ({
      id: `report_${p.staffId}_${selectedMonth}`,
      monthYear: selectedMonth,
      staffId: p.staffId,
      staffName: p.staffName,
      totalProcedures: p.proceduresCount,
      totalRevenue: p.achievedRevenue,
      baseCommission: p.totalCommission,
      bonusCommission: p.bonusEarned,
      totalCommission: p.totalCommission + p.bonusEarned,
      deductions: 0,
      netPayable: p.totalCommission + p.bonusEarned,
      status: 'draft' as const
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg shadow-amber-500/30">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            Metas & Comissões
          </h2>
          <p className="text-slate-600 dark:text-slate-500 mt-1">Acompanhe performance e recompense sua equipe</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Seletor de Mês */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            {availableMonths.map(m => (
              <option key={m} value={m}>{formatMonth(m)}</option>
            ))}
          </select>

          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <Download className="w-4 h-4" />
            Relatório
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Faturamento</span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
            <AnimatedNumber value={totals.totalRevenue} prefix="R$ " formatter={formatCurrency} />
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-500 mt-1">de R$ {totals.totalTarget.toLocaleString('pt-BR')}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-2xl">
              <Trophy className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-xs font-black text-amber-600 uppercase tracking-widest">Comissões</span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
            <AnimatedNumber value={totals.totalCommissions} prefix="R$ " formatter={formatCurrency} />
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-500 mt-1">a pagar no mês</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Progresso</span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
            <AnimatedNumber value={totals.avgProgress} suffix="%" decimals={1} />
          </p>
          <div className="mt-2 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(totals.avgProgress, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-xs font-black text-purple-600 uppercase tracking-widest">Projeção</span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
            <AnimatedNumber value={totals.totalProjected} prefix="R$ " formatter={formatCurrency} />
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-500 mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3 text-emerald-500" />
            até fim do mês
          </p>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Ranking Gamificado */}
        <div className="xl:col-span-1 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 p-6 rounded-3xl border border-slate-700 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl shadow-lg">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-black text-white">Ranking do Mês</h3>
          </div>

          <div className="space-y-4">
            {performanceData.slice(0, 5).map((p, idx) => {
              const RankIcon = RANK_ICONS[idx] || Star;
              const isTop3 = idx < 3;
              
              return (
                <div 
                  key={p.staffId}
                  className={`relative p-4 rounded-2xl transition-all hover:scale-[1.02] ${
                    isTop3 
                      ? 'bg-gradient-to-r from-white/10 to-white/5 border border-white/10' 
                      : 'bg-white/5'
                  }`}
                >
                  {/* Posição */}
                  <div className={`absolute -left-2 -top-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                    isTop3 
                      ? `bg-gradient-to-br ${RANK_COLORS[idx]}` 
                      : 'bg-slate-700'
                  }`}>
                    {isTop3 ? (
                      <RankIcon className="w-4 h-4 text-white" />
                    ) : (
                      <span className="text-xs font-black text-white">{idx + 1}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 ml-4">
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black ${p.staffColor}`}>
                      {p.staffName.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white truncate">{p.staffName}</p>
                        {p.streak >= 3 && (
                          <Tooltip content={`${p.streak} meses consecutivos na meta!`}>
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-500/20 rounded-full">
                              <Flame className="w-3 h-3 text-orange-400" />
                              <span className="text-[10px] font-bold text-orange-400">{p.streak}</span>
                            </span>
                          </Tooltip>
                        )}
                      </div>
                      
                      {/* Barra de Progresso */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${
                              p.progressPercent >= 100 
                                ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' 
                                : 'bg-gradient-to-r from-amber-400 to-amber-500'
                            }`}
                            style={{ width: `${Math.min(p.progressPercent, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-black ${
                          p.progressPercent >= 100 ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          {p.progressPercent.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Valor */}
                    <div className="text-right">
                      <p className="text-sm font-black text-white tabular-nums">
                        R$ {p.achievedRevenue.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                        {p.proceduresCount} proc.
                      </p>
                    </div>
                  </div>

                  {/* Badges */}
                  {p.badges.length > 0 && (
                    <div className="flex gap-1 mt-2 ml-16">
                      {p.badges.slice(0, 3).map((badge, bIdx) => (
                        <Tooltip key={bIdx} content={badge.description}>
                          <span className="text-sm">{badge.icon}</span>
                        </Tooltip>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* CTA */}
          {performanceData.length > 5 && (
            <button className="w-full mt-4 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center gap-1">
              Ver todos os {performanceData.length} profissionais
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Cards de Profissionais */}
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              Performance Individual
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {performanceData.map((p) => (
              <div 
                key={p.staffId}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black shadow-sm ${p.staffColor}`}>
                      {p.staffName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{p.staffName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500">{p.commissionRate}% comissão</span>
                        {p.ranking <= 3 && (
                          <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                            <Trophy className="w-3 h-3 text-amber-600" />
                            <span className="text-[10px] font-bold text-amber-600">#{p.ranking}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => { setSelectedStaff(staff.find(s => s.id === p.staffId) || null); setIsTargetModalOpen(true); }}
                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Settings2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Barra de Progresso Grande */}
                <div className="relative mb-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-500">Meta do mês</span>
                    <span className={`font-black ${p.progressPercent >= 100 ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                      {p.progressPercent.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 relative ${
                        p.progressPercent >= 100 
                          ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' 
                          : p.progressPercent >= 70
                            ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                            : 'bg-gradient-to-r from-rose-400 to-rose-500'
                      }`}
                      style={{ width: `${Math.min(p.progressPercent, 100)}%` }}
                    >
                      {p.progressPercent >= 100 && (
                        <div className="absolute right-1 top-1/2 -translate-y-1/2">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>R$ {p.achievedRevenue.toLocaleString('pt-BR')}</span>
                    <span>Meta: R$ {p.targetRevenue.toLocaleString('pt-BR')}</span>
                  </div>
                </div>

                {/* Métricas */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">Proced.</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white">{p.proceduresCount}</p>
                  </div>
                  <div className="text-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">Ticket</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white">
                      R$ {p.avgTicket.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
                    <p className="text-[10px] font-black text-emerald-600 uppercase mb-0.5">Comissão</p>
                    <p className="text-lg font-black text-emerald-600">
                      R$ {(p.totalCommission + p.bonusEarned).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>

                {/* Projeção */}
                <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-100 dark:border-purple-800/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-bold text-purple-700 dark:text-purple-400">Projeção</span>
                    </div>
                    <span className="text-sm font-black text-purple-700 dark:text-purple-400">
                      R$ {p.projectedRevenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty State */}
            {performanceData.length === 0 && (
              <div className="col-span-2 text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-slate-500 font-medium">Nenhum profissional cadastrado</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Adicione profissionais na aba Equipe Pro</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Configurar Meta */}
      {isTargetModalOpen && selectedStaff && (
        <TargetModal
          staff={selectedStaff}
          currentTarget={staffTargets[selectedStaff.id]}
          monthYear={selectedMonth}
          onClose={() => { setIsTargetModalOpen(false); setSelectedStaff(null); }}
          onSave={(target) => handleSaveTarget(selectedStaff.id, target)}
        />
      )}

      {/* Modal de Relatório */}
      {isReportModalOpen && (
        <PaymentReportModal
          reports={generatePaymentReport()}
          monthYear={selectedMonth}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </div>
  );
};

// Modal para configurar meta individual
interface TargetModalProps {
  staff: Staff;
  currentTarget?: StaffTarget;
  monthYear: string;
  onClose: () => void;
  onSave: (target: Partial<StaffTarget>) => void;
}

const TargetModal: React.FC<TargetModalProps> = ({ staff, currentTarget, monthYear, onClose, onSave }) => {
  const [targetRevenue, setTargetRevenue] = useState(currentTarget?.targetRevenue || 15000);
  const [commissionRate, setCommissionRate] = useState(currentTarget?.commissionRate || staff.commissionRate || 30);
  const [bonusThreshold, setBonusThreshold] = useState(currentTarget?.bonusThreshold || 100);
  const [bonusRate, setBonusRate] = useState(currentTarget?.bonusRate || 10);

  const formatMonth = (my: string) => {
    const [year, month] = my.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black ${staff.color}`}>
                {staff.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{staff.name}</h3>
                <p className="text-sm text-slate-500">{formatMonth(monthYear)}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/50 dark:hover:bg-slate-800 rounded-full text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Meta de Faturamento */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Target className="w-3 h-3" /> Meta de Faturamento
            </label>
            <div className="relative mt-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
              <input
                type="number"
                value={targetRevenue}
                onChange={(e) => setTargetRevenue(Number(e.target.value))}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold text-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Taxa de Comissão */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Percent className="w-3 h-3" /> Taxa de Comissão Base
            </label>
            <div className="relative mt-2">
              <input
                type="number"
                min="0"
                max="100"
                value={commissionRate}
                onChange={(e) => setCommissionRate(Number(e.target.value))}
                className="w-full pr-12 pl-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold text-lg focus:ring-2 focus:ring-amber-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Comissão prevista: R$ {((targetRevenue * commissionRate) / 100).toLocaleString('pt-BR')}
            </p>
          </div>

          {/* Configuração de Bônus */}
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
            <h4 className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2 mb-3">
              <Gift className="w-4 h-4" /> Bônus por Meta
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-black text-emerald-600 uppercase">Threshold (%)</label>
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={bonusThreshold}
                  onChange={(e) => setBonusThreshold(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded-lg font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-emerald-600 uppercase">Bônus (%)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={bonusRate}
                  onChange={(e) => setBonusRate(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded-lg font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
              Ao atingir {bonusThreshold}% da meta, recebe +{bonusRate}% adicional
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={() => onSave({ targetRevenue, commissionRate, bonusThreshold, bonusRate, staffName: staff.name, monthYear })}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-amber-500/30 transition-all"
          >
            <CheckCircle2 className="w-5 h-5" />
            Salvar Meta
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal de Relatório de Pagamento
interface PaymentReportModalProps {
  reports: CommissionPaymentReport[];
  monthYear: string;
  onClose: () => void;
}

const PaymentReportModal: React.FC<PaymentReportModalProps> = ({ reports, monthYear, onClose }) => {
  const total = reports.reduce((sum, r) => sum + r.netPayable, 0);

  const formatMonth = (my: string) => {
    const [year, month] = my.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const handleExport = () => {
    const csv = [
      ['Profissional', 'Procedimentos', 'Faturamento', 'Comissão Base', 'Bônus', 'Total', 'Deduções', 'Líquido'],
      ...reports.map(r => [
        r.staffName,
        r.totalProcedures,
        r.totalRevenue.toFixed(2),
        r.baseCommission.toFixed(2),
        r.bonusCommission.toFixed(2),
        r.totalCommission.toFixed(2),
        r.deductions.toFixed(2),
        r.netPayable.toFixed(2)
      ])
    ].map(row => row.join(';')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `comissoes_${monthYear}.csv`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-emerald-600" />
              Relatório de Comissões
            </h3>
            <p className="text-sm text-slate-500 mt-1">{formatMonth(monthYear)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-6">
          <table className="w-full">
            <thead className="text-left">
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="pb-3 text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Profissional</th>
                <th className="pb-3 text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest text-center">Proced.</th>
                <th className="pb-3 text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest text-right">Faturamento</th>
                <th className="pb-3 text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest text-right">Comissão</th>
                <th className="pb-3 text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest text-right">Bônus</th>
                <th className="pb-3 text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest text-right">Líquido</th>
                <th className="pb-3 text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="py-4">
                    <p className="font-bold text-slate-900 dark:text-white">{r.staffName}</p>
                  </td>
                  <td className="py-4 text-center">
                    <span className="font-bold text-slate-600 dark:text-slate-400">{r.totalProcedures}</span>
                  </td>
                  <td className="py-4 text-right">
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                      R$ {r.totalRevenue.toLocaleString('pt-BR')}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <span className="font-bold text-slate-600 dark:text-slate-400 tabular-nums">
                      R$ {r.baseCommission.toLocaleString('pt-BR')}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <span className={`font-bold tabular-nums ${r.bonusCommission > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {r.bonusCommission > 0 ? `+ R$ ${r.bonusCommission.toLocaleString('pt-BR')}` : '-'}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <span className="font-black text-emerald-600 tabular-nums text-lg">
                      R$ {r.netPayable.toLocaleString('pt-BR')}
                    </span>
                  </td>
                  <td className="py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                      r.status === 'paid' 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : r.status === 'approved'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {r.status === 'paid' ? 'Pago' : r.status === 'approved' ? 'Aprovado' : 'Rascunho'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 dark:border-slate-700">
                <td colSpan={5} className="py-4 text-right">
                  <span className="text-sm font-black text-slate-500 uppercase">Total a Pagar</span>
                </td>
                <td className="py-4 text-right">
                  <span className="font-black text-2xl text-emerald-600 tabular-nums">
                    R$ {total.toLocaleString('pt-BR')}
                  </span>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between shrink-0">
          <p className="text-sm text-slate-500">
            <Clock className="w-4 h-4 inline mr-1" />
            Relatório gerado em {new Date().toLocaleDateString('pt-BR', { dateStyle: 'long' })}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              Fechar
            </button>
            <button
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold flex items-center gap-2 hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              Aprovar Pagamentos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommissionsTab;

