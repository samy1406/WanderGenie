
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
  startTime: z.string().describe("The suggested start time for the activity (e.g., '10:00 AM')."),
  endTime: z.string().describe("The suggested end time for the activity (e.g., '1:00 PM')."),
  description: z.string().describe("The description of the activity. Specific place names or landmarks should be wrapped in double asterisks (e.g., 'Visit the **Eiffel Tower**')."),
  location: z.string().describe("The specific, geocodable name of the landmark, park, or restaurant (e.g., 'Eiffel Tower, Paris' or 'Central Park, New York'). This is crucial for mapping."),
  link: z.string().url().describe("A plausible Google Maps URL for the activity location."),
  travelInfo: z.string().optional().describe("Brief info on traveling to the next activity, including estimated time (e.g., 'Approx. 20-min taxi ride to the next stop.')."),
});

const DayPlanSchema = z.object({
  day: z.number().describe("The day number of the plan."),
  title: z.string().describe("A creative and short title for the day's activities."),
  morning: z.array(ActivitySchema).describe("Activities planned for the morning (approx. 9 AM - 12 PM)."),
  afternoon: z.array(ActivitySchema).describe("Activities planned for the afternoon (approx. 12 PM - 5 PM)."),
  evening: z.array(ActivitySchema).describe("Activities planned for the evening (approx. 5 PM - 9 PM)."),
  night: z.array(ActivitySchema).describe("Activities for the night (after 9 PM). Can be a simple suggestion like 'Rest at hotel' if nothing else fits."),
});

const EstimatedCostSchema = z.object({
  total: z.number().describe("The estimated total cost of the trip in Indian Rupees (INR)."),
  accommodation: z.number().describe("Estimated cost for accommodation in Indian Rupees (INR)."),
  food: z.number().describe("Estimated cost for food in Indian Rupees (INR)."),
  localTransport: z.number().describe("Estimated cost for local transportation in Indian Rupees (INR)."),
});

const GeneratePersonalizedItineraryInputSchema = z.object({
  destination: z.string().describe('The destination for the trip.'),
  tripDuration: z.number().describe('The duration of the trip in days.'),
  interests: z.string().describe('A description of the user\'s interests for the trip.'),
  travelPreference: z.enum(["budget", "comfort", "speed"]).describe("The user's travel preference."),
  arrivalTime: z.string().optional().describe("The user's preferred arrival time at the destination (e.g., 'morning', 'afternoon', 'evening')."),
  departureTime: z.string().optional().describe("The user's preferred departure time on the last day (e.g., 'morning', 'afternoon', 'evening')."),
});
export type GeneratePersonalizedItineraryInput = z.infer<typeof GeneratePersonalizedItineraryInputSchema>;

const GeneratePersonalizedItineraryOutputSchema = z.object({
  dailyPlan: z.array(DayPlanSchema).describe("A day-by-day itinerary, structured by time of day."),
  thingsToCarry: z.array(z.string()).describe("A list of essential items to carry for the trip."),
  mustDo: z.array(z.string()).describe("A list of must-do activities or must-visit places at the destination. Wrap place names in double asterisks."),
  travelTips: z.string().describe("General travel tips for the destination."),
  estimatedCost: EstimatedCostSchema.describe("An estimated cost breakdown for the trip in Indian Rupees (INR)."),
});
export type GeneratePersonalizedItineraryOutput = z.infer<typeof GeneratePersonalizedItineraryOutputSchema>;

export async function generatePersonalizedItinerary(input: GeneratePersonalizedItineraryInput): Promise<GeneratePersonalizedItineraryOutput> {
  return generatePersonalizedItineraryFlow(input);
}

const generatePersonalizedItineraryPrompt = ai.definePrompt({
  name: 'generatePersonalizedItineraryPrompt',
  input: {schema: GeneratePersonalizedItineraryInputSchema},
  output: {schema: GeneratePersonalizedItineraryOutputSchema, format: 'json'},
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are a travel expert creating a realistic, enjoyable, and well-paced travel itinerary.

**User Requirements:**
- Destination: {{{destination}}}
- Trip Duration: {{{tripDuration}}} days
- Interests: {{{interests}}}
- Travel Preference: {{{travelPreference}}}
- Arrival Time on Day 1: {{#if arrivalTime}} {{{arrivalTime}}} {{else}} Not specified {{/if}}
- Departure Time on Last Day: {{#if departureTime}} {{{departureTime}}} {{else}} Not specified {{/if}}


**Your Task:**
Create a detailed, day-by-day itinerary. Follow these critical instructions:

1.  **Pacing is Key**: Do NOT cram too many activities into one day. A relaxed pace of 2-3 main activities is ideal. People want to enjoy the places, not rush.
2.  **Account for Travel Time**: For each activity, include a 'travelInfo' field estimating the time and mode of travel to the NEXT activity. This is crucial for a realistic plan.
3.  **Structure by Time of Day**: For EVERY day in the trip, you MUST provide well-structured plans for 'morning', 'afternoon', 'evening', and 'night' blocks. Each block must contain an array of activities. If a time block is meant for rest, create a simple activity like 'Rest at the hotel'.
4.  **Smart Day 1 Plan**:
    - The very first activity of the trip must be checking into the accommodation. The description should reflect the travel preference (e.g., 'Check into your budget-friendly hotel').
    - **Crucially, adjust the Day 1 schedule based on the arrival time.**
        - If arrival is 'afternoon' or 'evening', Day 1 should be light: check-in, then maybe a relaxed dinner or a short local walk.
        - If arrival is 'morning', Day 1 can be a fuller day.
5.  **Smart Last Day Plan**:
    - **Crucially, adjust the last day's schedule based on the departure time.**
        - If departure is 'morning', the last day should only include breakfast and travel to the airport/station.
        - If departure is 'afternoon' or 'evening', the morning can include a short activity like souvenir shopping or a final local breakfast before heading to the airport/station.
6.  **Activity Details**: Each activity object MUST have:
    - 'startTime' and 'endTime'.
    - 'description' (wrap landmarks in double asterisks, e.g., **Eiffel Tower**).
    - 'location' (a specific, geocodable name like 'Eiffel Tower, Paris'). This must be a real, findable place for a map.
    - A plausible Google Maps 'link'.
    - 'travelInfo' (unless it's the last activity of the day).
7.  **Costs**: Provide an 'estimatedCost' breakdown (total, accommodation, food, localTransport) in Indian Rupees (INR), reflecting the travel preference.
8.  **Additional Info**: Include 'thingsToCarry', 'mustDo' activities, and 'travelTips'.

Output the entire plan as a single, valid JSON object.
`,
});

const generatePersonalizedItineraryFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedItineraryFlow',
    inputSchema: GeneratePersonalizedItineraryInputSchema,
    outputSchema: GeneratePersonalizedItineraryOutputSchema,
  },
  async input => {
    const {output} = await generatePersonalizedItineraryPrompt(input);
    return output!;
  }
);
