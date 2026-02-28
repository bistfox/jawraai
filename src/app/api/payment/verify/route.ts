import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

async function verifyFelixtaPayment(paymentId: string, apiKey: string) {
    const baseUrl = process.env.PAYMENT_BASE_URL;
    if (!baseUrl) {
        throw new Error('Payment gateway base URL not configured.');
    }
    const response = await fetch(`${baseUrl}/verify-payments`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({ payment_id: paymentId }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Felixta Pay Verification API Error:', errorData);
        throw new Error('Payment verification request failed.');
    }

    const data = await response.json();
    return data;
}

async function updateUserSubscription(userId: string, planName: string) {
    const userRef = adminDb.collection('users').doc(userId);
    
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    let subscriptionType: 'free' | 'pro' = 'free';
    if (planName === 'Basic Monthly' || planName === 'Pro Monthly' || planName === 'Premium Monthly') {
        subscriptionType = 'pro';
    }

    await userRef.update({
        subscription: subscriptionType,
        subscriptionPlan: planName,
        subscriptionExpiry: Timestamp.fromDate(expiryDate),
        subscriptionStatus: 'active',
        subscriptionStart: Timestamp.now(),
    });
}

export async function POST(request: Request) {
    const { payment_id } = await request.json();
    const apiKey = process.env.PAYMENT_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ message: 'Payment gateway API key not configured.' }, { status: 500 });
    }
    
    if (!payment_id) {
         return NextResponse.json({ message: 'Payment ID is missing.' }, { status: 400 });
    }

    try {
        const verificationData = await verifyFelixtaPayment(payment_id, apiKey);

        if (verificationData.status === 'success' && verificationData.data?.status === 'paid') {
            const metadata = verificationData.data.metadata;
            
            const userId = metadata.userId;
            const planName = metadata.plan;

            if (!userId || !planName) {
                throw new Error('User ID or Plan Name missing from payment metadata.');
            }
            
            await updateUserSubscription(userId, planName);
            
            return NextResponse.json({ success: true, message: 'Payment successful and subscription updated.' });
        } else {
             throw new Error(verificationData.message || 'Payment not completed or failed.');
        }

    } catch (error: any) {
        console.error('Payment verification failed:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
