'use server';
/**
 * @fileOverview A Genkit flow for regenerating an AI's chat response.
 *
 * - regenerateAIMessage - A function that regenerates the AI's response based on chat history and user gender.
 * - RegenerateAIMessageInput - The input type for the regenerateAIMessage function.
 * - RegenerateAIMessageOutput - The return type for the regenerateAIMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getPersonaSystemPrompt } from '../prompts';

function isRetryableGeminiError(error: any) {
  const code = error?.code ?? error?.cause?.code;
  const status = error?.status ?? error?.cause?.status;
  return status === 'UNAVAILABLE' || code === 503;
}

async function delay(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

const RegenerateAIMessageInputSchema = z.object({
  chatHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        content: z.string(),
      })
    )
    .describe('The previous chat messages, ending with the user\'s last prompt.'),
  userGender: z.enum(['male', 'female']).describe('The gender of the user.'),
});
export type RegenerateAIMessageInput = z.infer<
  typeof RegenerateAIMessageInputSchema
>;

const RegenerateAIMessageOutputSchema = z
  .string()
  .describe('The regenerated AI message.');
export type RegenerateAIMessageOutput = z.infer<
  typeof RegenerateAIMessageOutputSchema
>;

export async function regenerateAIMessage(
  input: RegenerateAIMessageInput
): Promise<RegenerateAIMessageOutput> {
  return regenerateAIMessageFlow(input);
}

const regenerateAIMessageFlow = ai.defineFlow(
  {
    name: 'regenerateAIMessageFlow',
    inputSchema: RegenerateAIMessageInputSchema,
    outputSchema: RegenerateAIMessageOutputSchema,
  },
  async (input) => {
    const persona = input.userGender === 'male' ? 'magi' : 'jawra';
    const systemPrompt = getPersonaSystemPrompt(persona);
    const historyPrompt = input.chatHistory
      .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    const models = [
      'googleai/gemini-2.5-flash',
      'googleai/gemini-2.0-flash',
      'googleai/gemini-1.5-flash',
    ] as const;

    let lastError: any = null;
    for (let i = 0; i < models.length; i++) {
      try {
        const { text } = await ai.generate({
          model: models[i],
          system: systemPrompt,
          prompt: historyPrompt,
          config: {
            temperature: 0.95,
            safetySettings: [
              {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_NONE',
              },
              {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_NONE',
              },
              {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_NONE',
              },
              {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_NONE',
              },
              {
                category: 'HARM_CATEGORY_CIVIC_INTEGRITY',
                threshold: 'BLOCK_NONE',
              },
            ],
          },
        });

        if (!text) throw new Error('Failed to generate AI message.');
        return text;
      } catch (e: any) {
        lastError = e;
        if (isRetryableGeminiError(e) && i < models.length - 1) {
          await delay(300 + i * 400);
          continue;
        }
        throw e;
      }
    }

    throw lastError ?? new Error('Failed to regenerate AI message.');
  }
);
