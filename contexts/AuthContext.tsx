
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { User, AuthState, UserRole } from '../types';

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  const cleanLocalSession = useCallback(() => {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.error("Erro ao limpar sessão local:", e);
    }
    if (isMounted.current) setUser(null);
  }, []);

  const fetchUserProfile = useCallback(async (sessionUser: any) => {
    if (!isMounted.current) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', sessionUser.id)
        .single();

      if (data && !error) {
        if (isMounted.current) {
          setUser({
            id: data.id,
            email: data.email,
            name: data.name,
            clinicName: data.clinicName,
            clinicId: data.clinicId || data.id,
            onboardingCompleted: data.onboardingCompleted,
            role: data.role as UserRole,
            avatar_url: data.avatar_url
          });
        }
      }
    } catch (e) {
      console.error("Erro background fetchUserProfile:", e);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    let authListener: { subscription: { unsubscribe: () => void } } | null = null;

    const initializeAuth = async () => {
      const safetyTimeout = setTimeout(() => {
        if (isMounted.current && loading) {
          setLoading(false);
        }
      }, 3000);

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user) {
          const optimisticUser: User = {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.name || 'Usuário',
            clinicName: session.user.user_metadata?.clinicName || 'Minha Clínica',
            clinicId: session.user.user_metadata?.clinicId || session.user.id,
            onboardingCompleted: session.user.user_metadata?.onboardingCompleted !== false,
            role: (session.user.user_metadata?.role as UserRole) || 'admin'
          };
          
          if (isMounted.current) {
             setUser(optimisticUser);
             setLoading(false);
          }
          fetchUserProfile(session.user);
        } else {
          if (isMounted.current) {
            setUser(null);
            setLoading(false);
          }
        }
      } catch (error: any) {
        if (isMounted.current) {
          setUser(null);
          setLoading(false);
        }
      } finally {
        clearTimeout(safetyTimeout);
      }
    };

    initializeAuth();

    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted.current) return;
      if (event === 'SIGNED_OUT') {
        cleanLocalSession();
        setUser(null);
        setLoading(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
         if (session?.user) {
           fetchUserProfile(session.user);
         }
         setLoading(false);
      }
    });
    authListener = data;
    return () => {
      isMounted.current = false;
      if (authListener) authListener.subscription.unsubscribe();
    };
  }, [cleanLocalSession, fetchUserProfile]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error };
      if (data.session?.user) {
        fetchUserProfile(data.session.user);
      }
      return { error: null };
    } catch (err: any) {
      return { error: { message: err.message || 'Erro desconhecido.' } };
    }
  };

  const signUp = async (email: string, password: string, clinicName: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { name, clinicName, onboardingCompleted: false, role: 'admin' } }
      });
      if (data?.user && !error) {
         await supabase.from('users').insert([{
             id: data.user.id,
             email,
             name,
             clinicName,
             clinicId: data.user.id,
             onboardingCompleted: false,
             role: 'admin'
         }]);
         fetchUserProfile(data.user);
      }
      return { error };
    } catch (err: any) {
      return { error: { message: err.message || 'Erro ao cadastrar.' } };
    }
  };

  const signOut = async () => {
    if (isMounted.current) setLoading(true);
    try { await supabase.auth.signOut(); } catch (e) {}
    cleanLocalSession();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/` });
    return { error };
  };

  const completeOnboarding = async () => {
    if (!user) return;
    try {
      setUser(prev => prev ? { ...prev, onboardingCompleted: true } : null);
      await Promise.all([
         supabase.from('users').update({ onboardingCompleted: true }).eq('id', user.id),
         supabase.auth.updateUser({ data: { onboardingCompleted: true } })
      ]);
    } catch (error) {
      console.error("Erro onboarding update:", error);
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
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
