"use server";
/**
 * @fileOverview A tool for fetching the latest news for a location.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { useToast } from '@/hooks/use-toast';

export const getNewsForLocation = ai.defineTool(
  {
    name: 'getNewsForLocation',
    description: 'Get the latest news headline for a given location',
    inputSchema: z.object({
      location: z.string().describe('The city and state, e.g. San Francisco, CA'),
    }),
    outputSchema: z.object({
      headline: z.string(),
    }),
  },
  async ({ location }) => {
    // In a real app, you would call a News API here using process.env.NEWS_API_KEY
    // For this example, we'll return some mock data.
    console.log(`Fetching news for: ${location}`);

    const mockNews: { [key: string]: { headline: string } } = {
      "New York": { headline: "Massive parade planned for downtown, expect traffic delays." },
      "London": { headline: "New art exhibition opens at the Tate Modern." },
      "Tokyo": { headline: "Famous market to have a special festival this weekend." },
      "Ahmedabad": { headline: "Riverfront park announces a new series of cultural events." },
    };
    
    const city = location.split(',')[0];
    const data = mockNews[city] || { headline: `No special news for ${city} today. Enjoy your trip!` };
    
    return data;
  }
);
