import { createContext, useContext, useState, type ReactNode } from 'react';
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

const MOCK_USER: User = {
  id: 'p1',
  full_name: 'Glory Simon',
  email: 'glory@glorysimon.com',
  role: 'Admin',
  created_date: '2025-01-01T00:00:00Z',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user] = useState<User | null>(MOCK_USER);
  const [isLoadingAuth] = useState(false);
  const [authError] = useState<{ type: string; message: string } | null>(null);

  const login = async (_email: string, _password: string) => {
    // Single admin: no-op since user is statically set
  };

  const logout = async () => {
    // Single admin: no-op
    window.location.href = '/';
  };

  const navigateToLogin = () => {
    window.location.href = '/';
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
