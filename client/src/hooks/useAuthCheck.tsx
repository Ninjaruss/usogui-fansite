"use client";

import { useEffect, useState } from 'react';
import authProvider from '@/lib/api/authProvider';

export default function useAuthCheck() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // authProvider.checkAuth expects a parameter in the AuthProvider type; pass an empty object
        // This will trigger token verification with the backend.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore-next-line
        await authProvider.checkAuth({});
        if (!mounted) return;
        setAuthenticated(true);
      } catch {
        if (!mounted) return;
        setAuthenticated(false);
      } finally {
        if (!mounted) return;
        setChecking(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  return { checking, authenticated };
}
