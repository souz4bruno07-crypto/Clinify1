
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChatContact, ChatMessage, Patient } from '../../types';
import { getPatients, saveMessageToHistory, getStoredMessages, getChatThreads, updateThreadStage } from '../../services/backendService';
import { 
  fetchEvolutionMessages, sendEvolutionMessage, getEvolutionStatus, getEvolutionQrCode, 
  logoutEvolutionInstance, fetchEvolutionChats, createEvolutionInstance, 
  saveEvolutionConfigToBackend, listEvolutionInstances
} from '../../services/evolutionService';
import { 
  Search, Send, Smartphone, Wifi, WifiOff, Loader2, AlertCircle, Trash2,
  UserCheck, History, X, ArrowRight, CheckCheck, LayoutGrid, MessageSquare,
  ChevronRight, Filter, Star, Clock, MoreHorizontal, UserPlus, Zap, TrendingUp,
  Calendar, FileText, Sparkles, Heart, Gift, Bell, ThumbsUp, HelpCircle, Target,
  QrCode, Settings, Plus
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import EmptyState from '../ui/EmptyState';

const STAGES = [
    { id: 'lead', name: 'Triagem / Novo', color: 'bg-blue-500', border: 'border-blue-200', lightBg: 'bg-blue-50', textColor: 'text-blue-600' },
    { id: 'contact', name: 'Em Contato', color: 'bg-amber-500', border: 'border-amber-200', lightBg: 'bg-amber-50', textColor: 'text-amber-600' },
    { id: 'quote', name: 'Orçamento Enviado', color: 'bg-indigo-500', border: 'border-indigo-200', lightBg: 'bg-indigo-50', textColor: 'text-indigo-600' },
    { id: 'scheduled', name: 'Agendado', color: 'bg-emerald-500', border: 'border-emerald-200', lightBg: 'bg-emerald-50', textColor: 'text-emerald-600' },
    { id: 'lost', name: 'Perdido / Pausado', color: 'bg-rose-500', border: 'border-rose-200', lightBg: 'bg-rose-50', textColor: 'text-rose-600' }
];

// Templates de mensagens pré-definidas
const MESSAGE_TEMPLATES = [
    { 
      id: 'greeting', 
      label: 'Saudação', 
      icon: Sparkles, 
      color: 'bg-purple-500',
      message: 'Olá! Tudo bem? 😊\n\nSou da equipe da clínica. Como posso ajudá-lo(a) hoje?'
    },
    { 
      id: 'schedule', 
      label: 'Agendar', 
      icon: Calendar, 
      color: 'bg-emerald-500',
      message: 'Gostaria de agendar uma avaliação? 📅\n\nTemos horários disponíveis essa semana. Qual o melhor dia e período para você?'
    },
    { 
      id: 'quote', 
      label: 'Orçamento', 
      icon: FileText, 
      color: 'bg-blue-500',
      message: 'Preparei um orçamento especial para você! 💜\n\nPosso enviar por aqui os detalhes do planejamento?'
    },
    { 
      id: 'confirm', 
      label: 'Confirmar', 
      icon: ThumbsUp, 
      color: 'bg-indigo-500',
      message: 'Confirmo seu agendamento! ✅\n\n📅 Data: [DATA]\n⏰ Horário: [HORÁRIO]\n\nCaso precise remarcar, avise com antecedência. Aguardamos você!'
    },
    { 
      id: 'reminder', 
      label: 'Lembrete', 
      icon: Bell, 
      color: 'bg-amber-500',
      message: 'Olá! 👋\n\nPassando para lembrar do seu agendamento amanhã. Nos vemos em breve! 😊'
    },
    { 
      id: 'thanks', 
      label: 'Agradecer', 
      icon: Heart, 
      color: 'bg-rose-500',
      message: 'Muito obrigado(a) pela confiança! 💜\n\nFoi um prazer atendê-lo(a). Qualquer dúvida, estou à disposição!'
    },
    { 
      id: 'promo', 
      label: 'Promoção', 
      icon: Gift, 
      color: 'bg-fuchsia-500',
      message: '🎉 Temos uma condição especial para você!\n\nEntre em contato para saber mais sobre nossa promoção do mês.'
    },
    { 
      id: 'followup', 
      label: 'Retorno', 
      icon: HelpCircle, 
      color: 'bg-cyan-500',
      message: 'Olá! Tudo bem? 😊\n\nEstou passando para saber se conseguiu pensar sobre nosso orçamento. Posso ajudar com alguma dúvida?'
    },
];

const ConnectionStatus = ({ status }: { status: string }) => {
  const prefersReducedMotion = useReducedMotion();
  const styles = {
    connected: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100",
    connecting: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-100",
    disconnected: "text-rose-600 bg-rose-50 dark:bg-rose-900/20 border-rose-100"
  };
  const currentStyle = styles[status as keyof typeof styles] || styles.disconnected;

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${currentStyle}`}>
      {status === 'connected' ? <Wifi className="w-3.5 h-3.5" /> : status === 'connecting' ? <Loader2 className={`w-3.5 h-3.5 ${prefersReducedMotion ? '' : 'animate-spin'}`} /> : <WifiOff className="w-3.5 h-3.5" />}
      {status === 'connected' ? 'WhatsApp Ativo' : 'WhatsApp Offline'}
    </div>
  );
};

const CRMTab: React.FC<{ user: any }> = ({ user }) => {
  const toast = useToast();
  const prefersReducedMotion = useReducedMotion();
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
  const [showTemplates, setShowTemplates] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [isCreatingInstance, setIsCreatingInstance] = useState(false);
  const [instanceName, setInstanceName] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [needsConfig, setNeedsConfig] = useState(false);

  // Métricas de conversão calculadas
  const metrics = useMemo(() => {
    const leads = threads.filter(t => (t.crm_stage || 'lead') === 'lead').length;
    const inContact = threads.filter(t => t.crm_stage === 'contact').length;
    const quoted = threads.filter(t => t.crm_stage === 'quote').length;
    const scheduled = threads.filter(t => t.crm_stage === 'scheduled').length;
    const lost = threads.filter(t => t.crm_stage === 'lost').length;
    const total = threads.length;

    const conversionRate = total > 0 ? ((scheduled / total) * 100).toFixed(1) : '0';
    const quoteToSchedule = quoted + scheduled > 0 ? ((scheduled / (quoted + scheduled)) * 100).toFixed(1) : '0';

    return { leads, inContact, quoted, scheduled, lost, total, conversionRate, quoteToSchedule };
  }, [threads]);

  const loadData = async () => {
    if (!user) return;
    const status = await getEvolutionStatus();
    setConnectionStatus(status);
    
    const pats = await getPatients(user.id);
    setPatients(pats.data || []);

    const dbThreads = await getChatThreads(user.id);
    setThreads(dbThreads);

    // Verificar se precisa de configuração
    if (status === 'offline' || status === 'disconnected') {
      try {
        const config = await listEvolutionInstances();
        if (!config || config.instances.length === 0) {
          setNeedsConfig(true);
        }
      } catch (e) {
        setNeedsConfig(true);
      }
    }

    if (status !== 'connected' && viewMode === 'chat') fetchQr();
  };

  const fetchQr = async () => {
    const res = await getEvolutionQrCode();
    if (res.code === 'CONNECTED_ALREADY') {
      setConnectionStatus('connected');
      setQrCode(null);
    } else {
      setQrCode(res.code);
    }
  };

  const handleCreateInstance = async () => {
    if (!instanceName.trim()) {
      toast.error('Digite um nome para a instância');
      return;
    }

    setIsCreatingInstance(true);
    try {
      // Se precisa configurar API primeiro
      if (needsConfig && apiUrl && apiKey) {
        await saveEvolutionConfigToBackend({
          apiUrl: apiUrl.trim(),
          apiKey: apiKey.trim(),
          instance: instanceName.trim()
        });
      }

      const result = await createEvolutionInstance(instanceName.trim());
      
      if (result.success) {
        if (result.qrCode) {
          setQrCode(result.qrCode);
          toast.success('Instância criada! Escaneie o QR Code para conectar.');
        } else if (result.alreadyExists) {
          toast.success('Instância encontrada. Tentando conectar...');
          fetchQr();
        } else {
          toast.success(result.message);
          fetchQr();
        }
        setNeedsConfig(false);
      } else {
        toast.error('Erro ao criar instância');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar instância');
    } finally {
      setIsCreatingInstance(false);
    }
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
        toast.error("Falha no WhatsApp. Verifique conexão.");
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

  // Função para aplicar template de mensagem
  const applyTemplate = (template: typeof MESSAGE_TEMPLATES[0]) => {
    const patientName = selectedContact?.name?.split(' ')[0] || '';
    let message = template.message;
    
    // Substituir placeholders básicos
    message = message.replace('[NOME]', patientName);
    
    setInputText(message);
    setShowTemplates(false);
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
              {/* Header com Métricas */}
              <div className="bg-white dark:bg-slate-950 px-10 py-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                  <div className="flex justify-between items-start mb-6">
                      <div>
                          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">Pipeline de Oportunidades</h2>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Arraste os cards para mudar de fase</p>
                      </div>
                      <button onClick={() => setViewMode('chat')} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg hover:scale-105 transition-all"><MessageSquare className="w-4 h-4"/> Voltar ao Chat</button>
                  </div>

                  {/* Métricas de Conversão */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                      {/* Card Principal - Taxa de Conversão */}
                      <div className="col-span-2 md:col-span-1 lg:col-span-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-10">
                              <Target className="w-20 h-20" />
                          </div>
                          <div className="relative z-10">
                              <div className="flex items-center gap-2 mb-2">
                                  <TrendingUp className="w-4 h-4" />
                                  <span className="text-[9px] font-black uppercase tracking-widest opacity-80">Taxa de Conversão</span>
                              </div>
                              <p className="text-4xl font-black tracking-tighter">{metrics.conversionRate}%</p>
                              <p className="text-[10px] font-bold opacity-70 mt-1">Leads → Agendados</p>
                          </div>
                      </div>

                      {/* Métricas por Stage */}
                      {STAGES.slice(0, 4).map(stage => {
                          const count = stage.id === 'lead' ? metrics.leads : 
                                       stage.id === 'contact' ? metrics.inContact :
                                       stage.id === 'quote' ? metrics.quoted : metrics.scheduled;
                          return (
                              <div key={stage.id} className={`${stage.lightBg} dark:bg-slate-800 rounded-2xl p-4 border ${stage.border} dark:border-slate-700`}>
                                  <div className="flex items-center justify-between mb-2">
                                      <div className={`w-2 h-2 rounded-full ${stage.color}`}></div>
                                      <span className={`text-2xl font-black ${stage.textColor} dark:text-white`}>{count}</span>
                                  </div>
                                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider truncate">{stage.name}</p>
                              </div>
                          );
                      })}

                      {/* Card Perdidos */}
                      <div className="bg-rose-50 dark:bg-slate-800 rounded-2xl p-4 border border-rose-200 dark:border-slate-700">
                          <div className="flex items-center justify-between mb-2">
                              <X className="w-4 h-4 text-rose-400" />
                              <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{metrics.lost}</span>
                          </div>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Perdidos</p>
                      </div>
                  </div>
              </div>

              {/* Pipeline Kanban */}
              <div className="flex-1 overflow-x-auto p-8 flex gap-5 bg-slate-50 dark:bg-slate-900 no-scrollbar">
                  {STAGES.map(stage => {
                      const stageThreads = threads.filter(t => (t.crm_stage || 'lead') === stage.id);
                      const stageValue = stageThreads.length; // Poderia calcular valor total de orçamentos aqui
                      
                      return (
                          <div 
                            key={stage.id} 
                            className="min-w-[300px] w-[300px] flex flex-col gap-4"
                            onDragOver={onDragOver}
                            onDrop={(e) => onDrop(e, stage.id)}
                          >
                              {/* Header da Coluna Melhorado */}
                              <div className={`${stage.lightBg} dark:bg-slate-800 rounded-2xl p-4 border-2 ${stage.border} dark:border-slate-700`}>
                                  <div className="flex items-center justify-between">
                                     <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${stage.color} shadow-lg`}></div>
                                        <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-700 dark:text-slate-300">{stage.name}</h3>
                                     </div>
                                     <span className={`text-sm font-black ${stage.textColor} dark:text-white bg-white dark:bg-slate-900 px-3 py-1 rounded-full shadow-sm`}>
                                         {stageThreads.length}
                                     </span>
                                  </div>
                                  {/* Barra de progresso visual */}
                                  <div className="mt-3 h-1.5 bg-white dark:bg-slate-700 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                                        style={{ width: `${metrics.total > 0 ? (stageThreads.length / metrics.total) * 100 : 0}%` }}
                                      ></div>
                                  </div>
                              </div>
                              
                              {/* Cards da Coluna */}
                              <div className={`flex-1 space-y-3 overflow-y-auto no-scrollbar pb-10 p-2 rounded-3xl transition-all ${draggedId ? `${stage.lightBg}/50 dark:bg-slate-800/20 border-2 border-dashed ${stage.border} dark:border-slate-700` : ''}`}>
                                  {stageThreads.length === 0 && (
                                      <div className="text-center py-12 text-slate-300">
                                          <div className={`w-12 h-12 mx-auto mb-3 rounded-2xl ${stage.lightBg} flex items-center justify-center`}>
                                              <div className={`w-3 h-3 rounded-full ${stage.color} opacity-50`}></div>
                                          </div>
                                          <p className="text-[10px] font-bold uppercase tracking-wider">Arraste cards aqui</p>
                                      </div>
                                  )}
                                  {stageThreads.map(t => (
                                      <div 
                                        key={t.id} 
                                        draggable
                                        onDragStart={(e) => onDragStart(e, t.id)}
                                        onClick={() => { setSelectedContact({ id: t.id, name: t.contact_name, phone: t.id.split('@')[0], lastMessage: t.last_message, unreadCount: 0, clinicId: user.id }); setViewMode('chat'); }} 
                                        className={`bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border-l-4 ${stage.border.replace('border', 'border-l')} border border-slate-100 dark:border-slate-700/50 hover:shadow-xl hover:scale-[1.02] transition-all cursor-grab active:cursor-grabbing group ${draggedId === t.id ? 'opacity-40 grayscale scale-95' : ''}`}
                                      >
                                          <div className="flex items-center gap-3 mb-3">
                                              <img src={t.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.contact_name)}&background=random`} className="w-10 h-10 rounded-xl shadow-sm border-2 border-white dark:border-slate-700" />
                                              <div className="min-w-0 flex-1">
                                                  <p className="font-black text-slate-900 dark:text-white text-sm truncate">{t.contact_name}</p>
                                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{t.id.split('@')[0]}</p>
                                              </div>
                                          </div>
                                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 italic mb-3 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">"{t.last_message}"</p>
                                          <div className="flex justify-between items-center pt-3 border-t border-slate-50 dark:border-slate-700">
                                              <div className="flex items-center gap-1.5 text-slate-300">
                                                  <Clock className="w-3 h-3" />
                                                  <span className="text-[9px] font-bold uppercase">{new Date(t.last_timestamp).toLocaleDateString('pt-BR')}</span>
                                              </div>
                                              <button className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
                                                  <MessageSquare className="w-3.5 h-3.5 text-indigo-500"/>
                                              </button>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      );
                  })}
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
              {connectionStatus !== 'connected' && (
                <button 
                  onClick={() => setShowConnectionModal(true)}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:scale-[1.02] transition-all shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" /> Conectar WhatsApp
                </button>
              )}
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
                   <EmptyState 
                     icon="chat"
                     title="Nenhuma conversa encontrada"
                     description={sidebarTab === 'whatsapp' 
                       ? "Você ainda não possui conversas no WhatsApp. As conversas aparecerão aqui quando houver mensagens."
                       : "Nenhum paciente encontrado na base ativa. Adicione pacientes para começar a conversar."}
                   />
               ) : filtered.map(contact => {
                 const stage = STAGES.find(s => s.id === contact.crmStatus) || STAGES[0];
                 return (
                   <div key={contact.id} onClick={() => setSelectedContact(contact)} className={`flex items-center gap-4 p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer border-b border-slate-50 dark:border-slate-800/30 transition-all ${selectedContact?.id === contact.id ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-l-4 border-l-indigo-600' : 'border-l-4 border-l-transparent'}`}>
                      <div className="relative shrink-0">
                          <img src={contact.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=random`} className="w-12 h-12 rounded-2xl shadow-md border-2 border-white dark:border-slate-700" alt="" />
                          {contact.unreadCount > 0 && <span className={`absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 ${prefersReducedMotion ? '' : 'animate-bounce'}`}>{contact.unreadCount}</span>}
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
                  {isLoadingMessages && <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/20 backdrop-blur-[1px]"><Loader2 className={`w-8 h-8 text-indigo-600 ${prefersReducedMotion ? '' : 'animate-spin'}`} /></div>}
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

               <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shrink-0">
                  {/* Templates de Mensagens */}
                  {showTemplates && (
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 animate-in slide-in-from-bottom-2 fade-in duration-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Templates Rápidos</span>
                        <button onClick={() => setShowTemplates(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                          <X className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                        {MESSAGE_TEMPLATES.map(template => {
                          const Icon = template.icon;
                          return (
                            <button
                              key={template.id}
                              onClick={() => applyTemplate(template)}
                              className="group flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all hover:scale-105"
                            >
                              <div className={`w-10 h-10 ${template.color} rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{template.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Input de Mensagem */}
                  <div className="p-6">
                    <form onSubmit={handleSendMessage} className="flex items-end gap-4">
                       {/* Botão de Templates */}
                       <button 
                         type="button"
                         onClick={() => setShowTemplates(!showTemplates)}
                         className={`p-4 rounded-2xl transition-all shrink-0 ${showTemplates ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}
                       >
                         <Sparkles className="w-5 h-5" />
                       </button>
                       
                       <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-2xl px-6 py-2 border border-slate-100 dark:border-slate-700 shadow-inner">
                          <textarea 
                            value={inputText} 
                            onChange={(e) => setInputText(e.target.value)} 
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage(e)} 
                            placeholder="Envie uma mensagem via WhatsApp..." 
                            className="w-full bg-transparent border-none focus:ring-0 resize-none py-3 text-sm font-bold text-slate-900 dark:text-white min-h-[44px] max-h-[120px]" 
                            rows={1} 
                          />
                       </div>
                       
                       <button 
                         type="submit" 
                         disabled={!inputText.trim() || isSending || connectionStatus !== 'connected'} 
                         className="bg-slate-900 dark:bg-white p-5 rounded-2xl text-white dark:text-slate-900 shadow-2xl active:scale-90 transition-all disabled:opacity-30 shrink-0"
                       >
                           {isSending ? <Loader2 className={`w-6 h-6 ${prefersReducedMotion ? '' : 'animate-spin'}`} /> : <Send className="w-6 h-6" />}
                       </button>
                    </form>
                    
                    {/* Dica de Templates */}
                    {!showTemplates && !inputText && (
                      <p className="text-[10px] text-slate-400 mt-3 text-center font-bold">
                        💡 Clique em <Sparkles className="w-3 h-3 inline text-indigo-500" /> para usar templates prontos
                      </p>
                    )}
                  </div>
               </div>
            </div>
          ) : (
            <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 p-20 text-center">
               <div className="p-12 bg-white dark:bg-slate-800 rounded-[4rem] shadow-2xl border border-white/10 flex flex-col items-center max-w-sm">
                  <Zap className={`w-20 h-20 text-indigo-500 mb-8 ${prefersReducedMotion ? '' : 'animate-pulse'}`} />
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Motor CRM Ativo</h2>
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-6 leading-relaxed">
                    Sincronização em tempo real com Evolution API. <br/>Acompanhe e mova leads no <strong>Pipeline</strong>.
                  </p>
               </div>
            </div>
          )}
       </div>

       {/* Modal de Conexão WhatsApp */}
       {showConnectionModal && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in-95">
             <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                 <div className="p-3 bg-indigo-600 rounded-xl text-white">
                   <QrCode className="w-6 h-6" />
                 </div>
                 <div>
                   <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">
                     Conectar WhatsApp
                   </h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                     Configure sua instância Evolution
                   </p>
                 </div>
               </div>
               <button
                 onClick={() => {
                   setShowConnectionModal(false);
                   setNeedsConfig(false);
                   setApiUrl('');
                   setApiKey('');
                   setInstanceName('');
                 }}
                 className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
               >
                 <X className="w-5 h-5 text-slate-400" />
               </button>
             </div>

             {needsConfig && (
               <div className="space-y-4 mb-6">
                 <div>
                   <label className="block text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                     URL da API Evolution
                   </label>
                   <input
                     type="text"
                     value={apiUrl}
                     onChange={(e) => setApiUrl(e.target.value)}
                     placeholder="https://api.evolution.com"
                     className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                     API Key
                   </label>
                   <input
                     type="password"
                     value={apiKey}
                     onChange={(e) => setApiKey(e.target.value)}
                     placeholder="Sua API Key do Evolution"
                     className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                   />
                 </div>
               </div>
             )}

             <div className="space-y-4 mb-6">
               <div>
                 <label className="block text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                   Nome da Instância
                 </label>
                 <input
                   type="text"
                   value={instanceName}
                   onChange={(e) => setInstanceName(e.target.value)}
                   placeholder="minha-clinica-whatsapp"
                   className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                 />
                 <p className="text-[10px] text-slate-400 mt-2 font-bold">
                   Use apenas letras, números e hífens
                 </p>
               </div>
             </div>

             {qrCode && qrCode !== 'CONNECTED_ALREADY' && (
               <div className="mb-6 p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl text-center">
                 <p className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-4">
                   Escaneie o QR Code com seu WhatsApp
                 </p>
                 <div className="flex justify-center">
                   <img 
                     src={qrCode} 
                     alt="QR Code WhatsApp" 
                     className="w-64 h-64 rounded-2xl border-4 border-white dark:border-slate-700 shadow-xl"
                   />
                 </div>
                 <p className="text-[10px] text-slate-400 mt-4 font-bold">
                   Abra o WhatsApp → Configurações → Aparelhos conectados → Conectar um aparelho
                 </p>
                 <button
                   onClick={fetchQr}
                   className="mt-4 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                 >
                   Atualizar QR Code
                 </button>
               </div>
             )}

             <div className="flex gap-3">
               <button
                 onClick={handleCreateInstance}
                 disabled={isCreatingInstance || !instanceName.trim() || (needsConfig && (!apiUrl.trim() || !apiKey.trim()))}
                 className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
               >
                 {isCreatingInstance ? (
                   <>
                     <Loader2 className={`w-4 h-4 ${prefersReducedMotion ? '' : 'animate-spin'}`} />
                     Criando...
                   </>
                 ) : (
                   <>
                     <Plus className="w-4 h-4" />
                     Criar e Conectar
                   </>
                 )}
               </button>
             </div>
           </div>
         </div>
       )}
    </div>
  );
};

export default CRMTab;
