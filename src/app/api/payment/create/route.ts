import { NextResponse } from 'next/server';
import type { User } from '@/types';

type Plan = {
    name: string;
    price: number;
};

export async function POST(request: Request) {
    const { plan, user }: { plan: Plan, user: User } = await request.json();
    const apiKey = process.env.PAYMENT_API_KEY;
    const baseUrl = process.env.PAYMENT_BASE_URL;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!apiKey) {
        return NextResponse.json({ message: 'Payment gateway API key not configured.' }, { status: 500 });
    }
    if (!baseUrl) {
        return NextResponse.json({ message: 'Payment gateway base URL not configured.' }, { status: 500 });
    }
    if (!appUrl) {
        return NextResponse.json({ message: 'Application URL is not configured.' }, { status: 500 });
    }
    if (!plan || !user) {
        return NextResponse.json({ message: 'Plan and user information are required.' }, { status: 400 });
    }

    // Generate a unique ID for this transaction attempt
    const transactionId = crypto.randomUUID();

    const payload = {
        amount: plan.price,
        currency: 'BDT',
        description: `Upgrade to ${plan.name} for ${user.username}`,
        // Pass our internal transaction ID to the success/cancel URLs
        success_url: `${appUrl}/payment/success?transaction_id=${transactionId}`,
        cancel_url: `${appUrl}/payment/cancel?transaction_id=${transactionId}`,
        metadata: { 
            plan: plan.name, 
            user_id: user.uid,
            username: user.username,
            transaction_id: transactionId,
        }
    };

    try {
        const response = await fetch(`${baseUrl}/create-charge`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Felixta Pay API Error:', errorData);
            throw new Error(errorData.message || 'Failed to create payment charge.');
        }

        const data = await response.json();

        if (data.status === 'success' && data.payment_url) {
            // Note: In a real-world scenario, you might want to save the `charge_id` and `transactionId`
            // in your database here to link them before redirecting the user.
            // For this implementation, we rely on the verification step using metadata.
            return NextResponse.json({ payment_url: data.payment_url });
        } else {
            console.error('Invalid success response from Felixta Pay:', data);
            throw new Error('Failed to get payment URL from gateway.');
        }
    } catch (error: any) {
        console.error('Error creating payment charge:', error);
        return NextResponse.json({ message: error.message || 'Could not connect to the payment gateway.' }, { status: 500 });
    }
}
