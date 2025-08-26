'use client';

import { useEffect, useState } from 'react';
import { Volume } from '../../types/resources';

export default function VolumesPage() {
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVolumes = async () => {
      try {
        const response = await fetch(`http://localhost:3001/volumes`);
        if (!response.ok) {
          throw new Error(`Failed to fetch volumes`);
        }
  const result = await response.json();
  setVolumes(result?.data ?? []);
      } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVolumes();
  }, []);

  if (loading) {
    return <div className="text-center py-4">Loading volumes...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">Error: {error}</div>;
  }

  if (volumes.length === 0) {
    return <div className="text-center py-4">No volumes found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 capitalize">Volumes List</h1>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {volumes.map((volume) => (
          <li key={volume.id} className="bg-gray-800 p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">Volume {volume.number}</h2>
            <p className="text-gray-400 text-sm">
              <span className="font-medium">Start Chapter:</span> {volume.startChapter}
            </p>
            <p className="text-gray-400 text-sm">
              <span className="font-medium">End Chapter:</span> {volume.endChapter}
              </p>
            {volume.description && (
              <p className="text-gray-400 text-sm">
                <span className="font-medium">Description:</span> {volume.description}
              </p>
            )}
            {volume.coverUrl && (
              <p className="text-gray-400 text-sm">
                <span className="font-medium">Cover URL:</span> <a href={volume.coverUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Link</a>
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}