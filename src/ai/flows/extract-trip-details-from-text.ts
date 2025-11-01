
'use server';

/**
 * @fileOverview Extracts structured trip details from a user's freeform text input.
 *
 * - extractTripDetailsFromText - A function that parses a string to get trip details.
 * - ExtractTripDetailsFromTextOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractTripDetailsFromTextInputSchema = z.string().describe("The user's freeform text about their desired trip.");

const ExtractTripDetailsFromTextOutputSchema = z.object({
    origin: z.string().optional().describe("The starting point of the journey."),
    destination: z.string().optional().describe("The final destination of the trip."),
    tripDuration: z.number().optional().describe("The total duration of the trip in days."),
    interests: z.string().optional().describe("The user's stated interests for the trip."),
}).describe("The structured details extracted from the user's text.");
export type ExtractTripDetailsFromTextOutput = z.infer<typeof ExtractTripDetailsFromTextOutputSchema>;


export async function extractTripDetailsFromText(input: string): Promise<ExtractTripDetailsFromTextOutput> {
  return extractTripDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractTripDetailsPrompt',
  input: {schema: ExtractTripDetailsFromTextInputSchema},
  output: {schema: ExtractTripDetailsFromTextOutputSchema, format: 'json'},
  prompt: `You are an expert at extracting structured travel information from unstructured text. Analyze the following user request and extract the origin, destination, trip duration in days, and their interests.

If a piece of information is not present, leave the corresponding field null.

User request: "{{prompt}}"

Extract the information and provide it in JSON format.
`, 
});

const extractTripDetailsFlow = ai.defineFlow(
  {
    name: 'extractTripDetailsFlow',
    inputSchema: ExtractTripDetailsFromTextInputSchema,
    outputSchema: ExtractTripDetailsFromTextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
