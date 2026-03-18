'use client';

import * as React from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { type SubscriptionRequest } from '@/types';
import { columns } from './columns';
import { DataTable } from '@/components/ui/data-table';
import { Loader2 } from 'lucide-react';

export default function SubscriptionRequestsPage() {
  const firestore = useFirestore();
  
  const requestsQuery = React.useMemo(() => 
    query(collection(firestore, 'subscription_requests'), orderBy('createdAt', 'desc')),
    [firestore]
  );
  
  const { data: requests, isLoading } = useCollection<SubscriptionRequest>(requestsQuery);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline">Subscription Requests</h1>
        <p className="text-muted-foreground">Verify and manage manual payment submissions.</p>
      </div>
      
      {isLoading && !requests ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable columns={columns} data={requests ?? []} />
      )}
    </div>
  );
}
