import React, { useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle2, CalendarCheck } from 'lucide-react';

interface CalendarDateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  className?: string;
}

const CalendarDateSelector: React.FC<CalendarDateSelectorProps> = ({ 
  selectedDate, 
  onDateChange,
  className = '' 
}) => {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const isCurrentDateToday = selectedDate.toDateString() === new Date().toDateString();

  const handleDateClick = () => {
    if (dateInputRef.current) {
      try {
        (dateInputRef.current as any).showPicker();
      } catch (e) {
        dateInputRef.current.focus();
        dateInputRef.current.click();
      }
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      onDateChange(newDate);
    }
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const dateInputValue = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full ${className}`}>
      {/* Botão de Data */}
      <div className="relative flex-1 sm:flex-none">
        <button 
          onClick={handleDateClick} 
          className="group flex items-center gap-6 bg-white dark:bg-slate-900 px-10 py-6 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:ring-8 hover:ring-indigo-500/5 transition-all w-full"
        >
          <div className="p-4 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl shadow-2xl shadow-indigo-500/30">
            <CalendarIcon className="w-8 h-8" />
          </div>
          <div className="text-left flex-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Data Ativa</p>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
              {selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
            </h2>
          </div>
        </button>
        <input
          ref={dateInputRef}
          type="date"
          value={dateInputValue}
          onChange={handleDateChange}
          className="sr-only"
          aria-hidden="true"
        />
      </div>

      {/* Botão IR PARA HOJE */}
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

      {/* Status "Você está em Hoje" */}
      {isCurrentDateToday && (
        <div className="flex items-center gap-2 px-6 py-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-200 dark:border-emerald-800 shrink-0">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-xs font-black uppercase tracking-wider whitespace-nowrap">Você está em Hoje</span>
        </div>
      )}
    </div>
  );
};

export default CalendarDateSelector;
