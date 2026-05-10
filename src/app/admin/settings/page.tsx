'use client';

import * as React from 'react';
import { useFirestore } from '@/firebase';
import { addDoc, collection, deleteDoc, doc, limit, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';

type Announcement = {
  id: string;
  title: string;
  body: string;
  createdAt?: any;
};

export default function AdminSettingsPage() {
  const firestore = useFirestore();
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');

  const announcementsQuery = React.useMemo(
    () => query(collection(firestore, 'announcements'), orderBy('createdAt', 'desc'), limit(20)),
    [firestore]
  );
  const { data: announcements } = useCollection<Announcement>(announcementsQuery);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline">Settings</h1>
        <p className="text-muted-foreground">Admin tools and announcements.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Announcements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
            <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message" />
          </div>
          <Button
            onClick={async () => {
              if (!title.trim() || !body.trim()) return;
              await addDoc(collection(firestore, 'announcements'), {
                title: title.trim(),
                body: body.trim(),
                createdAt: serverTimestamp(),
              });
              setTitle('');
              setBody('');
            }}
          >
            Publish
          </Button>

          <div className="pt-2 space-y-2">
            {(announcements ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No announcements yet.</p>
            ) : (
              announcements?.map((a) => (
                <div key={a.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                  <div className="min-w-0">
                    <div className="font-medium">{a.title}</div>
                    <div className="text-sm text-muted-foreground">{a.body}</div>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-9 w-9"
                    onClick={async () => {
                      await deleteDoc(doc(firestore, 'announcements', a.id));
                    }}
                    aria-label="Delete announcement"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

