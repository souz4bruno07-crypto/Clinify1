
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useFinancialData } from '../hooks/useFinancialData';
import { UserRole } from '../types';
import { 
  Users, Calendar as CalendarIcon, Settings, MessageSquare, 
  FileText, Plus, LogOut, Menu, 
  Sparkles, Home, ShieldCheck,
  ChevronLeft, ChevronRight, Bell, Calendar as CalendarLucide,
  Sun, Moon, Lock
} from 'lucide-react';

import HomeTab from './dashboard/HomeTab';
import FinanceMain from './dashboard/finance/FinanceMain';
import PatientsTab from './dashboard/PatientsTab';
import CalendarTab from './dashboard/CalendarTab';
import SettingsTab from './dashboard/SettingsTab';
import BudgetsTab from './dashboard/BudgetsTab';
import CRMTab from './crm/CRMTab';
import AIChatWidget from './AIChatWidget';
import TransactionModal from './modals/TransactionModal';
import { getMonthlyTarget, upsertMonthlyTarget } from '../services/supabaseService';

const DashboardScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const { transactions, categories, isLoading, refreshData } = useFinancialData(user?.clinicId);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  
  const [monthlyGoal, setMonthlyGoal] = useState(0);
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [isTargetLoading, setIsTargetLoading] = useState(false);

  const location = useLocation();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const loadTargets = useCallback(async () => {
    if (!user) return;
    setIsTargetLoading(true);
    const monthKey = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
    try {
      const target = await getMonthlyTarget(user.clinicId, monthKey);
      setMonthlyGoal(target?.planned_revenue || 0);
      setMonthlyBudget(target?.planned_purchases || 0);
    } finally {
      setIsTargetLoading(false);
    }
  }, [user, currentDate]);

  useEffect(() => {
    loadTargets();
  }, [loadTargets]);

  const handleUpdateTargets = async (goal: number, budget: number) => {
    if (!user) return;
    const monthKey = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
    await upsertMonthlyTarget({
      id: '', 
      userId: user.clinicId,
      month_year: monthKey,
      planned_revenue: goal,
      planned_purchases: budget
    });
    setMonthlyGoal(goal);
    setMonthlyBudget(budget);
  };

  // --- LÓGICA DE CONTROLE DE ACESSO (RBAC) ---
  const canAccess = (feature: string): boolean => {
    if (!user) return false;
    const role = user.role;
    
    // SuperAdmin e Admin tem acesso total
    if (role === 'superadmin' || role === 'admin') return true;

    const accessMap: Record<string, UserRole[]> = {
      'finance': ['finance'], // Financeiro acessa faturamento
      'agenda': ['reception'], // Recepção acessa agenda
      'crm': ['reception'],
      'pacientes': ['reception'],
      'orcamentos': ['reception'],
      'settings': [] // Apenas Admins acessam configurações de equipe
    };

    return accessMap[feature]?.includes(role) || false;
  };

  const navItems = [
    { path: '/dashboard/home', label: 'Início', icon: Home, visible: true },
    { path: '/dashboard/finance', label: 'CFO Digital', icon: ShieldCheck, visible: canAccess('finance') },
    { path: '/dashboard/agenda', label: 'Agenda Pro', icon: CalendarIcon, visible: canAccess('agenda') },
    { path: '/dashboard/crm', label: 'WhatsApp CRM', icon: MessageSquare, visible: canAccess('crm') },
    { path: '/dashboard/pacientes', label: 'Pacientes', icon: Users, visible: canAccess('pacientes') },
    { path: '/dashboard/orcamentos', label: 'Orçamentos', icon: FileText, visible: canAccess('orcamentos') },
    { path: '/dashboard/configuracoes', label: 'Gestão', icon: Settings, visible: canAccess('settings') },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
      <aside className={`fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-[60] transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="h-full flex flex-col p-8">
          <div className="flex items-center gap-3 mb-10 shrink-0">
            <div className="p-2.5 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">Clinify<span className="text-emerald-500">.</span></span>
          </div>

          {(user?.role === 'admin' || user?.role === 'finance') && (
            <button 
                onClick={() => { setEditingTransaction(null); setIsTransactionModalOpen(true); }}
                className="w-full flex items-center justify-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-all mb-8"
            >
                <Plus className="w-4 h-4" /> Novo Registro
            </button>
          )}

          <nav className="space-y-1.5 flex-1 overflow-y-auto no-scrollbar">
            {navItems.filter(item => item.visible).map((item) => {
              const Icon = item.icon;
              const active = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3.5 px-5 py-3.5 rounded-xl transition-all duration-300 font-bold text-xs uppercase tracking-widest ${
                    active 
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/10' 
                    : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-emerald-600' : 'text-slate-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-sm">
                {user?.name?.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 dark:text-white truncate text-xs">{user?.name}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{user?.role}</p>
              </div>
            </div>
            <button onClick={() => signOut()} className="w-full flex items-center gap-2 px-4 py-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all font-black text-[10px] uppercase">
              <LogOut className="w-3.5 h-3.5" /> Sair do Painel
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 md:ml-72 flex flex-col relative min-h-screen">
        <header className="sticky top-0 z-50 px-8 py-5 flex items-center justify-between bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
           <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 bg-slate-100 dark:bg-slate-800 rounded-lg"><Menu className="w-5 h-5 dark:text-white" /></button>
              <div className="flex flex-col">
                <h1 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Terminal</h1>
                <p className="text-xl font-black text-slate-900 dark:text-white italic tracking-tighter">Administrativo</p>
              </div>
           </div>

           <div className="flex items-center gap-3">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 bg-slate-100 dark:bg-slate-900 rounded-xl text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:scale-105 transition-all shadow-sm">
                {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
              </button>
              <button className="p-2.5 bg-slate-100 dark:bg-slate-900 rounded-xl text-slate-500 border border-slate-200 dark:border-slate-800 hover:scale-105 transition-all shadow-sm"><Bell className="w-5 h-5 dark:text-slate-400" /></button>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Auditoria Live</span>
              </div>
           </div>
        </header>

        <div className="p-8 flex-1 max-w-[1600px] mx-auto w-full">
          <Routes>
            <Route path="home" element={<HomeTab user={user} transactions={transactions} onOpenTransactionModal={() => setIsTransactionModalOpen(true)} startDate={currentDate} target={{ planned_revenue: monthlyGoal, planned_purchases: monthlyBudget }} setMonthlyGoal={handleUpdateTargets} />} />
            
            {/* ROTAS PROTEGIDAS POR CARGO */}
            <Route path="finance/:subtab?" element={canAccess('finance') ? <FinanceMain transactions={transactions} categories={categories} isLoading={isLoading} user={user} aiAnalysis={null} loadingAnalysis={false} onRefreshAI={() => {}} onOpenTransactionModal={(tx) => { setEditingTransaction(tx); setIsTransactionModalOpen(true); }} startDate={currentDate} setCurrentDate={setCurrentDate} refreshData={refreshData} monthlyGoal={monthlyGoal} monthlyBudget={monthlyBudget} isTargetLoading={isTargetLoading} setMonthlyGoal={handleUpdateTargets} /> : <Navigate to="/dashboard/home" />} />
            
            <Route path="pacientes" element={canAccess('pacientes') ? <PatientsTab user={user} /> : <Navigate to="/dashboard/home" />} />
            <Route path="agenda" element={canAccess('agenda') ? <CalendarTab /> : <Navigate to="/dashboard/home" />} />
            <Route path="crm" element={canAccess('crm') ? <CRMTab user={user} /> : <Navigate to="/dashboard/home" />} />
            <Route path="orcamentos" element={canAccess('orcamentos') ? <BudgetsTab user={user} /> : <Navigate to="/dashboard/home" />} />
            <Route path="configuracoes" element={canAccess('settings') ? <SettingsTab user={user} refreshTransactions={refreshData} /> : <Navigate to="/dashboard/home" />} />
            
            <Route path="/" element={<Navigate to="home" replace />} />
          </Routes>
        </div>
      </main>

      {canAccess('finance') && <AIChatWidget transactions={transactions} clinicName={user?.clinicName || 'Clínica'} />}
      
      <TransactionModal 
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSaveSuccess={refreshData}
        user={user}
        editingTransaction={editingTransaction}
        categories={categories}
        transactions={transactions}
      />
    </div>
  );
};

export default DashboardScreen;
