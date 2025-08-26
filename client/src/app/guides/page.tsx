
'use client';

import { useEffect, useState } from 'react';
import { Guide } from '../../types/resources';

export default function GuidesPage() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [meta, setMeta] = useState<{ total?: number; page?: number; perPage?: number; totalPages?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGuides = async () => {
      try {
        const response = await fetch(`http://localhost:3001/guides`);
        if (!response.ok) {
          throw new Error(`Failed to fetch guides`);
        }
  const result = await response.json();
  setGuides(result?.data ?? []);
  setMeta(result?.meta ?? null);
      } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGuides();
  }, []);

  if (loading) {
    return <div className="text-center py-4">Loading guides...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">Error: {error}</div>;
  }

  if (guides.length === 0) {
    return <div className="text-center py-4">No guides found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 capitalize">Guides List</h1>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {guides.map((guide) => (
          <li key={guide.id} className="bg-gray-800 p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">{guide.title}</h2>
            <p className="text-gray-400 text-sm">
              <span className="font-medium">Status:</span> {guide.status}
            </p>
            <p className="text-gray-400 text-sm">
              <span className="font-medium">Views:</span> {guide.viewCount}
            </p>
            <p className="text-gray-400 text-sm">
              <span className="font-medium">Likes:</span> {guide.likeCount}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
