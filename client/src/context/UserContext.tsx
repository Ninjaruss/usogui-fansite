"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import authProvider, { setToastShow } from '@/lib/api/authProvider';
import { useToasts } from '@/components/ToastProvider';

type User = { id: string; username: string; email?: string; role?: string } | null;

type UserContextValue = {
  user: User;
  authenticated: boolean;
  checking: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User>(null);
  const [checking, setChecking] = useState(true);

  const toasts = useToasts();
  useEffect(() => {
    let mounted = true;
    // Wire toast show function into authProvider so it can display toast messages
    try { setToastShow(toasts.show); } catch {}
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore-next-line
        await authProvider.checkAuth({});
        const raw = typeof window !== 'undefined' ? localStorage.getItem('authUser') : null;
        if (raw && mounted) setUser(JSON.parse(raw));
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setChecking(false);
      }
    })();
    return () => { mounted = false; };
  }, [toasts]);

  const login = async (username: string, password: string) => {
  // authProvider typing expects an arg; pass credentials
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore-next-line
  await authProvider.login({ username, password });
    const raw = typeof window !== 'undefined' ? localStorage.getItem('authUser') : null;
    if (raw) setUser(JSON.parse(raw));
  };

  const logout = async () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore-next-line
  await authProvider.logout({});
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, authenticated: !!user, checking, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}

export default UserContext;
