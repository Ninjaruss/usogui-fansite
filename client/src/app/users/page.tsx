
'use client';

import { useEffect, useState } from 'react';
import { User } from '../../types/resources';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`http://localhost:3001/users`);
        if (!response.ok) {
          throw new Error(`Failed to fetch users`);
        }
  const result = await response.json();
  setUsers(result?.data ?? []);
      } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return <div className="text-center py-4">Loading users...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">Error: {error}</div>;
  }

  if (users.length === 0) {
    return <div className="text-center py-4">No users found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 capitalize">Users List</h1>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <li key={user.id} className="bg-gray-800 p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">{user.username}</h2>
            <p className="text-gray-400 text-sm">
              <span className="font-medium">Email:</span> {user.email}
            </p>
            <p className="text-gray-400 text-sm">
              <span className="font-medium">Role:</span> {user.role}
            </p>
            <p className="text-gray-400 text-sm">
              <span className="font-medium">Email Verified:</span> {user.isEmailVerified ? 'Yes' : 'No'}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
