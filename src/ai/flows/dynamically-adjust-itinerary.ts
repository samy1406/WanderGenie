// This file is machine-generated - edit at your own risk.

'use server';

/**
 * @fileOverview AI flow to dynamically adjust the itinerary based on real-time conditions.
 *
 * - adjustItinerary - A function that takes the current plan, location, and weather conditions to suggest alternative activities.
 * - AdjustItineraryInput - The input type for the adjustItinerary function.
 * - AdjustItineraryOutput - The return type for the adjustItinerary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdjustItineraryInputSchema = z.object({
  currentPlan: z
    .string()
    .describe('The current itinerary plan that might be disrupted.'),
  location: z.string().describe('The current location of the user.'),
  weather: z
    .string()
    .describe('The current weather conditions at the location.'),
  userPreferences: z
    .string()
    .optional()
    .describe('The user\u2019s preferences, e.g., interests, budget.'),
});

export type AdjustItineraryInput = z.infer<typeof AdjustItineraryInputSchema>;

const AdjustItineraryOutputSchema = z.object({
  alternativeSuggestion: z
    .string()
    .describe(
      'A suggested alternative activity based on the weather and user preferences.'
    ),
  reason: z
    .string()
    .describe(
      'A brief explanation of why the alternative activity is suitable.'
    ),
});

export type AdjustItineraryOutput = z.infer<typeof AdjustItineraryOutputSchema>;

export async function adjustItinerary(
  input: AdjustItineraryInput
): Promise<AdjustItineraryOutput> {
  return adjustItineraryFlow(input);
}

const adjustItineraryPrompt = ai.definePrompt({
  name: 'adjustItineraryPrompt',
  input: {schema: AdjustItineraryInputSchema},
  output: {schema: AdjustItineraryOutputSchema},
  prompt: `Given the user's current plan: {{{currentPlan}}}, current location: {{{location}}}, weather conditions: {{{weather}}}, and preferences: {{{userPreferences}}}, suggest an alternative indoor activity nearby and a reason for the suggestion. The alternative must be suitable, culturally interesting, and located nearby.

Output the result in JSON format.
`,
});

const adjustItineraryFlow = ai.defineFlow(
  {
    name: 'adjustItineraryFlow',
    inputSchema: AdjustItineraryInputSchema,
    outputSchema: AdjustItineraryOutputSchema,
  },
  async input => {
    const {output} = await adjustItineraryPrompt(input);
    return output!;
  }
);
