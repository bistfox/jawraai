'use server';

import { explicitAIChatInteraction } from '@/ai/flows/explicit-ai-chat-interaction-flow';
import { regenerateAIMessage } from '@/ai/flows/regenerate-ai-message-flow';
import type { Message, User } from '@/types';
import { adminDb } from './firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function getAiResponse(message: string, gender: User['gender']) {
  try {
    const response = await explicitAIChatInteraction({
      message,
      userGender: gender,
    });
    return response.response;
  } catch (error) {
    console.error('Error getting AI response:', error);
    return 'আমার মাথায় এখন দুষ্টুমি ছাড়া কিছু আসছে না... আবার চেষ্টা করো।';
  }
}

export async function regenerateAiResponse(
  chatHistory: Message[],
  gender: User['gender']
) {
  try {
    const historyForApi = chatHistory.map(({ role, content }) => ({
      role,
      content,
    }));
    const userGender = gender === 'Male' ? 'male' : 'female';
    const response = await regenerateAIMessage({
      chatHistory: historyForApi,
      userGender,
    });
    return response;
  } catch (error) {
    console.error('Error regenerating AI response:', error);
    return 'উফফ... আবার একটু অন্যভাবে বলি?';
  }
}


export async function approveSubscription(requestId: string, userId: string, planName: string) {
  try {
    const userRef = adminDb.collection('users').doc(userId);
    const requestRef = adminDb.collection('subscription_requests').doc(requestId);

    const now = Timestamp.now();
    const oneMonthFromNow = new Date(now.toDate());
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    const expiryDate = Timestamp.fromDate(oneMonthFromNow);

    const batch = adminDb.batch();

    batch.update(userRef, {
      subscription: 'pro', // Assuming all manual plans are 'pro' for now
      subscriptionPlan: planName,
      subscriptionStart: now,
      subscriptionExpiry: expiryDate,
      subscriptionStatus: 'active'
    });

    batch.update(requestRef, {
      status: 'approved',
      adminNotes: 'Approved via admin panel.'
    });

    await batch.commit();
    return { success: true, message: "Subscription approved successfully." };
  } catch (error: any) {
    console.error("Error approving subscription:", error);
    return { success: false, message: error.message };
  }
}

export async function rejectSubscription(requestId: string, reason: string) {
   try {
    const requestRef = adminDb.collection('subscription_requests').doc(requestId);
    await requestRef.update({
      status: 'rejected',
      adminNotes: reason,
    });
    return { success: true, message: "Subscription rejected." };
  } catch (error: any) {
    console.error("Error rejecting subscription:", error);
    return { success: false, message: error.message };
  }
}
