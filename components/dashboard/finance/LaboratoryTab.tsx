
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction } from '../../../types';
import { formatCurrency, formatCurrencyValue, parseCurrencyInput } from '../../../utils/formatters';
import { 
  FlaskConical, TrendingUp, TrendingDown, Target, 
  ArrowRight, Info, AlertTriangle, CheckCircle2, 
  Zap, Syringe, Plus, Trash2, Sparkles, 
  BarChart3, Settings2, Rocket, ShieldAlert,
  ArrowUpRight, ArrowDownRight, Wand2, Gauge,
  Coins, UserPlus, ShoppingBag
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine
} from 'recharts';

interface SimulationItem {
  id: string;
  description: string;
  amount: number;
  type: 'revenue' | 'expense';
}

interface Sensitivity {
  conversion: number; 
  avgTicket: number;  
  materialSavings: number; 
}

const LaboratoryTab: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  const [simulations, setSimulations] = useState<SimulationItem[]>([]);
  const [sensitivity, setSensitivity] = useState<Sensitivity>({
    conversion: 0,
    avgTicket: 0,
    materialSavings: 0
  });
  const [newAmountMasked, setNewAmountMasked] = useState('');

  const handleMaskedChange = (val: string, setter: (v: string) => void) => {
    const numericValue = val.replace(/\D/g, '');
    const floatValue = Number(numericValue) / 100;
    setter(formatCurrencyValue(floatValue));
  };

  const realStats = useMemo(() => {
    const revenue = transactions.filter(t => t.type === 'revenue').reduce((s, t) => s + t.amount, 0);
    const variableExpenses = transactions.filter(t => 
      t.type === 'expense' && 
      (t.category.toLowerCase().includes('insumo') || t.category.toLowerCase().includes('produto') || t.category.toLowerCase().includes('comiss'))
    ).reduce((s, t) => s + t.amount, 0);
    
    const fixedExpenses = transactions.filter(t => 
        t.type === 'expense' && 
        !(t.category.toLowerCase().includes('insumo') || t.category.toLowerCase().includes('produto') || t.category.toLowerCase().includes('comiss'))
    ).reduce((s, t) => s + t.amount, 0);

    const profit = revenue - (variableExpenses + fixedExpenses);
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    
    return { revenue, variableExpenses, fixedExpenses, profit, margin };
  }, [transactions]);

  const simStats = useMemo(() => {
    const boostRevenue = realStats.revenue * (1 + sensitivity.conversion / 100) * (1 + sensitivity.avgTicket / 100);
    const boostVariable = realStats.variableExpenses * (1 - sensitivity.materialSavings / 100) * (1 + sensitivity.conversion / 100);
    
    const simItemsRev = simulations.filter(s => s.type === 'revenue').reduce((s, t) => s + t.amount, 0);
    const simItemsExp = simulations.filter(s => s.type === 'expense').reduce((s, t) => s + t.amount, 0);

    const totalRev = boostRevenue + simItemsRev;
    const totalExp = boostVariable + realStats.fixedExpenses + simItemsExp;
    const profit = totalRev - totalExp;
    const margin = totalRev > 0 ? (profit / totalRev) * 100 : 0;

    return { 
        revenue: totalRev, 
        expenses: totalExp, 
        profit, 
        margin,
        deltaProfit: profit - realStats.profit
    };
  }, [realStats, simulations, sensitivity]);

  const applyScenario = (type: 'efficiency' | 'growth' | 'reset') => {
      if (type === 'reset') {
          setSensitivity({ conversion: 0, avgTicket: 0, materialSavings: 0 });
          setSimulations([]);
          return;
      }
      if (type === 'efficiency') {
          setSensitivity({ conversion: 5, avgTicket: 10, materialSavings: 15 });
      } else {
          setSensitivity({ conversion: 30, avgTicket: 5, materialSavings: 0 });
          if(!simulations.find(s => s.description.includes('Marketing'))) {
            setSimulations(prev => [...prev, { id: 'mkt', description: 'Investimento em Tráfego Pago', amount: 3000, type: 'expense' }]);
          }
      }
  };

  const addSimulatedItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = parseCurrencyInput(newAmountMasked);
    if(amount <= 0) return;

    const newItem: SimulationItem = {
      id: Date.now().toString(),
      description: (formData.get('desc') as string) || 'Novo Investimento',
      amount: amount,
      type: 'expense'
    };
    setSimulations([...simulations, newItem]);
    setNewAmountMasked('');
    (e.target as HTMLFormElement).reset();
  };

  const chartData = [
    { name: 'Atual', Lucro: realStats.profit, Faturamento: realStats.revenue },
    { name: 'Simulado', Lucro: simStats.profit, Faturamento: simStats.revenue }
  ];

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-700">
      
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-indigo-500/20 rounded-2xl backdrop-blur-md border border-indigo-400/30">
                    <Wand2 className="w-6 h-6 text-indigo-400" />
                </div>
                <h2 className="text-4xl font-black tracking-tighter italic">Comando de Futuro</h2>
            </div>
            <p className="text-slate-400 font-bold max-w-lg leading-relaxed">
               Teste decisões de investimento, contratação e precificação sem riscos. O Laboratório analisa o impacto real na sua margem líquida.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 relative z-10">
              <button onClick={() => applyScenario('efficiency')} className="px-6 py-4 bg-emerald-600/10 border border-emerald-500/30 text-emerald-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2"><Zap className="w-4 h-4" /> Otimizar Eficiência</button>
              <button onClick={() => applyScenario('growth')} className="px-6 py-4 bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2"><Rocket className="w-4 h-4" /> Escalar Clínica</button>
              <button onClick={() => applyScenario('reset')} className="px-6 py-4 bg-white/5 border border-white/10 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all">Resetar Simulação</button>
          </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-4 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-2"><Settings2 className="w-4 h-4 text-indigo-500" /> Variáveis de Sensibilidade</h3>
                  <div className="space-y-8">
                      <div className="space-y-4">
                          <div className="flex justify-between items-end"><label className="text-[10px] font-black uppercase text-slate-500">Taxa de Conversão</label><span className="text-lg font-black text-emerald-600">+{sensitivity.conversion}%</span></div>
                          <input type="range" min="0" max="100" step="5" className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-emerald-500" value={sensitivity.conversion} onChange={e => setSensitivity({...sensitivity, conversion: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-4">
                          <div className="flex justify-between items-end"><label className="text-[10px] font-black uppercase text-slate-500">Valor Médio (Ticket)</label><span className="text-lg font-black text-indigo-600">+{sensitivity.avgTicket}%</span></div>
                          <input type="range" min="0" max="50" step="1" className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-500" value={sensitivity.avgTicket} onChange={e => setSensitivity({...sensitivity, avgTicket: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-4">
                          <div className="flex justify-between items-end"><label className="text-[10px] font-black uppercase text-slate-500">Economia em Insumos</label><span className="text-lg font-black text-amber-600">{sensitivity.materialSavings}%</span></div>
                          <input type="range" min="0" max="30" step="1" className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-amber-500" value={sensitivity.materialSavings} onChange={e => setSensitivity({...sensitivity, materialSavings: Number(e.target.value)})} />
                      </div>
                  </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2"><Plus className="w-4 h-4 text-indigo-500" /> Lançar Investimento/Gasto</h3>
                  <form onSubmit={addSimulatedItem} className="space-y-4">
                      <input name="desc" placeholder="Ex: Novo laser, Contratação..." className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-5 text-sm font-bold focus:ring-2 focus:ring-indigo-500" />
                      <div className="relative">
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black">R$</span>
                          <input type="tel" placeholder="0,00" value={newAmountMasked} onChange={e => handleMaskedChange(e.target.value, setNewAmountMasked)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 pl-12 pr-5 text-xl font-black text-slate-900 dark:text-white" />
                      </div>
                      <button className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl">Aplicar ao Cenário</button>
                  </form>
                  <div className="mt-8 space-y-3">
                      {simulations.map(item => (
                          <div key={item.id} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 group">
                              <div className="min-w-0"><p className="font-bold text-slate-900 dark:text-white text-xs truncate">{item.description}</p><p className="text-[8px] font-black text-rose-500 uppercase">Impacto Direto</p></div>
                              <div className="flex items-center gap-3 shrink-0 ml-2"><span className="font-black text-rose-600">-{formatCurrency(item.amount)}</span><button onClick={() => setSimulations(simulations.filter(s => s.id !== item.id))} className="text-slate-300 hover:text-red-500 p-1"><Trash2 className="w-4 h-4"/></button></div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>

          <div className="xl:col-span-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-1000"><Coins className="w-32 h-32" /></div>
                      <p className="text-indigo-100 font-black text-[10px] uppercase tracking-widest mb-2">Novo Lucro Líquido Estimado</p>
                      <h2 className="text-6xl font-black tracking-tighter mb-8">{formatCurrency(simStats.profit)}</h2>
                      <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-2xl flex items-center gap-2 ${simStats.deltaProfit >= 0 ? 'bg-emerald-400/20 text-emerald-300' : 'bg-rose-400/20 text-rose-300'} font-black text-sm`}>
                              {simStats.deltaProfit >= 0 ? <ArrowUpRight className="w-5 h-5"/> : <ArrowDownRight className="w-5 h-5"/>}
                              {formatCurrency(Math.abs(simStats.deltaProfit))} vs Atual
                          </div>
                          <div className="p-3 bg-white/10 rounded-2xl text-white font-black text-sm border border-white/10">Margem: {simStats.margin.toFixed(1)}%</div>
                      </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                       <div className="flex justify-between items-start">
                          <div><h3 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest mb-1">Veredito do CFO</h3><p className="text-[10px] font-bold text-slate-400 uppercase">Qualidade do Cenário</p></div>
                          <div className={`p-3 rounded-2xl ${simStats.margin > 40 ? 'bg-emerald-50 text-emerald-600' : simStats.margin > 20 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>{simStats.margin > 40 ? <CheckCircle2 className="w-6 h-6"/> : <AlertTriangle className="w-6 h-6"/>}</div>
                       </div>
                       <div className="py-8">
                          <div className="flex justify-between text-[10px] font-black uppercase mb-3"><span className="text-slate-400">Risco</span><span className="text-slate-900 dark:text-white">{simStats.margin > 40 ? 'Mínimo' : simStats.margin > 20 ? 'Moderado' : 'Crítico'}</span></div>
                          <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1 p-1">
                             <div className={`h-full rounded-full transition-all duration-1000 ${simStats.margin > 15 ? 'bg-amber-400' : 'bg-slate-200'}`} style={{ width: '33%' }}></div>
                             <div className={`h-full rounded-full transition-all duration-1000 ${simStats.margin > 30 ? 'bg-emerald-500' : 'bg-slate-200'}`} style={{ width: '33%' }}></div>
                             <div className={`h-full rounded-full transition-all duration-1000 ${simStats.margin > 45 ? 'bg-indigo-600' : 'bg-slate-200'}`} style={{ width: '34%' }}></div>
                          </div>
                       </div>
                       <p className="text-sm font-bold text-slate-600 dark:text-slate-400 leading-relaxed">
                          {simStats.margin > 40 ? "Aprovado: Este cenário é altamente lucrativo e seguro para execução imediata." : 
                           simStats.margin > 20 ? "Cenário equilibrado: Exige controle rígido de custos fixos para não comprimir o lucro." : 
                           "Reprovado: A margem está muito baixa para a operação da estética. Sugerimos parcelar investimentos."}
                       </p>
                  </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex justify-between items-center mb-10">
                      <h3 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-500" /> Evolução de Valor Simulado</h3>
                      <div className="flex gap-4"><div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase"><div className="w-3 h-3 rounded-full bg-slate-200"></div> Realidade</div><div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase"><div className="w-3 h-3 rounded-full bg-indigo-600"></div> Simulação</div></div>
                  </div>
                  <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                              <defs><linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} />
                              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} tickFormatter={v => `R$${v/1000}k`} />
                              <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold'}} formatter={(value: number) => formatCurrency(value)} />
                              <Area type="monotone" dataKey="Lucro" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorProfit)" />
                              <Area type="monotone" dataKey="Faturamento" stroke="#e2e8f0" strokeWidth={2} strokeDasharray="5 5" fill="none" />
                          </AreaChart>
                      </ResponsiveContainer>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default LaboratoryTab;
