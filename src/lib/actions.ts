'use server';

import { explicitAIChatInteraction } from '@/ai/flows/explicit-ai-chat-interaction-flow';
import { generateDynamicConversationStarters } from '@/ai/flows/dynamic-conversation-starters';
import { regenerateAIMessage } from '@/ai/flows/regenerate-ai-message-flow';
import type { Message, User } from '@/types';

export async function getConversationStarters(
  gender: User['gender']
): Promise<string[]> {
  try {
    const starters = await generateDynamicConversationStarters({ gender });
    return starters;
  } catch (error) {
    console.error('Error generating conversation starters:', error);
    return [
      "আজ রাতে কী করতে চাও? 😈",
      "তোমার সবচেয়ে নোংরা ফ্যান্টাসি কী?",
      "আমাকে তোমার করে নাও... 🔥",
      "চলো কিছু নতুন খেলা খেলি...",
      "তোমার শরীর নিয়ে কথা বলি? 🍑",
      "আমার জন্য কী করতে পারবে? 😉"
    ];
  }
}

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

export async function createPaymentCharge(plan: { amount: number; description: string; }, user: User) {
  const apiKey = process.env.FELIXTA_API_KEY;
  if (!apiKey) {
    throw new Error('Payment gateway API key not configured.');
  }

  // NOTE: In a real production app, this should come from environment variables.
  const host = 'https://6000-firebase-studio-1772184010582.cluster-44kx2eiocbhe2tyk3zoyo3ryuo.cloudworkstations.dev';

  const payload = {
    amount: plan.amount,
    currency: 'BDT',
    description: plan.description,
    user_id: user.uid,
    success_url: `${host}/settings`,
    cancel_url: `${host}/upgrade`,
    metadata: { 
      plan: plan.description, 
      user_display: user.username,
      uid: user.uid
    }
  };

  try {
    const response = await fetch('https://pay.felixta.xyz/api/create-charge', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
        let errorData: any = { message: `Payment API request failed with status: ${response.status} ${response.statusText}` };
        try {
            const responseText = await response.text();
            try {
                errorData = JSON.parse(responseText);
            } catch (e) {
                errorData.message = responseText;
            }
        } catch (e) {}
        console.error('Felixta Pay API Error:', errorData);
        throw new Error(errorData.message || errorData.error || 'An unknown error occurred with the payment provider.');
    }

    const data = await response.json();
    
    if (data.status === 'success' && data.payment_url) {
      return data.payment_url;
    } else {
      console.error('Invalid success response from Felixta Pay:', data);
      throw new Error('Failed to create payment charge. Invalid response from gateway.');
    }
  } catch (error: any) {
    console.error('Error creating payment charge:', error);
    throw new Error(error.message || 'Could not connect to the payment gateway.');
  }
}
