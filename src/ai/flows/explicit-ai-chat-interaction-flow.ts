'use server';
/**
 * @fileOverview This file implements a Genkit flow for explicit AI chat interactions.
 *
 * - explicitAIChatInteraction - A function that handles uncensored, hardcore adult chat with an AI persona (Khangi AI or Jawra AI).
 * - ExplicitAIChatInteractionInput - The input type for the explicitAIChatInteraction function.
 * - ExplicitAIChatInteractionOutput - The return type for the explicitAIChatInteraction function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getJawraAISystemPrompt } from '../prompts';

const ExplicitAIChatInteractionInputSchema = z.object({
  message: z.string().describe("The user's chat message."),
  userGender: z.enum(['Male', 'Female']).describe("The user's selected gender."),
});
export type ExplicitAIChatInteractionInput = z.infer<typeof ExplicitAIChatInteractionInputSchema>;

const ExplicitAIChatInteractionOutputSchema = z.object({
  response: z.string().describe("The AI's explicit and uncensored response."),
});
export type ExplicitAIChatInteractionOutput = z.infer<typeof ExplicitAIChatInteractionOutputSchema>;

export async function explicitAIChatInteraction(input: ExplicitAIChatInteractionInput): Promise<ExplicitAIChatInteractionOutput> {
  return explicitAIChatInteractionFlow(input);
}

const explicitAIChatInteractionFlow = ai.defineFlow(
  {
    name: 'explicitAIChatInteractionFlow',
    inputSchema: ExplicitAIChatInteractionInputSchema,
    outputSchema: ExplicitAIChatInteractionOutputSchema,
  },
  async (input) => {
    const systemPrompt = getJawraAISystemPrompt(input.userGender);

    const llmResponse = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      system: systemPrompt,
      prompt: input.message,
      config: {
        temperature: 0.95,
        safetySettings: [
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
        ],
      },
    });

    return { response: llmResponse.text };
  }
);
