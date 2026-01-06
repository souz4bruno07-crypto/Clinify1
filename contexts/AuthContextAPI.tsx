import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import api from '../services/apiClient';
import { User, AuthState, UserRole } from '../types';

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  const cleanLocalSession = useCallback(() => {
    api.setTokens(null, null); // Limpa accessToken e refreshToken
    if (isMounted.current) setUser(null);
  }, []);

  const fetchUserProfile = useCallback(async () => {
    if (!isMounted.current) return;

    try {
      const userData = await api.get<User>('/auth/me');
      if (isMounted.current && userData) {
        console.log('[AuthContext] Perfil do usuário carregado:', userData);
        setUser(userData);
      }
    } catch (e: any) {
      console.error('[AuthContext] Erro ao buscar perfil:', e);
      // Só limpar sessão se o erro for 401 (não autorizado)
      // Outros erros (rede, timeout, etc) não devem limpar a sessão no mobile
      if (e?.status === 401 || e?.status === 403) {
        console.log('[AuthContext] Token inválido, limpando sessão');
        cleanLocalSession();
      } else {
        console.warn('[AuthContext] Erro ao buscar perfil, mas mantendo token:', e?.status || 'unknown');
        // Manter o token mesmo com erro, pode ser problema temporário de rede
      }
    }
  }, [cleanLocalSession]);

  useEffect(() => {
    isMounted.current = true;

    const initializeAuth = async () => {
      try {
        // Os tokens já são recuperados automaticamente no apiClient constructor
        const accessToken = api.getAccessToken();
        const refreshToken = api.getRefreshToken();
        const storageType = api.getStorageType();
        
        console.log('[AuthContext] Inicializando autenticação...', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          storageType: storageType || 'unknown'
        });
        
        if (accessToken) {
          try {
            await fetchUserProfile();
          } catch (e: any) {
            // Se for 401 e tiver refreshToken, tentar renovar
            if ((e?.status === 401 || e?.status === 403) && refreshToken) {
              try {
                await api.refreshAccessToken();
                // Tentar buscar perfil novamente
                await fetchUserProfile();
              } catch (refreshErr) {
                // Se refresh falhar, limpar sessão
                console.log('[AuthContext] Refresh token falhou, limpando sessão');
                cleanLocalSession();
              }
            } else if (e?.status === 401 || e?.status === 403) {
              // Token inválido e sem refresh token
              cleanLocalSession();
            } else {
              // Outros erros não devem limpar sessão
              console.error('[AuthContext] Erro ao inicializar perfil:', e);
            }
          }
        } else {
          console.log('[AuthContext] Nenhum token encontrado');
        }
      } catch (error) {
        console.error('[AuthContext] Erro na inicialização:', error);
      } finally {
        if (isMounted.current) {
          console.log('[AuthContext] Finalizando inicialização, loading = false');
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted.current = false;
    };
  }, [fetchUserProfile, cleanLocalSession]);

  const signIn = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const response = await api.post<{ user: User; accessToken: string; refreshToken: string } | { user: User; token: string }>('/auth/signin', { email, password });
      
      // Suporte para resposta antiga (token) e nova (accessToken + refreshToken)
      if ('accessToken' in response && 'refreshToken' in response) {
        // Nova resposta com refresh tokens
        api.setTokens(response.accessToken, response.refreshToken, rememberMe);
      } else if ('token' in response) {
        // Resposta antiga (compatibilidade)
        api.setToken(response.token, rememberMe);
      }
      
      setUser(response.user);
      
      return { error: null };
    } catch (err: any) {
      return { error: { message: err.message || 'Erro ao fazer login.' } };
    }
  };

  const signUp = async (email: string, password: string, clinicName: string, name: string) => {
    try {
      const response = await api.post<{ user: User; accessToken: string; refreshToken: string } | { user: User; token: string }>('/auth/signup', { 
        email, 
        password, 
        name, 
        clinicName 
      });
      
      // Suporte para resposta antiga (token) e nova (accessToken + refreshToken)
      if ('accessToken' in response && 'refreshToken' in response) {
        // Nova resposta com refresh tokens
        api.setTokens(response.accessToken, response.refreshToken, true);
      } else if ('token' in response) {
        // Resposta antiga (compatibilidade)
        api.setToken(response.token, true);
      }
      
      setUser(response.user);
      
      return { error: null };
    } catch (err: any) {
      return { error: { message: err.message || 'Erro ao cadastrar.' } };
    }
  };

  const signOut = async () => {
    if (isMounted.current) setLoading(true);
    
    try {
      // Tentar revogar tokens no backend
      const refreshToken = api.getRefreshToken();
      if (refreshToken) {
        try {
          await api.post('/auth/logout', { refreshToken });
        } catch (err) {
          // Ignorar erro no logout (pode ser que o token já esteja expirado)
          console.warn('[AuthContext] Erro ao revogar token no backend:', err);
        }
      }
    } catch (err) {
      // Ignorar erro
    }
    
    cleanLocalSession();
    if (isMounted.current) setLoading(false);
  };

  const resetPassword = async (email: string) => {
    try {
      await api.post('/auth/reset-password', { email });
      return { error: null };
    } catch (err: any) {
      return { error: { message: err.message } };
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;
    try {
      setUser(prev => prev ? { ...prev, onboardingCompleted: true } : null);
      await api.put('/auth/complete-onboarding');
    } catch (error) {
      // Erro silencioso - onboarding pode ser completado depois
    }
  };

  const updateUserRole = (role: UserRole) => {
    if (!user) return;
    setUser(prev => prev ? { ...prev, role } : null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, resetPassword, completeOnboarding, updateUserRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Durante hot reload do Vite, pode haver um momento onde o contexto não está disponível
    // Retornar um contexto padrão ao invés de lançar erro para evitar quebrar a aplicação
    if (import.meta.env.DEV) {
      console.warn('useAuth chamado fora do AuthProvider - retornando contexto padrão durante desenvolvimento');
      return {
        user: null,
        loading: true,
        signIn: async () => ({ error: { message: 'AuthProvider não disponível' } }),
        signUp: async () => ({ error: { message: 'AuthProvider não disponível' } }),
        signOut: async () => {},
        resetPassword: async () => ({ error: { message: 'AuthProvider não disponível' } }),
        completeOnboarding: async () => {},
        updateUserRole: () => {},
      };
    }
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


