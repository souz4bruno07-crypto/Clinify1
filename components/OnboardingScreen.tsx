import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContextAPI';
import { 
  CheckCircle2, 
  Activity, 
  TrendingUp, 
  BarChart3, 
  ChevronRight, 
  Loader2,
  Sparkles,
  Users,
  Calendar,
  MessageSquare,
  Brain,
  Zap,
  PieChart,
  ArrowRight,
  Wallet,
  Target,
  Bell
} from 'lucide-react';

// Preview Components
const DashboardPreview = () => (
  <div className="relative w-full max-w-md mx-auto">
    {/* Mock Dashboard Card */}
    <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-white/50 text-xs font-medium">Receita Mensal</p>
            <p className="text-white text-xl font-black">R$ 48.250</p>
          </div>
        </div>
        <div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
          +12.5%
        </div>
      </div>
      
      {/* Chart Mock */}
      <div className="h-24 flex items-end gap-1">
        {[40, 65, 45, 80, 55, 90, 70, 95, 60, 85, 75, 100].map((height, i) => (
          <div 
            key={i} 
            className="flex-1 bg-gradient-to-t from-emerald-500/60 to-emerald-400/40 rounded-t-sm transition-all duration-500"
            style={{ 
              height: `${height}%`,
              animationDelay: `${i * 100}ms`,
              animation: 'slideUp 0.5s ease-out forwards'
            }}
          />
        ))}
      </div>
      
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mt-6">
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-white">156</p>
          <p className="text-[10px] text-white/50 font-medium">Pacientes</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-emerald-400">89%</p>
          <p className="text-[10px] text-white/50 font-medium">Margem</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-white">24</p>
          <p className="text-[10px] text-white/50 font-medium">Hoje</p>
        </div>
      </div>
    </div>
    
    {/* Floating Cards */}
    <div className="absolute -top-4 -right-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-3 shadow-xl animate-float">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-emerald-400" />
        <span className="text-white text-xs font-bold">Lucro +23%</span>
      </div>
    </div>
    
    <div className="absolute -bottom-4 -left-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-3 shadow-xl animate-float animation-delay-2000">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-purple-400" />
        <span className="text-white text-xs font-bold">32 atendimentos</span>
      </div>
    </div>
  </div>
);

const PatientsPreview = () => (
  <div className="relative w-full max-w-md mx-auto">
    <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 shadow-2xl">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-400" />
          <span className="text-white font-bold">Dezembro 2025</span>
        </div>
        <div className="flex gap-1">
          <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-white/50 text-xs">&lt;</div>
          <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-white/50 text-xs">&gt;</div>
        </div>
      </div>
      
      {/* Mini Calendar */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
          <div key={i} className="text-center text-[10px] text-white/40 font-bold py-1">{day}</div>
        ))}
        {Array.from({ length: 31 }, (_, i) => (
          <div 
            key={i} 
            className={`text-center text-xs py-1.5 rounded-lg transition-all ${
              i === 22 
                ? 'bg-emerald-500 text-white font-bold' 
                : i === 18 || i === 25 
                  ? 'bg-purple-500/30 text-purple-300' 
                  : 'text-white/60 hover:bg-white/10'
            }`}
          >
            {i + 1}
          </div>
        ))}
      </div>
      
      {/* Appointments */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">MA</div>
          <div className="flex-1">
            <p className="text-white font-bold text-sm">Maria Andrade</p>
            <p className="text-white/50 text-xs">Limpeza + Clareamento</p>
          </div>
          <span className="text-emerald-400 text-xs font-bold">09:00</span>
        </div>
        <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">JS</div>
          <div className="flex-1">
            <p className="text-white font-bold text-sm">João Silva</p>
            <p className="text-white/50 text-xs">Consulta de Retorno</p>
          </div>
          <span className="text-emerald-400 text-xs font-bold">10:30</span>
        </div>
      </div>
    </div>
    
    {/* Floating notification */}
    <div className="absolute -top-3 right-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-3 shadow-xl animate-float">
      <div className="flex items-center gap-2">
        <Bell className="w-4 h-4 text-amber-400" />
        <span className="text-white text-xs font-bold">3 confirmações</span>
      </div>
    </div>
  </div>
);

