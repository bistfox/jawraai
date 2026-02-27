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
        description: 'Perfect for getting started with unlimited power.',
        features: [
            'Unlimited Messages',
            'All AI Personas Unlocked',
            'Access to Free OpenRouter Models',
            'Add Your Own Custom AI Models',
            'Priority Support'
        ],
        isPopular: true,
    },
];

export default function UpgradePage() {
    const router = useRouter();
    const { user } = useUser();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleUpgrade = async (plan: typeof plans[0]) => {
        if (!user) {
            toast({ title: 'You must be logged in to upgrade.', variant: 'destructive' });
            return;
        }
        setIsLoading(true);
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
        }
    };
    
    const persona = user?.gender === 'Male' ? 'Magi Bot' : 'Jawra Bot';

    return (
        <div className="flex flex-col items-center justify-center min-h-full p-4 md:p-8 text-center bg-background">
            <header className="mb-10">
                <h1 className="font-headline text-4xl md:text-5xl text-primary mb-2">Upgrade to {persona} Pro</h1>
                <p className="text-lg text-muted-foreground">Unlock the ultimate, uncensored AI experience.</p>
            </header>

            <div className="flex justify-center">
                {plans.map((plan) => (
                    <Card key={plan.name} className={cn(
                        "w-full max-w-md bg-card/80 backdrop-blur-sm border-border shadow-lg",
                        plan.isPopular && "border-primary/50 shadow-primary/20"
                    )}>
                        <CardHeader className="p-6">
                            {plan.isPopular && (
                                <div className="text-sm font-bold text-primary text-center mb-2">MOST POPULAR</div>
                            )}
                            <CardTitle className="font-headline text-3xl text-center">{plan.name}</CardTitle>
                            <CardDescription className="text-center">
                                <span className="text-4xl font-bold text-foreground">৳{plan.price}</span>
                                <span className="text-muted-foreground">{plan.priceSuffix}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 pt-0 text-left">
                           <ul className="space-y-3">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <Check className="h-5 w-5 text-green-500" />
                                        <span className="text-muted-foreground">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter className="p-6">
                            <Button onClick={() => handleUpgrade(plan)} size="lg" className="w-full text-lg" disabled={isLoading}>
                                {isLoading ? 'Processing...' : 'Upgrade Now'}
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
