"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';

export default function ProfilePage() {
  const { user, authenticated, checking } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!checking && !authenticated) {
      router.replace('/login');
    }
  }, [checking, authenticated, router]);

  if (checking) return <div className="p-4">Checking authentication...</div>;
  if (!authenticated || !user) return null;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <div className="bg-gray-800 p-4 rounded">
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role}</p>
      </div>
    </div>
  );
}
