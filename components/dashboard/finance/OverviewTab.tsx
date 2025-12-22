
import React, { useMemo, useState, useEffect } from 'react';
import { Transaction, AIAnalysisResult, Quote } from '../../../types';
import AIInsightsWidget from '../../AIInsightsWidget';
import { 
  TrendingUp, ShoppingBag, Coins, Calculator, Sparkles, Flame
} from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import { getQuotes } from '../../../services/supabaseService';

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
                      <h2 className="text-5xl sm:text-6xl font-black text-white tracking-tighter leading-none">{formatCurrency(kpis.totalRev)}</h2>
                      <div className="flex items-center gap-3 mt-4">
                        <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                          <p className="text-[7px] font-black text-slate-500 uppercase">Média Diária</p>
                          <p className="text-xs font-bold text-emerald-400">{formatCurrency(kpis.dailyAvg)}</p>
                        </div>
                        <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                          <p className="text-[7px] font-black text-slate-500 uppercase">Projeção Mês</p>
                          <p className="text-xs font-bold text-indigo-400">{formatCurrency(kpis.projection)}</p>
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
                      <h2 className={`text-5xl sm:text-6xl font-black tracking-tighter leading-none ${kpis.totalInsumos > props.monthlyBudget && props.monthlyBudget > 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>{formatCurrency(kpis.totalInsumos)}</h2>
                      <div className="flex items-center gap-3 mt-4">
                        <div className="bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                          <p className="text-[7px] font-black text-slate-400 uppercase">Saldo Budget</p>
                          <p className={`text-xs font-bold ${props.monthlyBudget - kpis.totalInsumos < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>{formatCurrency(Math.max(0, props.monthlyBudget - kpis.totalInsumos))}</p>
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
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl"><p className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-1">Cenário Faturamento</p><h4 className="text-xl font-black text-emerald-400 tracking-tighter">{formatCurrency(kpis.potentialRevenue)}</h4></div>
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl"><p className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-1">Injeção de Caixa</p><h4 className="text-xl font-black text-white tracking-tighter">+{formatCurrency(kpis.potentialRevenue - kpis.totalRev)}</h4></div>
              </div>
          </div>
      </div>

      {/* INDICADORES COMPACTOS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card: Lucro */}
          <div className="bg-indigo-500 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group aspect-[4/3] flex flex-col justify-between">
              <p className="text-[10px] font-black uppercase text-indigo-200 tracking-[0.2em]">Lucro</p>
              <div>
                  <h3 className="text-3xl lg:text-4xl font-black tracking-tighter leading-none">{formatCurrency(kpis.profit)}</h3>
              </div>
          </div>

          {/* Card: Fisco */}
          <div className="bg-white dark:bg-slate-100 p-8 rounded-[2.5rem] border border-slate-200 shadow-lg relative overflow-hidden group aspect-[4/3] flex flex-col justify-between">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Fisco</p>
              <div>
                  <h3 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter leading-none italic">Provisão</h3>
                  <p className="text-sm font-bold text-slate-500 mt-1">{formatCurrency(kpis.totalRev * 0.06)}</p>
              </div>
          </div>

          {/* Card: Status */}
          <div className="bg-emerald-500 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group aspect-[4/3] flex flex-col justify-between">
              <p className="text-[10px] font-black uppercase text-emerald-100 tracking-[0.2em]">Status</p>
              <div>
                  <h3 className="text-2xl lg:text-3xl font-black tracking-tighter leading-none">
                      {kpis.margin >= 25 ? 'Elite' : kpis.margin >= 15 ? 'Pro' : 'Starter'}
                  </h3>
                  <p className="text-xs font-bold text-emerald-100 mt-1">Margem: {kpis.margin.toFixed(0)}%</p>
              </div>
          </div>

          {/* Card: Live */}
          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group aspect-[4/3] flex flex-col justify-between">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Live</p>
              <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50"></div>
                  <span className="text-sm font-bold text-slate-300">Sincronizado</span>
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
