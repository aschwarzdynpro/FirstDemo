import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import axios from 'axios';

export interface AuthUser {
  id: string;
  email: string;
  plan: 'free' | 'pro' | 'business';
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('token'),
    loading: true,
  });

  // Restore session from stored token
  const restoreSession = useCallback(async (token: string) => {
    try {
      const { data } = await axios.get<{ user: AuthUser }>('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setState({ user: data.user, token, loading: false });
    } catch {
      localStorage.removeItem('token');
      setState({ user: null, token: null, loading: false });
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('token');
    if (stored) {
      void restoreSession(stored);
    } else {
      setState((s) => ({ ...s, loading: false }));
    }
  }, [restoreSession]);

  const login = async (email: string, password: string) => {
    const { data } = await axios.post<{ token: string; user: AuthUser }>('/api/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setState({ user: data.user, token: data.token, loading: false });
  };

  const register = async (email: string, password: string) => {
    const { data } = await axios.post<{ token: string; user: AuthUser }>('/api/auth/register', { email, password });
    localStorage.setItem('token', data.token);
    setState({ user: data.user, token: data.token, loading: false });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setState({ user: null, token: null, loading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
