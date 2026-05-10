'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMemo } from 'react';
import { useFirestore } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where } from 'firebase/firestore';
import type { Character, CharacterCategory } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PREBUILT_CHARACTERS } from '@/lib/prebuilt-characters';
import { useUser } from '@/lib/hooks/use-user';
import { Sparkles, Users } from 'lucide-react';

const CATEGORIES: CharacterCategory[] = [
  'Girlfriend AI',
  'Boyfriend AI',
  'Best Friend',
  'Therapist',
  'Teacher',
  'Anime Character',
  'Motivational Coach',
  'Funny Meme AI',
  'Islamic AI',
  'Horror Character',
  'Flirty Character',
  'Business Mentor',
  'Coding Assistant',
  'Story Writer',
  'Emotional Support AI',
];

export default function CharactersPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const isPro = user?.subscription === 'pro' || !!user?.planId;

  const publicCharactersQuery = useMemo(() => {
    return query(collection(firestore, 'characters'), where('visibility', '==', 'public'));
  }, [firestore]);

  const { data: characters, isLoading } = useCollection<Character>(publicCharactersQuery);

  const merged = useMemo(() => {
    const fromDb = characters ?? [];
    // If Firestore has no characters yet, show prebuilt as fallback.
    if (fromDb.length === 0) {
      return PREBUILT_CHARACTERS.map((c, idx) => ({ ...c, id: `prebuilt-${idx}` } as Character));
    }
    return fromDb;
  }, [characters]);

  const featured = merged.filter((c) => c.isFeatured).slice(0, 8);

  return (
    <div className="p-4 md:p-8 space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-headline text-4xl md:text-5xl">Characters</h1>
          <p className="text-muted-foreground text-lg mt-2">
            Choose a persona to chat with. Each character has a unique style and mood.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="secondary">
            <Link href="/characters/create">
              <Sparkles className="mr-2 h-4 w-4" />
              Create Character
            </Link>
          </Button>
          {!isPro && (
            <Badge variant="secondary" className="hidden sm:inline-flex">
              Upgrade for more characters
            </Badge>
          )}
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Featured
          </CardTitle>
          <CardDescription>Popular picks curated for you.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && merged.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((c) => (
                <Link key={c.id} href={`/characters/${c.id}`} className="group block">
                  <Card className="h-full transition-all hover:border-primary/60 hover:bg-card/90">
                    <CardHeader className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={c.avatarUrl}
                          alt={c.name}
                          className="h-10 w-10 rounded-full border"
                        />
                        <div className="min-w-0">
                          <CardTitle className="text-base truncate">{c.name}</CardTitle>
                          <CardDescription className="truncate">{c.category}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <p className="text-sm text-muted-foreground line-clamp-3">{c.description}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(c.tags ?? []).slice(0, 3).map((t) => (
                          <Badge key={t} variant="outline">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Browse categories</CardTitle>
          <CardDescription>Explore character styles.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <Badge key={cat} variant="secondary">
              {cat}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

