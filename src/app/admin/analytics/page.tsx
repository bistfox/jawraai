'use client';

import * as React from 'react';
import { useFirestore } from '@/firebase';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CreditCard, FileText, Sparkles } from 'lucide-react';

export default function AdminAnalyticsPage() {
  const firestore = useFirestore();
  const [users, setUsers] = React.useState<number | null>(null);
  const [activeSubs, setActiveSubs] = React.useState<number | null>(null);
  const [pending, setPending] = React.useState<number | null>(null);
  const [characters, setCharacters] = React.useState<number | null>(null);

  React.useEffect(() => {
    const run = async () => {
      try {
        const snap = await getCountFromServer(collection(firestore, 'users'));
        setUsers(snap.data().count);
      } catch {
        setUsers(null);
      }

      try {
        const snap = await getCountFromServer(
          query(collection(firestore, 'users'), where('subscriptionStatus', '==', 'active'))
        );
        setActiveSubs(snap.data().count);
      } catch {
        setActiveSubs(null);
      }

      try {
        const snap = await getCountFromServer(
          query(collection(firestore, 'subscription_requests'), where('status', '==', 'pending'))
        );
        setPending(snap.data().count);
      } catch {
        setPending(null);
      }

      try {
        const snap = await getCountFromServer(collection(firestore, 'characters'));
        setCharacters(snap.data().count);
      } catch {
        setCharacters(null);
      }
    };
    run();
  }, [firestore]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline">Analytics</h1>
        <p className="text-muted-foreground">Basic platform health metrics.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users ?? '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subs</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubs ?? '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pending ?? '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Characters</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{characters ?? '—'}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

