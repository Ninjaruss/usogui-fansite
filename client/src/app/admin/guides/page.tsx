
'use client';

import { useEffect, useState } from 'react';
import { getGuides } from '@/lib/api/guides';
import Link from 'next/link';
import { Guide } from '../../../types/resources';

export default function GuidesPage() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [meta, setMeta] = useState<{ total: number; page: number; totalPages: number } | null>(null);

  useEffect(() => {
    const fetchGuides = async () => {
      try {
        const res = await getGuides({ page, limit: 20 });
        setGuides(res.data);
        setMeta({ total: res.total, page: res.page, totalPages: res.totalPages });
      } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGuides();
  }, [page]);

  if (loading) {
    return <div className="text-center py-4">Loading guides...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">Error: {error}</div>;
  }

  if (!loading && guides.length === 0) {
    return <div className="text-center py-4">No guides found.</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Guides</h1>
        <Link href="/admin/guides/new" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Create Guide
        </Link>
      </div>
      <div className="bg-gray-800 rounded-lg shadow-md p-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left p-2">Title</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {guides.map((guide: Guide) => (
              <tr key={guide.id} className="border-b border-gray-700">
                <td className="p-2">{guide.title}</td>
                <td className="p-2">
                  <Link href={`/admin/guides/${guide.id}`} className="text-blue-400 hover:underline mr-4">
                    View
                  </Link>
                  <Link href={`/admin/guides/edit/${guide.id}`} className="text-yellow-400 hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-between items-center mt-4">
          <button className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={meta ? meta.page <= 1 : page <= 1}>Prev</button>
          <div className="text-sm text-gray-400">Page {meta ? meta.page : page} of {meta ? meta.totalPages : '...'}</div>
          <button className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50" onClick={() => setPage(p => p + 1)} disabled={meta ? meta.page >= meta.totalPages : false}>Next</button>
        </div>
      </div>
    </div>
  );
}
