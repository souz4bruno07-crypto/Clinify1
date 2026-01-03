import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthProvider, useAuth } from './contexts/AuthContextAPI';
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmDialogProvider } from './components/ui/ConfirmDialog';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import OnboardingScreen from './components/OnboardingScreen';
import DashboardScreen from './components/DashboardScreen';
import LandingPage from './components/LandingPage';
import PWAUpdateNotification from './components/PWAUpdateNotification';
import { Loader2, WifiOff, Server, RefreshCw } from 'lucide-react';
import { useReducedMotion } from './hooks/useReducedMotion';

// Componente para verificar se o backend está rodando
const BackendChecker: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const prefersReducedMotion = useReducedMotion();
  // O health check está em /health (sem /api), então precisamos da URL base
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  // Remover /api do final se existir, pois o health check não está em /api
  const baseUrl = apiUrl.replace(/\/api\/?$/, '') || 'http://localhost:3001';

  const checkBackend = async () => {
    try {
      const healthUrl = `${baseUrl}/health`;
      console.log('🔍 Verificando backend:', healthUrl);
      console.log('📋 VITE_API_URL:', import.meta.env.VITE_API_URL);
      console.log('📋 Base URL:', baseUrl);
      
      const response = await fetch(healthUrl, { 
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log('📡 Resposta do backend:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend online:', data);
        setBackendStatus('online');
      } else {
        console.error('❌ Backend retornou erro:', response.status, response.statusText);
        setBackendStatus('offline');
      }
    } catch (error) {
      console.error('❌ Erro ao conectar ao backend:', error);
      setBackendStatus('offline');
    }
  };

  useEffect(() => {
    checkBackend();
  }, []);

  if (backendStatus === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className={`w-8 h-8 text-emerald-600 ${prefersReducedMotion ? '' : 'animate-spin'}`} />
      </div>
    );
  }

  if (backendStatus === 'offline') {
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    const currentApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-red-500 p-6 flex items-center justify-center">
            <Server className="w-12 h-12 text-white" />
          </div>
          <div className="p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Backend Offline</h2>
            <p className="text-slate-600 mb-6">
              Não foi possível conectar ao servidor. Certifique-se de que o backend está rodando.
            </p>

            {isProduction ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">🔧 Configuração no Vercel:</h3>
                  <p className="text-xs text-slate-600 mb-2">
                    O backend precisa estar deployado e a variável <code className="bg-slate-200 px-1 rounded">VITE_API_URL</code> configurada.
                  </p>
                  <p className="text-xs text-slate-600 mb-3">
                    URL configurada atualmente: <code className="bg-slate-200 px-1 rounded break-all">{currentApiUrl}</code>
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">📋 Passos para resolver:</h3>
                  <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside">
                    <li>Deploy do backend no Vercel (ou outro serviço)</li>
                    <li>Configurar <code className="bg-slate-200 px-1 rounded">VITE_API_URL</code> no projeto do frontend no Vercel</li>
                    <li>Fazer redeploy do frontend</li>
                  </ol>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    📖 Consulte o arquivo <code className="bg-blue-100 px-1 rounded">RESOLVER_BACKEND_OFFLINE.md</code> para instruções detalhadas.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Como iniciar o backend localmente:</h3>
                <pre className="mt-3 bg-slate-800 text-slate-50 p-3 rounded-lg text-xs overflow-x-auto">
{`cd backend
npm install
npm run db:generate
npm run db:migrate
npm run dev`}
                </pre>
              </div>
            )}

            <button
              onClick={() => {
                setBackendStatus('checking');
                setTimeout(checkBackend, 500);
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  
  if (loading) {
     return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className={`w-8 h-8 text-emerald-600 ${prefersReducedMotion ? '' : 'animate-spin'}`} /></div>;
  }

  return (
    <Routes>
       <Route path="/landing" element={!user ? <LandingPage /> : <Navigate to="/dashboard" />} />
       <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" />} />
       <Route path="/signup" element={!user ? <SignupPage /> : <Navigate to="/dashboard" />} />
       <Route path="/onboarding" element={user && !user.onboardingCompleted ? <OnboardingScreen /> : <Navigate to="/dashboard" />} />
       <Route path="/dashboard/*" element={user ? (user.onboardingCompleted ? <DashboardScreen /> : <Navigate to="/onboarding" />) : <Navigate to="/landing" />} />
       <Route path="/" element={user ? (user.onboardingCompleted ? <Navigate to="/dashboard" /> : <Navigate to="/onboarding" />) : <LandingPage />} />
    </Routes>
  );
}

const App: React.FC = () => {
  return (
    <BackendChecker>
      <ToastProvider>
        <ConfirmDialogProvider>
          <AuthProvider>
            <BrowserRouter>
              <PWAUpdateNotification />
              <AppRoutes />
            </BrowserRouter>
          </AuthProvider>
        </ConfirmDialogProvider>
      </ToastProvider>
    </BackendChecker>
  );
};

export default App;
