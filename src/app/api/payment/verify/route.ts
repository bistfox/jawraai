import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// This function verifies the payment with Felixta Pay
async function verifyFelixtaPayment(chargeId: string, apiKey: string) {
    const response = await fetch(`https://pay.felixta.xyz/api/verify-payments?charge_id=${chargeId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Felixta Pay Verification API Error:', errorData);
        throw new Error('Payment verification request failed.');
    }

    const data = await response.json();
    return data;
}

// This function updates the user's subscription in Firestore
async function updateUserSubscription(userId: string, planName: string) {
    const userRef = adminDb.collection('users').doc(userId);
    
    // Calculate expiry date (30 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    await userRef.update({
        subscription: 'pro',
        subscriptionPlan: planName,
        subscriptionExpiry: Timestamp.fromDate(expiryDate),
    });
}

export async function POST(request: Request) {
    const { transaction_id, charge_id } = await request.json();
    const apiKey = process.env.FELIXTA_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ message: 'Payment gateway API key not configured.' }, { status: 500 });
    }
    
    if (!charge_id) {
         return NextResponse.json({ message: 'Charge ID is missing.' }, { status: 400 });
    }

    try {
        const verificationData = await verifyFelixtaPayment(charge_id, apiKey);

        // Check if payment was successful and metadata matches
        if (verificationData.status === 'success' && verificationData.data.status === 'paid') {
            const metadata = verificationData.data.metadata;
            
            // Security check: ensure the transaction ID from metadata matches the one from the success URL
            if (metadata.transaction_id !== transaction_id) {
                console.warn('Transaction ID mismatch.', { from_url: transaction_id, from_gateway: metadata.transaction_id });
                throw new Error('Payment verification failed due to transaction mismatch.');
            }

            const userId = metadata.user_id;
            const planName = metadata.plan;

            if (!userId || !planName) {
                throw new Error('User ID or Plan Name missing from payment metadata.');
            }

            // Update user subscription in Firestore using Admin SDK
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
