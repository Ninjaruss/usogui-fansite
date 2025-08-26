"use client";

import React, { useEffect, useState } from 'react';
import { dataProvider } from '@/lib/api/dataProvider';
import type { GetListResult } from 'react-admin';

export default function AdminDataProviderDebug() {
  const [result, setResult] = useState<GetListResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await dataProvider.getList('arcs', {
          pagination: { page: 1, perPage: 20 },
          sort: { field: 'id', order: 'ASC' },
          filter: {},
        });
        console.log('dataProvider.getList result:', res);
        setResult(res);
      } catch (e: unknown) {
        console.error('dataProvider.getList error:', e);
        setError(String(e));
      }
    })();
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h2>Admin dataProvider debug — arcs</h2>
      {error && (
        <div style={{ color: 'crimson' }}>
          <strong>Error:</strong>
          <pre>{error}</pre>
        </div>
      )}
      {result ? (
        <div>
          <h3>Result (printed in console too)</h3>
          <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 500, overflow: 'auto' }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}
