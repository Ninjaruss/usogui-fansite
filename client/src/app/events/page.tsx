
'use client';

import { useEffect, useState } from 'react';
import { Event } from '../../types/resources';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [meta, setMeta] = useState<{ total?: number; page?: number; perPage?: number; totalPages?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`http://localhost:3001/events`);
        if (!response.ok) {
          throw new Error(`Failed to fetch events`);
        }
  const result = await response.json();
  setEvents(result?.data ?? []);
  setMeta(result?.meta ?? null);
      } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return <div className="text-center py-4">Loading events...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">Error: {error}</div>;
  }

  if (events.length === 0) {
    return <div className="text-center py-4">No events found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 capitalize">Events List</h1>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <li key={event.id} className="bg-gray-800 p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">{event.title}</h2>
            <p className="text-gray-400 text-sm">
              <span className="font-medium">Type:</span> {event.type}
            </p>
            <p className="text-gray-400 text-sm">
              <span className="font-medium">Start Chapter:</span> {event.startChapter}
            </p>
            {event.endChapter && (
              <p className="text-gray-400 text-sm">
                <span className="font-medium">End Chapter:</span> {event.endChapter}
              </p>
            )}
            <p className="text-gray-400 text-sm">
              <span className="font-medium">Verified:</span> {event.isVerified ? 'Yes' : 'No'}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
