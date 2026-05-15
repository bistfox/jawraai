'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from '@/lib/hooks/use-user';
import { useFirestore } from '@/firebase';
import { collection, limit, orderBy, query } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { GeneratedImage } from '@/types';
import { generateImage, type ImageGenSize } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Wand2 } from 'lucide-react';

export default function ImageGenPage() {
  const { user, isLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [prompt, setPrompt] = React.useState('');
  const [size, setSize] = React.useState<ImageGenSize>('1024x1024');
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-background to-card p-6 md:p-8 shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-headline flex items-center gap-2">
              <Wand2 className="h-8 w-8 text-primary" />
              Image studio
            </h1>
            <p className="text-muted-foreground mt-2 max-w-xl">
              Describe a scene. We try Gemini first, then OpenRouter. Set keys in your project env for best results.
            </p>
          </div>
          <div className="rounded-xl border bg-background/80 px-4 py-3 text-sm">
            <p className="text-muted-foreground">Today</p>
            <p className="text-lg font-semibold tabular-nums">
              {usage ? `${usage.used} / ${usage.limit}` : '—'}
            </p>
          </div>
        </div>
      </div>

      <Card className="border-primary/15">
        <CardHeader>
          <CardTitle className="text-base">New image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. neon cyberpunk alley in Dhaka at night, cinematic lighting..."
            className="min-h-[120px] text-base"
          />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label>Aspect</Label>
              <Select value={size} onValueChange={(v) => setSize(v as ImageGenSize)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1024x1024">Square 1024</SelectItem>
                  <SelectItem value="1536x1024">Landscape</SelectItem>
                  <SelectItem value="1024x1536">Portrait</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
            <Button
              disabled={isGenerating}
              onClick={async () => {
                setIsGenerating(true);
                try {
                  const res = await generateImage(user.uid, prompt, { imageSize: size });
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
          </div>

          <p className="text-xs text-muted-foreground">
            Providers apply their own safety policies. Add <code className="rounded bg-muted px-1">GEMINI_API_KEY</code> or{' '}
            <code className="rounded bg-muted px-1">OPENROUTER_API_KEY</code> in Vercel / .env.
          </p>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-4">Your gallery</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(images ?? []).map((img) => (
          <Card key={img.id}>
            <CardContent className="p-3 space-y-2">
              <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-muted">
                <Image
                  src={img.url}
                  alt={img.prompt}
                  fill
                  className="object-cover"
                  unoptimized={img.url.startsWith('data:')}
                />
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
    </div>
  );
}
