
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
    cost: z.number().describe("Estimated cost of the travel option in Indian Rupees (INR)."),
    duration: z.string().describe("Estimated travel time."),
    comfort: z.string().describe("A brief description of the comfort level."),
    bookingLink: z.string().url().describe("A Google search link for booking options."),
});

const HotelOptionSchema = z.object({
    name: z.string().describe("The name of the hotel. This should be a real, findable hotel and wrapped in double asterisks (e.g., '**Grand Hyatt**')."),
    rating: z.number().min(1).max(5).describe("The star rating of the hotel (1-5)."),
    pricePerNight: z.number().describe("The estimated price per night in Indian Rupees (INR)."),
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
  output: {schema: GetTravelOptionsOutputSchema, format: 'json'},
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are a travel agent. Based on the user's origin, destination, and travel preferences, provide a comprehensive list of travel and accommodation options.

Origin: {{{origin}}}
Destination: {{{destination}}}
Preference: {{{travelPreference}}}
Preferred Departure Time: {{#if departureTime}} {{{departureTime}}} {{else}} any time {{/if}}
Preferred Arrival Time: {{#if arrivalTime}} {{{arrivalTime}}} {{else}} any time {{/if}}

1.  **Travel Options**: Provide up to three distinct and realistic options for each feasible mode of travel (Flight, Train, Bus). Prioritize options based on the user's preference (budget, comfort, or speed) AND their preferred departure/arrival times if specified. For each option, include the mode, specific details (like a fictional airline or train name), estimated cost, duration, and comfort level. ALL COSTS MUST BE NUMBERS representing Indian Rupees (INR). For the 'bookingLink', create a specific Google search URL.
    - For **Flights**, create a Google Flights search URL. Example: 'https://www.google.com/travel/flights?q=Flights+from+{{{origin}}}+to+{{{destination}}}'.
    - For **Trains**, create a detailed Google search query including the train details. Example for a 'Vistara Express' train: 'https://www.google.com/search?q=Vistara+Express+train+from+{{{origin}}}+to+{{{destination}}}'.
    - For **Buses**, create a detailed Google search query including the bus line. Example for a 'Red Bus' line: 'https://www.google.com/search?q=Red+Bus+from+{{{origin}}}+to+{{{destination}}}'.
    - If the origin and destination are in different countries and far apart, suggest only 'Flight' as a travel mode.
    - For a 'budget' preference, you MUST include 'Train' and 'Bus' options if the route is feasible.

2.  **Hotel Options**: Provide three distinct hotel suggestions at the destination that align with the user's travel preference. For each hotel, provide its name, star rating (1-5), and estimated price per night. The hotel name must be a real, well-known hotel that can be easily found on a map. ALL COSTS MUST BE NUMBERS representing Indian Rupees (INR). For the 'bookingLink', create a specific Google search URL for that hotel in the destination city. Example for 'Grand Hyatt' in '{{{destination}}}': 'https://www.google.com/search?q=Grand+Hyatt+{{{destination}}}'. IMPORTANT: Wrap the hotel name in double asterisks (e.g., "**Grand Hyatt**").

Structure the entire output as a single JSON object. If a travel mode is not feasible, do not include any options for it in the 'travelOptions' array.
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
