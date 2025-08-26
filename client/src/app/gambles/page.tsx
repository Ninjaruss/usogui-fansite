
'use client';

import { useEffect, useState } from 'react';
import { Gamble } from '../../types/resources';

export default function GamblesPage() {
  const [gambles, setGambles] = useState<Gamble[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGambles = async () => {
      try {
        const response = await fetch(`http://localhost:3001/gambles`);
        if (!response.ok) {
          throw new Error(`Failed to fetch gambles`);
        }
  const result = await response.json();
  // expect { data: Gamble[], meta: { ... } }
  setGambles(result?.data ?? []);
      } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGambles();
  }, []);

  if (loading) {
    return <div className="text-center py-4">Loading gambles...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">Error: {error}</div>;
  }

  if (gambles.length === 0) {
    return <div className="text-center py-4">No gambles found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 capitalize">Gambles List</h1>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {gambles.map((gamble) => (
          <li key={gamble.id} className="bg-gray-800 p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">{gamble.name}</h2>
            <p className="text-gray-400 text-sm">
              <span className="font-medium">Rules:</span> {gamble.rules}
            </p>
            {gamble.winCondition && (
              <p className="text-gray-400 text-sm">
                <span className="font-medium">Win Condition:</span> {gamble.winCondition}
              </p>
            )}
            <p className="text-gray-400 text-sm">
              <span className="font-medium">Chapter ID:</span> {gamble.chapterId}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
