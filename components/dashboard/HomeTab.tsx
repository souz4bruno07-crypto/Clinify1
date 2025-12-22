
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router';
import { 
  TrendingUp, MessageSquare, FileText, Plus, 
  ArrowRight, Users, Sparkles, DollarSign, 
  Target, BarChart3, Users2, BellRing, Cake,
  ShieldCheck, Wallet, Zap, CalendarDays, Activity,
  ArrowUpRight, ArrowDownRight, Gem, Briefcase,
  ChevronRight, X, Gift, Send, Check, Percent, Edit3, Loader2, Coins
} from 'lucide-react';
import { Transaction, ChatContact, Quote, MonthlyTarget } from '../../types';
import { 
  getChatContacts, 
  getQuotes,
  getMonthlyTarget,
  upsertMonthlyTarget,
  sendMessage
} from '../../services/supabaseService';
import { formatCurrency, formatCurrencyValue, parseCurrencyInput } from '../../utils/formatters';

interface HomeTabProps {
  user: any;
  transactions: Transaction[];
  onOpenTransactionModal: () => void;
  startDate: Date;
  target: { planned_revenue: number; planned_purchases: number } | null;
  setMonthlyGoal: (goal: number, budget: number) => Promise<void>;
}

const HomeTab: React.FC<HomeTabProps> = ({ user, transactions, onOpenTransactionModal, startDate, target, setMonthlyGoal }) => {
  const [leads, setLeads] = useState<ChatContact[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Mimos State
  const [selectedMimoPatient, setSelectedMimoPatient] = useState<any>(null);
  const [isSendingMimo, setIsSendingMimo] = useState(false);
  const [mimoSent, setMimoSent] = useState(false);

  // Goal State
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [isSavingGoal, setIsSavingGoal] = useState(false);

  const monthLabel = startDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const loadHomeData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [chats, qts] = await Promise.all([
        getChatContacts(user.id),
        getQuotes(user.id)
      ]);
      setLeads(chats);
      setQuotes(qts);
      if (target) setGoalInput(formatCurrencyValue(target.planned_revenue));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, [user, startDate]);

  // Sincroniza input ao abrir modal
  useEffect(() => {
    if (isGoalModalOpen && target) {
      setGoalInput(formatCurrencyValue(target.planned_revenue));
    }
  }, [isGoalModalOpen, target]);

  const stats = useMemo(() => {
    const currentMonthTxs = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === startDate.getMonth() && d.getFullYear() === startDate.getFullYear();
    });
    
    const revenue = currentMonthTxs.filter(t => t.type === 'revenue').reduce((s, t) => s + t.amount, 0);
    const expenses = currentMonthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const profit = revenue - expenses;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    
    const revTxs = currentMonthTxs.filter(t => t.type === 'revenue');
    const ticketMedio = revTxs.length > 0 ? revenue / revTxs.length : 0;

    const pipelineTotal = quotes.filter(q => q.status === 'draft' || q.status === 'sent').reduce((s, q) => s + q.totalAmount, 0);
    const activeLeads = leads.length;

    return { 
        revenue, profit, margin, ticketMedio, 
        pipelineTotal, activeLeads,
        goalPct: target?.planned_revenue ? (revenue / target.planned_revenue) * 100 : 0
    };
  }, [transactions, target, quotes, leads, startDate]);

  const handleSaveGoal = async () => {
    if (!user) return;
    setIsSavingGoal(true);
    const newVal = parseCurrencyInput(goalInput);
    await setMonthlyGoal(newVal, target?.planned_purchases || 0);
    setIsSavingGoal(false);
    setIsGoalModalOpen(false);
  };

  const handleSendMimo = async (mimoType: string) => {
    if (!selectedMimoPatient) return;
    setIsSendingMimo(true);
    
    const messages: Record<string, string> = {
      'gift': `Parabéns ${selectedMimoPatient.name}! 🎉 A Clínica preparou um presente especial para você: Uma Limpeza de Pele Cortesia em sua próxima visita. Vamos agendar?`,
      'discount': `Olá ${selectedMimoPatient.name}! Como seu aniversário está chegando, liberamos um cupom de 15% OFF em qualquer procedimento de Harmonização. Aproveite! 🎂`,
      'vip': `Feliz aniversário antecipado, ${selectedMimoPatient.name}! Você é uma de nossas pacientes VIPs e ganhou um kit exclusivo de Home-Care. Pode vir buscar hoje? 🎁`
    };

    await sendMessage(selectedMimoPatient.id, messages[mimoType], 'outbound');
    
    setIsSendingMimo(false);
    setMimoSent(true);
    setTimeout(() => {
      setMimoSent(false);
      setSelectedMimoPatient(null);
    }, 2000);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      
      {/* SEÇÃO 1: NÚCLEO FINANCEIRO */}
      <section className="space-y-8">
          <div className="flex items-end justify-between px-2">
              <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.4em] text-emerald-600 dark:text-emerald-400 mb-2">Núcleo Financeiro</h3>
                  <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic">Saúde e Capital</h2>
              </div>
              <Link to="/dashboard/finance" className="text-[10px] font-black uppercase text-slate-400 hover:text-emerald-600 transition-colors flex items-center gap-2 tracking-widest">
                  Gestão Completa <ArrowRight className="w-4 h-4" />
              </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <Link to="/dashboard/finance/dre" className="lg:col-span-8 bg-slate-900 rounded-[3.5rem] p-10 md:p-12 text-white shadow-2xl relative overflow-hidden group hover:scale-[1.01] transition-all">
                  <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform"><TrendingUp className="w-64 h-64" /></div>
                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
                      <div className="md:col-span-7 flex flex-col justify-between">
                          <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Faturamento Realizado ({monthLabel})</p>
                            <h3 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter mb-8 whitespace-nowrap overflow-visible leading-none">
                              {formatCurrency(stats.revenue)}
                            </h3>
                          </div>
                          <div className="flex items-center gap-6 pt-8 border-t border-white/5">
                              <div>
                                  <p className="text-[9px] font-black text-slate-500 uppercase">Margem Real</p>
                                  <p className="text-xl font-black text-emerald-400">{stats.margin.toFixed(1)}%</p>
                              </div>
                              <div className="h-10 w-px bg-white/5"></div>
                              <div>
                                  <p className="text-[9px] font-black text-slate-500 uppercase">Lucro Líquido</p>
                                  <p className="text-xl font-black text-white">{formatCurrency(stats.profit)}</p>
                              </div>
                          </div>
                      </div>
                      
                      <div className="md:col-span-5 bg-white/5 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/5 flex flex-col justify-between relative group/meta min-h-[200px]">
                          <div>
                              <div className="flex justify-between items-center mb-1">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status da Meta</p>
                                  <button 
                                    onClick={(e) => { e.preventDefault(); setIsGoalModalOpen(true); }}
                                    className="p-2 bg-white/10 hover:bg-emerald-500 text-white rounded-xl transition-all scale-90 group-hover/meta:scale-100 opacity-50 group-hover/meta:opacity-100"
                                    title="Alterar Meta"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                              </div>
                              <p className="text-3xl font-black text-indigo-400">{stats.goalPct.toFixed(1)}%</p>
                          </div>
                          <div className="space-y-3">
                              <div className="h-3 bg-white/5 rounded-full overflow-hidden p-0.5">
                                  <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-1000" style={{ width: `${Math.min(stats.goalPct, 100)}%` }}></div>
                              </div>
                              <p className="text-[9px] font-bold text-slate-500 uppercase text-center">Alvo: {formatCurrency(target?.planned_revenue || 0)}</p>
                          </div>
                      </div>
                  </div>
              </Link>

              <div className="lg:col-span-4 grid grid-cols-1 gap-6">
                  <Link to="/dashboard/finance/relatorios" className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm group hover:shadow-xl transition-all">
                      <div className="flex justify-between items-start mb-6">
                          <div className="p-3.5 rounded-2xl bg-indigo-600 text-white shadow-lg"><Gem className="w-5 h-5" /></div>
                          <span className="text-[10px] font-black uppercase text-slate-300 dark:text-slate-700 tracking-widest">Analytics</span>
                      </div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Ticket Médio</p>
                      <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic">{formatCurrency(stats.ticketMedio)}</h3>
                  </Link>
                  <Link to="/dashboard/finance/lancamentos" className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm group hover:shadow-xl transition-all">
                      <div className="flex justify-between items-start mb-6">
                          <div className="p-3.5 rounded-2xl bg-rose-500 text-white shadow-lg"><Briefcase className="w-5 h-5" /></div>
                          <span className="text-[10px] font-black uppercase text-slate-300 dark:text-slate-700 tracking-widest">Fluxo</span>
                      </div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Custos Operacionais</p>
                      <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic">{formatCurrency(stats.revenue - stats.profit)}</h3>
                  </Link>
              </div>
          </div>
      </section>

      {/* SEÇÃO 2: RELACIONAMENTO */}
      <section className="space-y-8">
          <div className="flex items-end justify-between px-2">
              <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.4em] text-rose-600 dark:text-rose-400 mb-2">Ciclos de Vida</h3>
                  <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic">Encantamento e Vendas</h2>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><Cake className="w-32 h-32 text-rose-500" /></div>
                  <div className="flex items-center gap-5 mb-10">
                      <div className="w-20 h-20 rounded-[2rem] bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center font-black text-rose-600 text-3xl shadow-inner border border-rose-100 dark:border-rose-800">MJ</div>
                      <div>
                          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Maria Julia</h3>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aniversário: Amanhã</p>
                      </div>
                  </div>
                  <button 
                    onClick={() => setSelectedMimoPatient({ id: 'mj1', name: 'Maria Julia' })}
                    className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                  >
                      Enviar Mimo 🎉
                  </button>
              </div>

              <Link to="/dashboard/crm" className="bg-indigo-600 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden group transition-all hover:scale-[1.01]">
                  <div className="absolute top-0 right-0 p-8 opacity-10"><MessageSquare className="w-32 h-32" /></div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Leads em Aberto</p>
                  <h3 className="text-6xl font-black tracking-tighter italic mb-10">{stats.activeLeads}</h3>
                  <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase">Responder no WhatsApp</span>
                      <ArrowRight className="w-5 h-5" />
                  </div>
              </Link>

              <Link to="/dashboard/orcamentos" className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group transition-all hover:scale-[1.01]">
                  <div className="absolute top-0 right-0 p-8 opacity-5"><FileText className="w-32 h-32 text-indigo-600" /></div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Poder de Injeção</p>
                  <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic mb-8">{formatCurrency(stats.pipelineTotal)}</h3>
                  <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                      <Zap className="w-5 h-5 text-emerald-600" />
                      <p className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Converta orçamentos agora</p>
                  </div>
              </Link>
          </div>
      </section>

      {/* MODAL: ALTERAR META - PADRÃO ATM */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] shadow-2xl animate-in zoom-in-95 border border-white/10 overflow-hidden">
                <div className="p-8 border-b bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none">Novo Alvo</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Defina o faturamento para {monthLabel}</p>
                    </div>
                    <button onClick={() => setIsGoalModalOpen(false)} className="p-3 bg-white dark:bg-slate-700 rounded-full text-slate-400 shadow-sm"><X className="w-6 h-6"/></button>
                </div>
                <div className="p-8 space-y-6">
                    <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Faturamento Desejado</label>
                        <div className="relative mt-2">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-2xl">R$</span>
                            <input 
                                type="tel" autoFocus
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-3xl py-8 pl-16 pr-8 text-4xl font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10"
                                value={goalInput}
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/\D/g, '');
                                  if (raw.length > 12) return;
                                  const value = Number(raw) / 100;
                                  setGoalInput(formatCurrencyValue(value));
                                }}
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            type="button"
                            onClick={() => setIsGoalModalOpen(false)}
                            className="flex-1 py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest text-slate-400"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleSaveGoal}
                            disabled={isSavingGoal}
                            className="flex-[2] bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                        >
                            {isSavingGoal ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Confirmar</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* MODAL: SELEÇÃO DE MIMO */}
      {selectedMimoPatient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[4rem] shadow-2xl animate-in zoom-in-95 border border-white/10 overflow-hidden relative">
                {mimoSent ? (
                  <div className="p-20 text-center flex flex-col items-center justify-center animate-in fade-in duration-500">
                      <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6">
                        <Check className="w-12 h-12 text-emerald-600" />
                      </div>
                      <h3 className="text-3xl font-black tracking-tighter italic uppercase mb-2">Estratégia Aplicada!</h3>
                      <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">O mimo foi enviado para o WhatsApp do paciente</p>
                  </div>
                ) : (
                  <>
                    <div className="p-12 border-b bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                        <div>
                          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none">Estratégia de Encanto</h3>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Escolha o presente para {selectedMimoPatient.name}</p>
                        </div>
                        <button onClick={() => setSelectedMimoPatient(null)} className="p-4 bg-white dark:bg-slate-700 rounded-full text-slate-400 shadow-sm"><X className="w-6 h-6"/></button>
                    </div>
                    
                    <div className="p-10 space-y-4">
                        <button 
                          onClick={() => handleSendMimo('gift')}
                          disabled={isSendingMimo}
                          className="w-full flex items-center justify-between p-6 bg-rose-50 dark:bg-rose-900/10 border-2 border-rose-100 dark:border-rose-900/30 rounded-[2.5rem] group hover:border-rose-500 transition-all text-left"
                        >
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-rose-500 group-hover:scale-110 transition-transform"><Gift className="w-8 h-8" /></div>
                                <div>
                                    <h4 className="font-black text-rose-900 dark:text-rose-100 text-lg uppercase italic tracking-tighter">Mimo Físico/Cortesia</h4>
                                    <p className="text-xs font-bold text-rose-600/70">Gera altíssimo valor e recorrência</p>
                                </div>
                            </div>
                            <Send className="w-6 h-6 text-rose-400 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <button 
                          onClick={() => handleSendMimo('discount')}
                          disabled={isSendingMimo}
                          className="w-full flex items-center justify-between p-6 bg-indigo-50 dark:bg-indigo-900/10 border-2 border-indigo-100 dark:border-indigo-900/30 rounded-[2.5rem] group hover:border-indigo-500 transition-all text-left"
                        >
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-indigo-500 group-hover:scale-110 transition-transform"><Percent className="w-8 h-8" /></div>
                                <div>
                                    <h4 className="font-black text-indigo-900 dark:text-indigo-100 text-lg uppercase italic tracking-tighter">Cupom de Aniversário</h4>
                                    <p className="text-xs font-bold text-indigo-600/70">Ideal para conversão de vendas</p>
                                </div>
                            </div>
                            <Send className="w-6 h-6 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <button 
                          onClick={() => handleSendMimo('vip')}
                          disabled={isSendingMimo}
                          className="w-full flex items-center justify-between p-6 bg-slate-900 rounded-[2.5rem] group transition-all text-left"
                        >
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-white/10 rounded-2xl text-emerald-400 group-hover:scale-110 transition-transform"><Sparkles className="w-8 h-8" /></div>
                                <div>
                                    <h4 className="font-black text-white text-lg uppercase italic tracking-tighter">Upgrade VIP</h4>
                                    <p className="text-xs font-bold text-slate-500">Convite para evento ou kit especial</p>
                                </div>
                            </div>
                            <Send className="w-6 h-6 text-emerald-500 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                  </>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default HomeTab;
