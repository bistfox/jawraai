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
import { getPersonaSystemPrompt } from '../prompts';

function isRetryableGeminiError(error: any) {
  const code = error?.code ?? error?.cause?.code;
  const status = error?.status ?? error?.cause?.status;
  return status === 'UNAVAILABLE' || code === 503;
}

async function delay(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

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
    const persona = input.userGender === 'Male' ? 'magi' : 'jawra';
    const systemPrompt = getPersonaSystemPrompt(persona);

    const models = [
      'googleai/gemini-2.5-flash',
      'googleai/gemini-2.0-flash',
      'googleai/gemini-1.5-flash',
    ] as const;

    let lastError: any = null;
    for (let i = 0; i < models.length; i++) {
      try {
        const llmResponse = await ai.generate({
          model: models[i],
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
      } catch (e: any) {
        lastError = e;
        if (isRetryableGeminiError(e) && i < models.length - 1) {
          await delay(300 + i * 400);
          continue;
        }
        throw e;
      }
    }

    throw lastError ?? new Error('Failed to generate AI response.');
  }
);
