import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContextAPI';
import { Lock, Mail, Loader2, ArrowRight, Sparkles, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { useReducedMotion } from '../hooks/useReducedMotion';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [view, setView] = useState<'login' | 'forgot_password'>('login');
  const [resetSuccess, setResetSuccess] = useState(false);
  
  const { signIn, resetPassword, user } = useAuth();
  const navigate = useNavigate();
  const isMounted = useRef(true);
  const prefersReducedMotion = useReducedMotion();

  // Verificar se há preferência salva de "lembrar de mim" e token no localStorage
  useEffect(() => {
    const savedRememberMe = localStorage.getItem('clinify_remember_me') === 'true';
    const storageType = localStorage.getItem('clinify_storage_type');
    
    // Se há token no localStorage, significa que o usuário marcou "lembrar de mim" anteriormente
    if (storageType === 'local' || savedRememberMe) {
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    if (user) {
       navigate('/');
    }
    return () => { isMounted.current = false; };
  }, [user, navigate]);

  // SEO: Título e meta description
  useEffect(() => {
    document.title = 'Login - Clinify | Acesse sua conta';
    
    // Atualizar meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'Faça login no Clinify e acesse o painel administrativo da sua clínica. Gestão financeira, pacientes e agendamentos em um só lugar.');
    
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { error } = await signIn(email, password, rememberMe);
      if (error) {
        if (isMounted.current) {
          setError(error.message);
          setIsSubmitting(false);
        }
      } else {
        // Salvar preferência do usuário
        if (rememberMe) {
          localStorage.setItem('clinify_remember_me', 'true');
        } else {
          localStorage.removeItem('clinify_remember_me');
        }
        navigate('/');
      }
    } catch (err) {
       if (isMounted.current) {
         setError("Ocorreu um erro inesperado. Tente novamente.");
         setIsSubmitting(false);
       }
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Por favor, digite seu e-mail.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const { error } = await resetPassword(email);
    if (isMounted.current) setIsSubmitting(false);
    if (error) {
      if (isMounted.current) setError(error.message);
    } else {
      if (isMounted.current) setResetSuccess(true);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans overflow-hidden">
      {/* Left Side - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-emerald-900 overflow-hidden items-center justify-center">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-800 via-emerald-900 to-slate-900"></div>
        
        {/* Animated Blobs */}
        <div className={`absolute top-0 right-0 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 ${prefersReducedMotion ? '' : 'animate-blob'}`}></div>
        <div className={`absolute bottom-0 left-0 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 ${prefersReducedMotion ? '' : 'animate-blob animation-delay-2000'}`}></div>
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 ${prefersReducedMotion ? '' : 'animate-blob animation-delay-4000'}`}></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        
        {/* Content */}
        <div className={`relative z-10 p-12 text-white max-w-lg ${prefersReducedMotion ? '' : 'animate-fade-in'}`}>
          <div className="flex items-center space-x-3 mb-12">
            <div className={`bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/20 ${prefersReducedMotion ? '' : 'animate-float'}`}>
              <Sparkles className="h-8 w-8 text-emerald-400" />
            </div>
            <span className="text-3xl font-black tracking-tighter">Clinify<span className="text-emerald-400">.</span></span>
          </div>
          
          <h2 className={`text-5xl font-black mb-6 leading-tight tracking-tight ${prefersReducedMotion ? '' : 'animate-slide-up'}`}>
            Gestão de elite para mentes brilhantes.
          </h2>
          
          <p className={`text-emerald-100/80 text-xl leading-relaxed ${prefersReducedMotion ? '' : 'animate-slide-up stagger-2'}`}>
            Organize o financeiro da sua clínica com a mesma precisão que você dedica aos seus pacientes.
          </p>

          {/* Stats Preview */}
          <div className={`mt-12 grid grid-cols-3 gap-4 ${prefersReducedMotion ? '' : 'animate-slide-up stagger-3'}`}>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <p className="text-3xl font-black text-emerald-400">+500</p>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Clínicas</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <p className="text-3xl font-black text-emerald-400">98%</p>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Satisfação</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <p className="text-3xl font-black text-emerald-400">24/7</p>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Suporte</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          
          {/* Mobile Logo */}
          <div className={`lg:hidden flex flex-col items-center mb-8 ${prefersReducedMotion ? '' : 'animate-scale-in'}`}>
            <div className="bg-emerald-600 p-3 rounded-2xl shadow-xl shadow-emerald-500/20 mb-4">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <span className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">
              Clinify<span className="text-emerald-500">.</span>
            </span>
          </div>

          {view === 'login' ? (
            <div className={prefersReducedMotion ? '' : 'animate-fade-in'}>
              <div className="text-center lg:text-left">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Bem-vindo de volta
                </h1>
                <p className="mt-2 text-slate-500 dark:text-slate-400">
                  Insira suas credenciais para acessar o painel administrativo.
                </p>
              </div>
              
              <form className="mt-10 space-y-6" onSubmit={handleLogin}>
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
                
                <div className="space-y-4">
                  {/* Email Input */}
                  <div className={prefersReducedMotion ? '' : 'animate-slide-up stagger-1'}>
                    <label htmlFor="login-email" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                      E-mail Corporativo
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" aria-hidden="true">
                        <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      </div>
                      <input
                        id="login-email"
                        type="email"
                        required
                        autoComplete="email"
                        className="block w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                        placeholder="doutora@suaclinica.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className={prefersReducedMotion ? '' : 'animate-slide-up stagger-2'}>
                    <label htmlFor="login-password" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                      Senha de Acesso
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" aria-hidden="true">
                        <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      </div>
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        className="block w-full pl-12 pr-12 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                        placeholder="••••••••"
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
                  </div>
                </div>

                {/* Remember & Forgot */}
                <div className={`flex items-center justify-between ${prefersReducedMotion ? '' : 'animate-slide-up stagger-3'}`}>
                  <label htmlFor="login-remember" className="flex items-center cursor-pointer group">
                    <input 
                      id="login-remember"
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <div className="w-5 h-5 rounded-lg border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-colors" aria-hidden="true">
                      <CheckCircle2 className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" />
                    </div>
                    <span className="ml-2 text-sm font-bold text-slate-500 dark:text-slate-400">Lembrar de mim</span>
                  </label>
                  <button 
                    type="button"
                    onClick={() => { setView('forgot_password'); setError(null); }}
                    className="text-sm font-bold text-emerald-600 hover:text-emerald-500 transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl shadow-emerald-500/20 text-sm font-black uppercase tracking-widest text-white bg-emerald-600 hover:bg-emerald-700 hover:shadow-2xl hover:-translate-y-0.5 focus:outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none active:scale-95 ${prefersReducedMotion ? '' : 'animate-slide-up stagger-4'}`}
                >
                  {isSubmitting ? (
                    <Loader2 className={`h-5 w-5 ${prefersReducedMotion ? '' : 'animate-spin'}`} />
                  ) : (
                    <span className="flex items-center gap-2">
                      Entrar no Painel <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </button>
              </form>

              <div className={`mt-8 text-center ${prefersReducedMotion ? '' : 'animate-slide-up stagger-5'}`}>
                <p className="text-sm font-medium text-slate-500">
                  Novo no Clinify?{' '}
                  <Link to="/signup" className="font-bold text-emerald-600 hover:text-emerald-500 transition-colors">
                    Criar conta gratuita
                  </Link>
                </p>
              </div>
            </div>
          ) : (
            <div className={prefersReducedMotion ? '' : 'animate-fade-in'}>
              <button 
                onClick={() => setView('login')} 
                className="mb-8 flex items-center text-sm font-bold text-slate-500 hover:text-emerald-600 transition-colors"
                aria-label="Voltar para o login"
              >
                <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" /> Voltar para o login
              </button>

              <div className="text-center lg:text-left mb-8">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Recuperar Senha</h1>
                <p className="mt-2 text-slate-500">Enviaremos um link seguro para você redefinir sua senha.</p>
              </div>

              {resetSuccess ? (
                <div className={`bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-[2.5rem] p-8 text-center ${prefersReducedMotion ? '' : 'animate-scale-in'}`}>
                  <div className={`w-16 h-16 bg-emerald-100 dark:bg-emerald-800 rounded-full flex items-center justify-center mx-auto mb-6 ${prefersReducedMotion ? '' : 'animate-bounce-subtle'}`}>
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">E-mail Enviado!</h3>
                  <p className="text-slate-500 text-sm mb-8">Verifique sua caixa de entrada para continuar.</p>
                  <button 
                    onClick={() => setView('login')} 
                    className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl hover:opacity-90 transition-all"
                    aria-label="Voltar para o login"
                  >
                    Voltar para Login
                  </button>
                </div>
              ) : (
                <form className="space-y-6" onSubmit={handleResetPassword}>
                  <div role="alert" aria-live="assertive" aria-atomic="true">
                    {error && (
                      <div className={`bg-rose-50 border border-rose-100 rounded-xl p-4 text-sm text-rose-600 font-bold ${prefersReducedMotion ? '' : 'animate-slide-down'}`}>{error}</div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="reset-email" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">E-mail Cadastrado</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" aria-hidden="true">
                        <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      </div>
                      <input
                        id="reset-email"
                        type="email"
                        required
                        autoComplete="email"
                        className="block w-full pl-12 px-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                        placeholder="nome@clinica.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center py-4 border border-transparent rounded-2xl shadow-xl shadow-emerald-500/20 text-sm font-black uppercase tracking-widest text-white bg-emerald-600 hover:bg-emerald-700 transition-all active:scale-95"
                  >
                    {isSubmitting ? <Loader2 className={`h-5 w-5 ${prefersReducedMotion ? '' : 'animate-spin'}`} /> : "Enviar Instruções"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
