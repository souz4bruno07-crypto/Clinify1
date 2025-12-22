
import React, { useState, useEffect } from 'react';
import { TaxConfig, TaxRegime } from '../types';
import { Landmark, AlertCircle, Settings2, Calculator, Check, Percent, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface TaxWidgetProps {
  revenue: number;
}

const TaxWidget: React.FC<TaxWidgetProps> = ({ revenue }) => {
  const [config, setConfig] = useState<TaxConfig>(() => {
    const saved = localStorage.getItem('clinify_tax_config');
    return saved ? JSON.parse(saved) : { regime: 'SIMPLES', rate: 6 };
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    localStorage.setItem('clinify_tax_config', JSON.stringify(config));
  }, [config]);

  const calculateTax = () => {
    if (config.regime === 'MEI') return 75.00;
    return (revenue * (config.rate / 100));
  };

  const taxAmount = calculateTax();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-full relative overflow-hidden group transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-500/20">
                <Landmark className="w-5 h-5" />
            </div>
            <div>
                <h3 className="font-black text-slate-900 dark:text-white uppercase text-[10px] tracking-widest italic">Fiscal Pro</h3>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Provisão Tributária</p>
            </div>
        </div>
        <button 
          onClick={() => setIsEditing(!isEditing)} 
          className="text-slate-300 hover:text-indigo-600 transition-colors p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      {isEditing ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
          <div className="grid grid-cols-3 gap-1.5">
            {(['MEI', 'SIMPLES', 'PRESUMIDO'] as TaxRegime[]).map((r) => (
              <button
                key={r}
                onClick={() => setConfig({ ...config, regime: r, rate: r === 'MEI' ? 0 : (r === 'SIMPLES' ? 6 : 11.33) })}
                className={`py-2 text-[9px] font-black rounded-xl border-2 transition-all ${
                  config.regime === r 
                    ? 'bg-indigo-600 text-white border-indigo-600' 
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-transparent'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3">
            <Percent className="w-3.5 h-3.5 text-slate-400 mr-2" />
            <input 
              type="number" 
              value={config.rate}
              onChange={(e) => setConfig({ ...config, rate: parseFloat(e.target.value) || 0 })}
              className="w-full bg-transparent text-xs font-black text-slate-900 dark:text-white focus:outline-none"
            />
            <button onClick={() => setIsEditing(false)} className="ml-2 text-emerald-500 hover:scale-110 transition-transform"><Check className="w-4 h-4" /></button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between">
          <div>
             <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2">
               {formatCurrency(taxAmount)}
             </h2>
             <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                    Regime: {config.regime} ({config.rate}%)
                </span>
             </div>
          </div>

          <div className="mt-6 flex items-center gap-3 opacity-60">
             <ShieldCheck className="w-4 h-4 text-emerald-500" />
             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
               Auditado e Provisionado
             </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxWidget;
