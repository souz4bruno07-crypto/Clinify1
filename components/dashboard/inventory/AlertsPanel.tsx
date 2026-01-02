import React, { useState } from 'react';
import { 
  X, Bell, AlertTriangle, Clock, Package, Check, CheckCheck
} from 'lucide-react';
import { StockAlert } from '../../../types';
import { markAlertAsRead, markAllAlertsAsRead } from '../../../services/inventoryService';

interface AlertsPanelProps {
  alerts: StockAlert[];
  onClose: () => void;
  onRefresh: () => void;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, onClose, onRefresh }) => {
  const [loading, setLoading] = useState(false);

  const handleMarkRead = async (id: string) => {
    try {
      await markAlertAsRead(id);
      onRefresh();
    } catch (error) {
      // Erro silencioso - ação não crítica
    }
  };

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      await markAllAlertsAsRead();
      onRefresh();
    } catch (error) {
      // Erro silencioso - ação não crítica
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'low_stock':
      case 'out_of_stock':
        return Package;
      case 'expiring':
      case 'expired':
        return Clock;
      default:
        return AlertTriangle;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'low_stock':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600';
      case 'out_of_stock':
        return 'bg-rose-100 dark:bg-rose-900/30 text-rose-600';
      case 'expiring':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600';
      case 'expired':
        return 'bg-rose-100 dark:bg-rose-900/30 text-rose-600';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600';
    }
  };

  const getAlertTitle = (type: string) => {
    switch (type) {
      case 'low_stock':
        return 'Estoque Baixo';
      case 'out_of_stock':
        return 'Sem Estoque';
      case 'expiring':
        return 'Produto Vencendo';
      case 'expired':
        return 'Produto Vencido';
      default:
        return 'Alerta';
    }
  };

  const getAlertDescription = (alert: StockAlert) => {
    switch (alert.alertType) {
      case 'low_stock':
        return `Estoque atual: ${alert.currentStock} (mínimo: ${alert.minStock})`;
      case 'out_of_stock':
        return 'O produto está zerado no estoque';
      case 'expiring':
        return `Vence em ${alert.daysUntilExpiry} dias (${alert.expirationDate ? new Date(alert.expirationDate).toLocaleDateString('pt-BR') : ''})`;
      case 'expired':
        return `Venceu em ${alert.expirationDate ? new Date(alert.expirationDate).toLocaleDateString('pt-BR') : ''}`;
      default:
        return '';
    }
  };

  const unreadAlerts = alerts.filter(a => !a.isRead);
  const readAlerts = alerts.filter(a => a.isRead);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3rem] shadow-2xl relative flex flex-col animate-in zoom-in-95 max-h-[80vh]">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-500 rounded-2xl">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Alertas de Estoque
              </h2>
              <p className="text-sm text-slate-500">
                {unreadAlerts.length} alerta{unreadAlerts.length !== 1 ? 's' : ''} não lido{unreadAlerts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mark All Read Button */}
        {unreadAlerts.length > 0 && (
          <div className="px-8 py-4 border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={handleMarkAllRead}
              disabled={loading}
              className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              Marcar Todos como Lidos
            </button>
          </div>
        )}

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-8">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-full mb-4">
                <Check className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Tudo em Ordem!</h3>
              <p className="text-sm text-slate-500">Não há alertas de estoque no momento</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Unread Alerts */}
              {unreadAlerts.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                    Não Lidos
                  </h3>
                  <div className="space-y-3">
                    {unreadAlerts.map(alert => {
                      const Icon = getAlertIcon(alert.alertType);
                      
                      return (
                        <div 
                          key={alert.id}
                          className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-start gap-4 group"
                        >
                          <div className={`p-2 rounded-xl ${getAlertColor(alert.alertType)}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white">
                                  {alert.productName}
                                </p>
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-1 ${getAlertColor(alert.alertType)}`}>
                                  {getAlertTitle(alert.alertType)}
                                </span>
                              </div>
                              
                              <button
                                onClick={() => handleMarkRead(alert.id)}
                                className="p-2 text-slate-400 hover:text-emerald-500 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all opacity-0 group-hover:opacity-100"
                                title="Marcar como lido"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <p className="text-sm text-slate-500 mt-2">
                              {getAlertDescription(alert)}
                            </p>
                            
                            <p className="text-xs text-slate-400 mt-2">
                              {new Date(alert.createdAt).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Read Alerts */}
              {readAlerts.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                    Lidos
                  </h3>
                  <div className="space-y-3">
                    {readAlerts.slice(0, 10).map(alert => {
                      const Icon = getAlertIcon(alert.alertType);
                      
                      return (
                        <div 
                          key={alert.id}
                          className="p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl flex items-start gap-4 opacity-60"
                        >
                          <div className={`p-2 rounded-xl ${getAlertColor(alert.alertType)}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          
                          <div className="flex-1">
                            <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">
                              {alert.productName}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {getAlertTitle(alert.alertType)} • {new Date(alert.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertsPanel;

