"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Arc } from '@/types/resources';

export default function ArcsPage() {
  const [arcs, setArcs] = useState<Arc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchArcs();
  }, []);

  const fetchArcs = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/arcs`);
      if (response.ok) {
        const data = await response.json();
        setArcs(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch arcs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredArcs = arcs.filter(arc =>
    arc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (arc.description && arc.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Story Arcs</h1>
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Search arcs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <Link
            href="/arcs/submit"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Submit Arc
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {filteredArcs.map((arc) => (
          <div key={arc.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">{arc.title}</h2>
                <p className="text-gray-600 mb-4">
                  {arc.description || 'No description available.'}
                </p>
                {(arc.startChapter || arc.endChapter) && (
                  <p className="text-sm text-gray-500 mb-4">
                    Chapters: {arc.startChapter || '?'} - {arc.endChapter || '?'}
                  </p>
                )}
                <div className="flex space-x-4">
                  <Link
                    href={`/arcs/${arc.id}`}
                    className="text-green-600 hover:text-green-800 font-medium"
                  >
                    View Details
                  </Link>
                  <Link
                    href={`/media?arcId=${arc.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Media
                  </Link>
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                <p>Created: {new Date(arc.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredArcs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {searchTerm ? 'No arcs found matching your search.' : 'No arcs available.'}
          </p>
        </div>
      )}
    </div>
  );
}
