import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { 
  Bell, X, Check, Calendar, TrendingUp, Gift, AlertTriangle, 
  MessageSquare, Users, DollarSign, Clock, ChevronRight,
  CheckCheck, Trash2
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'birthday' | 'finance' | 'appointment';
  title: string;
  message: string;
  time: Date;
  read: boolean;
  action?: {
    label: string;
    path: string;
  };
}

interface NotificationsProps {
  user: any;
  transactions?: any[];
  appointments?: any[];
  patients?: any[];
}

const Notifications: React.FC<NotificationsProps> = ({ user, transactions = [], appointments = [], patients = [] }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Generate smart notifications based on data
  useEffect(() => {
    const generateNotifications = () => {
      const newNotifications: Notification[] = [];
      const now = new Date();
      const today = now.toDateString();
      
      // Garantir que patients seja sempre um array
      const safePatients = Array.isArray(patients) ? patients : [];
      
      // Garantir que appointments seja sempre um array
      const safeAppointments = Array.isArray(appointments) ? appointments : [];
      
      // Garantir que transactions seja sempre um array
      const safeTransactions = Array.isArray(transactions) ? transactions : [];

      // Birthday notifications (patients with birthday today or tomorrow)
      safePatients.forEach((patient: any) => {
        if (patient.birth_date) {
          const birthDate = new Date(patient.birth_date);
          const thisYearBirthday = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
          const diffDays = Math.ceil((thisYearBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 0) {
            newNotifications.push({
              id: `birthday-${patient.id}`,
              type: 'birthday',
              title: `🎂 Aniversário Hoje!`,
              message: `${patient.name} está fazendo aniversário. Envie uma mensagem especial!`,
              time: now,
              read: false,
              action: { label: 'Enviar Mimo', path: '/dashboard/home' }
            });
          } else if (diffDays === 1) {
            newNotifications.push({
              id: `birthday-tomorrow-${patient.id}`,
              type: 'birthday',
              title: `🎁 Aniversário Amanhã`,
              message: `${patient.name} faz aniversário amanhã. Prepare uma surpresa!`,
              time: now,
              read: false
            });
          }
        }
      });

      // Today's appointments reminder
      const todayAppointments = safeAppointments.filter((apt: any) => {
        const aptDate = new Date(apt.startTime);
        return aptDate.toDateString() === today && apt.status !== 'completed';
      });

      if (todayAppointments.length > 0) {
        newNotifications.push({
          id: `appointments-today-${today}`,
          type: 'appointment',
          title: `📅 ${todayAppointments.length} Agendamentos Hoje`,
          message: `Você tem ${todayAppointments.length} atendimentos programados para hoje.`,
          time: now,
          read: false,
          action: { label: 'Ver Agenda', path: '/dashboard/agenda' }
        });
      }

      // Financial goals check
      const thisMonthRevenue = safeTransactions
        .filter((t: any) => {
          const d = new Date(t.date);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === 'revenue';
        })
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      // Check if goal was reached (assuming goal is stored somewhere)
      if (thisMonthRevenue >= 50000) {
        newNotifications.push({
          id: `goal-reached-${now.getMonth()}`,
          type: 'success',
          title: `🏆 Meta Batida!`,
          message: `Parabéns! Você atingiu R$ ${thisMonthRevenue.toLocaleString('pt-BR')} este mês.`,
          time: now,
          read: false
        });
      }

      // High expense warning
      const thisMonthExpenses = safeTransactions
        .filter((t: any) => {
          const d = new Date(t.date);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === 'expense';
        })
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      if (thisMonthExpenses > thisMonthRevenue * 0.7) {
        newNotifications.push({
          id: `high-expenses-${now.getMonth()}`,
          type: 'warning',
          title: `⚠️ Despesas Elevadas`,
          message: `Suas despesas representam mais de 70% do faturamento. Revise seus custos.`,
          time: now,
          read: false,
          action: { label: 'Ver Finanças', path: '/dashboard/finance' }
        });
      }

      // Welcome notification for new users
      if (safeTransactions.length === 0) {
        newNotifications.push({
          id: 'welcome',
          type: 'info',
          title: `👋 Bem-vindo ao Clinify!`,
          message: `Comece adicionando seus primeiros lançamentos financeiros.`,
          time: now,
          read: false,
          action: { label: 'Começar', path: '/dashboard/finance' }
        });
      }

      setNotifications(newNotifications.slice(0, 10));
    };

    generateNotifications();
  }, [transactions, appointments, patients]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: Notification['type']) => {
    const icons = {
      success: <TrendingUp className="w-4 h-4" />,
      warning: <AlertTriangle className="w-4 h-4" />,
      info: <MessageSquare className="w-4 h-4" />,
      birthday: <Gift className="w-4 h-4" />,
      finance: <DollarSign className="w-4 h-4" />,
      appointment: <Calendar className="w-4 h-4" />
    };
    return icons[type];
  };

  const getIconBg = (type: Notification['type']) => {
    const colors = {
      success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600',
      warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
      info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
      birthday: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600',
      finance: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600',
      appointment: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
    };
    return colors[type];
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}min`;
    if (hours < 24) return `${hours}h`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-slate-100 dark:bg-slate-900 rounded-xl text-slate-500 border border-slate-200 dark:border-slate-800 hover:scale-105 transition-all shadow-sm"
      >
        <Bell className="w-5 h-5 dark:text-slate-400" />
        
        {/* Notification Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-[70vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest">Notificações</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{unreadCount} não lidas</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700 transition-colors flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Ler tudo
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-400">Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group ${
                    !notification.read ? 'bg-emerald-50/50 dark:bg-emerald-900/5' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getIconBg(notification.type)}`}>
                      {getIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-black text-slate-900 dark:text-white text-xs leading-tight">
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[9px] font-bold text-slate-400">
                            {formatTime(notification.time)}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); clearNotification(notification.id); }}
                            className="p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                        {notification.message}
                      </p>
                      
                      {notification.action && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(notification.action!.path);
                            setIsOpen(false);
                          }}
                          className="mt-2 text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1 hover:text-emerald-700 transition-colors"
                        >
                          {notification.action.label} <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Unread indicator */}
                    {!notification.read && (
                      <div className="w-2 h-2 bg-emerald-500 rounded-full shrink-0 animate-pulse" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <button className="w-full text-center text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-emerald-600 transition-colors py-2">
              Ver Histórico Completo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;









