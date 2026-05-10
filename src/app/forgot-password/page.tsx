'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useFirebaseApp } from '@/firebase';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
  const app = useFirebaseApp();
  const auth = getAuth(app);
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'Reset email sent',
        description: 'Check your inbox and follow the link to reset your password.',
      });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background via-black to-background">
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg shadow-primary/10">
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>We’ll send a reset link to your email.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send reset link'}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/" className="underline font-semibold text-primary hover:text-primary/80">
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

