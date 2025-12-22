
import React, { useState, useEffect, useRef } from 'react';
import { ChatContact, ChatMessage, Patient } from '../../types';
import { getPatients, saveMessageToHistory, getStoredMessages, getChatThreads, updateThreadStage } from '../../services/supabaseService';
import { 
  fetchEvolutionMessages, sendEvolutionMessage, getEvolutionStatus, getEvolutionQrCode, 
  logoutEvolutionInstance, fetchEvolutionChats
} from '../../services/evolutionService';
import { 
  Search, Send, Smartphone, Wifi, WifiOff, Loader2, AlertCircle, Trash2,
  UserCheck, History, X, ArrowRight, CheckCheck, LayoutGrid, MessageSquare,
  ChevronRight, Filter, Star, Clock, MoreHorizontal, UserPlus, Zap
} from 'lucide-react';

const STAGES = [
    { id: 'lead', name: 'Triagem / Novo', color: 'bg-blue-500', border: 'border-blue-200' },
    { id: 'contact', name: 'Em Contato', color: 'bg-amber-500', border: 'border-amber-200' },
    { id: 'quote', name: 'Orçamento Enviado', color: 'bg-indigo-500', border: 'border-indigo-200' },
    { id: 'scheduled', name: 'Agendado', color: 'bg-emerald-500', border: 'border-emerald-200' },
    { id: 'lost', name: 'Perdido / Pausado', color: 'bg-rose-500', border: 'border-rose-200' }
];

