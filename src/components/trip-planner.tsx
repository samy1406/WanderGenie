"use client";

import { useState } from "react";
import ItineraryForm from "@/components/itinerary-form";
import ItineraryDisplay from "@/components/itinerary-display";
import type { GeneratePersonalizedItineraryOutput } from "@/ai/flows/generate-personalized-itinerary";
import Image from "next/image";
import { placeholderImages } from "@/lib/placeholder-images.json";

export function TripPlanner() {
  const [itinerary, setItinerary] = useState<GeneratePersonalizedItineraryOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const heroImage = placeholderImages.find(img => img.id === 'hero');

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="flex flex-col justify-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tighter">
            Your Personal AI Trip Planner
          </h1>
          <p className="text-lg text-muted-foreground">
            Just tell us where you're going, for how long, and what you love.
            WanderGenie will craft a unique, day-by-day itinerary just for you.
          </p>
          <ItineraryForm
            setItinerary={setItinerary}
            setIsLoading={setIsLoading}
            setError={setError}
            isLoading={isLoading}
          />
          {error && <p className="text-destructive text-sm mt-2">{error}</p>}
        </div>
        <div>
          {isLoading ? (
            <div className="w-full h-[600px] rounded-lg bg-card flex items-center justify-center shadow-lg">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Generating your adventure...</p>
              </div>
            </div>
          ) : itinerary ? (
            <ItineraryDisplay itineraryData={itinerary} />
          ) : (
            <div className="w-full h-[600px] rounded-lg bg-card overflow-hidden shadow-lg">
               {heroImage && (
                <Image
                  src={heroImage.imageUrl}
                  alt={heroImage.description}
                  width={600}
                  height={600}
                  className="w-full h-full object-cover"
                  data-ai-hint={heroImage.imageHint}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
