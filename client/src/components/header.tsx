
"use client";

import Link from 'next/link';
import { useUser } from '@/context/UserContext';

export default function Header() {
  const { user, authenticated, logout } = useUser();

  return (
    <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <Link href="/" className="text-xl font-bold">
        Usogui Fansite
      </Link>
      {authenticated && user ? (
        <nav className="flex items-center gap-4">
          <Link href="/admin" className="mr-4">Admin</Link>
          <Link href="/profile" className="mr-2">{user.username}</Link>
          <button onClick={() => logout()} className="bg-red-600 px-3 py-1 rounded">Logout</button>
        </nav>
      ) : (
        <nav>
          <Link href="/admin" className="mr-4">Admin</Link>
          <Link href="/login">Login</Link>
        </nav>
      )}
    </header>
  );
}
