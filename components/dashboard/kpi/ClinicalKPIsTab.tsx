import React, { useMemo, useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import {
  UserCheck,
  UserX,
  Clock,
  Stethoscope,
  TrendingUp,
  DollarSign,
  Target,
  Users,
  Calendar,
  Activity,
  Award,
  Percent,
  Filter,
  RefreshCw,
  ChevronDown,
  Sparkles,
  HeartPulse,
  Zap,
  PiggyBank,
  Megaphone
} from 'lucide-react';
import { Transaction, Appointment, Quote, Patient } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';
import { 
  getAppointments, 
  getQuotes, 
  getPatients 
} from '../../../services/backendService';

// Hook para animação de números
const useCountUp = (end: number, duration: number = 1500) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let rafId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(easeOut * end);
      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [end, duration]);

  return count;
};

// Componente de número animado
const AnimatedValue: React.FC<{ 
  value: number; 
  prefix?: string; 
  suffix?: string; 
  decimals?: number;
  isCurrency?: boolean;
}> = ({ value, prefix = '', suffix = '', decimals = 0, isCurrency = false }) => {
  const animatedValue = useCountUp(value, 1500);
  const formatted = isCurrency 
    ? formatCurrency(animatedValue) 
    : animatedValue.toFixed(decimals);
  return <span>{prefix}{formatted}{suffix}</span>;
};

// Cores para gráficos
const CHART_COLORS = {
  primary: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  purple: '#8b5cf6',
  pink: '#ec4899',
  slate: '#64748b'
};

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

interface ClinicalKPIsTabProps {
  user: any;
  transactions: Transaction[];
  isLoading?: boolean;
}

type PeriodFilter = '7d' | '30d' | '90d' | '12m';

const ClinicalKPIsTab: React.FC<ClinicalKPIsTabProps> = ({ user, transactions }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Carregar dados
  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const now = Date.now();
      const yearAgo = now - 365 * 24 * 60 * 60 * 1000;
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ClinicalKPIsTab.tsx:127',message:'loadData iniciado',data:{userId:user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      const [appts, qts, ptsResponse] = await Promise.all([
        getAppointments(user.id, yearAgo, now),
        getQuotes(user.id),
        getPatients(user.id)
      ]);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ClinicalKPIsTab.tsx:133',message:'Dados recebidos',data:{apptsType:typeof appts,apptsIsArray:Array.isArray(appts),qtsType:typeof qts,qtsIsArray:Array.isArray(qts)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      // Extrair array do objeto { data: [...] } se necessário
      const appointmentsArray = Array.isArray(appts) ? appts : (appts?.data || []);
      setAppointments(appointmentsArray);
      setQuotes(Array.isArray(qts) ? qts : []);
      // getPatients retorna PaginatedResponse, extrair o array data
      setPatients('data' in ptsResponse ? ptsResponse.data : (ptsResponse as any));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    // Adicionar flag para evitar múltiplas chamadas simultâneas
    let cancelled = false;
    
    const doLoad = async () => {
      if (cancelled) return;
      await loadData();
    };
    
    doLoad();
    
    return () => {
      cancelled = true;
    };
  }, [user?.id]); // Usar user?.id ao invés de user para evitar re-renders desnecessários

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  // Período de análise
  const periodRange = useMemo(() => {
    const now = Date.now();
    const ranges: Record<PeriodFilter, number> = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '12m': 365 * 24 * 60 * 60 * 1000
    };
    return { start: now - ranges[period], end: now };
  }, [period]);

  // Filtrar dados pelo período
  const filteredData = useMemo(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ClinicalKPIsTab.tsx:166',message:'filteredData useMemo - antes de filter',data:{appointmentsType:typeof appointments,appointmentsIsArray:Array.isArray(appointments),quotesType:typeof quotes,quotesIsArray:Array.isArray(quotes),transactionsType:typeof transactions,transactionsIsArray:Array.isArray(transactions)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    const filteredAppointments = Array.isArray(appointments) ? appointments.filter(
      a => a.startTime >= periodRange.start && a.startTime <= periodRange.end
    ) : [];
    const filteredQuotes = Array.isArray(quotes) ? quotes.filter(
      q => q.createdAt >= periodRange.start && q.createdAt <= periodRange.end
    ) : [];
    const filteredTransactions = Array.isArray(transactions) ? transactions.filter(
      t => t.date >= periodRange.start && t.date <= periodRange.end
    ) : [];

    return { 
      appointments: filteredAppointments, 
      quotes: filteredQuotes,
      transactions: filteredTransactions
    };
  }, [appointments, quotes, transactions, periodRange]);

  // ================================
  // KPI 1: Taxa de Comparecimento vs Faltas
  // ================================
  const attendanceKPI = useMemo(() => {
    const total = filteredData.appointments.length;
    const completed = filteredData.appointments.filter(a => a.status === 'completed').length;
    const confirmed = filteredData.appointments.filter(a => a.status === 'confirmed').length;
    const canceled = filteredData.appointments.filter(a => a.status === 'canceled').length;
    const noShow = total - completed - confirmed - canceled; // Faltantes
    
    const attendanceRate = total > 0 ? ((completed + confirmed) / total) * 100 : 0;
    const noShowRate = total > 0 ? (noShow / total) * 100 : 0;
    const cancelRate = total > 0 ? (canceled / total) * 100 : 0;

    return {
      total,
      completed,
      confirmed,
      canceled,
      noShow,
      attendanceRate,
      noShowRate,
      cancelRate
    };
  }, [filteredData.appointments]);

  // Dados para gráfico de pizza de comparecimento
  const attendancePieData = useMemo(() => [
    { name: 'Compareceram', value: attendanceKPI.completed, color: CHART_COLORS.success },
    { name: 'Confirmados', value: attendanceKPI.confirmed, color: CHART_COLORS.info },
    { name: 'Cancelados', value: attendanceKPI.canceled, color: CHART_COLORS.warning },
    { name: 'Faltaram', value: attendanceKPI.noShow, color: CHART_COLORS.danger }
  ].filter(d => d.value > 0), [attendanceKPI]);

  // ================================
  // KPI 2: Tempo Médio de Consulta
  // ================================
  const avgConsultationTime = useMemo(() => {
    const completedAppts = filteredData.appointments.filter(a => a.status === 'completed');
    if (completedAppts.length === 0) return { avg: 0, min: 0, max: 0 };
    
    const durations = completedAppts.map(a => (a.endTime - a.startTime) / (1000 * 60)); // em minutos
    const avg = durations.reduce((s, d) => s + d, 0) / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    
    return { avg, min, max, count: completedAppts.length };
  }, [filteredData.appointments]);

  // ================================
  // KPI 3: Procedimentos Mais Realizados
  // ================================
  const topProcedures = useMemo(() => {
    const procedureMap = new Map<string, { count: number; revenue: number }>();
    
    filteredData.appointments
      .filter(a => a.status === 'completed')
      .forEach(a => {
        const current = procedureMap.get(a.serviceName) || { count: 0, revenue: 0 };
        procedureMap.set(a.serviceName, { 
          count: current.count + 1, 
          revenue: current.revenue 
        });
      });
    
    // Adicionar receita das transações que correspondem
    filteredData.transactions
      .filter(t => t.type === 'revenue')
      .forEach(t => {
        const current = procedureMap.get(t.category) || { count: 0, revenue: 0 };
        procedureMap.set(t.category, { 
          count: current.count, 
          revenue: current.revenue + t.amount 
        });
      });
    
    return Array.from(procedureMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filteredData.appointments, filteredData.transactions]);

  // ================================
  // KPI 4: Taxa de Conversão de Orçamentos
  // ================================
  const conversionKPI = useMemo(() => {
    const total = filteredData.quotes.length;
    const approved = filteredData.quotes.filter(q => q.status === 'approved').length;
    const rejected = filteredData.quotes.filter(q => q.status === 'rejected').length;
    const pending = filteredData.quotes.filter(q => q.status === 'draft' || q.status === 'sent').length;
    
    const conversionRate = total > 0 ? (approved / total) * 100 : 0;
    const rejectionRate = total > 0 ? (rejected / total) * 100 : 0;
    
    const totalValue = filteredData.quotes.reduce((s, q) => s + q.totalAmount, 0);
    const approvedValue = filteredData.quotes
      .filter(q => q.status === 'approved')
      .reduce((s, q) => s + q.totalAmount, 0);
    const pendingValue = filteredData.quotes
      .filter(q => q.status === 'draft' || q.status === 'sent')
      .reduce((s, q) => s + q.totalAmount, 0);

    return {
      total,
      approved,
      rejected,
      pending,
      conversionRate,
      rejectionRate,
      totalValue,
      approvedValue,
      pendingValue
    };
  }, [filteredData.quotes]);

  // ================================
  // KPI 5: Lifetime Value (LTV) do Paciente
  // ================================
  const ltvKPI = useMemo(() => {
    if (patients.length === 0) return { avgLTV: 0, maxLTV: 0, totalLTV: 0 };
    
    // Calcular receita por paciente
    const patientRevenue = new Map<string, number>();
    
    transactions
      .filter(t => t.type === 'revenue' && t.patientName)
      .forEach(t => {
        const current = patientRevenue.get(t.patientName!) || 0;
        patientRevenue.set(t.patientName!, current + t.amount);
      });
    
    const revenues = Array.from(patientRevenue.values());
    const totalLTV = revenues.reduce((s, r) => s + r, 0);
    const avgLTV = revenues.length > 0 ? totalLTV / revenues.length : 0;
    const maxLTV = revenues.length > 0 ? Math.max(...revenues) : 0;
    
    // Top 5 pacientes por LTV
    const topPatients = Array.from(patientRevenue.entries())
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return { avgLTV, maxLTV, totalLTV, patientsWithRevenue: revenues.length, topPatients };
  }, [transactions, patients]);

  // ================================
  // KPI 6: Custo de Aquisição de Cliente (CAC)
  // ================================
  const cacKPI = useMemo(() => {
    // Buscar despesas de marketing
    const marketingExpenses = filteredData.transactions
      .filter(t => {
        if (t.type !== 'expense') return false;
        const keywords = ['marketing', 'publicidade', 'anúncio', 'ads', 'google', 'facebook', 'instagram', 'tráfego', 'campanha', 'lead', 'captação'];
        const cat = t.category.toLowerCase();
        const desc = t.description.toLowerCase();
        return keywords.some(k => cat.includes(k) || desc.includes(k));
      })
      .reduce((s, t) => s + t.amount, 0);
    
    // Novos pacientes no período (simplificado - pacientes com primeira transação no período)
    const patientFirstTransaction = new Map<string, number>();
    transactions
      .filter(t => t.type === 'revenue' && t.patientName)
      .forEach(t => {
        const current = patientFirstTransaction.get(t.patientName!);
        if (!current || t.date < current) {
          patientFirstTransaction.set(t.patientName!, t.date);
        }
      });
    
    const newPatients = Array.from(patientFirstTransaction.entries())
      .filter(([_, date]) => date >= periodRange.start && date <= periodRange.end)
      .length;
    
    const cac = newPatients > 0 ? marketingExpenses / newPatients : 0;
    
    // Relação LTV/CAC
    const ltvCacRatio = cac > 0 ? ltvKPI.avgLTV / cac : 0;

    return {
      marketingExpenses,
      newPatients,
      cac,
      ltvCacRatio
    };
  }, [filteredData.transactions, transactions, periodRange, ltvKPI.avgLTV]);

  // ================================
  // Dados para gráficos de tendência
  // ================================
  const trendData = useMemo(() => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 12 : 12;
    const interval = period === '90d' ? 7 : period === '12m' ? 30 : 1;
    const data: Array<{
      label: string;
      comparecimento: number;
      faturamento: number;
      conversao: number;
    }> = [];

    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - (i * interval));
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + interval);
      
      const dayAppts = filteredData.appointments.filter(a => 
        a.startTime >= date.getTime() && a.startTime < nextDate.getTime()
      );
      const dayCompleted = dayAppts.filter(a => a.status === 'completed').length;
      const dayTotal = dayAppts.length;
      
      const dayRevenue = filteredData.transactions
        .filter(t => t.type === 'revenue' && t.date >= date.getTime() && t.date < nextDate.getTime())
        .reduce((s, t) => s + t.amount, 0);
      
      const dayQuotes = filteredData.quotes.filter(q => 
        q.createdAt >= date.getTime() && q.createdAt < nextDate.getTime()
      );
      const dayApproved = dayQuotes.filter(q => q.status === 'approved').length;
      
      const label = period === '12m' 
        ? date.toLocaleDateString('pt-BR', { month: 'short' })
        : period === '90d'
        ? `Sem ${Math.ceil((days - i) / 7)}`
        : date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' });
      
      data.push({
        label,
        comparecimento: dayTotal > 0 ? (dayCompleted / dayTotal) * 100 : 0,
        faturamento: dayRevenue,
        conversao: dayQuotes.length > 0 ? (dayApproved / dayQuotes.length) * 100 : 0
      });
    }
    
    return data;
  }, [filteredData, period]);

  // Tooltip customizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-xl">
          <p className="text-slate-400 text-xs font-bold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-bold" style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'Faturamento' ? formatCurrency(entry.value) : `${entry.value.toFixed(1)}%`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Labels do período
  const periodLabels: Record<PeriodFilter, string> = {
    '7d': 'Últimos 7 dias',
    '30d': 'Últimos 30 dias',
    '90d': 'Últimos 3 meses',
    '12m': 'Último ano'
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-slate-600 dark:text-slate-400 font-bold text-sm">Carregando indicadores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 px-2">
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.4em] text-indigo-600 dark:text-indigo-400 mb-2">
            Business Intelligence
          </h3>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic">
            Indicadores Clínicos (KPIs)
          </h2>
          <p className="text-slate-500 font-medium text-sm mt-2">
            Análise completa de performance da sua clínica
          </p>
        </div>
        
        {/* Filtros */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
              className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 pr-12 font-bold text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer shadow-sm"
            >
              <option value="7d">7 dias</option>
              <option value="30d">30 dias</option>
              <option value="90d">3 meses</option>
              <option value="12m">12 meses</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* CARDS PRINCIPAIS - ROW 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card: Taxa de Comparecimento */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
            <UserCheck className="w-40 h-40" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                <UserCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-slate-500 font-black text-[8px] uppercase tracking-[0.2em]">Performance</p>
                <h3 className="text-lg font-black tracking-tight">Taxa de Comparecimento</h3>
              </div>
            </div>
            
            <div className="flex items-end gap-4 mb-6">
              <h2 className="text-5xl font-black text-emerald-400 tracking-tighter">
                <AnimatedValue value={attendanceKPI.attendanceRate} suffix="%" decimals={1} />
              </h2>
              <div className="flex flex-col gap-1 pb-1">
                <span className="text-xs font-bold text-slate-400">
                  {attendanceKPI.completed + attendanceKPI.confirmed}/{attendanceKPI.total} agendamentos
                </span>
              </div>
            </div>
            
            {/* Mini gráfico de pizza */}
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <Pie
                    data={attendancePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {attendancePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => 
                      active && payload?.[0] ? (
                        <div className="bg-slate-800 border border-slate-600 rounded-lg p-2 text-xs">
                          <span className="font-bold" style={{ color: payload[0].payload.color }}>
                            {payload[0].name}: {payload[0].value}
                          </span>
                        </div>
                      ) : null
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex flex-wrap gap-3 mt-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] text-slate-400 font-medium">Compareceram</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-500"></div>
                <span className="text-[10px] text-slate-400 font-medium">Confirmados</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <span className="text-[10px] text-slate-400 font-medium">Cancelados</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                <span className="text-[10px] text-slate-400 font-medium">Faltaram</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Card: Tempo Médio de Consulta */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
            <Clock className="w-40 h-40 text-slate-900 dark:text-white" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border border-indigo-100 dark:border-indigo-800">
                <Clock className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <p className="text-slate-400 font-black text-[8px] uppercase tracking-[0.2em]">Eficiência</p>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Tempo Médio de Consulta</h3>
              </div>
            </div>
            
            <div className="flex items-end gap-3 mb-6">
              <h2 className="text-5xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">
                <AnimatedValue value={avgConsultationTime.avg} decimals={0} />
              </h2>
              <span className="text-2xl font-bold text-slate-400 pb-1">min</span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
              <div className="text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Mínimo</p>
                <p className="text-lg font-black text-slate-600 dark:text-slate-300">{avgConsultationTime.min.toFixed(0)}min</p>
              </div>
              <div className="text-center border-x border-slate-200 dark:border-slate-700">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Máximo</p>
                <p className="text-lg font-black text-slate-600 dark:text-slate-300">{avgConsultationTime.max.toFixed(0)}min</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Consultas</p>
                <p className="text-lg font-black text-slate-600 dark:text-slate-300">{avgConsultationTime.count || 0}</p>
              </div>
            </div>
            
            {/* Barra visual de tempo */}
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>0 min</span>
                <span>Ideal: 30-45 min</span>
                <span>90+ min</span>
              </div>
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    avgConsultationTime.avg <= 45 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                    avgConsultationTime.avg <= 60 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
                    'bg-gradient-to-r from-rose-500 to-rose-400'
                  }`}
                  style={{ width: `${Math.min((avgConsultationTime.avg / 90) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Card: Taxa de Conversão de Orçamentos */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <Target className="w-40 h-40" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-white/20 rounded-xl border border-white/20">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <p className="text-emerald-200 font-black text-[8px] uppercase tracking-[0.2em]">Vendas</p>
                <h3 className="text-lg font-black tracking-tight">Conversão de Orçamentos</h3>
              </div>
            </div>
            
            <div className="flex items-end gap-3 mb-6">
              <h2 className="text-5xl font-black tracking-tighter">
                <AnimatedValue value={conversionKPI.conversionRate} suffix="%" decimals={1} />
              </h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <p className="text-[9px] font-black text-emerald-200 uppercase mb-1">Aprovados</p>
                <p className="text-xl font-black">{conversionKPI.approved}</p>
                <p className="text-xs font-bold text-emerald-200 mt-1">{formatCurrency(conversionKPI.approvedValue)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <p className="text-[9px] font-black text-emerald-200 uppercase mb-1">Pendentes</p>
                <p className="text-xl font-black">{conversionKPI.pending}</p>
                <p className="text-xs font-bold text-emerald-200 mt-1">{formatCurrency(conversionKPI.pendingValue)}</p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-emerald-200">Funil de Conversão</span>
                <span className="text-xs font-black">{conversionKPI.total} total</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-1000"
                  style={{ width: `${conversionKPI.conversionRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CARDS - ROW 2: LTV e CAC */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card: LTV - Lifetime Value */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 rounded-xl border border-purple-100 dark:border-purple-800">
              <HeartPulse className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-slate-400 font-black text-[8px] uppercase tracking-[0.2em]">Lifetime Value</p>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Valor do Paciente (LTV)</h3>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">LTV Médio</p>
              <h2 className="text-3xl font-black text-purple-600 dark:text-purple-400 tracking-tighter">
                <AnimatedValue value={ltvKPI.avgLTV} isCurrency />
              </h2>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">LTV Máximo</p>
              <p className="text-2xl font-black text-slate-600 dark:text-slate-300 tracking-tighter">
                {formatCurrency(ltvKPI.maxLTV)}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Pacientes Ativos</p>
              <p className="text-2xl font-black text-slate-600 dark:text-slate-300 tracking-tighter">
                {ltvKPI.patientsWithRevenue || 0}
              </p>
            </div>
          </div>
          
          {/* Top Pacientes por LTV */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top 5 Pacientes por Valor</p>
            {ltvKPI.topPatients?.slice(0, 5).map((patient, index) => (
              <div key={patient.name} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs text-white ${
                    index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-amber-700' : 'bg-slate-300 dark:bg-slate-600'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="font-bold text-sm text-slate-700 dark:text-slate-200 truncate max-w-[150px]">{patient.name}</span>
                </div>
                <span className="font-black text-sm text-purple-600 dark:text-purple-400">{formatCurrency(patient.revenue)}</span>
              </div>
            ))}
            {(!ltvKPI.topPatients || ltvKPI.topPatients.length === 0) && (
              <p className="text-sm text-slate-400 text-center py-4">Nenhum dado disponível</p>
            )}
          </div>
        </div>
        
        {/* Card: CAC - Custo de Aquisição */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-amber-500/20 rounded-xl border border-amber-500/30">
              <Megaphone className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-slate-500 font-black text-[8px] uppercase tracking-[0.2em]">Customer Acquisition Cost</p>
              <h3 className="text-lg font-black tracking-tight">Custo de Aquisição (CAC)</h3>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase mb-1">CAC por Paciente</p>
              <h2 className="text-4xl font-black text-amber-400 tracking-tighter">
                <AnimatedValue value={cacKPI.cac} isCurrency />
              </h2>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Relação LTV/CAC</p>
              <h2 className={`text-4xl font-black tracking-tighter ${
                cacKPI.ltvCacRatio >= 3 ? 'text-emerald-400' : 
                cacKPI.ltvCacRatio >= 1 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                <AnimatedValue value={cacKPI.ltvCacRatio} suffix="x" decimals={1} />
              </h2>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/5">
              <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Investimento em Marketing</p>
              <p className="text-xl font-black">{formatCurrency(cacKPI.marketingExpenses)}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/5">
              <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Novos Pacientes</p>
              <p className="text-xl font-black">{cacKPI.newPatients}</p>
            </div>
          </div>
          
          {/* Indicador de saúde do CAC */}
          <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                cacKPI.ltvCacRatio >= 3 ? 'bg-emerald-500/20 text-emerald-400' :
                cacKPI.ltvCacRatio >= 1 ? 'bg-amber-500/20 text-amber-400' :
                'bg-rose-500/20 text-rose-400'
              }`}>
                {cacKPI.ltvCacRatio >= 3 ? <Sparkles className="w-6 h-6" /> : 
                 cacKPI.ltvCacRatio >= 1 ? <Activity className="w-6 h-6" /> : 
                 <TrendingUp className="w-6 h-6 rotate-180" />}
              </div>
              <div>
                <p className="font-black text-sm">
                  {cacKPI.ltvCacRatio >= 3 ? 'Excelente ROI de Marketing' :
                   cacKPI.ltvCacRatio >= 1 ? 'ROI Positivo' :
                   'Atenção: Revisar estratégia'}
                </p>
                <p className="text-xs text-slate-500">
                  {cacKPI.ltvCacRatio >= 3 
                    ? 'Cada R$1 investido retorna mais de R$3' 
                    : cacKPI.ltvCacRatio >= 1 
                    ? 'Investimento está retornando positivamente'
                    : 'O custo de aquisição está maior que o retorno'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GRÁFICOS DE TENDÊNCIA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico: Tendência de Comparecimento */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-white/10 rounded-xl border border-white/10">
              <Activity className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-slate-500 font-black text-[8px] uppercase tracking-[0.2em]">Tendência</p>
              <h3 className="text-lg font-black tracking-tight">Comparecimento ao Longo do Tempo</h3>
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="comparecimentoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="comparecimento" 
                  name="Comparecimento"
                  stroke="#10b981" 
                  strokeWidth={3}
                  fill="url(#comparecimentoGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Gráfico: Faturamento por Período */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border border-indigo-100 dark:border-indigo-800">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <p className="text-slate-400 font-black text-[8px] uppercase tracking-[0.2em]">Evolução</p>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Faturamento - {periodLabels[period]}</h3>
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="faturamento" 
                  name="Faturamento"
                  fill="#6366f1" 
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* PROCEDIMENTOS MAIS REALIZADOS */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-lg">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 dark:bg-rose-900/30 rounded-xl border border-rose-100 dark:border-rose-800">
              <Stethoscope className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <p className="text-slate-400 font-black text-[8px] uppercase tracking-[0.2em]">Top Performers</p>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Procedimentos Mais Realizados</h3>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-400">{periodLabels[period]}</span>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gráfico de barras horizontais */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={topProcedures} 
                layout="vertical" 
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  width={100}
                  tickFormatter={(value) => value.length > 15 ? value.slice(0, 15) + '...' : value}
                />
                <Tooltip 
                  content={({ active, payload }) => 
                    active && payload?.[0] ? (
                      <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-xl">
                        <p className="text-white font-bold text-sm mb-1">{payload[0].payload.name}</p>
                        <p className="text-emerald-400 font-black">{payload[0].value} realizações</p>
                      </div>
                    ) : null
                  }
                />
                <Bar 
                  dataKey="count" 
                  fill="#6366f1" 
                  radius={[0, 8, 8, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Lista detalhada */}
          <div className="space-y-3">
            {topProcedures.map((proc, index) => (
              <div 
                key={proc.name}
                className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm"
                    style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-bold text-slate-700 dark:text-slate-200 text-sm truncate max-w-[200px]">{proc.name}</p>
                    <p className="text-xs text-slate-400">{proc.count} realizações</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-indigo-600 dark:text-indigo-400 text-sm">{formatCurrency(proc.revenue)}</p>
                  <p className="text-[10px] text-slate-400">receita</p>
                </div>
              </div>
            ))}
            {topProcedures.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Stethoscope className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="font-bold">Nenhum procedimento registrado</p>
                <p className="text-sm">no período selecionado</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RESUMO EXECUTIVO */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl border border-white/5">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/10">
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <p className="text-indigo-400 font-black text-[8px] uppercase tracking-[0.2em]">Insights</p>
            <h3 className="text-lg font-black tracking-tight">Resumo Executivo - {periodLabels[period]}</h3>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white/5 backdrop-blur rounded-2xl p-5 border border-white/5">
            <UserCheck className="w-6 h-6 text-emerald-400 mb-3" />
            <p className="text-[9px] font-black text-slate-500 uppercase">Comparecimento</p>
            <p className="text-2xl font-black text-emerald-400">{attendanceKPI.attendanceRate.toFixed(0)}%</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur rounded-2xl p-5 border border-white/5">
            <Clock className="w-6 h-6 text-indigo-400 mb-3" />
            <p className="text-[9px] font-black text-slate-500 uppercase">Tempo Médio</p>
            <p className="text-2xl font-black text-indigo-400">{avgConsultationTime.avg.toFixed(0)}min</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur rounded-2xl p-5 border border-white/5">
            <Target className="w-6 h-6 text-cyan-400 mb-3" />
            <p className="text-[9px] font-black text-slate-500 uppercase">Conversão</p>
            <p className="text-2xl font-black text-cyan-400">{conversionKPI.conversionRate.toFixed(0)}%</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur rounded-2xl p-5 border border-white/5">
            <HeartPulse className="w-6 h-6 text-purple-400 mb-3" />
            <p className="text-[9px] font-black text-slate-500 uppercase">LTV Médio</p>
            <p className="text-2xl font-black text-purple-400">{formatCurrency(ltvKPI.avgLTV)}</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur rounded-2xl p-5 border border-white/5">
            <Megaphone className="w-6 h-6 text-amber-400 mb-3" />
            <p className="text-[9px] font-black text-slate-500 uppercase">CAC</p>
            <p className="text-2xl font-black text-amber-400">{formatCurrency(cacKPI.cac)}</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur rounded-2xl p-5 border border-white/5">
            <Zap className="w-6 h-6 text-rose-400 mb-3" />
            <p className="text-[9px] font-black text-slate-500 uppercase">LTV/CAC</p>
            <p className={`text-2xl font-black ${cacKPI.ltvCacRatio >= 3 ? 'text-emerald-400' : cacKPI.ltvCacRatio >= 1 ? 'text-amber-400' : 'text-rose-400'}`}>
              {cacKPI.ltvCacRatio.toFixed(1)}x
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicalKPIsTab;









