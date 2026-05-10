'use client';

import * as React from 'react';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { doc, updateDoc, collection, query, where, Timestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { SubscriptionRequest } from '@/types';
import { useUser } from '@/lib/hooks/use-user';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard } from 'lucide-react';
import { getPlan, type PlanId } from '@/lib/plans';

function statusBadgeVariant(status: SubscriptionRequest['status']) {
  switch (status) {
    case 'approved':
      return 'default';
    case 'rejected':
      return 'destructive';
    default:
      return 'secondary';
  }
}

export default function SubscriptionPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user, refetchUser } = useUser();
  const { toast } = useToast();

  const requestsQuery = useMemo(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'subscription_requests'),
      where('userId', '==', user.uid)
    );
  }, [firestore, user]);

  const { data: requests, isLoading } = useCollection<SubscriptionRequest>(requestsQuery);

  const sortedRequests = useMemo(() => {
    if (!requests) return [];
    return [...requests].sort((a, b) => {
      const aSec = (a.createdAt as any)?.seconds ?? 0;
      const bSec = (b.createdAt as any)?.seconds ?? 0;
      return bSec - aSec;
    });
  }, [requests]);

  const approvedRequests = useMemo(
    () => sortedRequests.filter((r) => r.status === 'approved'),
    [sortedRequests]
  );
  const latestApproved = approvedRequests[0];

  const planId = (user?.planId ?? null) as PlanId | null;
  const plan = getPlan(planId);
  const isPro = user?.subscription === 'pro' || planId === 'pro' || planId === 'premium' || planId === 'advance';
  const isActive = user?.subscriptionStatus === 'active';
  const expiryDate = user?.subscriptionExpiry ? (user.subscriptionExpiry as Timestamp).toDate() : null;
  const isExpired = expiryDate ? expiryDate.getTime() < Date.now() : false;
  const remainingDays = expiryDate
    ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const effectiveOpenRouterModelName =
    user?.openRouterSelectedModelName ||
    (user?.openRouterSelectedModelId === 'z-ai/glm-4.5-air:free' ? 'GLM 4.5 Air (Z.ai)' : undefined);

  const effectiveGroqModelName =
    user?.groqSelectedModelName ||
    (user?.groqSelectedModelId === 'llama-3.3-70b-versatile' ? 'Llama 3.3 70B Versatile (Groq)' : undefined);

  const handleCancel = async () => {
    if (!user) return;
    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, {
        subscription: 'free',
        subscriptionStatus: 'inactive',
        subscriptionPlan: null,
        subscriptionStart: null,
        subscriptionExpiry: null,
        openRouterSelectedModelId: null,
        openRouterSelectedModelName: null,
      });
      await refetchUser();
      toast({
        title: 'Subscription cancelled',
        description: 'Your subscription is now inactive. (No refund.)',
      });
    } catch (error) {
      console.error('Cancel subscription failed:', error);
      toast({
        title: 'Error',
        description: 'Could not cancel subscription. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (!user) return null;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-headline text-4xl md:text-5xl">Subscription</h1>
          <p className="text-muted-foreground text-lg mt-2">
            Plan, payment verification, expiry and full history.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isPro ? (isActive && !isExpired ? 'default' : 'secondary') : 'secondary'}>
            {isPro ? (isActive && !isExpired ? 'Active' : 'Inactive') : 'Standard'}
          </Badge>
        </div>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current status
            </CardTitle>
            <CardDescription>
              {plan ? `Plan: ${plan.name} • ৳${plan.priceBDT}${plan.priceSuffix}` : 'Your subscription details.'}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {isPro && isActive && !isExpired ? (
              <Button variant="destructive" onClick={handleCancel}>
                Cancel (No Refund)
              </Button>
            ) : (
              <Button onClick={() => router.push('/upgrade')} disabled={requests?.some((r) => r.status === 'pending')}>
                Upgrade to Pro
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {expiryDate ? (
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Expiry</p>
              <p className="font-semibold">
                {format(expiryDate, 'PPP')} ({formatDistanceToNow(expiryDate, { addSuffix: true })})
              </p>
              {remainingDays !== null && (
                <p className="text-sm text-muted-foreground mt-1">
                  Remaining: <span className="font-semibold">{remainingDays}</span> day(s)
                </p>
              )}
              {isExpired && <p className="text-destructive text-sm mt-1">Your plan has expired. Upgrade again when ready.</p>}
            </div>
          ) : (
            <div className="rounded-lg border p-4 text-sm text-muted-foreground">No active expiry date found.</div>
          )}

          {(effectiveOpenRouterModelName || effectiveGroqModelName) && (
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Chat model</p>
              <p className="font-semibold">
                {user?.preferredChatProvider === 'groq' ? (effectiveGroqModelName ?? 'Groq') : (effectiveOpenRouterModelName ?? 'OpenRouter')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">You can change it from `My AI`.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment verification (latest)</CardTitle>
          <CardDescription>Details from your latest approved request.</CardDescription>
        </CardHeader>
        <CardContent>
          {latestApproved ? (
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{latestApproved.requestedPlan}</p>
                <Badge variant={statusBadgeVariant(latestApproved.status)} className="capitalize">
                  {latestApproved.status}
                </Badge>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-mono font-semibold">৳{latestApproved.planPrice}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Method</p>
                  <p className="font-semibold uppercase">{latestApproved.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment To</p>
                  <p className="font-mono font-semibold">{latestApproved.paymentToPhoneNumber ?? 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Phone</p>
                  <p className="font-mono font-semibold">{latestApproved.paymentPhoneNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Transaction ID</p>
                  <p className="font-mono font-semibold break-all">{latestApproved.transactionId}</p>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Approved {latestApproved.reviewedAt ? formatDistanceToNow(latestApproved.reviewedAt.toDate(), { addSuffix: true }) : 'recently'}.
              </div>
              {latestApproved.adminNotes && (
                <div className="text-sm">
                  <span className="font-medium">Admin note:</span> {latestApproved.adminNotes}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No approved payment found yet. Upgrade and submit manual payment request.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Full request history</CardTitle>
          <CardDescription>Pending, approved and rejected status updates.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : sortedRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No requests yet.</p>
          ) : (
            <div className="space-y-3">
              {sortedRequests.map((r) => (
                <div key={r.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{r.requestedPlan}</p>
                      <p className="text-sm text-muted-foreground">৳{r.planPrice} • {r.paymentMethod.toUpperCase()}</p>
                    </div>
                    <Badge variant={statusBadgeVariant(r.status)} className="capitalize">
                      {r.status}
                    </Badge>
                  </div>

                  <div className="mt-3 text-sm">
                    <p className="text-muted-foreground">
                      Tx: <span className="font-mono text-foreground break-all">{r.transactionId}</span>
                    </p>
                    <p className="text-muted-foreground">
                      Send To: <span className="font-mono text-foreground">{r.paymentToPhoneNumber ?? 'N/A'}</span>
                    </p>
                    <p className="text-muted-foreground">
                      Phone: <span className="font-mono text-foreground">{r.paymentPhoneNumber}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Submitted {r.createdAt ? formatDistanceToNow(r.createdAt.toDate(), { addSuffix: true }) : 'recently'}.
                    </p>
                    {r.adminNotes && (
                      <p className="text-sm mt-2">
                        <span className="font-medium">Admin note:</span> {r.adminNotes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

