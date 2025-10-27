"use server";

import { generatePersonalizedItinerary, type GeneratePersonalizedItineraryInput } from "@/ai/flows/generate-personalized-itinerary";
import { adjustItinerary, type AdjustItineraryInput } from "@/ai/flows/dynamically-adjust-itinerary";
import { getTravelOptions, type GetTravelOptionsInput } from "@/ai/flows/get-travel-options";
import { getCurrentWeather } from "@/ai/tools/weather-tool";
import { extractTripDetailsFromText } from "@/ai/flows/extract-trip-details-from-text";


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
    } catch (error)        {
        console.error("Error in handleGetCurrentWeather:", error);
        throw new Error("Failed to get current weather via server action.");
    }
}

export async function handleExtractTripDetails(text: string) {
    try {
        const result = await extractTripDetailsFromText(text);
        return result;
    } catch (error) {
        console.error("Error in handleExtractTripDetails:", error);
        throw new Error("Failed to extract trip details via server action.");
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
export async function handlePaymentRequest(paymentDetails: { bookingId: string, cardholderName: string }) {
    console.log("Payment request received for:", paymentDetails);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    // Simulate a successful payment
    const transactionId = `TRN-${Math.random().toString(36).substr(2, 12).toUpperCase()}`;
    console.log("Payment successful, Transaction ID:", transactionId);
    return { success: true, transactionId };
}