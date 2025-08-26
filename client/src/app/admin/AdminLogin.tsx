"use client";

import { Login } from 'react-admin';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import authProvider from '@/lib/api/authProvider';

export default function AdminLogin() {
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore-next-line
        await authProvider.checkAuth({});
        // ensure we have an identity stored (authProvider may refresh token but
        // only return a user if the refresh endpoint provided one)
        try {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore-next-line
          await authProvider.getIdentity();
          if (mounted) router.replace('/admin');
        } catch {
          // No identity available, fallthrough to show login UI
          if (mounted) setChecking(false);
        }
      } catch {
        if (mounted) setChecking(false);
      }
    })();
    return () => { mounted = false; };
  }, [router]);

  if (checking) return <div className="p-6">Checking session...</div>;

  return <Login />;
}
