"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUserProfile, updateUserProfile, getAllQuotes, getAllGambles } from '../../lib/api/users';
import type { UserProfile, Quote, Gamble } from '../../lib/api/types';

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [gambles, setGambles] = useState<Gamble[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userProfile = await getCurrentUserProfile();
        setProfile(userProfile);
      } catch {
        setError('Failed to load profile');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    const loadQuotes = async () => {
      try {
        const quotesData = await getAllQuotes();
        setQuotes(quotesData);
      } catch (err) {
        console.error('Failed to load quotes:', err);
      }
    };

    const loadGambles = async () => {
      try {
        const gamblesData = await getAllGambles();
        setGambles(gamblesData);
      } catch (err) {
        console.error('Failed to load gambles:', err);
      }
    };

    loadProfile();
    loadQuotes();
    loadGambles();
  }, [router]);

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updates = {
        favoriteQuoteId: profile.favoriteQuoteId,
        favoriteGambleId: profile.favoriteGambleId,
      };

      const updatedProfile = await updateUserProfile(updates);
      setProfile(updatedProfile);
      setSuccess('Profile updated successfully!');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="bg-blue-600 px-6 py-4">
          <h1 className="text-2xl font-bold text-white">User Profile</h1>
          <p className="text-blue-100">Manage your account settings and preferences</p>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <p className="mt-1 text-sm text-gray-900">{profile.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{profile.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{profile.role}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Verified</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {profile.isEmailVerified ? '✅ Verified' : '❌ Not verified'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reading Progress</label>
                  <p className="mt-1 text-sm text-gray-900">Chapter {profile.userProgress}</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h2>
              <div className="space-y-4">
                {/* Favorite Quote */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Favorite Quote
                  </label>
                  <select
                    value={profile.favoriteQuoteId || ''}
                    onChange={(e) => setProfile({
                      ...profile,
                      favoriteQuoteId: e.target.value ? parseInt(e.target.value) : null
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a favorite quote...</option>
                    {quotes.map((quote) => (
                      <option key={quote.id} value={quote.id}>
                        &ldquo;{quote.text.substring(0, 50)}&hellip;&rdquo; - {quote.character.name}
                      </option>
                    ))}
                  </select>
                  {profile.favoriteQuote && (
                    <p className="mt-2 text-sm text-gray-600">
                      Current: &ldquo;{profile.favoriteQuote.text}&rdquo;
                    </p>
                  )}
                </div>

                {/* Favorite Gamble */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Favorite Gamble
                  </label>
                  <select
                    value={profile.favoriteGambleId || ''}
                    onChange={(e) => setProfile({
                      ...profile,
                      favoriteGambleId: e.target.value ? parseInt(e.target.value) : null
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a favorite gamble...</option>
                    {gambles.map((gamble) => (
                      <option key={gamble.id} value={gamble.id}>
                        {gamble.name}
                      </option>
                    ))}
                  </select>
                  {profile.favoriteGamble && (
                    <p className="mt-2 text-sm text-gray-600">
                      Current: {profile.favoriteGamble.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t">
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
            >
              Logout
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
