'use server';

import { explicitAIChatInteraction } from '@/ai/flows/explicit-ai-chat-interaction-flow';
import { regenerateAIMessage } from '@/ai/flows/regenerate-ai-message-flow';
import type { Message, User } from '@/types';

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
