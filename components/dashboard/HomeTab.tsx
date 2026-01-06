
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router';
import { 
  TrendingUp, MessageSquare, FileText, Plus, 
  ArrowRight, Users, Sparkles, DollarSign, 
  Target, BarChart3, Calendar, Activity,
  ArrowUpRight, ArrowDownRight, CheckCircle2,
  Clock, User, Zap, Wallet, Briefcase,
  Gift, Bell, Flame, Sun, Moon, Sunset, TrendingDown
} from 'lucide-react';
import { Transaction, Appointment, User as UserType, ChatContact, Quote } from '../../types';
import { 
  getChatContacts, 
  getQuotes,
  getTodayAppointments,
  getUpcomingBirthdays,
  type BirthdayPatient
} from '../../services/backendService';
import { formatCurrency } from '../../utils/formatters';
import AnimatedNumber from '../ui/AnimatedNumber';
import { SkeletonAppointmentCards } from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';
import CalendarDateSelector from '../ui/CalendarDateSelector';

interface HomeTabProps {
  user: UserType | null;
  transactions: Transaction[];
  onOpenTransactionModal: () => void;
  startDate: Date;
  setCurrentDate?: (date: Date) => void;
  target: { planned_revenue: number; planned_purchases: number } | null;
  setMonthlyGoal: (goal: number, budget: number) => Promise<void>;
}

