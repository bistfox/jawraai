'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFirebaseApp } from '@/firebase';
import { getAuth, sendEmailVerification } from 'firebase/auth';
import { useUser } from '@/lib/hooks/use-user';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function VerifyEmailPage() {
  const router = useRouter();
  const app = useFirebaseApp();
  const auth = getAuth(app);
  const { user, refetchUser, isLoading } = useUser();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    // If not logged in, go back to login
    if (!user) {
      router.replace('/');
      return;
    }
    // If already verified, continue
    if (user.email && user.emailVerified) {
      router.replace(user.username ? '/dashboard' : '/onboarding');
    }
  }, [isLoading, router, user]);

  const handleResend = async () => {
    if (!auth.currentUser) return;
    setIsSending(true);
    try {
      await sendEmailVerification(auth.currentUser);
      toast({ title: 'Verification email sent', description: 'Check your inbox (and spam).' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  const handleIHaveVerified = async () => {
    try {
      await auth.currentUser?.reload();
      await refetchUser();
      if (auth.currentUser?.emailVerified) {
        toast({ title: 'Verified!', description: 'Continuing...' });
        router.replace(user?.username ? '/dashboard' : '/onboarding');
      } else {
        toast({ title: 'Not verified yet', description: 'Please click the link in your email first.', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  if (isLoading) return null;

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background via-black to-background">
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg shadow-primary/10">
        <CardHeader>
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>
            We’ve sent a verification link to <span className="font-semibold">{user?.email}</span>. Open it, then come back here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full" onClick={handleIHaveVerified}>
            I verified, continue
          </Button>
          <Button className="w-full" variant="secondary" onClick={handleResend} disabled={isSending}>
            {isSending ? 'Sending...' : 'Resend email'}
          </Button>
          <div className="text-center text-sm text-muted-foreground pt-2">
            <Link href="/" className="underline font-semibold text-primary hover:text-primary/80">
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

