"use server";

import { generatePersonalizedItinerary, type GeneratePersonalizedItineraryInput } from "@/ai/flows/generate-personalized-itinerary";
import { adjustItinerary, type AdjustItineraryInput } from "@/ai/flows/dynamically-adjust-itinerary";

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
    } catch (error)      {
      console.error("Error in handleAdjustItinerary:", error);
      throw new Error("Failed to adjust itinerary via server action.");
    }
}
