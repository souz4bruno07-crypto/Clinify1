
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router';
import { 
  FileText, PieChart, ArrowLeftRight, Calculator,
  ChevronLeft, ChevronRight, Calendar, FlaskConical, Tags, 
  Target, X, Check, Loader2, LayoutDashboard, ChevronDown, CalendarDays, Wallet,
  Calendar as CalendarLucide, RefreshCcw
} from 'lucide-react';
import OverviewTab from './OverviewTab';
import TransactionsTab from './TransactionsTab';
import DRETab from './DRETab';
import ReportsTab from './ReportsTab';
import PricingTab from './PricingTab';
import LaboratoryTab from './LaboratoryTab';
import CategoriesTab from './CategoriesTab';
import { formatCurrencyValue, parseCurrencyInput } from '../../../utils/formatters';

interface FinanceMainProps {
  transactions: any[];
  categories: any[];
  isLoading: boolean;
  user: any;
  aiAnalysis: any;
  loadingAnalysis: boolean;
  onRefreshAI: () => void;
  refreshData: () => void;
  onOpenTransactionModal: (tx?: any) => void;
  startDate: Date;
  setCurrentDate: (d: Date) => void;
  monthlyGoal: number;
  monthlyBudget: number;
  isTargetLoading: boolean;
  setMonthlyGoal: (goal: number, budget: number) => Promise<void> | void;
}

