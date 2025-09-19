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

const DayPlanSchema = z.object({
  day: z.number().describe("The day number of the plan."),
  title: z.string().describe("A creative and short title for the day's activities."),
  activities: z.array(z.string()).describe("A bulleted list of activities for the day, including morning, afternoon, and evening."),
});

const EstimatedCostSchema = z.object({
  total: z.string().describe("The estimated total cost of the trip in INR, formatted with the ₹ symbol."),
  accommodation: z.string().describe("Estimated cost for accommodation in INR."),
  food: z.string().describe("Estimated cost for food in INR."),
  localTransport: z.string().describe("Estimated cost for local transportation in INR."),
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
  mustDo: z.array(z.string()).describe("A list of must-do activities or must-visit places at the destination."),
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

Provide a detailed itinerary. For each day's activities, provide a bulleted list of things to do.
Also include a list of "things to carry", "must-do" activities, and general "travel tips".
Finally, provide an "estimatedCost" breakdown for the trip in INR, including total, accommodation, food, and localTransport. The costs should reflect the user's travel preference. All costs must be in INR and include the '₹' symbol.

Structure the output as a JSON object with the fields: dailyPlan, thingsToCarry, mustDo, travelTips, and estimatedCost.
The dailyPlan should be an array of objects, each with a day number, title, and an 'activities' array of strings.
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
