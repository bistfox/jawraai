'use client';

import { useMemo, useState } from 'react';
import { useUser } from '@/lib/hooks/use-user';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Check, Sparkles, Copy } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore } from '@/firebase';
import { addDoc, collection, query, serverTimestamp, where } from 'firebase/firestore';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { SubscriptionRequest } from '@/types';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { PLAN_LIST, type PlanConfig } from '@/lib/plans';

type Plan = PlanConfig;

const paymentRequestSchema = z.object({
  paymentMethod: z.enum(['bkash', 'nagad', 'rocket'], {
    required_error: 'Please select a payment method.',
  }),
  paymentPhoneNumber: z.string().min(11, 'Please enter a valid phone number.'),
  transactionId: z.string().min(5, 'Please enter a valid transaction ID.'),
});


export default function UpgradePage() {
    const { user } = useUser();
    const { toast } = useToast();
    const firestore = useFirestore();

    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof paymentRequestSchema>>({
        resolver: zodResolver(paymentRequestSchema),
        defaultValues: {
            paymentMethod: undefined,
            paymentPhoneNumber: '',
            transactionId: '',
        },
    });

    const selectedPaymentMethod = useWatch({
      control: form.control,
      name: 'paymentMethod',
    });

    const paymentMethodDisplay =
      selectedPaymentMethod === 'bkash'
        ? 'bKash'
        : selectedPaymentMethod === 'nagad'
          ? 'Nagad'
          : selectedPaymentMethod === 'rocket'
            ? 'Rocket'
            : 'bKash/Nagad/Rocket';

    const requestsQuery = useMemo(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'subscription_requests'), where('userId', '==', user.uid));
    }, [firestore, user]);

    const { data: myRequests, isLoading: isLoadingRequests } = useCollection<SubscriptionRequest>(requestsQuery);

    const sortedRequests = useMemo(() => {
        if (!myRequests) return [];
        return [...myRequests].sort((a, b) => {
            const aSec = a.createdAt?.seconds ?? 0;
            const bSec = b.createdAt?.seconds ?? 0;
            return bSec - aSec;
        });
    }, [myRequests]);

    const expiryDate = user?.subscriptionExpiry?.toDate?.() ?? null;
    const isProActive = user?.subscription === 'pro' && user?.subscriptionStatus === 'active' && expiryDate
      ? expiryDate.getTime() > Date.now()
      : false;

    const handleSubmitRequest = async (values: z.infer<typeof paymentRequestSchema>) => {
        if (!user || !selectedPlan || !firestore) {
            toast({ title: 'Error', description: 'You must be logged in to make a request.', variant: 'destructive' });
            return;
        }
        
        setIsSubmitting(true);

        try {
            const requestsCollection = collection(firestore, 'subscription_requests');
            const legacyPlanLabel =
              selectedPlan.id === 'basic'
                ? 'Basic Monthly'
                : selectedPlan.id === 'pro'
                  ? 'Pro Monthly'
                  : selectedPlan.id === 'premium'
                    ? 'Premium Monthly'
                    : 'Premium Monthly';

            await addDoc(requestsCollection, {
                userId: user.uid,
                username: user.username,
                email: user.email,
                requestedPlan: legacyPlanLabel,
                planId: selectedPlan.id,
                planPrice: selectedPlan.priceBDT,
                paymentMethod: values.paymentMethod,
                paymentToPhoneNumber: paymentNumber,
                paymentPhoneNumber: values.paymentPhoneNumber,
                transactionId: values.transactionId,
                status: 'pending',
                createdAt: serverTimestamp(),
            });

            toast({
                title: 'Request Submitted!',
                description: 'Your request is sent for verification. Please wait for admin approval.',
            });
            setSelectedPlan(null);
            form.reset();

        } catch (error) {
            console.error("Error submitting request:", error);
            toast({ title: 'Submission Failed', description: 'Could not submit your request. Please try again.', variant: 'destructive'});
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const persona = user?.gender === 'Male' ? 'Magi Bot' : 'Jawra Bot';
    const paymentNumber = '01707495559';

    if (isProActive) {
      return (
        <div className="flex flex-col items-center justify-center min-h-full p-4 md:p-8 text-center bg-background">
          <Card className="w-full max-w-2xl bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-headline text-3xl">You are already Pro</CardTitle>
              <CardDescription>Your plan is active. View subscription details anytime.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 text-left">
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="font-semibold">{user?.subscriptionPlan ?? 'Pro'}</p>
                <p className="text-sm text-muted-foreground mt-2">Expires</p>
                <p className="font-semibold">
                  {expiryDate ? expiryDate.toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div className="flex gap-2 justify-center flex-wrap">
                <Button asChild variant="default">
                  <Link href="/subscription">Go to Subscription</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/chat/history">Chat History</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
        <>
            <div className="flex flex-col items-center justify-center min-h-full p-4 md:p-8 text-center bg-background">
                <header className="mb-10">
                    <h1 className="font-headline text-4xl md:text-5xl text-primary mb-2">Upgrade to {persona} Pro</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Manually upgrade by sending payment and submitting your transaction details for verification.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch justify-center w-full max-w-6xl mx-auto">
                    {PLAN_LIST.map((plan) => (
                        <Card key={plan.name} className={cn(
                            "flex flex-col bg-card/80 backdrop-blur-sm border-border shadow-lg transition-all",
                            plan.isPopular ? "border-primary/50 shadow-primary/20 scale-105" : "hover:scale-105 hover:border-primary/50"
                        )}>
                            <CardHeader className="p-6">
                                {plan.isPopular && (
                                    <div className="text-sm font-bold text-primary text-center mb-2 tracking-widest">MOST POPULAR</div>
                                )}
                                <CardTitle className="font-headline text-3xl text-center">{plan.name}</CardTitle>
                                <CardDescription className="text-center text-md h-12">
                                    {plan.description}
                                </CardDescription>
                                <div className="text-center mt-4">
                                    <span className="text-4xl font-bold text-foreground">৳{plan.priceBDT}</span>
                                    <span className="text-muted-foreground">{plan.priceSuffix}</span>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 pt-0 text-left flex-grow">
                            <ul className="space-y-3">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <Check className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                                            <span className="text-muted-foreground">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter className="p-6">
                                <Button 
                                    onClick={() => setSelectedPlan(plan)} 
                                    size="lg" 
                                    className="w-full text-lg" 
                                    variant={plan.isPopular ? 'default' : 'secondary'}
                                >
                                    Choose {plan.name}
                                    <Sparkles className="ml-2 h-5 w-5"/>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>

            <Dialog open={!!selectedPlan} onOpenChange={(isOpen) => { if (!isOpen) { setSelectedPlan(null); form.reset(); } }}>
                <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Manual Payment for {selectedPlan?.name}</DialogTitle>
                        <DialogDescription>
                            Follow the steps below to complete your upgrade.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-6">
                        <div className="space-y-2 text-sm rounded-lg border p-4">
                            <p className="font-bold">Step 1: Send Payment</p>
                            <p>
                              Send <strong>৳{selectedPlan?.priceBDT}</strong> via <strong>{paymentMethodDisplay}</strong> to the number below.
                            </p>
                            <div className="flex items-center justify-between p-3 my-2 rounded-md bg-secondary">
                                <p className="text-lg font-mono font-bold tracking-widest">{paymentNumber}</p>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                        navigator.clipboard.writeText(paymentNumber);
                                        toast({ title: "Number Copied!" });
                                    }}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                             <p className="text-xs text-muted-foreground">Please use the 'Send Money' option.</p>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                            <p className="font-bold">Step 2: Submit Details</p>
                            <p>
                              After sending payment via <strong>{paymentMethodDisplay}</strong>, enter your payment phone and the Transaction ID (TrxID).
                            </p>
                        </div>

                         <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleSubmitRequest)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="paymentMethod"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Payment Method</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select payment method" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="bkash">bKash</SelectItem>
                                                    <SelectItem value="nagad">Nagad</SelectItem>
                                                    <SelectItem value="rocket">Rocket</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="paymentPhoneNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Your Payment Phone Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., 01xxxxxxxxx" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="transactionId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Transaction ID (TrxID)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., 9A4B2CDEFG" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <DialogFooter className="pt-4">
                                    <Button type="submit" disabled={isSubmitting} className="w-full">
                                        {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
                                    </Button>
                                </DialogFooter>
                            </form>
                         </Form>
                    </div>
                </DialogContent>
            </Dialog>

            <div className="max-w-6xl mx-auto px-4 pb-8">
                <Card className="bg-card/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Your Subscription Request History</CardTitle>
                        <CardDescription>Track status: pending, approved, or rejected.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {isLoadingRequests ? (
                            <p className="text-sm text-muted-foreground">Loading your requests...</p>
                        ) : sortedRequests.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No requests found yet. Submit one from any plan.</p>
                        ) : (
                            sortedRequests.map((request) => (
                                <div key={request.id} className="rounded-lg border p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="font-semibold">{request.requestedPlan} - ৳{request.planPrice}</p>
                                        <Badge
                                            variant={request.status === 'approved' ? 'default' : request.status === 'rejected' ? 'destructive' : 'secondary'}
                                            className="capitalize"
                                        >
                                            {request.status}
                                        </Badge>
                                    </div>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Method: <span className="font-medium uppercase">{request.paymentMethod ?? 'N/A'}</span> • Send To: <span className="font-medium">{request.paymentToPhoneNumber ?? 'N/A'}</span> • TrxID: {request.transactionId}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Requested {request.createdAt ? formatDistanceToNow(request.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                                    </p>
                                    {request.adminNotes && (
                                        <p className="mt-2 text-sm">
                                            <span className="font-medium">Admin note:</span> {request.adminNotes}
                                        </p>
                                    )}
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
