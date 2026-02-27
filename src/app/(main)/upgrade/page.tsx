'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/hooks/use-user';
import { createPaymentCharge } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Check, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const plans = [
    {
        name: 'Monthly Pro',
        price: 500,
        priceSuffix: '/ month',
        description: 'For power users who need unlimited access.',
        features: [
            'Unlimited Messages',
            'All AI Personas Unlocked',
            'Access to Free OpenRouter Models',
            'Add Your Own Custom AI Models',
            'Priority Support'
        ],
        isPopular: true,
    },
    {
        name: 'Yearly Pro',
        price: 5000,
        priceSuffix: '/ year',
        description: 'Save 2 months by paying annually.',
        features: [
            'Everything in Monthly Pro',
            '2 Months Free (Save ৳1000)',
            'Early access to new features',
            'Highest priority support'
        ],
        isPopular: false,
    },
    {
        name: 'Lifetime Magi',
        price: 15000,
        priceSuffix: ' one-time',
        description: 'One payment, endless fun. Forever.',
         features: [
            'Everything in Yearly Pro',
            'Lifetime Pro Access',
            'Exclusive Lifetime Member Badge',
            'Direct line to developers'
        ],
        isPopular: false,
    },
];

export default function UpgradePage() {
    const router = useRouter();
    const { user } = useUser();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

    const handleUpgrade = async (plan: typeof plans[0]) => {
        if (!user) {
            toast({ title: 'You must be logged in to upgrade.', variant: 'destructive' });
            return;
        }
        setIsLoading(true);
        setSelectedPlan(plan.name);
        try {
            const paymentUrl = await createPaymentCharge(
                {
                    amount: plan.price,
                    description: `Upgrade to ${plan.name} for ${user.username}`,
                },
                user
            );
            router.push(paymentUrl);
        } catch (error: any) {
            toast({
                title: 'Payment Error',
                description: error.message || 'Could not initiate payment. Please try again.',
                variant: 'destructive',
            });
            setIsLoading(false);
            setSelectedPlan(null);
        }
    };
    
    const persona = user?.gender === 'Male' ? 'Magi Bot' : 'Jawra Bot';

    return (
        <div className="flex flex-col items-center justify-center min-h-full p-4 md:p-8 text-center bg-background">
            <header className="mb-10">
                <h1 className="font-headline text-4xl md:text-5xl text-primary mb-2">Upgrade to {persona} Pro</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Unlock the ultimate, uncensored AI experience with unlimited messages and access to exclusive models.</p>
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
                                onClick={() => handleUpgrade(plan)} 
                                size="lg" 
                                className="w-full text-lg" 
                                disabled={isLoading}
                                variant={plan.isPopular ? 'default' : 'secondary'}
                            >
                                {isLoading && selectedPlan === plan.name ? 'Processing...' : `Choose ${plan.name}`}
                                <Sparkles className="ml-2 h-5 w-5"/>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
             <p className="text-xs text-muted-foreground mt-8">Payments are securely processed by Felixta Pay.</p>
        </div>
    );
}
