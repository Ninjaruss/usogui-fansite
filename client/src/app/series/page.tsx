"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Series } from '@/types/resources';

export default function SeriesPage() {
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSeries();
  }, []);

  const fetchSeries = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/series`);
      if (response.ok) {
        const data = await response.json();
        setSeries(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch series:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Series Information</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {series.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">{item.title}</h2>
            <p className="text-gray-600 mb-4">
              {item.description || 'No description available.'}
            </p>

            <div className="flex justify-between items-center">
              <Link
                href={`/series/${item.id}`}
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                View Details
              </Link>
              <div className="text-sm text-gray-500">
                Created: {new Date(item.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {series.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No series information available.</p>
        </div>
      )}
    </div>
  );
}
