import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router';
import { useAuth } from '../contexts/AuthContextAPI';
import { useFinancialData } from '../hooks/useFinancialData';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { UserRole, Transaction } from '../types';
import { 
  Users, Calendar as CalendarIcon, Settings, MessageSquare, 
  FileText, Plus, LogOut, Menu, 
  Sparkles, Home, ShieldCheck,
  Sun, Moon, Command, Search, Stethoscope, Package, Trophy, Activity, Gift, Loader2
} from 'lucide-react';

// Lazy loading de componentes pesados
const HomeTab = lazy(() => import('./dashboard/HomeTab'));
const FinanceMain = lazy(() => import('./dashboard/finance/FinanceMain'));
const PatientsTab = lazy(() => import('./dashboard/PatientsTab'));
const CalendarTab = lazy(() => import('./dashboard/CalendarTab'));
const SettingsTab = lazy(() => import('./dashboard/SettingsTab'));
const BudgetsTab = lazy(() => import('./dashboard/BudgetsTab'));
const CRMTab = lazy(() => import('./crm/CRMTab'));
const MedicalRecordTab = lazy(() => import('./pep').then(m => ({ default: m.MedicalRecordTab })));
const InventoryMain = lazy(() => import('./dashboard/inventory').then(m => ({ default: m.InventoryMain })));
const CommissionsTab = lazy(() => import('./dashboard/commissions').then(m => ({ default: m.CommissionsTab })));
const ClinicalKPIsTab = lazy(() => import('./dashboard/kpi').then(m => ({ default: m.ClinicalKPIsTab })));
const LoyaltyAdminTab = lazy(() => import('./dashboard/loyalty').then(m => ({ default: m.LoyaltyAdminTab })));
const AIChatWidget = lazy(() => import('./AIChatWidget'));
const TransactionModal = lazy(() => import('./modals/TransactionModal'));
const Notifications = lazy(() => import('./Notifications'));
const CommandPalette = lazy(() => import('./CommandPalette'));

import Breadcrumbs from './Breadcrumbs';
import ErrorBoundary from './ErrorBoundary';
import { getMonthlyTarget, upsertMonthlyTarget, getPatients, getAppointments } from '../services/backendService';
import { Tooltip } from './ui';
import { Patient, Appointment } from '../types';

// Loading fallback component
const LoadingFallback: React.FC<{ message?: string }> = ({ message = 'Carregando...' }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  </div>
);

const DashboardScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const { transactions, categories, isLoading, refreshData } = useFinancialData(user?.clinicId);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  
  const [monthlyGoal, setMonthlyGoal] = useState(0);
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [isTargetLoading, setIsTargetLoading] = useState(false);

  // Data for notifications
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const location = useLocation();

  // Load patients and appointments for notifications
  useEffect(() => {
    if (!user?.id) return;
    
    // Adicionar flag para evitar múltiplas chamadas simultâneas
    let cancelled = false;
    
    const loadNotifications = async () => {
      try {
        const [patientsResponse, appointmentsResponse] = await Promise.all([
          getPatients(user.id),
          (async () => {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).getTime();
            return getAppointments(user.id, start, end);
          })()
        ]);
        
        if (cancelled) return;
        
        const patientsData = Array.isArray(patientsResponse) 
          ? patientsResponse 
          : (patientsResponse && typeof patientsResponse === 'object' && 'data' in patientsResponse)
            ? (patientsResponse as { data: Patient[] }).data
            : [];
        setPatients(patientsData);
        const appointmentsData = Array.isArray(appointmentsResponse)
          ? appointmentsResponse
          : (appointmentsResponse && typeof appointmentsResponse === 'object' && 'data' in appointmentsResponse)
            ? (appointmentsResponse as { data: Appointment[] }).data
            : [];
        setAppointments(appointmentsData);
      } catch (error) {
        console.error('[DashboardScreen] Erro ao carregar notificações:', error);
      }
    };
    
    loadNotifications();
    
    return () => {
      cancelled = true;
    };
  }, [user?.id]); // Usar user?.id ao invés de user para evitar re-renders desnecessários

  // Command Palette keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // SEO: Adicionar noindex para área privada (dashboard)
  useEffect(() => {
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      document.head.appendChild(metaRobots);
    }
    metaRobots.setAttribute('content', 'noindex, nofollow');
    
    // Cleanup: restaurar index quando sair do dashboard
    return () => {
      const robotsMeta = document.querySelector('meta[name="robots"]');
      if (robotsMeta) {
        robotsMeta.setAttribute('content', 'index, follow');
      }
    };
  }, []);

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

  const handleCommandAction = (action: string) => {
    switch (action) {
      case 'new-transaction':
        setEditingTransaction(null);
        setIsTransactionModalOpen(true);
        break;
      case 'ai-chat':
        // AI Chat is handled by the floating widget
        break;
      default:
        break;
    }
  };

  // --- LÓGICA DE CONTROLE DE ACESSO (RBAC) ---
  const canAccess = useCallback((feature: string): boolean => {
    if (!user) return false;
    const role = user.role;
    
    // SuperAdmin e Admin tem acesso total
    if (role === 'superadmin' || role === 'admin') return true;

    const accessMap: Record<string, UserRole[]> = {
      'finance': ['finance'],
      'agenda': ['reception'],
      'crm': ['reception'],
      'pacientes': ['reception'],
      'prontuario': ['reception'],
      'orcamentos': ['reception'],
      'estoque': ['finance'],
      'settings': []
    };

    return accessMap[feature]?.includes(role) || false;
  }, [user]);

  const navItems = useMemo(() => [
    { path: '/dashboard/home', label: 'Início', icon: Home, visible: true },
    { path: '/dashboard/finance', label: 'CFO Digital', icon: ShieldCheck, visible: canAccess('finance') },
    { path: '/dashboard/kpis', label: 'KPIs Clínicos', icon: Activity, visible: canAccess('finance') },
    { path: '/dashboard/comissoes', label: 'Metas & Comissões', icon: Trophy, visible: canAccess('finance') },
    { path: '/dashboard/agenda', label: 'Agenda Pro', icon: CalendarIcon, visible: canAccess('agenda') },
    { path: '/dashboard/crm', label: 'WhatsApp CRM', icon: MessageSquare, visible: canAccess('crm') },
    { path: '/dashboard/pacientes', label: 'Pacientes', icon: Users, visible: canAccess('pacientes') },
    { path: '/dashboard/prontuario', label: 'Prontuário', icon: Stethoscope, visible: canAccess('prontuario') },
    { path: '/dashboard/estoque', label: 'Estoque', icon: Package, visible: canAccess('estoque') },
    { path: '/dashboard/orcamentos', label: 'Orçamentos', icon: FileText, visible: canAccess('orcamentos') },
    { path: '/dashboard/fidelidade', label: 'Fidelidade', icon: Gift, visible: canAccess('finance') },
    { path: '/dashboard/configuracoes', label: 'Gestão', icon: Settings, visible: canAccess('settings') },
  ], [canAccess]);

  const handleOpenTransactionModal = useCallback((tx?: Transaction) => {
    setEditingTransaction(tx || null);
    setIsTransactionModalOpen(true);
  }, []);

  const handleCloseTransactionModal = useCallback(() => {
    setIsTransactionModalOpen(false);
    setEditingTransaction(null);
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
      {/* SIDEBAR */}
      <aside 
        className={`fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-[60] transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
        aria-label="Menu de navegação principal"
      >
        <div className="h-full flex flex-col p-8">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10 shrink-0">
            <div className={`p-2.5 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20 ${prefersReducedMotion ? '' : 'animate-pulse-glow'}`}>
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">
              Clinify<span className="text-emerald-500">.</span>
            </span>
          </div>

          {/* New Transaction Button */}
          {(user?.role === 'admin' || user?.role === 'finance') && (
            <button 
                onClick={() => handleOpenTransactionModal()}
                className="w-full flex items-center justify-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-[1.02] hover:shadow-2xl transition-all mb-8 ripple"
                aria-label="Criar novo registro financeiro"
            >
                <Plus className="w-4 h-4" aria-hidden="true" /> Novo Registro
            </button>
          )}

          {/* Navigation */}
          <nav className="space-y-1.5 flex-1 overflow-y-auto no-scrollbar">
            {navItems.filter(item => item.visible).map((item, index) => {
              const Icon = item.icon;
              const active = location.pathname.startsWith(item.path);
              return (
                <Tooltip key={item.path} content={item.label} position="right">
                  <Link
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3.5 px-5 py-3.5 rounded-xl transition-all duration-300 font-bold text-xs uppercase tracking-widest ${prefersReducedMotion ? '' : `animate-fade-in stagger-${index + 1}`} ${
                      active 
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/10 shadow-sm' 
                      : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-emerald-600' : 'text-slate-400'}`} />
                    {item.label}
                  </Link>
                </Tooltip>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-black text-sm shadow-lg">
                {user?.name?.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 dark:text-white truncate text-xs">{user?.name}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{user?.role}</p>
              </div>
            </div>
            <button 
              onClick={() => signOut()} 
              className="w-full flex items-center gap-2 px-4 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-xl transition-all font-black text-[10px] uppercase"
              aria-label="Sair do painel"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" /> Sair do Painel
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 min-w-0 md:ml-72 flex flex-col relative min-h-screen">
        {/* HEADER */}
        <header className="sticky top-0 z-50 px-8 py-5 flex items-center justify-between bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="md:hidden p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:scale-105 transition-transform"
                aria-label="Abrir menu lateral"
                aria-expanded={isSidebarOpen}
              >
                <Menu className="w-5 h-5 dark:text-white" aria-hidden="true" />
              </button>
              <div className="flex flex-col">
                <h1 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Terminal</h1>
                <p className="text-xl font-black text-slate-900 dark:text-white italic tracking-tighter">Administrativo</p>
              </div>
           </div>

           <div className="flex items-center gap-3">
              {/* Search Button */}
              <button 
                onClick={() => setIsCommandPaletteOpen(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-900 rounded-xl text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:text-slate-600 transition-all"
                aria-label="Buscar (atalho: Cmd+K ou Ctrl+K)"
              >
                <Search className="w-4 h-4" aria-hidden="true" />
                <span className="text-[10px] font-bold">Buscar...</span>
                <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded text-[9px] font-bold border border-slate-200 dark:border-slate-700" aria-hidden="true">
                  <Command className="w-2.5 h-2.5" />K
                </kbd>
              </button>

              {/* Theme Toggle */}
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)} 
                className="p-2.5 bg-slate-100 dark:bg-slate-900 rounded-xl text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:scale-105 transition-all shadow-sm"
                aria-label={isDarkMode ? "Alternar para modo claro" : "Alternar para modo escuro"}
                aria-pressed={isDarkMode}
              >
                {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" aria-hidden="true" /> : <Moon className="w-5 h-5 text-indigo-600" aria-hidden="true" />}
              </button>

              {/* Notifications */}
              <Suspense fallback={
                <div className="p-2.5 bg-slate-100 dark:bg-slate-900 rounded-xl">
                  <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                </div>
              }>
                <Notifications 
                  user={user}
                  transactions={transactions}
                  appointments={appointments}
                  patients={patients}
                />
              </Suspense>

              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

              {/* Live Status */}
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                  <div className={`w-2 h-2 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50 ${prefersReducedMotion ? '' : 'animate-pulse'}`}></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Auditoria Live</span>
              </div>
           </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="p-8 flex-1 max-w-[1600px] mx-auto w-full">
          <Breadcrumbs />
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
            <Route path="home" element={
              <HomeTab 
                user={user} 
                transactions={transactions} 
                onOpenTransactionModal={() => handleOpenTransactionModal()} 
                startDate={currentDate} 
                target={{ planned_revenue: monthlyGoal, planned_purchases: monthlyBudget }} 
                setMonthlyGoal={handleUpdateTargets} 
              />
            } />
            
            <Route path="finance/:subtab?" element={
              canAccess('finance') ? (
                <FinanceMain 
                  transactions={transactions} 
                  categories={categories} 
                  isLoading={isLoading} 
                  user={user} 
                  aiAnalysis={null} 
                  loadingAnalysis={false} 
                  onRefreshAI={() => {}} 
                  onOpenTransactionModal={handleOpenTransactionModal} 
                  startDate={currentDate} 
                  setCurrentDate={setCurrentDate} 
                  refreshData={refreshData} 
                  monthlyGoal={monthlyGoal} 
                  monthlyBudget={monthlyBudget} 
                  isTargetLoading={isTargetLoading} 
                  setMonthlyGoal={handleUpdateTargets} 
                />
              ) : <Navigate to="/dashboard/home" />
            } />
            
            <Route path="comissoes" element={canAccess('finance') ? <CommissionsTab user={user} /> : <Navigate to="/dashboard/home" />} />
            <Route path="kpis" element={canAccess('finance') ? <ClinicalKPIsTab user={user} transactions={transactions} /> : <Navigate to="/dashboard/home" />} />
            <Route path="pacientes" element={canAccess('pacientes') ? <PatientsTab user={user} /> : <Navigate to="/dashboard/home" />} />
            <Route path="prontuario" element={canAccess('prontuario') ? <MedicalRecordTab user={user} patients={patients} /> : <Navigate to="/dashboard/home" />} />
            <Route path="agenda" element={canAccess('agenda') ? <CalendarTab /> : <Navigate to="/dashboard/home" />} />
            <Route path="crm" element={canAccess('crm') ? <CRMTab user={user} /> : <Navigate to="/dashboard/home" />} />
            <Route path="orcamentos" element={canAccess('orcamentos') ? <BudgetsTab user={user} /> : <Navigate to="/dashboard/home" />} />
            <Route path="estoque" element={canAccess('estoque') ? <InventoryMain userId={user?.clinicId || ''} /> : <Navigate to="/dashboard/home" />} />
            <Route path="fidelidade" element={canAccess('finance') ? <LoyaltyAdminTab clinicId={user?.clinicId || ''} patients={patients} /> : <Navigate to="/dashboard/home" />} />
            <Route path="configuracoes" element={canAccess('settings') ? <SettingsTab user={user} refreshTransactions={refreshData} /> : <Navigate to="/dashboard/home" />} />
            
            <Route path="/" element={<Navigate to="home" replace />} />
          </Routes>
          </Suspense>
        </div>
      </main>

      {/* AI Chat Widget */}
      {canAccess('finance') && (
        <Suspense fallback={null}>
          <AIChatWidget transactions={transactions} clinicName={user?.clinicName || 'Clínica'} />
        </Suspense>
      )}
      
      {/* Transaction Modal */}
      <Suspense fallback={null}>
        <TransactionModal 
          isOpen={isTransactionModalOpen}
          onClose={handleCloseTransactionModal}
          onSaveSuccess={refreshData}
          user={user}
          editingTransaction={editingTransaction}
          categories={categories}
          transactions={transactions}
        />
      </Suspense>

      {/* Command Palette */}
      <Suspense fallback={null}>
        <CommandPalette 
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onAction={handleCommandAction}
        />
      </Suspense>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className={`fixed inset-0 bg-slate-950/50 z-[55] md:hidden ${prefersReducedMotion ? '' : 'animate-fade-in'}`}
          onClick={() => setIsSidebarOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsSidebarOpen(false);
          }}
          role="button"
          tabIndex={-1}
          aria-label="Fechar menu lateral"
        />
      )}
      </div>
    </ErrorBoundary>
  );
};

export default DashboardScreen;
