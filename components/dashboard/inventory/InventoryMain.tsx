import React, { useState, useEffect } from 'react';
import { 
  Package, History, BarChart3, AlertTriangle, Link2, Bell,
  RefreshCw
} from 'lucide-react';
import ProductsTab from './ProductsTab';
import MovementsTab from './MovementsTab';
import ReportsTab from './ReportsTab';
import ProcedureLinksTab from './ProcedureLinksTab';
import AlertsPanel from './AlertsPanel';
import { getAlerts } from '../../../services/inventoryService';
import { StockAlert } from '../../../types';

type InventorySubTab = 'products' | 'movements' | 'reports' | 'procedures';

interface InventoryMainProps {
  userId: string;
}

const InventoryMain: React.FC<InventoryMainProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState<InventorySubTab>('products');
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const data = await getAlerts(true);
      setAlerts(data);
    } catch (error) {
      // Erro silencioso - alertas são opcionais
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    loadAlerts();
  };

  const unreadAlerts = alerts.filter(a => !a.isRead);

  const tabs = [
    { id: 'products' as const, label: 'Produtos', icon: Package },
    { id: 'movements' as const, label: 'Movimentações', icon: History },
    { id: 'procedures' as const, label: 'Procedimentos', icon: Link2 },
    { id: 'reports' as const, label: 'Relatórios', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
            Controle de Estoque
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Gerencie produtos, insumos e movimentações
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            title="Atualizar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setShowAlerts(true)}
            className="relative p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          >
            <Bell className="w-5 h-5" />
            {unreadAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                {unreadAlerts.length > 9 ? '9+' : unreadAlerts.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Quick Alerts Banner */}
      {unreadAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 to-rose-500/10 border border-amber-500/20 rounded-3xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {unreadAlerts.length} alerta{unreadAlerts.length > 1 ? 's' : ''} ativo{unreadAlerts.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-slate-500">
                Estoque baixo, produtos vencendo ou vencidos
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAlerts(true)}
            className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition-colors"
          >
            Ver Alertas
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-2">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/25'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div key={refreshKey}>
        {activeTab === 'products' && <ProductsTab userId={userId} onRefresh={handleRefresh} />}
        {activeTab === 'movements' && <MovementsTab userId={userId} />}
        {activeTab === 'procedures' && <ProcedureLinksTab userId={userId} />}
        {activeTab === 'reports' && <ReportsTab userId={userId} />}
      </div>

      {/* Alerts Panel */}
      {showAlerts && (
        <AlertsPanel
          alerts={alerts}
          onClose={() => setShowAlerts(false)}
          onRefresh={() => {
            loadAlerts();
            handleRefresh();
          }}
        />
      )}
    </div>
  );
};

export default InventoryMain;

