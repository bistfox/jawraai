'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from '@/lib/hooks/use-user';
import { useFirestore } from '@/firebase';
import { collection, limit, orderBy, query } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { GeneratedImage } from '@/types';
import { generateImage } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function ImageGenPage() {
  const { user, isLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [prompt, setPrompt] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [usage, setUsage] = React.useState<{ used: number; limit: number; resetDate: string } | null>(null);

  const imagesQuery = React.useMemo(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'images'),
      orderBy('createdAt', 'desc'),
      limit(12)
    );
  }, [firestore, user]);

  const { data: images } = useCollection<GeneratedImage>(imagesQuery);

  if (isLoading) return null;
  if (!user) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Image Generator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Please log in to generate images.</p>
            <Button asChild>
              <Link href="/">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-headline">Image Generator</h1>
        <p className="text-muted-foreground">
          Daily images: {usage ? `${usage.used}/${usage.limit}` : '—'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create an image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you want to generate..."
            className="min-h-[110px]"
          />
          <div className="flex gap-2">
            <Button
              disabled={isGenerating}
              onClick={async () => {
                setIsGenerating(true);
                try {
                  const res = await generateImage(user.uid, prompt);
                  setUsage(res.usage);
                  if (!res.ok) {
                    toast({ title: 'Failed', description: res.error, variant: 'destructive' });
                    return;
                  }
                  setPrompt('');
                  toast({ title: 'Generated' });
                } finally {
                  setIsGenerating(false);
                }
              }}
            >
              {isGenerating ? 'Generating...' : 'Generate'}
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/upgrade">Upgrade</Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Note: This generator follows provider safety rules (not “uncensored”).
          </p>
        </CardContent>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(images ?? []).map((img) => (
          <Card key={img.id}>
            <CardContent className="p-3 space-y-2">
              <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-muted">
                <Image src={img.url} alt={img.prompt} fill className="object-cover" />
              </div>
              <p className="text-xs text-muted-foreground line-clamp-3">{img.prompt}</p>
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  await navigator.clipboard.writeText(img.url);
                  toast({ title: 'Image URL copied' });
                }}
              >
                Copy URL
              </Button>
            </CardContent>
          </Card>
        ))}
        {(images ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">No images yet.</p>
        )}
      </div>
    </div>
  );
}
