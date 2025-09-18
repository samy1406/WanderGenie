// src/ai/flows/get-travel-options.ts
'use server';

/**
 * @fileOverview Provides travel options based on user preferences.
 *
 * - getTravelOptions - A function that suggests travel options.
 * - GetTravelOptionsInput - The input type for the getTravelOptions function.
 * - GetTravelOptionsOutput - The return type for the getTravelOptions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TravelOptionSchema = z.object({
    mode: z.string().describe("The mode of travel (e.g., Flight, Train, Bus)."),
    details: z.string().describe("Specific details like airline or train number."),
    cost: z.string().describe("Estimated cost of the travel option."),
    duration: z.string().describe("Estimated travel time."),
    comfort: z.string().describe("A brief description of the comfort level."),
    bookingLink: z.string().describe("A placeholder link for booking."),
});

const GetTravelOptionsInputSchema = z.object({
  origin: z.string().describe("The starting point of the journey."),
  destination: z.string().describe("The destination of the trip."),
  travelPreference: z.enum(["budget", "comfort", "speed"]).describe("The user's travel preference."),
  departureTime: z.string().optional().describe("The user's preferred departure time (e.g., 'morning', 'afternoon', 'evening')."),
  arrivalTime: z.string().optional().describe("The user's preferred arrival time (e.g., 'morning', 'afternoon', 'evening')."),
});
export type GetTravelOptionsInput = z.infer<typeof GetTravelOptionsInputSchema>;

const GetTravelOptionsOutputSchema = z.object({
  travelOptions: z.array(TravelOptionSchema).describe("A list of suggested travel options."),
});
export type GetTravelOptionsOutput = z.infer<typeof GetTravelOptionsOutputSchema>;

export async function getTravelOptions(input: GetTravelOptionsInput): Promise<GetTravelOptionsOutput> {
  return getTravelOptionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getTravelOptionsPrompt',
  input: {schema: GetTravelOptionsInputSchema},
  output: {schema: GetTravelOptionsOutputSchema},
  prompt: `You are a travel agent. Based on the user's origin, destination, and travel preferences, provide three distinct travel options (e.g., one flight, one train, one bus if applicable). 

Origin: {{{origin}}}
Destination: {{{destination}}}
Preference: {{{travelPreference}}}
Preferred Departure Time: {{#if departureTime}} {{{departureTime}}} {{else}} any time {{/if}}
Preferred Arrival Time: {{#if arrivalTime}} {{{arrivalTime}}} {{else}} any time {{/if}}

For each option, provide the mode of travel, specific details (like a fictional airline or train name), an estimated cost, travel duration, a comfort level description, and a placeholder booking link (e.g., 'https://example.com/book').
`,
});

const getTravelOptionsFlow = ai.defineFlow(
  {
    name: 'getTravelOptionsFlow',
    inputSchema: GetTravelOptionsInputSchema,
    outputSchema: GetTravelOptionsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
