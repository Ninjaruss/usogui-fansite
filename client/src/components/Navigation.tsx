"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: string;
}

export default function Navigation() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const userString = localStorage.getItem('authUser');
    if (userString) {
      try {
        setUser(JSON.parse(userString));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('authUser');
        localStorage.removeItem('authToken');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setUser(null);
    router.push('/');
  };

  const isModeratorOrAdmin = user && (user.role === 'moderator' || user.role === 'admin');

  return (
    <header className="bg-white shadow-sm border-b">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Usogui Fansite
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/" className="text-gray-700 hover:text-gray-900 transition-colors">
              Home
            </Link>
            <Link href="/characters" className="text-gray-700 hover:text-gray-900 transition-colors">
              Characters
            </Link>
            <Link href="/arcs" className="text-gray-700 hover:text-gray-900 transition-colors">
              Arcs
            </Link>
            <Link href="/guides" className="text-gray-700 hover:text-gray-900 transition-colors">
              Guides
            </Link>
            <Link href="/media" className="text-gray-700 hover:text-gray-900 transition-colors">
              Media
            </Link>

            {user ? (
              <div className="flex items-center space-x-4">
                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <span>{user.username}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        href="/submit-guide"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Submit Guide
                      </Link>
                      <Link
                        href="/submit-media"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Submit Media
                      </Link>
                      {isModeratorOrAdmin && (
                        <Link
                          href="/admin"
                          className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/login" className="text-blue-600 hover:text-blue-800 transition-colors">
                  Login
                </Link>
                <Link href="/register" className="text-gray-700 hover:text-gray-900 transition-colors">
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t py-2">
            <div className="space-y-1">
              <Link href="/" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                Home
              </Link>
              <Link href="/characters" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                Characters
              </Link>
              <Link href="/arcs" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                Arcs
              </Link>
              <Link href="/guides" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                Guides
              </Link>
              <Link href="/media" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                Media
              </Link>

              {user ? (
                <>
                  <Link href="/profile" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                    Profile
                  </Link>
                  <Link href="/submit-guide" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                    Submit Guide
                  </Link>
                  <Link href="/submit-media" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                    Submit Media
                  </Link>
                  {isModeratorOrAdmin && (
                    <Link href="/admin" className="block px-3 py-2 text-red-600 hover:bg-red-50 rounded-md">
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="block px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md">
                    Login
                  </Link>
                  <Link href="/register" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
