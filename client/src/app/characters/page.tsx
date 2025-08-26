
"use client";

import { useEffect, useState } from "react";
import { Character } from "../../types/resources";
import { getCharacters } from "@/lib/api/characters";

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [meta, setMeta] = useState<{ total: number; page: number; totalPages: number } | null>(null);

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const res = await getCharacters({ page, limit: 20 });
        setCharacters(res.data);
        setMeta({ total: res.total, page: res.page, totalPages: res.totalPages });
      } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        setError(err?.message || String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchCharacters();
  }, [page]);

  if (loading) return <div className="text-center py-4">Loading characters...</div>;
  if (error) return <div className="text-center py-4 text-red-500">Error: {error}</div>;
  if (characters.length === 0) return <div className="text-center py-4">No characters found.</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold capitalize">Characters List</h1>
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {characters.map((character) => (
          <li key={character.id} className="bg-gray-800 p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">{character.name}</h2>
            {character.description && (
              <p className="text-gray-400 text-sm">
                <span className="font-medium">Description:</span> {character.description}
              </p>
            )}
            {character.firstAppearanceChapter && (
              <p className="text-gray-400 text-sm">
                <span className="font-medium">First Appearance:</span> {character.firstAppearanceChapter}
              </p>
            )}
            {character.occupation && (
              <p className="text-gray-400 text-sm">
                <span className="font-medium">Occupation:</span> {character.occupation}
              </p>
            )}
          </li>
        ))}
      </ul>

      <div className="flex justify-between items-center mt-6">
        <button
          className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={meta ? meta.page <= 1 : page <= 1}
        >
          Prev
        </button>
        <div className="text-sm text-gray-400">Page {meta ? meta.page : page} of {meta ? meta.totalPages : '...'}</div>
        <button
          className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
          onClick={() => setPage(p => p + 1)}
          disabled={meta ? meta.page >= meta.totalPages : false}
        >
          Next
        </button>
      </div>
    </div>
  );
}
