import React, { useEffect, useState } from 'react';
import { RefreshCw, X, Download, Wifi, WifiOff } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAUpdateNotification: React.FC = () => {
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineNotification, setShowOfflineNotification] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Detectar atualizações do Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nova versão disponível
                setShowUpdateNotification(true);
              }
            });
          }
        });
      });

      // Escutar mensagens do SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'CACHE_UPDATED') {
          setShowUpdateNotification(true);
        }
      });
    }

    // Detectar prompt de instalação
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Mostrar prompt de instalação após 30 segundos de uso
      setTimeout(() => setShowInstallPrompt(true), 30000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detectar status de conexão
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineNotification(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      // PWA instalado com sucesso
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  return (
    <>
      {/* Notificação de Atualização */}
      {showUpdateNotification && (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 z-[9999] animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-5 shadow-2xl shadow-indigo-500/30">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-xl shrink-0">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-black text-sm uppercase tracking-wider mb-1">Nova Versão Disponível</h4>
                <p className="text-xs text-white/80 mb-4">
                  Uma atualização está pronta. Recarregue para obter as últimas melhorias.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdate}
                    className="flex-1 bg-white text-indigo-600 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-white/90 transition-colors"
                  >
                    Atualizar Agora
                  </button>
                  <button
                    onClick={() => setShowUpdateNotification(false)}
                    className="p-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prompt de Instalação */}
      {showInstallPrompt && deferredPrompt && (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 z-[9999] animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shrink-0">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider mb-1">Instalar Clinify</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Instale o app para acesso rápido e experiência offline.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleInstall}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider hover:opacity-90 transition-opacity shadow-lg"
                  >
                    Instalar App
                  </button>
                  <button
                    onClick={() => setShowInstallPrompt(false)}
                    className="p-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notificação Offline */}
      {showOfflineNotification && (
        <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[9999] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-amber-500 text-white rounded-2xl p-4 shadow-2xl shadow-amber-500/30">
            <div className="flex items-center gap-3">
              <WifiOff className="w-5 h-5 shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-sm">Você está offline</p>
                <p className="text-xs text-white/80">Algumas funções podem estar limitadas.</p>
              </div>
              <button
                onClick={() => setShowOfflineNotification(false)}
                className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Indicador Online (quando volta) */}
      {isOnline && !showOfflineNotification && (
        <div className="fixed top-4 right-4 z-[9998]">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-bold">
            <Wifi className="w-3 h-3" />
            <span className="hidden sm:inline">Online</span>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAUpdateNotification;


