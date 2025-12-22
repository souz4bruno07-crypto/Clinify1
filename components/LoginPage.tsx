
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail, Loader2, ArrowRight, Sparkles, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [view, setView] = useState<'login' | 'forgot_password'>('login');
  const [resetSuccess, setResetSuccess] = useState(false);
  
  const { signIn, resetPassword, user } = useAuth();
  const navigate = useNavigate();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    if (user) {
       navigate('/');
    }
    return () => { isMounted.current = false; };
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        if (isMounted.current) {
          setError(error.message);
          setIsSubmitting(false);
        }
      } else {
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
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Lado Esquerdo - Branding (Oculto em mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-emerald-900 overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-800 to-slate-900 opacity-90"></div>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        
        <div className="relative z-10 p-12 text-white max-w-lg">
          <div className="flex items-center space-x-3 mb-12">
            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/20">
              <Sparkles className="h-8 w-8 text-emerald-400" />
            </div>
            <span className="text-3xl font-bold tracking-tighter">Clinify<span className="text-emerald-500">.</span></span>
          </div>
          <h2 className="text-5xl font-bold mb-6 leading-tight tracking-tight">Gestão de elite para mentes brilhantes.</h2>
          <p className="text-emerald-100/80 text-xl leading-relaxed">
            Organize o financeiro da sua clínica com a mesma precisão que você dedica aos seus pacientes.
          </p>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* Logo Mobile */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="bg-emerald-600 p-3 rounded-2xl shadow-xl shadow-emerald-500/20 mb-4">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <span className="text-3xl font-bold tracking-tighter text-slate-900 dark:text-white">Clinify<span className="text-emerald-500">.</span></span>
          </div>

          {view === 'login' ? (
            <>
              <div className="text-center lg:text-left">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Bem-vindo de volta</h2>
                <p className="mt-2 text-slate-500 dark:text-slate-400">Insira suas credenciais para acessar o painel administrativo.</p>
              </div>
              
              <form className="mt-10 space-y-6" onSubmit={handleLogin}>
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl p-4 flex items-start">
                    <div className="text-sm text-red-600 dark:text-red-400 font-bold">{error}</div>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">E-mail Corporativo</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      </div>
                      <input
                        type="email"
                        required
                        className="block w-full pl-12 px-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                        placeholder="doutora@suaclinica.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Senha de Acesso</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      </div>
                      <input
                        type="password"
                        required
                        className="block w-full pl-12 px-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer group">
                    <input type="checkbox" className="hidden" />
                    <div className="h-5 w-5 rounded-lg border-2 border-slate-200 dark:border-slate-800 flex items-center justify-center group-hover:border-emerald-500 transition-colors">
                      <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500 opacity-0 transition-opacity"></div>
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

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl shadow-emerald-500/20 text-sm font-black uppercase tracking-widest text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-95"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin h-5 w-5" />
                  ) : (
                    <span className="flex items-center gap-2">
                      Entrar no Painel <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-sm font-medium text-slate-500">
                  Novo no Clinify?{' '}
                  <Link to="/signup" className="font-bold text-emerald-600 hover:text-emerald-500 transition-colors">
                    Criar conta gratuita
                  </Link>
                </p>
              </div>
            </>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <button onClick={() => setView('login')} className="mb-8 flex items-center text-sm font-bold text-slate-500 hover:text-emerald-600 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para o login
              </button>

              <div className="text-center lg:text-left mb-8">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Recuperar Senha</h2>
                <p className="mt-2 text-slate-500">Enviaremos um link seguro para você redefinir sua senha.</p>
              </div>

              {resetSuccess ? (
                <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-[2.5rem] p-8 text-center animate-in zoom-in-95">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">E-mail Enviado!</h3>
                  <p className="text-slate-500 text-sm mb-8">Verifique sua caixa de entrada para continuar.</p>
                  <button onClick={() => setView('login')} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl hover:opacity-90 transition-all">
                    Voltar para Login
                  </button>
                </div>
              ) : (
                <form className="space-y-6" onSubmit={handleResetPassword}>
                  {error && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600 font-bold">{error}</div>
                  )}

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">E-mail Cadastrado</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      </div>
                      <input
                        type="email"
                        required
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
                    className="w-full flex justify-center py-4 border border-transparent rounded-2xl shadow-xl shadow-emerald-500/20 text-sm font-black uppercase tracking-widest text-white bg-emerald-600 hover:bg-emerald-700 transition-all transform active:scale-95"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : "Enviar Instruções"}
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
