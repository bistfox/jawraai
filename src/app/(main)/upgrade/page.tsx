'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UpgradePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-8 text-center bg-background">
      <Card className="w-full max-w-lg bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg shadow-primary/10">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Sparkles className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="font-headline text-4xl text-primary">Upgrade to Pro</CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">The Ultimate Experience is Coming Soon!</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-8">
            Get ready for unlimited chats, priority access to new features, and an even more intense AI persona. The Pro version is under construction and will be launched shortly.
          </p>
          <Button onClick={() => router.back()} size="lg">Go Back</Button>
        </CardContent>
      </Card>
    </div>
  );
}