const HomeTab: React.FC<HomeTabProps> = ({ user, transactions, onOpenTransactionModal, startDate, setCurrentDate, target, setMonthlyGoal }) => {
  const navigate = useNavigate();
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [leads, setLeads] = useState<ChatContact[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [birthdays, setBirthdays] = useState<BirthdayPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const monthLabel = useMemo(() => 
    startDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
    [startDate]
  );

  // Saudação personalizada baseada no horário
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Bom dia', icon: Sun, emoji: '☀️' };
    if (hour < 18) return { text: 'Boa tarde', icon: Sunset, emoji: '🌤️' };
    return { text: 'Boa noite', icon: Moon, emoji: '🌙' };
  }, []);

  const loadHomeData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [todayAppts, chatContacts, qts, bdays] = await Promise.all([
        getTodayAppointments(user.id),
        getChatContacts(user.id).catch(() => []),
        getQuotes(user.id).catch(() => []),
        getUpcomingBirthdays(user.id).catch(() => [])
      ]);
      setTodayAppointments(todayAppts);
      setLeads(chatContacts);
      setQuotes(qts);
      setBirthdays(bdays);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData, startDate]);


  const stats = useMemo(() => {
    const currentMonthTxs = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === startDate.getMonth() && d.getFullYear() === startDate.getFullYear();
    });
    
    const revenue = currentMonthTxs.filter(t => t.type === 'revenue').reduce((s, t) => s + t.amount, 0);
    const expenses = currentMonthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const profit = revenue - expenses;
    
    // Comparação com mês anterior
    const prevMonth = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1);
    const prevMonthTxs = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === prevMonth.getMonth() && d.getFullYear() === prevMonth.getFullYear();
    });
    const prevRevenue = prevMonthTxs.filter(t => t.type === 'revenue').reduce((s, t) => s + t.amount, 0);
    const prevExpenses = prevMonthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const prevProfit = prevRevenue - prevExpenses;
    
    const revenueGrowth = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
    const expensesGrowth = prevExpenses > 0 ? ((expenses - prevExpenses) / prevExpenses) * 100 : 0;
    const profitGrowth = prevProfit !== 0 ? ((profit - prevProfit) / Math.abs(prevProfit)) * 100 : 0;
    
    // Agendamentos confirmados hoje
    const confirmedToday = todayAppointments.filter(a => a.status === 'confirmed').length;

    return { 
      revenue, 
      expenses, 
      profit, 
      revenueGrowth, 
      expensesGrowth, 
      profitGrowth,
      confirmedToday,
      totalToday: todayAppointments.length
    };
  }, [transactions, startDate, todayAppointments]);

  // Últimas transações (4 mais recentes)
  const latestTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => b.date - a.date)
      .slice(0, 4);
  }, [transactions]);

  // Próximos agendamentos
  const upcomingAppointments = useMemo(() => {
    const now = Date.now();
    return todayAppointments
      .filter(a => a.status !== 'canceled')
      .sort((a, b) => a.startTime - b.startTime)
      .slice(0, 4);
  }, [todayAppointments]);

  const getStatusStyle = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-500 text-white';
      case 'completed': return 'bg-slate-600 text-white';
      case 'canceled': return 'bg-rose-500 text-white';
      default: return 'bg-orange-500 text-white';
    }
  };

  const getStatusLabel = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed': return 'Confirmado';
      case 'completed': return 'Concluído';
      case 'canceled': return 'Cancelado';
      default: return 'Pendente';
    }
  };

  const formatTransactionDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  const formatTransactionTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };


  // Progresso da meta mensal
  const goalProgress = target && target.planned_revenue > 0 
    ? Math.min((stats.revenue / target.planned_revenue) * 100, 100) 
    : 0;

  // Aniversariantes de hoje
  const todayBirthdays = useMemo(() => {
    const today = new Date();
    return birthdays.filter(b => {
      if (!b.birth_date) return false;
      const bday = new Date(b.birth_date);
      return bday.getDate() === today.getDate() && bday.getMonth() === today.getMonth();
    });
  }, [birthdays]);

  // Próximos aniversariantes (próximos 7 dias)
  const upcomingBirthdays = useMemo(() => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    return birthdays.filter(b => {
      if (!b.birth_date) return false;
      const bday = new Date(b.birth_date);
      bday.setFullYear(today.getFullYear());
      return bday >= today && bday <= nextWeek;
    }).slice(0, 3);
  }, [birthdays]);

  // Callbacks de navegação
  const navigateToAgenda = useCallback(() => navigate('/dashboard/agenda'), [navigate]);
  const navigateToCRM = useCallback(() => navigate('/dashboard/crm'), [navigate]);
  const navigateToOrcamentos = useCallback(() => navigate('/dashboard/orcamentos'), [navigate]);
  const navigateToPacientes = useCallback(() => navigate('/dashboard/pacientes'), [navigate]);

  // Tarefas e lembretes do dia
  const todayTasks = useMemo(() => {
    const tasks: Array<{
      icon: typeof Bell;
      text: string;
      color: 'amber' | 'indigo' | 'blue' | 'pink';
      action: () => void;
    }> = [];
    
    if (stats.totalToday - stats.confirmedToday > 0) {
      tasks.push({
        icon: Bell,
        text: `${stats.totalToday - stats.confirmedToday} agendamento(s) pendente(s) de confirmação`,
        color: 'amber',
        action: navigateToAgenda
      });
    }
    if (leads.length > 0) {
      tasks.push({
        icon: MessageSquare,
        text: `${leads.length} lead(s) aguardando resposta`,
        color: 'indigo',
        action: navigateToCRM
      });
    }
    const pendingQuotes = quotes.filter(q => q.status === 'draft' || q.status === 'sent').length;
    if (pendingQuotes > 0) {
      tasks.push({
        icon: FileText,
        text: `${pendingQuotes} orçamento(s) pendente(s)`,
        color: 'blue',
        action: navigateToOrcamentos
      });
    }
    if (todayBirthdays.length > 0) {
      tasks.push({
        icon: Gift,
        text: `${todayBirthdays.length} aniversariante(s) hoje!`,
        color: 'pink',
        action: navigateToPacientes
      });
    }
    return tasks;
  }, [stats, leads, quotes, todayBirthdays, navigateToAgenda, navigateToCRM, navigateToOrcamentos, navigateToPacientes]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-4">
      {/* SELETOR DE DATA */}
      {setCurrentDate && (
        <CalendarDateSelector
          selectedDate={startDate}
          onDateChange={setCurrentDate}
        />
      )}
      
      {/* BOAS-VINDAS PERSONALIZADAS */}
      <div className="px-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <greeting.icon className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                {greeting.text}, {user?.name?.split(' ')[0] || 'Usuário'}! {greeting.emoji}
              </h1>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          {goalProgress > 0 && (
            <div className="hidden md:flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-2xl px-6 py-4 border border-emerald-200 dark:border-emerald-800">
              <Target className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-xs font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-widest">Meta do Mês</p>
                <p className="text-2xl font-black text-emerald-900 dark:text-emerald-100">{goalProgress.toFixed(0)}%</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* WIDGET: FOCO DO DIA */}
      {todayTasks.length > 0 && (
        <section className="space-y-4">
          <div className="px-2">
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Foco do Dia
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Atenção necessária hoje</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todayTasks.map((task, idx) => {
              const Icon = task.icon;
              const colorClasses = {
                amber: 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300',
                indigo: 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-300',
                blue: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-300',
                pink: 'bg-pink-50 dark:bg-pink-900/10 border-pink-200 dark:border-pink-800 text-pink-900 dark:text-pink-300'
              };
              return (
                <button
                  key={idx}
                  onClick={task.action}
                  className={`flex items-center gap-4 p-5 rounded-2xl border-2 hover:scale-[1.02] transition-all text-left ${colorClasses[task.color as keyof typeof colorClasses]}`}
                >
                  <Icon className="w-6 h-6 shrink-0" />
                  <span className="text-sm font-black">{task.text}</span>
                  <ArrowRight className="w-4 h-4 ml-auto shrink-0" />
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* WIDGET: METAS DO MÊS COM PROGRESSO VISUAL */}
      {target && target.planned_revenue > 0 && (
        <section className="space-y-4">
          <div className="px-2">
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-600" />
              Metas do Mês
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Acompanhamento de receita e despesas planejadas</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="space-y-6">
              {/* Meta de Receita */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-black text-slate-900 dark:text-white">Receita Planejada</span>
                  </div>
                  <span className="text-sm font-black text-slate-500">
                    {formatCurrency(stats.revenue)} / {formatCurrency(target.planned_revenue)}
                  </span>
                </div>
                <div className="relative h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${goalProgress}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 z-10">
                      {goalProgress.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Meta de Despesas */}
              {target.planned_purchases > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-rose-600" />
                      <span className="text-sm font-black text-slate-900 dark:text-white">Despesas Planejadas</span>
                    </div>
                    <span className="text-sm font-black text-slate-500">
                      {formatCurrency(stats.expenses)} / {formatCurrency(target.planned_purchases)}
                    </span>
                  </div>
                  <div className="relative h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-rose-500 to-rose-600 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min((stats.expenses / target.planned_purchases) * 100, 100)}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 z-10">
                        {Math.min((stats.expenses / target.planned_purchases) * 100, 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* WIDGET: ANIVERSARIANTES */}
      {(todayBirthdays.length > 0 || upcomingBirthdays.length > 0) && (
        <section className="space-y-4">
          <div className="px-2">
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-2">
              <Gift className="w-5 h-5 text-pink-500" />
              Aniversariantes
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Celebre com seus pacientes</p>
          </div>
          <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-3xl p-6 border border-pink-200 dark:border-pink-800 shadow-sm">
            {todayBirthdays.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                  <span className="text-sm font-black text-pink-900 dark:text-pink-300 uppercase tracking-wider">
                    Hoje é aniversário de:
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {todayBirthdays.map((bday) => (
                    <div key={bday.id} className="flex items-center gap-3 p-4 bg-white/60 dark:bg-slate-800/60 rounded-2xl">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-black text-lg shadow-lg">
                        {bday.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-slate-900 dark:text-white">{bday.name}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">🎂 Aniversário hoje!</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-black text-pink-900 dark:text-pink-300 mb-3">Próximos aniversários:</p>
                {upcomingBirthdays.map((bday) => {
                  if (!bday.birth_date) return null;
                  const bdayDate = new Date(bday.birth_date);
                  const today = new Date();
                  bdayDate.setFullYear(today.getFullYear());
                  const daysUntil = Math.ceil((bdayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={bday.id} className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center text-white font-black text-sm">
                        {bday.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-black text-slate-900 dark:text-white">{bday.name}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {daysUntil === 0 ? 'Hoje' : daysUntil === 1 ? 'Amanhã' : `Em ${daysUntil} dias`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* SEÇÃO: NÚCLEO FINANCEIRO */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">Núcleo Financeiro</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Gestão completa de receitas e despesas</p>
          </div>
          <Link 
            to="/dashboard/finance" 
            className="flex items-center gap-2 text-sm font-black text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
          >
            Ver Completo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* CARDS DE RESUMO FINANCEIRO */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receita do Mês */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all">
          <p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2">Receita do Mês</p>
          <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-2">
                              <AnimatedNumber 
                                value={stats.revenue} 
                                duration={1500}
                                formatter={(val) => formatCurrency(val)}
                              />
                            </h3>
          <div className="flex items-center gap-1 text-xs font-black">
            {stats.revenueGrowth >= 0 ? (
              <>
                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-500">+{stats.revenueGrowth.toFixed(1)}%</span>
              </>
            ) : (
              <>
                <ArrowDownRight className="w-4 h-4 text-rose-500" />
                <span className="text-rose-500">{stats.revenueGrowth.toFixed(1)}%</span>
              </>
            )}
                          </div>
                      </div>
                      
        {/* Despesas do Mês */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all">
          <p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2">Despesas do Mês</p>
          <h3 className="text-3xl font-black text-rose-600 dark:text-rose-400 mb-2">
                        <AnimatedNumber 
              value={stats.expenses} 
              duration={1500}
                          formatter={(val) => formatCurrency(val)}
                        />
                      </h3>
          <div className="flex items-center gap-1 text-xs font-black">
            {stats.expensesGrowth <= 0 ? (
              <>
                <ArrowDownRight className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-500">{Math.abs(stats.expensesGrowth).toFixed(1)}%</span>
              </>
            ) : (
              <>
                <ArrowUpRight className="w-4 h-4 text-rose-500" />
                <span className="text-rose-500">+{stats.expensesGrowth.toFixed(1)}%</span>
              </>
            )}
          </div>
                      </div>

        {/* Lucro Líquido */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all">
          <p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2">Lucro Líquido</p>
          <h3 className={`text-3xl font-black mb-2 ${stats.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        <AnimatedNumber 
              value={stats.profit} 
              duration={1500}
                          formatter={(val) => formatCurrency(val)}
                        />
                      </h3>
          <div className="flex items-center gap-1 text-xs font-black">
            {stats.profitGrowth >= 0 ? (
              <>
                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-500">+{stats.profitGrowth.toFixed(1)}%</span>
              </>
            ) : (
              <>
                <ArrowDownRight className="w-4 h-4 text-rose-500" />
                <span className="text-rose-500">{stats.profitGrowth.toFixed(1)}%</span>
              </>
            )}
          </div>
        </div>

        {/* Agendamentos Hoje */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all">
          <p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2">Agendamentos Hoje</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
            {isLoading ? '...' : stats.totalToday}
          </h3>
          <p className="text-xs font-black text-slate-500">
            {stats.confirmedToday} confirmados
          </p>
        </div>
        </div>
      </section>

      {/* SEÇÃO: TIMELINE DO DIA */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              Agenda de Hoje
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Timeline dos seus agendamentos</p>
          </div>
          <Link 
            to="/dashboard/agenda" 
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors text-sm font-black"
          >
            Ver agenda completa <ArrowRight className="w-4 h-4 inline ml-1" />
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          {isLoading ? (
            <SkeletonAppointmentCards count={4} />
          ) : upcomingAppointments.length === 0 ? (
            <EmptyState 
              icon="calendar"
              title="Agenda Livre!"
              description="Nenhum agendamento pendente para hoje."
              className="py-8"
            />
          ) : (
            <div className="relative">
              {/* Linha vertical da timeline */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-200 via-indigo-400 to-indigo-200 dark:from-indigo-800 dark:via-indigo-600 dark:to-indigo-800"></div>
              
              <div className="space-y-6">
                {upcomingAppointments.map((appt, idx) => {
                  const startTime = new Date(appt.startTime);
                  const now = new Date();
                  const isPast = startTime < now;
                  const initials = appt.patientName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                  
                  return (
                    <Link
                      key={appt.id}
                      to="/dashboard/agenda"
                      state={{ appointmentId: appt.id }}
                      className="relative flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl p-3 -ml-3 transition-all cursor-pointer group"
                    >
                      {/* Ponto na timeline */}
                      <div className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm shadow-lg ${getStatusStyle(appt.status)} ${isPast ? 'opacity-60' : ''} group-hover:scale-110 transition-transform`}>
                        {initials}
                      </div>
                      
                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-black truncate ${isPast ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'} group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors`}>
                              {appt.patientName}
                            </h4>
                            <p className="text-xs font-bold text-slate-500 truncate mt-1">{appt.serviceName}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-sm font-black ${isPast ? 'text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                              {startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {!isPast && idx === 0 && (
                              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                                Próximo
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-black uppercase ${getStatusStyle(appt.status)}`}>
                          {getStatusLabel(appt.status)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SEÇÃO: ÚLTIMAS TRANSAÇÕES */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">Atividade Recente</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Últimas movimentações financeiras</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Últimas Transações</h3>
            <Link 
              to="/dashboard/finance/lancamentos" 
              className="text-rose-600 dark:text-rose-400 hover:text-rose-700 transition-colors"
            >
              Ver todas <ArrowRight className="w-4 h-4 inline ml-1" />
            </Link>
          </div>
          {latestTransactions.length === 0 ? (
            <EmptyState 
              icon="wallet"
              title="Nenhuma transação"
              description="Comece registrando suas receitas e despesas."
              action={{
                label: 'Nova Transação',
                onClick: onOpenTransactionModal
              }}
              className="py-8"
            />
          ) : (
            <div className="space-y-3">
              {latestTransactions.map((tx) => (
                <div 
                  key={tx.id}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                      {tx.description}
                    </h4>
                    <p className="text-xs font-bold text-slate-500">
                      {formatTransactionDate(tx.date)}, {formatTransactionTime(tx.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-black ${tx.type === 'revenue' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'revenue' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

                    
      {/* SEÇÃO: AÇÕES RÁPIDAS INTELIGENTES */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Ações Rápidas
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Acesso rápido às principais funcionalidades</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={onOpenTransactionModal}
            className="flex flex-col items-center justify-center gap-3 p-6 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-2xl hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg hover:shadow-xl hover:scale-105 group"
          >
            <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
            <span className="text-sm font-black uppercase tracking-wider">Nova Transação</span>
          </button>
          <button 
            onClick={() => navigate('/dashboard/agenda')}
            className="flex flex-col items-center justify-center gap-3 p-6 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-2xl hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg hover:shadow-xl hover:scale-105 group"
          >
            <Calendar className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-black uppercase tracking-wider">Novo Agendamento</span>
          </button>
          <button 
            onClick={() => navigate('/dashboard/pacientes')}
            className="flex flex-col items-center justify-center gap-3 p-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl hover:scale-105 group"
          >
            <Users className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-black uppercase tracking-wider">Novo Paciente</span>
          </button>
          <button 
            onClick={() => navigate('/dashboard/crm')}
            className="flex flex-col items-center justify-center gap-3 p-6 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-2xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl hover:scale-105 group"
          >
            <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-black uppercase tracking-wider">Abrir CRM</span>
          </button>
        </div>
      </div>
      </section>
    </div>
  );
};

export default React.memo(HomeTab);
