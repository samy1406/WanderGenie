
// src/ai/flows/generate-personalized-itinerary.ts
'use server';

/**
 * @fileOverview Generates a personalized, day-by-day travel itinerary using AI based on user input.
 *
 * - generatePersonalizedItinerary - A function that generates a personalized travel itinerary.
 * - GeneratePersonalizedItineraryInput - The input type for the generatePersonalizedItinerary function.
 * - GeneratePersonalizedItineraryOutput - The return type for the generatePersonalizedItinerary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ActivitySchema = z.object({
  description: z.string().describe("The description of the activity. Specific place names or landmarks should be wrapped in double asterisks (e.g., 'Visit the **Eiffel Tower**')."),
  location: z.string().describe("The specific name of the landmark, park, or restaurant for geocoding (e.g., 'Eiffel Tower, Paris' or 'Central Park, New York')."),
  link: z.string().url().describe("A plausible Google Maps URL for the activity location."),
});

const DayPlanSchema = z.object({
  day: z.number().describe("The day number of the plan."),
  title: z.string().describe("A creative and short title for the day's activities."),
  activities: z.array(ActivitySchema).describe("A list of activities for the day, each with a description and a link."),
});

const EstimatedCostSchema = z.object({
  total: z.string().describe("The estimated total cost of the trip."),
  accommodation: z.string().describe("Estimated cost for accommodation."),
  food: z.string().describe("Estimated cost for food."),
  localTransport: z.string().describe("Estimated cost for local transportation."),
});

const GeneratePersonalizedItineraryInputSchema = z.object({
  destination: z.string().describe('The destination for the trip.'),
  tripDuration: z.number().describe('The duration of the trip in days.'),
  interests: z.string().describe('A description of the user\'s interests for the trip.'),
  travelPreference: z.enum(["budget", "comfort", "speed"]).describe("The user's travel preference."),
});
export type GeneratePersonalizedItineraryInput = z.infer<typeof GeneratePersonalizedItineraryInputSchema>;

const GeneratePersonalizedItineraryOutputSchema = z.object({
  dailyPlan: z.array(DayPlanSchema).describe("A day-by-day itinerary."),
  thingsToCarry: z.array(z.string()).describe("A list of essential items to carry for the trip."),
  mustDo: z.array(z.string()).describe("A list of must-do activities or must-visit places at the destination. Wrap place names in double asterisks."),
  travelTips: z.string().describe("General travel tips for the destination."),
  estimatedCost: EstimatedCostSchema.describe("An estimated cost breakdown for the trip."),
});
export type GeneratePersonalizedItineraryOutput = z.infer<typeof GeneratePersonalizedItineraryOutputSchema>;

export async function generatePersonalizedItinerary(input: GeneratePersonalizedItineraryInput): Promise<GeneratePersonalizedItineraryOutput> {
  return generatePersonalizedItineraryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePersonalizedItineraryPrompt',
  input: {schema: GeneratePersonalizedItineraryInputSchema},
  output: {schema: GeneratePersonalizedItineraryOutputSchema},
  prompt: `You are a travel expert. Generate a personalized, day-by-day travel itinerary based on the following information:

Destination: {{{destination}}}
Trip Duration: {{{tripDuration}}} days
Interests: {{{interests}}}
Travel Preference: {{{travelPreference}}}

Provide a detailed itinerary.
For the very first activity on Day 1, create a generic "Check into your accommodation" activity, using the user's travel preference in the description (e.g., 'Check into your budget-friendly accommodation'). For its location, just use the destination city name.

For all other activities, you MUST provide a description, a specific 'location' string for geocoding (like 'Eiffel Tower, Paris'), and a plausible Google Maps link (e.g., https://maps.google.com/?q=...).
Also include a list of "things to carry", "must-do" activities, and general "travel tips".
Finally, provide an "estimatedCost" breakdown for the trip, including total, accommodation, food, and localTransport. The costs should reflect the user's travel preference.

IMPORTANT: In the activity descriptions and must-do list, wrap any specific place names or landmarks in double asterisks to mark them as bold (e.g., 'Visit the **Eiffel Tower**' or '**Golden Gate Bridge**').

Structure the output as a JSON object.
The dailyPlan should be an array of objects, each with a day number, title, and an 'activities' array of objects. Each activity object must have a 'description', a 'location', and a 'link'.
`, 
});

const generatePersonalizedItineraryFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedItineraryFlow',
    inputSchema: GeneratePersonalizedItineraryInputSchema,
    outputSchema: GeneratePersonalizedItineraryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);



