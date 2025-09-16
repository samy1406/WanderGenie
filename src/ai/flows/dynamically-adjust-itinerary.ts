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
    .describe('The user’s preferences, e.g., interests, budget.'),
});

export type AdjustItineraryInput = z.infer<typeof AdjustItineraryInputSchema>;

const AdjustItineraryOutputSchema = z.object({
  isGoodToGo: z.boolean().describe("Set to true if the original plan is fine, false if an alternative is suggested."),
  suggestion: z
    .string()
    .describe(
      'A suggested alternative activity or a positive message if the plan is good to go.'
    ),
  reason: z
    .string()
    .describe(
      'A brief explanation for the suggestion or reassurance.'
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
  prompt: `The user's current plan is "{{currentPlan}}" in {{location}}. The weather is currently {{weather}}. The user's preferences are for "{{userPreferences}}".

Analyze the situation. 
1. If the current weather poses a clear problem for the activity (e.g., rain for an outdoor picnic), suggest a specific, creative, and suitable alternative activity. Avoid generic suggestions. Provide a compelling reason. Set 'isGoodToGo' to false.
2. If the weather is suitable for the current plan, respond with a positive and encouraging message confirming that it's a great day for their planned activity. Set 'isGoodToGo' to true.

Do not repeat the original plan in your suggestion if you provide an alternative.
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
