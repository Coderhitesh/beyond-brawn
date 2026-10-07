'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { adminApi } from '@/services/admin';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAdmin((await adminApi('/auth/me', { timeout: 12000 })).data.admin);
    } catch (e) {
      setAdmin(null);
      // 401 / 403 = simply not signed in. Anything else means the API or database could not be reached.
      if (e.status !== 401 && e.status !== 403) setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email, password) => {
    const res = await adminApi('/auth/login', { method: 'POST', body: { email, password } });
    setAdmin(res.data.admin);
    setError(null);
    return res.data.admin;
  }, []);
  const logout = useCallback(async () => {
    await adminApi('/auth/logout', { method: 'POST' }).catch(() => null);
    setAdmin(null);
  }, []);

  // can('orders.manage') or can('a', 'b') for "any of".
  const can = useCallback((...keys) => Boolean(admin && (admin.isSuperAdmin || keys.some((k) => admin.permissions.includes(k)))), [admin]);

  const value = useMemo(() => ({ admin, loading, error, login, logout, refresh, can }), [admin, loading, error, login, logout, refresh, can]);
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export const useAdmin = () => useContext(AdminAuthContext);
