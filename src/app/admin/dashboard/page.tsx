'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirestore } from '@/firebase';
import { collection, getCountFromServer, limit, orderBy, query, where } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { SubscriptionRequest, User, Character } from '@/types';
import { Users, FileText, Loader2, Sparkles, CreditCard } from 'lucide-react';

export default function AdminDashboardPage() {
  const firestore = useFirestore();
  const [totalUsers, setTotalUsers] = React.useState<number | null>(null);
  const [activeSubs, setActiveSubs] = React.useState<number | null>(null);
  const [charactersCount, setCharactersCount] = React.useState<number | null>(null);
  
  const pendingRequestsQuery = React.useMemo(() => 
    query(collection(firestore, 'subscription_requests'), where('status', '==', 'pending')),
    [firestore]
  );
  
  const { data: pendingRequests, isLoading } = useCollection<SubscriptionRequest>(pendingRequestsQuery);

  const recentRequestsQuery = React.useMemo(
    () => query(collection(firestore, 'subscription_requests'), orderBy('createdAt', 'desc'), limit(8)),
    [firestore]
  );
  const { data: recentRequests } = useCollection<SubscriptionRequest>(recentRequestsQuery);

  React.useEffect(() => {
    const run = async () => {
      try {
        const usersSnap = await getCountFromServer(collection(firestore, 'users'));
        setTotalUsers(usersSnap.data().count);
      } catch {
        setTotalUsers(null);
      }

      try {
        const activeSnap = await getCountFromServer(
          query(collection(firestore, 'users'), where('subscriptionStatus', '==', 'active'))
        );
        setActiveSubs(activeSnap.data().count);
      } catch {
        setActiveSubs(null);
      }

      try {
        const charSnap = await getCountFromServer(collection(firestore, 'characters'));
        setCharactersCount(charSnap.data().count);
      } catch {
        setCharactersCount(null);
      }
    };
    run();
  }, [firestore]);

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
             <div className="text-2xl font-bold">{totalUsers ?? '—'}</div>
             <p className="text-xs text-muted-foreground">
              Total registered users.
            </p>
            <Button asChild size="sm" variant="secondary" className="mt-4">
              <Link href="/admin/users">Manage Users</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubs ?? '—'}</div>
            <p className="text-xs text-muted-foreground">Users currently active.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Characters</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{charactersCount ?? '—'}</div>
            <p className="text-xs text-muted-foreground">Total characters in catalog.</p>
            <Button asChild size="sm" variant="secondary" className="mt-4">
              <Link href="/admin/characters">Manage Characters</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold font-headline mb-4">Recent Requests</h2>
        <Card>
            <CardContent className="p-6">
                {!recentRequests || recentRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No requests yet.</p>
                ) : (
                  <div className="space-y-3">
                    {recentRequests.map((r) => (
                      <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg border bg-background/50 p-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{r.email ?? r.userId}</div>
                          <div className="text-xs text-muted-foreground">
                            {r.paymentMethod?.toUpperCase()} • {r.status}
                          </div>
                        </div>
                        <Button asChild size="sm" variant="secondary">
                          <Link href="/admin/subscriptions">Open</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