const ConnectionStatus = ({ status }: { status: string }) => {
  const styles = {
    connected: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100",
    connecting: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-100",
    disconnected: "text-rose-600 bg-rose-50 dark:bg-rose-900/20 border-rose-100"
  };
  const currentStyle = styles[status as keyof typeof styles] || styles.disconnected;

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${currentStyle}`}>
      {status === 'connected' ? <Wifi className="w-3.5 h-3.5" /> : status === 'connecting' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <WifiOff className="w-3.5 h-3.5" />}
      {status === 'connected' ? 'WhatsApp Ativo' : 'WhatsApp Offline'}
    </div>
  );
};

const CRMTab: React.FC<{ user: any }> = ({ user }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [threads, setThreads] = useState<any[]>([]); 
  const [viewMode, setViewMode] = useState<'chat' | 'pipeline'>('chat');
  const [sidebarTab, setSidebarTab] = useState<'whatsapp' | 'patients'>('whatsapp');
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('checking');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<any>(null);

  const loadData = async () => {
    if (!user) return;
    const status = await getEvolutionStatus();
    setConnectionStatus(status);
    
    const pats = await getPatients(user.id);
    setPatients(pats);

    const dbThreads = await getChatThreads(user.id);
    setThreads(dbThreads);

    if (status !== 'connected' && viewMode === 'chat') fetchQr();
  };

  const fetchQr = async () => {
    const res = await getEvolutionQrCode();
    if (res.code === 'CONNECTED_ALREADY') setConnectionStatus('connected');
    else setQrCode(res.code);
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 20000);
    return () => clearInterval(timer);
  }, [user, viewMode]);

  useEffect(() => {
    if (selectedContact && connectionStatus === 'connected') {
      const loadMsgs = async () => {
          if (!selectedContact) return;
          const evMsgs = await fetchEvolutionMessages(selectedContact.phone);
          const dbMsgs = await getStoredMessages(selectedContact.id);
          
          const combined = [...evMsgs];
          dbMsgs.forEach(dbm => {
              if(!combined.find(evm => evm.id === dbm.id)) combined.push(dbm);
          });
          
          setMessages(combined.sort((a,b) => a.timestamp - b.timestamp));
          
          evMsgs.forEach(m => {
              if (m.direction === 'inbound') saveMessageToHistory(m, user.id, selectedContact);
          });
      };
      
      setIsLoadingMessages(true);
      loadMsgs().finally(() => setIsLoadingMessages(false));
      
      if(pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = setInterval(loadMsgs, 8000);
    }
    return () => { if(pollingRef.current) clearInterval(pollingRef.current); };
  }, [selectedContact, connectionStatus]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedContact || isSending || !user) return;
    
    const textToSend = inputText;
    setInputText('');
    setIsSending(true);

    const optimisticMsg: ChatMessage = {
        id: 'opt-' + Date.now(),
        patientId: selectedContact.id,
        direction: 'outbound',
        content: textToSend,
        timestamp: Date.now(),
        status: 'sent'
    };
    setMessages(prev => [...prev, optimisticMsg]);

    const result = await sendEvolutionMessage(selectedContact.phone, textToSend);
    if (result) {
        await saveMessageToHistory(optimisticMsg, user.id, selectedContact);
        loadData(); 
    } else {
        alert("Falha no WhatsApp. Verifique conexão.");
        setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
    }
    setIsSending(false);
  };

  const handleChangeStage = async (jid: string, newStage: string) => {
      // Atualização otimista na UI
      setThreads(prev => prev.map(t => t.id === jid ? { ...t, crm_stage: newStage } : t));
      const success = await updateThreadStage(jid, newStage);
      if (!success) loadData(); // Reverte se falhar no banco
  };

  const onDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData("threadId", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("threadId");
    if (id) {
        await handleChangeStage(id, stageId);
        setDraggedId(null);
    }
  };

  const activeChatList: ChatContact[] = sidebarTab === 'whatsapp' 
    ? threads.map(t => ({
        id: t.id, clinicId: user?.id || '', name: t.contact_name, phone: t.id.split('@')[0],
        lastMessage: t.last_message, unreadCount: t.unread_count || 0, avatarUrl: t.avatar_url,
        crmStatus: t.crm_stage
    }))
    : patients.map(p => ({
        id: p.phone.replace(/\D/g, '') + '@s.whatsapp.net', clinicId: user?.id || '', name: p.name, phone: p.phone,
        lastMessage: 'Paciente da Base', unreadCount: 0, avatarUrl: p.avatarUrl
    }));

  const filtered = activeChatList.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (viewMode === 'pipeline') {
      return (
          <div className="h-[calc(100vh-140px)] flex flex-col animate-in fade-in">
              <div className="bg-white dark:bg-slate-950 px-10 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                  <div>
                      <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">Pipeline de Oportunidades</h2>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Arraste os cards para mudar de fase</p>
                  </div>
                  <button onClick={() => setViewMode('chat')} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg hover:scale-105 transition-all"><MessageSquare className="w-4 h-4"/> Voltar ao Chat</button>
              </div>

              <div className="flex-1 overflow-x-auto p-10 flex gap-6 bg-slate-50 dark:bg-slate-900 no-scrollbar">
                  {STAGES.map(stage => (
                      <div 
                        key={stage.id} 
                        className="min-w-[320px] w-[320px] flex flex-col gap-4"
                        onDragOver={onDragOver}
                        onDrop={(e) => onDrop(e, stage.id)}
                      >
                          <div className="flex items-center justify-between px-2">
                             <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${stage.color}`}></div>
                                <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-500">{stage.name}</h3>
                             </div>
                             <span className="text-[10px] font-black bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">
                                 {threads.filter(t => (t.crm_stage || 'lead') === stage.id).length}
                             </span>
                          </div>
                          
                          <div className={`flex-1 space-y-4 overflow-y-auto no-scrollbar pb-10 rounded-3xl transition-colors ${draggedId ? 'bg-slate-100/50 dark:bg-slate-800/20 border-2 border-dashed border-slate-200 dark:border-slate-700' : ''}`}>
                              {threads.filter(t => (t.crm_stage || 'lead') === stage.id).map(t => (
                                  <div 
                                    key={t.id} 
                                    draggable
                                    onDragStart={(e) => onDragStart(e, t.id)}
                                    onClick={() => { setSelectedContact({ id: t.id, name: t.contact_name, phone: t.id.split('@')[0], lastMessage: t.last_message, unreadCount: 0, clinicId: user.id }); setViewMode('chat'); }} 
                                    className={`bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/50 hover:shadow-xl hover:scale-[1.02] transition-all cursor-grab active:cursor-grabbing group ${draggedId === t.id ? 'opacity-40 grayscale' : ''}`}
                                  >
                                      <div className="flex items-center gap-3 mb-4">
                                          <img src={t.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.contact_name)}&background=random`} className="w-10 h-10 rounded-2xl shadow-sm" />
                                          <div className="min-w-0">
                                              <p className="font-black text-slate-900 dark:text-white text-sm truncate">{t.contact_name}</p>
                                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{t.id.split('@')[0]}</p>
                                          </div>
                                      </div>
                                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 italic mb-4">"{t.last_message}"</p>
                                      <div className="flex justify-between items-center pt-4 border-t border-slate-50 dark:border-slate-700">
                                          <div className="flex items-center gap-1.5 text-slate-300">
                                              <Clock className="w-3 h-3" />
                                              <span className="text-[9px] font-bold uppercase">{new Date(t.last_timestamp).toLocaleDateString()}</span>
                                          </div>
                                          <button className="p-2 bg-slate-50 dark:bg-slate-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight className="w-4 h-4 text-indigo-500"/></button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      );
  }

  return (
    <div className="h-[calc(100vh-140px)] bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-in fade-in">
       {/* HEADER CRM */}
       <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 px-10 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg"><Zap className="w-5 h-5" /></div>
              <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">WhatsApp Hub CRM</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Central de Comunicação Otimizada</p>
              </div>
          </div>
          <div className="flex items-center gap-4">
              <button onClick={() => setViewMode('pipeline')} className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:scale-[1.02] transition-all shadow-md">
                <LayoutGrid className="w-3.5 h-3.5" /> Pipeline Oportunidades
              </button>
              <ConnectionStatus status={connectionStatus} />
          </div>
       </div>

       <div className="flex-1 flex overflow-hidden">
          {/* SIDEBAR */}
          <div className={`w-full md:w-96 border-r border-slate-100 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900 ${selectedContact ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 flex bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 gap-2 shrink-0">
                <button onClick={() => setSidebarTab('whatsapp')} className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sidebarTab === 'whatsapp' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}><History className="w-3.5 h-3.5" /> Conversas</button>
                <button onClick={() => setSidebarTab('patients')} className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sidebarTab === 'patients' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}><UserPlus className="w-3.5 h-3.5" /> Base Ativa</button>
            </div>
            <div className="p-6 shrink-0">
              <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                 <input type="text" placeholder="Buscar no CRM..." className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-black uppercase tracking-widest shadow-inner" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar">
               {filtered.length === 0 ? (
                   <div className="p-20 text-center text-slate-300 font-black text-[10px] uppercase italic tracking-widest">Sem conversas</div>
               ) : filtered.map(contact => {
                 const stage = STAGES.find(s => s.id === contact.crmStatus) || STAGES[0];
                 return (
                   <div key={contact.id} onClick={() => setSelectedContact(contact)} className={`flex items-center gap-4 p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer border-b border-slate-50 dark:border-slate-800/30 transition-all ${selectedContact?.id === contact.id ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-l-4 border-l-indigo-600' : 'border-l-4 border-l-transparent'}`}>
                      <div className="relative shrink-0">
                          <img src={contact.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=random`} className="w-12 h-12 rounded-2xl shadow-md border-2 border-white dark:border-slate-700" alt="" />
                          {contact.unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 animate-bounce">{contact.unreadCount}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-start mb-1">
                             <h3 className="font-black text-slate-900 dark:text-white truncate text-sm tracking-tight leading-none">{contact.name}</h3>
                             <span className={`text-[7px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded text-white ${stage.color}`}>{stage.id}</span>
                         </div>
                         <p className="text-[10px] text-slate-400 font-bold italic truncate">{contact.lastMessage || 'Clique para iniciar'}</p>
                      </div>
                   </div>
                 );
               })}
            </div>
          </div>

          {/* CHAT VIEW */}
          {selectedContact ? (
            <div className="flex-1 flex flex-col bg-[#efeae2] dark:bg-[#0b141a] relative h-full">
               <div className="p-4 px-8 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm z-10 shrink-0">
                  <div className="flex items-center gap-5">
                     <button onClick={() => setSelectedContact(null)} className="md:hidden p-2 bg-slate-100 dark:bg-slate-700 rounded-xl"><ArrowRight className="w-5 h-5 rotate-180" /></button>
                     <img src={selectedContact.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedContact.name)}&background=random`} className="w-12 h-12 rounded-2xl shadow-sm" alt="" />
                     <div>
                        <h3 className="font-black text-slate-900 dark:text-white text-base leading-none mb-1.5 tracking-tighter italic">{selectedContact.name}</h3>
                        <div className="flex items-center gap-3">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{selectedContact.phone}</span>
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <p className="text-[8px] font-black text-slate-400 uppercase px-2">Mover para:</p>
                      {STAGES.map(s => {
                          const isActive = selectedContact.crmStatus === s.id;
                          return (
                              <button 
                                key={s.id} 
                                onClick={() => { handleChangeStage(selectedContact.id, s.id); setSelectedContact({...selectedContact, crmStatus: s.id as any}) }}
                                title={s.name}
                                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isActive ? `${s.color} text-white shadow-lg scale-110` : 'bg-white dark:bg-slate-800 text-slate-300 hover:bg-slate-100'}`}
                              >
                                {s.id === 'lead' ? <Star className="w-3.5 h-3.5"/> : s.id === 'contact' ? <Clock className="w-3.5 h-3.5"/> : s.id === 'quote' ? <Zap className="w-3.5 h-3.5"/> : s.id === 'scheduled' ? <UserCheck className="w-3.5 h-3.5"/> : <X className="w-3.5 h-3.5"/>}
                              </button>
                          )
                      })}
                  </div>
               </div>
               
               <div className="flex-1 overflow-y-auto p-10 space-y-6 relative custom-scrollbar">
                  {isLoadingMessages && <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/20 backdrop-blur-[1px]"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>}
                  {messages.map((msg, i) => (
                      <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                          <div className={`max-w-[70%] rounded-[2rem] px-7 py-4 text-sm shadow-xl ${msg.direction === 'outbound' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-none font-bold'}`}>
                              <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                              <div className="flex justify-end items-center gap-2 mt-2 opacity-60">
                                  <span className="text-[9px] font-black">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  {msg.direction === 'outbound' && <CheckCheck className="w-3.5 h-3.5" />}
                              </div>
                          </div>
                      </div>
                  ))}
                  <div ref={messagesEndRef} />
               </div>

               <div className="p-8 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shrink-0">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-5">
                     <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] px-8 py-3 border border-slate-100 dark:border-slate-700 shadow-inner">
                        <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage(e)} placeholder="Envie uma mensagem via WhatsApp..." className="w-full bg-transparent border-none focus:ring-0 resize-none py-3 text-sm font-bold text-slate-900 dark:text-white" rows={1} />
                     </div>
                     <button type="submit" disabled={!inputText.trim() || isSending || connectionStatus !== 'connected'} className="bg-slate-900 dark:bg-white p-6 rounded-full text-white dark:text-slate-900 shadow-2xl active:scale-90 transition-all disabled:opacity-30">
                         {isSending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                     </button>
                  </form>
               </div>
            </div>
          ) : (
            <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 p-20 text-center">
               <div className="p-12 bg-white dark:bg-slate-800 rounded-[4rem] shadow-2xl border border-white/10 flex flex-col items-center max-w-sm">
                  <Zap className="w-20 h-20 text-indigo-500 mb-8 animate-pulse" />
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Motor CRM Ativo</h2>
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-6 leading-relaxed">
                    Sincronização em tempo real com Evolution API. <br/>Acompanhe e mova leads no <strong>Pipeline</strong>.
                  </p>
               </div>
            </div>
          )}
       </div>
    </div>
  );
};

export default CRMTab;
