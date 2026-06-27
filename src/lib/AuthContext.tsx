import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from './supabase';
import type { User } from '@/types/entities';

interface AuthContextValue {
  user: User | null;
  isLoadingAuth: boolean;
  isLoadingPublicSettings: boolean;
  authError: { type: string; message: string } | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  navigateToLogin: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState<{ type: string; message: string } | null>(null);

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user && mounted) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('full_name, role, created_at')
            .eq('id', session.user.id)
            .maybeSingle();

          setUser({
            id: session.user.id,
            full_name: profile?.full_name || session.user.user_metadata?.full_name || 'Glory Simon',
            email: session.user.email || '',
            role: profile?.role || 'Admin',
            created_date: profile?.created_at || session.user.created_at || new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('Session restoration error:', err);
      } finally {
        if (mounted) {
          setIsLoadingAuth(false);
        }
      }
    }

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (session && session.user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name, role, created_at')
          .eq('id', session.user.id)
          .maybeSingle();

        setUser({
          id: session.user.id,
          full_name: profile?.full_name || session.user.user_metadata?.full_name || 'Glory Simon',
          email: session.user.email || '',
          role: profile?.role || 'Admin',
          created_date: profile?.created_at || session.user.created_at || new Date().toISOString(),
        });
      } else {
        setUser(null);
      }
      setIsLoadingAuth(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // 30-minute inactivity auto-logout
  useEffect(() => {
    if (!user) return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log('Inactivity timeout reached (30 minutes). Logging out...');
        logout();
      }, 30 * 60 * 1000);
    };

    resetTimer();

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    const handleActivity = () => {
      resetTimer();
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [user]);

  const login = async (emailOrUsername: string, password: string) => {
    setAuthError(null);
    setIsLoadingAuth(true);
    try {
      let email = emailOrUsername;
      if (emailOrUsername === 'admin123') {
        email = 'admin@glorysimon.com';
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data && data.user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name, role, created_at')
          .eq('id', data.user.id)
          .maybeSingle();

        setUser({
          id: data.user.id,
          full_name: profile?.full_name || data.user.user_metadata?.full_name || 'Glory Simon',
          email: data.user.email || '',
          role: profile?.role || 'Admin',
          created_date: profile?.created_at || data.user.created_at || new Date().toISOString(),
        });
      }
    } catch (err: any) {
      setAuthError({ type: 'invalid_credentials', message: err.message || 'Invalid login credentials' });
      throw err;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = async () => {
    setIsLoadingAuth(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setIsLoadingAuth(false);
      window.location.href = '/login';
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError,
      login,
      logout,
      navigateToLogin,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
