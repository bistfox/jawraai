'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useUser } from '@/lib/hooks/use-user';

function SuccessContent() {
    const searchParams = useSearchParams();
    const { refetchUser } = useUser();

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your payment, please wait...');

    useEffect(() => {
        const payment_id = searchParams.get('payment_id');

        if (!payment_id) {
            setStatus('error');
            setMessage('Invalid payment details found in URL. Please contact support.');
            return;
        }

        const verifyPayment = async () => {
            try {
                const response = await fetch('/api/payment/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ payment_id }),
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(result.message || 'Verification failed.');
                }
                
                setStatus('success');
                setMessage('Payment successful! Your account has been upgraded.');
                await refetchUser();

            } catch (error: any) {
                setStatus('error');
                setMessage(error.message || 'An unknown error occurred during verification.');
            }
        };

        verifyPayment();
    }, [searchParams, refetchUser]);
    
    return (
         <Card className="w-full max-w-md text-center">
            <CardHeader>
                <div className="mx-auto w-fit mb-4">
                    {status === 'loading' && <Loader2 className="h-12 w-12 text-primary animate-spin" />}
                    {status === 'success' && <CheckCircle2 className="h-12 w-12 text-green-500" />}
                    {status === 'error' && <XCircle className="h-12 w-12 text-destructive" />}
                </div>
                <CardTitle className="text-2xl font-bold">
                    {status === 'loading' && 'Payment Verification'}
                    {status === 'success' && 'Upgrade Successful!'}
                    {status === 'error' && 'Verification Failed'}
                </CardTitle>
                <CardDescription>{message}</CardDescription>
            </CardHeader>
            <CardContent>
                {status !== 'loading' && (
                    <Button asChild>
                        <Link href="/dashboard">Go to Dashboard</Link>
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}


export default function PaymentSuccessPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Suspense fallback={<Loader2 className="h-12 w-12 text-primary animate-spin" />}>
                <SuccessContent />
            </Suspense>
        </div>
    );
}
