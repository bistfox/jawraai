'use client';

import * as React from 'react';
import { useFirestore } from '@/firebase';
import { collection, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { Character } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Star, Trash2 } from 'lucide-react';

export default function AdminCharactersPage() {
  const firestore = useFirestore();
  const charsQuery = React.useMemo(() => collection(firestore, 'characters'), [firestore]);
  const { data: characters, isLoading } = useCollection<Character>(charsQuery);

  const sorted = React.useMemo(() => {
    const list = characters ?? [];
    return [...list].sort((a, b) => {
      const af = (a as any).isFeatured ? 1 : 0;
      const bf = (b as any).isFeatured ? 1 : 0;
      if (af !== bf) return bf - af;
      return (a.name ?? '').localeCompare(b.name ?? '');
    });
  }, [characters]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline">Characters</h1>
        <p className="text-muted-foreground">Feature/unfeature and moderate characters.</p>
      </div>

      {isLoading && !characters ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {sorted.map((c) => (
            <div key={c.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">{c.name}</h2>
                    {(c as any).isFeatured && <Badge>Featured</Badge>}
                    {c.visibility && <Badge variant="secondary">{c.visibility}</Badge>}
                    {c.category && <Badge variant="outline">{c.category}</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Owner: {(c as any).ownerId ? String((c as any).ownerId) : 'prebuilt'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      const ref = doc(firestore, 'characters', c.id);
                      await updateDoc(ref, { isFeatured: !(c as any).isFeatured });
                    }}
                  >
                    <Star className="mr-2 h-4 w-4" />
                    {(c as any).isFeatured ? 'Unfeature' : 'Feature'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      const ref = doc(firestore, 'characters', c.id);
                      await deleteDoc(ref);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {sorted.length === 0 && (
            <p className="text-sm text-muted-foreground">No characters found.</p>
          )}
        </div>
      )}
    </div>
  );
}

