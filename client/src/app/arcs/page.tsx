
'use client';

import { useEffect, useState } from 'react';
import { Arc } from '../../types/resources';

export default function ArcsPage() {
  const [arcs, setArcs] = useState<Arc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArcs = async () => {
      try {
        const response = await fetch(`http://localhost:3001/arcs`);
        if (!response.ok) {
          throw new Error(`Failed to fetch arcs`);
        }
  const result = await response.json();
  setArcs(result?.data ?? []);
      } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchArcs();
  }, []);

  if (loading) {
    return <div className="text-center py-4">Loading arcs...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">Error: {error}</div>;
  }

  if (arcs.length === 0) {
    return <div className="text-center py-4">No arcs found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 capitalize">Arcs List</h1>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {arcs.map((arc) => (
          <li key={arc.id} className="bg-gray-800 p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">{arc.name}</h2>
            <p className="text-gray-400 text-sm">
              <span className="font-medium">Order:</span> {arc.order}
            </p>
            {arc.description && (
              <p className="text-gray-400 text-sm">
                <span className="font-medium">Description:</span> {arc.description}
              </p>
            )}
            {arc.startChapter && (
              <p className="text-gray-400 text-sm">
                <span className="font-medium">Start Chapter:</span> {arc.startChapter}
              </p>
            )}
            {arc.endChapter && (
              <p className="text-gray-400 text-sm">
                <span className="font-medium">End Chapter:</span> {arc.endChapter}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
