"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Gamble } from '@/types/resources';

export default function GamblesPage() {
  const [gambles, setGambles] = useState<Gamble[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchGambles();
  }, []);

  const fetchGambles = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/gambles`);
      if (response.ok) {
        const data = await response.json();
        setGambles(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch gambles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGambles = gambles.filter(gamble =>
    gamble.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (gamble.description && gamble.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gamble Information</h1>
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Search gambles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredGambles.map((gamble) => (
          <div key={gamble.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">{gamble.title}</h2>
                <p className="text-gray-600 mb-4">
                  {gamble.description || 'No description available.'}
                </p>
                <div className="flex space-x-4">
                  <Link
                    href={`/gambles/${gamble.id}`}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    View Details
                  </Link>
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                <p>Created: {new Date(gamble.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredGambles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {searchTerm ? 'No gambles found matching your search.' : 'No gamble information available.'}
          </p>
        </div>
      )}
    </div>
  );
}
