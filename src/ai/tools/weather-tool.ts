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
      wind: z.string(),
    }),
  },
  async ({location}) => {
    // In a real app, you would call a weather API here.
    // For this example, we'll return some mock data.
    const mockWeatherData: { [key: string]: { temperature: string; condition: string; wind: string } } = {
        "New York": { temperature: "72°F", condition: "Sunny", wind: "5 mph" },
        "London": { temperature: "60°F", condition: "Cloudy", wind: "10 mph" },
        "Tokyo": { temperature: "80°F", condition: "Rainy", wind: "15 mph" },
        "Ahmedabad": { temperature: "90°F", condition: "Sunny", wind: "8 mph" },
      };
      const city = location.split(',')[0];
      const data = mockWeatherData[city] || { temperature: "68°F", condition: "Clear", wind: "7 mph" };
      
      return data;
  }
);
