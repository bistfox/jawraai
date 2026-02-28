import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { fullName, email, amount, userId, plan } = await request.json();

        const apiKey = process.env.PAYMENT_API_KEY;
        const baseUrl = process.env.PAYMENT_BASE_URL;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL;

        if (!apiKey || !baseUrl || !appUrl) {
            console.error('Server configuration error: Missing payment environment variables.');
            return NextResponse.json({ message: 'Server configuration error. Please contact support.' }, { status: 500 });
        }

        const payload = {
            full_name: fullName,
            email: email,
            amount: amount,
            metadata: {
                userId: userId,
                plan: plan,
            },
            redirect_url: `${appUrl}/payment/success`,
            cancel_url: `${appUrl}/payment/cancel`,
        };

        const response = await fetch(`${baseUrl}/create-charge`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Felixta Pay API Error:', data);
            return NextResponse.json({ message: data.message || 'Failed to create payment charge from the gateway.' }, { status: response.status });
        }

        return NextResponse.json(data);

    } catch (error: any) {
        console.error('Error creating payment charge:', error);
        return NextResponse.json({ message: 'Could not connect to the payment gateway. Please check server configuration and logs.' }, { status: 500 });
    }
}
