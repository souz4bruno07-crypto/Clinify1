import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  className?: string;
}

const DateSelector: React.FC<DateSelectorProps> = ({ 
  selectedDate, 
  onDateChange,
  className = '' 
}) => {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const handlePreviousMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onDateChange(newDate);
  };

  const handleDateClick = () => {
    if (dateInputRef.current) {
      try {
        // Tenta usar o showPicker() nativo se disponível
        (dateInputRef.current as any).showPicker();
      } catch (e) {
        // Fallback para navegadores que não suportam showPicker()
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

  // Formata a data para o input type="date" (YYYY-MM-DD)
  // Usa getFullYear, getMonth, getDate para evitar problemas de timezone
  const dateInputValue = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Botão Anterior */}
      <button
        onClick={handlePreviousMonth}
        className="p-2 bg-slate-100 dark:bg-slate-900 rounded-xl text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:text-slate-900 dark:hover:text-white transition-all"
        aria-label="Mês anterior"
        title="Mês anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Botão de Data */}
      <button
        onClick={handleDateClick}
        className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-900 rounded-xl text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:text-slate-900 dark:hover:text-white transition-all"
        aria-label="Selecionar data"
        title="Clique para escolher o dia"
      >
        <Calendar className="w-4 h-4" />
        <span className="text-sm font-bold whitespace-nowrap">
          {formatDate(selectedDate)}
        </span>
      </button>

      {/* Input de data oculto para o seletor nativo */}
      <input
        ref={dateInputRef}
        type="date"
        value={dateInputValue}
        onChange={handleDateChange}
        className="sr-only"
        aria-hidden="true"
      />

      {/* Botão Próximo */}
      <button
        onClick={handleNextMonth}
        className="p-2 bg-slate-100 dark:bg-slate-900 rounded-xl text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:text-slate-900 dark:hover:text-white transition-all"
        aria-label="Próximo mês"
        title="Próximo mês"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default DateSelector;
