import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiLogin, apiLogout, apiMe, apiSignup, getToken } from '../api/client';
import type { MeResponse } from '../api/client';

export type User = {
  id?: number | string;
  email?: string;
  name?: string; // display name (real name)
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (input: { email: string; password: string }) => Promise<void>;
  signup: (input: { name: string; email: string; password: string; successCode?: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'auth_cached_user_v1';

function toUser(me: MeResponse | null | undefined): User | null {
  if (!me) return null;
  return {
    id: me.id,
    email: me.email,
    name: (me.realName as string) || (me.name as string) || me.email || '사용자',
  };
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);

  const persist = useCallback((u: User | null) => {
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const me = await apiMe();
      const u = toUser(me);
      setUser(u);
      persist(u);
    } catch {
      setUser(null);
      persist(null);
    } finally {
      setLoading(false);
    }
  }, [persist]);

  const login = useCallback(async (input: { email: string; password: string }) => {
    await apiLogin(input);
    await refresh();
  }, [refresh]);

  const signup = useCallback(async (input: { name: string; email: string; password: string; successCode?: string }) => {
    await apiSignup(input);
    await refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    persist(null);
  }, [persist]);

  useEffect(() => {
    // On mount, if we have cached user, still validate with api/me to ensure session is valid
    const token = getToken();
    if (token) {
      refresh();
    } else {
      setLoading(false);
    }
  }, [refresh]);

  const value = useMemo<AuthContextValue>(() => ({ user, loading, refresh, login, signup, logout }), [user, loading, refresh, login, signup, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
