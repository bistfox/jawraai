'use client';

import { useUser } from '@/lib/hooks/use-user';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Gift, User as UserIcon, KeyRound, CreditCard, Volume2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { getEntitlements } from '@/lib/entitlements';
import { hasPaidSubscription } from '@/lib/subscription-access';
import type { PlanId } from '@/lib/plans';

export default function SettingsPage() {
  const { user, refetchUser } = useUser();
  const { toast } = useToast();
  const firestore = useFirestore();

  if (!user) {
    return null; // Layout handles redirect
  }

  const planId = (user.planId ?? (user.subscription === 'pro' ? 'pro' : 'basic')) as PlanId;
  const ent = getEntitlements(planId);
  const paid = hasPaidSubscription(user);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newUsername = (formData.get('username') as string)?.trim();
    const newBio = (formData.get('bio') as string)?.trim() ?? '';

    if (newUsername.length < 3) {
      toast({
        title: 'Error',
        description: 'Username must be at least 3 characters long.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateDoc(doc(firestore, 'users', user.uid), {
        username: newUsername,
        bio: newBio || null,
      });
      await refetchUser();
      toast({
        title: 'Saved',
        description: 'Your profile was updated in the cloud.',
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Could not save',
        description: err?.message ?? 'Check your connection and Firestore rules.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-4 md:p-8">
      <header className="mb-8">
        <h1 className="font-headline text-4xl md:text-5xl">My Account</h1>
        <p className="text-muted-foreground text-lg mt-2">
          Profile, usage, and shortcuts — saved to your cloud account.
        </p>
      </header>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold capitalize">{planId}</p>
            <p className="text-xs text-muted-foreground">{paid ? 'Active paid features' : 'Free tier'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Messages / day</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {user.dailyMessageUsed ?? 0} / {user.dailyMessageLimit ?? ent.dailyMessageLimit}
            </p>
            <p className="text-xs text-muted-foreground">Bonus: {user.bonusMessagesBalance ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Images / day</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {user.dailyImageUsed ?? 0} / {user.dailyImageLimit ?? ent.dailyImageLimit}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Coins & streak</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{user.coins ?? 0} coins</p>
            <p className="text-xs text-muted-foreground">Streak {user.dailyStreak ?? 0} days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>Edit your personal information.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleSaveChanges}>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.username}`} />
                    <AvatarFallback><UserIcon /></AvatarFallback>
                  </Avatar>
                  <Button type="button" variant="outline">Change Photo</Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" name="username" key={user.username} defaultValue={user.username} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio (optional)</Label>
                  <Textarea id="bio" name="bio" key={user.uid} defaultValue={user.bio ?? ''} rows={3} placeholder="Short line about you" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" defaultValue={user.age} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Input id="gender" defaultValue={user.gender} disabled />
                </div>
                <Button type="submit">Save Changes</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                Referral
              </CardTitle>
              <CardDescription>Share your code and earn rewards.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="refCode">Referral Code</Label>
                <Input id="refCode" value={user.refCode ?? ''} disabled />
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Total referrals: {user.totalReferrals ?? 0}</p>
                <p>Coins: {user.coins ?? 0}</p>
                <p>Bonus messages: {user.bonusMessagesBalance ?? 0}</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={async () => {
                  await navigator.clipboard.writeText(user.refCode ?? '');
                  toast({ title: 'Referral code copied' });
                }}
              >
                Copy Referral Code
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Shortcuts
              </CardTitle>
              <CardDescription>Jump to tools and billing.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild variant="secondary" size="sm">
                <Link href="/subscription">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Subscription
                </Link>
              </Button>
              <Button asChild variant="secondary" size="sm">
                <Link href="/upgrade">Upgrade</Link>
              </Button>
              <Button asChild variant="secondary" size="sm">
                <Link href="/voice-studio">
                  <Volume2 className="mr-2 h-4 w-4" />
                  Text to speech
                </Link>
              </Button>
              <Button asChild variant="secondary" size="sm">
                <Link href="/image-gen">Image studio</Link>
              </Button>
              <Button asChild variant="secondary" size="sm">
                <Link href="/forgot-password">
                  <KeyRound className="mr-2 h-4 w-4" />
                  Reset password
                </Link>
              </Button>
            </CardContent>
          </Card>

           <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Dark theme is enabled by default.</p>
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Delete Account</CardTitle>
              <CardDescription>Permanently delete your account and all associated data.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={() => toast({ title: 'This action is not available yet.', variant: 'destructive'})}>Delete My Account</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
