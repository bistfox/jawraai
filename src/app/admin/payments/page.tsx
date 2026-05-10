'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useFirestore } from '@/firebase';
import { collection, limit, orderBy, query } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { SubscriptionRequest } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AdminPaymentsPage() {
  const firestore = useFirestore();
  const paymentsQuery = React.useMemo(
    () =>
      query(
        collection(firestore, 'subscription_requests'),
        orderBy('createdAt', 'desc'),
        limit(50)
      ),
    [firestore]
  );
  const { data: requests } = useCollection<SubscriptionRequest>(paymentsQuery);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline">Payments</h1>
        <p className="text-muted-foreground">Recent manual payment submissions.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {(requests ?? []).map((r) => (
          <Card key={r.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between gap-3">
                <span className="truncate">{r.email ?? r.userId}</span>
                <Badge variant={r.status === 'approved' ? 'default' : r.status === 'rejected' ? 'destructive' : 'secondary'}>
                  {r.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="font-medium">{r.paymentMethod?.toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Sender</span>
                <span className="font-mono">{r.paymentPhoneNumber || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">TRX</span>
                <span className="font-mono truncate max-w-[220px]">{r.transactionId || '—'}</span>
              </div>
              <div className="pt-2">
                <Button asChild variant="secondary" size="sm">
                  <Link href="/admin/subscriptions">Review in Requests</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {(requests ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">No payment submissions yet.</p>
        )}
      </div>
    </div>
  );
}

