
import React, { useMemo, useState } from 'react';
import { Transaction } from '../../../types';
import { 
  BarChart3, TrendingUp, TrendingDown, 
  Download, Target, Briefcase, Zap, 
  Calendar, ShieldCheck, Gauge, Search, DollarSign,
  CalendarDays, ChevronRight, Activity, Percent,
  Layers, ArrowUpRight, ArrowDownRight, Info,
  Lightbulb, Activity as ActivityIcon, CheckCircle2,
  Scale, PieChart as PieChartIcon, CalendarRange, Clock
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
  ComposedChart, Line, Legend
} from 'recharts';
import { formatCurrency, formatK } from '../../../utils/formatters';
import * as XLSX from 'xlsx';

interface ReportsTabProps {
  transactions: Transaction[];
  user: any;
  startDate: Date;
}

const COLORS_DRE = ['#10b981', '#6366f1', '#f43f5e', '#f59e0b'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-white/10 p-5 shadow-2xl rounded-3xl text-white backdrop-blur-xl">
        <p className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-3 border-b border-white/5 pb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-6 mb-1.5 last:mb-0">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                <span className="text-[10px] font-black uppercase text-slate-300">{entry.name}:</span>
            </div>
            <span className="font-black text-xs">
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const ReportsTab: React.FC<ReportsTabProps> = ({ transactions, user }) => {
  const [period, setPeriod] = useState<'30' | '90' | '365' | 'custom'>('30');
  const [customRange, setCustomRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Helpers de categorias
  const isTax = (t: Transaction) => t.type === 'expense' && (t.category.toLowerCase().includes('imposto') || t.category.toLowerCase().includes('taxa') || t.description.toLowerCase().includes('das'));
  const isVariable = (t: Transaction) => t.type === 'expense' && !isTax(t) && (t.category.toLowerCase().includes('insumo') || t.category.toLowerCase().includes('produto') || t.category.toLowerCase().includes('comiss') || t.category.toLowerCase().includes('laborat'));
  const isFixed = (t: Transaction) => t.type === 'expense' && !isTax(t) && !isVariable(t);

  const stats = useMemo(() => {
    let startTs: number;
    let endTs: number;

    if (period === 'custom') {
        startTs = new Date(customRange.start + 'T00:00:00').getTime();
        endTs = new Date(customRange.end + 'T23:59:59').getTime();
    } else {
        const days = parseInt(period);
        endTs = new Date().getTime();
        startTs = endTs - (days * 24 * 60 * 60 * 1000);
    }

    const duration = endTs - startTs;
    const prevStartTs = startTs - duration;
    const prevEndTs = startTs;

    const filtered = transactions.filter(t => t.date >= startTs && t.date <= endTs);
    const previousFiltered = transactions.filter(t => t.date >= prevStartTs && t.date < prevEndTs);

    // Cálculos Atuais
    const totalRev = filtered.filter(t => t.type === 'revenue').reduce((s, t) => s + t.amount, 0);
    const totalExp = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const taxes = filtered.filter(isTax).reduce((s, t) => s + t.amount, 0);
    const variable = filtered.filter(isVariable).reduce((s, t) => s + t.amount, 0);
    const fixed = filtered.filter(isFixed).reduce((s, t) => s + t.amount, 0);
    
    const contributionMargin = totalRev - taxes - variable;
    const profit = totalRev - totalExp;
    const marginPct = totalRev > 0 ? (profit / totalRev) * 100 : 0;
    const cmPct = totalRev > 0 ? (contributionMargin / totalRev) * 100 : 0;

    // Crescimento (Comparação com período anterior de mesma duração)
    const prevRev = previousFiltered.filter(t => t.type === 'revenue').reduce((s, t) => s + t.amount, 0);
    const growthRev = prevRev > 0 ? ((totalRev - prevRev) / prevRev) * 100 : 0;

    // Ponto de Equilíbrio (Break-Even)
    const breakEven = cmPct > 0 ? fixed / (cmPct / 100) : 0;
    const breakEvenStatus = totalRev >= breakEven ? 'Acima' : 'Abaixo';

    // Dados para Gráfico de Evolução
    const chartMap: Record<string, any> = {};
    const totalDays = Math.ceil(duration / (24 * 60 * 60 * 1000)) || 1;

    [...filtered].sort((a,b) => a.date - b.date).forEach(t => {
        const key = new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        if(!chartMap[key]) chartMap[key] = { name: key, Receita: 0, Despesa: 0, Lucro: 0, MetaPonto: breakEven / totalDays };
        if(t.type === 'revenue') chartMap[key].Receita += t.amount;
        else chartMap[key].Despesa += t.amount;
        chartMap[key].Lucro = chartMap[key].Receita - chartMap[key].Despesa;
    });

    const structureData = [
      { name: 'Fixos', value: fixed, color: '#f43f5e' },
      { name: 'Variáveis', value: variable, color: '#6366f1' },
      { name: 'Impostos', value: taxes, color: '#f59e0b' },
      { name: 'Lucro', value: Math.max(0, profit), color: '#10b981' }
    ];

    return {
        totalRev, totalExp, profit, marginPct, cmPct, growthRev, taxes, variable, fixed,
        contributionMargin, breakEven, breakEvenStatus,
        chartData: Object.values(chartMap),
        structureData,
        topExpenses: filtered.filter(t => t.type === 'expense').sort((a,b) => b.amount - a.amount).slice(0, 5)
    };
  }, [transactions, period, customRange]);

  return (
    <div className="space-y-8 pb-40 animate-in fade-in duration-700">
      
      {/* HEADER DE COMANDO */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase leading-none">Painel de Inteligência</h2>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mt-3">Análise Avançada de Estrutura e Margens</p>
          </div>
          <div className="flex flex-col items-end gap-4">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[2rem] shadow-inner overflow-x-auto no-scrollbar max-w-full">
                  {(['30', '90', '365', 'custom'] as const).map(d => (
                      <button 
                        key={d} 
                        onClick={() => setPeriod(d)} 
                        className={`px-6 md:px-8 py-3.5 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${period === d ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        {d === '30' ? 'Mensal' : d === '90' ? 'Trimestral' : d === '365' ? 'Anual' : 'Personalizado'}
                      </button>
                  ))}
              </div>

              {period === 'custom' && (
                  <div className="flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
                      <div className="relative">
                          <input 
                            type="date" 
                            className="bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500"
                            value={customRange.start}
                            onChange={e => setCustomRange({...customRange, start: e.target.value})}
                          />
                      </div>
                      <ArrowRight className="w-3 h-3 text-slate-300" />
                      <div className="relative">
                          <input 
                            type="date" 
                            className="bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500"
                            value={customRange.end}
                            onChange={e => setCustomRange({...customRange, end: e.target.value})}
                          />
                      </div>
                  </div>
              )}
          </div>
      </div>

      {/* CARDS DE ALTO IMPACTO */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><TrendingUp className="w-24 h-24 text-emerald-400" /></div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Volume de Negócios</p>
              <h3 className="text-4xl font-black tracking-tighter mb-4">{formatCurrency(stats.totalRev)}</h3>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black ${stats.growthRev >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  {stats.growthRev >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(stats.growthRev).toFixed(1)}% vs Período Ant.
              </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Lucro Disponível</p>
              <h3 className={`text-4xl font-black tracking-tighter mb-4 ${stats.profit >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600'}`}>{formatCurrency(stats.profit)}</h3>
              <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${stats.marginPct >= 20 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>Margem: {stats.marginPct.toFixed(1)}%</span>
              </div>
          </div>

          <div className="bg-indigo-600 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10"><Scale className="w-20 h-20" /></div>
              <p className="text-indigo-200 text-[9px] font-black uppercase tracking-widest mb-2">Ponto de Equilíbrio</p>
              <h3 className="text-4xl font-black tracking-tighter mb-4">{formatCurrency(stats.breakEven)}</h3>
              <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${Math.min(100, (stats.totalRev / (stats.breakEven || 1)) * 100)}%` }}></div>
                  </div>
                  <span className="text-[10px] font-black text-indigo-100 uppercase">{stats.breakEvenStatus}</span>
              </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Eficiência Operacional</p>
              <h3 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white italic">{(100 - (stats.totalExp/stats.totalRev*100 || 0)).toFixed(0)}%</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Capacidade de Retenção</p>
          </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* GRÁFICO DE EVOLUÇÃO E META */}
          <div className="xl:col-span-8 bg-white dark:bg-slate-900 rounded-[3.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
                  <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Evolução e Convergência</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acompanhamento diário de faturamento e lucro</p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-400"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Faturamento</div>
                      <div className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-400"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div> Lucro</div>
                  </div>
              </div>
              <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={stats.chartData}>
                          <defs>
                              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" opacity={0.5} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} tickFormatter={v => `R$${v/1000}k`} />
                          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }} />
                          <Bar dataKey="Receita" fill="#10b981" radius={[10, 10, 0, 0]} barSize={35} />
                          <Area type="monotone" dataKey="Lucro" fill="url(#colorProfit)" stroke="#6366f1" strokeWidth={4} />
                      </ComposedChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* ANÁLISE DE ESTRUTURA DE CUSTOS */}
          <div className="xl:col-span-4 bg-white dark:bg-slate-900 rounded-[3rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-8">Estrutura de Capital</h3>
              
              <div className="flex-1 relative min-h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.structureData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.structureData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Gasto Total</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white">{formatK(stats.totalExp)}</p>
                  </div>
              </div>

              <div className="space-y-4 mt-8">
                  {stats.structureData.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] font-black uppercase">
                          <div className="flex items-center gap-2">
                             <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                             <span className="text-slate-500">{item.name}</span>
                          </div>
                          <span className="text-slate-900 dark:text-white">{((item.value / (stats.totalRev || 1)) * 100).toFixed(1)}%</span>
                      </div>
                  ))}
              </div>

              <div className="mt-8 p-6 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl border border-indigo-100 dark:border-indigo-800">
                  <div className="flex items-center gap-3 text-indigo-600 mb-2">
                      <Lightbulb className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Oportunidade</span>
                  </div>
                  <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400 leading-relaxed">
                      Sua Estrutura Fixa representa <span className="text-indigo-900 dark:text-white">{((stats.fixed / (stats.totalRev || 1)) * 100).toFixed(1)}%</span>. Para otimizar, foque em diluir este custo aumentando o volume de procedimentos.
                  </p>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* MAIORES SAÍDAS */}
          <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform"><ActivityIcon className="w-40 h-40 text-rose-500" /></div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-8">Drenos de Caixa (Top Saídas)</h3>
              <div className="space-y-5 relative z-10">
                  {stats.topExpenses.map((expense, idx) => (
                      <div key={idx} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-700 hover:border-rose-300 transition-all cursor-default">
                          <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-700 flex items-center justify-center font-black text-rose-600 shadow-sm text-xs">{idx + 1}</div>
                              <div>
                                  <p className="font-black text-slate-900 dark:text-white text-sm truncate max-w-[150px]">{expense.description}</p>
                                  <span className="text-[9px] font-black uppercase text-slate-400">{expense.category}</span>
                              </div>
                          </div>
                          <div className="text-right">
                              <p className="font-black text-rose-600">{formatCurrency(expense.amount)}</p>
                              <p className="text-[9px] font-bold text-slate-400">{((expense.amount / (stats.totalExp || 1)) * 100).toFixed(1)}% do total</p>
                          </div>
                      </div>
                  ))}
                  {stats.topExpenses.length === 0 && <div className="py-10 text-center text-slate-300 font-black uppercase italic tracking-widest">Sem despesas registradas</div>}
              </div>
          </div>

          {/* INSIGHTS DE BENCHMARK */}
          <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white shadow-2xl flex flex-col justify-between">
              <div>
                  <div className="flex items-center gap-3 mb-10">
                      <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl"><Zap className="w-6 h-6" /></div>
                      <h3 className="text-2xl font-black tracking-tighter italic uppercase">Benchmarks Estética Pro</h3>
                  </div>

                  <div className="space-y-12">
                      <div className="flex items-center gap-6">
                          <div className={`w-16 h-16 rounded-3xl flex flex-col items-center justify-center font-black ${stats.cmPct >= 60 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                             <span className="text-xs">CM</span>
                          </div>
                          <div>
                              <p className="font-black text-slate-400 text-[10px] uppercase tracking-widest mb-1">Margem de Contribuição</p>
                              <p className="text-sm font-bold text-slate-300 leading-relaxed">
                                  Sua CM está em {stats.cmPct.toFixed(1)}%. {stats.cmPct >= 60 ? 'Excepcional! Suas compras estão sob controle total.' : 'Alerta: Seus custos variáveis estão acima do benchmark (&gt; 40%). Revise estoque e fornecedores.'}
                              </p>
                          </div>
                      </div>

                      <div className="flex items-center gap-6">
                          <div className={`w-16 h-16 rounded-3xl flex flex-col items-center justify-center font-black ${stats.marginPct >= 25 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                             <span className="text-xs">LU</span>
                          </div>
                          <div>
                              <p className="font-black text-slate-400 text-[10px] uppercase tracking-widest mb-1">Lucratividade Líquida</p>
                              <p className="text-sm font-bold text-slate-300 leading-relaxed">
                                  {stats.marginPct >= 25 ? 'Você opera na zona de elite do mercado (Top 5%).' : 'Sua estrutura fixa pode estar comprimindo seu lucro. Considere escalar o faturamento sem subir o custo fixo.'}
                              </p>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="mt-12 pt-10 border-t border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Auditoria de Inteligência</span>
                  </div>
                  <button onClick={() => window.print()} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-slate-400"><Download className="w-6 h-6" /></button>
              </div>
          </div>
      </div>

    </div>
  );
};

const ArrowRight = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>;

export default ReportsTab;
