import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthUser, getMe, login as apiLogin, register as apiRegister, UserProfile } from '../api/auth';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    full_name: string;
    email: string;
    password: string;
    phone: string;
    city: string;
    role: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'autovaluai_token';

function parseJwtExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      return;
    }
    const exp = parseJwtExpiry(token);
    if (exp && Date.now() >= exp) {
      logout();
      return;
    }
    const profile = await getMe(token);
    setUser(profile);
  }, [token, logout]);

  useEffect(() => {
    (async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        await refreshUser();
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    })();
  }, [token, refreshUser, logout]);

  useEffect(() => {
    if (!token) return;
    const exp = parseJwtExpiry(token);
    if (!exp) return;
    const ms = exp - Date.now();
    if (ms <= 0) {
      logout();
      return;
    }
    const t = setTimeout(logout, ms);
    return () => clearTimeout(t);
  }, [token, logout]);

  const persistAuth = (data: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser({
      id: data.user_id,
      email: data.email,
      full_name: data.full_name,
      role: data.role,
      phone: '',
      city: '',
      created_at: new Date().toISOString(),
    });
  };

  const login = async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    persistAuth(data);
    await refreshUser();
  };

  const register = async (data: {
    full_name: string;
    email: string;
    password: string;
    phone: string;
    city: string;
    role: string;
  }) => {
    const res = await apiRegister(data);
    persistAuth(res);
    await refreshUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        refreshUser,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
