'use client';

import * as React from 'react';
import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Character } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/lib/hooks/use-user';
import { useToast } from '@/hooks/use-toast';
import { PREBUILT_CHARACTERS } from '@/lib/prebuilt-characters';
import Link from 'next/link';

export default function CharacterDetailPage() {
  const params = useParams();
  const characterId = params.id as string;
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [character, setCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const prebuiltFallback = useMemo(() => {
    if (!characterId.startsWith('prebuilt-')) return null;
    const idx = Number(characterId.replace('prebuilt-', ''));
    const base = PREBUILT_CHARACTERS[idx];
    if (!base) return null;
    return { ...base, id: characterId } as Character;
  }, [characterId]);

  React.useEffect(() => {
    let mounted = true;
    const run = async () => {
      setIsLoading(true);
      try {
        if (prebuiltFallback) {
          if (mounted) setCharacter(prebuiltFallback);
          return;
        }
        const ref = doc(firestore, 'characters', characterId);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          if (mounted) setCharacter(null);
          return;
        }
        if (mounted) setCharacter({ id: snap.id, ...(snap.data() as any) } as Character);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [characterId, firestore, prebuiltFallback]);

  const handleStartChat = async () => {
    if (!user) return;
    try {
      const sessionsCol = collection(firestore, 'users', user.uid, 'character_sessions');
      const sessionDoc = await addDoc(sessionsCol, {
        characterId,
        relationshipLevel: 'Stranger',
        affinityXp: 0,
        createdAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
      });
      router.push(`/chat/${sessionDoc.id}?mode=character`);
    } catch (error: any) {
      console.error(error);
      toast({ title: 'Error', description: 'Could not start chat.', variant: 'destructive' });
    }
  };

  if (!user) return null;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-4xl md:text-5xl">Character</h1>
          <p className="text-muted-foreground text-lg mt-2">Profile and details.</p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/characters">Back</Link>
        </Button>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : !character ? (
        <p className="text-sm text-muted-foreground">Character not found.</p>
      ) : (
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center gap-4">
            <img src={character.avatarUrl} alt={character.name} className="h-16 w-16 rounded-full border" />
            <div className="min-w-0">
              <CardTitle className="text-2xl">{character.name}</CardTitle>
              <CardDescription>{character.category}</CardDescription>
              <div className="mt-2 flex flex-wrap gap-2">
                {(character.tags ?? []).slice(0, 6).map((t) => (
                  <Badge key={t} variant="outline">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{character.description}</p>
            {character.greeting && (
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Greeting</p>
                <p className="font-medium">{character.greeting}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleStartChat} size="lg">
                Start chat
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

