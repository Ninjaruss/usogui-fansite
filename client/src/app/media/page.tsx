"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Media } from '@/types/resources';

export default function MediaPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'fanart' | 'video'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/media`);
      if (response.ok) {
        const data = await response.json();
        setMedia(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch media:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMedia = media.filter(item => {
    const matchesType = filter === 'all' || item.type === filter;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.character?.name && item.character.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (item.arc?.title && item.arc.title.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Fan Media</h1>
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Search media..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'fanart' | 'video')}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Media</option>
            <option value="fanart">Fanart</option>
            <option value="video">Videos</option>
          </select>
          <Link
            href="/media/submit"
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
          >
            Submit Media
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMedia.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="mb-4">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-lg font-semibold text-gray-900">{item.title}</h2>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  item.type === 'fanart'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {item.type}
                </span>
              </div>

              {item.character && (
                <p className="text-sm text-gray-600 mb-1">
                  Character: {item.character.name}
                </p>
              )}

              {item.arc && (
                <p className="text-sm text-gray-600 mb-3">
                  Arc: {item.arc.title}
                </p>
              )}

              <div className="mb-3">
                {item.type === 'video' ? (
                  <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">Video Preview</span>
                  </div>
                ) : (
                  <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">Image Preview</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>By: {item.submittedBy?.username || 'Unknown'}</span>
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex space-x-2">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
              >
                View {item.type === 'video' ? 'Video' : 'Image'}
              </a>
              <Link
                href={`/media/${item.id}`}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Details
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredMedia.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {searchTerm || filter !== 'all'
              ? 'No media found matching your criteria.'
              : 'No media available. Be the first to submit some!'}
          </p>
          <Link
            href="/media/submit"
            className="inline-block mt-4 px-6 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
          >
            Submit Your First Media
          </Link>
        </div>
      )}
    </div>
  );
}