const AIPreview = () => (
  <div className="relative w-full max-w-md mx-auto">
    <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 shadow-2xl">
      {/* Chat Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-white font-bold">Assistente IA</p>
          <p className="text-emerald-400 text-xs font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Online
          </p>
        </div>
      </div>
      
      {/* Chat Messages */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="bg-white/10 rounded-2xl rounded-tl-sm p-3 max-w-[80%]">
            <p className="text-white/90 text-sm">Olá! Analisei seus dados do mês. Você teve um aumento de 23% nas receitas comparado ao mês anterior! 🎉</p>
          </div>
        </div>
        
        <div className="flex gap-3 justify-end">
          <div className="bg-emerald-500/30 rounded-2xl rounded-tr-sm p-3 max-w-[80%]">
            <p className="text-white/90 text-sm">Quais procedimentos mais lucrativos?</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="bg-white/10 rounded-2xl rounded-tl-sm p-3 max-w-[80%]">
            <p className="text-white/90 text-sm">Top 3: Implantes (42% margem), Clareamento (38%), e Ortodontia (35%).</p>
          </div>
        </div>
      </div>
      
      {/* Input */}
      <div className="mt-6 flex gap-2">
        <div className="flex-1 bg-white/5 rounded-xl px-4 py-3 text-white/40 text-sm">
          Pergunte algo...
        </div>
        <button className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
          <ArrowRight className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
    
    {/* Floating insight */}
    <div className="absolute -bottom-4 -left-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-3 shadow-xl animate-float animation-delay-2000">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-amber-400" />
        <span className="text-white text-xs font-bold">Insight gerado!</span>
      </div>
    </div>
  </div>
);

const FinalPreview = () => (
  <div className="relative w-full max-w-md mx-auto">
    <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-2xl text-center">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center animate-bounce-subtle">
        <CheckCircle2 className="w-10 h-10 text-white" />
      </div>
      
      <h3 className="text-2xl font-black text-white mb-2">Tudo Pronto!</h3>
      <p className="text-white/60 text-sm mb-6">Seu painel está configurado e pronto para uso.</p>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white/5 rounded-xl p-4">
          <Target className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
          <p className="text-white font-bold text-sm">Metas</p>
          <p className="text-white/50 text-xs">Configuradas</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4">
          <PieChart className="w-6 h-6 text-purple-400 mx-auto mb-2" />
          <p className="text-white font-bold text-sm">Relatórios</p>
          <p className="text-white/50 text-xs">Disponíveis</p>
        </div>
      </div>
      
      {/* Checklist */}
      <div className="space-y-2 text-left">
        {['Ambiente seguro criado', 'Dashboard financeiro ativo', 'IA configurada'].map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">{item}</span>
          </div>
        ))}
      </div>
    </div>
    
    {/* Floating celebration */}
    <div className="absolute -top-4 right-8 text-4xl animate-float">🎉</div>
    <div className="absolute -bottom-2 left-8 text-3xl animate-float animation-delay-2000">✨</div>
  </div>
);

