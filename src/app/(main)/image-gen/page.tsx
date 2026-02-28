'use client';

import { useState } from 'react';
import { useUser } from '@/lib/hooks/use-user';
import { useFirestore } from '@/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import type { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageIcon, Sparkles, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const ErrorContent = ({ content }: { content: string }) => {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = content.split(linkRegex);

  if (parts.length <= 1) {
    return <p className="text-sm text-destructive">{content}</p>;
  }

  return (
    <p className="text-sm text-destructive">
      {parts.map((part, index) => {
        if (index % 3 === 1) {
          const linkUrl = parts[index + 1];
          const linkText = part;
          return (
            <Link key={index} href={linkUrl} className="underline font-bold hover:text-destructive/80">
              {linkText}
            </Link>
          );
        }
        if (index % 3 === 2) { return null; }
        return part;
      })}
    </p>
  );
};


export default function ImageGenPage() {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useUser();
  const firestore = useFirestore();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('প্রম্পট লিখুন! 😈');
      return;
    }

    if (!user || !firestore) {
      setError('ছবি তৈরি করতে লগইন করুন।');
      return;
    }

    setLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        throw new Error('User profile not found.');
      }

      const userData = userDoc.data() as User;

      if (userData.subscription !== 'pro') {
        const today = new Date().toISOString().split('T')[0];
        const lastDate = userData.lastImageDate;
        const currentCount = (lastDate === today && userData.imageCount) ? userData.imageCount : 0;

        if (currentCount >= 1) {
          setError('দৈনিক ফ্রি লিমিট শেষ! 🔥 আনলিমিটেড জেনারেশনের জন্য [Pro-তে আপগ্রেড করুন](/upgrade)। 😈');
          setLoading(false);
          return;
        }

        await updateDoc(userDocRef, {
          imageCount: currentCount + 1,
          lastImageDate: today,
        });
      }

      const formData = new FormData();
      formData.append('prompt', prompt);

      const res = await fetch('/api/generate-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'কিছু একটা ভুল হয়েছে রে!');
      }

      setImageUrl(data.imageUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8">
      <header>
        <h1 className="font-headline text-4xl md:text-5xl">Uncensored Image Generator</h1>
        <p className="text-muted-foreground text-lg mt-2">আপনার কল্পনাকে ছবিতে রূপ দিন, কোনো সীমাবদ্ধতা ছাড়াই। 😈</p>
      </header>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Create Your Image</CardTitle>
          <CardDescription>এখানে আপনার নোংরা বা সৃজনশীল প্রম্পট লিখুন।</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}>
            <div className="grid w-full gap-4">
              <Textarea
                placeholder="e.g., a beautiful girl smiling, detailed face, cinematic lighting..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                disabled={loading}
              />
              <Button type="submit" size="lg" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {loading ? 'Generating... Please wait...' : 'Generate Image'}
              </Button>
            </div>
          </form>
        </CardContent>
        {(error || imageUrl) && (
            <CardFooter className="flex flex-col items-center gap-4">
                {error && <ErrorContent content={error} />}
                {imageUrl && (
                    <div className="relative aspect-video w-full mt-4 overflow-hidden rounded-lg border">
                        <Image src={imageUrl} alt="Generated Image" fill className="object-contain" />
                    </div>
                )}
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
