"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Guide } from '@/types/resources';

export default function GuidesPage() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/guides`);
      if (response.ok) {
        const data = await response.json();
        setGuides(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch guides:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGuides = guides.filter(guide =>
    guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guide.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Community Guides</h1>
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Search guides..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <Link
            href="/guides/create"
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            Create Guide
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredGuides.map((guide) => (
          <div key={guide.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-xl font-semibold text-gray-900">{guide.title}</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>👍 {guide.likes || 0}</span>
              </div>
            </div>

            <p className="text-gray-600 mb-4 line-clamp-3">
              {guide.content.substring(0, 200)}...
            </p>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                By: {guide.author?.username || 'Unknown'}
              </div>
              <div className="flex space-x-2">
                <Link
                  href={`/guides/${guide.id}`}
                  className="text-purple-600 hover:text-purple-800 font-medium"
                >
                  Read More
                </Link>
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-400">
              Created: {new Date(guide.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      {filteredGuides.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {searchTerm ? 'No guides found matching your search.' : 'No guides available. Be the first to create one!'}
          </p>
          <Link
            href="/guides/create"
            className="inline-block mt-4 px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            Create Your First Guide
          </Link>
        </div>
      )}
    </div>
  );
}
