
'use client';

import { useEffect, useState } from 'react';
import { Chapter } from '../../types/resources';

export default function ChaptersPage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const response = await fetch(`http://localhost:3001/chapters`);
        if (!response.ok) {
          throw new Error(`Failed to fetch chapters`);
        }
  const result = await response.json();
  setChapters(result?.data ?? []);
      } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChapters();
  }, []);

  if (loading) {
    return <div className="text-center py-4">Loading chapters...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">Error: {error}</div>;
  }

  if (chapters.length === 0) {
    return <div className="text-center py-4">No chapters found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 capitalize">Chapters List</h1>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chapters.map((chapter) => (
          <li key={chapter.id} className="bg-gray-800 p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">{chapter.title || `Chapter ${chapter.number}`}</h2>
            <p className="text-gray-400 text-sm">
              <span className="font-medium">Number:</span> {chapter.number}
            </p>
            {chapter.summary && (
              <p className="text-gray-400 text-sm">
                <span className="font-medium">Summary:</span> {chapter.summary}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
