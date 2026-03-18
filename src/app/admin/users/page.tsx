'use client';

import * as React from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { type User } from '@/types';
import { columns } from './columns';
import { DataTable } from '@/components/ui/data-table';
import { Loader2 } from 'lucide-react';

export default function AdminUsersPage() {
  const firestore = useFirestore();
  
  const usersQuery = React.useMemo(() => 
    query(collection(firestore, 'users')),
    [firestore]
  );
  
  const { data: users, isLoading } = useCollection<User>(usersQuery);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline">User Management</h1>
        <p className="text-muted-foreground">Search, view, and manage all platform users.</p>
      </div>
      
      {isLoading && !users ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable columns={columns} data={users ?? []} searchKey="email" searchPlaceholder="Filter by email..." />
      )}
    </div>
  );
}
