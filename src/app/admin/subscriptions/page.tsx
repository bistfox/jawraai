'use client';

import * as React from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { type SubscriptionRequest } from '@/types';
import { columns } from './columns';
import { DataTable } from '@/components/ui/data-table';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SubscriptionRequestsPage() {
  const firestore = useFirestore();

  const [statusFilter, setStatusFilter] = React.useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [methodFilter, setMethodFilter] = React.useState<'all' | 'bkash' | 'nagad' | 'rocket'>('all');
  const [planFilter, setPlanFilter] = React.useState<'all' | string>('all');
  
  const requestsQuery = React.useMemo(() => 
    query(collection(firestore, 'subscription_requests'), orderBy('createdAt', 'desc')),
    [firestore]
  );
  
  const { data: requests, isLoading } = useCollection<SubscriptionRequest>(requestsQuery);

  const planOptions = React.useMemo(() => {
    const set = new Set<string>();
    (requests ?? []).forEach((r) => {
      const pid = (r as any).planId;
      if (typeof pid === 'string' && pid.trim()) set.add(pid);
    });
    return Array.from(set).sort();
  }, [requests]);

  const filtered = React.useMemo(() => {
    const list = requests ?? [];
    return list.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (methodFilter !== 'all' && r.paymentMethod !== methodFilter) return false;
      const pid = (r as any).planId;
      if (planFilter !== 'all' && pid !== planFilter) return false;
      return true;
    });
  }, [requests, statusFilter, methodFilter, planFilter]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline">Subscription Requests</h1>
        <p className="text-muted-foreground">Verify and manage manual payment submissions.</p>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={methodFilter} onValueChange={(v) => setMethodFilter(v as any)}>
          <SelectTrigger>
            <SelectValue placeholder="Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="bkash">bKash</SelectItem>
            <SelectItem value="nagad">Nagad</SelectItem>
            <SelectItem value="rocket">Rocket</SelectItem>
          </SelectContent>
        </Select>

        <Select value={planFilter} onValueChange={(v) => setPlanFilter(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            {planOptions.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {isLoading && !requests ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable columns={columns} data={filtered} searchKey="email" searchPlaceholder="Filter by email..." />
      )}
    </div>
  );
}
