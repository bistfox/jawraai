'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button asChild variant="outline">
          <Link href="/admin/login">Logout</Link>
        </Button>
      </div>
      <p>Welcome to the admin dashboard. More features coming soon!</p>
    </div>
  );
}
