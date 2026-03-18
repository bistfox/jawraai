'use client';

import { useState } from 'react';
import { useUser } from '@/lib/hooks/use-user';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Check, Sparkles } from 'lucide-react';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

type Plan = {
    name: 'Basic Monthly' | 'Pro Monthly' | 'Premium Monthly';
    price: number;
    priceSuffix: string;
    description: string;
    features: string[];
    isPopular: boolean;
};

const plans: Plan[] = [
    {
        name: 'Basic Monthly',
        price: 500,
        priceSuffix: '/ month',
        description: 'Get started with unlimited messaging.',
        features: [
            'Unlimited Messages',
            'All AI Personas Unlocked',
            'Standard Support'
        ],
        isPopular: false,
    },
    {
        name: 'Pro Monthly',
        price: 1000,
        priceSuffix: '/ month',
        description: 'For power users who want more models.',
        features: [
            'Everything in Basic',
            'Access to Free OpenRouter Models',
            'Add Your Own Custom AI Models',
            'Priority Support'
        ],
        isPopular: true,
    },
    {
        name: 'Premium Monthly',
        price: 2000,
        priceSuffix: '/ month',
        description: 'The ultimate experience with all features.',
         features: [
            'Everything in Pro',
            'Early access to new features',
            'Exclusive Member Badge',
            'Direct line to developers'
        ],
        isPopular: false,
    },
];

const paymentRequestSchema = z.object({
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
            paymentPhoneNumber: '',
            transactionId: '',
        },
    });

    const handleSubmitRequest = async (values: z.infer<typeof paymentRequestSchema>) => {
        if (!user || !selectedPlan || !firestore) {
            toast({ title: 'Error', description: 'You must be logged in to make a request.', variant: 'destructive' });
            return;
        }
        
        setIsSubmitting(true);

        try {
            const requestsCollection = collection(firestore, 'subscription_requests');
            await addDoc(requestsCollection, {
                userId: user.uid,
                username: user.username,
                email: user.email,
                requestedPlan: selectedPlan.name,
                planPrice: selectedPlan.price,
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
    const paymentNumber = '01700000000';

    return (
        <>
            <div className="flex flex-col items-center justify-center min-h-full p-4 md:p-8 text-center bg-background">
                <header className="mb-10">
                    <h1 className="font-headline text-4xl md:text-5xl text-primary mb-2">Upgrade to {persona} Pro</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Manually upgrade by sending payment and submitting your transaction details for verification.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch justify-center w-full max-w-6xl mx-auto">
                    {plans.map((plan) => (
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
                                    <span className="text-4xl font-bold text-foreground">৳{plan.price}</span>
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
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>Manual Payment for {selectedPlan?.name}</DialogTitle>
                        <DialogDescription>
                            Follow the steps below to complete your upgrade.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-6">
                        <div className="space-y-2 text-sm rounded-lg border p-4">
                            <p className="font-bold">Step 1: Send Payment</p>
                            <p>Send <strong>৳{selectedPlan?.price}</strong> to the bKash/Nagad number below.</p>
                            <div className="flex items-center justify-center p-3 my-2 rounded-md bg-secondary">
                                <p className="text-lg font-mono font-bold tracking-widest">{paymentNumber}</p>
                            </div>
                             <p className="text-xs text-muted-foreground">Please use the 'Send Money' option.</p>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                            <p className="font-bold">Step 2: Submit Details</p>
                            <p>After sending payment, enter your payment number and the Transaction ID (TrxID) below.</p>
                        </div>

                         <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleSubmitRequest)} className="space-y-4">
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
        </>
    );
}
