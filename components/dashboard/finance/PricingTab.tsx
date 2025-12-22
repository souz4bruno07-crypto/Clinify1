
import React, { useState, useMemo } from 'react';
import { Transaction } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';
import { 
  Calculator, Clock, Syringe, TrendingUp, Info, 
  DollarSign, Percent, AlertCircle, CheckCircle2, 
  ArrowRight, Landmark, Tag, CreditCard
} from 'lucide-react';

interface PricingTabProps {
  transactions: Transaction[];
}

const PricingTab: React.FC<PricingTabProps> = ({ transactions }) => {
  const [hoursPerMonth, setHoursPerMonth] = useState(160);
  const [procedureMinutes, setProcedureMinutes] = useState(60);
  const [materialCost, setMaterialCost] = useState(0);
  const [desiredMargin, setDesiredMargin] = useState(30);
  const [taxes, setTaxes] = useState(6);
  const [commission, setCommission] = useState(0);
  const [cardFee, setCardFee] = useState(2.5);

  const fixedExpensesTotal = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense')
      .filter(t => {
          const cat = t.category.toLowerCase();
          const desc = t.description.toLowerCase();
          const isTax = cat.includes('imposto') || desc.includes('das') || cat.includes('taxa');
          const isVariable = cat.includes('insumo') || cat.includes('comiss') || cat.includes('produto');
          return !isTax && !isVariable;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const hourCost = fixedExpensesTotal / (hoursPerMonth || 1);
  const minuteCost = hourCost / 60;

  const results = useMemo(() => {
    const occupationCost = minuteCost * procedureMinutes;
    const directCost = occupationCost + materialCost;
    const totalDeductions = taxes + commission + desiredMargin + cardFee;
    const divisor = (100 - totalDeductions) / 100;
    const finalPrice = divisor > 0 ? directCost / divisor : 0;
    
    return {
        occupationCost, directCost, finalPrice,
        profitAmount: finalPrice * (desiredMargin / 100),
        taxAmount: finalPrice * (taxes / 100),
        commissionAmount: finalPrice * (commission / 100),
        cardFeeAmount: finalPrice * (cardFee / 100)
    };
  }, [minuteCost, procedureMinutes, materialCost, desiredMargin, taxes, commission, cardFee]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform"><Clock className="w-32 h-32" /></div>
              <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                      <Landmark className="w-5 h-5 text-indigo-200" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Seu Custo Operacional Real</span>
                  </div>
                  <h2 className="text-5xl font-black mb-6 tracking-tighter">{formatCurrency(hourCost)} <span className="text-lg font-medium opacity-70">/ hora clínica</span></h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl">
                          <p className="text-[10px] font-black uppercase mb-1 opacity-70">Despesas Fixas (Mês)</p>
                          <p className="text-xl font-bold">{formatCurrency(fixedExpensesTotal)}</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl">
                          <p className="text-[10px] font-black uppercase mb-1 opacity-70">Horas Produtivas/Mês</p>
                          <input type="number" className="bg-transparent border-none p-0 text-xl font-bold focus:ring-0 w-24" value={hoursPerMonth} onChange={(e) => setHoursPerMonth(Number(e.target.value))} />
                      </div>
                  </div>
              </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-3xl p-8 flex items-center">
              <div className="flex gap-4 items-start">
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-2xl"><Info className="w-6 h-6 text-amber-600" /></div>
                  <div>
                      <h4 className="font-black text-amber-800 dark:text-amber-300 uppercase text-xs tracking-widest mb-2">Ponto de Equilíbrio</h4>
                      <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed font-bold">O sistema usa suas despesas reais da DRE para calcular sua hora clínica. Agora incluímos taxas de cartão para máxima precisão.</p>
                  </div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                  <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800 uppercase text-sm tracking-widest"><Calculator className="w-5 h-5 text-emerald-500" /> Parâmetros</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tempo (Minutos)</label>
                          <div className="flex items-center gap-4">
                              <input type="range" min="15" max="240" step="15" className="flex-1 accent-emerald-500" value={procedureMinutes} onChange={e => setProcedureMinutes(Number(e.target.value))} />
                              <span className="w-16 text-right font-black text-slate-900 dark:text-white">{procedureMinutes}m</span>
                          </div>
                      </div>
                      <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Insumos (R$)</label>
                          <input type="number" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500" value={materialCost} onChange={e => setMaterialCost(Number(e.target.value))} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Lucro (%)</label><input type="number" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none font-black" value={desiredMargin} onChange={e => setDesiredMargin(Number(e.target.value))} /></div>
                          <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Imposto (%)</label><input type="number" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none font-black" value={taxes} onChange={e => setTaxes(Number(e.target.value))} /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Taxa Cartão (%)</label><input type="number" className="w-full px-4 py-3 bg-blue-50 dark:bg-blue-900/10 text-blue-600 rounded-xl border-none font-black" value={cardFee} onChange={e => setCardFee(Number(e.target.value))} /></div>
                          <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Comissão (%)</label><input type="number" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none font-black" value={commission} onChange={e => setCommission(Number(e.target.value))} /></div>
                      </div>
                  </div>
              </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border-2 border-emerald-500 shadow-xl shadow-emerald-500/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10"><Tag className="w-24 h-24 text-emerald-600" /></div>
                  <p className="text-slate-500 font-black text-xs uppercase tracking-widest mb-1">Preço Sugerido</p>
                  <h1 className="text-7xl font-black text-emerald-600 tracking-tighter mb-10">{formatCurrency(results.finalPrice)}</h1>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-100 dark:border-slate-800 pt-8">
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl"><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Seu Lucro</p><p className="text-sm font-black text-emerald-600">{formatCurrency(results.profitAmount)}</p></div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl"><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Impostos</p><p className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(results.taxAmount)}</p></div>
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl"><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Cartão</p><p className="text-sm font-black text-amber-600">{formatCurrency(results.cardFeeAmount)}</p></div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl"><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Custos Dir.</p><p className="text-sm font-black text-red-500">{formatCurrency(results.directCost)}</p></div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default PricingTab;
