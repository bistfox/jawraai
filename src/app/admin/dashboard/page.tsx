'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirestore } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { SubscriptionRequest } from '@/types';
import { Users, FileText, Loader2 } from 'lucide-react';

export default function AdminDashboardPage() {
  const firestore = useFirestore();
  
  const pendingRequestsQuery = React.useMemo(() => 
    query(collection(firestore, 'subscription_requests'), where('status', '==', 'pending')),
    [firestore]
  );
  
  const { data: pendingRequests, isLoading } = useCollection<SubscriptionRequest>(pendingRequestsQuery);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, Admin. Here's what's happening.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Subscriptions
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <div className="text-2xl font-bold">{pendingRequests?.length ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Requests waiting for verification.
            </p>
            <Button asChild size="sm" className="mt-4">
              <Link href="/admin/subscriptions">View Requests</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold">Coming Soon</div>
             <p className="text-xs text-muted-foreground">
              Total registered users.
            </p>
          </CardContent>
        </Card>
        {/* More cards can be added here */}
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold font-headline mb-4">Recent Activity</h2>
        <Card>
            <CardContent className="p-6">
                <p className="text-muted-foreground">Real-time activity feed coming soon.</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