// Step data
const steps = [
  {
    id: 1,
    title: 'Ambiente Configurado',
    subtitle: 'Seu espaço seguro está pronto',
    description: 'Configuramos com sucesso o ambiente seguro para sua clínica. Seu banco de dados está pronto para o primeiro lançamento.',
    icon: CheckCircle2,
    color: 'emerald',
    preview: DashboardPreview,
    features: [
      { icon: Activity, title: 'Registrar Atividade', desc: 'Tratamentos, vendas e despesas em segundos' },
      { icon: TrendingUp, title: 'Análise de Lucro', desc: 'Visualize margens automaticamente' },
      { icon: BarChart3, title: 'Insights de Dados', desc: 'Decisões inteligentes baseadas em dados' },
    ]
  },
  {
    id: 2,
    title: 'Painel Financeiro',
    subtitle: 'Controle total das suas finanças',
    description: 'Acompanhe receitas, despesas e lucros em tempo real. Visualize gráficos e métricas importantes para o sucesso da sua clínica.',
    icon: Wallet,
    color: 'blue',
    preview: DashboardPreview,
    features: [
      { icon: PieChart, title: 'Gráficos Dinâmicos', desc: 'Visualize seus dados de forma clara' },
      { icon: TrendingUp, title: 'Projeções', desc: 'Previsões baseadas em histórico' },
      { icon: Target, title: 'Metas', desc: 'Defina e acompanhe seus objetivos' },
    ]
  },
  {
    id: 3,
    title: 'Gestão de Pacientes',
    subtitle: 'Organize sua agenda e relacionamentos',
    description: 'Gerencie pacientes, agenda e relacionamentos em um só lugar. Integração com WhatsApp para comunicação eficiente.',
    icon: Users,
    color: 'purple',
    preview: PatientsPreview,
    features: [
      { icon: Calendar, title: 'Agenda Inteligente', desc: 'Organize seus atendimentos' },
      { icon: MessageSquare, title: 'CRM Integrado', desc: 'WhatsApp e comunicações' },
      { icon: Users, title: 'Fichas Completas', desc: 'Histórico e prontuários' },
    ]
  },
  {
    id: 4,
    title: 'Assistente de IA',
    subtitle: 'Insights automáticos para você',
    description: 'Nossa IA analisa seus dados e oferece insights valiosos. Pergunte qualquer coisa sobre sua clínica e receba respostas instantâneas.',
    icon: Brain,
    color: 'amber',
    preview: AIPreview,
    features: [
      { icon: Brain, title: 'Análise Inteligente', desc: 'IA que entende seu negócio' },
      { icon: Zap, title: 'Insights Automáticos', desc: 'Sugestões proativas' },
      { icon: Sparkles, title: 'Chat Natural', desc: 'Converse como com um consultor' },
    ]
  },
];

