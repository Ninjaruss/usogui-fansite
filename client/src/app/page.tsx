"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: string;
}

export default function HomePage() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const userString = localStorage.getItem('authUser');
    if (userString) {
      try {
        setUser(JSON.parse(userString));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to the Usogui Fansite
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Your comprehensive resource for all things Usogui. Explore characters, story arcs,
          community guides, and fan-created content.
        </p>
        {user && (
          <p className="text-lg text-blue-600 mt-4">
            Welcome back, {user.username}!
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Characters</h2>
          <p className="text-gray-600 mb-4">
            Learn about all the characters in the Usogui universe, their backgrounds,
            abilities, and roles in the story.
          </p>
          <Link
            href="/characters"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Explore Characters
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Story Arcs</h2>
          <p className="text-gray-600 mb-4">
            Follow the progression of the story through detailed arc breakdowns
            and chapter summaries.
          </p>
          <Link
            href="/arcs"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            View Arcs
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Community Guides</h2>
          <p className="text-gray-600 mb-4">
            Read and contribute guides created by the community. Share your knowledge
            and help others understand the series.
          </p>
          <div className="space-y-2">
            <Link
              href="/guides"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              Browse Guides
            </Link>
            {user && (
              <Link
                href="/submit-guide"
                className="inline-flex items-center px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors ml-2"
              >
                Submit Guide
              </Link>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Fan Media</h2>
          <p className="text-gray-600 mb-4">
            Discover fanart, videos, and other media created by the Usogui community.
            Submit your own creations!
          </p>
          <div className="space-y-2">
            <Link
              href="/media"
              className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
            >
              View Media
            </Link>
            {user && (
              <Link
                href="/submit-media"
                className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors ml-2"
              >
                Submit Media
              </Link>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Series Information</h2>
          <p className="text-gray-600 mb-4">
            Get detailed information about volumes, chapters, and other series-related content.
          </p>
          <Link
            href="/series"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Explore Series
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Gamble Information</h2>
          <p className="text-gray-600 mb-4">
            Learn about the gambling mechanics and strategies used in the series.
          </p>
          <Link
            href="/gambles"
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            View Gambles
          </Link>
        </div>
      </div>

      {user ? (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Dashboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                >
                  Manage Profile
                </Link>
                <Link
                  href="/submit-guide"
                  className="block px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                >
                  Write a Guide
                </Link>
                <Link
                  href="/submit-media"
                  className="block px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                >
                  Submit Media
                </Link>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Account Info</h3>
              <div className="space-y-1 text-gray-600">
                <p><strong>Username:</strong> {user.username}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> {user.role}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Join the Community</h2>
          <p className="text-gray-600 mb-4">
            Create an account to contribute guides, submit media, and customize your profile with favorite quotes and gambles.
          </p>
          <div className="space-x-4">
            <Link
              href="/register"
              className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Account
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <p className="text-gray-600">Recent guides, media submissions, and updates will appear here.</p>
        </div>
      </div>
    </div>
  );
}
