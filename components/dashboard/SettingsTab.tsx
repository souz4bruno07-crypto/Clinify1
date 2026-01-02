
import React, { useState, useEffect } from 'react';
import { 
  Building2, Database, Globe, LogOut, Loader2, 
  CheckCircle2, Save, Users, UserPlus, Trash2, 
  ShieldCheck, FileUp, Download, Info, ArrowRight,
  UserMinus, Wifi, AlertCircle, RefreshCw, KeyRound, Mail, Sparkles, CreditCard, Edit2
} from 'lucide-react';
import { getClinicMembers, deleteAllTransactions, deleteAllClinicData, seedMockData, deleteUser } from '../../services/backendService';
import { useAuth } from '../../contexts/AuthContextAPI';
import { EvolutionConfig, testEvolutionConnection } from '../../services/evolutionService';
import { User, UserRole } from '../../types';
import DataImportModal from '../modals/DataImportModal';
import UserInviteModal from '../modals/UserInviteModal';
import UserEditModal from '../modals/UserEditModal';
import { useToast } from '../../contexts/ToastContext';
import { useConfirmDialog } from '../ui/ConfirmDialog';
import SubscriptionTab from './SubscriptionTab';

const SettingsTab: React.FC<{ user: any; refreshTransactions: () => void }> = ({ user, refreshTransactions }) => {
  const { signOut } = useAuth();
  const toast = useToast();
  const { confirm } = useConfirmDialog();
  const [activeSection, setActiveSection] = useState<'profile' | 'users' | 'integrations' | 'data' | 'subscription'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isDataWorking, setIsDataWorking] = useState(false);

  const [clinicUsers, setClinicUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const loadMembers = async () => {
    if (!user?.clinicId) return;
    setLoadingUsers(true);
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SettingsTab.tsx:39',message:'loadMembers iniciado',data:{clinicId:user.clinicId},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const members = await getClinicMembers(user.clinicId);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SettingsTab.tsx:43',message:'getClinicMembers retornou',data:{membersType:typeof members,isArray:Array.isArray(members),membersLength:Array.isArray(members)?members.length:0},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      setClinicUsers(members);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SettingsTab.tsx:44',message:'clinicUsers setado',data:{clinicUsersType:typeof members,clinicUsersIsArray:Array.isArray(members)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SettingsTab.tsx:45',message:'loadMembers erro',data:{errorMessage:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      if (import.meta.env.DEV) {
        console.error('Erro ao carregar membros:', error);
      }
      toast.error('Erro ao carregar membros da clínica');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'users') loadMembers();
  }, [activeSection, user?.clinicId]);

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SettingsTab.tsx:58',message:'clinicUsers mudou',data:{clinicUsersType:typeof clinicUsers,clinicUsersIsArray:Array.isArray(clinicUsers),clinicUsersLength:Array.isArray(clinicUsers)?clinicUsers.length:0},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
  }, [clinicUsers]);

  const handleInviteSuccess = () => {
    loadMembers();
  };

  const handleEditUser = (userToEdit: User) => {
    setEditingUser(userToEdit);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    loadMembers();
  };

  const handleDeleteUser = async (userToDelete: User) => {
    if (!userToDelete) return;

    const confirmed = await confirm({
      title: '⚠️ Remover Usuário',
      message: `Tem certeza que deseja remover o usuário "${userToDelete.name}"?\n\nEsta ação é irreversível e o usuário perderá todo o acesso ao sistema.`,
      confirmText: 'Sim, Remover',
      cancelText: 'Cancelar',
      variant: 'danger'
    });

    if (!confirmed) return;

    setIsLoading(true);
    try {
      await deleteUser(userToDelete.id);
      toast.success('Usuário removido com sucesso!');
      loadMembers();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Erro ao remover usuário';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleLabel = (role: UserRole): string => {
    const labels: Record<UserRole, string> = {
      superadmin: 'Super Admin',
      admin: 'Administrador',
      finance: 'Financeiro',
      reception: 'Recepção',
      viewer: 'Visualizador'
    };
    return labels[role] || role;
  };

  const getRoleBadgeColor = (role: UserRole): string => {
    const colors: Record<UserRole, string> = {
      superadmin: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
      admin: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
      finance: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
      reception: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
      viewer: 'bg-slate-50 text-slate-600 dark:bg-slate-900/20 dark:text-slate-400'
    };
    return colors[role] || colors.viewer;
  };

  const canManageUsers = user?.role === 'admin' || user?.role === 'superadmin';

  const [evoConfig, setEvoConfig] = useState<EvolutionConfig>(() => {
    const saved = localStorage.getItem('clinify_evolution_config');
    return saved ? JSON.parse(saved) : { apiUrl: '', apiKey: '', instance: '' };
  });

  const handleTestConnection = async () => {
    if (!evoConfig.apiUrl || !evoConfig.instance || !evoConfig.apiKey) {
      setTestResult({ success: false, message: 'Preencha todos os campos antes de testar.' });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    const result = await testEvolutionConnection(evoConfig);
    setTestResult(result);
    setIsTesting(false);
  };

  const handleResetData = async () => {
      if (!user?.id) {
          if (import.meta.env.DEV) {
            console.error('[handleResetData] User ID não encontrado');
          }
          toast.error("❌ Erro: Usuário não identificado.");
          return;
      }
      
      const confirmed = await confirm({
          title: '⚠️ ZERAR TODA A BASE DE DADOS',
          message: 'ATENÇÃO: Esta ação irá deletar PERMANENTEMENTE todos os dados da sua clínica:\n\n• Transações financeiras\n• Pacientes\n• Colaboradores (Staff)\n• Agendamentos\n• Orçamentos\n• Produtos e estoque\n• Prescrições\n• Conversas e leads (CRM)\n• Categorias personalizadas\n• Metas mensais\n\nEsta ação é IRREVERSÍVEL e não afeta apenas lançamentos financeiros, mas TODOS os dados!\n\nDeseja realmente continuar?',
          confirmText: 'Sim, Deletar TUDO',
          cancelText: 'Cancelar',
          variant: 'danger'
      });
      
      if (!confirmed) {
          if (import.meta.env.DEV) {
            console.log('[handleResetData] Operação cancelada pelo usuário');
          }
          return;
      }
      
      setIsDataWorking(true);
      const deleteStartTime = Date.now();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SettingsTab.tsx:163',message:'handleResetData iniciado',data:{userId:user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      if (import.meta.env.DEV) {
        console.log('[handleResetData] Iniciando deleção de dados para userId:', user.id);
      }
      
      try {
          const result = await deleteAllClinicData(user.id);
          const deleteElapsed = Date.now() - deleteStartTime;
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SettingsTab.tsx:169',message:'handleResetData concluído',data:{deleteElapsedMs:deleteElapsed,success:result.success,deleted:result.deleted},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          if (import.meta.env.DEV) {
            console.log('[handleResetData] Resultado da deleção:', result);
          }
          
          if (result.success) {
              if (import.meta.env.DEV) {
                console.log('[handleResetData] Deleção bem-sucedida, limpando cache e recarregando...');
              }
              
              // Criar mensagem detalhada
              let message = "✅ Todos os dados foram deletados com sucesso!";
              if (result.deleted) {
                  const totalDeleted = Object.values(result.deleted).reduce((sum, count) => sum + count, 0);
                  const deletedItems = Object.entries(result.deleted)
                      .filter(([_, count]) => count > 0)
                      .map(([key, count]) => `${count} ${key}`)
                      .join(', ');
                  if (totalDeleted > 0) {
                      message = `✅ ${totalDeleted} registros deletados: ${deletedItems}`;
                  }
              }
              
              // Verificar se há registros restantes
              if (result.remaining) {
                  const totalRemaining = Object.values(result.remaining).reduce((sum, count) => sum + count, 0);
                  if (totalRemaining > 0) {
                      if (import.meta.env.DEV) {
                        console.warn('[handleResetData] Ainda existem registros após a deleção:', result.remaining);
                      }
                      message += `\n⚠️ Ainda existem ${totalRemaining} registros no banco. Verifique se há dados de outros usuários.`;
                  }
              }
              
              toast.success(message);
              
              // Limpar cache do navegador
              if ('caches' in window) {
                  try {
                      const cacheNames = await caches.keys();
                      if (import.meta.env.DEV) {
                        console.log('[handleResetData] Caches encontrados:', cacheNames);
                      }
                      await Promise.all(cacheNames.map(name => caches.delete(name)));
                      if (import.meta.env.DEV) {
                        console.log('[handleResetData] Caches limpos');
                      }
                  } catch (cacheError) {
                      console.error('[handleResetData] Erro ao limpar cache:', cacheError);
                  }
              }
              
              // Limpar localStorage de dados temporários (mas manter autenticação)
              const keysToKeep = ['clinify_token', 'clinify_storage_type', 'clinify_remember_me', 'theme'];
              const keysRemoved: string[] = [];
              Object.keys(localStorage).forEach(key => {
                  if (!keysToKeep.includes(key)) {
                      keysRemoved.push(key);
                      localStorage.removeItem(key);
                  }
              });
              if (import.meta.env.DEV) {
                console.log('[handleResetData] Chaves removidas do localStorage:', keysRemoved);
              }
              
              // Forçar refresh de todos os dados
              refreshTransactions();
              
              // Recarregar página após um pequeno delay para garantir que a mensagem seja exibida
              setTimeout(() => {
                  if (import.meta.env.DEV) {
                    console.log('[handleResetData] Recarregando página...');
                  }
                  window.location.reload();
              }, 1000);
          } else {
              if (import.meta.env.DEV) {
                console.error('[handleResetData] Deleção retornou false');
              }
              toast.error("❌ Erro ao deletar dados. A operação não foi concluída.");
          }
      } catch (error: any) {
          if (import.meta.env.DEV) {
            console.error('[handleResetData] Erro capturado:', error);
            console.error('[handleResetData] Error name:', error?.name);
            console.error('[handleResetData] Error message:', error?.message);
          }
          console.error('[handleResetData] Error status:', error?.status);
          console.error('[handleResetData] Error response:', error?.response);
          
          // Extrair mensagem de erro mais detalhada
          const errorMessage = error?.response?.data?.details || 
                               error?.response?.data?.error || 
                               error?.message || 
                               'Erro desconhecido ao deletar dados';
          const errorCode = error?.response?.data?.code || error?.code;
          const fullMessage = errorCode ? `${errorMessage} (Código: ${errorCode})` : errorMessage;
          
          console.error('[handleResetData] Mensagem de erro final:', fullMessage);
          toast.error(`❌ ${fullMessage}`);
      } finally {
          setIsDataWorking(false);
      }
  };

  const handleSyncData = async () => {
      if (!user?.id) return;
      setIsDataWorking(true);
      try {
          console.log('[handleSyncData] Iniciando sincronização...');
          console.log('[handleSyncData] User ID:', user.id);
          console.log('[handleSyncData] Clinic ID:', user.clinicId);
          
          // Limpar cache do navegador
          if ('caches' in window) {
              const cacheNames = await caches.keys();
              console.log('[handleSyncData] Caches encontrados:', cacheNames);
              await Promise.all(cacheNames.map(name => caches.delete(name)));
              console.log('[handleSyncData] Caches limpos');
          }
          
          // Limpar localStorage de dados temporários (mas manter autenticação)
          const keysToKeep = ['clinify_token', 'clinify_storage_type', 'clinify_remember_me', 'theme'];
          const keysToRemove: string[] = [];
          Object.keys(localStorage).forEach(key => {
              if (!keysToKeep.includes(key)) {
                  keysToRemove.push(key);
                  localStorage.removeItem(key);
              }
          });
          console.log('[handleSyncData] LocalStorage limpo. Chaves removidas:', keysToRemove);
          
          // Limpar sessionStorage também
          sessionStorage.clear();
          console.log('[handleSyncData] SessionStorage limpo');
          
          // Forçar refresh de todos os dados
          refreshTransactions();
          
          toast.success("✅ Dados sincronizados com o banco de dados!");
          
          // Recarregar página após 1 segundo
          setTimeout(() => {
              console.log('[handleSyncData] Recarregando página...');
              window.location.reload();
          }, 1000);
      } catch (error: any) {
          console.error('[handleSyncData] Erro ao sincronizar dados:', error);
          toast.error("❌ Erro ao sincronizar dados.");
      } finally {
          setIsDataWorking(false);
      }
  };

  const handleSeedData = async () => {
      if (!user?.id) return;
      const confirmed = await confirm({
          title: '✨ Gerar Dados Fictícios Completos',
          message: 'Isso irá APAGAR todos os dados existentes e criar dados fictícios completos e integrados para teste:\n\n👥 Pacientes e Colaboradores\n📅 Agendamentos (passados e futuros)\n💰 Transações financeiras (receitas e despesas)\n📝 Orçamentos\n💊 Prescrições médicas\n📦 Produtos de estoque com movimentações\n🔗 Vínculos produto-procedimento\n⚠️ Alertas de estoque\n💬 Conversas e leads (CRM)\n📋 Categorias personalizadas\n🎯 Metas mensais\n\nDeseja continuar?',
          confirmText: 'Sim, Gerar Dados',
          cancelText: 'Cancelar',
          variant: 'info'
      });
      if (!confirmed) return;
      
      setIsDataWorking(true);
      const seedStartTime = Date.now();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SettingsTab.tsx:334',message:'handleSeedData iniciado',data:{userId:user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      try {
          const result = await seedMockData(user.id);
          const seedElapsed = Date.now() - seedStartTime;
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SettingsTab.tsx:336',message:'handleSeedData concluído',data:{seedElapsedMs:seedElapsed,success:result.success,created:result.created},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          if (result.success && result.created) {
              const summary = [
                  `${result.created.patients} Pacientes`,
                  `${result.created.staff} Colaboradores`,
                  `${result.created.appointments} Agendamentos`,
                  `${result.created.transactions} Transações`,
                  `${result.created.quotes} Orçamentos`,
                  `${result.created.products} Produtos`,
                  `${result.created.movements} Movimentações`,
                  `${result.created.prescriptions} Prescrições`,
                  `${result.created.chatThreads} Conversas`,
                  `${result.created.chatMessages} Mensagens`
              ].join(' • ');
              
              toast.success(`✅ Dados fictícios criados com sucesso!\n\n${summary}`);
              refreshTransactions();
              // Recarregar página após 2 segundos para atualizar todas as abas
              setTimeout(() => {
                  window.location.reload();
              }, 2000);
          } else {
              toast.error("❌ Erro ao gerar dados de teste.");
          }
      } catch (error) {
          toast.error("❌ Erro ao gerar dados de teste.");
      } finally {
          setIsDataWorking(false);
      }
  };

  const SidebarButton = ({ id, label, icon: Icon, active }: any) => (
      <button 
         onClick={() => setActiveSection(id)}
         className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest ${
             active 
             ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 translate-x-2' 
             : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
         }`}
      >
          <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400'}`} />
          {label}
      </button>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-10 min-h-[700px] animate-in fade-in pb-32">
       <aside className="w-full lg:w-80 shrink-0 space-y-4">
           <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-2 sticky top-24">
               <SidebarButton id="profile" label="Perfil Unidade" icon={Building2} active={activeSection === 'profile'} />
               <SidebarButton id="users" label="Controle de Acessos" icon={ShieldCheck} active={activeSection === 'users'} />
               <SidebarButton id="subscription" label="Assinatura" icon={CreditCard} active={activeSection === 'subscription'} />
               <SidebarButton id="integrations" label="WhatsApp Hub" icon={Globe} active={activeSection === 'integrations'} />
               <SidebarButton id="data" label="Dados & Planilhas" icon={Database} active={activeSection === 'data'} />
               <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-4">
                   <button onClick={() => signOut()} className="w-full flex items-center gap-4 px-6 py-4 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-2xl transition-colors font-black text-xs uppercase tracking-widest">
                       <LogOut className="w-5 h-5" /> Sair do Painel
                   </button>
               </div>
           </div>
       </aside>

       <main className="flex-1 bg-white dark:bg-slate-900 rounded-[4rem] shadow-sm border border-slate-200 dark:border-slate-800 p-8 md:p-12 overflow-hidden">
           
           {/* SEÇÃO: PERFIL */}
           {activeSection === 'profile' && (
               <div className="space-y-10 animate-in slide-in-from-right-8 duration-500 max-w-2xl">
                   <div>
                       <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase leading-none">Perfil da Unidade</h2>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3">Identidade visual e dados mestre</p>
                   </div>
                   <div className="space-y-6">
                       <div className="flex items-center gap-8 p-10 bg-slate-50 dark:bg-slate-800/50 rounded-[3rem] border border-slate-100 dark:border-slate-800">
                           <div className="w-24 h-24 bg-emerald-600 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-xl">
                               {user?.clinicName?.charAt(0)}
                           </div>
                           <div className="flex-1">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nome da Clínica</p>
                               <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{user?.clinicName}</h3>
                               <p className="text-sm font-bold text-slate-500">{user?.email}</p>
                           </div>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Plano Ativo</p>
                               <p className="text-lg font-black text-indigo-600 uppercase italic">Clinify Elite</p>
                           </div>
                           <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Status da Conta</p>
                               <div className="flex items-center gap-2">
                                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                   <p className="text-lg font-black text-emerald-600 uppercase">Verificada</p>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
           )}

           {/* SEÇÃO: USUÁRIOS */}
           {activeSection === 'users' && (
               <div className="space-y-10 animate-in slide-in-from-right-8 duration-500">
                   <div className="flex justify-between items-start">
                       <div>
                           <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase leading-none">Equipe e Acessos</h2>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3">Gestão de cargos e permissões</p>
                       </div>
                       {canManageUsers && (
                           <button 
                               onClick={() => setIsInviteModalOpen(true)}
                               className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-transform"
                           >
                               <UserPlus className="w-4 h-4" /> Convidar
                           </button>
                       )}
                   </div>
                   <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[3rem] border border-slate-100 dark:border-slate-800 overflow-hidden">
                       {loadingUsers ? (
                           <div className="p-12 text-center">
                               <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
                               <p className="text-sm font-bold text-slate-400">Carregando membros...</p>
                           </div>
                       ) : clinicUsers.length === 0 ? (
                           <div className="p-12 text-center">
                               <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                               <p className="text-sm font-bold text-slate-400">Nenhum membro encontrado</p>
                           </div>
                       ) : (
                           <>
                               <table className="w-full text-left">
                                   <thead className="bg-slate-100 dark:bg-slate-900/50">
                                       <tr>
                                           <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest">Colaborador</th>
                                           <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest">Cargo</th>
                                           <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                           {canManageUsers && (
                                               <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Ações</th>
                                           )}
                                       </tr>
                                   </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                      {clinicUsers.map((member) => {
                                           const isCurrentUser = member.id === user?.id;
                                           return (
                                               <tr key={member.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                   <td className="px-8 py-6">
                                                       <div className="flex items-center gap-3">
                                                           <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black">
                                                               {member.name?.charAt(0)?.toUpperCase() || 'U'}
                                                           </div>
                                                           <div>
                                                               <p className="font-black text-slate-900 dark:text-white text-sm">
                                                                   {member.name} {isCurrentUser && <span className="text-indigo-600">(Você)</span>}
                                                               </p>
                                                               <p className="text-[10px] font-bold text-slate-400">{member.email}</p>
                                                           </div>
                                                       </div>
                                                   </td>
                                                   <td className="px-8 py-6">
                                                       <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg ${getRoleBadgeColor(member.role)}`}>
                                                           {getRoleLabel(member.role)}
                                                       </span>
                                                   </td>
                                                   <td className="px-8 py-6">
                                                       <div className="flex items-center gap-2">
                                                           <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                                           <span className="text-[10px] font-black uppercase text-slate-500">Ativo</span>
                                                       </div>
                                                   </td>
                                                   {canManageUsers && (
                                                       <td className="px-8 py-6">
                                                           <div className="flex items-center justify-end gap-2">
                                                               <button
                                                                   onClick={() => handleEditUser(member)}
                                                                   className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                                   title="Editar usuário"
                                                               >
                                                                   <Edit2 className="w-4 h-4" />
                                                               </button>
                                                               {!isCurrentUser && (
                                                                   <button
                                                                       onClick={() => handleDeleteUser(member)}
                                                                       className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                                                                       title="Remover usuário"
                                                                       disabled={isLoading}
                                                                   >
                                                                       <Trash2 className="w-4 h-4" />
                                                                   </button>
                                                               )}
                                                           </div>
                                                       </td>
                                                   )}
                                               </tr>
                                              );
                                      })}
                                  </tbody>
                               </table>
                               <div className="p-8 text-center bg-white/50 dark:bg-slate-900/50">
                                   <p className="text-xs font-bold text-slate-400">
                                       {clinicUsers.length} {clinicUsers.length === 1 ? 'membro' : 'membros'} cadastrado{clinicUsers.length === 1 ? '' : 's'} • 
                                       {' '}Você está no plano Elite: Até 10 usuários inclusos.
                                   </p>
                               </div>
                           </>
                       )}
                   </div>
               </div>
           )}

           {/* SEÇÃO: WHATSAPP HUB */}
           {activeSection === 'integrations' && (
               <div className="space-y-10 animate-in slide-in-from-right-8 duration-500 max-w-3xl">
                   <div className="flex justify-between items-start">
                       <div>
                           <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase leading-none">WhatsApp Hub</h2>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3">Sincronização com Evolution API v2</p>
                       </div>
                       <button onClick={handleTestConnection} disabled={isTesting} className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-200 dark:border-slate-700">
                           {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wifi className="w-3.5 h-3.5" />} Testar
                       </button>
                   </div>
                   <form className="space-y-8 bg-slate-50 dark:bg-slate-800/50 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800">
                       <div>
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">URL Base da API</label>
                           <input type="url" placeholder="https://..." className="w-full mt-2 bg-white dark:bg-slate-900 border-none rounded-2xl py-5 px-6 font-bold focus:ring-2 focus:ring-indigo-500 shadow-sm" value={evoConfig.apiUrl} onChange={e => setEvoConfig({...evoConfig, apiUrl: e.target.value})} />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Instância</label>
                               <input type="text" className="w-full mt-2 bg-white dark:bg-slate-900 border-none rounded-2xl py-5 px-6 font-bold shadow-sm" value={evoConfig.instance} onChange={e => setEvoConfig({...evoConfig, instance: e.target.value})} />
                           </div>
                           <div>
                               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">API Key</label>
                               <input type="password" placeholder="••••••••" className="w-full mt-2 bg-white dark:bg-slate-900 border-none rounded-2xl py-5 px-6 font-bold shadow-sm" value={evoConfig.apiKey} onChange={e => setEvoConfig({...evoConfig, apiKey: e.target.value})} />
                           </div>
                       </div>
                       <button onClick={(e) => { e.preventDefault(); localStorage.setItem('clinify_evolution_config', JSON.stringify(evoConfig)); setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 2000); }} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-6 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2">
                           {saveSuccess ? <><CheckCircle2 className="w-5 h-5" /> Salvo</> : <><Save className="w-5 h-5" /> Gravar Configurações</>}
                       </button>
                   </form>
               </div>
           )}

           {/* SEÇÃO: ASSINATURA */}
           {activeSection === 'subscription' && (
               <SubscriptionTab user={user} />
           )}

           {/* SEÇÃO: DADOS */}
           {activeSection === 'data' && (
               <div className="space-y-10 animate-in slide-in-from-right-8 duration-500 max-w-3xl">
                   <div>
                       <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase leading-none">Dados & Segurança</h2>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3">Importação, exportação e limpeza de base</p>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <button onClick={() => setIsImportModalOpen(true)} className="p-10 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] text-center group hover:border-indigo-500 transition-all">
                           <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm text-indigo-600 group-hover:scale-110 transition-transform"><FileUp className="w-8 h-8" /></div>
                           <h4 className="font-black text-slate-900 dark:text-white uppercase italic tracking-tighter text-lg">Importar Planilha</h4>
                           <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Lançamentos em massa (.xlsx)</p>
                       </button>
                      <button onClick={handleSeedData} disabled={isDataWorking} className="p-10 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border-2 border-dashed border-emerald-200 dark:border-emerald-800 rounded-[3rem] text-center group hover:border-emerald-500 transition-all disabled:opacity-50">
                          <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm text-emerald-600 group-hover:scale-110 transition-transform">
                              {isDataWorking ? <Loader2 className="w-8 h-8 animate-spin" /> : <Sparkles className="w-8 h-8" />}
                          </div>
                          <h4 className="font-black text-slate-900 dark:text-white uppercase italic tracking-tighter text-lg">Gerar Fictícios</h4>
                          <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Pacientes • Staff • Agenda • Finanças • Estoque • CRM</p>
                      </button>
                   </div>
                       
                       {/* Botão de Sincronização */}
                       <div className="p-10 bg-blue-50 dark:bg-blue-900/10 rounded-[3rem] border border-blue-100 dark:border-blue-900/30 flex gap-6 items-center">
                           <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-blue-600">
                               {isDataWorking ? <Loader2 className="w-8 h-8 animate-spin" /> : <RefreshCw className="w-8 h-8" />}
                           </div>
                           <div className="flex-1">
                               <h4 className="font-black text-blue-900 dark:text-blue-100 uppercase italic tracking-tighter text-lg">🔄 Sincronizar com Banco de Dados</h4>
                               <p className="text-sm font-bold text-blue-600/70 mb-4 leading-relaxed">Se você deletou dados diretamente no Prisma Studio ou em outro lugar, use este botão para sincronizar o Clinify com o banco de dados e atualizar todos os dados exibidos.</p>
                               <button onClick={handleSyncData} disabled={isDataWorking} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl">
                                   {isDataWorking ? 'Sincronizando...' : 'Sincronizar Agora'}
                               </button>
                           </div>
                       </div>
                       
                       <div className="p-10 bg-rose-50 dark:bg-rose-900/10 rounded-[3rem] border border-rose-100 dark:border-rose-900/30 flex gap-6 items-center">
                       <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-rose-600">
                           {isDataWorking ? <Loader2 className="w-8 h-8 animate-spin" /> : <AlertCircle className="w-8 h-8" />}
                       </div>
                       <div className="flex-1">
                           <h4 className="font-black text-rose-900 dark:text-rose-100 uppercase italic tracking-tighter text-lg">⚠️ Zona de Perigo</h4>
                           <p className="text-sm font-bold text-rose-600/70 mb-4 leading-relaxed">Exclua permanentemente TODOS os dados da clínica: transações, pacientes, staff, agendamentos, orçamentos, estoque, prescrições, conversas e muito mais. Esta ação é IRREVERSÍVEL.</p>
                           <button onClick={handleResetData} disabled={isDataWorking} className="px-6 py-3 bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl">
                               {isDataWorking ? 'Deletando...' : 'Deletar TODOS os Dados'}
                           </button>
                       </div>
                   </div>
               </div>
           )}
       </main>

       <DataImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} userId={user?.clinicId} onSuccess={() => { refreshTransactions(); }} />
      
      <UserInviteModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
        onSuccess={handleInviteSuccess}
      />
      
      <UserEditModal 
        isOpen={isEditModalOpen} 
        onClose={() => { setIsEditModalOpen(false); setEditingUser(null); }} 
        onSuccess={handleEditSuccess}
        user={editingUser}
      />
    </div>
  );
};

export default SettingsTab;
