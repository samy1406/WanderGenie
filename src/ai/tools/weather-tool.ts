// src/ai/tools/weather-tool.ts
'use server';
/**
 * @fileOverview A tool for fetching the current weather.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const getCurrentWeather = ai.defineTool(
  {
    name: 'getCurrentWeather',
    description: 'Get the current weather in a given location',
    inputSchema: z.object({
      location: z.string().describe('The city and state, e.g. San Francisco, CA'),
    }),
    outputSchema: z.object({
      temperature: z.string(),
      condition: z.string(),
    }),
  },
  async ({location}) => {
    // In a real app, you would call a weather API here.
    // For this example, we'll return some mock data.
    const mockWeatherData = {
        "New York": { temperature: "72°F", condition: "Sunny" },
        "London": { temperature: "60°F", condition: "Cloudy" },
        "Tokyo": { temperature: "80°F", condition: "Rainy" },
        "Ahmedabad": { temperature: "90°F", condition: "Sunny" },
      };
      const city = location.split(',')[0];
      const data = mockWeatherData[city as keyof typeof mockWeatherData] || { temperature: "68°F", condition: "Clear" };
      
      return data;
  }
);
