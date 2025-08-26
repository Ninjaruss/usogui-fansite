
'use client';

import { useEffect, useState } from 'react';
import { Media } from '../../types/resources';

export default function MediaPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [meta, setMeta] = useState<{ total?: number; page?: number; perPage?: number; totalPages?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const response = await fetch(`http://localhost:3001/media`);
        if (!response.ok) {
          throw new Error(`Failed to fetch media`);
        }
  const result = await response.json();
  setMedia(result?.data ?? []);
  setMeta(result?.meta ?? null);
      } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, []);

  if (loading) {
    return <div className="text-center py-4">Loading media...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">Error: {error}</div>;
  }

  if (media.length === 0) {
    return <div className="text-center py-4">No media found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 capitalize">Media List</h1>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {media.map((item) => (
          <li key={item.id} className="bg-gray-800 p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">{item.url}</h2>
            <p className="text-gray-400 text-sm">
              <span className="font-medium">Type:</span> {item.type}
            </p>
            <p className="text-gray-400 text-sm">
              <span className="font-medium">Status:</span> {item.status}
            </p>
            {item.description && (
              <p className="text-gray-400 text-sm">
                <span className="font-medium">Description:</span> {item.description}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
