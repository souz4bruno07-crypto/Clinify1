import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, X, 
  Check, Loader2, ChevronDown, Clock, User, MapPin, CheckCircle2, 
  AlertCircle, UserPlus, Phone, Smartphone, Home, Briefcase, Megaphone, Ruler, Weight, Activity,
  Sparkles, Syringe, Scissors, Heart, Eye, Stethoscope, Zap, Star, CalendarCheck
} from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import { SkeletonCalendar } from '../ui/Skeleton';
import { Appointment, Patient, Staff } from '../../types';
import { getAppointments, addAppointment, updateAppointment, deleteAppointment, getPatients, getStaff, addPatient } from '../../services/backendService';
import { useAuth } from '../../contexts/AuthContextAPI';
import { formatPhone, formatCPF } from '../../utils/formatters';
import { useToast } from '../../contexts/ToastContext';
import { useConfirmDialog } from '../ui/ConfirmDialog';

// Mapeamento de cores por tipo de procedimento
const procedureColors: Record<string, { bg: string; border: string; text: string; icon: React.ElementType }> = {
  'harmonização': { bg: 'bg-gradient-to-br from-fuchsia-500 to-pink-600', border: 'border-fuchsia-400', text: 'text-white', icon: Sparkles },
  'botox': { bg: 'bg-gradient-to-br from-purple-500 to-violet-600', border: 'border-purple-400', text: 'text-white', icon: Syringe },
  'preenchimento': { bg: 'bg-gradient-to-br from-rose-500 to-red-600', border: 'border-rose-400', text: 'text-white', icon: Heart },
  'limpeza': { bg: 'bg-gradient-to-br from-cyan-500 to-teal-600', border: 'border-cyan-400', text: 'text-white', icon: Sparkles },
  'peeling': { bg: 'bg-gradient-to-br from-amber-500 to-orange-600', border: 'border-amber-400', text: 'text-white', icon: Star },
  'laser': { bg: 'bg-gradient-to-br from-red-500 to-rose-600', border: 'border-red-400', text: 'text-white', icon: Zap },
  'consulta': { bg: 'bg-gradient-to-br from-blue-500 to-indigo-600', border: 'border-blue-400', text: 'text-white', icon: Stethoscope },
  'avaliação': { bg: 'bg-gradient-to-br from-emerald-500 to-green-600', border: 'border-emerald-400', text: 'text-white', icon: Eye },
  'retorno': { bg: 'bg-gradient-to-br from-slate-500 to-gray-600', border: 'border-slate-400', text: 'text-white', icon: CalendarCheck },
  'cirurgia': { bg: 'bg-gradient-to-br from-red-600 to-rose-700', border: 'border-red-500', text: 'text-white', icon: Scissors },
  'default': { bg: 'bg-gradient-to-br from-indigo-500 to-purple-600', border: 'border-indigo-400', text: 'text-white', icon: CalendarIcon },
};

const getProcedureStyle = (serviceName: string) => {
  const lowerName = serviceName.toLowerCase();
  for (const [key, value] of Object.entries(procedureColors)) {
    if (key !== 'default' && lowerName.includes(key)) {
      return value;
    }
  }
  return procedureColors['default'];
};

