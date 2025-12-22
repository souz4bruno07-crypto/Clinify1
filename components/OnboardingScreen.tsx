import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle2, Activity, TrendingUp, BarChart3, ChevronRight, Loader2 } from 'lucide-react';

const OnboardingScreen: React.FC = () => {
  const { user, completeOnboarding } = useAuth();
  const [step, setStep] = useState(1);
  const [finishing, setFinishing] = useState(false);

  const handleFinish = async () => {
    setFinishing(true);
    // 1. Marca como completo no DB e Contexto
    await completeOnboarding();
    
    // 2. Força um redirecionamento limpo para garantir que o Router/Estado atualize
    // Isso simula o "F5" que corrige o problema.
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-card overflow-hidden transition-all duration-500">
        {/* Progress Bar */}
        <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
            <div className={`h-1 w-12 rounded-full ${step >= 2 ? 'bg-brand-600' : 'bg-slate-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
          </div>
          <div className="text-sm font-medium text-slate-500">Guia de Configuração</div>
        </div>

        <div className="p-8 md:p-12">
          {step === 1 && (
            <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-24 h-24 bg-brand-50 rounded-full flex items-center justify-center mb-8 relative">
                 <div className="absolute inset-0 border-4 border-brand-100 rounded-full animate-pulse"></div>
                <CheckCircle2 className="w-12 h-12 text-brand-600" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-3">Ambiente Pronto</h1>
              <p className="text-slate-500 max-w-lg text-lg leading-relaxed">
                Configuramos com sucesso o ambiente seguro para <span className="font-semibold text-slate-800">{user?.clinicName}</span>. Seu banco de dados está pronto para o primeiro lançamento.
              </p>
              <button
                onClick={() => setStep(2)}
                className="mt-10 inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl shadow-lg shadow-brand-500/20 text-white bg-brand-600 hover:bg-brand-700 transition-all hover:-translate-y-1"
              >
                Continuar <ChevronRight className="ml-2 w-5 h-5" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-slate-900">Seu Painel Financeiro</h2>
                <p className="mt-2 text-slate-500">Veja o que você pode fazer com o Clinify</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="group p-6 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-brand-200 transition-all cursor-default">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Activity className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">Registrar Atividade</h3>
                  <p className="text-sm text-slate-500">Registre tratamentos, vendas de produtos e despesas operacionais em segundos.</p>
                </div>
                
                <div className="group p-6 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-brand-200 transition-all cursor-default">
                  <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">Análise de Lucro</h3>
                  <p className="text-sm text-slate-500">Visualize suas margens de lucro e fluxos de receita automaticamente.</p>
                </div>

                <div className="group p-6 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-brand-200 transition-all cursor-default">
                  <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">Insights de Dados</h3>
                  <p className="text-sm text-slate-500">Tome decisões de compra e equipe mais inteligentes baseadas em dados.</p>
                </div>
              </div>

              <div className="flex justify-center mt-12">
                <button
                  onClick={handleFinish}
                  disabled={finishing}
                  className="inline-flex items-center px-10 py-4 border border-transparent text-lg font-bold rounded-xl shadow-xl shadow-brand-500/25 text-white bg-brand-600 hover:bg-brand-700 transition-all hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {finishing ? <Loader2 className="animate-spin w-6 h-6 mr-2" /> : null}
                  Acessar Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingScreen;