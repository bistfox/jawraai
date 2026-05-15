'use client';

import * as React from 'react';
import { useUser } from '@/lib/hooks/use-user';
import { useFirestore } from '@/firebase';
import { collection, limit, orderBy, query } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { LeaderboardEntry } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { monthKeyUTC, weekKeyUTC } from '@/lib/referrals';

export default function ReferralsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const weeklyKey = React.useMemo(() => weekKeyUTC(), []);
  const monthlyKey = React.useMemo(() => monthKeyUTC(), []);

  const weeklyQuery = React.useMemo(
    () =>
      query(
        collection(firestore, 'leaderboard_week', weeklyKey, 'entries'),
        orderBy('score', 'desc'),
        limit(20)
      ),
    [firestore, weeklyKey]
  );
  const monthlyQuery = React.useMemo(
    () =>
      query(
        collection(firestore, 'leaderboard_month', monthlyKey, 'entries'),
        orderBy('score', 'desc'),
        limit(20)
      ),
    [firestore, monthlyKey]
  );

  const { data: weekly } = useCollection<LeaderboardEntry>(weeklyQuery);
  const { data: monthly } = useCollection<LeaderboardEntry>(monthlyQuery);

  if (!user) return null;

  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=${user.refCode ?? ''}`;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header>
        <h1 className="font-headline text-4xl">Referral & Rewards</h1>
        <p className="text-muted-foreground mt-1">Invite friends, earn bonus messages, XP, and coins.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Your referral code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="font-mono text-lg">{user.refCode ?? 'N/A'}</p>
          <p className="text-sm text-muted-foreground break-all">{referralLink}</p>
          <div className="flex gap-2">
            <Button
              onClick={async () => {
                await navigator.clipboard.writeText(user.refCode ?? '');
                toast({ title: 'Referral code copied' });
              }}
            >
              Copy Code
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                await navigator.clipboard.writeText(referralLink);
                toast({ title: 'Referral link copied' });
              }}
            >
              Copy Link
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Total referrals: {user.totalReferrals ?? 0}</p>
            <p>Coins: {user.coins ?? 0}</p>
            <p>Bonus messages: {user.bonusMessagesBalance ?? 0}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Leaderboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(weekly ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No scores this week yet. Be the first referrer.</p>
            ) : (
              (weekly ?? []).map((row, idx) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between rounded-lg border p-2 text-sm"
                >
                  <span>
                    {idx + 1}. {row.username}
                  </span>
                  <span>{row.score}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Monthly Leaderboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(monthly ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No scores this month yet.</p>
            ) : (
              (monthly ?? []).map((row, idx) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between rounded-lg border p-2 text-sm"
                >
                  <span>
                    {idx + 1}. {row.username}
                  </span>
                  <span>{row.score}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
