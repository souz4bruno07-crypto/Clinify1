import React, { useState, useEffect } from 'react';
import { 
  Search, ArrowDownLeft, ArrowUpRight, RefreshCw, AlertTriangle,
  Calendar, Filter, Download, User, Package
} from 'lucide-react';
import { StockMovement, Staff } from '../../../types';
import { getMovements, getUnitLabel } from '../../../services/inventoryService';
import { getStaff } from '../../../services/backendService';
import { formatCurrency } from '../../../utils/formatters';
import EmptyState from '../../ui/EmptyState';
import Pagination from '../../ui/Pagination';
import * as XLSX from 'xlsx';

interface MovementsTabProps {
  userId: string;
  selectedDate: Date;
}

const MovementsTab: React.FC<MovementsTabProps> = ({ userId, selectedDate }) => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalMovements, setTotalMovements] = useState(0);
  
  // Inicializar filtros com a data selecionada
  const getInitialFilters = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    
    return {
      type: 'all',
      staffId: 'all',
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0]
    };
  };

  const [filters, setFilters] = useState(() => getInitialFilters());

  useEffect(() => {
    loadMovements();
    loadStaff();
  }, []);

  // Atualizar filtros quando a data selecionada mudar
  useEffect(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    
    setFilters(prev => ({
      ...prev,
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0]
    }));
    setCurrentPage(1);
  }, [selectedDate]);

  useEffect(() => {
    setCurrentPage(1); // Resetar para primeira página ao mudar filtros
  }, [filters]);

  useEffect(() => {
    loadMovements();
  }, [filters, currentPage, itemsPerPage]);

  const loadMovements = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * itemsPerPage;
      const response = await getMovements({
        type: filters.type !== 'all' ? filters.type : undefined,
        staffId: filters.staffId !== 'all' ? filters.staffId : undefined,
        startDate: filters.startDate ? new Date(filters.startDate).getTime() : undefined,
        endDate: filters.endDate ? new Date(filters.endDate + 'T23:59:59').getTime() : undefined,
        limit: itemsPerPage,
        offset
      });
      setMovements(response.data);
      setTotalMovements(response.total);
    } catch (error) {
      // Erro silencioso - loading state já indica problema
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async () => {
    try {
      const data = await getStaff('');
      setStaff(data);
    } catch (error) {
      // Erro silencioso - staff opcional
    }
  };

  const handleExport = () => {
    const dataToExport = movements.map(m => ({
      Data: new Date(m.createdAt).toLocaleString('pt-BR'),
      Produto: m.productName,
      Tipo: getTypeLabel(m.type),
      Quantidade: m.quantity,
      'Estoque Anterior': m.previousStock,
      'Novo Estoque': m.newStock,
      'Custo Unit.': m.unitCost || '',
      'Custo Total': m.totalCost || '',
      Profissional: m.staffName || '',
      Paciente: m.patientName || '',
      Motivo: m.reason || '',
      'Nota Fiscal': m.invoiceNumber || ''
    }));
    
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Movimentações');
    XLSX.writeFile(wb, 'movimentacoes-estoque-clinify.xlsx');
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'entrada': return 'Entrada';
      case 'saida': return 'Saída';
      case 'ajuste': return 'Ajuste';
      case 'perda': return 'Perda';
      case 'vencido': return 'Vencido';
      default: return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'entrada': return ArrowDownLeft;
      case 'saida': return ArrowUpRight;
      case 'ajuste': return RefreshCw;
      case 'perda':
      case 'vencido': return AlertTriangle;
      default: return Package;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'entrada': return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30';
      case 'saida': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
      case 'ajuste': return 'text-violet-600 bg-violet-100 dark:bg-violet-900/30';
      case 'perda': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
      case 'vencido': return 'text-rose-600 bg-rose-100 dark:bg-rose-900/30';
      default: return 'text-slate-600 bg-slate-100 dark:bg-slate-800';
    }
  };

  const totalEntradas = movements.filter(m => m.type === 'entrada').reduce((acc, m) => acc + (m.totalCost || 0), 0);
  const totalSaidas = movements.filter(m => ['saida', 'perda', 'vencido'].includes(m.type)).reduce((acc, m) => acc + (m.totalCost || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Movimentações</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{totalMovements}</p>
            </div>
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <RefreshCw className="w-6 h-6 text-slate-500" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Valor Entradas</p>
              <p className="text-2xl font-black text-emerald-500 mt-1">{formatCurrency(totalEntradas)}</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl">
              <ArrowDownLeft className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Valor Saídas</p>
              <p className="text-2xl font-black text-rose-500 mt-1">{formatCurrency(totalSaidas)}</p>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-900/30 rounded-2xl">
              <ArrowUpRight className="w-6 h-6 text-rose-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Tipo
            </label>
            <select
              value={filters.type}
              onChange={e => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">Todos os Tipos</option>
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
              <option value="ajuste">Ajuste</option>
              <option value="perda">Perda</option>
              <option value="vencido">Vencido</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Profissional
            </label>
            <select
              value={filters.staffId}
              onChange={e => setFilters(prev => ({ ...prev, staffId: e.target.value }))}
              className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">Todos</option>
              {staff.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Data Início
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
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
              className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            />
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

      {/* Movements List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
                <div className="flex-1">
                  <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2" />
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : movements.length === 0 ? (
        <EmptyState
          icon="history"
          title="Nenhuma movimentação encontrada"
          description="Não há movimentações de estoque no período selecionado"
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Data/Hora</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Produto</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Qtd.</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Estoque</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Profissional</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {movements.map(movement => {
                  const Icon = getTypeIcon(movement.type);
                  
                  return (
                    <tr key={movement.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">
                              {new Date(movement.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(movement.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 dark:text-white">{movement.productName}</p>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase ${getTypeColor(movement.type)}`}>
                          <Icon className="w-3 h-3" />
                          {getTypeLabel(movement.type)}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 text-right">
                        <span className={`text-lg font-black ${
                          movement.type === 'entrada' ? 'text-emerald-500' :
                          ['saida', 'perda', 'vencido'].includes(movement.type) ? 'text-rose-500' :
                          'text-slate-900 dark:text-white'
                        }`}>
                          {movement.type === 'entrada' ? '+' : movement.type !== 'ajuste' ? '-' : ''}
                          {movement.quantity}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-500">
                          <span>{movement.previousStock}</span>
                          <span className="text-slate-300">→</span>
                          <span className="font-bold text-slate-900 dark:text-white">{movement.newStock}</span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        {movement.staffName ? (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="font-medium text-slate-700 dark:text-slate-300">{movement.staffName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        <p className="text-slate-600 dark:text-slate-400 max-w-xs truncate">
                          {movement.reason || movement.patientName || '-'}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!loading && totalMovements > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(totalMovements / itemsPerPage)}
              itemsPerPage={itemsPerPage}
              totalItems={totalMovements}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(newItemsPerPage) => {
                setItemsPerPage(newItemsPerPage);
                setCurrentPage(1);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default MovementsTab;

