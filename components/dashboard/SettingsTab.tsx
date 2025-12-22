
import React, { useState, useEffect } from 'react';
import { 
  Building2, Database, Globe, LogOut, Loader2, 
  CheckCircle2, Save, Users, UserPlus, Trash2, 
  ShieldCheck, FileUp, Download, Info, ArrowRight,
  UserMinus, Wifi, AlertCircle, RefreshCw, KeyRound, Mail, Sparkles
} from 'lucide-react';
import { getClinicMembers, deleteAllTransactions, seedMockData } from '../../services/supabaseService';
import { useAuth } from '../../contexts/AuthContext';
import { EvolutionConfig, testEvolutionConnection } from '../../services/evolutionService';
import { User, UserRole } from '../../types';
import DataImportModal from '../modals/DataImportModal';

const SettingsTab: React.FC<{ user: any; refreshTransactions: () => void }> = ({ user, refreshTransactions }) => {
  const { signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<'profile' | 'users' | 'integrations' | 'data'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isDataWorking, setIsDataWorking] = useState(false);

  const [clinicUsers, setClinicUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const loadMembers = async () => {
    if (!user?.clinicId) return;
    setLoadingUsers(true);
    const members = await getClinicMembers(user.clinicId);
    setClinicUsers(members);
    setLoadingUsers(false);
  };

  useEffect(() => {
    if (activeSection === 'users') loadMembers();
  }, [activeSection, user?.clinicId]);

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
      if (!user?.id) return;
      if (window.confirm("ATENÇÃO: Esta ação irá deletar TODOS os lançamentos financeiros da sua clínica permanentemente. Deseja continuar?")) {
          setIsDataWorking(true);
          const success = await deleteAllTransactions(user.id);
          if (success) {
              alert("Base de dados zerada com sucesso!");
              refreshTransactions();
          } else {
              alert("Erro ao zerar base de dados.");
          }
          setIsDataWorking(false);
      }
  };

  const handleSeedData = async () => {
      if (!user?.id) return;
      setIsDataWorking(true);
      const success = await seedMockData(user.id);
      if (success) {
          alert("Dados fictícios gerados para este mês!");
          refreshTransactions();
      } else {
          alert("Erro ao gerar dados de teste.");
      }
      setIsDataWorking(false);
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
                       <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">
                           <UserPlus className="w-4 h-4" /> Convidar
                       </button>
                   </div>
                   <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[3rem] border border-slate-100 dark:border-slate-800 overflow-hidden">
                       <table className="w-full text-left">
                           <thead className="bg-slate-100 dark:bg-slate-900/50">
                               <tr>
                                   <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest">Colaborador</th>
                                   <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest">Cargo</th>
                                   <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                   <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Ação</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                               <tr className="group">
                                   <td className="px-8 py-6">
                                       <div className="flex items-center gap-3">
                                           <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black">{user?.name?.charAt(0)}</div>
                                           <div>
                                               <p className="font-black text-slate-900 dark:text-white text-sm">{user?.name} (Você)</p>
                                               <p className="text-[10px] font-bold text-slate-400">{user?.email}</p>
                                           </div>
                                       </div>
                                   </td>
                                   <td className="px-8 py-6"><span className="text-[9px] font-black uppercase px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg">Admin Mestre</span></td>
                                   <td className="px-8 py-6"><div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div><span className="text-[10px] font-black uppercase text-slate-500">Ativo</span></div></td>
                                   <td className="px-8 py-6 text-right"><button className="p-2 text-slate-300 hover:text-indigo-600"><KeyRound className="w-4 h-4" /></button></td>
                               </tr>
                           </tbody>
                       </table>
                       <div className="p-8 text-center bg-white/50 dark:bg-slate-900/50">
                           <p className="text-xs font-bold text-slate-400">Você está no plano Elite: Até 10 usuários inclusos.</p>
                       </div>
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
                       <button onClick={handleSeedData} disabled={isDataWorking} className="p-10 bg-emerald-50 dark:bg-emerald-900/10 border-2 border-dashed border-emerald-200 dark:border-emerald-800 rounded-[3rem] text-center group hover:border-emerald-500 transition-all disabled:opacity-50">
                           <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm text-emerald-600 group-hover:scale-110 transition-transform">
                               {isDataWorking ? <Loader2 className="w-8 h-8 animate-spin" /> : <Sparkles className="w-8 h-8" />}
                           </div>
                           <h4 className="font-black text-slate-900 dark:text-white uppercase italic tracking-tighter text-lg">Gerar Fictícios</h4>
                           <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Popular sistema para testes</p>
                       </button>
                   </div>
                   <div className="p-10 bg-rose-50 dark:bg-rose-900/10 rounded-[3rem] border border-rose-100 dark:border-rose-900/30 flex gap-6 items-center">
                       <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-rose-600">
                           {isDataWorking ? <Loader2 className="w-8 h-8 animate-spin" /> : <AlertCircle className="w-8 h-8" />}
                       </div>
                       <div className="flex-1">
                           <h4 className="font-black text-rose-900 dark:text-rose-100 uppercase italic tracking-tighter text-lg">Zona de Perigo</h4>
                           <p className="text-sm font-bold text-rose-600/70 mb-4 leading-relaxed">Exclua permanentemente todos os registros financeiros e zere seu dashboard. Esta ação é irreversível.</p>
                           <button onClick={handleResetData} disabled={isDataWorking} className="px-6 py-3 bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-all disabled:opacity-50">Zerar Base de Dados</button>
                       </div>
                   </div>
               </div>
           )}
       </main>

       <DataImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} userId={user?.clinicId} onSuccess={() => { refreshTransactions(); }} />
    </div>
  );
};

export default SettingsTab;
