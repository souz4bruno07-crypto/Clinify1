
import React from 'react';
import { AIAnalysisResult } from '../types';
import { BrainCircuit, TrendingUp, AlertTriangle, CheckCircle2, Megaphone, User, Stethoscope, RefreshCcw, CreditCard, Activity, Zap, Target } from 'lucide-react';

interface AIInsightsWidgetProps {
  analysis: AIAnalysisResult | null;
  loading: boolean;
  onRefresh: () => void;
}

const AIInsightsWidget: React.FC<AIInsightsWidgetProps> = ({ analysis, loading, onRefresh }) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-800 h-full flex flex-col items-center justify-center min-h-[400px]">
        <div className="relative mb-6">
           <div className="absolute inset-0 bg-indigo-500 rounded-full opacity-20 animate-ping"></div>
           <BrainCircuit className="w-16 h-16 text-indigo-600 relative z-10 animate-pulse" />
        </div>
        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">CFO Digital Auditing...</h3>
        <p className="mt-2 text-sm font-bold text-slate-400 animate-pulse uppercase tracking-widest">Processando regras de negócio e tendências</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-800 h-full flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-full mb-6">
           <BrainCircuit className="w-12 h-12 text-slate-300" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">Diagnóstico Inteligente</h3>
        <p className="text-sm text-slate-500 mb-8 max-w-xs mx-auto font-medium">Deixe a IA analisar seus números e identificar onde você está perdendo dinheiro.</p>
        <button onClick={onRefresh} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:opacity-90 transition-all shadow-xl active:scale-95">
           Gerar Auditoria de Fluxo
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      
      {/* KPIs Rápidos da IA */}
      <div className="bg-slate-900 dark:bg-slate-950 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><Zap className="w-24 h-24 text-amber-400" /></div>
         
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
                <h3 className="text-white font-black text-xl flex items-center gap-2 mb-1">
                    <BrainCircuit className="w-6 h-6 text-indigo-400" /> Diagnóstico CFO
                </h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{analysis.summary}</p>
            </div>
            <button onClick={onRefresh} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all text-white"><RefreshCcw className="w-5 h-5" /></button>
         </div>

         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/10">
            <div>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">ROI Marketing</p>
               <p className="text-lg font-black text-white">{analysis.kpis.marketingROI}</p>
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Custo Atend.</p>
               <p className="text-lg font-black text-white">{analysis.kpis.costPerVisit}</p>
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Dep. Cartão</p>
               <p className="text-lg font-black text-white">{analysis.kpis.cardDependency}</p>
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Top Profissional</p>
               <p className="text-lg font-black text-white truncate">{analysis.kpis.topProfessional}</p>
            </div>
         </div>
      </div>

      {/* Alertas Críticos e Oportunidades */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
            <Activity className="w-4 h-4 text-slate-400" />
            <h3 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest">Alertas de Gestão</h3>
        </div>

        {analysis.alerts.map((alert, idx) => (
          <div 
            key={idx} 
            className={`p-6 rounded-[2rem] border-2 shadow-sm flex flex-col md:flex-row gap-6 transition-all hover:translate-x-1 ${
              alert.type === 'critical' ? 'bg-rose-50 border-rose-100 dark:bg-rose-900/10' :
              alert.type === 'positive' ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10' :
              'bg-amber-50 border-amber-100 dark:bg-amber-900/10'
            }`}
          >
            <div className="shrink-0">
               {alert.type === 'critical' && <div className="bg-rose-600 p-3 rounded-2xl text-white shadow-lg"><AlertTriangle className="w-6 h-6" /></div>}
               {alert.type === 'positive' && <div className="bg-emerald-600 p-3 rounded-2xl text-white shadow-lg"><CheckCircle2 className="w-6 h-6" /></div>}
               {alert.type === 'warning' && <div className="bg-amber-500 p-3 rounded-2xl text-white shadow-lg"><Activity className="w-6 h-6" /></div>}
            </div>
            <div className="flex-1 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h4 className={`text-lg font-black tracking-tight ${
                   alert.type === 'critical' ? 'text-rose-900 dark:text-rose-300' :
                   alert.type === 'positive' ? 'text-emerald-900 dark:text-emerald-300' :
                   'text-amber-900 dark:text-amber-300'
                }`}>
                  {alert.title}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 font-bold leading-relaxed">{alert.message}</p>
              </div>
              
              <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 whitespace-nowrap shadow-sm ${
                 alert.type === 'critical' ? 'bg-white border-rose-200 text-rose-600' :
                 alert.type === 'positive' ? 'bg-white border-emerald-200 text-emerald-600' :
                 'bg-white border-amber-200 text-amber-600'
              } dark:bg-slate-800 dark:border-slate-700`}>
                 {alert.action}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIInsightsWidget;
