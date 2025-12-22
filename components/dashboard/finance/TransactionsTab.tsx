
import React, { useState } from 'react';
import { Transaction } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';
import { Search, Edit2, Trash2, ArrowUpRight, ArrowDownRight, Download, Calendar, List, X, Tag, Info } from 'lucide-react';
import * as XLSX from 'xlsx';

interface TransactionsTabProps {
  transactions: Transaction[];
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
}

const TransactionsTab: React.FC<TransactionsTabProps> = ({ transactions, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const filtered = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleExport = () => {
    const dataToExport = transactions.map(t => ({
      Data: new Date(t.date).toLocaleDateString('pt-BR'),
      Descrição: t.description,
      Categoria: t.category,
      Tipo: t.type === 'revenue' ? 'Receita' : 'Despesa',
      Valor: t.amount
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lançamentos");
    XLSX.writeFile(wb, "clinify-financeiro.xlsx");
  };

  const renderCalendarView = () => {
      const daysMap: Record<number, { rev: number, exp: number, txs: Transaction[] }> = {};
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      filtered.forEach(t => {
          const d = new Date(t.date);
          if (d.getMonth() === month && d.getFullYear() === year) {
              const day = d.getDate();
              if(!daysMap[day]) daysMap[day] = { rev: 0, exp: 0, txs: [] };
              if(t.type === 'revenue') daysMap[day].rev += t.amount;
              else daysMap[day].exp += t.amount;
              daysMap[day].txs.push(t);
          }
      });

      return (
          <div className="grid grid-cols-7 gap-2">
              {Array.from({length: daysInMonth}, (_, i) => i + 1).map(day => {
                  const data = daysMap[day];
                  return (
                      <div 
                        key={day} 
                        onClick={() => data?.txs.length && setSelectedDate(new Date(year, month, day))}
                        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 min-h-[100px] flex flex-col justify-between transition-all ${data?.txs.length ? 'cursor-pointer hover:shadow-lg hover:border-emerald-500' : 'opacity-40'}`}
                      >
                          <span className="text-xs font-black text-slate-400">{day}</span>
                          <div className="space-y-1">
                              {data?.rev > 0 && <div className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded truncate">+{formatCurrency(data.rev)}</div>}
                              {data?.exp > 0 && <div className="text-[10px] font-black text-rose-600 bg-rose-50 dark:bg-rose-900/30 px-1.5 py-0.5 rounded truncate">-{formatCurrency(data.exp)}</div>}
                          </div>
                      </div>
                  )
              })}
          </div>
      );
  };

  const selectedDayTransactions = selectedDate ? filtered.filter(t => {
      const d = new Date(t.date);
      return d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth();
  }) : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Fluxo de Caixa</h2>
        <div className="flex gap-2">
            <button onClick={() => setViewMode('list')} className={`p-3 rounded-2xl border-2 transition-all ${viewMode === 'list' ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-white border-slate-100 text-slate-400'}`}><List className="w-5 h-5"/></button>
            <button onClick={() => setViewMode('calendar')} className={`p-3 rounded-2xl border-2 transition-all ${viewMode === 'calendar' ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-white border-slate-100 text-slate-400'}`}><Calendar className="w-5 h-5"/></button>
            <button onClick={handleExport} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all"><Download className="w-4 h-4" /> Exportar</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Buscar lançamento..." className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        {viewMode === 'calendar' ? <div className="p-6 bg-slate-50 dark:bg-slate-950">{renderCalendarView()}</div> : (
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-black uppercase text-[10px] tracking-widest">
                        <tr><th className="px-8 py-5">Data</th><th className="px-8 py-5">Descrição</th><th className="px-8 py-5">Categoria</th><th className="px-8 py-5 text-right">Valor</th><th className="px-8 py-5 text-center">Ações</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filtered.map(t => (
                            <tr 
                              key={t.id} 
                              onClick={() => onEdit(t)}
                              className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer"
                            >
                                <td className="px-8 py-5 whitespace-nowrap font-bold text-slate-500">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                                <td className="px-8 py-5 font-black text-slate-900 dark:text-white">{t.description}</td>
                                <td className="px-8 py-5"><span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase">{t.category}</span></td>
                                <td className="px-8 py-5 text-right font-black text-lg">
                                    <span className={t.type === 'revenue' ? 'text-emerald-600' : 'text-rose-600'}>
                                        {t.type === 'revenue' ? '+' : '-'} {formatCurrency(t.amount)}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-center">
                                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); onEdit(t); }} 
                                          className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                                        >
                                          <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); onDelete(t.id); }} 
                                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>

      {selectedDate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setSelectedDate(null)}></div>
              <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl relative flex flex-col animate-in zoom-in-95 border border-white/10">
                  <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                      <div>
                          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Lançamentos do Dia</h3>
                          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">{selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</p>
                      </div>
                      <button onClick={() => setSelectedDate(null)} className="p-3 bg-white dark:bg-slate-700 rounded-full shadow-sm text-slate-400"><X className="w-6 h-6" /></button>
                  </div>
                  <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto">
                      {selectedDayTransactions.map(t => (
                          <div 
                            key={t.id} 
                            onClick={() => {onEdit(t); setSelectedDate(null)}}
                            className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700/50 group cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                          >
                              <div className="flex items-center gap-4">
                                  <div className={`p-3 rounded-2xl ${t.type === 'revenue' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                      {t.type === 'revenue' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                  </div>
                                  <div>
                                      <p className="font-black text-slate-900 dark:text-white leading-none mb-2">{t.description}</p>
                                      <span className="text-[10px] font-black uppercase text-slate-400 bg-white dark:bg-slate-700 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-600">{t.category}</span>
                                  </div>
                              </div>
                              <div className="flex items-center gap-6">
                                  <p className={`font-black text-lg ${t.type === 'revenue' ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(t.amount)}</p>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); onEdit(t); setSelectedDate(null); }} 
                                        className="p-2 text-slate-400 hover:text-blue-500"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); onDelete(t.id); }} 
                                        className="p-2 text-slate-400 hover:text-red-500"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
                  <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-b-[3rem] flex justify-between items-center">
                       <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Saldo Diário</span>
                       <span className={`text-3xl font-black ${selectedDayTransactions.reduce((acc, t) => acc + (t.type === 'revenue' ? t.amount : -t.amount), 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                           {formatCurrency(selectedDayTransactions.reduce((acc, t) => acc + (t.type === 'revenue' ? t.amount : -t.amount), 0))}
                       </span>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default TransactionsTab;
