// src/ai/flows/get-travel-options.ts
'use server';

/**
 * @fileOverview Provides travel and hotel options based on user preferences.
 *
 * - getTravelOptions - A function that suggests travel and accommodation options.
 * - GetTravelOptionsInput - The input type for the getTravelOptions function.
 * - GetTravelOptionsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TravelOptionSchema = z.object({
    mode: z.string().describe("The mode of travel (e.g., Flight, Train, Bus)."),
    details: z.string().describe("Specific details like airline or train number."),
    cost: z.string().describe("Estimated cost of the travel option."),
    duration: z.string().describe("Estimated travel time."),
    comfort: z.string().describe("A brief description of the comfort level."),
    bookingLink: z.string().url().describe("A Google search link for booking options."),
});

const HotelOptionSchema = z.object({
    name: z.string().describe("The name of the hotel. This should be wrapped in double asterisks (e.g., '**Grand Hyatt**')."),
    rating: z.number().min(1).max(5).describe("The star rating of the hotel (1-5)."),
    pricePerNight: z.string().describe("The estimated price per night."),
    bookingLink: z.string().url().describe("A Google search link for booking the hotel."),
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
  travelOptions: z.array(TravelOptionSchema).describe("A list of up to 3 suggested travel options for each mode (Flight, Train, Bus)."),
  hotelOptions: z.array(HotelOptionSchema).describe("A list of 3 suggested hotel options at the destination."),
});
export type GetTravelOptionsOutput = z.infer<typeof GetTravelOptionsOutputSchema>;

export async function getTravelOptions(input: GetTravelOptionsInput): Promise<GetTravelOptionsOutput> {
  return getTravelOptionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getTravelOptionsPrompt',
  input: {schema: GetTravelOptionsInputSchema},
  output: {schema: GetTravelOptionsOutputSchema},
  prompt: `You are a travel agent. Based on the user's origin, destination, and travel preferences, provide a comprehensive list of travel and accommodation options.

Origin: {{{origin}}}
Destination: {{{destination}}}
Preference: {{{travelPreference}}}
Preferred Departure Time: {{#if departureTime}} {{{departureTime}}} {{else}} any time {{/if}}
Preferred Arrival Time: {{#if arrivalTime}} {{{arrivalTime}}} {{else}} any time {{/if}}

1.  **Travel Options**: Provide up to three distinct options for each major mode of travel (Flight, Train, Bus), if applicable. Prioritize options based on the user's preference (budget, comfort, or speed). For each option, include the mode, specific details (like a fictional airline or train name), estimated cost, duration, and comfort level. For the 'bookingLink', create a Google search URL to find booking options (e.g., for a flight from New York to London, the URL should be 'https://www.google.com/search?q=flight+from+New+York+to+London').
2.  **Hotel Options**: Provide three distinct hotel suggestions at the destination that align with the user's travel preference. For each hotel, provide its name, star rating (1-5), and estimated price per night. For the 'bookingLink', create a Google search URL for the hotel and destination (e.g., for 'Grand Hyatt' in 'New York', the URL should be 'https://www.google.com/search?q=Grand+Hyatt+New+York'). IMPORTANT: Wrap the hotel name in double asterisks (e.g., "**Grand Hyatt**").

Structure the entire output as a single JSON object.
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