const CalendarTab: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const { confirm } = useConfirmDialog();
  const location = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('day');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [hoveredAppt, setHoveredAppt] = useState<string | null>(null);
  
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

  // Ref para evitar chamadas duplicadas simultâneas
  const isLoadingRef = useRef(false);

  const loadData = async () => {
      if(!user) return;
      if (isLoadingRef.current) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CalendarTab.tsx:76',message:'loadData ignorado - já em execução',data:{userId:user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        return;
      }
      isLoadingRef.current = true;
      setIsLoading(true);
      const loadDataStart = Date.now();
      const start = new Date(currentDate);
      start.setDate(1);
      start.setMonth(currentDate.getMonth() - 1);
      const end = new Date(currentDate);
      end.setMonth(currentDate.getMonth() + 2);
      end.setDate(0);
      const dateRangeDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      try {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CalendarTab.tsx:73',message:'loadData iniciado',data:{userId:user.id,start:start.getTime(),end:end.getTime(),dateRangeDays},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        const apiCallStart = Date.now();
        const [appts, pats, stf] = await Promise.all([
          getAppointments(user.id, start.getTime(), end.getTime()), 
          getPatients(user.id), 
          getStaff(user.id)
        ]);
        const apiCallElapsed = Date.now() - apiCallStart;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CalendarTab.tsx:96',message:'Promise.all concluído',data:{apiCallElapsedMs:apiCallElapsed,apptsCount:appts?.length||0,patsCount:pats?.data?.length||0,stfCount:stf?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CalendarTab.tsx:88',message:'Dados recebidos de getAppointments',data:{apptsType:typeof appts,apptsIsArray:Array.isArray(appts),apptsLength:appts?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        // Garantir que appts seja sempre um array
        const appointmentsArray = Array.isArray(appts) ? appts : (appts?.data || []);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CalendarTab.tsx:91',message:'Antes de setAppointments',data:{appointmentsArrayIsArray:Array.isArray(appointmentsArray),appointmentsArrayLength:appointmentsArray.length},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        setAppointments(appointmentsArray);
        setPatients(pats?.data || []);
        setStaff(stf || []);
        const loadDataElapsed = Date.now() - loadDataStart;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CalendarTab.tsx:92',message:'loadData concluído com sucesso',data:{appointmentsSet:true,patientsSet:true,staffSet:true,loadDataElapsedMs:loadDataElapsed},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      } catch (error: any) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CalendarTab.tsx:95',message:'Erro em loadData',data:{errorMessage:error?.message,errorStack:error?.stack,errorStatus:error?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        console.error('Erro ao carregar dados:', error);
      } finally {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
  };

  useEffect(() => {
    if (!user?.id) return;
    
    // Adicionar flag para evitar múltiplas chamadas simultâneas
    let cancelled = false;
    
    const doLoad = async () => {
      if (cancelled) return;
      await loadData();
    };
    
    doLoad();
    
    return () => {
      cancelled = true;
    };
  }, [currentDate, user?.id]); // Usar user?.id ao invés de user

  // Abrir modal automaticamente quando receber appointmentId no state
  useEffect(() => {
    const appointmentId = (location.state as any)?.appointmentId;
    if (appointmentId && appointments.length > 0 && !isModalOpen) {
      const appt = appointments.find(a => a.id === appointmentId);
      if (appt) {
        // Ajustar a data atual para a data do agendamento
        const apptDate = new Date(appt.startTime);
        setCurrentDate(apptDate);
        // Abrir o modal após um pequeno delay para garantir que os dados foram carregados
        setTimeout(() => {
          openModal(appt);
        }, 100);
        // Limpar o state para evitar reabrir o modal
        window.history.replaceState({}, document.title);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments, location.state]);

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
      // #region agent log
      const isDarkMode = document.documentElement.classList.contains('dark');
      fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CalendarTab.tsx:173',message:'openModal - tema detectado',data:{isDarkMode,hasDarkClass:document.documentElement.classList.contains('dark'),themeFromLocalStorage:localStorage.getItem('theme')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
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
      // #region agent log
      setTimeout(() => {
        const modalElement = document.querySelector('form.bg-white');
        if (modalElement) {
          const computedStyle = window.getComputedStyle(modalElement);
          const labels = modalElement.querySelectorAll('label');
          const inputs = modalElement.querySelectorAll('input, select');
          const labelColors = Array.from(labels).map(l => {
            const style = window.getComputedStyle(l);
            return { text: l.textContent?.trim().substring(0, 20), color: style.color, bgColor: style.backgroundColor };
          });
          const inputColors = Array.from(inputs).map(i => {
            const style = window.getComputedStyle(i);
            return { placeholder: (i as HTMLInputElement).placeholder?.substring(0, 20), color: style.color, bgColor: style.backgroundColor };
          });
          fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CalendarTab.tsx:194',message:'openModal - cores computadas do modal',data:{isDarkMode,modalBg:computedStyle.backgroundColor,labelColors,inputColors},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        }
      }, 100);
      // #endregion
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!user) return;
    setIsSaving(true);
    try {
        let finalPatientId = formData.patientId;
        let finalPatientName = Array.isArray(patients) ? patients.find(p => p.id === formData.patientId)?.name || 'Paciente' : 'Paciente';
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
        if (editingAppt) {
            await updateAppointment(editingAppt.id, apptData);
            toast.success('Dados atualizados!', 3000);
        } else {
            await addAppointment(apptData);
            toast.success('Agendamento confirmado!', 3000);
        }
        setIsModalOpen(false);
        loadData();
    } finally { setIsSaving(false); }
  };

  const getStatusOverlay = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed': return { overlay: 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-900', badge: 'bg-emerald-500', badgeText: 'Confirmado' };
      case 'completed': return { overlay: 'opacity-60 grayscale', badge: 'bg-slate-600', badgeText: 'Concluído' };
      case 'canceled': return { overlay: 'opacity-40 line-through', badge: 'bg-rose-500', badgeText: 'Cancelado' };
      default: return { overlay: 'ring-2 ring-amber-400/50 ring-offset-1', badge: 'bg-amber-500', badgeText: 'Agendado' };
    }
  };

  const getAppointmentStyle = (appt: Appointment) => {
    const procedureStyle = getProcedureStyle(appt.serviceName);
    const statusStyle = getStatusOverlay(appt.status);
    return { procedureStyle, statusStyle };
  };

  // Mini-preview component para agendamentos
  const MiniPreview = ({ appt, visible }: { appt: Appointment; visible: boolean }) => {
    if (!visible) return null;
    const patient = Array.isArray(patients) ? patients.find(p => p.id === appt.patientId) : undefined;
    const staffMember = Array.isArray(staff) ? staff.find(s => s.id === appt.staffId) : undefined;
    const duration = Math.round((appt.endTime - appt.startTime) / 60000);
    const procedureStyle = getProcedureStyle(appt.serviceName);
    const ProcedureIcon = procedureStyle.icon;
    
    return (
      <div className="absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Header com cor do procedimento */}
          <div className={`${procedureStyle.bg} p-4 flex items-center gap-3`}>
            <div className="p-2 bg-white/20 rounded-xl">
              <ProcedureIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-black text-sm uppercase tracking-tight">{appt.serviceName}</p>
              <p className="text-white/70 text-[10px] font-bold">{duration} minutos</p>
            </div>
          </div>
          
          {/* Detalhes */}
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                <User className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 dark:text-white">{appt.patientName}</p>
                {patient?.phone && <p className="text-[10px] text-slate-400">{patient.phone}</p>}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                <Clock className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {new Date(appt.startTime).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})} - {new Date(appt.endTime).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
            </div>
            
            {staffMember && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{staffMember.name}</p>
                  <p className="text-[10px] text-slate-400">{staffMember.role}</p>
                </div>
              </div>
            )}
            
            {appt.notes && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                <p className="text-[10px] text-slate-500 italic line-clamp-2">{appt.notes}</p>
              </div>
            )}
          </div>
        </div>
        {/* Arrow */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-4 h-4 bg-white dark:bg-slate-800 rotate-45 border-r border-b border-slate-200 dark:border-slate-700"></div>
      </div>
    );
  };

  const renderDayView = () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CalendarTab.tsx:263',message:'renderDayView - antes de filter',data:{appointmentsType:typeof appointments,appointmentsIsArray:Array.isArray(appointments),appointmentsValue:appointments,appointmentsLength:appointments?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    const dayAppts = Array.isArray(appointments) ? appointments.filter(a => new Date(a.startTime).toDateString() === currentDate.toDateString()) : [];
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CalendarTab.tsx:264',message:'renderDayView - depois de filter',data:{dayApptsLength:dayAppts.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    const isToday = currentDate.toDateString() === new Date().toDateString();
    
    return (
      <div className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-500">
          <div className="bg-slate-50 dark:bg-slate-950 p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">{currentDate.toLocaleDateString('pt-BR', { weekday: 'long' })}</h3>
                    {isToday && <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-full animate-pulse">Hoje</span>}
                  </div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{dayAppts.length} atendimentos registrados</p>
              </div>
              <div className="flex gap-3">
                  <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 1)))} className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:scale-105 transition-transform"><ChevronLeft className="w-6 h-6"/></button>
                  <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 1)))} className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:scale-105 transition-transform"><ChevronRight className="w-6 h-6"/></button>
              </div>
          </div>
          
          {/* Empty State para dia sem agendamentos */}
          {dayAppts.length === 0 && !isLoading ? (
            <div className="py-8">
              <EmptyState 
                icon="calendar" 
                title={isToday ? "Agenda livre hoje" : "Sem agendamentos neste dia"}
                description={isToday 
                  ? "Você não possui atendimentos agendados para hoje. Aproveite para organizar sua semana ou agendar novos pacientes."
                  : `Nenhum atendimento marcado para ${currentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}. Clique para adicionar um novo agendamento.`
                }
                action={{ label: 'Agendar Atendimento', onClick: () => openModal(undefined, currentDate, 9) }}
              />
            </div>
          ) : (
          <div className="overflow-y-auto max-h-[800px] no-scrollbar">
              {hours.map(hour => (
                  <div key={hour} className="flex border-b border-slate-50 dark:border-slate-800/50 group min-h-[120px]">
                      <div className="w-28 py-10 px-6 text-right text-[10px] font-black text-slate-300 border-r border-slate-50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-950/30 uppercase tracking-tighter">{hour}:00</div>
                      <div className="flex-1 p-3 relative hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors cursor-pointer" onClick={() => openModal(undefined, currentDate, hour)}>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {dayAppts.filter(a => new Date(a.startTime).getHours() === hour).map(a => {
                                  const { procedureStyle, statusStyle } = getAppointmentStyle(a);
                                  const ProcedureIcon = procedureStyle.icon;
                                  
                                  return (
                                    <div 
                                      key={a.id} 
                                      className="relative"
                                      onMouseEnter={() => setHoveredAppt(a.id)}
                                      onMouseLeave={() => setHoveredAppt(null)}
                                    >
                                      <MiniPreview appt={a} visible={hoveredAppt === a.id} />
                                      <div 
                                        onClick={(e) => { e.stopPropagation(); openModal(a); }} 
                                        className={`p-5 rounded-[2rem] border-l-8 ${procedureStyle.border} shadow-xl transition-all hover:scale-[1.03] hover:shadow-2xl cursor-pointer flex flex-col justify-between ${procedureStyle.bg} ${procedureStyle.text} ${statusStyle.overlay}`}
                                      >
                                          <div>
                                              <div className="flex justify-between items-start mb-2">
                                                  <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-white/20 rounded-lg">
                                                      <ProcedureIcon className="w-3.5 h-3.5" />
                                                    </div>
                                                    <p className="font-black text-sm uppercase tracking-tight truncate max-w-[120px]">{a.patientName}</p>
                                                  </div>
                                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${statusStyle.badge}`}>{statusStyle.badgeText}</span>
                                              </div>
                                              <p className="text-[11px] font-bold opacity-90 truncate uppercase">{a.serviceName}</p>
                                              <p className="text-[10px] font-bold opacity-60 mt-1">{new Date(a.startTime).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})} - {new Date(a.endTime).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                                          </div>
                                          <div className="mt-4 pt-3 border-t border-white/20 flex items-center gap-2">
                                              <div className="w-6 h-6 rounded-xl bg-white/20 flex items-center justify-center"><User className="w-3.5 h-3.5" /></div>
                                              <span className="text-[10px] font-black uppercase opacity-80">{Array.isArray(staff) ? staff.find(s => s.id === a.staffId)?.name.split(' ')[0] || 'Profissional' : 'Profissional'}</span>
                                          </div>
                                      </div>
                                    </div>
                                  );
                              })}
                          </div>
                      </div>
                  </div>
              ))}
          </div>
          )}
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
          const dayAppts = Array.isArray(appointments) ? appointments.filter(a => new Date(a.startTime).toDateString() === day.toDateString()) : [];
          const isToday = day.toDateString() === new Date().toDateString();
          return (
            <div key={day.toISOString()} className={`bg-white dark:bg-slate-900 rounded-[2.5rem] border ${isToday ? 'border-indigo-500 shadow-xl ring-4 ring-indigo-500/10' : 'border-slate-200 dark:border-slate-800'} overflow-hidden flex flex-col min-h-[500px]`}>
              <div className={`p-6 text-center border-b ${isToday ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white' : 'bg-slate-50 dark:bg-slate-950 text-slate-500'}`}>
                <p className="text-[10px] font-black uppercase tracking-widest">{day.toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
                <h4 className={`text-2xl font-black tracking-tighter ${isToday ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{day.getDate()}</h4>
                {isToday && <span className="inline-block mt-1 px-2 py-0.5 bg-white/20 text-[8px] font-black uppercase rounded-full">Hoje</span>}
              </div>
              <div className="flex-1 p-3 space-y-3 overflow-y-auto no-scrollbar bg-slate-50/30 dark:bg-slate-950/30">
                {dayAppts.map(a => {
                  const { procedureStyle, statusStyle } = getAppointmentStyle(a);
                  const ProcedureIcon = procedureStyle.icon;
                  
                  return (
                    <div 
                      key={a.id} 
                      className="relative group"
                      onMouseEnter={() => setHoveredAppt(a.id)}
                      onMouseLeave={() => setHoveredAppt(null)}
                    >
                      <MiniPreview appt={a} visible={hoveredAppt === a.id} />
                      <div 
                        onClick={() => openModal(a)} 
                        className={`p-4 rounded-3xl border-l-4 ${procedureStyle.border} shadow-sm cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all ${procedureStyle.bg} ${procedureStyle.text} ${statusStyle.overlay}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <ProcedureIcon className="w-3 h-3 opacity-80" />
                          <p className="text-[11px] font-black uppercase truncate leading-none">{a.patientName}</p>
                        </div>
                        <p className="text-[9px] font-bold opacity-70 uppercase truncate">{a.serviceName}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-[9px] font-bold opacity-60">{new Date(a.startTime).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                          <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full ${statusStyle.badge}`}>{statusStyle.badgeText}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
            const dayAppts = Array.isArray(appointments) ? appointments.filter(a => new Date(a.startTime).toDateString() === day.toDateString()) : [];
            const isToday = day.toDateString() === new Date().toDateString();
            
            // Agrupar por tipo de procedimento para mostrar cores
            const procedureGroups = dayAppts.reduce((acc, appt) => {
              const style = getProcedureStyle(appt.serviceName);
              const key = appt.serviceName.toLowerCase().split(' ')[0];
              if (!acc[key]) acc[key] = { count: 0, style };
              acc[key].count++;
              return acc;
            }, {} as Record<string, { count: number; style: typeof procedureColors['default'] }>);
            
            return (
              <div key={day.toISOString()} onClick={() => { setCurrentDate(day); setView('day'); }} className={`p-4 border-r border-b border-slate-50 dark:border-slate-800/50 group hover:bg-indigo-50/30 dark:hover:bg-indigo-900/5 transition-all cursor-pointer relative ${isToday ? 'bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/10 dark:to-purple-900/10 ring-2 ring-indigo-500/20 ring-inset' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-sm font-black p-1.5 rounded-lg leading-none ${isToday ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'}`}>{day.getDate()}</span>
                  {dayAppts.length > 0 && <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full shadow-sm">{dayAppts.length}</span>}
                </div>
                
                {/* Mini indicadores de procedimentos */}
                <div className="space-y-1 mt-1">
                  {Object.entries(procedureGroups).slice(0, 3).map(([key, { count, style }]) => {
                    const Icon = style.icon;
                    return (
                      <div key={key} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${style.bg} opacity-90`}>
                        <Icon className="w-2.5 h-2.5 text-white" />
                        <span className="text-[8px] font-bold text-white truncate capitalize">{key}</span>
                        {count > 1 && <span className="text-[7px] font-black text-white/70 ml-auto">x{count}</span>}
                      </div>
                    );
                  })}
                  {Object.keys(procedureGroups).length > 3 && (
                    <p className="text-[8px] font-bold text-slate-400 text-center">+{Object.keys(procedureGroups).length - 3} mais</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const isCurrentDateToday = currentDate.toDateString() === new Date().toDateString();

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-500">
      <div className="flex flex-col gap-6">
          {/* Primeira linha: Data + Status "Você está em Hoje" */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
            <button onClick={() => setIsDatePickerOpen(!isDatePickerOpen)} className="group flex items-center gap-6 bg-white dark:bg-slate-900 px-10 py-6 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:ring-8 hover:ring-indigo-500/5 transition-all flex-1 sm:flex-none">
                <div className="p-4 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl shadow-2xl shadow-indigo-500/30"><CalendarIcon className="w-8 h-8" /></div>
                <div className="text-left flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Data Ativa</p>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">{currentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</h2>
                </div>
            </button>
            
            {/* Botão IR PARA HOJE - Destacado */}
            {!isCurrentDateToday && (
              <button 
                onClick={goToToday}
                className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 text-white px-8 py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.15em] shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 animate-pulse hover:animate-none"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <CalendarCheck className="w-6 h-6" />
                <span className="hidden sm:inline">Ir para Hoje</span>
                <span className="sm:hidden">Hoje</span>
              </button>
            )}
            
            {isCurrentDateToday && (
              <div className="flex items-center gap-2 px-6 py-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-200 dark:border-emerald-800 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-wider whitespace-nowrap">Você está em Hoje</span>
              </div>
            )}
          </div>
          
          {/* Segunda linha: Botões de visualização + Reservar Horário */}
          <div className="flex flex-wrap gap-4 w-full items-center justify-between">
              <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-[2.5rem] flex gap-2 shadow-inner">{['month', 'week', 'day'].map((v) => (<button key={v} onClick={() => setView(v as any)} className={`px-10 py-5 rounded-[2.2rem] text-[11px] font-black uppercase tracking-widest transition-all ${view === v ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>{v === 'month' ? 'Mês' : v === 'week' ? 'Semana' : 'Dia'}</button>))}</div>
              <button onClick={() => openModal()} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-12 py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-4 hover:opacity-90 transition-all"><Plus className="w-6 h-6" /> Reservar Horário</button>
          </div>
      </div>

      <div className="relative">
          {isLoading ? (
              <SkeletonCalendar view={view} />
          ) : (
              <>
                  {view === 'day' && renderDayView()}
                  {view === 'week' && renderWeekView()}
                  {view === 'month' && renderMonthView()}
              </>
          )}
      </div>

      {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-lg">
              <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[4rem] shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden border border-white/10 animate-in zoom-in-95 duration-300">
                  {/* #region agent log */}
                  {(() => {
                    const isDarkMode = document.documentElement.classList.contains('dark');
                    fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CalendarTab.tsx:581',message:'Modal renderizado - tema atual',data:{isDarkMode,formClasses:'bg-white dark:bg-slate-900'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                    return null;
                  })()}
                  {/* #endregion */}
                  <div className="p-12 border-b bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center shrink-0">
                      <div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none">{editingAppt ? 'Editar Horário' : 'Novo Agendamento'}</h3>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">Detalhamento de Fluxo Clínico</p>
                      </div>
                      <button type="button" onClick={() => setIsModalOpen(false)} className="p-4 bg-white dark:bg-slate-700 rounded-full text-slate-400 dark:text-slate-300 shadow-sm hover:scale-110 transition-transform"><X className="w-8 h-8"/></button>
                  </div>
                  
                  <div className="p-12 space-y-10 overflow-y-auto no-scrollbar">
                      <div className="space-y-6">
                          <div className="flex justify-between items-end px-1">
                            <label className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Paciente</label>
                            <button type="button" onClick={() => setIsNewPatient(!isNewPatient)} className={`flex items-center gap-2 text-[10px] font-black uppercase transition-all px-5 py-2.5 rounded-full border ${isNewPatient ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50'}`}><UserPlus className="w-3.5 h-3.5" /> {isNewPatient ? 'Selecionar Base' : 'Novo Cadastro'}</button>
                          </div>

                          {isNewPatient ? (
                              <div className="space-y-6 bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <input type="text" required placeholder="Nome Completo" className="md:col-span-2 bg-white dark:bg-slate-800 border-none rounded-2xl py-4 px-6 font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-4 focus:ring-indigo-500/10" value={newPatientFormData.name} onChange={e => setNewPatientFormData({...newPatientFormData, name: e.target.value})} />
                                  <input type="tel" required placeholder="WhatsApp" className="bg-white dark:bg-slate-800 border-none rounded-2xl py-4 px-6 font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-4 focus:ring-indigo-500/10" value={newPatientFormData.phone} onChange={e => setNewPatientFormData({...newPatientFormData, phone: formatPhone(e.target.value)})} />
                                  <div className="relative">
                                      <input type="text" placeholder="CEP" className="w-full bg-white dark:bg-slate-800 border-none rounded-2xl py-4 px-6 font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-4 focus:ring-indigo-500/10" value={newPatientFormData.cep} onChange={e => { setNewPatientFormData({...newPatientFormData, cep: e.target.value}); handleCepSearch(e.target.value); }} />
                                      {isSearchingCep && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-indigo-500" />}
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                   <div className="relative"><Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 dark:text-slate-400" /><input type="text" placeholder="Altura (cm)" className="w-full bg-white dark:bg-slate-800 border-none rounded-2xl py-3 pl-8 pr-4 font-bold text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" value={newPatientFormData.height} onChange={e => setNewPatientFormData({...newPatientFormData, height: e.target.value})} /></div>
                                   <div className="relative"><Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 dark:text-slate-400" /><input type="text" placeholder="Peso (kg)" className="w-full bg-white dark:bg-slate-800 border-none rounded-2xl py-3 pl-8 pr-4 font-bold text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" value={newPatientFormData.weight} onChange={e => setNewPatientFormData({...newPatientFormData, weight: e.target.value})} /></div>
                                </div>
                                <input type="text" placeholder="Logradouro" className="w-full bg-white dark:bg-slate-800 border-none rounded-2xl py-4 px-6 font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-4 focus:ring-indigo-500/10 text-xs" value={newPatientFormData.address_street} onChange={e => setNewPatientFormData({...newPatientFormData, address_street: e.target.value})} />
                              </div>
                          ) : (
                            <select required className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[2rem] py-6 px-8 font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 appearance-none text-lg" value={formData.patientId} onChange={e => setFormData({...formData, patientId: e.target.value})}>
                               <option value="" className="text-slate-500">Buscar paciente base...</option>
                               {Array.isArray(patients) ? patients.map(p => <option key={p.id} value={p.id} className="text-slate-900 dark:text-white">{p.name} • {p.phone}</option>) : null}
                            </select>
                          )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                              <label className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest block mb-2">Responsável Técnico</label>
                              <select required className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[1.5rem] py-4 px-6 font-bold text-slate-900 dark:text-white" value={formData.staffId} onChange={e => setFormData({...formData, staffId: e.target.value})}>
                                  <option value="" className="text-slate-500">Selecione Profissional...</option>
                                  {Array.isArray(staff) ? staff.map(s => <option key={s.id} value={s.id} className="text-slate-900 dark:text-white">{s.name} ({s.role})</option>) : null}
                              </select>
                          </div>
                          <div>
                              <label className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest block mb-2">Procedimento</label>
                              <input type="text" placeholder="Ex: Harmonização Facial" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[1.5rem] py-4 px-6 font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" value={formData.serviceName} onChange={e => setFormData({...formData, serviceName: e.target.value})} />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            <div><label className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest block mb-2">Data</label><input type="date" required className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-5 font-bold text-slate-900 dark:text-white" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
                            <div><label className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest block mb-2">Início</label><input type="time" required className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-5 font-bold text-slate-900 dark:text-white" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} /></div>
                            <div className="col-span-2 md:col-span-1"><label className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest block mb-2">Duração (min)</label><input type="number" required step="15" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-5 font-bold text-slate-900 dark:text-white" value={formData.duration} onChange={e => setFormData({...formData, duration: Number(e.target.value)})} /></div>
                      </div>
                  </div>

                  <div className="p-12 border-t bg-slate-50 dark:bg-slate-800/50 flex flex-col md:flex-row gap-4 shrink-0">
                      {editingAppt && <button type="button" onClick={async () => { 
                          const confirmed = await confirm({
                              title: 'Excluir Agendamento',
                              message: 'Deseja excluir este agendamento?',
                              confirmText: 'Excluir',
                              cancelText: 'Cancelar',
                              variant: 'danger'
                          });
                          if(confirmed) { 
                              await deleteAppointment(editingAppt.id); 
                              toast.success('Item excluído!', 3000);
                              setIsModalOpen(false); 
                              loadData(); 
                          } 
                      }} className="px-10 py-6 text-rose-600 font-black uppercase text-[11px] tracking-[0.2em] hover:bg-rose-50 rounded-3xl transition-colors">Excluir</button>}
                      <button type="submit" disabled={isSaving} className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-7 rounded-[2.5rem] font-black uppercase tracking-[0.3em] shadow-2xl flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 text-xs">{isSaving ? <Loader2 className="w-8 h-8 animate-spin" /> : <><CheckCircle2 className="w-8 h-8" /> Confirmar Agenda</>}</button>
                  </div>
              </form>
          </div>
      )}
    </div>
  );
};

export default CalendarTab;