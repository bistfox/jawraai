'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMemo } from 'react';
import { useFirestore } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, limit, query } from 'firebase/firestore';
import type { Character, CharacterCategory } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PREBUILT_CHARACTERS } from '@/lib/prebuilt-characters';
import { useUser } from '@/lib/hooks/use-user';
import { hasPaidSubscription, canAccessCharacter } from '@/lib/subscription-access';
import { Sparkles, Users, Lock } from 'lucide-react';

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

function characterLocked(c: Character, user: Parameters<typeof canAccessCharacter>[0]): boolean {
  return !canAccessCharacter(user, c.accessTier);
}

export default function CharactersPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const paid = hasPaidSubscription(user);

  const publicCharactersQuery = useMemo(() => {
    return query(collection(firestore, 'characters'), limit(80));
  }, [firestore]);

  const { data: characters, isLoading } = useCollection<Character>(publicCharactersQuery);

  const merged = useMemo(() => {
    const prebuilt = PREBUILT_CHARACTERS.map((c, i) => ({ ...c, id: `prebuilt-${i}` } as Character));
    const fromDb = (characters ?? []).filter((c) => {
      const vis = (c as Character).visibility;
      return vis === 'public' || vis === undefined || vis === null;
    });
    const names = new Set(prebuilt.map((p) => p.name.toLowerCase()));
    const extra = fromDb.filter((c) => !names.has(c.name.toLowerCase()));
    return [...prebuilt, ...extra];
  }, [characters]);

  const featured = merged.filter((c) => c.isFeatured).slice(0, 12);

  return (
    <div className="p-4 md:p-8 space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-headline text-4xl md:text-5xl">Characters</h1>
          <p className="text-muted-foreground text-lg mt-2">
            Free characters for everyone; <span className="text-primary font-medium">Pro</span> unlocks premium personas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="secondary">
            <Link href="/characters/create">
              <Sparkles className="mr-2 h-4 w-4" />
              Create Character
            </Link>
          </Button>
          {!paid && (
            <Button asChild size="sm" variant="default">
              <Link href="/upgrade">Unlock Pro</Link>
            </Button>
          )}
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Featured
          </CardTitle>
          <CardDescription>Tap a card to open the character. Locked ones need an active Pro plan.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && merged.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((c) => {
                const locked = characterLocked(c, user);
                return (
                  <Link key={c.id} href={`/characters/${c.id}`} className="group block">
                    <Card className="relative h-full overflow-hidden transition-all hover:border-primary/60 hover:bg-card/90">
                      {locked && (
                        <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium border">
                          <Lock className="h-3 w-3" />{' '}
                          {(c.accessTier ?? 'pro') === 'premium' ? 'Premium' : 'Pro'}
                        </div>
                      )}
                      <CardHeader className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={c.avatarUrl} alt={c.name} className="h-10 w-10 rounded-full border" />
                          <div className="min-w-0">
                            <CardTitle className="text-base truncate">{c.name}</CardTitle>
                            <CardDescription className="truncate">{c.category}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pb-4">
                        <p className="text-sm text-muted-foreground line-clamp-3">{c.description}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge variant={locked ? 'secondary' : 'outline'}>
                            {(c.accessTier ?? 'free') === 'free'
                              ? 'Free'
                              : (c.accessTier ?? 'free') === 'premium'
                                ? 'Premium'
                                : 'Pro'}
                          </Badge>
                          {(c.tags ?? []).slice(0, 2).map((t) => (
                            <Badge key={t} variant="outline">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
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
