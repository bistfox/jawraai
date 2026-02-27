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
import { getJawraAISystemPrompt } from '../prompts';

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
    const mappedGender = input.userGender === 'male' ? 'Male' : 'Female';
    const systemPrompt = getJawraAISystemPrompt(mappedGender);

    const { text } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      system: systemPrompt,
      messages: input.chatHistory,
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

    if (!text) {
      throw new Error('Failed to generate AI message.');
    }

    return text;
  }
);
