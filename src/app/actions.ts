
"use server";

import { generatePersonalizedItinerary, type GeneratePersonalizedItineraryOutput, type GeneratePersonalizedItineraryInput } from "@/ai/flows/generate-personalized-itinerary";
import { adjustItinerary, type AdjustItineraryOutput, type AdjustItineraryInput } from "@/ai/flows/dynamically-adjust-itinerary";
import { getTravelOptions, type GetTravelOptionsOutput, type GetTravelOptionsInput } from "@/ai/flows/get-travel-options";
import { getCurrentWeather } from "@/ai/tools/weather-tool";
import { extractTripDetailsFromText, type ExtractTripDetailsFromTextOutput } from "@/ai/flows/extract-trip-details-from-text";

type ServerActionResponse<T> = { success: true; data: T } | { success: false; error: string };

export async function handleGenerateItinerary(input: GeneratePersonalizedItineraryInput): Promise<ServerActionResponse<GeneratePersonalizedItineraryOutput>> {
  try {
    const result = await generatePersonalizedItinerary(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error in handleGenerateItinerary:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while generating the itinerary.";
    return { success: false, error: `Failed to generate itinerary. ${errorMessage}` };
  }
}

export async function handleAdjustItinerary(input: AdjustItineraryInput): Promise<ServerActionResponse<AdjustItineraryOutput>> {
    try {
      const result = await adjustItinerary(input);
      return { success: true, data: result };
    } catch (error) {
      console.error("Error in handleAdjustItinerary:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while adjusting the itinerary.";
      return { success: false, error: `Failed to adjust itinerary. ${errorMessage}` };
    }
}

export async function handleGetTravelOptions(input: GetTravelOptionsInput): Promise<ServerActionResponse<GetTravelOptionsOutput>> {
    try {
        const result = await getTravelOptions(input);
        return { success: true, data: result };
    } catch (error) {
        console.error("Error in handleGetTravelOptions:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while getting travel options.";
        return { success: false, error: `Failed to get travel options. ${errorMessage}` };
    }
}

export async function handleGetCurrentWeather(location: string): Promise<ServerActionResponse<{ temperature: string; condition: string; wind: string; }>> {
    try {
        const result = await getCurrentWeather({ location });
        return { success: true, data: result };
    } catch (error)        {
        console.error("Error in handleGetCurrentWeather:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while fetching the weather.";
        return { success: false, error: `Failed to get current weather. ${errorMessage}` };
    }
}

export async function handleExtractTripDetails(text: string): Promise<ServerActionResponse<ExtractTripDetailsFromTextOutput>> {
    try {
        const result = await extractTripDetailsFromText(text);
        return { success: true, data: result };
    } catch (error) {
        console.error("Error in handleExtractTripDetails:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while extracting trip details.";
        return { success: false, error: `Failed to extract trip details. ${errorMessage}` };
    }
}

export async function handleGeocodeLocation(query: string): Promise<any> {
    try {
        if (!query) return null;
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
        );
        if (!response.ok) {
            console.error(`Failed to fetch from Nominatim for "${query}": ${response.statusText}`);
            return null;
        }
        const data = await response.json();
        return data;
    } catch (err: any) {
        console.error(`Error fetching coordinates for "${query}":`, err.message);
        return null;
    }
}


// Mock function to simulate a booking request
export async function handleBookingRequest(bookingDetails: { item: string, details: string }) {
  console.log("Booking request received for:", bookingDetails);
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  // Simulate a successful booking
  const bookingId = `BKNG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  console.log("Booking successful, ID:", bookingId);
  return { success: true, bookingId };
}

// Mock function to simulate a payment request
export async function handlePaymentRequest(paymentDetails: { bookingId: string, cardholderName: string, amount: number }) {
    console.log("Payment request received for:", paymentDetails);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    // Simulate a successful payment
    const transactionId = `TRN-${Math.random().toString(36).substr(2, 12).toUpperCase()}`;
    console.log("Payment successful, Transaction ID:", transactionId);
    return { success: true, transactionId };
}
