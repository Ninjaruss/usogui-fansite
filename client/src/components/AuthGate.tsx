"use client";

import React from 'react';
import useAuthCheck from '@/hooks/useAuthCheck';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { checking } = useAuthCheck();

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="loader mb-4" />
          <div className="text-gray-400">Verifying session...</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
