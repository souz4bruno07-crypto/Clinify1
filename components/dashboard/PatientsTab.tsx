
import React, { useState, useEffect } from 'react';
import { getPatients, addPatient, updatePatient, deletePatient } from '../../services/supabaseService';
import { Patient } from '../../types';
import { formatCPF, formatPhone } from '../../utils/formatters';
import { 
  Search, Plus, User, Phone, Mail, X, Trash2, Edit2, Users, 
  Loader2, MapPin, Briefcase, Megaphone, Home, CheckCircle2, 
  Ruler, Weight, Activity, Calendar 
} from 'lucide-react';

const PatientsTab: React.FC<{ user: any }> = ({ user }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  const initialFormData = {
    name: '', phone: '', email: '', cpf: '', birth_date: '',
    profession: '', marketing_source: '',
    cep: '', address_street: '', address_number: '', address_complement: '',
    address_neighborhood: '', address_city: '', address_state: '',
    height: '', weight: '', notes: ''
  };

  const [formData, setFormData] = useState(initialFormData);

  const loadPatients = async () => {
     if (user) {
         setLoading(true);
         const data = await getPatients(user.id);
         setPatients(data);
         setLoading(false);
     }
  };

  useEffect(() => { loadPatients(); }, [user]);

  const handleCepSearch = async (cep: string) => {
    const cleanedCep = cep.replace(/\D/g, '');
    if (cleanedCep.length === 8) {
      setIsSearchingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            address_street: data.logradouro,
            address_neighborhood: data.bairro,
            address_city: data.localidade,
            address_state: data.uf
          }));
        }
      } catch (err) {
        console.error("Erro busca CEP", err);
      } finally {
        setIsSearchingCep(false);
      }
    }
  };

  const filtered = patients.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.cpf?.includes(search) || p.phone?.includes(search)
  );

  const openModal = (patient?: Patient) => {
      if (patient) {
          setEditingPatient(patient);
          setFormData({
              name: patient.name, phone: patient.phone, email: patient.email || '',
              cpf: patient.cpf || '', birth_date: patient.birth_date || '',
              profession: patient.profession || '', marketing_source: patient.marketing_source || '',
              cep: patient.cep || '', address_street: patient.address_street || '',
              address_number: patient.address_number || '', address_complement: patient.address_complement || '',
              address_neighborhood: patient.address_neighborhood || '', address_city: patient.address_city || '',
              address_state: patient.address_state || '', height: patient.height || '',
              weight: patient.weight || '', notes: patient.notes || ''
          });
      } else {
          setEditingPatient(null);
          setFormData(initialFormData);
      }
      setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      setIsSaving(true);
      try {
          const patientData = { 
              user_id: user.id, 
              ...formData, 
              avatar_url: editingPatient?.avatar_url 
          };
          
          let result;
          if (editingPatient) {
              result = await updatePatient(editingPatient.id, patientData);
          } else {
              result = await addPatient(patientData);
          }

          if (result.data) {
              setIsModalOpen(false);
              setTimeout(loadPatients, 200);
          } else {
              alert(`Erro do Banco: ${result.error}`);
          }
      } catch (error: any) {
          alert(`Falha crítica: ${error.message}`);
      } finally {
          setIsSaving(false);
      }
  };

  const handleDelete = async (id: string) => {
      if(window.confirm("Deseja excluir este paciente? Esta ação não pode ser desfeita.")) {
          const success = await deletePatient(id);
          if (success) loadPatients();
          else alert("Não foi possível excluir o paciente.");
      }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 italic tracking-tighter">
                  <Users className="w-8 h-8 text-emerald-600" /> Base de Pacientes
              </h2>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">{patients.length} registros ativos</p>
          </div>
          <button onClick={() => openModal()} className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 active:scale-95">
             <Plus className="w-4 h-4" /> Novo Paciente
          </button>
       </div>

       <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="relative max-w-xl">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input 
                 type="text" 
                 placeholder="Buscar por nome, CPF ou telefone..."
                 className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold transition-all"
                 value={search}
                 onChange={e => setSearch(e.target.value)}
               />
            </div>
          </div>

          <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-black uppercase text-[10px] tracking-widest">
                   <tr>
                      <th className="px-8 py-5">Paciente</th>
                      <th className="px-8 py-5">Bio / Perfil</th>
                      <th className="px-8 py-5">Localização</th>
                      <th className="px-8 py-5 text-center">Gestão</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                   {loading ? (
                       <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-emerald-500" /></td></tr>
                   ) : filtered.length === 0 ? (
                       <tr><td colSpan={4} className="p-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhum paciente na base.</td></tr>
                   ) : filtered.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-default">
                         <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                               <img src={p.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random`} className="w-14 h-14 rounded-2xl border-2 border-white dark:border-slate-700 shadow-md" alt="" />
                               <div>
                                  <p className="font-black text-slate-900 dark:text-white text-base leading-none mb-1.5">{p.name}</p>
                                  <div className="flex gap-2">
                                    <span className="text-[9px] text-slate-400 font-black uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{p.phone}</span>
                                    {p.birth_date && <span className="text-[9px] text-indigo-500 font-black uppercase bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">🎂 {new Date(p.birth_date).toLocaleDateString('pt-BR')}</span>}
                                  </div>
                               </div>
                            </div>
                         </td>
                         <td className="px-8 py-6">
                            <div className="space-y-1">
                               {(p.height || p.weight) && (
                                   <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 font-black text-[10px] uppercase">
                                      {p.height && <span><Ruler className="w-3 h-3 inline mr-1" /> {p.height}cm</span>}
                                      {p.weight && <span><Weight className="w-3 h-3 inline mr-1" /> {p.weight}kg</span>}
                                   </div>
                               )}
                               {p.profession && <p className="text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-slate-400" /> {p.profession}</p>}
                            </div>
                         </td>
                         <td className="px-8 py-6">
                            <div className="space-y-0.5">
                               {p.address_city ? (
                                   <>
                                      <p className="text-slate-700 dark:text-slate-200 font-bold text-xs">{p.address_city}, {p.address_state}</p>
                                      <p className="text-[10px] text-slate-400 font-medium">{p.address_neighborhood}</p>
                                   </>
                               ) : <span className="text-slate-300 italic text-xs">Não informado</span>}
                            </div>
                         </td>
                         <td className="px-8 py-6">
                            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                <button onClick={() => openModal(p)} className="p-3 bg-white dark:bg-slate-700 text-blue-600 rounded-xl shadow-sm hover:scale-110 transition-all border border-slate-100 dark:border-slate-600"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(p.id)} className="p-3 bg-white dark:bg-slate-700 text-rose-600 rounded-xl shadow-sm hover:scale-110 transition-all border border-slate-100 dark:border-slate-600"><Trash2 className="w-4 h-4" /></button>
                            </div>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
       </div>

       {/* Modal Expandido - Ficha Completa */}
       {isModalOpen && (
           <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
               <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[3.5rem] shadow-2xl animate-in zoom-in-95 border border-white/10 overflow-hidden flex flex-col max-h-[95vh]">
                   <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                       <div className="flex items-center gap-4">
                           <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-xl"><User className="w-8 h-8" /></div>
                           <div>
                               <h3 className="font-black text-2xl text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">
                                   {editingPatient ? 'Editar Ficha' : 'Novo Paciente'}
                               </h3>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Prontuário e Cadastro Unificado</p>
                           </div>
                       </div>
                       <button onClick={() => setIsModalOpen(false)} className="p-4 bg-white dark:bg-slate-700 rounded-full shadow-sm text-slate-400 hover:scale-110 transition-transform"><X className="w-6 h-6" /></button>
                   </div>
                   
                   <form onSubmit={handleSave} className="p-10 space-y-12 overflow-y-auto no-scrollbar">
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                           <div className="space-y-6">
                              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-2 flex items-center gap-2"><User className="w-3.5 h-3.5 text-emerald-500"/> Identidade</h4>
                              <div className="space-y-4">
                                  <input type="text" required placeholder="Nome Completo" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-emerald-500 font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                  <div className="grid grid-cols-2 gap-4">
                                      <input type="tel" required placeholder="WhatsApp" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-emerald-500 font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: formatPhone(e.target.value)})} maxLength={15} />
                                      <input type="date" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-emerald-500 font-bold text-xs" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} />
                                  </div>
                                  <input type="email" placeholder="E-mail" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-emerald-500 font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                                  <input type="text" placeholder="CPF" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-emerald-500 font-bold" value={formData.cpf} onChange={e => setFormData({...formData, cpf: formatCPF(e.target.value)})} maxLength={14} />
                              </div>
                           </div>

                           <div className="space-y-6">
                              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-2 flex items-center gap-2"><Activity className="w-3.5 h-3.5 text-indigo-500"/> Triagem Clínica</h4>
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="relative">
                                    <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input type="text" placeholder="Altura (cm)" className="w-full pl-12 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-indigo-500 font-bold" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} />
                                  </div>
                                  <div className="relative">
                                    <Weight className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input type="text" placeholder="Peso (kg)" className="w-full pl-12 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-indigo-500 font-bold" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} />
                                  </div>
                              </div>
                              <div className="space-y-4">
                                  <div className="relative">
                                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input type="text" placeholder="Profissão" className="w-full pl-12 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-emerald-500 font-bold" value={formData.profession} onChange={e => setFormData({...formData, profession: e.target.value})} />
                                  </div>
                                  <select className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-emerald-500 font-bold" value={formData.marketing_source} onChange={e => setFormData({...formData, marketing_source: e.target.value})}>
                                      <option value="">Onde nos conheceu?</option>
                                      <option value="instagram">Instagram</option>
                                      <option value="google">Google / Maps</option>
                                      <option value="indicacao">Indicação Profissional</option>
                                      <option value="paciente">Indicação de Amigo</option>
                                      <option value="outdoor">Fachada / Outdoor</option>
                                  </select>
                              </div>
                           </div>
                       </div>

                       <div className="space-y-6">
                          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-2 flex items-center gap-2"><Home className="w-3.5 h-3.5 text-amber-500"/> Endereço</h4>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div className="relative md:col-span-1">
                                <input type="text" placeholder="CEP" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-amber-500 font-bold" value={formData.cep} onChange={e => { setFormData({...formData, cep: e.target.value}); handleCepSearch(e.target.value); }} maxLength={9} />
                                {isSearchingCep && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-amber-500" />}
                              </div>
                              <input type="text" placeholder="Rua / Logradouro" className="md:col-span-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-amber-500 font-bold" value={formData.address_street} onChange={e => setFormData({...formData, address_street: e.target.value})} />
                              <input type="text" placeholder="Número" className="bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-amber-500 font-bold" value={formData.address_number} onChange={e => setFormData({...formData, address_number: e.target.value})} />
                              <input type="text" placeholder="Complemento" className="bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-amber-500 font-bold" value={formData.address_complement} onChange={e => setFormData({...formData, address_complement: e.target.value})} />
                              <input type="text" placeholder="Bairro" className="bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-amber-500 font-bold" value={formData.address_neighborhood} onChange={e => setFormData({...formData, address_neighborhood: e.target.value})} />
                              <input type="text" placeholder="Cidade" className="bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-amber-500 font-bold" value={formData.address_city} onChange={e => setFormData({...formData, address_city: e.target.value})} />
                              <input type="text" placeholder="UF" className="bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-amber-500 font-bold" value={formData.address_state} onChange={e => setFormData({...formData, address_state: e.target.value})} maxLength={2} />
                          </div>
                       </div>

                       <div className="pt-6">
                           <button type="submit" disabled={isSaving} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-7 rounded-[2.5rem] font-black uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 text-xs">
                               {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CheckCircle2 className="w-6 h-6" /> Consolidar Prontuário</>}
                           </button>
                       </div>
                   </form>
               </div>
           </div>
       )}
    </div>
  );
};

export default PatientsTab;
