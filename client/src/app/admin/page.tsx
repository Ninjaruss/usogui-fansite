"use client";

import dynamic from 'next/dynamic';

// Dynamically import AdminApp to avoid SSR issues with react-admin
const AdminApp = dynamic(() => import('./AdminApp'), {
  ssr: false,
});

export default function AdminPage() {
  return <AdminApp />;
}
