
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Quote } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';
import { 
  FileText, TrendingDown, TrendingUp, DollarSign, PieChart, 
  ChevronRight, X, BarChart3, Tag, CalendarClock, Wallet, 
  HelpCircle, Sparkles, Wand2, Target, ArrowRight, CheckCircle2,
  Calendar, Info, Activity, Percent, Search
} from 'lucide-react';
import { getQuotes } from '../../../services/supabaseService';

interface DRETabProps {
  transactions: Transaction[];
  onEditTransaction: (transaction: Transaction) => void;
  user: any;
  startDate: Date;
}

const DRETab: React.FC<DRETabProps> = ({ transactions, onEditTransaction, user, startDate }) => {
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'DRE' | 'FCE'>('DRE');
  const [isProjectionActive, setIsProjectionActive] = useState(false);
  const [conversionRate, setConversionRate] = useState(30);
  const [quotes, setQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    if(user) getQuotes(user.id).then(setQuotes);
  }, [user]);

  // Regras de negócio para categorização automática na DRE
  const isTax = (t: Transaction) => t.type === 'expense' && (t.category.toLowerCase().includes('imposto') || t.category.toLowerCase().includes('taxa') || t.description.toLowerCase().includes('das'));
  const isVariable = (t: Transaction) => t.type === 'expense' && !isTax(t) && (t.category.toLowerCase().includes('insumo') || t.category.toLowerCase().includes('produto') || t.category.toLowerCase().includes('comiss') || t.category.toLowerCase().includes('laborat'));
  const isFixed = (t: Transaction) => t.type === 'expense' && !isTax(t) && !isVariable(t);

  const filteredTransactions = useMemo(() => {
    if (viewMode === 'DRE') {
        const year = startDate.getFullYear();
        const month = startDate.getMonth();
        return transactions.filter(t => {
            const d = new Date(t.date);
            return d.getFullYear() === year && d.getMonth() === month;
        });
    }
    // Visão FCE (Fluxo de Caixa Efetivo): Tudo até a data de corte selecionada
    const cutoffDate = new Date(startDate);
    cutoffDate.setHours(23, 59, 59, 999);
    const cutoffTs = cutoffDate.getTime();
    return transactions.filter(t => t.date <= cutoffTs);
  }, [transactions, viewMode, startDate]);

  const stats = useMemo(() => {
    const revenue = filteredTransactions.filter(t => t.type === 'revenue').reduce((s, t) => s + t.amount, 0);
    const tax = filteredTransactions.filter(isTax).reduce((s, t) => s + t.amount, 0);
    const netRevenue = revenue - tax;
    
    const variable = filteredTransactions.filter(isVariable).reduce((s, t) => s + t.amount, 0);
    const contributionMargin = netRevenue - variable;
    
    const fixed = filteredTransactions.filter(isFixed).reduce((s, t) => s + t.amount, 0);
    const ebitda = contributionMargin - fixed; // Resultado Operacional
    
    const marginPct = revenue > 0 ? (ebitda / revenue) * 100 : 0;
    const contributionPct = revenue > 0 ? (contributionMargin / revenue) * 100 : 0;

    // Projeção CRM
    const openQuotesTotal = (quotes.filter(q => q.status !== 'approved').reduce((s, q) => s + q.totalAmount, 0)) * (conversionRate / 100);
    const projectedEbitda = ebitda + (openQuotesTotal * (contributionPct / 100));

    return { revenue, tax, netRevenue, variable, contributionMargin, fixed, ebitda, marginPct, contributionPct, openQuotesTotal, projectedEbitda };
  }, [filteredTransactions, quotes, conversionRate]);

  const handleRowClick = (label: string, transactions: Transaction[], color: string, type: string) => {
    const categoriesMap: Record<string, number> = {};
    transactions.forEach(t => {
      categoriesMap[t.category] = (categoriesMap[t.category] || 0) + t.amount;
    });

    const breakdown = Object.entries(categoriesMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    setSelectedGroup({
        label,
        transactions: [...transactions].sort((a,b) => b.date - a.date),
        total: transactions.reduce((s, t) => s + t.amount, 0),
        color,
        type,
        breakdown
    });
  };

  const Row = ({ label, value, percentage, desc, color, txs, type }: any) => (
    <div 
      onClick={() => handleRowClick(label, txs, color, type)}
      className="group flex flex-col md:flex-row md:items-center justify-between p-8 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all"
    >
      <div className="flex items-center gap-6">
        <div className={`p-4 rounded-2xl ${color.replace('text-', 'bg-').replace('600', '50')} ${color.replace('text-', 'dark:bg-').replace('600', '900/20')} transition-transform group-hover:scale-110`}>
          {label.includes('Entrada') ? <TrendingUp className={`w-6 h-6 ${color}`} /> : 
           label.includes('Imposto') ? <ShieldAlert className={`w-6 h-6 ${color}`} /> :
           label.includes('Insumo') ? <Activity className={`w-6 h-6 ${color}`} /> :
           <TrendingDown className={`w-6 h-6 ${color}`} />}
        </div>
        <div>
          <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">{label}</h4>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{desc}</p>
        </div>
      </div>
      <div className="flex items-center gap-12 mt-4 md:mt-0">
        <div className="text-right">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Impacto (AV)</p>
          <span className="text-sm font-black text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">{percentage.toFixed(1)}%</span>
        </div>
        <div className="text-right min-w-[140px]">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor</p>
          <p className={`text-3xl font-black ${color}`}>{formatCurrency(value)}</p>
        </div>
        <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-slate-400 hidden md:block" />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-500">
      
      {/* HEADER DRE/FCE */}
      <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div className="flex-1">
             <div className="flex items-center gap-4 mb-4">
                <div className={`p-4 rounded-2xl shadow-xl ${viewMode === 'DRE' ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'}`}>
                   {viewMode === 'DRE' ? <CalendarClock className="w-8 h-8" /> : <Wallet className="w-8 h-8" />}
                </div>
                <div>
                   <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic leading-none">
                      {viewMode === 'DRE' ? 'DRE Gerencial' : 'Fluxo de Caixa'}
                   </h2>
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mt-2">Visão de Auditoria de Desempenho</p>
                </div>
             </div>
          </div>

          <div className="flex flex-col gap-4 w-full lg:w-auto">
             <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[2rem] flex gap-1 shadow-inner">
                <button onClick={() => setViewMode('DRE')} className={`flex-1 lg:flex-none px-8 py-3.5 rounded-[1.8rem] text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === 'DRE' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-lg' : 'text-slate-500'}`}>Visão DRE</button>
                <button onClick={() => setViewMode('FCE')} className={`flex-1 lg:flex-none px-8 py-3.5 rounded-[1.8rem] text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === 'FCE' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-lg' : 'text-slate-500'}`}>Visão FCE</button>
             </div>
             <button onClick={() => setIsProjectionActive(!isProjectionActive)} className={`flex items-center justify-center gap-3 px-8 py-4 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest transition-all border-2 ${isProjectionActive ? 'bg-indigo-600 text-white border-indigo-500 shadow-xl' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 hover:border-indigo-200'}`}>
                <Wand2 className="w-4 h-4" /> Simular Pipeline CRM
             </button>
          </div>
      </div>

      {/* GRADE DRE */}
      <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative">
          <Row 
            label="Entradas Brutas" 
            desc="Volume total de créditos registrados" 
            value={stats.revenue} 
            percentage={100}
            color="text-emerald-600" 
            txs={filteredTransactions.filter(t => t.type === 'revenue')}
            type="revenue"
          />
          <Row 
            label="Impostos e Retenções" 
            desc="DAS, Taxas de Cartão e Deduções" 
            value={stats.tax * -1} 
            percentage={(stats.tax / (stats.revenue || 1)) * 100}
            color="text-amber-600" 
            txs={filteredTransactions.filter(isTax)}
            type="expense"
          />
          
          <div className="p-8 bg-slate-50 dark:bg-slate-800/30 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                 <span className="text-xs font-black uppercase tracking-widest text-slate-500">Receita Líquida</span>
              </div>
              <span className="text-2xl font-black text-slate-900 dark:text-white italic">{formatCurrency(stats.netRevenue)}</span>
          </div>

          <Row 
            label="Custos com Insumos" 
            desc="Materiais, Produtos e Comissões" 
            value={stats.variable * -1} 
            percentage={(stats.variable / (stats.revenue || 1)) * 100}
            color="text-indigo-600" 
            txs={filteredTransactions.filter(isVariable)}
            type="expense"
          />

          <div className="p-8 bg-slate-50 dark:bg-slate-800/30 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                 <span className="text-xs font-black uppercase tracking-widest text-slate-500">Margem de Contribuição</span>
              </div>
              <div className="text-right">
                  <span className="text-2xl font-black text-slate-900 dark:text-white italic">{formatCurrency(stats.contributionMargin)}</span>
                  <span className="ml-4 text-xs font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg">{stats.contributionPct.toFixed(1)}%</span>
              </div>
          </div>

          <Row 
            label="Saídas de Estrutura" 
            desc="Aluguel, Folha, Marketing e Fixos" 
            value={stats.fixed * -1} 
            percentage={(stats.fixed / (stats.revenue || 1)) * 100}
            color="text-rose-600" 
            txs={filteredTransactions.filter(isFixed)}
            type="expense"
          />
          
          {/* RESULTADO FINAL (EBITDA) */}
          <div className="p-12 bg-slate-900 dark:bg-slate-950 flex flex-col md:flex-row justify-between items-center text-white gap-8">
             <div>
                <h3 className="text-4xl font-black tracking-tighter italic uppercase leading-none">EBITDA Gerencial</h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-3">Resultado Operacional Disponível</p>
             </div>
             <div className="flex gap-12 items-center w-full md:w-auto">
                <div className="text-right flex-1 md:flex-none">
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Margem EBITDA</p>
                   <p className="text-2xl font-black text-indigo-400">{stats.marginPct.toFixed(1)}%</p>
                </div>
                <div className="text-right">
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Lucro Realizado</p>
                   <p className={`text-5xl font-black ${stats.ebitda >= 0 ? 'text-emerald-400' : 'text-rose-500'} tracking-tighter`}>{formatCurrency(stats.ebitda)}</p>
                </div>
                {isProjectionActive && (
                  <div className="text-right border-l border-white/10 pl-12 hidden md:block">
                     <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mb-1">Estimado CRM</p>
                     <p className="text-5xl font-black text-indigo-400 tracking-tighter">{formatCurrency(stats.projectedEbitda)}</p>
                  </div>
                )}
             </div>
          </div>
      </div>

      {/* MODAL DE DETALHAMENTO (DRILL-DOWN) */}
      {selectedGroup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[90vh] rounded-[4rem] shadow-2xl relative flex flex-col animate-in zoom-in-95 border border-white/10 overflow-hidden">
                
                {/* Header Modal */}
                <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-6">
                        <div className={`p-5 rounded-3xl ${selectedGroup.color.replace('text-', 'bg-').replace('600', '500')} text-white shadow-2xl`}>
                            {/* Fixed: Use imported Search icon */}
                            <Search className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Auditoria Detalhada</p>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">{selectedGroup.label}</h3>
                        </div>
                    </div>
                    <button onClick={() => setSelectedGroup(null)} className="p-4 bg-white dark:bg-slate-700 rounded-full shadow-sm text-slate-400 hover:scale-110 transition-transform"><X className="w-8 h-8"/></button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                    {/* Lista de Transações */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-4 no-scrollbar border-r border-slate-100 dark:border-slate-800">
                        {selectedGroup.transactions.length === 0 ? (
                            <div className="py-20 text-center text-slate-300 font-black uppercase tracking-widest italic">Nenhum registro encontrado</div>
                        ) : (
                            selectedGroup.transactions.map((t: Transaction) => (
                                <div 
                                    key={t.id} 
                                    onClick={() => { onEditTransaction(t); setSelectedGroup(null); }}
                                    className="flex items-center justify-between p-5 bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 hover:border-indigo-500 transition-all cursor-pointer group shadow-sm"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={`p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 ${t.type === 'revenue' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors leading-none mb-2">{t.description}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">{t.category}</span>
                                                <span className="text-[9px] font-bold text-slate-400">{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-6">
                                        <p className={`text-xl font-black ${t.type === 'revenue' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {formatCurrency(t.amount)}
                                        </p>
                                        <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-indigo-400" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Resumo da Categoria (Sidebar Modal) */}
                    <div className="w-full lg:w-80 bg-slate-50 dark:bg-slate-950 p-8 space-y-8 overflow-y-auto no-scrollbar">
                        <div className="space-y-2">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance do Grupo</p>
                           <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Resumo Executivo</h4>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Média por Lançamento</p>
                                <p className="text-xl font-black text-slate-900 dark:text-white">{formatCurrency(selectedGroup.total / (selectedGroup.transactions.length || 1))}</p>
                            </div>
                            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Lançamento de Maior Peso</p>
                                <p className="text-xl font-black text-indigo-600">{formatCurrency(Math.max(...selectedGroup.transactions.map((t:any) => t.amount)))}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mix de Categorias</p>
                            {selectedGroup.breakdown.map((item: any, idx: number) => (
                                <div key={idx} className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-black uppercase">
                                        <span className="text-slate-600 dark:text-slate-300">{item.name}</span>
                                        <span className="text-slate-900 dark:text-white">{((item.value / selectedGroup.total) * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div 
                                          className={`h-full ${selectedGroup.color.replace('text-', 'bg-').replace('600', '500')} rounded-full`} 
                                          style={{ width: `${(item.value / selectedGroup.total) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Modal */}
                <div className="p-10 border-t border-slate-100 dark:border-slate-800 bg-slate-900 dark:bg-slate-950 flex justify-between items-center text-white">
                    <div>
                      <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Total Auditado</span>
                    </div>
                    <span className={`text-4xl font-black ${selectedGroup.color.replace('text-emerald-600', 'text-emerald-400').replace('text-rose-600', 'text-rose-400').replace('text-indigo-600', 'text-indigo-400').replace('text-amber-600', 'text-amber-400')}`}>
                        {formatCurrency(Math.abs(selectedGroup.total))}
                    </span>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

const ShieldAlert = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>;

export default DRETab;
