import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import api from '../services/apiClient';
import { User, AuthState, UserRole } from '../types';

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  const cleanLocalSession = useCallback(() => {
    api.setToken(null); // Isso limpa ambos localStorage e sessionStorage
    if (isMounted.current) setUser(null);
  }, []);

  const fetchUserProfile = useCallback(async () => {
    if (!isMounted.current) return;

    try {
      const userData = await api.get<User>('/auth/me');
      if (isMounted.current && userData) {
        setUser(userData);
      }
    } catch (e) {
      cleanLocalSession();
    }
  }, [cleanLocalSession]);

  useEffect(() => {
    isMounted.current = true;

    const initializeAuth = async () => {
      // O token já é recuperado automaticamente no apiClient constructor
      // baseado no tipo de storage usado originalmente
      const token = api.getToken();
      
      if (token) {
        try {
          await fetchUserProfile();
        } catch (e) {
          cleanLocalSession();
        }
      }
      
      if (isMounted.current) {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted.current = false;
    };
  }, [fetchUserProfile, cleanLocalSession]);

  const signIn = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const response = await api.post<{ user: User; token: string }>('/auth/signin', { email, password });
      
      // Salva o token no storage apropriado baseado em rememberMe
      // rememberMe = true: localStorage (persiste 30 dias)
      // rememberMe = false: sessionStorage (expira ao fechar navegador)
      api.setToken(response.token, rememberMe);
      setUser(response.user);
      
      return { error: null };
    } catch (err: any) {
      return { error: { message: err.message || 'Erro ao fazer login.' } };
    }
  };

  const signUp = async (email: string, password: string, clinicName: string, name: string) => {
    try {
      const response = await api.post<{ user: User; token: string }>('/auth/signup', { 
        email, 
        password, 
        name, 
        clinicName 
      });
      
      api.setToken(response.token);
      setUser(response.user);
      
      return { error: null };
    } catch (err: any) {
      return { error: { message: err.message || 'Erro ao cadastrar.' } };
    }
  };

  const signOut = async () => {
    if (isMounted.current) setLoading(true);
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


