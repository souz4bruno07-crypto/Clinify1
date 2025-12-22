import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, X, 
  Check, Loader2, ChevronDown, Clock, User, MapPin, CheckCircle2, 
  AlertCircle, UserPlus, Phone, Smartphone, Home, Briefcase, Megaphone, Ruler, Weight, Activity
} from 'lucide-react';
import { Appointment, Patient, Staff } from '../../types';
import { getAppointments, addAppointment, updateAppointment, deleteAppointment, getPatients, getStaff, addPatient } from '../../services/supabaseService';
import { useAuth } from '../../contexts/AuthContext';
import { formatPhone, formatCPF } from '../../utils/formatters';

const CalendarTab: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('day');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [isNewPatient, setIsNewPatient] = useState(false);

  const initialNewPatientData = {
    name: '', phone: '', email: '', cpf: '', birth_date: '',
    cep: '', address_street: '', address_number: '', address_city: '', address_state: '',
    height: '', weight: '', profession: '', marketing_source: ''
  };

  const [newPatientFormData, setNewPatientFormData] = useState(initialNewPatientData);
  const [formData, setFormData] = useState({ 
    patientId: '', staffId: '', date: '', time: '09:00', duration: 60, serviceName: '', notes: '' 
  });

  const loadData = async () => {
      if(!user) return;
      setIsLoading(true);
      const start = new Date(currentDate);
      start.setDate(1);
      start.setMonth(currentDate.getMonth() - 1);
      const end = new Date(currentDate);
      end.setMonth(currentDate.getMonth() + 2);
      end.setDate(0);
      try {
        const [appts, pats, stf] = await Promise.all([
          getAppointments(user.id, start.getTime(), end.getTime()), 
          getPatients(user.id), 
          getStaff(user.id)
        ]);
        setAppointments(appts);
        setPatients(pats);
        setStaff(stf);
      } finally {
        setIsLoading(false);
      }
  };

  useEffect(() => { loadData(); }, [currentDate, user]);

  const handleCepSearch = async (cep: string) => {
    const cleanedCep = cep.replace(/\D/g, '');
    if (cleanedCep.length === 8) {
      setIsSearchingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setNewPatientFormData(prev => ({
            ...prev,
            address_street: data.logradouro,
            address_city: data.localidade,
            address_state: data.uf
          }));
        }
      } catch (err) {} finally { setIsSearchingCep(false); }
    }
  };

  const hours = Array.from({ length: 13 }, (_, i) => i + 8); 

  const openModal = (appt?: Appointment, slotDate?: Date, slotHour?: number) => {
      setIsNewPatient(false);
      setNewPatientFormData(initialNewPatientData);
      if (appt) {
          const d = new Date(appt.startTime);
          setEditingAppt(appt);
          setFormData({ 
            patientId: appt.patientId, staffId: appt.staffId || '', 
            date: d.toISOString().split('T')[0], time: d.toTimeString().slice(0,5), 
            duration: (appt.endTime - appt.startTime) / 60000, serviceName: appt.serviceName, notes: appt.notes || '' 
          });
      } else {
          const d = slotDate || currentDate;
          setEditingAppt(null);
          setFormData({ 
            patientId: '', staffId: '', date: d.toISOString().split('T')[0], 
            time: slotHour !== undefined ? `${slotHour.toString().padStart(2, '0')}:00` : '09:00', 
            duration: 60, serviceName: '', notes: '' 
          });
      }
      setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!user) return;
    setIsSaving(true);
    try {
        let finalPatientId = formData.patientId;
        let finalPatientName = patients.find(p => p.id === formData.patientId)?.name || 'Paciente';
        if (isNewPatient && newPatientFormData.name) {
            /* Fix: addPatient returns { data, error } object */
            const result = await addPatient({ user_id: user.id, ...newPatientFormData });
            if (result.data) { 
                finalPatientId = result.data.id; 
                finalPatientName = result.data.name; 
            }
        }
        const start = new Date(`${formData.date}T${formData.time}:00`);
        const end = new Date(start.getTime() + (formData.duration * 60000));
        const apptData = { 
            userId: user.id, patientId: finalPatientId, patientName: finalPatientName, 
            staffId: formData.staffId || undefined, startTime: start.getTime(), endTime: end.getTime(), 
            serviceName: formData.serviceName || 'Consulta', status: (editingAppt?.status || 'scheduled') as any, notes: formData.notes 
        };
        if (editingAppt) await updateAppointment(editingAppt.id, apptData);
        else await addAppointment(apptData);
        setIsModalOpen(false);
        loadData();
    } finally { setIsSaving(false); }
  };

  const getStatusStyle = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-500 border-emerald-400 text-white';
      case 'completed': return 'bg-slate-800 border-slate-700 text-slate-300 opacity-60';
      case 'canceled': return 'bg-rose-500 border-rose-400 text-white line-through';
      default: return 'bg-indigo-600 border-indigo-400 text-white shadow-indigo-500/20';
    }
  };

  const renderDayView = () => {
    const dayAppts = appointments.filter(a => new Date(a.startTime).toDateString() === currentDate.toDateString());
    return (
      <div className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-500">
          <div className="bg-slate-50 dark:bg-slate-950 p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">{currentDate.toLocaleDateString('pt-BR', { weekday: 'long' })}</h3>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{dayAppts.length} atendimentos registrados</p>
              </div>
              <div className="flex gap-3">
                  <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 1)))} className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:scale-105 transition-transform"><ChevronLeft className="w-6 h-6"/></button>
                  <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 1)))} className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:scale-105 transition-transform"><ChevronRight className="w-6 h-6"/></button>
              </div>
          </div>
          <div className="overflow-y-auto max-h-[800px] no-scrollbar">
              {hours.map(hour => (
                  <div key={hour} className="flex border-b border-slate-50 dark:border-slate-800/50 group min-h-[120px]">
                      <div className="w-28 py-10 px-6 text-right text-[10px] font-black text-slate-300 border-r border-slate-50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-950/30 uppercase tracking-tighter">{hour}:00</div>
                      <div className="flex-1 p-3 relative hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors cursor-pointer" onClick={() => openModal(undefined, currentDate, hour)}>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {dayAppts.filter(a => new Date(a.startTime).getHours() === hour).map(a => (
                                  <div key={a.id} onClick={(e) => { e.stopPropagation(); openModal(a); }} className={`p-5 rounded-[2rem] border-l-8 shadow-xl transition-all hover:scale-[1.03] cursor-pointer flex flex-col justify-between ${getStatusStyle(a.status)}`}>
                                      <div>
                                          <div className="flex justify-between items-start mb-2">
                                              <p className="font-black text-sm uppercase tracking-tight truncate max-w-[140px]">{a.patientName}</p>
                                              <span className="text-[10px] font-black opacity-60 uppercase">{new Date(a.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                          </div>
                                          <p className="text-[11px] font-bold opacity-80 truncate uppercase">{a.serviceName}</p>
                                      </div>
                                      <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
                                          <div className="w-6 h-6 rounded-xl bg-white/20 flex items-center justify-center"><User className="w-3.5 h-3.5" /></div>
                                          <span className="text-[10px] font-black uppercase opacity-80">{staff.find(s => s.id === a.staffId)?.name.split(' ')[0] || 'Profissional'}</span>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const weekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(startOfWeek); d.setDate(startOfWeek.getDate() + i); return d; });
    return (
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {weekDays.map(day => {
          const dayAppts = appointments.filter(a => new Date(a.startTime).toDateString() === day.toDateString());
          const isToday = day.toDateString() === new Date().toDateString();
          return (
            <div key={day.toISOString()} className={`bg-white dark:bg-slate-900 rounded-[2.5rem] border ${isToday ? 'border-indigo-500 shadow-xl ring-4 ring-indigo-500/10' : 'border-slate-200 dark:border-slate-800'} overflow-hidden flex flex-col min-h-[500px]`}>
              <div className={`p-6 text-center border-b ${isToday ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-950 text-slate-500'}`}>
                <p className="text-[10px] font-black uppercase tracking-widest">{day.toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
                <h4 className={`text-2xl font-black tracking-tighter ${isToday ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{day.getDate()}</h4>
              </div>
              <div className="flex-1 p-3 space-y-3 overflow-y-auto no-scrollbar bg-slate-50/30 dark:bg-slate-950/30">
                {dayAppts.map(a => (
                  <div key={a.id} onClick={() => openModal(a)} className={`p-4 rounded-3xl border-l-4 shadow-sm cursor-pointer hover:scale-[1.02] transition-transform ${getStatusStyle(a.status)}`}>
                    <p className="text-[11px] font-black uppercase truncate leading-none mb-1">{a.patientName}</p>
                    <p className="text-[9px] font-bold opacity-60 uppercase">{new Date(a.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear(); const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = []; for (let i = 0; i < firstDay; i++) days.push(null); for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return (
      <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-500">
        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
            <div key={d} className="py-6 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 bg-slate-50 dark:bg-slate-950 border-r last:border-0 border-slate-100 dark:border-slate-800">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-[140px] md:auto-rows-[180px]">
          {days.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="bg-slate-50/30 dark:bg-slate-950/30 border-r border-b border-slate-50 dark:border-slate-800/50"></div>;
            const dayAppts = appointments.filter(a => new Date(a.startTime).toDateString() === day.toDateString());
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div key={day.toISOString()} onClick={() => { setCurrentDate(day); setView('day'); }} className={`p-4 border-r border-b border-slate-50 dark:border-slate-800/50 group hover:bg-indigo-50/30 dark:hover:bg-indigo-900/5 transition-all cursor-pointer relative ${isToday ? 'bg-indigo-50/20' : ''}`}>
                <div className="flex justify-between items-start">
                  <span className={`text-sm font-black p-1.5 rounded-lg leading-none ${isToday ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'}`}>{day.getDate()}</span>
                  {dayAppts.length > 0 && <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full">{dayAppts.length}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
          <button onClick={() => setIsDatePickerOpen(!isDatePickerOpen)} className="group flex items-center gap-6 bg-white dark:bg-slate-900 px-10 py-6 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:ring-8 hover:ring-indigo-500/5 transition-all w-full lg:w-auto">
              <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-2xl shadow-indigo-500/30"><CalendarIcon className="w-8 h-8" /></div>
              <div className="text-left flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Data Ativa</p>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">{currentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</h2>
              </div>
          </button>
          <div className="flex flex-wrap gap-4 w-full lg:w-auto">
              <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-[2.5rem] flex gap-2 shadow-inner">{['month', 'week', 'day'].map((v) => (<button key={v} onClick={() => setView(v as any)} className={`px-10 py-5 rounded-[2.2rem] text-[11px] font-black uppercase tracking-widest transition-all ${view === v ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>{v === 'month' ? 'Mês' : v === 'week' ? 'Semana' : 'Dia'}</button>))}</div>
              <button onClick={() => openModal()} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-12 py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-4 hover:opacity-90 transition-all"><Plus className="w-6 h-6" /> Reservar Horário</button>
          </div>
      </div>

      <div className="relative">
          {isLoading && (<div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-md z-50 rounded-[4rem]"><Loader2 className="w-16 h-16 animate-spin text-indigo-600 mb-6" /></div>)}
          {view === 'day' && renderDayView()}
          {view === 'week' && renderWeekView()}
          {view === 'month' && renderMonthView()}
      </div>

      {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-lg">
              <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[4rem] shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden border border-white/10 animate-in zoom-in-95 duration-300">
                  <div className="p-12 border-b bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center shrink-0">
                      <div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none">{editingAppt ? 'Editar Horário' : 'Novo Agendamento'}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Detalhamento de Fluxo Clínico</p>
                      </div>
                      <button type="button" onClick={() => setIsModalOpen(false)} className="p-4 bg-white dark:bg-slate-700 rounded-full text-slate-400 shadow-sm hover:scale-110 transition-transform"><X className="w-8 h-8"/></button>
                  </div>
                  
                  <div className="p-12 space-y-10 overflow-y-auto no-scrollbar">
                      <div className="space-y-6">
                          <div className="flex justify-between items-end px-1">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Paciente</label>
                            <button type="button" onClick={() => setIsNewPatient(!isNewPatient)} className={`flex items-center gap-2 text-[10px] font-black uppercase transition-all px-5 py-2.5 rounded-full border ${isNewPatient ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50'}`}><UserPlus className="w-3.5 h-3.5" /> {isNewPatient ? 'Selecionar Base' : 'Novo Cadastro'}</button>
                          </div>

                          {isNewPatient ? (
                              <div className="space-y-6 bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <input type="text" required placeholder="Nome Completo" className="md:col-span-2 bg-white dark:bg-slate-800 border-none rounded-2xl py-4 px-6 font-bold focus:ring-4 focus:ring-indigo-500/10" value={newPatientFormData.name} onChange={e => setNewPatientFormData({...newPatientFormData, name: e.target.value})} />
                                  <input type="tel" required placeholder="WhatsApp" className="bg-white dark:bg-slate-800 border-none rounded-2xl py-4 px-6 font-bold focus:ring-4 focus:ring-indigo-500/10" value={newPatientFormData.phone} onChange={e => setNewPatientFormData({...newPatientFormData, phone: formatPhone(e.target.value)})} />
                                  <div className="relative">
                                      <input type="text" placeholder="CEP" className="w-full bg-white dark:bg-slate-800 border-none rounded-2xl py-4 px-6 font-bold focus:ring-4 focus:ring-indigo-500/10" value={newPatientFormData.cep} onChange={e => { setNewPatientFormData({...newPatientFormData, cep: e.target.value}); handleCepSearch(e.target.value); }} />
                                      {isSearchingCep && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-indigo-500" />}
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                   <div className="relative"><Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" /><input type="text" placeholder="Altura (cm)" className="w-full bg-white dark:bg-slate-800 border-none rounded-2xl py-3 pl-8 pr-4 font-bold text-xs" value={newPatientFormData.height} onChange={e => setNewPatientFormData({...newPatientFormData, height: e.target.value})} /></div>
                                   <div className="relative"><Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" /><input type="text" placeholder="Peso (kg)" className="w-full bg-white dark:bg-slate-800 border-none rounded-2xl py-3 pl-8 pr-4 font-bold text-xs" value={newPatientFormData.weight} onChange={e => setNewPatientFormData({...newPatientFormData, weight: e.target.value})} /></div>
                                </div>
                                <input type="text" placeholder="Logradouro" className="w-full bg-white dark:bg-slate-800 border-none rounded-2xl py-4 px-6 font-bold focus:ring-4 focus:ring-indigo-500/10 text-xs" value={newPatientFormData.address_street} onChange={e => setNewPatientFormData({...newPatientFormData, address_street: e.target.value})} />
                              </div>
                          ) : (
                            <select required className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[2rem] py-6 px-8 font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 appearance-none text-lg" value={formData.patientId} onChange={e => setFormData({...formData, patientId: e.target.value})}>
                               <option value="">Buscar paciente base...</option>
                               {patients.map(p => <option key={p.id} value={p.id}>{p.name} • {p.phone}</option>)}
                            </select>
                          )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">Responsável Técnico</label>
                              <select required className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[1.5rem] py-4 px-6 font-bold" value={formData.staffId} onChange={e => setFormData({...formData, staffId: e.target.value})}>
                                  <option value="">Selecione Profissional...</option>
                                  {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">Procedimento</label>
                              <input type="text" placeholder="Ex: Harmonização Facial" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[1.5rem] py-4 px-6 font-bold" value={formData.serviceName} onChange={e => setFormData({...formData, serviceName: e.target.value})} />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            <div><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">Data</label><input type="date" required className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-5 font-bold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
                            <div><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">Início</label><input type="time" required className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-5 font-bold" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} /></div>
                            <div className="col-span-2 md:col-span-1"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">Duração (min)</label><input type="number" required step="15" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-5 font-bold" value={formData.duration} onChange={e => setFormData({...formData, duration: Number(e.target.value)})} /></div>
                      </div>
                  </div>

                  <div className="p-12 border-t bg-slate-50 dark:bg-slate-800/50 flex flex-col md:flex-row gap-4 shrink-0">
                      {editingAppt && <button type="button" onClick={async () => { if(window.confirm("Excluir?")) { await deleteAppointment(editingAppt.id); setIsModalOpen(false); loadData(); } }} className="px-10 py-6 text-rose-600 font-black uppercase text-[11px] tracking-[0.2em] hover:bg-rose-50 rounded-3xl transition-colors">Excluir</button>}
                      <button type="submit" disabled={isSaving} className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-7 rounded-[2.5rem] font-black uppercase tracking-[0.3em] shadow-2xl flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 text-xs">{isSaving ? <Loader2 className="w-8 h-8 animate-spin" /> : <><CheckCircle2 className="w-8 h-8" /> Confirmar Agenda</>}</button>
                  </div>
              </form>
          </div>
      )}
    </div>
  );
};

export default CalendarTab;