import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TriangleAlert } from 'lucide-react';

export default function PaymentCancelPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto w-fit mb-4">
                        <TriangleAlert className="h-12 w-12 text-amber-500" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Payment Cancelled</CardTitle>
                    <CardDescription>
                        Your payment process was cancelled. Your subscription has not been changed.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/upgrade">Try Again</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
