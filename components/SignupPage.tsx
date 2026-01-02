import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContextAPI';
import { Lock, Mail, User as UserIcon, Building2, Loader2, Sparkles, ArrowRight, Eye, EyeOff, Check } from 'lucide-react';
import { Link } from 'react-router';
import { useReducedMotion } from '../hooks/useReducedMotion';

const SignupPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signUp } = useAuth();
  const prefersReducedMotion = useReducedMotion();

  // SEO: Título e meta description
  useEffect(() => {
    document.title = 'Criar Conta - Clinify | Teste Grátis por 14 Dias';
    
    // Atualizar meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'Crie sua conta no Clinify e comece a gerenciar sua clínica hoje. Teste grátis por 14 dias, sem cartão de crédito. Sistema completo de gestão para clínicas de estética.');
    
    // Garantir que a página seja indexada
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      document.head.appendChild(metaRobots);
    }
    metaRobots.setAttribute('content', 'index, follow');
    
    // Cleanup: restaurar valores padrão ao sair
    return () => {
      document.title = 'Clinify - Gestão Estética Inteligente';
    };
  }, []);

  // Password strength
  const passwordStrength = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const strengthScore = Object.values(passwordStrength).filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const { error } = await signUp(email, password, clinicName, name);
    if (error) {
      setError(error.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans overflow-hidden">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden items-center justify-center">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-800 to-emerald-900"></div>
        
        {/* Animated Blobs */}
        <div className={`absolute top-0 right-0 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 ${prefersReducedMotion ? '' : 'animate-blob'}`}></div>
        <div className={`absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 ${prefersReducedMotion ? '' : 'animate-blob animation-delay-2000'}`}></div>
        <div className={`absolute top-1/3 left-1/3 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 ${prefersReducedMotion ? '' : 'animate-blob animation-delay-4000'}`}></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        
        {/* Content */}
        <div className={`relative z-10 flex flex-col justify-center p-12 h-full text-white max-w-xl ${prefersReducedMotion ? '' : 'animate-fade-in'}`}>
          <div className="flex items-center space-x-3 mb-12">
            <div className={`bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/20 ${prefersReducedMotion ? '' : 'animate-float'}`}>
              <Sparkles className="h-8 w-8 text-emerald-400" />
            </div>
            <span className="text-3xl font-black tracking-tighter">Clinify<span className="text-emerald-400">.</span></span>
          </div>

          <div className="space-y-6">
            <h2 className={`text-5xl font-black leading-tight ${prefersReducedMotion ? '' : 'animate-slide-up'}`}>
              Gestão inteligente para sua clínica.
            </h2>
            <p className={`text-slate-300 text-xl leading-relaxed ${prefersReducedMotion ? '' : 'animate-slide-up stagger-2'}`}>
              Tenha controle total sobre suas receitas, despesas e lucratividade em um único lugar seguro.
            </p>
          </div>

          {/* Features */}
          <div className={`mt-12 space-y-4 ${prefersReducedMotion ? '' : 'animate-slide-up stagger-3'}`}>
            {[
              'Dashboard financeiro completo',
              'Gestão de pacientes e agenda',
              'CRM integrado com WhatsApp',
              'Relatórios e insights com IA'
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-slate-300 font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className={`lg:hidden flex items-center space-x-2 mb-8 justify-center ${prefersReducedMotion ? '' : 'animate-scale-in'}`}>
            <div className="bg-emerald-600 p-2 rounded-lg shadow-lg shadow-emerald-500/20">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">
              Clinify<span className="text-emerald-500">.</span>
            </span>
          </div>

          <div className={`text-center lg:text-left ${prefersReducedMotion ? '' : 'animate-fade-in'}`}>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Criar Conta</h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Preencha os dados abaixo para começar sua jornada.
            </p>
          </div>
          
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div role="alert" aria-live="assertive" aria-atomic="true">
              {error && (
                <div className={`bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-2xl p-4 flex items-center gap-3 ${prefersReducedMotion ? '' : 'animate-slide-down'}`}>
                  <div className="w-8 h-8 bg-rose-100 dark:bg-rose-900/30 rounded-lg flex items-center justify-center shrink-0" aria-hidden="true">
                    <span className="text-rose-600 text-lg">!</span>
                  </div>
                  <p className="text-sm text-rose-600 dark:text-rose-400 font-bold">{error}</p>
                </div>
              )}
            </div>
            
            {/* Name Input */}
            <div className={prefersReducedMotion ? '' : 'animate-slide-up stagger-1'}>
              <label htmlFor="signup-name" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Nome Completo</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" aria-hidden="true">
                  <UserIcon className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input
                  id="signup-name"
                  type="text"
                  required
                  autoComplete="name"
                  className="block w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            {/* Clinic Name Input */}
            <div className={prefersReducedMotion ? '' : 'animate-slide-up stagger-2'}>
              <label htmlFor="signup-clinic" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Nome da Clínica</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" aria-hidden="true">
                  <Building2 className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input
                  id="signup-clinic"
                  type="text"
                  required
                  autoComplete="organization"
                  className="block w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                  placeholder="Nome do seu negócio"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                />
              </div>
            </div>

            {/* Email Input */}
            <div className={prefersReducedMotion ? '' : 'animate-slide-up stagger-3'}>
              <label htmlFor="signup-email" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">E-mail</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" aria-hidden="true">
                  <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input
                  id="signup-email"
                  type="email"
                  required
                  autoComplete="email"
                  className="block w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                  placeholder="nome@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className={prefersReducedMotion ? '' : 'animate-slide-up stagger-4'}>
              <label htmlFor="signup-password" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Senha</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" aria-hidden="true">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  className="block w-full pl-12 pr-12 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                  placeholder="Crie uma senha forte"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <div className={`mt-3 space-y-2 ${prefersReducedMotion ? '' : 'animate-fade-in'}`} role="status" aria-live="polite">
                  <div className="flex gap-1" aria-hidden="true">
                    {[1, 2, 3, 4].map((i) => (
                      <div 
                        key={i} 
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i <= strengthScore 
                            ? strengthScore <= 2 ? 'bg-rose-500' : strengthScore === 3 ? 'bg-amber-500' : 'bg-emerald-500'
                            : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2" aria-label={`Força da senha: ${strengthScore <= 2 ? 'fraca' : strengthScore === 3 ? 'média' : 'forte'}`}>
                    {Object.entries(passwordStrength).map(([key, valid]) => (
                      <span 
                        key={key}
                        className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                          valid ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                        }`}
                      >
                        {key === 'length' && '8+ chars'}
                        {key === 'uppercase' && 'Maiúscula'}
                        {key === 'lowercase' && 'Minúscula'}
                        {key === 'number' && 'Número'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || strengthScore < 3}
              className={`w-full mt-4 flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-2xl shadow-xl shadow-emerald-500/20 text-sm font-black uppercase tracking-widest text-white bg-emerald-600 hover:bg-emerald-700 hover:shadow-2xl hover:-translate-y-0.5 focus:outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none active:scale-95 ${prefersReducedMotion ? '' : 'animate-slide-up stagger-5'}`}
            >
              {isSubmitting ? (
                <Loader2 className={`h-5 w-5 ${prefersReducedMotion ? '' : 'animate-spin'}`} />
              ) : (
                <>
                  Criar Minha Conta <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className={`mt-6 text-center ${prefersReducedMotion ? '' : 'animate-slide-up stagger-5'}`}>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Já tem uma conta?{' '}
              <Link
                to="/login"
                className="font-bold text-emerald-600 hover:text-emerald-500 transition-colors"
              >
                Entrar
              </Link>
            </p>
          </div>

          {/* Terms */}
          <p className={`text-center text-[10px] text-slate-400 font-medium ${prefersReducedMotion ? '' : 'animate-fade-in'}`}>
            Ao criar uma conta, você concorda com nossos{' '}
            <a href="#" className="text-emerald-600 hover:underline">Termos de Uso</a>
            {' '}e{' '}
            <a href="#" className="text-emerald-600 hover:underline">Política de Privacidade</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