const FinanceMain: React.FC<FinanceMainProps> = (props) => {
  const { subtab } = useParams();
  const activeSubTab = subtab || 'dashboard';
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [localGoal, setLocalGoal] = useState('');
  const [localBudget, setLocalBudget] = useState('');
  
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isTargetModalOpen) {
      setLocalGoal(formatCurrencyValue(props.monthlyGoal));
      setLocalBudget(formatCurrencyValue(props.monthlyBudget));
    }
  }, [isTargetModalOpen, props.monthlyGoal, props.monthlyBudget]);

  const handleDateClick = () => {
    if (dateInputRef.current) {
      try {
        (dateInputRef.current as any).showPicker();
      } catch (e) {
        dateInputRef.current.focus();
        dateInputRef.current.click();
      }
    }
  };

  const handleGoToday = () => {
    props.setCurrentDate(new Date());
  };

  const monthlyTransactions = useMemo(() => {
    const year = props.startDate.getFullYear();
    const month = props.startDate.getMonth();
    return props.transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [props.transactions, props.startDate]);

  const tabs = [
    { id: 'dashboard', label: 'Monitor', icon: LayoutDashboard },
    { id: 'lancamentos', label: 'Lançamentos', icon: ArrowLeftRight },
    { id: 'dre', label: 'DRE & FCE', icon: FileText },
    { id: 'precificacao', label: 'Markup', icon: Calculator },
    { id: 'laboratorio', label: 'Estratégico', icon: FlaskConical },
    { id: 'categorias', label: 'Plano', icon: Tags },
    { id: 'relatorios', label: 'Análise', icon: PieChart },
  ];

  const handleCurrencyInput = (val: string, setter: (v: string) => void) => {
    const raw = val.replace(/\D/g, '');
    if (raw.length > 12) return;
    const value = Number(raw) / 100;
    setter(formatCurrencyValue(value));
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      
      {/* HEADER COMPACTO */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative group flex-1 md:flex-none">
                  <button 
                    onClick={handleDateClick}
                    className="flex items-center gap-3 bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/30 transition-all active:scale-95 w-full md:min-w-[240px]"
                  >
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                        <CalendarLucide className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="text-left flex-1">
                          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Corte Temporal</p>
                          <h3 className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider italic leading-none">
                            {props.startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </h3>
                      </div>
                      <ChevronDown className="w-3 h-3 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                  </button>

                  <input 
                    ref={dateInputRef}
                    type="date"
                    className="absolute inset-0 opacity-0 pointer-events-none"
                    value={props.startDate.toISOString().split('T')[0]}
                    onChange={(e) => {
                      if(e.target.value) {
                        props.setCurrentDate(new Date(e.target.value + 'T12:00:00'));
                      }
                    }}
                  />
              </div>

              <button 
                onClick={handleGoToday}
                className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-slate-400 hover:text-emerald-600 transition-all active:scale-90"
                title="Hoje"
              >
                <RefreshCcw className="w-4 h-4" />
              </button>
          </div>

          <button 
              onClick={() => setIsTargetModalOpen(true)}
              className="flex items-center gap-2.5 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all w-full md:w-auto justify-center"
          >
              <Target className="w-4 h-4" /> Definir Planejamento
          </button>
      </div>

      {/* SUB-MENU TIPO PILLS MAIS FINO */}
      <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <Link
                key={tab.id}
                to={`/dashboard/finance/${tab.id}`}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md' 
                    : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? '' : 'opacity-50'}`} />
                {tab.label}
              </Link>
            );
          })}
      </div>

      <div className="pt-2">
        {(() => {
          switch (activeSubTab) {
            case 'dashboard': return <OverviewTab transactions={monthlyTransactions} isLoading={props.isLoading} user={props.user} aiAnalysis={props.aiAnalysis} loadingAnalysis={false} onRefreshAI={props.onRefreshAI} startDate={props.startDate} monthlyGoal={props.monthlyGoal} monthlyBudget={props.monthlyBudget} isTargetLoading={props.isTargetLoading} />;
            case 'lancamentos': return <TransactionsTab transactions={monthlyTransactions} onEdit={props.onOpenTransactionModal} onDelete={async (id) => { if(window.confirm("Excluir?")) { const { deleteTransaction } = await import('../../../services/supabaseService'); await deleteTransaction(id); props.refreshData(); } }} />;
            case 'dre': return <DRETab transactions={monthlyTransactions} onEditTransaction={props.onOpenTransactionModal} user={props.user} startDate={props.startDate} />;
            case 'precificacao': return <PricingTab transactions={props.transactions} />; 
            case 'laboratorio': return <LaboratoryTab transactions={monthlyTransactions} />;
            case 'categorias': return <CategoriesTab categories={props.categories} user={props.user} onRefresh={props.refreshData} />;
            case 'relatorios': return <ReportsTab transactions={props.transactions} user={props.user} startDate={props.startDate} />;
            default: return null;
          }
        })()}
      </div>

      {isTargetModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-lg">
              <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-2xl animate-in zoom-in-95 border border-white/10 overflow-hidden">
                  <div className="p-10 border-b bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none">Planejamento</h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Metas de Receita e Insumos</p>
                      </div>
                      <button onClick={() => setIsTargetModalOpen(false)} className="p-3 bg-white dark:bg-slate-700 rounded-full shadow-sm text-slate-400 hover:scale-110 transition-transform"><X className="w-6 h-6"/></button>
                  </div>
                  <div className="p-10 space-y-8">
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Faturamento Alvo</label>
                          <div className="relative">
                              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">R$</span>
                              <input 
                                  type="tel" autoFocus
                                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-6 pl-16 pr-8 text-3xl font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10" 
                                  value={localGoal} 
                                  onChange={e => handleCurrencyInput(e.target.value, setLocalGoal)} 
                              />
                          </div>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teto de Compras (Budget)</label>
                          <div className="relative">
                              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">R$</span>
                              <input 
                                  type="tel" 
                                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-6 pl-16 pr-8 text-3xl font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10" 
                                  value={localBudget} 
                                  onChange={e => handleCurrencyInput(e.target.value, setLocalBudget)} 
                              />
                          </div>
                      </div>
                      <button onClick={async () => { await props.setMonthlyGoal(parseCurrencyInput(localGoal), parseCurrencyInput(localBudget)); setIsTargetModalOpen(false); }} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-6 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                        <Check className="w-5 h-5" /> Confirmar Estratégia
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default FinanceMain;
