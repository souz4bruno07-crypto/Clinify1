
import React, { useState, useEffect } from 'react';
import { getStaff, addStaff, deleteStaff, updateStaff } from '../../services/supabaseService';
import { Staff } from '../../types';
import { formatPhone } from '../../utils/formatters';
import { Plus, Trash2, X, Save, User, Edit2, CheckCircle2, ShieldCheck } from 'lucide-react';

const COLORS = [
    { bg: 'bg-blue-100', text: 'text-blue-700', ring: 'ring-blue-500' },
    { bg: 'bg-emerald-100', text: 'text-emerald-700', ring: 'ring-emerald-500' },
    { bg: 'bg-purple-100', text: 'text-purple-700', ring: 'ring-purple-500' },
    { bg: 'bg-amber-100', text: 'text-amber-700', ring: 'ring-amber-500' },
    { bg: 'bg-rose-100', text: 'text-rose-700', ring: 'ring-rose-500' },
    { bg: 'bg-indigo-100', text: 'text-indigo-700', ring: 'ring-indigo-500' },
];

const StaffTab: React.FC<{ user: any }> = ({ user }) => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ 
      name: '', 
      role: '', 
      color: 'bg-blue-100 text-blue-700', 
      commissionRate: 0,
      phone: '' 
  });

  const loadStaff = async () => {
      if (user) {
          const data = await getStaff(user.id);
          setStaffList(data);
      }
  };

  useEffect(() => {
      loadStaff();
  }, [user]);

  const openModal = (staff?: Staff) => {
      if (staff) {
          setEditingId(staff.id);
          setFormData({
              name: staff.name,
              role: staff.role,
              color: staff.color,
              commissionRate: staff.commissionRate || 0,
              phone: staff.phone || ''
          });
      } else {
          setEditingId(null);
          setFormData({ name: '', role: '', color: COLORS[0].bg + ' ' + COLORS[0].text, commissionRate: 0, phone: '' });
      }
      setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      setIsLoading(true);
      
      try {
          const payload = {
              userId: user.id,
              name: formData.name,
              role: formData.role,
              color: formData.color,
              commissionRate: formData.commissionRate,
              phone: formData.phone
          };

          if (editingId) await updateStaff(editingId, payload);
          else await addStaff(payload);
          
          setIsModalOpen(false);
          loadStaff();
      } catch (error: any) {
          alert("Erro ao salvar");
      } finally {
          setIsLoading(false);
      }
  };

  const handleDelete = async (id: string) => {
      if(window.confirm("Remover profissional?")) {
          await deleteStaff(id);
          loadStaff();
      }
  };

  return (
      <div className="space-y-8 pb-20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <ShieldCheck className="w-6 h-6 text-emerald-600" />
                      Equipe Pro
                  </h2>
                  <p className="text-slate-500 mt-1">Gerencie profissionais e suas taxas de comissão.</p>
              </div>
              <button onClick={() => openModal()} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-2xl font-bold text-sm hover:opacity-90 shadow-lg flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Novo Membro
              </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {staffList.map(s => (
                  <div key={s.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 relative group hover:shadow-md transition-all">
                      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openModal(s)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(s.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                      </div>

                      <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold ${s.color}`}>
                              {s.name.charAt(0)}
                          </div>
                          <div>
                              <h3 className="font-bold text-slate-900 dark:text-white text-lg">{s.name}</h3>
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{s.role}</span>
                          </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
                          <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase">Comissão</p>
                              <p className="text-lg font-bold text-emerald-600">{s.commissionRate}%</p>
                          </div>
                          <div className="text-right">
                              <p className="text-[10px] font-black text-slate-400 uppercase">Contato</p>
                              <p className="text-xs font-bold text-slate-900 dark:text-white">{s.phone || '-'}</p>
                          </div>
                      </div>
                  </div>
              ))}
              <button 
                  onClick={() => openModal()}
                  className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-emerald-500 hover:text-emerald-600 transition-all min-h-[160px]"
              >
                  <Plus className="w-8 h-8 mb-2" />
                  <span className="font-bold text-sm">Adicionar Membro</span>
              </button>
          </div>

          {isModalOpen && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
                   <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 overflow-hidden flex flex-col border border-white/10">
                       <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                           <h3 className="font-bold text-lg text-slate-900 dark:text-white">{editingId ? 'Editar Membro' : 'Novo Membro'}</h3>
                           <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
                       </div>
                       
                       <form onSubmit={handleSave} className="p-8 space-y-6">
                           <div>
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                               <input type="text" required className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                           </div>
                           
                           <div className="grid grid-cols-2 gap-4">
                               <div>
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cargo</label>
                                   <input type="text" required className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 font-bold" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} />
                               </div>
                               <div>
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Comissão (%)</label>
                                   <div className="relative">
                                       {/* Input number com CSS utilitário para esconder spinners e posicionar símbolo % corretamente */}
                                       <input 
                                           type="number" 
                                           min="0" max="100"
                                           className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 pl-4 pr-10 focus:ring-2 focus:ring-emerald-500 font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                           value={formData.commissionRate} 
                                           onChange={e => setFormData({...formData, commissionRate: Number(e.target.value)})} 
                                       />
                                       <span className="absolute right-4 top-1/2 -translate-y-0.5 text-slate-400 font-black">%</span>
                                   </div>
                               </div>
                           </div>

                           <div>
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone</label>
                               <input type="tel" className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: formatPhone(e.target.value)})} />
                           </div>

                           <div className="pt-4">
                               <button type="submit" disabled={isLoading} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all">
                                   {isLoading ? <RefreshCw className="animate-spin w-5 h-5" /> : <><CheckCircle2 className="w-5 h-5" /> Salvar Profissional</>}
                               </button>
                           </div>
                       </form>
                   </div>
               </div>
          )}
      </div>
  );
};

const RefreshCw = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
);

export default StaffTab;
