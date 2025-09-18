"use server";

import { generatePersonalizedItinerary, type GeneratePersonalizedItineraryInput } from "@/ai/flows/generate-personalized-itinerary";
import { adjustItinerary, type AdjustItineraryInput } from "@/ai/flows/dynamically-adjust-itinerary";
import { getTravelOptions, type GetTravelOptionsInput } from "@/ai/flows/get-travel-options";
import { getCurrentWeather } from "@/ai/tools/weather-tool";

export async function handleGenerateItinerary(input: GeneratePersonalizedItineraryInput) {
  try {
    const result = await generatePersonalizedItinerary(input);
    return result;
  } catch (error) {
    console.error("Error in handleGenerateItinerary:", error);
    throw new Error("Failed to generate itinerary via server action.");
  }
}

export async function handleAdjustItinerary(input: AdjustItineraryInput) {
    try {
      const result = await adjustItinerary(input);
      return result;
    } catch (error) {
      console.error("Error in handleAdjustItinerary:", error);
      throw new Error("Failed to adjust itinerary via server action.");
    }
}

export async function handleGetTravelOptions(input: GetTravelOptionsInput) {
    try {
        const result = await getTravelOptions(input);
        return result;
    } catch (error) {
        console.error("Error in handleGetTravelOptions:", error);
        throw new Error("Failed to get travel options via server action.");
    }
}

export async function handleGetCurrentWeather(location: string) {
    try {
        const result = await getCurrentWeather({ location });
        return result;
    } catch (error) {
        console.error("Error in handleGetCurrentWeather:", error);
        throw new Error("Failed to get current weather via server action.");
    }
}