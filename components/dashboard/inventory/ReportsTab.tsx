import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingDown, Calendar, User, Package, 
  AlertTriangle, Clock, DollarSign, Download, Filter
} from 'lucide-react';
import { Staff } from '../../../types';
import { 
  getConsumptionReport, 
  getValuationReport, 
  ConsumptionReport, 
  ValuationReport 
} from '../../../services/inventoryService';
import { getStaff } from '../../../services/backendService';
import { formatCurrency } from '../../../utils/formatters';
import * as XLSX from 'xlsx';

interface ReportsTabProps {
  userId: string;
}

type ReportType = 'consumption' | 'valuation';

const ReportsTab: React.FC<ReportsTabProps> = ({ userId }) => {
  const [reportType, setReportType] = useState<ReportType>('consumption');
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<Staff[]>([]);
  
  const [consumptionReport, setConsumptionReport] = useState<ConsumptionReport | null>(null);
  const [valuationReport, setValuationReport] = useState<ValuationReport | null>(null);

  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    staffId: ''
  });

  useEffect(() => {
    loadStaff();
  }, []);

  useEffect(() => {
    loadReport();
  }, [reportType, filters]);

  const loadStaff = async () => {
    try {
      const data = await getStaff('');
      setStaff(data);
    } catch (error) {
      // Erro silencioso - staff opcional
    }
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      
      if (reportType === 'consumption') {
        const data = await getConsumptionReport({
          startDate: new Date(filters.startDate).getTime(),
          endDate: new Date(filters.endDate + 'T23:59:59').getTime(),
          staffId: filters.staffId || undefined
        });
        setConsumptionReport(data);
      } else {
        const data = await getValuationReport();
        setValuationReport(data);
      }
    } catch (error) {
      // Erro silencioso - loading state já indica problema
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (reportType === 'consumption' && consumptionReport) {
      const dataToExport = consumptionReport.topConsumed.map(p => ({
        Produto: p.productName,
        'Quantidade Consumida': p.quantity,
        'Custo Total': p.totalCost
      }));
      
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Consumo');
      XLSX.writeFile(wb, 'relatorio-consumo-clinify.xlsx');
    } else if (reportType === 'valuation' && valuationReport) {
      const dataToExport = valuationReport.byCategory.map(c => ({
        Categoria: c.category,
        'Qtd. Produtos': c.count,
        'Valor Total': c.value
      }));
      
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Valorização');
      XLSX.writeFile(wb, 'relatorio-valorizacao-clinify.xlsx');
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Type Selector */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-2 border border-slate-200 dark:border-slate-800 inline-flex gap-2">
        <button
          onClick={() => setReportType('consumption')}
          className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${
            reportType === 'consumption'
              ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg'
              : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          Relatório de Consumo
        </button>
        <button
          onClick={() => setReportType('valuation')}
          className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${
            reportType === 'valuation'
              ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg'
              : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Valorização do Estoque
        </button>
      </div>

      {/* Filters for Consumption Report */}
      {reportType === 'consumption' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Data Início
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Data Fim
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Profissional
              </label>
              <select
                value={filters.staffId}
                onChange={e => setFilters(prev => ({ ...prev, staffId: e.target.value }))}
                className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Todos</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExport}
              className="px-5 py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2 ml-auto"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 animate-pulse h-64" />
          ))}
        </div>
      ) : reportType === 'consumption' && consumptionReport ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Movimentações</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{consumptionReport.totalMovements}</p>
                </div>
                <div className="p-3 bg-teal-50 dark:bg-teal-900/30 rounded-2xl">
                  <BarChart3 className="w-6 h-6 text-teal-500" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Qtd. Consumida</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{consumptionReport.totalQuantity.toFixed(0)}</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl">
                  <Package className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Custo Total</p>
                  <p className="text-2xl font-black text-rose-500 mt-1">{formatCurrency(consumptionReport.totalCost)}</p>
                </div>
                <div className="p-3 bg-rose-50 dark:bg-rose-900/30 rounded-2xl">
                  <TrendingDown className="w-6 h-6 text-rose-500" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Período</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-2">
                    {new Date(consumptionReport.period.start).toLocaleDateString('pt-BR')} - {new Date(consumptionReport.period.end).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="p-3 bg-violet-50 dark:bg-violet-900/30 rounded-2xl">
                  <Calendar className="w-6 h-6 text-violet-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Consumed Products */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-teal-500" />
                Produtos Mais Consumidos
              </h3>
              
              {consumptionReport.topConsumed.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">Nenhum consumo no período</p>
              ) : (
                <div className="space-y-3">
                  {consumptionReport.topConsumed.slice(0, 10).map((item, index) => (
                    <div 
                      key={item.productId}
                      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center text-sm font-black text-teal-600">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{item.productName}</p>
                          <p className="text-xs text-slate-500">{item.quantity} unidades</p>
                        </div>
                      </div>
                      <span className="font-black text-slate-900 dark:text-white">
                        {formatCurrency(item.totalCost)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Consumption by Professional */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-violet-500" />
                Consumo por Profissional
              </h3>
              
              {consumptionReport.byProfessional.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">Nenhum consumo vinculado a profissionais</p>
              ) : (
                <div className="space-y-4">
                  {consumptionReport.byProfessional.map(item => (
                    <div 
                      key={item.staffId}
                      className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-bold text-slate-900 dark:text-white">{item.staffName}</p>
                        <span className="font-black text-rose-500">{formatCurrency(item.totalCost)}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {item.products.slice(0, 5).map((product, i) => (
                          <span 
                            key={i}
                            className="px-2 py-1 bg-white dark:bg-slate-700 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
                          >
                            {product.productName}: {product.quantity}
                          </span>
                        ))}
                        {item.products.length > 5 && (
                          <span className="text-xs text-slate-400">+{item.products.length - 5} mais</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : reportType === 'valuation' && valuationReport ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Produtos</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{valuationReport.totalProducts}</p>
                </div>
                <div className="p-3 bg-teal-50 dark:bg-teal-900/30 rounded-2xl">
                  <Package className="w-6 h-6 text-teal-500" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Valor Total</p>
                  <p className="text-2xl font-black text-emerald-500 mt-1">{formatCurrency(valuationReport.totalValue)}</p>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl">
                  <DollarSign className="w-6 h-6 text-emerald-500" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Estoque Baixo</p>
                  <p className="text-3xl font-black text-amber-500 mt-1">{valuationReport.lowStockCount}</p>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-2xl">
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Vencendo</p>
                  <p className="text-3xl font-black text-rose-500 mt-1">{valuationReport.expiringCount}</p>
                </div>
                <div className="p-3 bg-rose-50 dark:bg-rose-900/30 rounded-2xl">
                  <Clock className="w-6 h-6 text-rose-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Category */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5 text-teal-500" />
                Valor por Categoria
              </h3>
              
              <div className="space-y-3">
                {valuationReport.byCategory.map(item => {
                  const percentage = (item.value / valuationReport.totalValue) * 100;
                  
                  return (
                    <div key={item.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{item.category}</span>
                        <div className="text-right">
                          <span className="font-black text-slate-900 dark:text-white">{formatCurrency(item.value)}</span>
                          <span className="text-xs text-slate-400 ml-2">({item.count} itens)</span>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Expiring Products */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-rose-500" />
                Produtos Vencendo (30 dias)
              </h3>
              
              {valuationReport.expiringProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-full mb-3">
                    <Package className="w-8 h-8 text-emerald-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">Nenhum produto vencendo nos próximos 30 dias</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {valuationReport.expiringProducts.map(item => (
                    <div 
                      key={item.productId}
                      className={`p-4 rounded-2xl flex items-center justify-between ${
                        item.daysUntilExpiry <= 0 
                          ? 'bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800'
                          : item.daysUntilExpiry <= 7
                          ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                          : 'bg-slate-50 dark:bg-slate-800/50'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{item.productName}</p>
                        <p className="text-xs text-slate-500">
                          {item.stock} em estoque • {formatCurrency(item.value)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-black ${
                          item.daysUntilExpiry <= 0 ? 'text-rose-500' :
                          item.daysUntilExpiry <= 7 ? 'text-amber-500' :
                          'text-slate-700 dark:text-slate-300'
                        }`}>
                          {item.daysUntilExpiry <= 0 
                            ? 'Vencido!'
                            : `${item.daysUntilExpiry} dias`
                          }
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(item.expirationDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ReportsTab;

