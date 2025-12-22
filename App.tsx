import React, { useState, useEffect } from 'react';
// Changed import from 'react-router-dom' to 'react-router' to fix exported member errors
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import OnboardingScreen from './components/OnboardingScreen';
import DashboardScreen from './components/DashboardScreen';
import { Loader2, AlertTriangle, Terminal, RefreshCw, WifiOff } from 'lucide-react';
import { isConfigured } from './supabaseClient';

// Componente visual para indicar status offline
const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="bg-slate-800 text-white text-xs font-bold text-center py-2 px-4 fixed top-0 left-0 right-0 z-[100] animate-in slide-in-from-top-full flex items-center justify-center gap-2 shadow-md">
      <WifiOff className="w-3 h-3" />
      <span>Modo Offline: Verificando conexão...</span>
    </div>
  );
};

const ConfigRequiredScreen: React.FC = () => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
    <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
      <div className="bg-yellow-500 p-6 flex items-center justify-center">
        <AlertTriangle className="w-12 h-12 text-white" />
      </div>
      <div className="p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Configuração Necessária</h2>
        <p className="text-slate-600 mb-6">
          O aplicativo não encontrou as chaves do Supabase. Para corrigir o erro "Invalid API Key", você precisa conectar seu banco de dados.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center">
            <Terminal className="w-4 h-4 mr-2" />
            Como resolver:
          </h3>
          <ol className="list-decimal list-inside text-sm text-slate-600 space-y-2">
            <li>Crie um arquivo chamado <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">.env</code> na raiz do projeto.</li>
            <li>Adicione suas chaves do Supabase (Settings &gt; API):</li>
          </ol>
          <pre className="mt-3 bg-slate-800 text-slate-50 p-3 rounded-lg text-xs overflow-x-auto">
{`VITE_SUPABASE_URL="sua-url-do-project-settings"
VITE_SUPABASE_ANON_KEY="sua-chave-anon-publica"`}
          </pre>
        </div>
        
        <p className="text-xs text-center text-slate-400">
          Após salvar o arquivo .env, reinicie o terminal (npm run dev).
        </p>
      </div>
    </div>
  </div>
);

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!user.onboardingCompleted) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (user) {
    return user.onboardingCompleted ? <Navigate to="/dashboard" replace /> : <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
};

// Custom Route wrapper to handle the Onboarding edge case better
const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
     return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>;
  }

  return (
    <Routes>
       <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
       <Route path="/signup" element={!user ? <SignupPage /> : <Navigate to="/" />} />
       <Route path="/onboarding" element={user && !user.onboardingCompleted ? <OnboardingScreen /> : <Navigate to="/" />} />
       <Route path="/dashboard/*" element={user ? (user.onboardingCompleted ? <DashboardScreen /> : <Navigate to="/onboarding" />) : <Navigate to="/login" />} />
       <Route path="/" element={user ? (user.onboardingCompleted ? <Navigate to="/dashboard" /> : <Navigate to="/onboarding" />) : <Navigate to="/login" />} />
    </Routes>
  );
}

const App: React.FC = () => {
  if (!isConfigured) {
    return <ConfigRequiredScreen />;
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <OfflineBanner />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;