const OnboardingScreen: React.FC = () => {
  const { user, completeOnboarding } = useAuth();
  const [step, setStep] = useState(1);
  const [finishing, setFinishing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  const currentStep = steps[step - 1];
  const totalSteps = steps.length;
  const isLastStep = step === totalSteps;

  const handleNext = () => {
    if (isAnimating) return;
    setDirection('next');
    setIsAnimating(true);
    setTimeout(() => {
      setStep(prev => Math.min(prev + 1, totalSteps));
      setIsAnimating(false);
    }, 300);
  };

  const handlePrev = () => {
    if (isAnimating || step === 1) return;
    setDirection('prev');
    setIsAnimating(true);
    setTimeout(() => {
      setStep(prev => Math.max(prev - 1, 1));
      setIsAnimating(false);
    }, 300);
  };

  const handleFinish = async () => {
    setFinishing(true);
    await completeOnboarding();
    window.location.href = '/';
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; gradient: string; border: string }> = {
      emerald: { bg: 'bg-emerald-500', text: 'text-emerald-400', gradient: 'from-emerald-400 to-teal-500', border: 'border-emerald-500/30' },
      blue: { bg: 'bg-blue-500', text: 'text-blue-400', gradient: 'from-blue-400 to-indigo-500', border: 'border-blue-500/30' },
      purple: { bg: 'bg-purple-500', text: 'text-purple-400', gradient: 'from-purple-400 to-pink-500', border: 'border-purple-500/30' },
      amber: { bg: 'bg-amber-500', text: 'text-amber-400', gradient: 'from-amber-400 to-orange-500', border: 'border-amber-500/30' },
    };
    return colors[color] || colors.emerald;
  };

  const colorClasses = getColorClasses(currentStep.color);
  const PreviewComponent = currentStep.preview;

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans overflow-hidden">
      {/* Left Side - Preview (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden items-center justify-center">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 transition-all duration-700"></div>
        
        {/* Animated Blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        
        {/* Preview Content */}
        <div className={`relative z-10 w-full max-w-lg px-8 transition-all duration-500 ${
          isAnimating 
            ? direction === 'next' 
              ? 'opacity-0 translate-x-8' 
              : 'opacity-0 -translate-x-8'
            : 'opacity-100 translate-x-0'
        }`}>
          <PreviewComponent />
        </div>
        
        {/* Step Indicator on Preview */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (i + 1 !== step && !isAnimating) {
                  setDirection(i + 1 > step ? 'next' : 'prev');
                  setIsAnimating(true);
                  setTimeout(() => {
                    setStep(i + 1);
                    setIsAnimating(false);
                  }, 300);
                }
              }}
              className={`transition-all duration-300 rounded-full ${
                i + 1 === step 
                  ? 'w-8 h-2 bg-emerald-400' 
                  : i + 1 < step 
                    ? 'w-2 h-2 bg-emerald-400/50 hover:bg-emerald-400/70' 
                    : 'w-2 h-2 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Right Side - Content */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-lg space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center space-x-2 mb-8 justify-center animate-scale-in">
            <div className="bg-emerald-600 p-2 rounded-lg shadow-lg shadow-emerald-500/20">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">
              Clinify<span className="text-emerald-500">.</span>
            </span>
          </div>

          {/* Progress Bar */}
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Passo {step} de {totalSteps}
              </span>
              <span className="text-xs font-bold text-emerald-600">
                {Math.round((step / totalSteps) * 100)}% completo
              </span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className={`transition-all duration-500 ${
            isAnimating 
              ? direction === 'next' 
                ? 'opacity-0 translate-x-8' 
                : 'opacity-0 -translate-x-8'
              : 'opacity-100 translate-x-0'
          }`}>
            {/* Icon & Title */}
            <div className="text-center lg:text-left mb-8">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${colorClasses.gradient} mb-6 shadow-lg`}>
                <currentStep.icon className="w-8 h-8 text-white" />
              </div>
              
              <p className={`text-sm font-bold ${colorClasses.text} uppercase tracking-widest mb-2`}>
                {currentStep.subtitle}
              </p>
              
              <h1 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
                {currentStep.title}
              </h1>
              
              <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">
                {currentStep.description}
                {step === 1 && user?.clinicName && (
                  <span className="font-bold text-slate-700 dark:text-slate-300"> {user.clinicName}</span>
                )}
              </p>
            </div>

            {/* Features */}
            <div className="grid gap-4 mb-8">
              {currentStep.features.map((feature, i) => (
                <div 
                  key={i}
                  className={`group flex items-start gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all hover:shadow-lg hover:-translate-y-0.5`}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses.gradient} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">{feature.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Preview */}
            <div className="lg:hidden mb-8 scale-90 origin-top">
              <PreviewComponent />
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-4">
            {step > 1 && (
              <button
                onClick={handlePrev}
                disabled={isAnimating}
                className="px-6 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:border-slate-300 dark:hover:border-slate-600 transition-all hover:-translate-y-0.5 disabled:opacity-50"
              >
                Voltar
              </button>
            )}
            
            {isLastStep ? (
              <button
                onClick={handleFinish}
                disabled={finishing || isAnimating}
                className="flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-2xl shadow-xl shadow-emerald-500/20 text-white bg-emerald-600 hover:bg-emerald-700 hover:shadow-2xl hover:-translate-y-0.5 font-black uppercase tracking-widest transition-all disabled:opacity-70 disabled:cursor-not-allowed active:scale-95"
              >
                {finishing ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  <>
                    Acessar Dashboard <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={isAnimating}
                className="flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-2xl shadow-xl shadow-emerald-500/20 text-white bg-emerald-600 hover:bg-emerald-700 hover:shadow-2xl hover:-translate-y-0.5 font-bold transition-all disabled:opacity-50 active:scale-95"
              >
                Continuar <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Skip option */}
          {!isLastStep && (
            <div className="text-center">
              <button
                onClick={handleFinish}
                disabled={finishing}
                className="text-sm font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                {finishing ? 'Finalizando...' : 'Pular introdução'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -30px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(30px, 10px) scale(1.05); }
        }
        
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-blob {
          animation: blob 8s ease-in-out infinite;
        }
        
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        
        .animate-scale-in {
          animation: scaleIn 0.5s ease-out forwards;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default OnboardingScreen;