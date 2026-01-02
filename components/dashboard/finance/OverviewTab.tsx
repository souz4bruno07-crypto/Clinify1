
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Transaction, AIAnalysisResult, Quote } from '../../../types';
import AIInsightsWidget from '../../AIInsightsWidget';
import { 
  TrendingUp, ShoppingBag, Coins, Calculator, Sparkles, Flame, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import { getQuotes } from '../../../services/backendService';
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
  Legend
} from 'recharts';

// Hook para animação de números (contador)
const useCountUp = (end: number, duration: number = 1500, startOnMount: boolean = true) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!startOnMount) return;
    
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      
      // Easing function (ease-out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      countRef.current = easeOut * end;
      setCount(countRef.current);
      
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    
    startTimeRef.current = null;
    rafRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [end, duration, startOnMount]);

  return count;
};

// Componente de número animado
const AnimatedNumber: React.FC<{ value: number; prefix?: string; suffix?: string; className?: string; duration?: number }> = ({ 
  value, 
  prefix = '', 
  suffix = '', 
  className = '',
  duration = 1500 
}) => {
  const animatedValue = useCountUp(value, duration);
  return (
    <span className={className}>
      {prefix}{formatCurrency(animatedValue)}{suffix}
    </span>
  );
};

// Cores para o gráfico de pizza
const EXPENSE_COLORS = [
  '#6366f1', // indigo
  '#f43f5e', // rose
  '#f59e0b', // amber
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

const OverviewTab: React.FC<{
  transactions: Transaction[];
  isLoading: boolean;
  user: any;
  aiAnalysis: AIAnalysisResult | null;
  loadingAnalysis: boolean;
  onRefreshAI: () => void;
  startDate: Date;
  monthlyGoal: number;
  monthlyBudget: number;
  isTargetLoading: boolean;
}> = (props) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [conversionRate, setConversionRate] = useState(50);

  useEffect(() => {
    if(props.user) {
        getQuotes(props.user.id).then(setQuotes);
    }
  }, [props.user]);

  // Dados para o gráfico de linha (últimos 7 dias)
  const last7DaysData = useMemo(() => {
    const today = new Date();
    const days: { date: string; faturamento: number; despesas: number }[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dayStart = date.getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      const dayLabel = date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' });
      
      const dayRevenue = props.transactions
        .filter(t => t.type === 'revenue' && t.date >= dayStart && t.date < dayEnd)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const dayExpenses = props.transactions
        .filter(t => t.type === 'expense' && t.date >= dayStart && t.date < dayEnd)
        .reduce((sum, t) => sum + t.amount, 0);
      
      days.push({
        date: dayLabel,
        faturamento: dayRevenue,
        despesas: dayExpenses
      });
    }
    
    return days;
  }, [props.transactions]);

  // Dados para o gráfico de pizza (despesas por categoria)
  const expensesByCategory = useMemo(() => {
    const categoryMap = new Map<string, number>();
    
    props.transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const category = t.category || 'Outros';
        categoryMap.set(category, (categoryMap.get(category) || 0) + t.amount);
      });
    
    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Limitar a 8 categorias
  }, [props.transactions]);

  const kpis = useMemo(() => {
    const totalRev = props.transactions.filter(t => t.type === 'revenue').reduce((s, t) => s + t.amount, 0);
    const totalExp = props.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const revCount = props.transactions.filter(t => t.type === 'revenue').length;
    
    const totalInsumos = props.transactions.filter(t => {
        if (t.type !== 'expense') return false;
        const cat = t.category.toLowerCase();
        const desc = t.description.toLowerCase();
        const keywords = ['insumo', 'produto', 'material', 'materiais', 'estoque', 'botox', 'toxina', 'preenchedor', 'fios', 'bioestimulador', 'seringa', 'agulha', 'gaze', 'laboratório', 'laboratorio', 'medicamento', 'compras'];
        return keywords.some(key => cat.includes(key) || desc.includes(key));
    }).reduce((s, t) => s + t.amount, 0);

    const profit = totalRev - totalExp;
    const margin = totalRev > 0 ? (profit / totalRev) * 100 : 0;
    const efficiency = totalRev > 0 ? (100 - (totalExp / totalRev * 100)) : 0;
    
    const today = new Date();
    const isCurrentMonth = props.startDate.getMonth() === today.getMonth() && props.startDate.getFullYear() === today.getFullYear();
    const daysPassed = isCurrentMonth ? today.getDate() : new Date(props.startDate.getFullYear(), props.startDate.getMonth() + 1, 0).getDate();
    const dailyAvg = totalRev / (daysPassed || 1);
    const daysInMonth = new Date(props.startDate.getFullYear(), props.startDate.getMonth() + 1, 0).getDate();
    const projection = dailyAvg * daysInMonth;

    const openQuotesTotal = quotes.filter(q => q.status === 'draft' || q.status === 'sent').reduce((s, q) => s + q.totalAmount, 0);
    const potentialRevenue = totalRev + (openQuotesTotal * (conversionRate / 100));

    const atingimentoRev = props.monthlyGoal > 0 ? (totalRev / props.monthlyGoal) * 100 : 0;
    const atingimentoBudget = props.monthlyBudget > 0 ? (totalInsumos / props.monthlyBudget) * 100 : 0;

    return { 
        totalRev, totalExp, profit, margin, efficiency, atingimentoRev, atingimentoBudget, totalInsumos,
        openQuotesTotal, potentialRevenue, revCount, dailyAvg, projection
    };
  }, [props.transactions, props.monthlyGoal, props.monthlyBudget, quotes, conversionRate, props.startDate]);

  // Tooltip customizado para o gráfico de linha
  const CustomLineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-xl">
          <p className="text-slate-400 text-xs font-bold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-bold" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Tooltip customizado para o gráfico de pizza
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-xl">
          <p className="text-white text-sm font-bold">{payload[0].name}</p>
          <p className="text-emerald-400 text-lg font-black">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* KPI CARDS PRINCIPAIS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><TrendingUp className="w-56 h-56" /></div>
              <div className="relative z-10 flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/10 rounded-xl border border-white/10"><Coins className="w-5 h-5 text-emerald-400" /></div>
                    <div>
                      <p className="text-slate-500 font-black text-[8px] uppercase tracking-[0.2em] mb-1">Entradas Auditadas</p>
                      <h3 className="text-xl font-black tracking-tighter italic">Faturamento</h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Procedimentos</p>
                    <p className="text-base font-black">{kpis.revCount}</p>
                  </div>
              </div>
              <div className="relative z-10 space-y-6">
                  <div>
                      <h2 className="text-5xl sm:text-6xl font-black text-white tracking-tighter leading-none">
                        <AnimatedNumber value={kpis.totalRev} duration={2000} />
                      </h2>
                      <div className="flex items-center gap-3 mt-4">
                        <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                          <p className="text-[7px] font-black text-slate-500 uppercase">Média Diária</p>
                          <p className="text-xs font-bold text-emerald-400">
                            <AnimatedNumber value={kpis.dailyAvg} duration={1800} />
                          </p>
                        </div>
                        <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                          <p className="text-[7px] font-black text-slate-500 uppercase">Projeção Mês</p>
                          <p className="text-xs font-bold text-indigo-400">
                            <AnimatedNumber value={kpis.projection} duration={2200} />
                          </p>
                        </div>
                      </div>
                  </div>
                  <div className="flex items-center justify-between pt-5 border-t border-white/5">
                      <div className="space-y-0.5">
                          <p className="text-[8px] font-black text-slate-500 uppercase">Alvo Definido</p>
                          <p className="text-base font-black text-slate-300">{formatCurrency(props.monthlyGoal)}</p>
                      </div>
                      <div className="text-right">
                          <p className="text-[8px] font-black text-slate-500 uppercase">Atingimento</p>
                          <p className="text-base font-black text-emerald-400">{kpis.atingimentoRev.toFixed(1)}%</p>
                      </div>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden p-0.5"><div className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(kpis.atingimentoRev, 100)}%` }}></div></div>
              </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><ShoppingBag className="w-56 h-56 text-slate-900 dark:text-white" /></div>
              <div className="relative z-10 flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm"><Calculator className="w-5 h-5 text-indigo-500" /></div>
                    <div>
                      <p className="text-slate-400 font-black text-[8px] uppercase tracking-[0.2em] mb-1">Consumo de Insumos</p>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter italic">Budget</h3>
                    </div>
                  </div>
              </div>
              <div className="relative z-10 space-y-6">
                  <div>
                      <h2 className={`text-5xl sm:text-6xl font-black tracking-tighter leading-none ${kpis.totalInsumos > props.monthlyBudget && props.monthlyBudget > 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                        <AnimatedNumber value={kpis.totalInsumos} duration={2000} />
                      </h2>
                      <div className="flex items-center gap-3 mt-4">
                        <div className="bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                          <p className="text-[7px] font-black text-slate-400 uppercase">Saldo Budget</p>
                          <p className={`text-xs font-bold ${props.monthlyBudget - kpis.totalInsumos < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                            <AnimatedNumber value={Math.max(0, props.monthlyBudget - kpis.totalInsumos)} duration={1800} />
                          </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                          <p className="text-[7px] font-black text-slate-400 uppercase">CMV Estimado</p>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{((kpis.totalInsumos / (kpis.totalRev || 1)) * 100).toFixed(1)}%</p>
                        </div>
                      </div>
                  </div>
                  <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-slate-800">
                      <div className="space-y-0.5">
                          <p className="text-[8px] font-black text-slate-400 uppercase">Teto Autorizado</p>
                          <p className="text-base font-black text-slate-500">{formatCurrency(props.monthlyBudget)}</p>
                      </div>
                      <div className="text-right">
                          <p className="text-[8px] font-black text-slate-400 uppercase">Utilização</p>
                          <p className={`text-base font-black ${kpis.atingimentoBudget > 100 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>{kpis.atingimentoBudget.toFixed(1)}%</p>
                      </div>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700 shadow-inner">
                      <div className={`h-full rounded-full transition-all duration-1000 ${kpis.atingimentoBudget > 100 ? 'bg-rose-500' : 'bg-slate-900 dark:bg-white shadow-lg'}`} style={{ width: `${Math.min(kpis.atingimentoBudget, 100)}%` }}></div>
                  </div>
              </div>
          </div>
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Gráfico de Linha - Faturamento últimos 7 dias */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-white/10 rounded-xl border border-white/10">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-slate-500 font-black text-[8px] uppercase tracking-[0.2em] mb-1">Performance</p>
              <h3 className="text-xl font-black tracking-tighter italic">Últimos 7 Dias</h3>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={last7DaysData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomLineTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="faturamento" 
                  name="Faturamento"
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="despesas" 
                  name="Despesas"
                  stroke="#f43f5e" 
                  strokeWidth={3}
                  dot={{ fill: '#f43f5e', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-xs text-slate-400 font-medium">Faturamento</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
              <span className="text-xs text-slate-400 font-medium">Despesas</span>
            </div>
          </div>
        </div>

        {/* Gráfico de Pizza - Despesas por Categoria */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <PieChartIcon className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <p className="text-slate-400 font-black text-[8px] uppercase tracking-[0.2em] mb-1">Distribuição</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter italic">Despesas por Categoria</h3>
            </div>
          </div>
          <div className="h-64">
            {expensesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  >
                    {expensesByCategory.map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]}
                        stroke="transparent"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-slate-400 text-sm">Nenhuma despesa registrada</p>
              </div>
            )}
          </div>
          {expensesByCategory.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-4">
              {expensesByCategory.slice(0, 4).map((cat, index) => (
                <div key={cat.name} className="flex items-center gap-1.5">
                  <div 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: EXPENSE_COLORS[index % EXPENSE_COLORS.length] }}
                  ></div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[80px]">
                    {cat.name}
                  </span>
                </div>
              ))}
              {expensesByCategory.length > 4 && (
                <span className="text-[10px] text-slate-400">+{expensesByCategory.length - 4} mais</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CRM SIMULATOR */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl border border-white/5 relative overflow-hidden animate-in zoom-in-95 duration-700">
          <div className="absolute top-0 right-0 p-8 opacity-10 animate-pulse"><Flame className="w-40 h-40 text-indigo-400" /></div>
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="max-w-md">
                  <div className="flex items-center gap-2 mb-2"><Sparkles className="w-5 h-5 text-indigo-400" /><h3 className="text-xl font-black tracking-tighter italic uppercase">Comando Comercial</h3></div>
                  <p className="text-slate-400 font-bold text-xs leading-relaxed">Há <span className="text-white">{formatCurrency(kpis.openQuotesTotal)}</span> pendentes no CRM. Simule a conversão:</p>
                  <div className="mt-4 flex items-center gap-4">
                      <input type="range" min="0" max="100" step="10" className="flex-1 h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-indigo-500" value={conversionRate} onChange={e => setConversionRate(Number(e.target.value))} />
                      <span className="text-lg font-black text-indigo-400 w-12 text-right">{conversionRate}%</span>
                  </div>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-3 w-full lg:w-auto">
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl">
                    <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-1">Cenário Faturamento</p>
                    <h4 className="text-xl font-black text-emerald-400 tracking-tighter">
                      <AnimatedNumber value={kpis.potentialRevenue} duration={1500} />
                    </h4>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl">
                    <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-1">Injeção de Caixa</p>
                    <h4 className="text-xl font-black text-white tracking-tighter">
                      +<AnimatedNumber value={kpis.potentialRevenue - kpis.totalRev} duration={1500} />
                    </h4>
                  </div>
              </div>
          </div>
      </div>

      {/* INDICADORES COMPACTOS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card: Lucro */}
          <div className={`p-6 lg:p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group aspect-[4/3] flex flex-col justify-between transition-all duration-300 ${kpis.profit >= 0 ? 'bg-gradient-to-br from-indigo-500 to-indigo-600' : 'bg-gradient-to-br from-rose-500 to-rose-600'}`}>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase text-white/70 tracking-[0.2em]">Lucro</p>
                {kpis.profit >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-white/50" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-white/50 rotate-180" />
                )}
              </div>
              <div>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter leading-none break-all">
                    <AnimatedNumber value={kpis.profit} duration={2000} />
                  </h3>
                  <p className="text-[10px] font-bold text-white/60 mt-2">{kpis.efficiency.toFixed(0)}% eficiência</p>
              </div>
          </div>

          {/* Card: Fisco */}
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-6 lg:p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group aspect-[4/3] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase text-white/80 tracking-[0.2em]">Fisco</p>
                <Calculator className="w-4 h-4 text-white/50" />
              </div>
              <div>
                  <h3 className="text-xl lg:text-2xl font-black tracking-tighter leading-none italic">Provisão</h3>
                  <p className="text-lg lg:text-xl font-black mt-1">
                    <AnimatedNumber value={kpis.totalRev * 0.06} duration={1800} />
                  </p>
                  <p className="text-[10px] font-bold text-white/60 mt-1">6% s/ faturamento</p>
              </div>
          </div>

          {/* Card: Status - Cor dinâmica baseada na margem */}
          <div className={`p-6 lg:p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group aspect-[4/3] flex flex-col justify-between transition-all duration-300 ${
            kpis.margin >= 25 ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 
            kpis.margin >= 15 ? 'bg-gradient-to-br from-sky-500 to-sky-600' : 
            kpis.margin >= 0 ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 
            'bg-gradient-to-br from-rose-500 to-rose-600'
          }`}>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase text-white/80 tracking-[0.2em]">Status</p>
                <Sparkles className="w-4 h-4 text-white/50" />
              </div>
              <div>
                  <h3 className="text-2xl lg:text-3xl font-black tracking-tighter leading-none">
                      {kpis.margin >= 25 ? '🏆 Elite' : kpis.margin >= 15 ? '⭐ Pro' : kpis.margin >= 0 ? '🚀 Starter' : '⚠️ Alerta'}
                  </h3>
                  <p className="text-xs font-bold text-white/80 mt-1">Margem: {kpis.margin.toFixed(0)}%</p>
              </div>
          </div>

          {/* Card: Live */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 lg:p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group aspect-[4/3] flex flex-col justify-between border border-slate-700/50">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Live</p>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50"></div>
              </div>
              <div className="space-y-3">
                  <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50"></div>
                      <span className="text-sm font-bold text-white">Sincronizado</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500 font-bold uppercase">Transações</span>
                      <span className="text-slate-300 font-black">{props.transactions.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500 font-bold uppercase">Última sync</span>
                      <span className="text-slate-300 font-black">Agora</span>
                  </div>
              </div>
          </div>
      </div>

      <div className="lg:col-span-2">
          <AIInsightsWidget analysis={props.aiAnalysis} loading={props.loadingAnalysis} onRefresh={props.onRefreshAI} />
      </div>
    </div>
  );
};

export default OverviewTab;
