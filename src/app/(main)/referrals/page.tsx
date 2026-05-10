'use client';

import * as React from 'react';
import { useUser } from '@/lib/hooks/use-user';
import { useFirestore } from '@/firebase';
import { collection, limit, query, where } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { ReferralRecord } from '@/types';
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
        collection(firestore, 'referrals'),
        where('status', '==', 'completed'),
        limit(300)
      ),
    [firestore]
  );
  const monthlyQuery = React.useMemo(
    () =>
      query(
        collection(firestore, 'referrals'),
        where('status', '==', 'completed'),
        limit(500)
      ),
    [firestore]
  );

  const { data: weeklyRecords } = useCollection<ReferralRecord>(weeklyQuery);
  const { data: monthlyRecords } = useCollection<ReferralRecord>(monthlyQuery);

  const weekly = React.useMemo(() => {
    const map = new Map<string, { name: string; score: number }>();
    for (const r of weeklyRecords ?? []) {
      if (r.weekKey !== weeklyKey) continue;
      const key = r.referrerUid;
      const existing = map.get(key);
      if (existing) existing.score += 1;
      else map.set(key, { name: r.referrerUsername ?? 'User', score: 1 });
    }
    return Array.from(map.values()).sort((a, b) => b.score - a.score).slice(0, 20);
  }, [weeklyRecords, weeklyKey]);

  const monthly = React.useMemo(() => {
    const map = new Map<string, { name: string; score: number }>();
    for (const r of monthlyRecords ?? []) {
      if (r.monthKey !== monthlyKey) continue;
      const key = r.referrerUid;
      const existing = map.get(key);
      if (existing) existing.score += 1;
      else map.set(key, { name: r.referrerUsername ?? 'User', score: 1 });
    }
    return Array.from(map.values()).sort((a, b) => b.score - a.score).slice(0, 20);
  }, [monthlyRecords, monthlyKey]);

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
            {weekly.map((u, idx) => (
              <div key={`${u.name}-${idx}`} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                <span>{idx + 1}. {u.name}</span>
                <span>{u.score}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Monthly Leaderboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {monthly.map((u, idx) => (
              <div key={`${u.name}-${idx}`} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                <span>{idx + 1}. {u.name}</span>
                <span>{u.score}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

