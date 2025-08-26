
'use client';

import { useEffect, useState } from 'react';
import { Tag } from '../../types/resources';

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch(`http://localhost:3001/tags`);
        if (!response.ok) {
          throw new Error(`Failed to fetch tags`);
        }
  const result = await response.json();
  setTags(result?.data ?? []);
      } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  if (loading) {
    return <div className="text-center py-4">Loading tags...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">Error: {error}</div>;
  }

  if (tags.length === 0) {
    return <div className="text-center py-4">No tags found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 capitalize">Tags List</h1>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tags.map((tag) => (
          <li key={tag.id} className="bg-gray-800 p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">{tag.name}</h2>
            {tag.description && (
              <p className="text-gray-400 text-sm">
                <span className="font-medium">Description:</span> {tag.description}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
